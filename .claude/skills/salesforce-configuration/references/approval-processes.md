# Approval Processes Reference

Path: `force-app/main/default/approvalProcesses/<ObjectName>.<ProcessName>.approvalProcess-meta.xml`

Approval processes automate record approval by routing records to designated approvers based on criteria.

## Approval Process Template

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ApprovalProcess xmlns="http://soap.sforce.com/2006/04/metadata">
    <active>false</active>
    <allowRecall>true</allowRecall>
    <allowedSubmitters>
        <type>allInternalUsers</type>
    </allowedSubmitters>
    <description>Approval process for high-value records.</description>
    <enableMobileDeviceAccess>true</enableMobileDeviceAccess>
    <entryCriteria>
        <criteriaItems>
            <field>CustomObject__c.Amount__c</field>
            <operation>greaterOrEqual</operation>
            <value>10000</value>
        </criteriaItems>
    </entryCriteria>
    <finalApprovalActions>
        <action>
            <name>Set_Status_Approved</name>
            <type>FieldUpdate</type>
        </action>
    </finalApprovalActions>
    <finalApprovalRecordLock>true</finalApprovalRecordLock>
    <finalRejectionActions>
        <action>
            <name>Set_Status_Rejected</name>
            <type>FieldUpdate</type>
        </action>
    </finalRejectionActions>
    <finalRejectionRecordLock>false</finalRejectionRecordLock>
    <initialSubmissionActions>
        <action>
            <name>Set_Status_Pending</name>
            <type>FieldUpdate</type>
        </action>
    </initialSubmissionActions>
    <label>High Value Approval</label>
    <recordEditability>AdminOrCurrentApprover</recordEditability>
    <showApprovalHistory>true</showApprovalHistory>
    <approvalStep>
        <allowDelegate>false</allowDelegate>
        <assignedApprover>
            <approver>
                <name>Manager</name>
                <type>relatedUserField</type>
            </approver>
            <whenMultipleApprovers>FirstResponse</whenMultipleApprovers>
        </assignedApprover>
        <label>Manager Approval</label>
        <name>Manager_Approval</name>
        <rejectBehavior>
            <type>RejectRequest</type>
        </rejectBehavior>
    </approvalStep>
</ApprovalProcess>
```

## Key rules

- `active`: Deploy as `false` first, verify in the org, then activate. Activating via metadata is supported but risky — test thoroughly.
- `allowedSubmitters.type` values: `allInternalUsers`, `user`, `group`, `role`, `roleSubordinates`, `roleSubordinatesInternal`, `owner`, `creator`.
- `entryCriteria`: Defines which records enter the process. Omit for processes that apply to all records.
- `criteriaItems.operation` values: `equals`, `notEqual`, `greaterOrEqual`, `lessOrEqual`, `greaterThan`, `lessThan`, `contains`, `notContain`, `startsWith`.
- `approvalStep`: At least one step is required. Steps execute in the order they appear.
- `assignedApprover.approver.type` values: `user` (specific user), `relatedUserField` (e.g., Manager), `userHierarchyField`, `queue`.
- `whenMultipleApprovers` values: `FirstResponse` (first approver decides), `Unanimous` (all must approve).
- `rejectBehavior.type` values: `RejectRequest` (final rejection), `BackToPrevious` (return to prior step).
- `recordEditability` values: `AdminOnly`, `AdminOrCurrentApprover`.
- Actions (`finalApprovalActions`, `finalRejectionActions`, `initialSubmissionActions`, `recallActions`) reference field updates, email alerts, tasks, or outbound messages by `name` and `type`.
- Field updates, email alerts, and other referenced actions must be deployed alongside or before the approval process.

## Action Types

| Type | Description |
|------|-------------|
| `FieldUpdate` | Update a field value on the record |
| `EmailAlert` | Send an email notification |
| `Task` | Create a task assigned to a user |
| `OutboundMessage` | Send a SOAP message to an external service |
