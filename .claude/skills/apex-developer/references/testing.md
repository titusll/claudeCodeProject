# Testing Reference

## Test Class Structure

Every Apex test class uses the `@IsTest` annotation and lives alongside the class it tests:

```
force-app/main/default/classes/
    AccountService.cls
    AccountService.cls-meta.xml
    AccountServiceTest.cls
    AccountServiceTest.cls-meta.xml
```

### Basic Test Class

```java
@IsTest
private class AccountServiceTest {

    @TestSetup
    static void setup() {
        // Create shared test data — runs once, rolled back after all tests
        List<Account> accounts = new List<Account>();
        for (Integer i = 0; i < 5; i++) {
            accounts.add(new Account(
                Name = 'Test Account ' + i,
                Industry = 'Technology'
            ));
        }
        insert accounts;
    }

    @IsTest
    static void getActiveAccounts_returnsAccounts() {
        // Arrange — @TestSetup data is available here
        // Act
        Test.startTest();
        List<Account> results = AccountService.getActiveAccounts();
        Test.stopTest();

        // Assert
        Assert.areEqual(5, results.size(), 'Should return all test accounts');
        for (Account acc : results) {
            Assert.isTrue(acc.Name.startsWith('Test Account'), 'Name should match');
        }
    }

    @IsTest
    static void getActiveAccounts_noData_returnsEmptyList() {
        // Arrange — delete setup data
        delete [SELECT Id FROM Account];

        // Act
        Test.startTest();
        List<Account> results = AccountService.getActiveAccounts();
        Test.stopTest();

        // Assert
        Assert.areEqual(0, results.size(), 'Should return empty list when no accounts exist');
    }
}
```

---

## Key Testing Rules

- **Test classes don't count against code coverage** — annotate with `@IsTest`.
- **Test data isolation**: By default, tests cannot see org data. They only see records created within the test (or in `@TestSetup`). Use `@IsTest(SeeAllData=true)` only when absolutely necessary (e.g., testing against standard price books). Avoid it wherever possible.
- **`Test.startTest()` / `Test.stopTest()`**: These reset governor limits, giving your code-under-test a fresh set of limits. `Test.stopTest()` also forces asynchronous code (future, batch, queueable) to execute synchronously.
- **Minimum 75% coverage** to deploy to production, but aim for meaningful coverage of business logic — not just line coverage.
- **Test behaviour, not implementation**: Assert on outcomes (records created, fields updated, exceptions thrown), not internal method calls.

---

## @TestSetup

`@TestSetup` runs once before all test methods in the class. Each test method gets its own copy of the data (rolled back after each test), so tests are isolated from each other:

```java
@TestSetup
static void setup() {
    // Create a user for testing with specific permissions
    Profile stdProfile = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
    User testUser = new User(
        FirstName = 'Test',
        LastName = 'User',
        Email = 'testuser@example.com',
        Username = 'testuser' + DateTime.now().getTime() + '@example.com',
        Alias = 'tuser',
        TimeZoneSidKey = 'America/New_York',
        LocaleSidKey = 'en_US',
        EmailEncodingKey = 'UTF-8',
        LanguageLocaleKey = 'en_US',
        ProfileId = stdProfile.Id
    );
    insert testUser;

    // Create accounts and contacts
    System.runAs(testUser) {
        Account acc = new Account(Name = 'Test Account');
        insert acc;

        List<Contact> contacts = new List<Contact>();
        for (Integer i = 0; i < 3; i++) {
            contacts.add(new Contact(
                FirstName = 'First' + i,
                LastName = 'Last' + i,
                AccountId = acc.Id
            ));
        }
        insert contacts;
    }
}
```

**When to use @TestSetup:**
- When multiple test methods need the same base data.
- When data creation is expensive (many records, related objects).
- When you want to keep each test method focused on a single scenario.

**When NOT to use @TestSetup:**
- When each test needs completely different data.
- When you have a single test method in the class.

---

## Test Data Factory

For complex test data shared across multiple test classes, create a dedicated factory class:

```java
@IsTest
public class TestDataFactory {

    public static Account createAccount(String name) {
        return new Account(Name = name, Industry = 'Technology');
    }

    public static List<Account> createAccounts(Integer count) {
        List<Account> accounts = new List<Account>();
        for (Integer i = 0; i < count; i++) {
            accounts.add(createAccount('Test Account ' + i));
        }
        return accounts;
    }

    public static Account createAccountWithContacts(String accountName, Integer contactCount) {
        Account acc = createAccount(accountName);
        insert acc;

        List<Contact> contacts = new List<Contact>();
        for (Integer i = 0; i < contactCount; i++) {
            contacts.add(new Contact(
                FirstName = 'First' + i,
                LastName = 'Last' + i,
                Email = 'contact' + i + '@example.com',
                AccountId = acc.Id
            ));
        }
        insert contacts;
        return acc;
    }

    public static Opportunity createOpportunity(Id accountId, String stageName, Date closeDate) {
        return new Opportunity(
            Name = 'Test Opportunity',
            AccountId = accountId,
            StageName = stageName,
            CloseDate = closeDate
        );
    }

    public static User createStandardUser() {
        Profile p = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
        return new User(
            FirstName = 'Test',
            LastName = 'StandardUser',
            Email = 'stduser@example.com',
            Username = 'stduser' + DateTime.now().getTime() + '@example.com',
            Alias = 'stdusr',
            TimeZoneSidKey = 'America/New_York',
            LocaleSidKey = 'en_US',
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'en_US',
            ProfileId = p.Id
        );
    }
}
```

**Usage in tests:**
```java
@IsTest
static void calculateRevenue_withOpportunities_returnsTotal() {
    Account acc = TestDataFactory.createAccountWithContacts('Acme', 2);
    List<Opportunity> opps = new List<Opportunity>{
        TestDataFactory.createOpportunity(acc.Id, 'Closed Won', Date.today()),
        TestDataFactory.createOpportunity(acc.Id, 'Prospecting', Date.today().addDays(30))
    };
    opps[0].Amount = 50000;
    opps[1].Amount = 75000;
    insert opps;

    Test.startTest();
    Decimal total = RevenueService.calculateTotalRevenue(acc.Id);
    Test.stopTest();

    Assert.areEqual(50000, total, 'Should only sum Closed Won opportunities');
}
```

---

## Assert Class (Modern Assertions)

Starting in API version 56.0, use the `Assert` class instead of `System.assertEquals`:

```java
// Equality
Assert.areEqual(expected, actual, 'Optional message');
Assert.areNotEqual(unexpected, actual, 'Values should differ');

// Null checks
Assert.isNull(value, 'Should be null');
Assert.isNotNull(value, 'Should not be null');

// Boolean checks
Assert.isTrue(condition, 'Condition should be true');
Assert.isFalse(condition, 'Condition should be false');

// Instance checks
Assert.isInstanceOfType(obj, Account.class, 'Should be an Account');

// Fail explicitly
Assert.fail('This code path should not be reached');
```

The `Assert` class provides clearer method names and better error messages than the legacy `System.assert*` methods.

---

## Testing Triggers

Test triggers by performing the DML that fires them, then asserting on the resulting data:

```java
@IsTest
private class AccountTriggerHandlerTest {

    @IsTest
    static void beforeInsert_setsDefaultDescription() {
        Account acc = new Account(Name = 'Test', Industry = 'Technology');
        // Description is blank

        Test.startTest();
        insert acc;
        Test.stopTest();

        Account result = [SELECT Description FROM Account WHERE Id = :acc.Id];
        Assert.areEqual('Auto-populated by trigger', result.Description,
            'Trigger should set default description');
    }

    @IsTest
    static void beforeUpdate_blocksGovernmentWithoutDUNS() {
        Account acc = new Account(Name = 'Test', Industry = 'Technology');
        insert acc;

        acc.Industry = 'Government';
        // DUNS_Number__c is blank — should trigger validation

        Test.startTest();
        try {
            update acc;
            Assert.fail('Should have thrown DmlException');
        } catch (DmlException e) {
            Assert.isTrue(e.getMessage().contains('DUNS Number'),
                'Error should mention DUNS Number');
        }
        Test.stopTest();
    }

    @IsTest
    static void afterUpdate_nameChange_updatesContacts() {
        Account acc = new Account(Name = 'Old Name');
        insert acc;
        Contact con = new Contact(FirstName = 'Test', LastName = 'Contact', AccountId = acc.Id);
        insert con;

        Test.startTest();
        acc.Name = 'New Name';
        update acc;
        Test.stopTest();

        Contact updatedCon = [SELECT Description FROM Contact WHERE Id = :con.Id];
        // Assert on whatever the trigger handler does to contacts
        Assert.isNotNull(updatedCon, 'Contact should still exist');
    }
}
```

---

## Testing Asynchronous Apex

`Test.stopTest()` forces async code to complete synchronously:

### Testing @future Methods

```java
@IsTest
static void futureMethod_processesRecords() {
    Account acc = new Account(Name = 'Test');
    insert acc;

    Test.startTest();
    AccountService.processAccountAsync(acc.Id); // @future method
    Test.stopTest(); // Future method executes here

    Account result = [SELECT Description FROM Account WHERE Id = :acc.Id];
    Assert.areEqual('Processed', result.Description);
}
```

### Testing Batch Apex

```java
@IsTest
static void batchJob_cleansUpOldRecords() {
    // Create test data
    List<Account> oldAccounts = new List<Account>();
    for (Integer i = 0; i < 50; i++) {
        oldAccounts.add(new Account(Name = 'Old ' + i, Last_Activity__c = Date.today().addDays(-365)));
    }
    insert oldAccounts;

    Test.startTest();
    Database.executeBatch(new AccountCleanupBatch(), 200);
    Test.stopTest(); // Batch execute() and finish() run here

    List<Account> remaining = [SELECT Id FROM Account WHERE Name LIKE 'Old%'];
    Assert.areEqual(0, remaining.size(), 'All old accounts should be deleted');
}
```

### Testing Queueable Apex

```java
@IsTest
static void queueableJob_calculatesRollups() {
    Account acc = TestDataFactory.createAccountWithContacts('Acme', 5);

    Test.startTest();
    System.enqueueJob(new ContactRollupQueueable(new Set<Id>{ acc.Id }));
    Test.stopTest();

    Account result = [SELECT Contact_Count__c FROM Account WHERE Id = :acc.Id];
    Assert.areEqual(5, result.Contact_Count__c, 'Should count 5 contacts');
}
```

---

## Testing HTTP Callouts

Apex tests cannot make real HTTP callouts. Use `HttpCalloutMock` to simulate responses:

### Mock Class

```java
@IsTest
public class ExternalServiceMock implements HttpCalloutMock {

    private Integer statusCode;
    private String body;

    public ExternalServiceMock(Integer statusCode, String body) {
        this.statusCode = statusCode;
        this.body = body;
    }

    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setStatusCode(this.statusCode);
        res.setHeader('Content-Type', 'application/json');
        res.setBody(this.body);
        return res;
    }
}
```

### Test Using the Mock

```java
@IsTest
static void callExternalService_success_returnsData() {
    String mockResponseBody = '{"status": "success", "count": 42}';
    Test.setMock(HttpCalloutMock.class, new ExternalServiceMock(200, mockResponseBody));

    Test.startTest();
    ExternalService.ApiResponse response = ExternalService.fetchData('accounts');
    Test.stopTest();

    Assert.areEqual('success', response.status);
    Assert.areEqual(42, response.count);
}

@IsTest
static void callExternalService_serverError_throwsException() {
    Test.setMock(HttpCalloutMock.class, new ExternalServiceMock(500, '{"error": "Internal"}'));

    Test.startTest();
    try {
        ExternalService.fetchData('accounts');
        Assert.fail('Should have thrown CalloutException');
    } catch (ExternalService.ServiceException e) {
        Assert.isTrue(e.getMessage().contains('500'), 'Should include status code');
    }
    Test.stopTest();
}
```

### Multi-Request Mock (StaticResourceCalloutMock)

For tests that make multiple callouts to different endpoints, implement routing in the mock:

```java
@IsTest
public class MultiEndpointMock implements HttpCalloutMock {

    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');

        if (req.getEndpoint().contains('/accounts')) {
            res.setStatusCode(200);
            res.setBody('{"accounts": []}');
        } else if (req.getEndpoint().contains('/contacts')) {
            res.setStatusCode(200);
            res.setBody('{"contacts": []}');
        } else {
            res.setStatusCode(404);
            res.setBody('{"error": "Not found"}');
        }
        return res;
    }
}
```

---

## Testing with System.runAs

Test code running under a specific user's permissions:

```java
@IsTest
static void standardUser_cannotDeleteAccounts() {
    User stdUser = TestDataFactory.createStandardUser();
    insert stdUser;

    Account acc = new Account(Name = 'Test');
    insert acc;

    System.runAs(stdUser) {
        Test.startTest();
        try {
            delete acc;
            Assert.fail('Standard user should not be able to delete');
        } catch (DmlException e) {
            Assert.isTrue(e.getMessage().contains('DELETE'),
                'Should be a delete permission error');
        }
        Test.stopTest();
    }
}
```

`System.runAs` is essential for testing:
- Sharing rules (`with sharing` enforcement).
- Profile/permission set restrictions.
- Mixed-DML operations (setup vs non-setup objects).

---

## Testing Negative Scenarios

Always test that code fails correctly:

```java
@IsTest
static void createContact_nullLastName_throwsDmlException() {
    Contact con = new Contact(FirstName = 'Test');
    // LastName is required — omitting it should fail

    Test.startTest();
    try {
        insert con;
        Assert.fail('Insert should fail without LastName');
    } catch (DmlException e) {
        Assert.isTrue(e.getMessage().contains('Last Name'),
            'Error should reference the missing field');
    }
    Test.stopTest();
}

@IsTest
static void getAccount_invalidId_throwsAuraHandledException() {
    Test.startTest();
    try {
        AccountController.getAccount('001000000000000AAA'); // non-existent
        Assert.fail('Should throw AuraHandledException');
    } catch (AuraHandledException e) {
        Assert.isTrue(e.getMessage().contains('not found'),
            'Should indicate record was not found');
    }
    Test.stopTest();
}
```

---

## Testing Best Practices Summary

| Practice | Why |
|---|---|
| Use `@TestSetup` for shared data | Reduces duplication, improves test speed |
| Use `TestDataFactory` for reusable data patterns | Consistency across test classes |
| Wrap code-under-test in `Test.startTest()` / `Test.stopTest()` | Resets governor limits, executes async code |
| Test both positive and negative paths | Ensures error handling works correctly |
| Assert on specific values, not just `!= null` | Catches subtle regressions |
| Use meaningful assertion messages | Makes failures easy to diagnose |
| Don't use `SeeAllData=true` unless necessary | Keeps tests isolated and portable |
| Test bulk scenarios (200+ records) | Validates bulkification |
| Use `System.runAs` for permission testing | Validates sharing and security |
| One test method per scenario | Makes failures easy to pinpoint |
