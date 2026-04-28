# Screen Flows

Screen flows use `<processType>Flow</processType>` and contain `<screens>` elements for user interaction.

## Minimal Screen Flow Skeleton

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Flow xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>66.0</apiVersion>
    <description>Description of the screen flow</description>
    <interviewLabel>Screen_Flow_Name {!$Flow.CurrentDateTime}</interviewLabel>
    <label>Screen Flow Label</label>
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
    <processType>Flow</processType>
    <screens>
        <name>First_Screen</name>
        <label>First Screen</label>
        <locationX>0</locationX>
        <locationY>0</locationY>
        <allowBack>false</allowBack>
        <allowFinish>true</allowFinish>
        <allowPause>false</allowPause>
        <connector>
            <targetReference>Next_Element</targetReference>
        </connector>
        <fields>
            <name>inp_FieldName</name>
            <dataType>String</dataType>
            <fieldText>Field Label</fieldText>
            <fieldType>InputField</fieldType>
            <isRequired>true</isRequired>
        </fields>
        <showFooter>true</showFooter>
        <showHeader>true</showHeader>
    </screens>
    <start>
        <locationX>0</locationX>
        <locationY>0</locationY>
        <connector>
            <targetReference>First_Screen</targetReference>
        </connector>
    </start>
    <status>Draft</status>
    <variables>
        <name>recordId</name>
        <dataType>String</dataType>
        <isCollection>false</isCollection>
        <isInput>true</isInput>
        <isOutput>false</isOutput>
    </variables>
</Flow>
```

## Screen Element

```xml
<screens>
    <name>Input_Screen</name>
    <label>Enter Details</label>
    <locationX>0</locationX>
    <locationY>0</locationY>
    <allowBack>true</allowBack>
    <allowFinish>true</allowFinish>
    <allowPause>false</allowPause>
    <connector>
        <targetReference>Next_Element</targetReference>
    </connector>
    <fields>
        <!-- Screen fields go here -->
    </fields>
    <showFooter>true</showFooter>
    <showHeader>true</showHeader>
</screens>
```

### Navigation Properties

| Property | Description |
|---|---|
| `allowBack` | Shows Previous button (`true`/`false`) |
| `allowFinish` | Must be `true` on all screens. If `<connector>` exists, button shows "Next"; if absent, shows "Finish" |
| `allowPause` | Shows Pause button (`true`/`false`) |
| `showFooter` | Show/hide footer with navigation buttons |
| `showHeader` | Show/hide screen header |

## Screen Field Types

### Input Field

Standard input — type determined by `dataType` (String, Number, Date, DateTime, Currency, Boolean).

```xml
<fields>
    <name>inp_AccountName</name>
    <dataType>String</dataType>
    <fieldText>Account Name</fieldText>
    <fieldType>InputField</fieldType>
    <isRequired>true</isRequired>
</fields>
```

### Large Text Area

```xml
<fields>
    <name>inp_Description</name>
    <fieldText>Description</fieldText>
    <fieldType>LargeTextArea</fieldType>
    <isRequired>false</isRequired>
</fields>
```

### Display Text (Read-Only)

```xml
<fields>
    <name>DisplayText_Welcome</name>
    <fieldText>&lt;p&gt;Welcome to the form. Please fill in the details below.&lt;/p&gt;</fieldText>
    <fieldType>DisplayText</fieldType>
</fields>
```

Note: HTML must be XML-escaped (`&lt;` for `<`, `&gt;` for `>`).

### Dropdown (Picklist)

```xml
<fields>
    <name>inp_Status</name>
    <choiceReferences>choice_Open</choiceReferences>
    <choiceReferences>choice_Closed</choiceReferences>
    <choiceReferences>choice_Pending</choiceReferences>
    <dataType>String</dataType>
    <fieldText>Status</fieldText>
    <fieldType>DropdownBox</fieldType>
    <isRequired>true</isRequired>
</fields>
```

### Radio Buttons

```xml
<fields>
    <name>inp_Priority</name>
    <choiceReferences>choice_High</choiceReferences>
    <choiceReferences>choice_Medium</choiceReferences>
    <choiceReferences>choice_Low</choiceReferences>
    <dataType>String</dataType>
    <fieldText>Priority</fieldText>
    <fieldType>RadioButtons</fieldType>
    <isRequired>true</isRequired>
</fields>
```

### Multi-Select Checkboxes

```xml
<fields>
    <name>inp_Categories</name>
    <choiceReferences>choice_Category1</choiceReferences>
    <choiceReferences>choice_Category2</choiceReferences>
    <choiceReferences>choice_Category3</choiceReferences>
    <dataType>String</dataType>
    <fieldText>Categories</fieldText>
    <fieldType>MultiSelectCheckboxes</fieldType>
    <isRequired>false</isRequired>
</fields>
```

### Toggle

```xml
<fields>
    <name>inp_IsActive</name>
    <dataType>Boolean</dataType>
    <fieldText>Active</fieldText>
    <fieldType>Toggle</fieldType>
    <isRequired>false</isRequired>
</fields>
```

### Section Layout (RegionContainer)

Sections use a `RegionContainer` with `Region` children for columns. Column width values are based on a 12-column grid (e.g., `6` = half width).

```xml
<fields>
    <name>Section_ContactInfo</name>
    <fieldType>RegionContainer</fieldType>
    <fields>
        <name>Section_ContactInfo_Column1</name>
        <fieldType>Region</fieldType>
        <fields>
            <name>inp_Phone</name>
            <dataType>String</dataType>
            <fieldText>Phone</fieldText>
            <fieldType>InputField</fieldType>
            <isRequired>false</isRequired>
        </fields>
        <inputParameters>
            <name>width</name>
            <value>
                <stringValue>6</stringValue>
            </value>
        </inputParameters>
    </fields>
    <fields>
        <name>Section_ContactInfo_Column2</name>
        <fieldType>Region</fieldType>
        <fields>
            <name>inp_Email</name>
            <dataType>String</dataType>
            <fieldText>Email</fieldText>
            <fieldType>InputField</fieldType>
            <isRequired>false</isRequired>
        </fields>
        <inputParameters>
            <name>width</name>
            <value>
                <stringValue>6</stringValue>
            </value>
        </inputParameters>
    </fields>
</fields>
```

### Custom LWC Component

```xml
<fields>
    <name>LWC_CustomLookup</name>
    <extensionName>c:myCustomComponent</extensionName>
    <fieldType>ComponentInstance</fieldType>
    <inputParameters>
        <name>label</name>
        <value>
            <stringValue>Select Record</stringValue>
        </value>
    </inputParameters>
    <inputParameters>
        <name>objectApiName</name>
        <value>
            <stringValue>Account</stringValue>
        </value>
    </inputParameters>
    <outputParameters>
        <assignToReference>var_SelectedId</assignToReference>
        <name>selectedRecordId</name>
    </outputParameters>
</fields>
```

### Dynamic Record Choice Set on Screen

Use a `<dynamicChoiceSets>` resource and reference it in a dropdown or radio button:

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

Then reference in a screen field:

```xml
<fields>
    <name>inp_Account</name>
    <choiceReferences>dcs_ActiveAccounts</choiceReferences>
    <dataType>String</dataType>
    <fieldText>Select Account</fieldText>
    <fieldType>DropdownBox</fieldType>
    <isRequired>true</isRequired>
</fields>
```

## All Screen Field Types

| `fieldType` Value | Description |
|---|---|
| `InputField` | Standard input (text, number, date, etc. based on `dataType`) |
| `LargeTextArea` | Multi-line text area |
| `DisplayText` | Read-only rich text |
| `DropdownBox` | Picklist dropdown (requires `choiceReferences`) |
| `RadioButtons` | Radio button group (requires `choiceReferences`) |
| `MultiSelectCheckboxes` | Multi-select checkboxes (requires `choiceReferences`) |
| `MultiSelectPicklist` | Multi-select picklist |
| `ComponentInstance` | Custom LWC component (uses `extensionName`) |
| `RegionContainer` | Section container (holds `Region` children) |
| `Region` | Column within a section |
| `ObjectProvided` | Field from an SObject record variable |
| `PasswordField` | Password input |
| `Slider` | Slider input |
| `Toggle` | Toggle switch |

## Input/Output Variables

Screen flows receive context through input variables and return results through output variables.

### Standard recordId Input

When a screen flow is placed on a record page, `recordId` is automatically populated:

```xml
<variables>
    <name>recordId</name>
    <dataType>String</dataType>
    <isCollection>false</isCollection>
    <isInput>true</isInput>
    <isOutput>false</isOutput>
</variables>
```

### Custom Input Variable

```xml
<variables>
    <name>inp_AccountId</name>
    <dataType>String</dataType>
    <isCollection>false</isCollection>
    <isInput>true</isInput>
    <isOutput>false</isOutput>
</variables>
```

### Output Variable

```xml
<variables>
    <name>out_CreatedRecordId</name>
    <dataType>String</dataType>
    <isCollection>false</isCollection>
    <isInput>false</isInput>
    <isOutput>true</isOutput>
</variables>
```

## Complete Screen Flow Example

A screen flow that collects case details and creates a Case record:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Flow xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>66.0</apiVersion>
    <choices>
        <name>choice_High</name>
        <choiceText>High</choiceText>
        <dataType>String</dataType>
        <value>
            <stringValue>High</stringValue>
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
    <choices>
        <name>choice_Medium</name>
        <choiceText>Medium</choiceText>
        <dataType>String</dataType>
        <value>
            <stringValue>Medium</stringValue>
        </value>
    </choices>
    <description>Collects case details from the user and creates a Case record</description>
    <interviewLabel>Screen_New_Case {!$Flow.CurrentDateTime}</interviewLabel>
    <label>New Case Screen Flow</label>
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
    <processType>Flow</processType>
    <recordCreates>
        <name>Create_Case</name>
        <label>Create Case</label>
        <locationX>0</locationX>
        <locationY>0</locationY>
        <connector>
            <targetReference>Confirmation_Screen</targetReference>
        </connector>
        <faultConnector>
            <targetReference>Error_Screen</targetReference>
        </faultConnector>
        <inputAssignments>
            <field>AccountId</field>
            <value>
                <elementReference>recordId</elementReference>
            </value>
        </inputAssignments>
        <inputAssignments>
            <field>Description</field>
            <value>
                <elementReference>Input_Screen.inp_Description</elementReference>
            </value>
        </inputAssignments>
        <inputAssignments>
            <field>Priority</field>
            <value>
                <elementReference>Input_Screen.inp_Priority</elementReference>
            </value>
        </inputAssignments>
        <inputAssignments>
            <field>Subject</field>
            <value>
                <elementReference>Input_Screen.inp_Subject</elementReference>
            </value>
        </inputAssignments>
        <object>Case</object>
        <storeOutputAutomatically>true</storeOutputAutomatically>
    </recordCreates>
    <screens>
        <name>Confirmation_Screen</name>
        <label>Confirmation</label>
        <locationX>0</locationX>
        <locationY>0</locationY>
        <allowBack>false</allowBack>
        <allowFinish>true</allowFinish>
        <allowPause>false</allowPause>
        <fields>
            <name>Display_Success</name>
            <fieldText>&lt;p&gt;&lt;b&gt;Case created successfully!&lt;/b&gt;&lt;/p&gt;&lt;p&gt;Subject: {!Input_Screen.inp_Subject}&lt;/p&gt;</fieldText>
            <fieldType>DisplayText</fieldType>
        </fields>
        <showFooter>true</showFooter>
        <showHeader>true</showHeader>
    </screens>
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
            <fieldText>&lt;p&gt;&lt;b&gt;An error occurred while creating the case.&lt;/b&gt;&lt;/p&gt;&lt;p&gt;Please try again or contact your administrator.&lt;/p&gt;</fieldText>
            <fieldType>DisplayText</fieldType>
        </fields>
        <showFooter>true</showFooter>
        <showHeader>true</showHeader>
    </screens>
    <screens>
        <name>Input_Screen</name>
        <label>Enter Case Details</label>
        <locationX>0</locationX>
        <locationY>0</locationY>
        <allowBack>false</allowBack>
        <allowFinish>true</allowFinish>
        <allowPause>false</allowPause>
        <connector>
            <targetReference>Create_Case</targetReference>
        </connector>
        <fields>
            <name>inp_Subject</name>
            <dataType>String</dataType>
            <fieldText>Subject</fieldText>
            <fieldType>InputField</fieldType>
            <isRequired>true</isRequired>
        </fields>
        <fields>
            <name>inp_Description</name>
            <fieldText>Description</fieldText>
            <fieldType>LargeTextArea</fieldType>
            <isRequired>false</isRequired>
        </fields>
        <fields>
            <name>inp_Priority</name>
            <choiceReferences>choice_High</choiceReferences>
            <choiceReferences>choice_Medium</choiceReferences>
            <choiceReferences>choice_Low</choiceReferences>
            <dataType>String</dataType>
            <fieldText>Priority</fieldText>
            <fieldType>RadioButtons</fieldType>
            <isRequired>true</isRequired>
        </fields>
        <showFooter>true</showFooter>
        <showHeader>true</showHeader>
    </screens>
    <start>
        <locationX>0</locationX>
        <locationY>0</locationY>
        <connector>
            <targetReference>Input_Screen</targetReference>
        </connector>
    </start>
    <status>Draft</status>
    <variables>
        <name>recordId</name>
        <dataType>String</dataType>
        <isCollection>false</isCollection>
        <isInput>true</isInput>
        <isOutput>false</isOutput>
    </variables>
</Flow>
```
