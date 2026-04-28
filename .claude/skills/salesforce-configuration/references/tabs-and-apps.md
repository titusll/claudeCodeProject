# Custom Tabs and App Navigation Reference

## Custom Tabs

Path: `force-app/main/default/tabs/<ObjectName>__c.tab-meta.xml`

Custom tabs make custom objects visible in the Lightning app navigation and App Launcher. Always create a tab when creating a new custom object.

### Tab Template

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomTab xmlns="http://soap.sforce.com/2006/04/metadata">
    <customObject>true</customObject>
    <motif>Custom57: Smiley Face</motif>
</CustomTab>
```

### Common motif values

| Motif | Description |
|-------|-------------|
| `Custom57: Smiley Face` | Generic smiley face |
| `Custom49: CD/DVD` | Music/media disc |
| `Custom48: Speaker` | Audio/speaker |
| `Custom50: Envelope` | Mail/messaging |
| `Custom51: Flag` | Status/flagging |
| `Custom52: Handsaw` | Tools/building |
| `Custom53: Laptop` | Technology |
| `Custom54: Microscope` | Research/science |
| `Custom55: People` | Contacts/groups |
| `Custom56: Phone` | Phone/communication |
| `Custom58: Stethoscope` | Health/medical |
| `Custom59: TV` | Media/display |
| `Custom60: Wrench` | Settings/maintenance |

### Key rules

- The tab file name must match the custom object API name exactly (e.g., `Invoice__c.tab-meta.xml` for `Invoice__c`).
- Set `customObject` to `true` for custom object tabs.
- After creating a tab, add it to the relevant `CustomApplication` metadata to include it in app navigation.

## Adding Tabs to App Navigation

To add a tab to an app, add a `<tabs>ObjectName__c</tabs>` element to the app's `.app-meta.xml` file.

---

## Additional Declarative Metadata Types

### List Views

Path: `force-app/main/default/objects/<ObjectName>/listViews/<ViewName>.listView-meta.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ListView xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>All_Records</fullName>
    <columns>NAME</columns>
    <columns>Custom_Field__c</columns>
    <columns>CREATED_DATE</columns>
    <filterScope>Everything</filterScope>
    <label>All Records</label>
</ListView>
```

- `filterScope` values: `Everything`, `Mine`, `Queue`, `Delegated`, `MyTerritory`, `MyTeamTerritory`, `Team`.
- Add `<filters>` blocks for filtered views with `field`, `operation`, and `value`.

### Compact Layouts

Path: `force-app/main/default/objects/<ObjectName>/compactLayouts/<LayoutName>.compactLayout-meta.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CompactLayout xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Custom_Compact_Layout</fullName>
    <fields>Name</fields>
    <fields>Status__c</fields>
    <fields>Owner__c</fields>
    <label>Custom Compact Layout</label>
</CompactLayout>
```

- Maximum 10 fields per compact layout.
- The first field becomes the primary field shown in highlights panel and lookups.
- Set the default compact layout on the object via the `compactLayoutAssignment` element in the object definition.

### Custom Labels

Path: `force-app/main/default/labels/CustomLabels.labels-meta.xml`

All custom labels live in a single file.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomLabels xmlns="http://soap.sforce.com/2006/04/metadata">
    <labels>
        <fullName>Error_Required_Field</fullName>
        <language>en_US</language>
        <protected>false</protected>
        <shortDescription>Error Required Field</shortDescription>
        <value>This field is required.</value>
    </labels>
</CustomLabels>
```

### Global Value Sets (Shared Picklists)

Path: `force-app/main/default/globalValueSets/<ValueSetName>.globalValueSet-meta.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<GlobalValueSet xmlns="http://soap.sforce.com/2006/04/metadata">
    <masterLabel>Priority Levels</masterLabel>
    <sorted>false</sorted>
    <customValue>
        <fullName>Low</fullName>
        <default>false</default>
        <label>Low</label>
    </customValue>
    <customValue>
        <fullName>Medium</fullName>
        <default>true</default>
        <label>Medium</label>
    </customValue>
    <customValue>
        <fullName>High</fullName>
        <default>false</default>
        <label>High</label>
    </customValue>
</GlobalValueSet>
```

- To use a global value set in a field, replace the inline `<valueSet>` with `<valueSet><valueSetName>ValueSetApiName</valueSetName></valueSet>`.

### Custom Metadata Types

Path: `force-app/main/default/objects/<TypeName>__mdt/<TypeName>__mdt.object-meta.xml`
Records: `force-app/main/default/customMetadata/<TypeName>.<RecordName>.md-meta.xml`

Custom metadata types are similar to custom objects but their records are metadata (deployable, packageable). Use them for app configuration that should be deployable across orgs.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>My Config</label>
    <pluralLabel>My Configs</pluralLabel>
    <visibility>Public</visibility>
</CustomObject>
```

Record example:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomMetadata xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>Default Config</label>
    <protected>false</protected>
    <values>
        <field>Setting_Value__c</field>
        <value xsi:type="xsd:string" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">some value</value>
    </values>
</CustomMetadata>
```
