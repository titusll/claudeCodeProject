---
name: apex-developer
description: >
  Best practice guide for writing Salesforce Apex classes, methods, triggers, and tests.
  Covers class structure, access modifiers, interfaces, abstract classes, enums, trigger
  handler patterns, bulkification, SOQL/SOSL queries, DML operations, governor limits,
  asynchronous Apex (future, batch, queueable, schedulable), unit testing with @TestSetup
  and data factories, CRUD/FLS security enforcement, sharing keywords, custom exceptions,
  and AuraHandledException for LWC integration.
  Use this skill whenever a user asks to create, modify, debug, or review any Apex class,
  trigger, test class, or server-side logic — even if they just say "write a controller",
  "add a trigger", "write tests", "query accounts", "batch job", or "fix the Apex error"
  without explicitly mentioning Apex.
  NOT for Lightning Web Components, Salesforce Flows,
  or declarative metadata like objects/fields/permissions.
---

# Apex Developer Guide

## General Principles

- All Apex classes live under `force-app/main/default/classes/`. Triggers live under `force-app/main/default/triggers/`.
- Every `.cls` file has a companion `.cls-meta.xml` metadata file specifying the API version.
- Use the API version defined in `sfdx-project.json` (read it at the start of each task). If unknown, default to **66.0**.
- Write **bulkified** code from the start. Every method that touches records should work correctly whether it receives 1 record or 200. Never write SOQL, DML, or callouts inside a loop.
- Use `with sharing` by default to enforce the running user's record-level security. Only use `without sharing` when you have a documented business reason (e.g., a service class that must access records the user cannot see) and explain it in a comment.
- Enforce field-level security (CRUD/FLS) at system boundaries — Apex controllers called from LWC, REST endpoints, and Visualforce controllers. Internal service classes called only from other Apex can rely on the caller's enforcement.
- Follow the **single responsibility principle** — one class does one job. Separate controller logic, service/business logic, data access (selector/query), and domain logic into distinct classes.
- Prefer `Database.insert(records, false)` (partial success) over bare `insert records` when processing user-submitted batches — this lets you report per-record errors instead of failing the entire operation.
- Always handle errors explicitly. Catch specific exception types when possible. For Apex called from LWC, wrap errors in `AuraHandledException` so the client receives a readable message.
- Never hardcode record IDs, org-specific URLs, or credentials. Use Custom Metadata Types, Custom Labels, Custom Settings, or Named Credentials instead.

## Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Class (general) | PascalCase, descriptive noun/noun-phrase | `AccountService`, `InvoiceLineItemSelector` |
| Controller (LWC/Aura) | PascalCase ending in `Controller` | `ContactListController` |
| Trigger | PascalCase: `<Object>Trigger` | `AccountTrigger`, `Case_Trigger` |
| Trigger Handler | PascalCase: `<Object>TriggerHandler` | `AccountTriggerHandler` |
| Test class | Mirror the class under test + `Test` suffix | `AccountServiceTest`, `AccountTriggerHandlerTest` |
| Interface | PascalCase, often prefixed with `I` or descriptive | `ITriggerHandler`, `Schedulable` |
| Batch class | PascalCase ending in `Batch` | `AccountCleanupBatch` |
| Queueable class | PascalCase ending in `Queueable` or `Job` | `OpportunityRollupQueueable` |
| Schedulable class | PascalCase ending in `Scheduler` or `Schedule` | `DailyCleanupScheduler` |
| Method | camelCase, verb-first | `getAccountsByIds`, `calculateTotal`, `sendNotification` |
| Constant | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `DEFAULT_PAGE_SIZE` |
| Variable | camelCase | `accountList`, `totalAmount`, `isProcessed` |

## Class Metadata File

Every Apex class needs a `-meta.xml` companion:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>66.0</apiVersion>
    <status>Active</status>
</ApexClass>
```

Trigger metadata file:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ApexTrigger xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>66.0</apiVersion>
    <status>Active</status>
</ApexTrigger>
```

## Code Organisation Patterns

Organise Apex code into layers to keep responsibilities clear:

| Layer | Purpose | Example Class |
|---|---|---|
| **Controller** | Handle LWC/Aura/VF requests, enforce security, delegate to services | `AccountController` |
| **Service** | Business logic, orchestration, cross-object operations | `AccountService` |
| **Selector** | SOQL queries, encapsulate data access | `AccountSelector` |
| **Domain / Handler** | Object-specific logic, trigger handlers, validation | `AccountTriggerHandler` |
| **Utility** | Shared helpers (error formatting, date math, etc.) | `ApexErrorUtility` |

A controller should never contain SOQL directly — delegate to a selector. A trigger should never contain business logic directly — delegate to a handler.

## Reference Files

Detailed templates, code examples, and pattern-specific guidance live in `references/`. Read the relevant file when working on that area:

| When you need to... | Read |
|---|---|
| Write classes, interfaces, abstract classes, enums, or understand access modifiers and properties | `references/classes-and-interfaces.md` |
| Create triggers or implement a trigger handler framework | `references/triggers-and-handlers.md` |
| Write SOQL/SOSL queries or perform DML operations | `references/soql-and-dml.md` |
| Write unit tests, test data factories, or mock HTTP callouts | `references/testing.md` |
| Understand governor limits, bulkification, or write async Apex (future, batch, queueable, schedulable) | `references/governor-limits-and-async.md` |
| Enforce security (sharing, CRUD/FLS), handle exceptions, or throw AuraHandledException for LWC | `references/security-and-error-handling.md` |

## Pre-Generation Checklist

Before writing any Apex, confirm these details with the user — do not assume defaults:

- Class name and purpose (controller, service, selector, batch, test, etc.)
- Which objects and fields it will operate on
- Whether it will be called from LWC/Aura (needs `@AuraEnabled` methods) or used server-side only
- For controllers: which methods need `cacheable=true` (read-only, wire-compatible) vs imperative (DML)
- For triggers: which events to handle (before insert, after update, etc.) and whether a handler framework already exists in the project
- For batch/schedulable: scope size, scheduling frequency, error handling approach
- Whether it needs to make HTTP callouts (requires `@future(callout=true)` or `Queueable` with `Database.AllowsCallouts`)
- Whether a test class should be created alongside the class
- Target code coverage expectations (Salesforce requires 75% minimum; aim for meaningful coverage, not just line coverage)
- Error handling approach (fail-fast, partial success, custom exception types)
- Whether Custom Metadata Types or Custom Settings are needed for configuration

## Deploy Commands

```bash
# Deploy a specific class
sf project deploy start --source-dir force-app/main/default/classes/AccountService.cls
sf project deploy start --source-dir force-app/main/default/classes/AccountService.cls-meta.xml

# Deploy all classes
sf project deploy start --source-dir force-app/main/default/classes

# Deploy a specific trigger
sf project deploy start --source-dir force-app/main/default/triggers

# Deploy and run tests
sf project deploy start --source-dir force-app/main/default/classes --test-level RunLocalTests

# Run specific test class
sf apex run test --class-names AccountServiceTest --result-format human --wait 10

# Run all local tests
sf apex run test --test-level RunLocalTests --result-format human --wait 10

# Execute anonymous Apex
sf apex run --file scripts/apex/hello.apex

# Validate without deploying (dry-run with test execution)
sf project deploy start --source-dir force-app --dry-run --test-level RunLocalTests
```

## Quick Links

- [Apex Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/)
- [Apex Reference (System Namespace)](https://developer.salesforce.com/docs/atlas.en-us.apexref.meta/apexref/)
- [SOQL and SOSL Reference](https://developer.salesforce.com/docs/atlas.en-us.soql_sosl.meta/soql_sosl/)
- [Testing Apex](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_testing.htm)
- [Governor Limits](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_gov_limits.htm)
- [Security and Sharing](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_security_sharing_chapter.htm)
- [Batch Apex](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_batch_interface.htm)
- [Platform Events](https://developer.salesforce.com/docs/atlas.en-us.platform_events.meta/platform_events/)
