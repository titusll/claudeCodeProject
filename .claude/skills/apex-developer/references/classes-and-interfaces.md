# Classes and Interfaces Reference

## Basic Class Structure

Every Apex class consists of an access modifier, the `class` keyword, and a body:

```java
public with sharing class AccountService {

    // Constants
    private static final Integer MAX_RESULTS = 200;

    // Instance variables
    private List<Account> accounts;

    // Constructor
    public AccountService() {
        this.accounts = new List<Account>();
    }

    // Public methods
    public List<Account> getActiveAccounts() {
        return [
            SELECT Id, Name, Industry
            FROM Account
            WHERE IsActive__c = true
            LIMIT :MAX_RESULTS
        ];
    }

    // Private helper methods
    private Boolean isValid(Account acc) {
        return acc.Name != null && acc.Industry != null;
    }
}
```

---

## Access Modifiers

| Modifier | Visibility | Use When |
|---|---|---|
| `public` | Accessible within the same namespace | Default choice for classes and methods used within your org |
| `private` | Accessible only within the containing class | Helper methods, inner classes not needed externally |
| `protected` | Accessible within the class and its subclasses | Base class methods intended for override |
| `global` | Accessible across all namespaces | Managed packages, REST/SOAP web services, `Schedulable`/`Batchable` interfaces exposed to subscribers. Avoid unless required — `global` methods cannot be removed in future package versions |

**Class-level modifiers:**
- Classes can be `public` or `global`. Inner classes can additionally be `private`.
- `private` is the default for methods and variables if no modifier is specified.
- A class cannot be `protected` at the top level.

---

## Properties

Properties provide getter/setter syntax, which is cleaner than explicit get/set methods:

```java
public with sharing class ContactWrapper {

    // Automatic property — compiler generates backing field
    public String firstName { get; set; }
    public String lastName { get; set; }
    public String email { get; private set; } // publicly readable, privately writable

    // Computed property — no backing field
    public String fullName {
        get {
            return this.firstName + ' ' + this.lastName;
        }
    }

    // Read-only property using the shorthand
    public Boolean isValid {
        get {
            return String.isNotBlank(this.firstName) && String.isNotBlank(this.lastName);
        }
    }
}
```

Use `{ get; set; }` for simple data carriers. Use computed properties when the value is derived from other fields.

---

## Constructors

```java
public with sharing class OpportunityService {

    private List<Opportunity> opportunities;
    private Id accountId;

    // No-argument constructor
    public OpportunityService() {
        this.opportunities = new List<Opportunity>();
    }

    // Parameterised constructor
    public OpportunityService(Id accountId) {
        this(); // call the no-arg constructor
        this.accountId = accountId;
    }

    // Constructor overloading — multiple signatures
    public OpportunityService(Id accountId, List<Opportunity> opportunities) {
        this.accountId = accountId;
        this.opportunities = opportunities;
    }
}
```

If no constructor is defined, Apex provides a default no-argument constructor. Once you define any constructor, the default is no longer available — define a no-arg constructor explicitly if you still need one.

---

## Static Methods and Variables

Static members belong to the class, not to an instance. Use them for utility methods and class-level state:

```java
public with sharing class DateUtility {

    // Static constant
    private static final String DATE_FORMAT = 'yyyy-MM-dd';

    // Static method — called as DateUtility.formatDate(someDate)
    public static String formatDate(Date d) {
        if (d == null) return '';
        return DateTime.newInstance(d, Time.newInstance(0, 0, 0, 0))
            .format(DATE_FORMAT);
    }

    // Static method with return type
    public static Integer businessDaysBetween(Date startDate, Date endDate) {
        Integer count = 0;
        Date current = startDate;
        while (current < endDate) {
            DateTime dt = DateTime.newInstance(current, Time.newInstance(0, 0, 0, 0));
            String dayOfWeek = dt.format('EEEE');
            if (dayOfWeek != 'Saturday' && dayOfWeek != 'Sunday') {
                count++;
            }
            current = current.addDays(1);
        }
        return count;
    }
}
```

**Transaction-level state**: Static variables persist for the duration of a single transaction. This is useful for recursion guards in triggers (see `references/triggers-and-handlers.md`).

---

## Interfaces

Interfaces define a contract that implementing classes must fulfil:

```java
public interface INotificationService {
    void sendNotification(List<Id> recipientIds, String subject, String body);
    Integer getPendingCount();
}
```

```java
public with sharing class EmailNotificationService implements INotificationService {

    public void sendNotification(List<Id> recipientIds, String subject, String body) {
        List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();
        for (Id recipientId : recipientIds) {
            Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
            email.setTargetObjectId(recipientId);
            email.setSubject(subject);
            email.setPlainTextBody(body);
            email.setSaveAsActivity(false);
            emails.add(email);
        }
        if (!emails.isEmpty()) {
            Messaging.sendEmail(emails);
        }
    }

    public Integer getPendingCount() {
        return 0; // emails are sent immediately
    }
}
```

**When to use interfaces:**
- When you need multiple implementations of the same behaviour (e.g., different notification channels).
- When you want to decouple a dependency for easier testing — your test can substitute a mock implementation.
- When building a trigger handler framework (see `references/triggers-and-handlers.md`).

A class can implement multiple interfaces: `public class MyClass implements InterfaceA, InterfaceB { ... }`

---

## Abstract Classes

Abstract classes provide partial implementations — some methods are concrete, others are declared `abstract` and must be implemented by subclasses:

```java
public abstract class BaseTriggerHandler {

    // Concrete method — shared by all subclasses
    public void run() {
        if (Trigger.isInsert && Trigger.isBefore) {
            beforeInsert(Trigger.new);
        } else if (Trigger.isInsert && Trigger.isAfter) {
            afterInsert(Trigger.new);
        } else if (Trigger.isUpdate && Trigger.isBefore) {
            beforeUpdate(Trigger.new, Trigger.oldMap);
        } else if (Trigger.isUpdate && Trigger.isAfter) {
            afterUpdate(Trigger.new, Trigger.oldMap);
        } else if (Trigger.isDelete && Trigger.isBefore) {
            beforeDelete(Trigger.old);
        } else if (Trigger.isDelete && Trigger.isAfter) {
            afterDelete(Trigger.old);
        } else if (Trigger.isUndelete) {
            afterUndelete(Trigger.new);
        }
    }

    // Virtual methods — subclasses override only the events they need
    protected virtual void beforeInsert(List<SObject> newRecords) {}
    protected virtual void afterInsert(List<SObject> newRecords) {}
    protected virtual void beforeUpdate(List<SObject> newRecords, Map<Id, SObject> oldMap) {}
    protected virtual void afterUpdate(List<SObject> newRecords, Map<Id, SObject> oldMap) {}
    protected virtual void beforeDelete(List<SObject> oldRecords) {}
    protected virtual void afterDelete(List<SObject> oldRecords) {}
    protected virtual void afterUndelete(List<SObject> newRecords) {}
}
```

**`abstract` vs `virtual`:**
- `abstract` methods have no body — subclasses must provide an implementation.
- `virtual` methods have a default body — subclasses may override but don't have to.
- A class with any `abstract` method must itself be declared `abstract`.
- Use `virtual` on the class itself if you want to allow subclassing but the class has no abstract methods.
- Use `override` on the subclass method to replace a virtual or abstract parent method.

```java
public class AccountTriggerHandler extends BaseTriggerHandler {

    protected override void beforeInsert(List<SObject> newRecords) {
        List<Account> accounts = (List<Account>) newRecords;
        for (Account acc : accounts) {
            if (String.isBlank(acc.Description)) {
                acc.Description = 'Created via trigger';
            }
        }
    }

    protected override void afterUpdate(List<SObject> newRecords, Map<Id, SObject> oldMap) {
        // Only act on records where Name changed
        List<Account> changedAccounts = new List<Account>();
        for (SObject rec : newRecords) {
            Account newAcc = (Account) rec;
            Account oldAcc = (Account) oldMap.get(newAcc.Id);
            if (newAcc.Name != oldAcc.Name) {
                changedAccounts.add(newAcc);
            }
        }
        if (!changedAccounts.isEmpty()) {
            AccountService.handleNameChanges(changedAccounts);
        }
    }
}
```

---

## Enums

Enums define a fixed set of constants. Use them instead of magic strings:

```java
public enum OrderStatus {
    DRAFT,
    SUBMITTED,
    APPROVED,
    REJECTED,
    FULFILLED,
    CANCELLED
}
```

```java
public with sharing class OrderService {

    public void processOrder(Order__c order) {
        OrderStatus status = OrderStatus.valueOf(order.Status__c.toUpperCase());

        switch on status {
            when DRAFT {
                validateDraftOrder(order);
            }
            when SUBMITTED {
                routeForApproval(order);
            }
            when APPROVED {
                fulfillOrder(order);
            }
            when REJECTED, CANCELLED {
                notifyOwner(order);
            }
            when else {
                throw new OrderException('Unhandled status: ' + order.Status__c);
            }
        }
    }
}
```

**Enum methods**: All enums have `.name()` (returns the string name), `.ordinal()` (returns the position), and `values()` (returns all values). Use `EnumName.valueOf(string)` to parse a string into an enum value — this is case-sensitive and throws an exception if the value doesn't match.

---

## Inner Classes

Inner classes are useful for data transfer objects (DTOs), wrappers, and tightly-coupled helper types:

```java
public with sharing class AccountController {

    @AuraEnabled(cacheable=true)
    public static List<AccountWrapper> getAccountsWithContacts(List<Id> accountIds) {
        List<AccountWrapper> wrappers = new List<AccountWrapper>();
        for (Account acc : [
            SELECT Id, Name, Industry,
                (SELECT Id, Name, Email FROM Contacts ORDER BY Name LIMIT 5)
            FROM Account
            WHERE Id IN :accountIds
        ]) {
            wrappers.add(new AccountWrapper(acc));
        }
        return wrappers;
    }

    // Inner class — returned to LWC as a serialised object
    public class AccountWrapper {
        @AuraEnabled public String accountId;
        @AuraEnabled public String accountName;
        @AuraEnabled public String industry;
        @AuraEnabled public List<ContactInfo> contacts;

        public AccountWrapper(Account acc) {
            this.accountId = acc.Id;
            this.accountName = acc.Name;
            this.industry = acc.Industry;
            this.contacts = new List<ContactInfo>();
            if (acc.Contacts != null) {
                for (Contact con : acc.Contacts) {
                    this.contacts.add(new ContactInfo(con));
                }
            }
        }
    }

    public class ContactInfo {
        @AuraEnabled public String contactId;
        @AuraEnabled public String name;
        @AuraEnabled public String email;

        public ContactInfo(Contact con) {
            this.contactId = con.Id;
            this.name = con.Name;
            this.email = con.Email;
        }
    }
}
```

**When to use inner classes:**
- Wrapper/DTO classes that are only meaningful in the context of the outer class.
- Response objects for `@AuraEnabled` methods — mark each property with `@AuraEnabled` so LWC can access it.
- Keep inner classes small. If an inner class grows complex or is needed by multiple outer classes, promote it to its own top-level class.

---

## @AuraEnabled Methods (LWC/Aura Controllers)

Methods called from Lightning Web Components must follow specific rules:

```java
public with sharing class ContactController {

    // READ-ONLY — cacheable, wire-compatible
    @AuraEnabled(cacheable=true)
    public static List<Contact> getContacts(Id accountId) {
        return [
            SELECT Id, Name, Email, Phone
            FROM Contact
            WHERE AccountId = :accountId
            ORDER BY Name
        ];
    }

    // WRITE — not cacheable, called imperatively from LWC
    @AuraEnabled
    public static Contact createContact(String firstName, String lastName, Id accountId) {
        Contact con = new Contact(
            FirstName = firstName,
            LastName = lastName,
            AccountId = accountId
        );
        insert con;
        return con;
    }
}
```

**Rules:**
- `cacheable=true` methods cannot perform DML. They are called via `@wire` or imperatively.
- Non-cacheable `@AuraEnabled` methods can perform DML but must be called imperatively (not via `@wire`).
- Parameters and return types must be serialisable (primitives, sObjects, lists, maps, or classes with `@AuraEnabled` properties).
- Always use `with sharing` on LWC controllers to respect the user's record access.
- Wrap exceptions in `AuraHandledException` so the client gets a user-friendly message (see `references/security-and-error-handling.md`).
