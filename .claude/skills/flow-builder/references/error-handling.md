# Error Handling

## Fault Connectors

Every DML element and action call supports `<faultConnector>` to route errors to a handler instead of crashing the flow.

### Elements That Support Fault Connectors

- `recordCreates` — Create Records
- `recordUpdates` — Update Records
- `recordDeletes` — Delete Records
- `recordLookups` — Get Records
- `actionCalls` — Apex actions, email alerts, notifications
- `subflows` — Subflow calls

### Basic Fault Connector

```xml
<recordUpdates>
    <name>Update_Account</name>
    <label>Update Account</label>
    <locationX>0</locationX>
    <locationY>0</locationY>
    <connector>
        <targetReference>Success_Path</targetReference>
    </connector>
    <faultConnector>
        <targetReference>Handle_Error</targetReference>
    </faultConnector>
    <inputReference>rec_Account</inputReference>
</recordUpdates>
```

### Rules

- Fault connectors CANNOT self-reference (cannot point back to the same element)
- Must route to a DIFFERENT element
- Every DML and action element MUST have a fault connector (best practice)
- If no fault connector is defined and an error occurs, the entire transaction rolls back

## $Flow.FaultMessage

The system variable `$Flow.FaultMessage` contains the error message when a fault path is triggered.

```xml
<elementReference>$Flow.FaultMessage</elementReference>
```

**Never expose raw `$Flow.FaultMessage` to end users** — it may contain technical details like field API names or governor limit messages.

## Error Handler Pattern

### Inline Error Handler (Simple)

Capture the error message in a variable for logging or display.

```xml
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
    <assignmentItems>
        <assignToReference>var_HasError</assignToReference>
        <operator>Assign</operator>
        <value>
            <booleanValue>true</booleanValue>
        </value>
    </assignmentItems>
    <connector>
        <targetReference>Log_Error_Or_Display</targetReference>
    </connector>
</assignments>
```

### Subflow Error Handler (Recommended for Reuse)

Create a dedicated error-handling subflow that all flows can call on fault paths.

**Calling flow:**

```xml
<assignments>
    <name>Capture_Error</name>
    <label>Capture Error</label>
    <locationX>0</locationX>
    <locationY>0</locationY>
    <assignmentItems>
        <assignToReference>var_ErrorMessage</assignToReference>
        <operator>Assign</operator>
        <value>
            <elementReference>$Flow.FaultMessage</elementReference>
        </value>
    </assignmentItems>
    <connector>
        <targetReference>Call_Error_Subflow</targetReference>
    </connector>
</assignments>
<subflows>
    <name>Call_Error_Subflow</name>
    <label>Call Error Subflow</label>
    <locationX>0</locationX>
    <locationY>0</locationY>
    <flowName>Sub_Error_Handler</flowName>
    <inputAssignments>
        <name>inp_ErrorMessage</name>
        <value>
            <elementReference>var_ErrorMessage</elementReference>
        </value>
    </inputAssignments>
    <inputAssignments>
        <name>inp_FlowName</name>
        <value>
            <stringValue>Auto_Account_Processing</stringValue>
        </value>
    </inputAssignments>
    <inputAssignments>
        <name>inp_RecordId</name>
        <value>
            <elementReference>$Record.Id</elementReference>
        </value>
    </inputAssignments>
</subflows>
```

**Error handler subflow (Sub_Error_Handler):**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Flow xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>66.0</apiVersion>
    <description>Centralized error handler — logs errors to a custom object</description>
    <interviewLabel>Sub_Error_Handler {!$Flow.CurrentDateTime}</interviewLabel>
    <label>Error Handler Subflow</label>
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
        <name>Log_Error</name>
        <label>Log Error</label>
        <locationX>0</locationX>
        <locationY>0</locationY>
        <inputAssignments>
            <field>Error_Message__c</field>
            <value>
                <elementReference>inp_ErrorMessage</elementReference>
            </value>
        </inputAssignments>
        <inputAssignments>
            <field>Flow_Name__c</field>
            <value>
                <elementReference>inp_FlowName</elementReference>
            </value>
        </inputAssignments>
        <inputAssignments>
            <field>Record_Id__c</field>
            <value>
                <elementReference>inp_RecordId</elementReference>
            </value>
        </inputAssignments>
        <object>Flow_Error_Log__c</object>
        <storeOutputAutomatically>true</storeOutputAutomatically>
    </recordCreates>
    <start>
        <locationX>0</locationX>
        <locationY>0</locationY>
        <connector>
            <targetReference>Log_Error</targetReference>
        </connector>
    </start>
    <status>Active</status>
    <variables>
        <name>inp_ErrorMessage</name>
        <dataType>String</dataType>
        <isCollection>false</isCollection>
        <isInput>true</isInput>
        <isOutput>false</isOutput>
    </variables>
    <variables>
        <name>inp_FlowName</name>
        <dataType>String</dataType>
        <isCollection>false</isCollection>
        <isInput>true</isInput>
        <isOutput>false</isOutput>
    </variables>
    <variables>
        <name>inp_RecordId</name>
        <dataType>String</dataType>
        <isCollection>false</isCollection>
        <isInput>true</isInput>
        <isOutput>false</isOutput>
    </variables>
</Flow>
```

## Screen Flow Error Display

In screen flows, route fault paths to a user-friendly error screen:

```xml
<screens>
    <name>Error_Screen</name>
    <label>Error</label>
    <locationX>0</locationX>
    <locationY>0</locationY>
    <allowBack>true</allowBack>
    <allowFinish>true</allowFinish>
    <allowPause>false</allowPause>
    <fields>
        <name>Display_Error</name>
        <fieldText>&lt;p&gt;&lt;b style=&quot;color: rgb(194, 57, 52);&quot;&gt;An error occurred.&lt;/b&gt;&lt;/p&gt;&lt;p&gt;Please try again or contact your administrator for assistance.&lt;/p&gt;</fieldText>
        <fieldType>DisplayText</fieldType>
    </fields>
    <showFooter>true</showFooter>
    <showHeader>true</showHeader>
</screens>
```

## Custom Error Element (Before-Save Only)

Available in before-save record-triggered flows. Shows validation-style errors on the record page.

### Field-Level Error

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

### Record-Level Error

```xml
<customErrors>
    <name>Reject_Record</name>
    <label>Reject Record</label>
    <locationX>0</locationX>
    <locationY>0</locationY>
    <customErrorMessages>
        <errorMessage>This record cannot be saved because required approvals are pending.</errorMessage>
        <isFieldError>false</isFieldError>
    </customErrorMessages>
</customErrors>
```

### Multiple Errors

```xml
<customErrors>
    <name>Reject_Multiple_Issues</name>
    <label>Reject Multiple Issues</label>
    <locationX>0</locationX>
    <locationY>0</locationY>
    <customErrorMessages>
        <errorMessage>Email is required.</errorMessage>
        <fieldSelection>Email</fieldSelection>
        <isFieldError>true</isFieldError>
    </customErrorMessages>
    <customErrorMessages>
        <errorMessage>Phone is required when source is Web.</errorMessage>
        <fieldSelection>Phone</fieldSelection>
        <isFieldError>true</isFieldError>
    </customErrorMessages>
</customErrors>
```

## Rollback Behavior

| Scenario | What Happens |
|---|---|
| Error with NO fault connector | Entire transaction rolls back (all DML reversed) |
| Error WITH fault connector | Failed DML rolls back, but previous successful DML in same transaction remains |
| Screen element | Creates a transaction boundary — completed transactions cannot be rolled back |
| Scheduled path | Runs in a separate transaction |
| `flowTransactionModel: NewTransaction` | Action runs in a new transaction boundary |

### Key Implications

1. **Before-save flows**: If the flow fails, the record save fails — no partial saves possible.
2. **After-save flows without fault connectors**: A failure rolls back everything including the triggering record save.
3. **After-save flows with fault connectors**: The triggering record save is preserved, but the failed DML in the flow is reversed.
4. **Screen flows**: Each screen creates a checkpoint. Users can go back, but completed DML cannot be undone by the flow.

## Error Handling Checklist

- [ ] Every `recordCreates` has a `<faultConnector>`
- [ ] Every `recordUpdates` has a `<faultConnector>`
- [ ] Every `recordDeletes` has a `<faultConnector>`
- [ ] Every `actionCalls` has a `<faultConnector>`
- [ ] `$Flow.FaultMessage` is captured in an assignment on each fault path
- [ ] Errors are logged (custom object, platform event, or notification)
- [ ] Screen flows show user-friendly error messages (not raw fault messages)
- [ ] Before-save flows use Custom Error elements for validation
- [ ] A centralized error-handling subflow exists for reuse
