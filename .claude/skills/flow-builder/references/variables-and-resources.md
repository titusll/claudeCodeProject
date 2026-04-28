# Variables and Resources

## Variables

### Data Types

| `dataType` | Description | Extra Properties |
|---|---|---|
| `String` | Text | — |
| `Number` | Numeric | `scale` (decimal places) |
| `Currency` | Money | `scale` (decimal places) |
| `Boolean` | True/false | — |
| `Date` | Date only | — |
| `DateTime` | Date and time | — |
| `SObject` | Salesforce record | `objectType` (e.g., `Account`) |
| `Picklist` | Picklist value | — |
| `Multipicklist` | Multi-select picklist | — |
| `Apex` | Apex-defined type | `apexClass` |

### Simple Variables

```xml
<!-- String -->
<variables>
    <name>var_AccountName</name>
    <dataType>String</dataType>
    <isCollection>false</isCollection>
    <isInput>false</isInput>
    <isOutput>false</isOutput>
</variables>

<!-- Number with default -->
<variables>
    <name>var_Counter</name>
    <dataType>Number</dataType>
    <isCollection>false</isCollection>
    <isInput>false</isInput>
    <isOutput>false</isOutput>
    <scale>0</scale>
    <value>
        <numberValue>0.0</numberValue>
    </value>
</variables>

<!-- Boolean with default -->
<variables>
    <name>var_IsSuccess</name>
    <dataType>Boolean</dataType>
    <isCollection>false</isCollection>
    <isInput>false</isInput>
    <isOutput>false</isOutput>
    <value>
        <booleanValue>false</booleanValue>
    </value>
</variables>

<!-- Currency -->
<variables>
    <name>var_Amount</name>
    <dataType>Currency</dataType>
    <isCollection>false</isCollection>
    <isInput>false</isInput>
    <isOutput>false</isOutput>
    <scale>2</scale>
</variables>

<!-- Date -->
<variables>
    <name>var_StartDate</name>
    <dataType>Date</dataType>
    <isCollection>false</isCollection>
    <isInput>true</isInput>
    <isOutput>false</isOutput>
</variables>

<!-- DateTime -->
<variables>
    <name>var_Timestamp</name>
    <dataType>DateTime</dataType>
    <isCollection>false</isCollection>
    <isInput>false</isInput>
    <isOutput>false</isOutput>
</variables>
```

### SObject Record Variables

```xml
<!-- Single record -->
<variables>
    <name>rec_Account</name>
    <dataType>SObject</dataType>
    <isCollection>false</isCollection>
    <isInput>false</isInput>
    <isOutput>false</isOutput>
    <objectType>Account</objectType>
</variables>

<!-- Record collection -->
<variables>
    <name>col_Contacts</name>
    <dataType>SObject</dataType>
    <isCollection>true</isCollection>
    <isInput>false</isInput>
    <isOutput>false</isOutput>
    <objectType>Contact</objectType>
</variables>
```

### Primitive Collection Variables

```xml
<variables>
    <name>col_Ids</name>
    <dataType>String</dataType>
    <isCollection>true</isCollection>
    <isInput>false</isInput>
    <isOutput>false</isOutput>
</variables>
```

### Input/Output Variables

Used by screen flows and subflows for passing data in and out.

```xml
<!-- Input variable -->
<variables>
    <name>inp_RecordId</name>
    <dataType>String</dataType>
    <isCollection>false</isCollection>
    <isInput>true</isInput>
    <isOutput>false</isOutput>
</variables>

<!-- Output variable -->
<variables>
    <name>out_CreatedRecordId</name>
    <dataType>String</dataType>
    <isCollection>false</isCollection>
    <isInput>false</isInput>
    <isOutput>true</isOutput>
</variables>

<!-- Standard recordId (auto-populated on record pages) -->
<variables>
    <name>recordId</name>
    <dataType>String</dataType>
    <isCollection>false</isCollection>
    <isInput>true</isInput>
    <isOutput>false</isOutput>
</variables>
```

## Formulas

Formulas compute values using Salesforce formula syntax. Available in all flow types.

```xml
<!-- String formula -->
<formulas>
    <name>frml_FullName</name>
    <dataType>String</dataType>
    <expression>{!rec_Contact.FirstName} &amp; &quot; &quot; &amp; {!rec_Contact.LastName}</expression>
</formulas>

<!-- Number formula -->
<formulas>
    <name>frml_DaysUntilClose</name>
    <dataType>Number</dataType>
    <expression>{!$Record.CloseDate} - TODAY()</expression>
    <scale>0</scale>
</formulas>

<!-- Boolean formula -->
<formulas>
    <name>frml_IsHighValue</name>
    <dataType>Boolean</dataType>
    <expression>IF({!$Record.Amount} > 100000, true, false)</expression>
</formulas>

<!-- Date formula -->
<formulas>
    <name>frml_DueDate</name>
    <dataType>Date</dataType>
    <expression>{!$Record.CloseDate} + 7</expression>
</formulas>
```

### Flow Formula Limitations

These functions are NOT supported in flow formulas (unlike formula fields):

| Not Supported | Use Instead |
|---|---|
| `BLANKVALUE()` | `IF(ISBLANK(...), defaultValue, ...)` |
| `CASESAFEID()` | ID variables handle this automatically |
| `ISNEW()` | Check `$Record__Prior` is null in a Decision |
| `ISCHANGED()` | Compare `$Record.Field` vs `$Record__Prior.Field` in a Decision |
| `PRIORVALUE()` | Use `$Record__Prior.FieldName` |

### XML Escaping in Formulas

| Character | XML Escape |
|---|---|
| `&` | `&amp;` |
| `"` | `&quot;` |
| `<` | `&lt;` |
| `>` | `&gt;` |

## Text Templates

Rich text or plain text templates with merge fields.

```xml
<!-- HTML text template -->
<textTemplates>
    <name>txt_EmailBody</name>
    <isViewedAsPlainText>false</isViewedAsPlainText>
    <text>&lt;p&gt;Dear {!rec_Contact.FirstName},&lt;/p&gt;
&lt;p&gt;Your case {!rec_Case.CaseNumber} has been updated.&lt;/p&gt;
&lt;p&gt;Status: {!rec_Case.Status}&lt;/p&gt;</text>
</textTemplates>

<!-- Plain text template -->
<textTemplates>
    <name>txt_PlainMessage</name>
    <isViewedAsPlainText>true</isViewedAsPlainText>
    <text>Account {!rec_Account.Name} was created on {!frml_FormattedDate}.</text>
</textTemplates>
```

## Constants

Static values that don't change during the flow interview.

```xml
<constants>
    <name>const_MaxRetries</name>
    <dataType>Number</dataType>
    <value>
        <numberValue>3.0</numberValue>
    </value>
</constants>

<constants>
    <name>const_DefaultStatus</name>
    <dataType>String</dataType>
    <value>
        <stringValue>New</stringValue>
    </value>
</constants>
```

## Choices

Static choices for screen flow picklists, radio buttons, and checkboxes.

```xml
<choices>
    <name>choice_High</name>
    <choiceText>High</choiceText>
    <dataType>String</dataType>
    <value>
        <stringValue>High</stringValue>
    </value>
</choices>

<choices>
    <name>choice_Medium</name>
    <choiceText>Medium</choiceText>
    <dataType>String</dataType>
    <value>
        <stringValue>Medium</stringValue>
    </value>
</choices>

<choices>
    <name>choice_Low</name>
    <choiceText>Low</choiceText>
    <dataType>String</dataType>
    <value>
        <stringValue>Low</stringValue>
    </value>
</choices>
```

## Dynamic Record Choice Sets

Query records at runtime to populate picklists/dropdowns dynamically.

```xml
<dynamicChoiceSets>
    <name>dcs_ActiveAccounts</name>
    <dataType>String</dataType>
    <displayField>Name</displayField>
    <filterLogic>and</filterLogic>
    <filters>
        <field>IsActive__c</field>
        <operator>EqualTo</operator>
        <value>
            <booleanValue>true</booleanValue>
        </value>
    </filters>
    <object>Account</object>
    <outputAssignments>
        <assignToReference>var_SelectedAccountId</assignToReference>
        <field>Id</field>
    </outputAssignments>
    <valueField>Id</valueField>
</dynamicChoiceSets>
```

| Property | Description |
|---|---|
| `displayField` | Field shown to the user (e.g., `Name`) |
| `valueField` | Field stored as the selected value (e.g., `Id`) |
| `outputAssignments` | Map additional fields to variables on selection |

## Value Types in XML

When setting values in assignments, variables, filters, and parameters, use the appropriate value element:

```xml
<!-- String value -->
<value>
    <stringValue>Hello</stringValue>
</value>

<!-- Number value -->
<value>
    <numberValue>42.0</numberValue>
</value>

<!-- Boolean value -->
<value>
    <booleanValue>true</booleanValue>
</value>

<!-- Reference to another element/variable -->
<value>
    <elementReference>var_MyVariable</elementReference>
</value>

<!-- Date value (not commonly used inline — prefer formulas) -->
<value>
    <dateValue>2026-01-01</dateValue>
</value>
```

## System Variables

| Variable | Description |
|---|---|
| `$Flow.CurrentDateTime` | Current date/time when the flow runs |
| `$Flow.CurrentDate` | Current date |
| `$Flow.FaultMessage` | Error message on fault path |
| `$Flow.CurrentRecord` | Current record in a loop |
| `$Record` | Triggering record (record-triggered flows) |
| `$Record__Prior` | Previous record values (record-triggered, update only) |
| `$Api.Session_ID` | Current session ID |
| `$User.Id` | Running user's ID |
| `$Organization.Id` | Org ID |
| `$Label.CustomLabelName` | Custom label value |
