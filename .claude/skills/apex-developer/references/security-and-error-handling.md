# Security and Error Handling Reference

## Sharing Keywords

Sharing keywords control whether Apex code respects the running user's record-level access (sharing rules, role hierarchy, ownership):

| Keyword | Behaviour | Use When |
|---|---|---|
| `with sharing` | Enforces the running user's sharing rules | Default choice. Always use for code exposed to users (controllers, REST endpoints) |
| `without sharing` | Ignores sharing rules — sees all records | Service classes that need org-wide access (e.g., background processing, rollup calculations). Document the reason |
| `inherited sharing` | Inherits the sharing context of the caller. If no caller context exists, defaults to `with sharing` | Utility/library classes that should respect whatever context they're called from |

```java
// Controller — always enforce sharing
public with sharing class AccountController {
    @AuraEnabled(cacheable=true)
    public static List<Account> getAccounts() {
        return [SELECT Id, Name FROM Account ORDER BY Name LIMIT 50];
    }
}

// Service — needs to see all records for rollup calculation
public without sharing class RollupService {
    // Document why: rollup must count all child records regardless of user access
    public static Integer countAllContacts(Id accountId) {
        return [SELECT COUNT() FROM Contact WHERE AccountId = :accountId];
    }
}

// Utility — inherits caller's sharing mode
public inherited sharing class QueryHelper {
    public static List<SObject> queryRecords(String query) {
        return Database.query(query);
    }
}
```

**If you omit the sharing keyword entirely**, the class runs as `without sharing` by default — this is almost never what you want. Always declare the sharing keyword explicitly.

---

## CRUD and FLS Enforcement

Field-Level Security (FLS) and object-level CRUD permissions are not enforced automatically in Apex. You must enforce them when the code is exposed to users.

### When to Enforce

- **Always enforce**: `@AuraEnabled` controllers, REST/SOAP endpoints, Visualforce controllers, any code that accepts user input to determine which fields/objects to access.
- **Usually skip**: Internal service classes called only from other Apex, batch jobs running as a system admin, trigger handlers (the platform already performed CRUD checks on the originating DML).

### Schema.DescribeSObjectResult Checks

```java
public with sharing class AccountController {

    @AuraEnabled(cacheable=true)
    public static List<Account> getAccounts() {
        // Check object-level read access
        if (!Schema.SObjectType.Account.isAccessible()) {
            throw new AuraHandledException('You do not have access to Account records.');
        }

        // Check field-level read access
        Map<String, Schema.SObjectField> fieldMap = Schema.SObjectType.Account.fields.getMap();
        List<String> fieldsToQuery = new List<String>{ 'Id', 'Name', 'Industry', 'AnnualRevenue' };

        for (String fieldName : fieldsToQuery) {
            Schema.DescribeFieldResult dfr = fieldMap.get(fieldName).getDescribe();
            if (!dfr.isAccessible()) {
                throw new AuraHandledException('You do not have access to field: ' + dfr.getLabel());
            }
        }

        return [SELECT Id, Name, Industry, AnnualRevenue FROM Account ORDER BY Name LIMIT 50];
    }
}
```

### Security.stripInaccessible (Preferred)

Starting in API version 48.0, `Security.stripInaccessible()` is the preferred approach. It removes fields the user cannot access rather than throwing an error:

```java
public with sharing class AccountController {

    @AuraEnabled(cacheable=true)
    public static List<Account> getAccounts() {
        List<Account> accounts = [
            SELECT Id, Name, Industry, AnnualRevenue, Secret_Field__c
            FROM Account
            ORDER BY Name
            LIMIT 50
        ];

        // Strip fields the running user cannot read
        SObjectAccessDecision decision = Security.stripInaccessible(
            AccessType.READABLE,
            accounts
        );

        return (List<Account>) decision.getRecords();
        // Secret_Field__c will be null if user lacks FLS access
    }

    @AuraEnabled
    public static Account createAccount(Account acc) {
        // Strip fields the user cannot create
        SObjectAccessDecision decision = Security.stripInaccessible(
            AccessType.CREATABLE,
            new List<Account>{ acc }
        );

        Account safeAccount = (Account) decision.getRecords()[0];
        insert safeAccount;
        return safeAccount;
    }

    @AuraEnabled
    public static Account updateAccount(Account acc) {
        // Strip fields the user cannot update
        SObjectAccessDecision decision = Security.stripInaccessible(
            AccessType.UPDATABLE,
            new List<Account>{ acc }
        );

        Account safeAccount = (Account) decision.getRecords()[0];
        update safeAccount;
        return safeAccount;
    }
}
```

**AccessType values:**
- `READABLE` — removes fields the user cannot read.
- `CREATABLE` — removes fields the user cannot create.
- `UPDATABLE` — removes fields the user cannot update.
- `UPSERTABLE` — removes fields the user cannot upsert.

`decision.getRemovedFields()` returns a map of fields that were stripped — useful for logging or informing the user.

---

## SOQL Injection Prevention

Never concatenate user input directly into a SOQL query string. Use bind variables or `String.escapeSingleQuotes()`:

### Safe: Bind Variables (Static SOQL)

```java
// Bind variables are always safe
String searchTerm = userInput;
List<Account> accounts = [
    SELECT Id, Name
    FROM Account
    WHERE Name = :searchTerm
];
```

### Safe: String.escapeSingleQuotes (Dynamic SOQL)

```java
// When dynamic SOQL is unavoidable, escape the input
String safeTerm = String.escapeSingleQuotes(userInput);
String query = 'SELECT Id, Name FROM Account WHERE Name LIKE \'%' + safeTerm + '%\'';
List<Account> accounts = Database.query(query);
```

### Unsafe: Direct Concatenation

```java
// NEVER DO THIS — vulnerable to SOQL injection
String query = 'SELECT Id, Name FROM Account WHERE Name = \'' + userInput + '\'';
// A malicious user could pass: ' OR Name != '
// Resulting in: SELECT Id, Name FROM Account WHERE Name = '' OR Name != ''
```

---

## Custom Exceptions

Define custom exceptions for domain-specific error handling:

```java
public class OrderException extends Exception {}

public class ValidationException extends Exception {
    public List<String> fieldErrors;

    public ValidationException(String message, List<String> fieldErrors) {
        this(message);
        this.fieldErrors = fieldErrors;
    }
}

public class ExternalServiceException extends Exception {
    public Integer statusCode;

    public ExternalServiceException(String message, Integer statusCode) {
        this(message);
        this.statusCode = statusCode;
    }
}
```

### Using Custom Exceptions

```java
public with sharing class OrderService {

    public static void submitOrder(Order__c order) {
        // Validate
        List<String> errors = validateOrder(order);
        if (!errors.isEmpty()) {
            throw new ValidationException(
                'Order validation failed',
                errors
            );
        }

        // Process
        try {
            order.Status__c = 'Submitted';
            update order;
        } catch (DmlException e) {
            throw new OrderException('Failed to submit order: ' + e.getMessage());
        }
    }

    private static List<String> validateOrder(Order__c order) {
        List<String> errors = new List<String>();
        if (order.Total_Amount__c == null || order.Total_Amount__c <= 0) {
            errors.add('Order total must be greater than zero.');
        }
        if (order.Ship_To_Address__c == null) {
            errors.add('Shipping address is required.');
        }
        return errors;
    }
}
```

---

## AuraHandledException (LWC Error Handling)

When Apex methods called from LWC throw an unhandled exception, the client receives a generic "Internal Server Error" message. To send a meaningful error message to the LWC, wrap exceptions in `AuraHandledException`:

```java
public with sharing class ContactController {

    @AuraEnabled(cacheable=true)
    public static List<Contact> getContacts(Id accountId) {
        try {
            if (accountId == null) {
                throw new AuraHandledException('Account ID is required.');
            }
            return [
                SELECT Id, Name, Email
                FROM Contact
                WHERE AccountId = :accountId
                ORDER BY Name
            ];
        } catch (AuraHandledException e) {
            // Re-throw AuraHandledException as-is
            throw e;
        } catch (Exception e) {
            // Wrap unexpected errors
            throw new AuraHandledException('Failed to load contacts: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static Contact createContact(String firstName, String lastName, Id accountId) {
        try {
            Contact con = new Contact(
                FirstName = firstName,
                LastName = lastName,
                AccountId = accountId
            );
            insert con;
            return con;
        } catch (DmlException e) {
            // Extract the user-facing error message from the DML exception
            String errorMessage = '';
            for (Integer i = 0; i < e.getNumDml(); i++) {
                errorMessage += e.getDmlMessage(i);
                if (i < e.getNumDml() - 1) errorMessage += '; ';
            }
            throw new AuraHandledException(errorMessage);
        } catch (Exception e) {
            throw new AuraHandledException('An unexpected error occurred: ' + e.getMessage());
        }
    }
}
```

### setMessage Pattern

`AuraHandledException` has a quirk: the constructor message is not always transmitted to the client. For reliability, always call `setMessage()`:

```java
AuraHandledException ex = new AuraHandledException(errorMessage);
ex.setMessage(errorMessage);
throw ex;
```

Or use a helper method:

```java
public class ApexErrorUtility {

    public static AuraHandledException createAuraException(String message) {
        AuraHandledException ex = new AuraHandledException(message);
        ex.setMessage(message);
        return ex;
    }

    public static AuraHandledException createAuraException(Exception cause) {
        String message = cause instanceof DmlException
            ? extractDmlMessage((DmlException) cause)
            : cause.getMessage();
        return createAuraException(message);
    }

    private static String extractDmlMessage(DmlException e) {
        List<String> messages = new List<String>();
        for (Integer i = 0; i < e.getNumDml(); i++) {
            messages.add(e.getDmlMessage(i));
        }
        return String.join(messages, '; ');
    }
}
```

Usage:
```java
@AuraEnabled
public static void deleteContact(Id contactId) {
    try {
        delete [SELECT Id FROM Contact WHERE Id = :contactId];
    } catch (Exception e) {
        throw ApexErrorUtility.createAuraException(e);
    }
}
```

---

## Error Handling Best Practices

### Catch Specific Exceptions

```java
try {
    insert newRecords;
} catch (DmlException e) {
    // Handle DML failures (validation rules, required fields, etc.)
    handleDmlError(e);
} catch (QueryException e) {
    // Handle SOQL issues (non-selective query, too many rows)
    handleQueryError(e);
} catch (Exception e) {
    // Catch-all for unexpected errors — log and re-throw
    System.debug(LoggingLevel.ERROR, 'Unexpected error: ' + e.getMessage() + '\n' + e.getStackTraceString());
    throw e;
}
```

### Never Swallow Exceptions Silently

```java
// WRONG — hides errors
try {
    insert records;
} catch (Exception e) {
    // Silent failure — bug will be invisible
}

// RIGHT — log and handle
try {
    insert records;
} catch (DmlException e) {
    System.debug(LoggingLevel.ERROR, 'Insert failed: ' + e.getMessage());
    // Either re-throw, return an error result, or take corrective action
    throw new OrderException('Failed to create records: ' + e.getMessage());
}
```

### Database Methods for Partial Success

When processing a batch where some records may fail:

```java
public static Map<String, Object> bulkCreateAccounts(List<Account> accounts) {
    List<Database.SaveResult> results = Database.insert(accounts, false);

    List<Account> successes = new List<Account>();
    List<String> errors = new List<String>();

    for (Integer i = 0; i < results.size(); i++) {
        if (results[i].isSuccess()) {
            successes.add(accounts[i]);
        } else {
            for (Database.Error err : results[i].getErrors()) {
                errors.add(accounts[i].Name + ': ' + err.getMessage());
            }
        }
    }

    return new Map<String, Object>{
        'successes' => successes.size(),
        'errors' => errors
    };
}
```

---

## Common Exception Types

| Exception | When It Occurs | How to Handle |
|---|---|---|
| `DmlException` | Insert/update/delete fails (validation, required fields, sharing) | Check `getNumDml()`, `getDmlMessage()`, `getDmlType()` |
| `QueryException` | SOQL fails (non-selective query, list has no rows) | Validate inputs before querying; use `List` not single assignment |
| `NullPointerException` | Accessing a method or property on a null reference | Check for null before dereferencing |
| `ListException` | Index out of bounds, or assigning to a list index that doesn't exist | Check `size()` before accessing by index |
| `TypeException` | Invalid type cast or conversion | Validate types before casting |
| `LimitException` | Governor limit exceeded (SOQL, DML, CPU) | Cannot be caught — prevent by writing bulkified code |
| `CalloutException` | HTTP callout fails (timeout, connection refused) | Wrap in try/catch; implement retry logic for transient errors |
| `AuraHandledException` | Custom: thrown to send a message to an LWC client | Always use `setMessage()` for reliability |
| `JSONException` | JSON parsing fails | Wrap `JSON.deserialize()` in try/catch |
| `MathException` | Division by zero or numeric overflow | Validate divisors before division |

**`LimitException` is special** — it cannot be caught. The only way to handle it is to prevent it by writing code that stays within governor limits (see bulkification patterns).
