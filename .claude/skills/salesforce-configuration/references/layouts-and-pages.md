# Page Layouts and Lightning Record Pages Reference

## Page Layouts

Path: `force-app/main/default/layouts/<ObjectName>-<Layout Name>.layout-meta.xml`

### Layout Template

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Layout xmlns="http://soap.sforce.com/2006/04/metadata">
    <layoutSections>
        <customLabel>false</customLabel>
        <detailHeading>false</detailHeading>
        <editHeading>true</editHeading>
        <label>Information</label>
        <style>TwoColumnsTopToBottom</style>
        <layoutColumns>
            <layoutItems>
                <behavior>Required</behavior>
                <field>Name</field>
            </layoutItems>
        </layoutColumns>
        <layoutColumns>
            <layoutItems>
                <behavior>Edit</behavior>
                <field>OwnerId</field>
            </layoutItems>
        </layoutColumns>
    </layoutSections>
    <layoutSections>
        <customLabel>true</customLabel>
        <detailHeading>true</detailHeading>
        <editHeading>true</editHeading>
        <label>Custom Section</label>
        <style>TwoColumnsLeftToRight</style>
        <layoutColumns>
            <layoutItems>
                <behavior>Edit</behavior>
                <field>Custom_Field__c</field>
            </layoutItems>
        </layoutColumns>
        <layoutColumns/>
    </layoutSections>
    <layoutSections>
        <customLabel>true</customLabel>
        <detailHeading>true</detailHeading>
        <editHeading>true</editHeading>
        <label>System Information</label>
        <style>TwoColumnsTopToBottom</style>
        <layoutColumns>
            <layoutItems>
                <behavior>Readonly</behavior>
                <field>CreatedById</field>
            </layoutItems>
        </layoutColumns>
        <layoutColumns>
            <layoutItems>
                <behavior>Readonly</behavior>
                <field>LastModifiedById</field>
            </layoutItems>
        </layoutColumns>
    </layoutSections>
    <showEmailCheckbox>false</showEmailCheckbox>
    <showRunAssignmentRulesCheckbox>false</showRunAssignmentRulesCheckbox>
    <showSubmitAndAttachButton>false</showSubmitAndAttachButton>
</Layout>
```

### Key rules

- `behavior` values: `Required`, `Edit`, `Readonly`.
- `style` values: `TwoColumnsTopToBottom`, `TwoColumnsLeftToRight`, `OneColumn`, `CustomLinks`.
- Empty columns must be represented as `<layoutColumns/>`.
- Page layout XML node ordering can vary between retrievals — this is a known Salesforce quirk. Aim for consistent order but don't be alarmed by diff noise.

---

## Lightning Record Pages (FlexiPage)

Path: `force-app/main/default/flexipages/<PageName>.flexipage-meta.xml`

The metadata type is `FlexiPage`. Lightning record pages define component layout for Lightning Experience.

**IMPORTANT**: FlexiPage XML structure varies significantly across Salesforce API versions. The template below is verified for **API v66.0**. If your org uses a different API version, retrieve an existing FlexiPage first to confirm the correct format:

```bash
sf project retrieve start --metadata FlexiPage:<ExistingPageName>
```

### Minimal Record Page Template (API v66.0)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<FlexiPage xmlns="http://soap.sforce.com/2006/04/metadata">
    <flexiPageRegions>
        <itemInstances>
            <componentInstance>
                <componentInstanceProperties>
                    <name>collapsed</name>
                    <value>false</value>
                </componentInstanceProperties>
                <componentName>force:highlightsPanel</componentName>
                <identifier>force_highlightsPanel</identifier>
            </componentInstance>
        </itemInstances>
        <name>header</name>
        <type>Region</type>
    </flexiPageRegions>
    <flexiPageRegions>
        <itemInstances>
            <componentInstance>
                <componentName>force:detailPanel</componentName>
                <identifier>force_detailPanel</identifier>
            </componentInstance>
        </itemInstances>
        <itemInstances>
            <componentInstance>
                <componentName>force:relatedListContainer</componentName>
                <identifier>force_relatedListContainer</identifier>
            </componentInstance>
        </itemInstances>
        <name>main</name>
        <type>Region</type>
    </flexiPageRegions>
    <masterLabel>Object Record Page</masterLabel>
    <sobjectType>CustomObject__c</sobjectType>
    <template>
        <name>flexipage:recordHomeTemplateDesktop</name>
    </template>
    <type>RecordPage</type>
</FlexiPage>
```

### Key structural differences by API version

| Element | Pre-v60 (legacy) | v60+ / v66.0 |
|---------|-------------------|---------------|
| Component wrapper | `<componentInstances>` | `<itemInstances>` > `<componentInstance>` |
| Component name | `<componentName>` (direct child of componentInstances) | `<componentName>` (child of componentInstance) |
| Identifier | Not required | `<identifier>` required inside `<componentInstance>` |
| Region mode | `<mode>Replace</mode>` supported | Do NOT use `<mode>` — it causes "parent region enabling that mode doesn't exist" errors |

### Key considerations

- `type` values: `RecordPage`, `AppPage`, `HomePage`.
- `template.name`: Common templates include `flexipage:recordHomeTemplateDesktop` and `flexipage:recordHomeWithSubheaderTemplateDesktop`.
- Standard components: `force:highlightsPanel` (highlights panel), `force:detailPanel` (record detail), `force:relatedListContainer` (related lists).
- `identifier` values: use the component name with colons replaced by underscores (e.g., `force:detailPanel` -> `force_detailPanel`).
- Multiple components in the same region: add multiple `<itemInstances>` blocks within the same `<flexiPageRegions>` element.

### FlexiPage Activation / Assignment

Lightning record page activation/assignment is NOT stored in the FlexiPage metadata itself. Profile-based page assignment via metadata is unreliable across API versions and frequently causes deploy errors.

**Recommended approach**: Deploy the FlexiPage metadata, then activate manually:
1. Go to **Setup > Lightning App Builder**.
2. Find the record page > click the dropdown > **Edit**.
3. Click **Activation** > **App, Record Type, and Profile** tab.
4. Assign it to the desired profile(s).
5. Save.

This is a one-time step per page and avoids fragile metadata dependencies.
