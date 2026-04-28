---
name: flow-builder
description: >
  Best practice guide for building Salesforce flows in SFDX source format (XML).
  Covers screen flows, record-triggered flows (before-save and after-save),
  autolaunched flows, scheduled flows, subflows, flow elements (screens, decisions,
  loops, assignments, record operations, action calls), variables, formulas,
  error handling, and bulkification.
  Use this skill whenever a user asks to create, modify, or troubleshoot any
  Salesforce flow — even if they just say "build a flow", "add a screen",
  "trigger on record save" without explicitly
  mentioning flow metadata format.
  NOT for Salesforce declarative configuration metadata (objects, fields, permissions,
  layouts) — use the salesforce-configuration skill for those.
---

# Salesforce Flow Builder Guide

## General Principles

- All flow metadata MUST be in **SFDX source format** (`.flow-meta.xml` files).
- Every XML file MUST begin with `<?xml version="1.0" encoding="UTF-8"?>`.
- Every root `<Flow>` element MUST include the namespace: `xmlns="http://soap.sforce.com/2006/04/metadata"`.
- Use the API version defined in `sfdx-project.json` (read it at the start of each task). If unknown, default to **66.0**.
- Use **Auto-Layout Canvas** (`AUTO_LAYOUT_CANVAS`) — produces cleaner git diffs (all `locationX/Y = 0`).
- Sort XML child elements alphabetically within their parent to reduce noisy diffs.
- File location: `force-app/main/default/flows/<FlowApiName>.flow-meta.xml`

## Flow Types

| Flow Type | `<processType>` | Identified By |
|---|---|---|
| Screen Flow | `Flow` | Contains `<screens>` elements |
| Record-Triggered (Before-Save) | `AutoLaunchedFlow` | `<triggerType>RecordBeforeSave</triggerType>` |
| Record-Triggered (After-Save) | `AutoLaunchedFlow` | `<triggerType>RecordAfterSave</triggerType>` |
| Record-Triggered (Before-Delete) | `AutoLaunchedFlow` | `<triggerType>RecordBeforeDelete</triggerType>` |
| Scheduled Flow | `AutoLaunchedFlow` | `<triggerType>Scheduled</triggerType>` |
| Platform Event-Triggered | `AutoLaunchedFlow` | `<triggerType>PlatformEvent</triggerType>` |
| Autolaunched / Subflow | `AutoLaunchedFlow` | No `triggerType` in `<start>` |

## Naming Conventions

| Type | Flow API Name Prefix | Example |
|---|---|---|
| Record-Triggered (After) | `Auto_` | `Auto_Lead_Assignment` |
| Record-Triggered (Before) | `Before_` | `Before_Lead_Validate` |
| Screen Flow | `Screen_` | `Screen_New_Customer` |
| Scheduled | `Sched_` | `Sched_Daily_Cleanup` |
| Platform Event | `Event_` | `Event_Order_Completed` |
| Subflow / Utility | `Sub_` or `Util_` | `Sub_Error_Handler` |

### Variable Naming Prefixes

| Prefix | Usage | Example |
|---|---|---|
| `var_` | Simple variables (String, Number, Boolean, Date) | `var_AccountName` |
| `rec_` | Single SObject record variables | `rec_Account` |
| `col_` | Collection variables (SObject or primitive) | `col_Contacts` |
| `inp_` | Input variables | `inp_RecordId` |
| `out_` | Output variables | `out_CreatedId` |
| `frml_` | Formula resources | `frml_FullName` |
| `txt_` | Text templates | `txt_EmailBody` |
| `const_` | Constants | `const_MaxRetries` |
| `choice_` | Choice resources | `choice_High` |
| `dcs_` | Dynamic choice sets | `dcs_ActiveAccounts` |

### Element Naming

Use descriptive, action-oriented labels: `Get Active Contacts for Account`, `Check If High Priority`, `Update Contact Email Addresses` — not `Decision 1`, `Assignment 3`.

## Run Modes

| Mode | Value | Default For |
|---|---|---|
| User context | `DefaultMode` | Screen Flows |
| System with sharing | `SystemModeWithSharing` | — |
| System without sharing | `SystemModeWithoutSharing` | Record-Triggered Flows |

## Best Practices Summary

### Bulkification (Critical)

1. **NEVER put DML inside loops** — collect records in a collection variable, perform one DML after the loop.
2. **NEVER put SOQL inside loops** — query all needed records before the loop.
3. **Combine DML operations** — one `recordCreates` per object type using collection variables.
4. **Use before-save for same-record updates** — zero DML cost.
5. **Use Collection Processors (Transform)** instead of loops for filtering/sorting — 30-50% faster.

### Error Handling (Required)

- Every DML element (`recordCreates`, `recordUpdates`, `recordDeletes`) MUST have a `<faultConnector>`.
- Every `actionCalls` element MUST have a `<faultConnector>`.
- Capture `$Flow.FaultMessage` in an assignment on the fault path.
- Create a reusable error-handling subflow for centralized logging.
- In screen flows, display user-friendly error messages — never expose raw `$Flow.FaultMessage`.

### Null Handling

- Add a Decision after every `recordLookups` to check if records were found.
- Set `assignNullValuesIfNoRecordsFound` to `false`.
- In formulas, use `IF(ISBLANK(...), defaultValue, ...)` — `BLANKVALUE()` is NOT supported in flows.

### Security

- Set `storeOutputAutomatically` to `false` on `recordLookups` — explicitly select fields via `queriedFields`.
- Never hardcode Salesforce record IDs.
- Record-triggered flows run in system context — they bypass sharing and FLS.

### Governor Limits

| Limit | Maximum |
|---|---|
| SOQL queries per transaction | 100 |
| DML statements per transaction | 150 |
| Records retrieved by SOQL | 50,000 |
| Records modified by DML | 10,000 |
| CPU time | 10,000 ms |

## Required processMetadataValues

Always include these in every flow:

```xml
<processMetadataValues>
    <name>BuilderType</name>
    <value>
        <stringValue>LightningFlowBuilder</stringValue>
    </value>
</processMetadataValues>
<processMetadataValues>
    <name>CanvasMode</name>
    <value>
        <stringValue>AUTO_LAYOUT_CANVAS</stringValue>
    </value>
</processMetadataValues>
<processMetadataValues>
    <name>OriginBuilderType</name>
    <value>
        <stringValue>LightningFlowBuilder</stringValue>
    </value>
</processMetadataValues>
```

## Reference Files

Detailed XML templates and element-specific guidance live in `references/`. Read the relevant file when working on that area:

| When you need to... | Read |
|---|---|
| Build a screen flow (screens, navigation, input/output, choices) | `references/screen-flows.md` |
| Build a record-triggered flow (before/after save, entry criteria, scheduled paths) | `references/record-triggered-flows.md` |
| Use flow elements (assignments, decisions, loops, DML, actions, subflows) | `references/flow-elements.md` |
| Define variables, formulas, text templates, constants, or choices | `references/variables-and-resources.md` |
| Implement error handling (fault connectors, rollback, custom errors) | `references/error-handling.md` |

## Pre-Generation Checklist

Before writing any flow file, confirm these details with the user:

- Flow type (screen, record-triggered before/after, scheduled, subflow)
- For record-triggered: object, trigger event (create/update/delete), entry criteria
- For screen flows: what screens are needed, what fields to collect, navigation requirements
- What record operations are needed (Get/Create/Update/Delete)
- Whether error handling should use a centralized subflow or inline fault paths
- Whether the flow should be deployed as Active or Draft
- Run mode (user context vs system context)

## Deploy Commands

```bash
# Deploy a specific flow
sf project deploy start --source-dir force-app/main/default/flows/Auto_Lead_Assignment.flow-meta.xml

# Deploy all flows
sf project deploy start --source-dir force-app/main/default/flows

# Validate without deploying
sf project deploy start --source-dir force-app/main/default/flows --dry-run
```

## Quick Links

- [Flow Metadata API Reference](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_visual_workflow.htm)
- [Record-Triggered Flow Concepts](https://help.salesforce.com/s/articleView?id=platform.flow_concepts_trigger_record.htm)
- [Configure LWC for Flow Screens](https://developer.salesforce.com/docs/platform/lwc/guide/use-config-for-flow-screens.html)
- [Flow Limits and Considerations](https://help.salesforce.com/s/articleView?id=sf.flow_considerations.htm)
