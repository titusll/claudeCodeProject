# Triggers and Handlers Reference

## Trigger Anatomy

A trigger fires in response to DML events on an sObject. Keep triggers thin — they should only route to a handler class.

```java
trigger AccountTrigger on Account (
    before insert, before update, before delete,
    after insert, after update, after delete, after undelete
) {
    new AccountTriggerHandler().run();
}
```

**File location:**  
- Trigger: `force-app/main/default/triggers/AccountTrigger.trigger`  
- Metadata: `force-app/main/default/triggers/AccountTrigger.trigger-meta.xml`

### Trigger Context Variables

| Variable | Type | Description |
|---|---|---|
| `Trigger.new` | `List<SObject>` | New versions of records (insert, update, undelete) |
| `Trigger.old` | `List<SObject>` | Old versions of records (update, delete) |
| `Trigger.newMap` | `Map<Id, SObject>` | Map of new records by Id (after triggers, update) |
| `Trigger.oldMap` | `Map<Id, SObject>` | Map of old records by Id (update, delete) |
| `Trigger.isInsert` | `Boolean` | True if triggered by insert |
| `Trigger.isUpdate` | `Boolean` | True if triggered by update |
| `Trigger.isDelete` | `Boolean` | True if triggered by delete |
| `Trigger.isUndelete` | `Boolean` | True if triggered by undelete |
| `Trigger.isBefore` | `Boolean` | True if before trigger |
| `Trigger.isAfter` | `Boolean` | True if after trigger |
| `Trigger.size` | `Integer` | Total number of records in the trigger |

**Important:**
- `Trigger.new` and `Trigger.newMap` are not available in delete triggers — use `Trigger.old` and `Trigger.oldMap`.
- In before triggers, you can modify fields on `Trigger.new` records directly (no DML needed).
- In after triggers, records are read-only — perform DML on separate record lists.
- `Trigger.newMap` is not available in before insert (records don't have IDs yet).

---

## One Trigger Per Object

Always use a single trigger per object. Multiple triggers on the same object have no guaranteed execution order, which makes behaviour unpredictable.

**Do this:**
```
triggers/
    AccountTrigger.trigger          ← one trigger
classes/
    AccountTriggerHandler.cls       ← delegates logic here
```

**Not this:**
```
triggers/
    AccountTrigger.trigger
    AccountNameTrigger.trigger      ← unpredictable order
    AccountIndustryTrigger.trigger  ← difficult to debug
```

---

## Trigger Handler Pattern

The handler pattern keeps business logic testable and maintainable. There are several approaches — here is a clean, lightweight version using an abstract base class:

### Base Handler Class

```java
public abstract class TriggerHandler {

    // Recursion guard — prevents re-entrancy per handler per event
    private static Set<String> executedHandlers = new Set<String>();

    public void run() {
        String handlerKey = getHandlerKey();

        // Skip if this handler+event already ran in this transaction
        if (executedHandlers.contains(handlerKey)) {
            return;
        }
        executedHandlers.add(handlerKey);

        if (Trigger.isBefore) {
            if (Trigger.isInsert)       beforeInsert(Trigger.new);
            else if (Trigger.isUpdate)  beforeUpdate(Trigger.new, Trigger.oldMap);
            else if (Trigger.isDelete)  beforeDelete(Trigger.old);
        } else if (Trigger.isAfter) {
            if (Trigger.isInsert)       afterInsert(Trigger.new, Trigger.newMap);
            else if (Trigger.isUpdate)  afterUpdate(Trigger.new, Trigger.oldMap);
            else if (Trigger.isDelete)  afterDelete(Trigger.old, Trigger.oldMap);
            else if (Trigger.isUndelete) afterUndelete(Trigger.new);
        }
    }

    private String getHandlerKey() {
        String event = '';
        if (Trigger.isBefore && Trigger.isInsert)       event = 'BEFORE_INSERT';
        else if (Trigger.isBefore && Trigger.isUpdate)   event = 'BEFORE_UPDATE';
        else if (Trigger.isBefore && Trigger.isDelete)   event = 'BEFORE_DELETE';
        else if (Trigger.isAfter && Trigger.isInsert)    event = 'AFTER_INSERT';
        else if (Trigger.isAfter && Trigger.isUpdate)    event = 'AFTER_UPDATE';
        else if (Trigger.isAfter && Trigger.isDelete)    event = 'AFTER_DELETE';
        else if (Trigger.isAfter && Trigger.isUndelete)  event = 'AFTER_UNDELETE';
        return String.valueOf(this).substringBefore(':') + '_' + event;
    }

    // Reset the guard — call this in tests between DML operations if needed
    @TestVisible
    private static void resetExecutedHandlers() {
        executedHandlers.clear();
    }

    // Virtual methods — override only the events you need
    protected virtual void beforeInsert(List<SObject> newRecords) {}
    protected virtual void afterInsert(List<SObject> newRecords, Map<Id, SObject> newMap) {}
    protected virtual void beforeUpdate(List<SObject> newRecords, Map<Id, SObject> oldMap) {}
    protected virtual void afterUpdate(List<SObject> newRecords, Map<Id, SObject> oldMap) {}
    protected virtual void beforeDelete(List<SObject> oldRecords) {}
    protected virtual void afterDelete(List<SObject> oldRecords, Map<Id, SObject> oldMap) {}
    protected virtual void afterUndelete(List<SObject> newRecords) {}
}
```

### Concrete Handler Example

```java
public with sharing class AccountTriggerHandler extends TriggerHandler {

    protected override void beforeInsert(List<SObject> newRecords) {
        setDefaults((List<Account>) newRecords);
    }

    protected override void beforeUpdate(List<SObject> newRecords, Map<Id, SObject> oldMap) {
        validateIndustryChanges((List<Account>) newRecords, (Map<Id, Account>) oldMap);
    }

    protected override void afterUpdate(List<SObject> newRecords, Map<Id, SObject> oldMap) {
        List<Account> nameChangedAccounts = getRecordsWithFieldChange(
            (List<Account>) newRecords,
            (Map<Id, Account>) oldMap,
            Account.Name
        );
        if (!nameChangedAccounts.isEmpty()) {
            updateRelatedContacts(nameChangedAccounts);
        }
    }

    // --- Private Methods ---

    private void setDefaults(List<Account> accounts) {
        for (Account acc : accounts) {
            if (String.isBlank(acc.Description)) {
                acc.Description = 'Auto-populated by trigger';
            }
        }
    }

    private void validateIndustryChanges(List<Account> newAccounts, Map<Id, Account> oldMap) {
        for (Account acc : newAccounts) {
            Account oldAcc = oldMap.get(acc.Id);
            if (acc.Industry != oldAcc.Industry && acc.Industry == 'Government') {
                if (String.isBlank(acc.DUNS_Number__c)) {
                    acc.addError('DUNS Number is required for Government accounts.');
                }
            }
        }
    }

    private List<Account> getRecordsWithFieldChange(
        List<Account> newRecords,
        Map<Id, Account> oldMap,
        Schema.SObjectField field
    ) {
        List<Account> changed = new List<Account>();
        for (Account acc : newRecords) {
            if (acc.get(field) != oldMap.get(acc.Id).get(field)) {
                changed.add(acc);
            }
        }
        return changed;
    }

    private void updateRelatedContacts(List<Account> accounts) {
        Set<Id> accountIds = new Map<Id, Account>(accounts).keySet();
        List<Contact> contacts = [
            SELECT Id, MailingStreet, AccountId
            FROM Contact
            WHERE AccountId IN :accountIds
        ];
        if (!contacts.isEmpty()) {
            // Perform updates as needed
            update contacts;
        }
    }
}
```

### The Trigger Itself

```java
trigger AccountTrigger on Account (
    before insert, before update,
    after update
) {
    new AccountTriggerHandler().run();
}
```

Only list the events you actually handle — don't register for events you ignore.

---

## Recursion Prevention

Triggers can re-fire when your after-trigger logic performs DML on the same object. The base handler above uses a static `Set<String>` to track which handler+event combinations have already executed.

If you need more granular control (e.g., allow re-entry for specific records but not others), use a static `Set<Id>`:

```java
public with sharing class CaseTriggerHandler extends TriggerHandler {

    private static Set<Id> processedCaseIds = new Set<Id>();

    protected override void afterUpdate(List<SObject> newRecords, Map<Id, SObject> oldMap) {
        List<Case> casesToProcess = new List<Case>();
        for (Case c : (List<Case>) newRecords) {
            if (!processedCaseIds.contains(c.Id)) {
                casesToProcess.add(c);
                processedCaseIds.add(c.Id);
            }
        }
        if (!casesToProcess.isEmpty()) {
            escalateCases(casesToProcess);
        }
    }

    private void escalateCases(List<Case> cases) {
        // Business logic that might cause trigger to re-fire
        update cases;
    }
}
```

---

## Bulkification in Triggers

Every trigger method receives a list of records. Always process the entire list — never assume a single record.

**Wrong — SOQL and DML inside a loop:**
```java
// DO NOT DO THIS
for (Account acc : Trigger.new) {
    List<Contact> contacts = [SELECT Id FROM Contact WHERE AccountId = :acc.Id];
    acc.Contact_Count__c = contacts.size();
}
```

**Right — collect IDs, query once, iterate:**
```java
protected override void beforeUpdate(List<SObject> newRecords, Map<Id, SObject> oldMap) {
    List<Account> accounts = (List<Account>) newRecords;
    Set<Id> accountIds = new Map<Id, Account>(accounts).keySet();

    // Single query outside the loop
    Map<Id, Integer> contactCounts = new Map<Id, Integer>();
    for (AggregateResult ar : [
        SELECT AccountId, COUNT(Id) cnt
        FROM Contact
        WHERE AccountId IN :accountIds
        GROUP BY AccountId
    ]) {
        contactCounts.put((Id) ar.get('AccountId'), (Integer) ar.get('cnt'));
    }

    // Iterate and assign
    for (Account acc : accounts) {
        acc.Contact_Count__c = contactCounts.containsKey(acc.Id)
            ? contactCounts.get(acc.Id)
            : 0;
    }
}
```

See `references/governor-limits-and-async.md` for a full list of limits and additional bulkification strategies.

---

## Order of Execution

Understanding the order of execution helps debug unexpected behaviour:

1. System validation rules (required fields, field format)
2. **Before triggers** fire
3. Custom validation rules
4. Duplicate rules
5. Record saved to database (not committed yet)
6. **After triggers** fire
7. Assignment rules, auto-response rules
8. Workflow rules (and their field updates — which can re-fire before/after update triggers)
9. Process Builder / Flows (record-triggered, after-save)
10. Escalation rules
11. Roll-up summary calculations
12. Criteria-based sharing re-evaluation
13. DML operation committed
14. Post-commit logic (sending emails, enqueuing async jobs)

**Key implications:**
- Before triggers run before validation rules — you can fix field values to pass validation.
- After triggers run after the record is saved but before the transaction commits.
- Workflow field updates can re-fire triggers — this is why recursion prevention matters.
- Roll-up summary recalculations happen after triggers — querying the parent's summary field in an after trigger on the child will return the stale value.

---

## addError for Validation

Use `addError` in before triggers to block a DML operation with a user-friendly message:

```java
protected override void beforeInsert(List<SObject> newRecords) {
    for (Account acc : (List<Account>) newRecords) {
        if (acc.AnnualRevenue != null && acc.AnnualRevenue < 0) {
            acc.addError('Annual Revenue cannot be negative.');
        }
        // Field-level error — appears next to the field in the UI
        if (acc.Industry == 'Other' && String.isBlank(acc.Description)) {
            acc.Description.addError('Description is required when Industry is Other.');
        }
    }
}
```

- `record.addError(message)` — prevents the entire record from saving.
- `record.fieldName.addError(message)` — attaches the error to a specific field (better UX in page layouts).
- `addError` works in before triggers and validation. In after triggers it rolls back the entire transaction.
