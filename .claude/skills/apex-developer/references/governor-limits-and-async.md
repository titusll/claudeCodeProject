# Governor Limits and Asynchronous Apex Reference

## Governor Limits Overview

Salesforce enforces per-transaction limits to ensure no single execution monopolises shared resources. Understanding these limits is fundamental to writing Apex that scales.

### Key Synchronous Limits

| Limit | Synchronous Value | Async Value | What It Means |
|---|---|---|---|
| SOQL queries | 100 | 200 | Total queries in a transaction |
| SOQL rows returned | 50,000 | 50,000 | Total rows across all queries |
| DML statements | 150 | 150 | Total insert/update/delete/undelete operations |
| DML rows processed | 10,000 | 10,000 | Total records across all DML |
| CPU time | 10,000 ms | 60,000 ms | Apex execution time |
| Heap size | 6 MB | 12 MB | Memory for variables and objects |
| Callouts | 100 | 100 | HTTP/web service calls |
| Callout timeout | 120 seconds | 120 seconds | Per-callout timeout |
| Future calls | 50 | 0 (cannot chain) | @future method invocations |
| Queueable jobs | 50 | 1 (can chain 1) | System.enqueueJob calls |
| Email invocations | 10 | 10 | Messaging.sendEmail calls |
| SOQL query length | 20,000 chars | 20,000 chars | Length of a single query string |

### Checking Limits at Runtime

```java
System.debug('SOQL queries used: ' + Limits.getQueries() + ' / ' + Limits.getLimitQueries());
System.debug('DML statements used: ' + Limits.getDmlStatements() + ' / ' + Limits.getLimitDmlStatements());
System.debug('CPU time used: ' + Limits.getCpuTime() + 'ms / ' + Limits.getLimitCpuTime() + 'ms');
System.debug('Heap size used: ' + Limits.getHeapSize() + ' / ' + Limits.getLimitHeapSize());
```

Use `Limits` methods to log usage in development/debugging — do not use them as control flow in production code (e.g., don't write `if (Limits.getQueries() < 100) { query(); }`).

---

## Bulkification Patterns

Bulkification means writing code that processes collections of records efficiently rather than handling one record at a time. The core rules:

### 1. Collect, Query, Process

```java
public static void enrichAccounts(List<Account> accounts) {
    // Step 1: Collect all the IDs you need
    Set<Id> ownerIds = new Set<Id>();
    for (Account acc : accounts) {
        ownerIds.add(acc.OwnerId);
    }

    // Step 2: Query once outside the loop
    Map<Id, User> ownerMap = new Map<Id, User>(
        [SELECT Id, Name, Email, Department FROM User WHERE Id IN :ownerIds]
    );

    // Step 3: Process using the map
    for (Account acc : accounts) {
        User owner = ownerMap.get(acc.OwnerId);
        if (owner != null) {
            acc.Owner_Department__c = owner.Department;
        }
    }
}
```

### 2. Batch DML Operations

```java
public static void processOpportunities(List<Opportunity> opportunities) {
    List<Task> tasksToInsert = new List<Task>();
    List<Opportunity> oppsToUpdate = new List<Opportunity>();

    for (Opportunity opp : opportunities) {
        if (opp.StageName == 'Closed Won') {
            tasksToInsert.add(new Task(
                WhatId = opp.Id,
                Subject = 'Follow up on closed deal',
                OwnerId = opp.OwnerId,
                ActivityDate = Date.today().addDays(7)
            ));
            opp.Follow_Up_Created__c = true;
            oppsToUpdate.add(opp);
        }
    }

    if (!tasksToInsert.isEmpty()) {
        insert tasksToInsert;
    }
    if (!oppsToUpdate.isEmpty()) {
        update oppsToUpdate;
    }
}
```

### 3. Use Maps for Cross-Object Lookups

```java
public static void assignTerritories(List<Account> accounts) {
    // Collect unique values to look up
    Set<String> postalCodes = new Set<String>();
    for (Account acc : accounts) {
        if (acc.BillingPostalCode != null) {
            postalCodes.add(acc.BillingPostalCode);
        }
    }

    // Single query, indexed by the lookup value
    Map<String, Territory__c> territoryByPostalCode = new Map<String, Territory__c>();
    for (Territory__c t : [
        SELECT Id, Name, Postal_Code__c
        FROM Territory__c
        WHERE Postal_Code__c IN :postalCodes
    ]) {
        territoryByPostalCode.put(t.Postal_Code__c, t);
    }

    // Assign using the map
    for (Account acc : accounts) {
        Territory__c territory = territoryByPostalCode.get(acc.BillingPostalCode);
        if (territory != null) {
            acc.Territory__c = territory.Id;
        }
    }
}
```

---

## @future Methods

`@future` methods run asynchronously in a separate transaction with higher governor limits. Use them for operations that don't need to return a result to the caller.

```java
public with sharing class AccountService {

    @future
    public static void updateExternalSystem(Set<Id> accountIds) {
        List<Account> accounts = [
            SELECT Id, Name, External_Id__c
            FROM Account
            WHERE Id IN :accountIds
        ];
        for (Account acc : accounts) {
            // Perform callout or heavy processing
            acc.Last_Sync__c = DateTime.now();
        }
        update accounts;
    }

    @future(callout=true)
    public static void syncToExternalApi(Set<Id> accountIds) {
        List<Account> accounts = [SELECT Id, Name FROM Account WHERE Id IN :accountIds];
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:ExternalAPI/accounts');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setBody(JSON.serialize(accounts));

        Http http = new Http();
        HttpResponse res = http.send(req);
        if (res.getStatusCode() != 200) {
            System.debug(LoggingLevel.ERROR, 'Sync failed: ' + res.getBody());
        }
    }
}
```

**@future rules:**
- Parameters must be primitives or collections of primitives (no sObjects). Pass IDs and re-query inside the method.
- Cannot call another `@future` method from a `@future` method.
- Cannot be used in batch Apex `execute()`.
- Maximum 50 `@future` calls per synchronous transaction.
- No guaranteed execution order or timing.
- Use `callout=true` to enable HTTP callouts.

---

## Batch Apex

Batch Apex processes large volumes of data by breaking them into chunks (default 200 records each). Implement `Database.Batchable<SObject>`:

```java
public class AccountCleanupBatch implements Database.Batchable<SObject>, Database.Stateful {

    // Instance variable survives between execute() calls because of Database.Stateful
    private Integer totalProcessed = 0;
    private List<String> errors = new List<String>();

    // Step 1: Define the query
    public Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator([
            SELECT Id, Name, Last_Activity__c
            FROM Account
            WHERE Last_Activity__c < :Date.today().addYears(-2)
            AND IsActive__c = false
        ]);
    }

    // Step 2: Process each batch (default 200 records)
    public void execute(Database.BatchableContext bc, List<Account> scope) {
        List<Database.DeleteResult> results = Database.delete(scope, false);
        for (Integer i = 0; i < results.size(); i++) {
            if (results[i].isSuccess()) {
                totalProcessed++;
            } else {
                for (Database.Error err : results[i].getErrors()) {
                    errors.add(scope[i].Name + ': ' + err.getMessage());
                }
            }
        }
    }

    // Step 3: Post-processing after all batches complete
    public void finish(Database.BatchableContext bc) {
        Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
        email.setToAddresses(new List<String>{ 'admin@example.com' });
        email.setSubject('Account Cleanup Batch Complete');
        email.setPlainTextBody(
            'Processed: ' + totalProcessed + '\n' +
            'Errors: ' + errors.size() + '\n' +
            String.join(errors, '\n')
        );
        Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ email });
    }
}
```

### Running a Batch

```java
// Default scope size (200)
Id jobId = Database.executeBatch(new AccountCleanupBatch());

// Custom scope size — use smaller values for complex processing or callouts
Id jobId = Database.executeBatch(new AccountCleanupBatch(), 50);
```

### Batch with Callouts

Add the `Database.AllowsCallouts` interface:

```java
public class ExternalSyncBatch implements Database.Batchable<SObject>, Database.AllowsCallouts {

    public Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator([SELECT Id, Name FROM Account WHERE Needs_Sync__c = true]);
    }

    public void execute(Database.BatchableContext bc, List<Account> scope) {
        for (Account acc : scope) {
            HttpRequest req = new HttpRequest();
            req.setEndpoint('callout:ExternalAPI/accounts/' + acc.Id);
            req.setMethod('PUT');
            req.setBody(JSON.serialize(acc));

            Http http = new Http();
            HttpResponse res = http.send(req);
            if (res.getStatusCode() == 200) {
                acc.Needs_Sync__c = false;
                acc.Last_Sync__c = DateTime.now();
            }
        }
        update scope;
    }

    public void finish(Database.BatchableContext bc) {
        System.debug('Sync batch complete');
    }
}
```

**Batch rules:**
- `start()` runs once — returns a `Database.QueryLocator` (up to 50 million rows) or an `Iterable`.
- `execute()` runs once per batch of records. Each `execute()` is a separate transaction with fresh limits.
- `finish()` runs once after all batches complete.
- `Database.Stateful` — instance variables persist between `execute()` calls. Without it, they reset each time.
- Only 5 batch jobs can run concurrently per org.
- Use a scope size of 1-10 for callout-heavy batches (max 100 callouts per `execute()`).

---

## Queueable Apex

Queueable provides more flexibility than `@future` — supports non-primitive parameters, job chaining, and monitoring:

```java
public class ContactRollupQueueable implements Queueable {

    private Set<Id> accountIds;

    public ContactRollupQueueable(Set<Id> accountIds) {
        this.accountIds = accountIds;
    }

    public void execute(QueueableContext ctx) {
        // Heavy processing with async limits
        List<Account> accounts = [
            SELECT Id, (SELECT Id FROM Contacts)
            FROM Account
            WHERE Id IN :accountIds
        ];

        for (Account acc : accounts) {
            acc.Contact_Count__c = acc.Contacts.size();
        }
        update accounts;

        // Optional: chain another queueable job
        // (Max 1 chained job from a queueable context)
        if (!remainingAccountIds.isEmpty()) {
            System.enqueueJob(new ContactRollupQueueable(remainingAccountIds));
        }
    }
}
```

### Enqueuing

```java
Set<Id> accountIds = new Set<Id>{ '001XXXXXXXXXXXX' };
Id jobId = System.enqueueJob(new ContactRollupQueueable(accountIds));
```

### Queueable with Callouts

```java
public class ApiSyncQueueable implements Queueable, Database.AllowsCallouts {

    private List<Account> accounts;

    public ApiSyncQueueable(List<Account> accounts) {
        this.accounts = accounts;
    }

    public void execute(QueueableContext ctx) {
        Http http = new Http();
        for (Account acc : accounts) {
            HttpRequest req = new HttpRequest();
            req.setEndpoint('callout:ExternalAPI/sync');
            req.setMethod('POST');
            req.setBody(JSON.serialize(acc));
            HttpResponse res = http.send(req);

            if (res.getStatusCode() != 200) {
                System.debug(LoggingLevel.ERROR, 'Sync failed for ' + acc.Id);
            }
        }
    }
}
```

**Queueable vs @future:**

| Feature | @future | Queueable |
|---|---|---|
| Parameters | Primitives only | Any serialisable type |
| Chaining | Not allowed | 1 chained job per execution |
| Monitoring | No job ID | Returns job ID |
| Callouts | `callout=true` | `Database.AllowsCallouts` |
| Testing | Executes at `Test.stopTest()` | Executes at `Test.stopTest()` |
| Limit per transaction | 50 | 50 (synchronous), 1 (from async) |

**Prefer Queueable** over `@future` for new code — it is more flexible and easier to test.

---

## Schedulable Apex

Schedule a class to run at specific times using a cron expression:

```java
public class DailyCleanupScheduler implements Schedulable {

    public void execute(SchedulableContext ctx) {
        // Option 1: Run a batch job
        Database.executeBatch(new AccountCleanupBatch(), 200);

        // Option 2: Do lightweight processing directly
        // (Keep it fast — schedulable runs in a synchronous context)
    }
}
```

### Scheduling via Apex

```java
// Run daily at 1 AM
String cronExpression = '0 0 1 * * ?';
Id jobId = System.schedule('Daily Account Cleanup', cronExpression, new DailyCleanupScheduler());
```

### Common Cron Expressions

| Schedule | Expression |
|---|---|
| Every day at midnight | `0 0 0 * * ?` |
| Every day at 1:30 AM | `0 30 1 * * ?` |
| Every Monday at 8 AM | `0 0 8 ? * MON` |
| First day of each month at midnight | `0 0 0 1 * ?` |
| Every hour | `0 0 * * * ?` |
| Every 15 minutes (approximate — schedule 4 jobs) | `0 0 * * * ?`, `0 15 * * * ?`, `0 30 * * * ?`, `0 45 * * * ?` |

**Cron format**: `Seconds Minutes Hours Day_of_month Month Day_of_week [Year]`

**Schedulable rules:**
- Maximum 100 scheduled Apex jobs per org.
- The `execute()` method runs synchronously — heavy processing should be delegated to a batch or queueable job.
- Cannot use `@future` from a schedulable — use `System.enqueueJob()` instead.

---

## Platform Events

Platform Events enable event-driven architecture — publish events from triggers or processes and subscribe from Apex, flows, or external systems:

### Defining a Platform Event

Create a Platform Event in Setup or as metadata: `force-app/main/default/objects/Order_Event__e/`

### Publishing Events

```java
public class OrderEventPublisher {

    public static void publishOrderCompleted(List<Order__c> orders) {
        List<Order_Event__e> events = new List<Order_Event__e>();
        for (Order__c order : orders) {
            events.add(new Order_Event__e(
                Order_Id__c = order.Id,
                Status__c = order.Status__c,
                Amount__c = order.Total_Amount__c
            ));
        }

        List<Database.SaveResult> results = EventBus.publish(events);
        for (Database.SaveResult sr : results) {
            if (!sr.isSuccess()) {
                for (Database.Error err : sr.getErrors()) {
                    System.debug(LoggingLevel.ERROR, 'Event publish failed: ' + err.getMessage());
                }
            }
        }
    }
}
```

### Subscribing to Events (Apex Trigger)

```java
trigger OrderEventTrigger on Order_Event__e (after insert) {
    List<Task> tasks = new List<Task>();
    for (Order_Event__e event : Trigger.new) {
        tasks.add(new Task(
            Subject = 'Process completed order',
            WhatId = event.Order_Id__c,
            ActivityDate = Date.today()
        ));
    }
    insert tasks;
}
```

**Platform Event rules:**
- Events are published immediately (not rolled back with the transaction).
- Subscribers run in a separate transaction.
- Use `EventBus.publish()` instead of `insert` for platform events.
- Triggers on platform events only support `after insert`.
- Set `ReplayId` for reliable event replay and error recovery.

---

## Choosing the Right Async Pattern

| Scenario | Recommended Approach | Why |
|---|---|---|
| Simple callout from a trigger | `@future(callout=true)` | Lightweight, no setup needed |
| Complex processing with sObject params | Queueable | Supports complex parameters |
| Sequential multi-step processing | Queueable chaining | Each step chains the next |
| Processing millions of records | Batch Apex | Handles up to 50M records |
| Recurring scheduled work | Schedulable + Batch | Schedulable kicks off the batch |
| Event-driven decoupled processing | Platform Events | Subscribers handle events independently |
| Mixing callouts with DML in a trigger | Queueable with `AllowsCallouts` | Separates callout from trigger transaction |
