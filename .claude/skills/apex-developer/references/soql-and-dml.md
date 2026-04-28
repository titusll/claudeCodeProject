# SOQL and DML Reference

## SOQL Basics

SOQL (Salesforce Object Query Language) retrieves records from the database. Unlike SQL, SOQL does not support `SELECT *` — you must name every field you need.

```java
List<Account> accounts = [
    SELECT Id, Name, Industry, AnnualRevenue
    FROM Account
    WHERE Industry = 'Technology'
    AND AnnualRevenue > 1000000
    ORDER BY Name ASC
    LIMIT 100
];
```

### Bind Variables

Use Apex variables in queries with the `:variable` syntax. This prevents SOQL injection:

```java
String industry = 'Technology';
Decimal minRevenue = 1000000;
Set<Id> accountIds = new Set<Id>{ '001XXXXXXXXXXXXXXX', '001YYYYYYYYYYYYYYY' };

List<Account> accounts = [
    SELECT Id, Name
    FROM Account
    WHERE Industry = :industry
    AND AnnualRevenue > :minRevenue
    AND Id IN :accountIds
];
```

**Always use bind variables** instead of string concatenation. String concatenation opens the door to SOQL injection.

---

## Relationship Queries

### Child-to-Parent (Dot Notation)

Access parent fields using dot notation through lookup/master-detail relationships:

```java
List<Contact> contacts = [
    SELECT Id, Name, Email,
           Account.Name, Account.Industry,
           Account.Owner.Name
    FROM Contact
    WHERE Account.Industry = 'Technology'
];

// Access the parent field
for (Contact con : contacts) {
    String accountName = con.Account.Name;
    String ownerName = con.Account.Owner.Name;
}
```

### Parent-to-Child (Subquery)

Use the child relationship name (pluralised, check the relationship name on the field definition):

```java
List<Account> accounts = [
    SELECT Id, Name,
        (SELECT Id, Name, Email FROM Contacts ORDER BY Name LIMIT 5),
        (SELECT Id, Amount, StageName FROM Opportunities WHERE IsClosed = false)
    FROM Account
    WHERE Id IN :accountIds
];

for (Account acc : accounts) {
    List<Contact> contacts = acc.Contacts;   // child records
    List<Opportunity> opps = acc.Opportunities;
}
```

**Custom relationship names**: For custom objects, the relationship name uses `__r` instead of `__c`. Example: if `Invoice__c` has a lookup `Account__c`, the child relationship from Account is `Invoices__r`.

```java
List<Account> accounts = [
    SELECT Id, Name,
        (SELECT Id, Invoice_Number__c FROM Invoices__r)
    FROM Account
];
```

---

## Aggregate Queries

Use `GROUP BY` with aggregate functions to summarise data:

```java
List<AggregateResult> results = [
    SELECT AccountId, COUNT(Id) contactCount, MAX(CreatedDate) latestCreated
    FROM Contact
    WHERE AccountId IN :accountIds
    GROUP BY AccountId
    HAVING COUNT(Id) > 5
];

for (AggregateResult ar : results) {
    Id accountId = (Id) ar.get('AccountId');
    Integer count = (Integer) ar.get('contactCount');
    DateTime latest = (DateTime) ar.get('latestCreated');
}
```

**Available aggregate functions**: `COUNT()`, `COUNT(field)`, `COUNT_DISTINCT(field)`, `SUM(field)`, `AVG(field)`, `MIN(field)`, `MAX(field)`.

Use aliases for readability — `COUNT(Id) contactCount` creates the key `'contactCount'` in the AggregateResult map.

---

## Dynamic SOQL

Use `Database.query()` when the query structure must vary at runtime. Always sanitise input with `String.escapeSingleQuotes()`:

```java
public static List<SObject> searchRecords(String objectName, String searchField, String searchTerm) {
    // Validate inputs to prevent injection
    Schema.SObjectType objType = Schema.getGlobalDescribe().get(objectName);
    if (objType == null) {
        throw new QueryException('Invalid object: ' + objectName);
    }

    // escapeSingleQuotes prevents SOQL injection
    String safeSearchTerm = String.escapeSingleQuotes(searchTerm);

    String query = 'SELECT Id, ' + String.escapeSingleQuotes(searchField)
        + ' FROM ' + String.escapeSingleQuotes(objectName)
        + ' WHERE ' + String.escapeSingleQuotes(searchField)
        + ' LIKE \'%' + safeSearchTerm + '%\''
        + ' ORDER BY ' + String.escapeSingleQuotes(searchField)
        + ' LIMIT 50';

    return Database.query(query);
}
```

**Prefer static SOQL** whenever the query structure is known at compile time — it is faster, safer, and easier to read. Use dynamic SOQL only when you genuinely need runtime-variable fields, objects, or conditions.

---

## SOSL (Salesforce Object Search Language)

SOSL searches across multiple objects simultaneously using the full-text search index. Use it for keyword searches:

```java
String searchTerm = 'Acme';
List<List<SObject>> results = [
    FIND :searchTerm
    IN ALL FIELDS
    RETURNING
        Account(Id, Name, Industry WHERE Industry = 'Technology' LIMIT 10),
        Contact(Id, Name, Email LIMIT 10),
        Opportunity(Id, Name, Amount LIMIT 10)
];

List<Account> accounts = (List<Account>) results[0];
List<Contact> contacts = (List<Contact>) results[1];
List<Opportunity> opportunities = (List<Opportunity>) results[2];
```

**When to use SOSL vs SOQL:**
- SOSL: user is searching by keyword across multiple objects or text fields.
- SOQL: you know which object and fields to query and need precise filtering.

---

## DML Operations

### Standard DML Statements

```java
// Insert
Account acc = new Account(Name = 'Acme Corp', Industry = 'Technology');
insert acc;
// acc.Id is now populated

// Update
acc.Description = 'Updated description';
update acc;

// Upsert — insert if new, update if existing (matches by Id or external Id)
Account existing = new Account(
    External_Id__c = 'EXT-001',
    Name = 'Acme Corp'
);
upsert existing External_Id__c; // match on external Id field

// Delete
delete acc;

// Undelete — restore from recycle bin
undelete acc;
```

### Database Methods (Partial Success)

`Database` methods let you allow partial success — some records save while others fail. This is essential for batch operations:

```java
List<Account> accounts = new List<Account>{
    new Account(Name = 'Valid Account'),
    new Account() // Missing required Name — will fail
};

// allOrNone = false → partial success
List<Database.SaveResult> results = Database.insert(accounts, false);

List<String> errors = new List<String>();
for (Integer i = 0; i < results.size(); i++) {
    if (!results[i].isSuccess()) {
        for (Database.Error err : results[i].getErrors()) {
            errors.add('Record ' + i + ': ' + err.getMessage());
        }
    }
}
```

| DML Statement | Database Method | Returns |
|---|---|---|
| `insert records` | `Database.insert(records, allOrNone)` | `List<Database.SaveResult>` |
| `update records` | `Database.update(records, allOrNone)` | `List<Database.SaveResult>` |
| `upsert records field` | `Database.upsert(records, field, allOrNone)` | `List<Database.UpsertResult>` |
| `delete records` | `Database.delete(records, allOrNone)` | `List<Database.DeleteResult>` |
| `undelete records` | `Database.undelete(records, allOrNone)` | `List<Database.UndeleteResult>` |

**When to use which:**
- `insert/update/delete` (DML statements): Simple cases where all records must succeed or all must fail. Throws a `DmlException` on failure.
- `Database.insert/update/delete`: When you need partial success, custom error handling per record, or access to `Database.SaveResult` for logging.

---

## Bulkification Rules for SOQL and DML

These are the most common causes of governor limit failures. Every pattern below must be followed:

### 1. Never put SOQL inside a loop

```java
// WRONG
for (Account acc : accounts) {
    List<Contact> contacts = [SELECT Id FROM Contact WHERE AccountId = :acc.Id];
}

// RIGHT — query once, organise results
Map<Id, List<Contact>> contactsByAccount = new Map<Id, List<Contact>>();
for (Contact con : [
    SELECT Id, Name, AccountId
    FROM Contact
    WHERE AccountId IN :accountIds
]) {
    if (!contactsByAccount.containsKey(con.AccountId)) {
        contactsByAccount.put(con.AccountId, new List<Contact>());
    }
    contactsByAccount.get(con.AccountId).add(con);
}
```

### 2. Never put DML inside a loop

```java
// WRONG
for (Account acc : accounts) {
    acc.Description = 'Updated';
    update acc;
}

// RIGHT — collect, then DML once
for (Account acc : accounts) {
    acc.Description = 'Updated';
}
update accounts;
```

### 3. Collect before querying

```java
// Build a set of IDs or values to query against
Set<Id> accountIds = new Set<Id>();
for (Contact con : contacts) {
    accountIds.add(con.AccountId);
}
// Single query
Map<Id, Account> accountMap = new Map<Id, Account>(
    [SELECT Id, Name FROM Account WHERE Id IN :accountIds]
);
```

### 4. Use maps for lookups

```java
// Convert a list query to a map for O(1) lookups
Map<Id, Account> accountMap = new Map<Id, Account>(
    [SELECT Id, Name, Industry FROM Account WHERE Id IN :accountIds]
);

for (Contact con : contacts) {
    Account parentAccount = accountMap.get(con.AccountId);
    if (parentAccount != null) {
        con.Description = 'Account: ' + parentAccount.Name;
    }
}
```

---

## SOQL For Loops

When processing large datasets that might exceed heap size, use a SOQL for loop. Salesforce automatically chunks records into batches of 200:

```java
// Processes 200 records at a time — keeps heap usage low
for (List<Account> batch : [SELECT Id, Name FROM Account WHERE Industry = 'Technology']) {
    for (Account acc : batch) {
        acc.Description = 'Tech company';
    }
    update batch;
}
```

For single-record iteration (the runtime still batches internally):

```java
for (Account acc : [SELECT Id, Name FROM Account WHERE Industry = 'Technology']) {
    // Process one record at a time
    System.debug(acc.Name);
}
```

**Use the `List` form** (first example) when you need to perform DML, as you can update the entire batch at once.

---

## Common SOQL Patterns

### Querying Record Types

```java
Id businessRecordTypeId = Schema.SObjectType.Account
    .getRecordTypeInfosByDeveloperName()
    .get('Business_Account')
    .getRecordTypeId();

List<Account> businessAccounts = [
    SELECT Id, Name
    FROM Account
    WHERE RecordTypeId = :businessRecordTypeId
];
```

### Date Literals

```java
List<Opportunity> recentOpps = [
    SELECT Id, Name, CloseDate
    FROM Opportunity
    WHERE CloseDate = THIS_QUARTER
    AND CreatedDate = LAST_N_DAYS:30
];
```

Common date literals: `TODAY`, `YESTERDAY`, `TOMORROW`, `THIS_WEEK`, `LAST_WEEK`, `THIS_MONTH`, `LAST_MONTH`, `THIS_QUARTER`, `THIS_YEAR`, `LAST_N_DAYS:n`, `NEXT_N_DAYS:n`.

### Polymorphic Relationships (What.Id, Who.Id)

```java
List<Task> tasks = [
    SELECT Id, Subject,
           What.Name, What.Type,
           Who.Name, Who.Type
    FROM Task
    WHERE WhatId IN :recordIds
];

for (Task t : tasks) {
    if (t.What.Type == 'Account') {
        // Handle account-related task
    }
}
```

### Semi-Joins and Anti-Joins

```java
// Semi-join: Accounts that HAVE at least one open opportunity
List<Account> accountsWithOpps = [
    SELECT Id, Name
    FROM Account
    WHERE Id IN (
        SELECT AccountId FROM Opportunity WHERE IsClosed = false
    )
];

// Anti-join: Accounts with NO contacts
List<Account> accountsWithoutContacts = [
    SELECT Id, Name
    FROM Account
    WHERE Id NOT IN (
        SELECT AccountId FROM Contact
    )
];
```
