# Flow Elements

All flow elements share common properties: `<name>`, `<label>`, `<locationX>`, `<locationY>`, and a `<connector>` to the next element.

## Connectors

All element-to-element navigation uses `<connector>` with `<targetReference>`:

```xml
<connector>
    <targetReference>Next_Element_Name</targetReference>
</connector>
```

## Assignments

Set or modify variable values.

```xml
<assignments>
    <name>Set_Account_Fields</name>
    <label>Set Account Fields</label>
    <locationX>0</locationX>
    <locationY>0</locationY>
    <assignmentItems>
        <assignToReference>rec_Account.Name</assignToReference>
        <operator>Assign</operator>
        <value>
            <stringValue>New Account Name</stringValue>
        </value>
    </assignmentItems>
    <assignmentItems>
        <assignToReference>rec_Account.Industry</assignToReference>
        <operator>Assign</operator>
        <value>
            <elementReference>var_Industry</elementReference>
        </value>
    </assignmentItems>
    <connector>
        <targetReference>Next_Element</targetReference>
    </connector>
</assignments>
```

### Assignment Operators

| Operator | Usage |
|---|---|
| `Assign` | Set value |
| `Add` | Add to number/currency/date |
| `Subtract` | Subtract from number/currency/date |
| `AddItem` | Add item to collection |
| `RemoveFirst` | Remove first matching item from collection |
| `RemoveAll` | Remove all matching items from collection |
| `RemoveAfterFirst` | Remove all after first match |
| `RemovePosition` | Remove item at specific position |

### Adding to a Collection

```xml
<assignmentItems>
    <assignToReference>col_ContactsToUpdate</assignToReference>
    <operator>AddItem</operator>
    <value>
        <elementReference>rec_CurrentContact</elementReference>
    </value>
</assignmentItems>
```

## Decisions

Branch flow execution based on conditions.

```xml
<decisions>
    <name>Check_Status</name>
    <label>Check Status</label>
    <locationX>0</locationX>
    <locationY>0</locationY>
    <defaultConnector>
        <targetReference>Default_Path</targetReference>
    </defaultConnector>
    <defaultConnectorLabel>Default Outcome</defaultConnectorLabel>
    <rules>
        <name>Is_Active</name>
        <conditionLogic>and</conditionLogic>
        <conditions>
            <leftValueReference>rec_Account.Status__c</leftValueReference>
            <operator>EqualTo</operator>
            <rightValue>
                <stringValue>Active</stringValue>
            </rightValue>
        </conditions>
        <connector>
            <targetReference>Active_Path</targetReference>
        </connector>
        <label>Is Active</label>
    </rules>
    <rules>
        <name>Is_Inactive</name>
        <conditionLogic>and</conditionLogic>
        <conditions>
            <leftValueReference>rec_Account.Status__c</leftValueReference>
            <operator>EqualTo</operator>
            <rightValue>
                <stringValue>Inactive</stringValue>
            </rightValue>
        </conditions>
        <connector>
            <targetReference>Inactive_Path</targetReference>
        </connector>
        <label>Is Inactive</label>
    </rules>
</decisions>
```

### Condition Operators

| Operator | Description |
|---|---|
| `EqualTo` | Equals |
| `NotEqualTo` | Not equals |
| `GreaterThan` | Greater than |
| `GreaterThanOrEqualTo` | Greater than or equal |
| `LessThan` | Less than |
| `LessThanOrEqualTo` | Less than or equal |
| `Contains` | Contains substring |
| `StartsWith` | Starts with |
| `EndsWith` | Ends with |
| `IsNull` | Is null (use `booleanValue` true/false) |
| `IsChanged` | Field changed (record-triggered only) |
| `WasSet` | Field was previously set |

### Condition Logic

- `and` — all conditions must be true
- `or` — any condition can be true
- Custom: `1 AND (2 OR 3)` — 1-based indices referencing condition order

## Loops

Iterate over a collection.

```xml
<loops>
    <name>Loop_Contacts</name>
    <label>Loop Contacts</label>
    <locationX>0</locationX>
    <locationY>0</locationY>
    <collectionReference>col_Contacts</collectionReference>
    <iterationOrder>Asc</iterationOrder>
    <nextValueConnector>
        <targetReference>Process_Contact</targetReference>
    </nextValueConnector>
    <noMoreValuesConnector>
        <targetReference>After_Loop</targetReference>
    </noMoreValuesConnector>
</loops>
```

- `collectionReference` — the collection to iterate over
- `iterationOrder` — `Asc` or `Desc`
- `nextValueConnector` — element to execute for each item
- `noMoreValuesConnector` — element to execute after loop completes
- The current item is automatically available as the loop variable

**CRITICAL**: Never put DML or SOQL elements inside a loop. Collect records in a collection variable inside the loop, then perform DML after the loop.

## Record Lookups (Get Records)

Query records from the database.

```xml
<recordLookups>
    <name>Get_Active_Contacts</name>
    <label>Get Active Contacts</label>
    <locationX>0</locationX>
    <locationY>0</locationY>
    <assignNullValuesIfNoRecordsFound>false</assignNullValuesIfNoRecordsFound>
    <connector>
        <targetReference>Next_Element</targetReference>
    </connector>
    <faultConnector>
        <targetReference>Error_Handler</targetReference>
    </faultConnector>
    <filterLogic>and</filterLogic>
    <filters>
        <field>AccountId</field>
        <operator>EqualTo</operator>
        <value>
            <elementReference>inp_RecordId</elementReference>
        </value>
    </filters>
    <filters>
        <field>IsActive__c</field>
        <operator>EqualTo</operator>
        <value>
            <booleanValue>true</booleanValue>
        </value>
    </filters>
    <getFirstRecordOnly>false</getFirstRecordOnly>
    <object>Contact</object>
    <queriedFields>Id</queriedFields>
    <queriedFields>FirstName</queriedFields>
    <queriedFields>LastName</queriedFields>
    <queriedFields>Email</queriedFields>
    <sortField>LastName</sortField>
    <sortOrder>Asc</sortOrder>
    <storeOutputAutomatically>false</storeOutputAutomatically>
    <outputReference>col_Contacts</outputReference>
</recordLookups>
```

### Key Properties

| Property | Description |
|---|---|
| `getFirstRecordOnly` | `true` = single record, `false` = collection |
| `storeOutputAutomatically` | Always set to `false` — explicitly select fields via `queriedFields` for security |
| `outputReference` | Variable to store results (when `storeOutputAutomatically` is `false`) |
| `assignNullValuesIfNoRecordsFound` | Set to `false` — prevents clearing existing variable values |
| `sortField` / `sortOrder` | Optional sorting (`Asc` or `Desc`) |

### Get Single Record

```xml
<recordLookups>
    <name>Get_Account</name>
    <label>Get Account</label>
    <locationX>0</locationX>
    <locationY>0</locationY>
    <assignNullValuesIfNoRecordsFound>false</assignNullValuesIfNoRecordsFound>
    <connector>
        <targetReference>Check_Account_Found</targetReference>
    </connector>
    <faultConnector>
        <targetReference>Error_Handler</targetReference>
    </faultConnector>
    <filterLogic>and</filterLogic>
    <filters>
        <field>Id</field>
        <operator>EqualTo</operator>
        <value>
            <elementReference>recordId</elementReference>
        </value>
    </filters>
    <getFirstRecordOnly>true</getFirstRecordOnly>
    <object>Account</object>
    <queriedFields>Id</queriedFields>
    <queriedFields>Name</queriedFields>
    <queriedFields>Industry</queriedFields>
    <storeOutputAutomatically>false</storeOutputAutomatically>
    <outputReference>rec_Account</outputReference>
</recordLookups>
```

## Record Creates (Create Records)

### Create with Field Assignments

```xml
<recordCreates>
    <name>Create_Task</name>
    <label>Create Task</label>
    <locationX>0</locationX>
    <locationY>0</locationY>
    <connector>
        <targetReference>Next_Element</targetReference>
    </connector>
    <faultConnector>
        <targetReference>Error_Handler</targetReference>
    </faultConnector>
    <inputAssignments>
        <field>Subject</field>
        <value>
            <stringValue>Follow Up</stringValue>
        </value>
    </inputAssignments>
    <inputAssignments>
        <field>WhoId</field>
        <value>
            <elementReference>inp_ContactId</elementReference>
        </value>
    </inputAssignments>
    <object>Task</object>
    <storeOutputAutomatically>true</storeOutputAutomatically>
</recordCreates>
```

### Create from Record/Collection Variable (Bulk)

```xml
<recordCreates>
    <name>Create_Contacts</name>
    <label>Create Contacts</label>
    <locationX>0</locationX>
    <locationY>0</locationY>
    <connector>
        <targetReference>Next_Element</targetReference>
    </connector>
    <faultConnector>
        <targetReference>Error_Handler</targetReference>
    </faultConnector>
    <inputReference>col_NewContacts</inputReference>
</recordCreates>
```

## Record Updates

### Update with Filters and Field Assignments

```xml
<recordUpdates>
    <name>Update_Account</name>
    <label>Update Account</label>
    <locationX>0</locationX>
    <locationY>0</locationY>
    <connector>
        <targetReference>Next_Element</targetReference>
    </connector>
    <faultConnector>
        <targetReference>Error_Handler</targetReference>
    </faultConnector>
    <filterLogic>and</filterLogic>
    <filters>
        <field>Id</field>
        <operator>EqualTo</operator>
        <value>
            <elementReference>recordId</elementReference>
        </value>
    </filters>
    <inputAssignments>
        <field>Description</field>
        <value>
            <elementReference>var_NewDescription</elementReference>
        </value>
    </inputAssignments>
    <object>Account</object>
</recordUpdates>
```

### Update from Record/Collection Variable (Bulk)

```xml
<recordUpdates>
    <name>Update_Contacts</name>
    <label>Update Contacts</label>
    <locationX>0</locationX>
    <locationY>0</locationY>
    <connector>
        <targetReference>Next_Element</targetReference>
    </connector>
    <faultConnector>
        <targetReference>Error_Handler</targetReference>
    </faultConnector>
    <inputReference>col_ContactsToUpdate</inputReference>
</recordUpdates>
```

## Record Deletes

### Delete with Filters

```xml
<recordDeletes>
    <name>Delete_Old_Tasks</name>
    <label>Delete Old Tasks</label>
    <locationX>0</locationX>
    <locationY>0</locationY>
    <connector>
        <targetReference>Next_Element</targetReference>
    </connector>
    <faultConnector>
        <targetReference>Error_Handler</targetReference>
    </faultConnector>
    <filterLogic>and</filterLogic>
    <filters>
        <field>Status</field>
        <operator>EqualTo</operator>
        <value>
            <stringValue>Completed</stringValue>
        </value>
    </filters>
    <object>Task</object>
</recordDeletes>
```

### Delete from Record/Collection Variable

```xml
<recordDeletes>
    <name>Delete_Records</name>
    <label>Delete Records</label>
    <locationX>0</locationX>
    <locationY>0</locationY>
    <connector>
        <targetReference>Next_Element</targetReference>
    </connector>
    <faultConnector>
        <targetReference>Error_Handler</targetReference>
    </faultConnector>
    <inputReference>col_RecordsToDelete</inputReference>
</recordDeletes>
```

## Subflow Calls

Call another flow as a subflow.

```xml
<subflows>
    <name>Call_Error_Handler</name>
    <label>Call Error Handler</label>
    <locationX>0</locationX>
    <locationY>0</locationY>
    <connector>
        <targetReference>Next_Element</targetReference>
    </connector>
    <flowName>Sub_Error_Handler</flowName>
    <inputAssignments>
        <name>inp_ErrorMessage</name>
        <value>
            <elementReference>var_ErrorMessage</elementReference>
        </value>
    </inputAssignments>
    <outputAssignments>
        <assignToReference>var_IsSuccess</assignToReference>
        <name>out_IsSuccess</name>
    </outputAssignments>
</subflows>
```

## Action Calls

### Apex Invocable Action

```xml
<actionCalls>
    <name>Call_Apex_Action</name>
    <label>Call Apex Action</label>
    <locationX>0</locationX>
    <locationY>0</locationY>
    <actionName>MyApexClassName</actionName>
    <actionType>apex</actionType>
    <connector>
        <targetReference>Next_Element</targetReference>
    </connector>
    <faultConnector>
        <targetReference>Error_Handler</targetReference>
    </faultConnector>
    <flowTransactionModel>CurrentTransaction</flowTransactionModel>
    <inputParameters>
        <name>recordIds</name>
        <value>
            <elementReference>col_RecordIds</elementReference>
        </value>
    </inputParameters>
    <outputParameters>
        <assignToReference>var_Result</assignToReference>
        <name>result</name>
    </outputParameters>
</actionCalls>
```

### Email Alert

```xml
<actionCalls>
    <name>Send_Email_Alert</name>
    <label>Send Email Alert</label>
    <locationX>0</locationX>
    <locationY>0</locationY>
    <actionName>Case.Case_Escalation_Alert</actionName>
    <actionType>emailAlert</actionType>
    <connector>
        <targetReference>Next_Element</targetReference>
    </connector>
    <faultConnector>
        <targetReference>Error_Handler</targetReference>
    </faultConnector>
    <flowTransactionModel>CurrentTransaction</flowTransactionModel>
    <inputParameters>
        <name>SObjectRowId</name>
        <value>
            <elementReference>inp_RecordId</elementReference>
        </value>
    </inputParameters>
</actionCalls>
```

### Custom Notification

```xml
<actionCalls>
    <name>Send_Notification</name>
    <label>Send Notification</label>
    <locationX>0</locationX>
    <locationY>0</locationY>
    <actionName>customNotificationAction</actionName>
    <actionType>customNotificationAction</actionType>
    <connector>
        <targetReference>Next_Element</targetReference>
    </connector>
    <flowTransactionModel>CurrentTransaction</flowTransactionModel>
    <inputParameters>
        <name>customNotifTypeId</name>
        <value>
            <elementReference>var_NotificationTypeId</elementReference>
        </value>
    </inputParameters>
    <inputParameters>
        <name>recipientIds</name>
        <value>
            <elementReference>col_RecipientIds</elementReference>
        </value>
    </inputParameters>
    <inputParameters>
        <name>title</name>
        <value>
            <stringValue>Record Updated</stringValue>
        </value>
    </inputParameters>
    <inputParameters>
        <name>body</name>
        <value>
            <elementReference>txt_NotificationBody</elementReference>
        </value>
    </inputParameters>
    <inputParameters>
        <name>targetId</name>
        <value>
            <elementReference>inp_RecordId</elementReference>
        </value>
    </inputParameters>
</actionCalls>
```

### flowTransactionModel

| Value | Description |
|---|---|
| `CurrentTransaction` | Runs in the same transaction (shares governor limits) |
| `NewTransaction` | Runs in a new transaction (separate limits, creates transaction boundary) |

## Collection Processors (Transform)

Filter or sort collections without loops — 30-50% faster.

### Filter Collection

```xml
<collectionProcessors>
    <name>Filter_Active_Contacts</name>
    <elementSubtype>FilterCollectionProcessor</elementSubtype>
    <label>Filter Active Contacts</label>
    <locationX>0</locationX>
    <locationY>0</locationY>
    <assignNextValueToReference>current_Contact</assignNextValueToReference>
    <collectionProcessorType>FilterCollectionProcessor</collectionProcessorType>
    <collectionReference>col_AllContacts</collectionReference>
    <conditionLogic>and</conditionLogic>
    <conditions>
        <leftValueReference>current_Contact.IsActive__c</leftValueReference>
        <operator>EqualTo</operator>
        <rightValue>
            <booleanValue>true</booleanValue>
        </rightValue>
    </conditions>
    <connector>
        <targetReference>Next_Element</targetReference>
    </connector>
</collectionProcessors>
```

### Sort Collection

```xml
<collectionProcessors>
    <name>Sort_By_Name</name>
    <elementSubtype>SortCollectionProcessor</elementSubtype>
    <label>Sort By Name</label>
    <locationX>0</locationX>
    <locationY>0</locationY>
    <collectionProcessorType>SortCollectionProcessor</collectionProcessorType>
    <collectionReference>col_Contacts</collectionReference>
    <connector>
        <targetReference>Next_Element</targetReference>
    </connector>
    <sortOptions>
        <doesPutEmptyStringAndNullFirst>false</doesPutEmptyStringAndNullFirst>
        <sortField>LastName</sortField>
        <sortOrder>Asc</sortOrder>
    </sortOptions>
</collectionProcessors>
```
