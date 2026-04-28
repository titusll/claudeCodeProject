# Record-Triggered Flows

Record-triggered flows use `<processType>AutoLaunchedFlow</processType>` and are identified by the `triggerType` in the `<start>` element.

## Before-Save vs After-Save

| Aspect | Before-Save | After-Save |
|---|---|---|
| `triggerType` | `RecordBeforeSave` | `RecordAfterSave` |
| Same-record updates | Direct assignment to `$Record` (zero DML) | Requires a separate Update Records element (costs DML) |
| DML operations | NOT allowed | Allowed |
| Action calls | NOT allowed | Allowed |
| Subflow calls | NOT allowed | Allowed |
| Screen elements | NOT allowed | NOT allowed |
| Scheduled paths | NOT available | Available |
| Custom Error element | Available | NOT available |
| Available elements | Assignment, Decision, Loop, Get Records, Formulas | All flow elements |

**Rule of thumb**: Use before-save for same-record field updates and validation. Use after-save for everything else (related record operations, callouts, notifications).

## Record Context Variables

These are automatically available in record-triggered flows:

| Variable | Description | Available In |
|---|---|---|
| `$Record` | The triggering record (current values) | All record-triggered flows |
| `$Record__Prior` | Previous field values (before the change) | Update triggers only |

Reference in XML: `<elementReference>$Record.FieldName</elementReference>`

## Trigger Types

| `<recordTriggerType>` | When It Fires |
|---|---|
| `Create` | Only when a record is created |
| `Update` | Only when a record is updated |
| `CreateAndUpdate` | On both create and update |
| `Delete` | On record deletion (before-delete only) |

## Before-Save Record-Triggered Flow

### Skeleton

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Flow xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>66.0</apiVersion>
    <assignments>
        <name>Set_Default_Fields</name>
        <label>Set Default Fields</label>
        <locationX>0</locationX>
        <locationY>0</locationY>
        <assignmentItems>
            <assignToReference>$Record.Description</assignToReference>
            <operator>Assign</operator>
            <value>
                <elementReference>frml_DefaultDescription</elementReference>
            </value>
        </assignmentItems>
    </assignments>
    <description>Sets default field values on Account creation</description>
    <formulas>
        <name>frml_DefaultDescription</name>
        <dataType>String</dataType>
        <expression>&quot;Created on &quot; &amp; TEXT({!$Record.CreatedDate})</expression>
    </formulas>
    <interviewLabel>Before_Account_Defaults {!$Flow.CurrentDateTime}</interviewLabel>
    <label>Before Account Defaults</label>
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
    <processType>AutoLaunchedFlow</processType>
    <start>
        <locationX>0</locationX>
        <locationY>0</locationY>
        <connector>
            <targetReference>Set_Default_Fields</targetReference>
        </connector>
        <object>Account</object>
        <recordTriggerType>Create</recordTriggerType>
        <triggerType>RecordBeforeSave</triggerType>
    </start>
    <status>Draft</status>
</Flow>
```

### Before-Save with Entry Conditions (Filters)

```xml
<start>
    <locationX>0</locationX>
    <locationY>0</locationY>
    <connector>
        <targetReference>First_Element</targetReference>
    </connector>
    <filterLogic>and</filterLogic>
    <filters>
        <field>Status__c</field>
        <operator>EqualTo</operator>
        <value>
            <stringValue>New</stringValue>
        </value>
    </filters>
    <filters>
        <field>Type</field>
        <operator>NotEqualTo</operator>
        <value>
            <stringValue>Internal</stringValue>
        </value>
    </filters>
    <object>Case</object>
    <recordTriggerType>Create</recordTriggerType>
    <triggerType>RecordBeforeSave</triggerType>
</start>
```

### Before-Save with Custom Error (Validation)

```xml
<customErrors>
    <name>Reject_Invalid_Amount</name>
    <label>Reject Invalid Amount</label>
    <locationX>0</locationX>
    <locationY>0</locationY>
    <customErrorMessages>
        <errorMessage>Amount must be greater than zero.</errorMessage>
        <fieldSelection>Amount</fieldSelection>
        <isFieldError>true</isFieldError>
    </customErrorMessages>
</customErrors>
```

## After-Save Record-Triggered Flow

### Skeleton

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Flow xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>66.0</apiVersion>
    <description>Creates a follow-up Task when an Opportunity is closed won</description>
    <interviewLabel>Auto_Opp_ClosedWon_Task {!$Flow.CurrentDateTime}</interviewLabel>
    <label>Auto Opp Closed Won Task</label>
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
    <processType>AutoLaunchedFlow</processType>
    <recordCreates>
        <name>Create_Follow_Up_Task</name>
        <label>Create Follow Up Task</label>
        <locationX>0</locationX>
        <locationY>0</locationY>
        <faultConnector>
            <targetReference>Handle_Error</targetReference>
        </faultConnector>
        <inputAssignments>
            <field>ActivityDate</field>
            <value>
                <elementReference>frml_DueDate</elementReference>
            </value>
        </inputAssignments>
        <inputAssignments>
            <field>OwnerId</field>
            <value>
                <elementReference>$Record.OwnerId</elementReference>
            </value>
        </inputAssignments>
        <inputAssignments>
            <field>Subject</field>
            <value>
                <stringValue>Follow up on closed opportunity</stringValue>
            </value>
        </inputAssignments>
        <inputAssignments>
            <field>WhatId</field>
            <value>
                <elementReference>$Record.Id</elementReference>
            </value>
        </inputAssignments>
        <object>Task</object>
        <storeOutputAutomatically>true</storeOutputAutomatically>
    </recordCreates>
    <formulas>
        <name>frml_DueDate</name>
        <dataType>Date</dataType>
        <expression>{!$Record.CloseDate} + 7</expression>
    </formulas>
    <start>
        <locationX>0</locationX>
        <locationY>0</locationY>
        <connector>
            <targetReference>Create_Follow_Up_Task</targetReference>
        </connector>
        <doesRequireRecordChangedToMeetCriteria>true</doesRequireRecordChangedToMeetCriteria>
        <filterLogic>and</filterLogic>
        <filters>
            <field>StageName</field>
            <operator>EqualTo</operator>
            <value>
                <stringValue>Closed Won</stringValue>
            </value>
        </filters>
        <object>Opportunity</object>
        <recordTriggerType>CreateAndUpdate</recordTriggerType>
        <triggerType>RecordAfterSave</triggerType>
    </start>
    <status>Draft</status>
    <!-- Error handler (see error-handling.md for full pattern) -->
    <assignments>
        <name>Handle_Error</name>
        <label>Handle Error</label>
        <locationX>0</locationX>
        <locationY>0</locationY>
        <assignmentItems>
            <assignToReference>var_ErrorMessage</assignToReference>
            <operator>Assign</operator>
            <value>
                <elementReference>$Flow.FaultMessage</elementReference>
            </value>
        </assignmentItems>
    </assignments>
    <variables>
        <name>var_ErrorMessage</name>
        <dataType>String</dataType>
        <isCollection>false</isCollection>
        <isInput>false</isInput>
        <isOutput>false</isOutput>
    </variables>
</Flow>
```

## Entry Criteria Options

### Option 1: Filter Conditions

```xml
<start>
    <locationX>0</locationX>
    <locationY>0</locationY>
    <connector>
        <targetReference>First_Element</targetReference>
    </connector>
    <filterLogic>1 AND (2 OR 3)</filterLogic>
    <filters>
        <field>IsActive__c</field>
        <operator>EqualTo</operator>
        <value>
            <booleanValue>true</booleanValue>
        </value>
    </filters>
    <filters>
        <field>Type</field>
        <operator>EqualTo</operator>
        <value>
            <stringValue>Customer</stringValue>
        </value>
    </filters>
    <filters>
        <field>Type</field>
        <operator>EqualTo</operator>
        <value>
            <stringValue>Partner</stringValue>
        </value>
    </filters>
    <object>Account</object>
    <recordTriggerType>CreateAndUpdate</recordTriggerType>
    <triggerType>RecordAfterSave</triggerType>
</start>
```

**Filter operators**: `EqualTo`, `NotEqualTo`, `GreaterThan`, `GreaterThanOrEqualTo`, `LessThan`, `LessThanOrEqualTo`, `Contains`, `StartsWith`, `EndsWith`, `IsNull`, `IsChanged` (updates only), `WasSet`

**Filter logic**: `and`, `or`, or custom logic using 1-based indices (e.g., `1 AND (2 OR 3)`)

### Option 2: Formula Condition

```xml
<start>
    <locationX>0</locationX>
    <locationY>0</locationY>
    <connector>
        <targetReference>First_Element</targetReference>
    </connector>
    <doesRequireRecordChangedToMeetCriteria>true</doesRequireRecordChangedToMeetCriteria>
    <entryConditionFormula>{!$Record.Amount} > 50000 &amp;&amp; NOT(ISBLANK({!$Record.CloseDate}))</entryConditionFormula>
    <object>Opportunity</object>
    <recordTriggerType>CreateAndUpdate</recordTriggerType>
    <triggerType>RecordAfterSave</triggerType>
</start>
```

### doesRequireRecordChangedToMeetCriteria

When `true`, the flow only runs when a record update causes the criteria to become **newly met** — not on every save that already meets criteria. This prevents re-firing on unrelated field changes.

## Trigger Order

Controls execution order when multiple flows fire on the same object/event:

```xml
<start>
    ...
    <object>Account</object>
    <recordTriggerType>CreateAndUpdate</recordTriggerType>
    <triggerType>RecordAfterSave</triggerType>
    <triggerOrder>10</triggerOrder>
</start>
```

Values: 1-2000. Lower numbers execute first. Use increments of 10 to allow future insertions.

## Scheduled Paths (After-Save Only)

Scheduled paths execute asynchronously at a future time relative to the trigger event or a record field.

```xml
<start>
    <locationX>0</locationX>
    <locationY>0</locationY>
    <connector>
        <targetReference>Immediate_Action</targetReference>
    </connector>
    <object>Opportunity</object>
    <recordTriggerType>CreateAndUpdate</recordTriggerType>
    <scheduledPaths>
        <name>Three_Days_Before_Close</name>
        <connector>
            <targetReference>Send_Reminder</targetReference>
        </connector>
        <label>3 Days Before Close</label>
        <offsetNumber>-3</offsetNumber>
        <offsetUnit>Days</offsetUnit>
        <recordField>CloseDate</recordField>
        <timeSource>RecordField</timeSource>
    </scheduledPaths>
    <scheduledPaths>
        <name>One_Hour_After_Create</name>
        <connector>
            <targetReference>Follow_Up_Action</targetReference>
        </connector>
        <label>1 Hour After Create</label>
        <offsetNumber>1</offsetNumber>
        <offsetUnit>Hours</offsetUnit>
        <timeSource>RecordTriggerEvent</timeSource>
    </scheduledPaths>
    <triggerType>RecordAfterSave</triggerType>
</start>
```

| Property | Description |
|---|---|
| `timeSource` | `RecordField` (relative to a date/datetime field) or `RecordTriggerEvent` (relative to when the trigger fired) |
| `offsetUnit` | `Hours`, `Days`, or `Minutes` |
| `offsetNumber` | Positive (after) or negative (before) integer |
| `recordField` | The date/datetime field (required when `timeSource` is `RecordField`) |

## Complete Before-Save Example: Lead Validation and Defaults

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Flow xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>66.0</apiVersion>
    <assignments>
        <name>Set_Lead_Defaults</name>
        <label>Set Lead Defaults</label>
        <locationX>0</locationX>
        <locationY>0</locationY>
        <assignmentItems>
            <assignToReference>$Record.LeadSource</assignToReference>
            <operator>Assign</operator>
            <value>
                <stringValue>Web</stringValue>
            </value>
        </assignmentItems>
        <assignmentItems>
            <assignToReference>$Record.Rating</assignToReference>
            <operator>Assign</operator>
            <value>
                <stringValue>Warm</stringValue>
            </value>
        </assignmentItems>
    </assignments>
    <customErrors>
        <name>Reject_Missing_Email</name>
        <label>Reject Missing Email</label>
        <locationX>0</locationX>
        <locationY>0</locationY>
        <customErrorMessages>
            <errorMessage>Email is required for web leads.</errorMessage>
            <fieldSelection>Email</fieldSelection>
            <isFieldError>true</isFieldError>
        </customErrorMessages>
    </customErrors>
    <decisions>
        <name>Check_Email_Provided</name>
        <label>Check Email Provided</label>
        <locationX>0</locationX>
        <locationY>0</locationY>
        <defaultConnector>
            <targetReference>Reject_Missing_Email</targetReference>
        </defaultConnector>
        <defaultConnectorLabel>No Email</defaultConnectorLabel>
        <rules>
            <name>Has_Email</name>
            <conditionLogic>and</conditionLogic>
            <conditions>
                <leftValueReference>$Record.Email</leftValueReference>
                <operator>IsNull</operator>
                <rightValue>
                    <booleanValue>false</booleanValue>
                </rightValue>
            </conditions>
            <connector>
                <targetReference>Set_Lead_Defaults</targetReference>
            </connector>
            <label>Has Email</label>
        </rules>
    </decisions>
    <description>Validates email is present and sets default fields on new leads</description>
    <interviewLabel>Before_Lead_Validate {!$Flow.CurrentDateTime}</interviewLabel>
    <label>Before Lead Validate</label>
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
    <processType>AutoLaunchedFlow</processType>
    <start>
        <locationX>0</locationX>
        <locationY>0</locationY>
        <connector>
            <targetReference>Check_Email_Provided</targetReference>
        </connector>
        <object>Lead</object>
        <recordTriggerType>Create</recordTriggerType>
        <triggerType>RecordBeforeSave</triggerType>
    </start>
    <status>Draft</status>
</Flow>
```
