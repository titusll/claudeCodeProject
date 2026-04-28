# Permission Sets and Profiles Reference

## Permission Sets

Path: `force-app/main/default/permissionsets/<PermissionSetName>.permissionset-meta.xml`

### Permission Set Template

```xml
<?xml version="1.0" encoding="UTF-8"?>
<PermissionSet xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>Permission Set Label</label>
    <description>Purpose of this permission set.</description>
    <hasActivationRequired>false</hasActivationRequired>
    <license>Salesforce</license>
    <objectPermissions>
        <allowCreate>true</allowCreate>
        <allowDelete>false</allowDelete>
        <allowEdit>true</allowEdit>
        <allowRead>true</allowRead>
        <modifyAllRecords>false</modifyAllRecords>
        <object>CustomObject__c</object>
        <viewAllRecords>false</viewAllRecords>
    </objectPermissions>
    <fieldPermissions>
        <editable>true</editable>
        <field>CustomObject__c.Field_Name__c</field>
        <readable>true</readable>
    </fieldPermissions>
    <tabSettings>
        <tab>CustomObject__c</tab>
        <visibility>Visible</visibility>
    </tabSettings>
</PermissionSet>
```

### Key rules

- Permission sets grant access; they cannot deny access.
- `fieldPermissions.field` uses the format `ObjectName.FieldName__c`.
- `tabSettings.visibility` values: `Visible`, `DefaultOn`, `DefaultOff`, `Hidden`.
- For **Permission Set Groups**, use `.permissionsetgroup-meta.xml` with `<PermissionSetGroup>` root element. Groups can include `<mutingPermissionSets>` to subtract permissions.
- Profiles and Permission Sets only include field-level security for metadata types present in the same deployment. If deploying a permission set that references a new field, deploy the field and permission set together.

---

## Profiles

Path: `force-app/main/default/profiles/<ProfileName>.profile-meta.xml`

### Important caveats

- Profile metadata is notoriously tricky in source control. When retrieved, profile files only include security settings for the other metadata types referenced in the same retrieval.
- **Prefer permission sets over profile modifications** for granting access. This is Salesforce best practice.
- If profile changes are necessary, make targeted edits only. Do not generate full profile XML files from scratch; retrieve the existing profile and modify specific sections.
- Profile changes should include only the relevant delta (e.g., `fieldPermissions`, `objectPermissions`, `layoutAssignments`, `recordTypeVisibilities`).

### Profile Field Permission Fragment

```xml
<fieldPermissions>
    <editable>true</editable>
    <field>CustomObject__c.Field_Name__c</field>
    <readable>true</readable>
</fieldPermissions>
```

### Profile Layout Assignment Fragment

```xml
<layoutAssignments>
    <layout>CustomObject__c-Custom Object Layout</layout>
</layoutAssignments>
```

### Profile Record Type Visibility Fragment

```xml
<recordTypeVisibilities>
    <default>true</default>
    <recordType>CustomObject__c.Record_Type_Name</recordType>
    <visible>true</visible>
</recordTypeVisibilities>
```
