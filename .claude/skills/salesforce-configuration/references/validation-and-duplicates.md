# Validation Rules and Duplicate Rules Reference

## Validation Rules

Path: `force-app/main/default/objects/<ObjectName>/validationRules/<RuleName>.validationRule-meta.xml`

Validation rules verify that data meets specific criteria before a record can be saved.

### Validation Rule Template

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ValidationRule xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Rule_Name</fullName>
    <active>true</active>
    <errorConditionFormula>ISBLANK(Field_Name__c) &amp;&amp; ISPICKVAL(Status__c, "Closed")</errorConditionFormula>
    <errorDisplayField>Field_Name__c</errorDisplayField>
    <errorMessage>Field Name is required when Status is Closed.</errorMessage>
    <description>Enforces that Field Name is populated before closing.</description>
</ValidationRule>
```

### Key rules

- `errorConditionFormula`: The formula that, when `true`, **blocks** the save. Use standard Salesforce formula syntax.
- **XML-escape special characters** in formulas: `&` -> `&amp;`, `<` -> `&lt;`, `>` -> `&gt;`, `"` -> `&quot;`. This is the most common mistake when writing validation rule metadata.
- `errorDisplayField`: (Optional) The API name of the field where the error message appears. If omitted, the error displays at the top of the page.
- `errorMessage`: Keep it clear and actionable.
- `active`: Set to `true` to enforce immediately, or `false` to deploy without enforcing (useful for testing).
- Validation rules run on insert and update, not on delete.
- Avoid overly complex formulas — break into multiple rules for clarity.
- Reference fields using API names. For cross-object references, use the relationship name (e.g., `Account__r.Name`).

### Common formula patterns

| Pattern | Formula |
|---------|---------|
| Required if another field has a value | `ISBLANK(Field_A__c) &amp;&amp; NOT(ISBLANK(Field_B__c))` |
| Prevent past dates | `Date_Field__c &lt; TODAY()` |
| Picklist value check | `ISPICKVAL(Status__c, "Closed") &amp;&amp; ISBLANK(Reason__c)` |
| Regex pattern match | `NOT(REGEX(Email_Field__c, "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"))` |
| Record type specific | `RecordType.DeveloperName = "Type_A" &amp;&amp; ISBLANK(Required_Field__c)` |

---

## Duplicate Rules

Duplicate rules work together with matching rules to detect and manage duplicate records.

### Duplicate Rule

Path: `force-app/main/default/duplicateRules/<ObjectName>.<RuleName>.duplicateRule-meta.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<DuplicateRule xmlns="http://soap.sforce.com/2006/04/metadata">
    <actionOnInsert>Allow</actionOnInsert>
    <actionOnUpdate>Allow</actionOnUpdate>
    <alertText>You may be creating a duplicate record. Check existing records before saving.</alertText>
    <description>Prevents duplicate records based on matching criteria.</description>
    <isActive>true</isActive>
    <masterLabel>Duplicate Rule Label</masterLabel>
    <operationsOnInsert>Alert</operationsOnInsert>
    <operationsOnUpdate>Alert</operationsOnUpdate>
    <securityOption>EnforceSharingRules</securityOption>
    <sortOrder>1</sortOrder>
    <duplicateRuleMatchRules>
        <matchRuleSObjectType>CustomObject__c</matchRuleSObjectType>
        <matchingRule>Custom_Matching_Rule</matchingRule>
        <objectMapping/>
    </duplicateRuleMatchRules>
    <duplicateRuleFilter>
        <booleanFilter/>
        <duplicateRuleFilterItems>
            <field>IsDeleted</field>
            <operation>equals</operation>
            <value>false</value>
            <sortOrder>1</sortOrder>
        </duplicateRuleFilterItems>
    </duplicateRuleFilter>
</DuplicateRule>
```

### Matching Rule

Path: `force-app/main/default/matchingRules/<ObjectName>.matchingRule-meta.xml`

Matching rules define the criteria used to identify duplicates. A duplicate rule references one or more matching rules.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<MatchingRules xmlns="http://soap.sforce.com/2006/04/metadata">
    <matchingRules>
        <fullName>Custom_Matching_Rule</fullName>
        <label>Custom Matching Rule</label>
        <description>Matches records by name and email.</description>
        <ruleStatus>Active</ruleStatus>
        <matchingRuleItems>
            <blankValueBehavior>NullNotAllowed</blankValueBehavior>
            <fieldName>Name</fieldName>
            <matchingMethod>Exact</matchingMethod>
        </matchingRuleItems>
        <matchingRuleItems>
            <blankValueBehavior>NullNotAllowed</blankValueBehavior>
            <fieldName>Email__c</fieldName>
            <matchingMethod>Exact</matchingMethod>
        </matchingRuleItems>
    </matchingRules>
</MatchingRules>
```

### Key rules

- **Duplicate rules** control what happens when a duplicate is found: `Allow` (let user save), `Block` (prevent save).
- `operationsOnInsert` / `operationsOnUpdate`: `Alert` (warn user), `Block` (prevent save), or `Report` (log only).
- **Matching rules** define *how* duplicates are identified. `matchingMethod` values: `Exact`, `FirstName`, `LastName`, `CompanyName`, `Phone`, `City`, `Street`, `Zip`, `Title`.
- `blankValueBehavior`: `NullNotAllowed` (blank fields never match) or `NullEqualsNull` (two blank fields count as a match).
- `securityOption`: `EnforceSharingRules` (only match records visible to user) or `BypassSharingRules` (match all records).
- Deploy matching rules before duplicate rules, as duplicate rules reference matching rules.
- Standard matching rules exist for Account, Contact, and Lead — check existing rules before creating new ones.
