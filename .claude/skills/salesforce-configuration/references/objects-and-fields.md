# Custom Objects and Fields Reference

## Custom Objects

Path: `force-app/main/default/objects/<ObjectName>__c/<ObjectName>__c.object-meta.xml`

In source format, the object definition file contains only object-level settings. Fields, list views, record types, compact layouts, and validation rules are stored as separate files within subdirectories of the object folder.

### Standalone Object Template

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>Object Label</label>
    <pluralLabel>Object Labels</pluralLabel>
    <nameField>
        <label>Object Label Name</label>
        <type>Text</type>
        <!-- Use AutoNumber if needed: <type>AutoNumber</type><displayFormat>OBJ-{00000}</displayFormat> -->
    </nameField>
    <deploymentStatus>Deployed</deploymentStatus>
    <sharingModel>ReadWrite</sharingModel>
    <enableActivities>true</enableActivities>
    <enableHistory>true</enableHistory>
    <enableReports>true</enableReports>
    <enableSearch>true</enableSearch>
    <description>Purpose of this object.</description>
</CustomObject>
```

### Master-Detail Child Object Template

**CRITICAL**: Any object that has a MasterDetail field MUST use `ControlledByParent` as its sharing model. Using `ReadWrite` or `Private` will cause a deploy failure.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>Child Object Label</label>
    <pluralLabel>Child Object Labels</pluralLabel>
    <nameField>
        <label>Child Object Name</label>
        <type>Text</type>
    </nameField>
    <deploymentStatus>Deployed</deploymentStatus>
    <sharingModel>ControlledByParent</sharingModel>
    <enableActivities>true</enableActivities>
    <enableHistory>true</enableHistory>
    <enableReports>true</enableReports>
    <enableSearch>true</enableSearch>
    <description>Purpose of this object.</description>
</CustomObject>
```

### Required elements

- `label`, `pluralLabel`, `nameField`, `deploymentStatus`, `sharingModel`.

### Key decisions

- `sharingModel`: Use `ReadWrite` (public read/write), `Read` (public read only), or `Private`. Default to `Private` for objects containing sensitive data. Use `ControlledByParent` if the object has any MasterDetail field — this is mandatory.
- `nameField.type`: `Text` (user-entered) or `AutoNumber` (system-generated). If `AutoNumber`, include `displayFormat`.
- Always set `deploymentStatus` to `Deployed` for metadata that should be immediately active.

---

## Custom Fields

Path: `force-app/main/default/objects/<ObjectName>/fields/<FieldName>__c.field-meta.xml`

### Field Template

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Field_Name__c</fullName>
    <label>Field Label</label>
    <type>Text</type>
    <length>255</length>
    <required>false</required>
    <externalId>false</externalId>
    <unique>false</unique>
    <description>Purpose of this field.</description>
    <inlineHelpText>Help text shown to users.</inlineHelpText>
</CustomField>
```

### Field Type Quick Reference

Each type requires specific elements. Only include elements that apply:

| Type | Required Elements | Notes |
|------|------------------|-------|
| `Text` | `length` (max 255) | |
| `LongTextArea` | `length` (max 131072), `visibleLines` | |
| `Number` | `precision`, `scale` | `precision` = total digits, `scale` = decimal places |
| `Currency` | `precision`, `scale` | |
| `Percent` | `precision`, `scale` | |
| `Checkbox` | `defaultValue` (true/false) | No `required` element needed |
| `Date` | | |
| `DateTime` | | |
| `Email` | | |
| `Phone` | | |
| `Url` | `length` (optional, max 255) | |
| `Picklist` | `valueSet` | See picklist example below |
| `MultiselectPicklist` | `valueSet`, `visibleLines` | |
| `Lookup` | `referenceTo`, `relationshipLabel`, `relationshipName` | |
| `MasterDetail` | `referenceTo`, `relationshipLabel`, `relationshipName`, `relationshipOrder`, `reparentableMasterDetail`, `writeRequiresMasterRead` | Child object MUST use `sharingModel: ControlledByParent`. Use `relationshipOrder: 0` for first MD, `1` for second. |
| `TextArea` | | Plain text, 255 chars |
| `Html` | `length`, `visibleLines` | Rich text area |
| `Summary` | `summarizedField`, `summaryForeignKey`, `summaryOperation` | Roll-up summary |

### Picklist Field Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Status__c</fullName>
    <label>Status</label>
    <type>Picklist</type>
    <required>false</required>
    <valueSet>
        <restricted>true</restricted>
        <valueSetDefinition>
            <sorted>false</sorted>
            <value>
                <fullName>New</fullName>
                <default>true</default>
                <label>New</label>
            </value>
            <value>
                <fullName>In Progress</fullName>
                <default>false</default>
                <label>In Progress</label>
            </value>
            <value>
                <fullName>Closed</fullName>
                <default>false</default>
                <label>Closed</label>
            </value>
        </valueSetDefinition>
    </valueSet>
</CustomField>
```

### Lookup Field Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Account__c</fullName>
    <label>Account</label>
    <type>Lookup</type>
    <referenceTo>Account</referenceTo>
    <relationshipLabel>Related Records</relationshipLabel>
    <relationshipName>Related_Records</relationshipName>
    <required>false</required>
    <deleteConstraint>SetNull</deleteConstraint>
</CustomField>
```

### Master-Detail Field Example

An object can have at most two MasterDetail relationships — use `relationshipOrder: 0` for the first and `relationshipOrder: 1` for the second.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Parent_Object__c</fullName>
    <label>Parent Object</label>
    <type>MasterDetail</type>
    <referenceTo>Parent_Object__c</referenceTo>
    <relationshipLabel>Child Objects</relationshipLabel>
    <relationshipName>Child_Objects</relationshipName>
    <relationshipOrder>0</relationshipOrder>
    <reparentableMasterDetail>false</reparentableMasterDetail>
    <writeRequiresMasterRead>false</writeRequiresMasterRead>
</CustomField>
```

### Common mistakes to avoid

- Do NOT include `<type>` elements that do not match the field type (e.g. `length` on a `Date` field).
- Do NOT set `required` to `true` on `Checkbox` fields — checkboxes are always required implicitly.
- For `MasterDetail`, the child object's `sharingModel` must be `ControlledByParent`.
- Whether to include `fullName` in field files: follow the convention used in the existing project. Source format encodes it in the file path, so it's optional but can aid readability.
