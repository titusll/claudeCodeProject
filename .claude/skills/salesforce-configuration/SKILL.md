---
name: salesforce-configuration
description: >
  Best practice guide for building Salesforce declarative metadata in SFDX source format (XML).
  Covers custom objects, fields, profiles, permission sets, page layouts, lightning record pages,
  record types, validation rules, duplicate rules, matching rules, approval processes, support
  processes, sales processes, lead processes, custom tabs, list views, compact layouts, custom
  labels, global value sets, custom metadata types, and app navigation.
  Use this skill whenever a user asks to create, modify, delete, or troubleshoot any Salesforce
  declarative/config metadata — even if they just say "add a field", "set up permissions",
  "create an object", or "add a validation rule" without explicitly mentioning Salesforce
  metadata format.
  NOT for Salesforce flows, Lightning Web Components, Apex classes, or triggers.
---

# Salesforce Configuration Build Guide

## General Principles

- All output metadata MUST be in **SFDX source format** (not legacy Metadata API format).
- Every XML file MUST begin with `<?xml version="1.0" encoding="UTF-8"?>`.
- Every root element MUST include the namespace: `xmlns="http://soap.sforce.com/2006/04/metadata"`.
- Use the API version defined in `sfdx-project.json` (read it at the start of each task). If unknown, default to **66.0**.
- Never generate `package.xml` unless explicitly asked. Source format deploys via `sf project deploy start` without one.
- When creating new metadata, always check existing project files for naming conventions, API version, and org-specific patterns before generating.
- Sort XML child elements alphabetically within their parent where Salesforce convention allows, to reduce noisy diffs.
- **MasterDetail rule**: Any object with a MasterDetail field MUST use `sharingModel: ControlledByParent`. This is the single most common deploy failure — check it every time.

## Naming Conventions

- **API names**: PascalCase with underscores, suffixed appropriately (`__c` for custom objects/fields, `__mdt` for custom metadata types). Example: `Invoice_Line_Item__c`.
- **Labels**: Title Case with spaces. Example: "Invoice Line Item".
- **Plural labels**: Always provide for custom objects. Example: "Invoice Line Items".
- **Lightning record pages**: Descriptive names combining object and purpose. Example: `Account_Sales_Record_Page`.
- **Page layouts**: Follow the pattern `ObjectName-LayoutName`. Example: `Account-Sales Layout`.
- **Permission sets**: Descriptive PascalCase. Example: `Invoice_Manager`.
- **Custom tabs**: Use the object API name as the tab file name. Example: `Invoice_Line_Item__c.tab-meta.xml`.

## Reference Files

Detailed XML templates and type-specific guidance live in `references/`. Read the relevant file when working on that metadata type:

| When you need to... | Read |
|---------------------|------|
| Create/modify custom objects or fields | `references/objects-and-fields.md` |
| Build page layouts or Lightning record pages (FlexiPages) | `references/layouts-and-pages.md` |
| Set up permission sets or modify profiles | `references/permissions-and-profiles.md` |
| Create record types or business processes (support/sales/lead) | `references/record-types-and-processes.md` |
| Write validation rules, duplicate rules, or matching rules | `references/validation-and-duplicates.md` |
| Build approval processes | `references/approval-processes.md` |
| Create custom tabs, list views, compact layouts, custom labels, global value sets, or custom metadata types | `references/tabs-and-apps.md` |

## Deployment Order

Deploy in this order to avoid dependency failures:

1. **Custom Objects** — create object definitions first (remember `ControlledByParent` for MasterDetail children)
2. **Custom Fields** — depend on parent object existing
3. **Business Processes** — must exist before record types that reference them
4. **Record Types** — depend on objects, fields, and business processes
5. **Custom Tabs** — depend on the object existing; deploy together with objects
6. **Custom Application updates** — add `<tabs>` entries for new tabs in app navigation
7. **Validation Rules** — reference fields on the object
8. **Matching Rules** — must exist before duplicate rules
9. **Duplicate Rules** — reference matching rules
10. **Page Layouts** — reference fields
11. **Lightning Record Pages** — may reference layouts and components; activate via Setup after deploying
12. **Permission Sets / Profiles** — reference objects and fields for FLS
13. **Approval Processes** — reference field updates, email alerts, etc.; deploy as inactive, then activate after verification

### Deploy commands

```bash
# Deploy a full object and its children
sf project deploy start --source-dir force-app/main/default/objects/CustomObject__c

# Deploy specific metadata
sf project deploy start --metadata CustomObject:CustomObject__c
sf project deploy start --metadata CustomField:CustomObject__c.Field_Name__c

# Validate before deploying to production
sf project deploy start --source-dir force-app --dry-run
```

## Pre-Generation Checklist

Before writing any metadata file, confirm these details with the user — do not assume defaults for relationship types, sharing models, or picklist values:

- Object API name and label (for new objects)
- Field types and constraints (length, precision, required, default values)
- Picklist values (if applicable) — restricted or open?
- Relationship type (Lookup vs Master-Detail) and delete constraint
- Sharing model — if any field is MasterDetail, must be `ControlledByParent`
- Whether custom tabs should be created and added to an app's navigation
- Whether record types are needed and which picklist values each should include
- Whether business processes need to be created for record types
- Whether validation rules are needed and what conditions they should enforce
- Whether duplicate/matching rules are needed
- Whether an approval process is needed and who the approvers are
- Whether a permission set should be created alongside new objects/fields
- Whether page layouts and lightning record pages need updating

## Quick Links

- [Metadata API Developer Guide — CustomField](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/customfield.htm)
- [Metadata API Developer Guide — Layout](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_layouts.htm)
- [Metadata API Developer Guide — FlexiPage](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_flexipage.htm)
- [Metadata API Developer Guide — PermissionSet](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_permissionset.htm)
- [SFDX Source Format](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_source_file_format.htm)
- [Metadata Types List](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_types_list.htm)
