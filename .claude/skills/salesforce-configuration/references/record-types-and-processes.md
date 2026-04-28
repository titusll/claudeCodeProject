# Record Types and Business Processes Reference

## Record Types

Path: `force-app/main/default/objects/<ObjectName>/recordTypes/<RecordTypeName>.recordType-meta.xml`

Record types allow you to offer different business processes, picklist values, and page layouts to different users based on their profile.

### Record Type Template

```xml
<?xml version="1.0" encoding="UTF-8"?>
<RecordType xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Record_Type_Name</fullName>
    <active>true</active>
    <label>Record Type Label</label>
    <description>Purpose of this record type.</description>
    <businessProcess>Support Process Name</businessProcess>
    <picklistValues>
        <picklist>Status__c</picklist>
        <values>
            <fullName>New</fullName>
            <default>true</default>
        </values>
        <values>
            <fullName>In Progress</fullName>
            <default>false</default>
        </values>
        <values>
            <fullName>Closed</fullName>
            <default>false</default>
        </values>
    </picklistValues>
</RecordType>
```

### Key rules

- `fullName` must match the file name (without `.recordType-meta.xml`).
- `active`: Set to `true` for record types that should be immediately usable.
- `businessProcess`: Only required for objects that use support processes (Case), sales processes (Opportunity), or lead processes (Lead). Omit for custom objects unless using a custom business process.
- `picklistValues`: Include only the picklist fields where this record type should restrict available values. Omit picklist fields that should show all values.
- Each `<values>` entry references an existing picklist value by `fullName`. Exactly one value should have `<default>true</default>`.
- After deploying, assign the record type to profiles or permission sets so users can access it.

---

## Business Processes (Support / Sales / Lead)

Business processes define the picklist values available in a controlling field for specific standard objects.

### Object-to-Process Mapping

| Object | Process Type | Controlling Field |
|--------|-------------|-------------------|
| Case | Support Process | `Status` |
| Opportunity | Sales Process | `StageName` |
| Lead | Lead Process | `Status` |

### Support Process Template (Case)

Path: `force-app/main/default/objects/Case/businessProcesses/<ProcessName>.businessProcess-meta.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<BusinessProcess xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Standard_Support_Process</fullName>
    <isActive>true</isActive>
    <description>Standard support process for customer cases.</description>
    <values>
        <fullName>New</fullName>
        <default>true</default>
    </values>
    <values>
        <fullName>Working</fullName>
        <default>false</default>
    </values>
    <values>
        <fullName>Escalated</fullName>
        <default>false</default>
    </values>
    <values>
        <fullName>Closed</fullName>
        <default>false</default>
    </values>
</BusinessProcess>
```

### Sales Process Template (Opportunity)

Path: `force-app/main/default/objects/Opportunity/businessProcesses/<ProcessName>.businessProcess-meta.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<BusinessProcess xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Standard_Sales_Process</fullName>
    <isActive>true</isActive>
    <description>Standard sales process for opportunities.</description>
    <values>
        <fullName>Prospecting</fullName>
        <default>true</default>
    </values>
    <values>
        <fullName>Qualification</fullName>
        <default>false</default>
    </values>
    <values>
        <fullName>Proposal/Price Quote</fullName>
        <default>false</default>
    </values>
    <values>
        <fullName>Negotiation/Review</fullName>
        <default>false</default>
    </values>
    <values>
        <fullName>Closed Won</fullName>
        <default>false</default>
    </values>
    <values>
        <fullName>Closed Lost</fullName>
        <default>false</default>
    </values>
</BusinessProcess>
```

### Key rules

- Business processes are stored inside the relevant object's `businessProcesses/` subdirectory.
- The `<values>` entries must reference **existing** picklist values on the controlling field.
- Exactly one value must have `<default>true</default>`.
- `isActive`: Set to `true` to make the process available for assignment to record types.
- Business processes are linked to record types via the `<businessProcess>` element in record type metadata.
- Each record type on Case, Opportunity, or Lead must reference a business process.
- You cannot delete a business process that is assigned to a record type.
