# Data and Apex Integration Reference

## Wire Service Overview

The wire service provides a reactive, declarative way to fetch data. When a reactive parameter (prefixed with `$`) changes, the wire adapter automatically re-fetches.

Two forms:
1. **Wire to a property** — the framework assigns `{ data, error }` to the property.
2. **Wire to a function** — the framework calls the function with `{ data, error }`.

Use the function form when you need to do post-processing on the result.

---

## @wire with Apex Methods

### Apex Controller (Server-Side)

The Apex method must be `@AuraEnabled`. For wire-compatible methods, add `cacheable=true`:

```java
public with sharing class ContactController {

    @AuraEnabled(cacheable=true)
    public static List<Contact> getContacts(Id accountId) {
        return [
            SELECT Id, Name, Email, Phone
            FROM Contact
            WHERE AccountId = :accountId
            ORDER BY Name
            LIMIT 50
        ];
    }

    @AuraEnabled
    public static Contact createContact(Contact newContact) {
        insert newContact;
        return newContact;
    }
}
```

**Key rules:**
- `cacheable=true` enables the method to be used with `@wire` and enables client-side caching. It also means the method **cannot perform DML** (insert, update, delete).
- Methods that perform DML must omit `cacheable=true` and be called imperatively.
- Always use `with sharing` to enforce record-level security, unless you have a documented reason not to.

### Wire to Property

```javascript
import { LightningElement, api, wire } from 'lwc';
import getContacts from '@salesforce/apex/ContactController.getContacts';

export default class ContactList extends LightningElement {
    @api recordId;

    // Wire assigns { data, error } to this property
    @wire(getContacts, { accountId: '$recordId' })
    contacts;

    get hasContacts() {
        return this.contacts?.data?.length > 0;
    }

    get contactList() {
        return this.contacts?.data || [];
    }

    get errorMessage() {
        return this.contacts?.error?.body?.message;
    }
}
```

**Template:**
```html
<template>
    <template lwc:if={contacts.data}>
        <template for:each={contactList} for:item="contact">
            <p key={contact.Id}>{contact.Name}</p>
        </template>
    </template>
    <template lwc:elseif={contacts.error}>
        <p class="slds-text-color_error">{errorMessage}</p>
    </template>
</template>
```

### Wire to Function

Use this when you need to transform data or run additional logic after receiving results:

```javascript
import { LightningElement, api, wire } from 'lwc';
import getContacts from '@salesforce/apex/ContactController.getContacts';

export default class ContactList extends LightningElement {
    @api recordId;
    contacts;
    error;
    isLoading = true;

    @wire(getContacts, { accountId: '$recordId' })
    wiredContacts({ data, error }) {
        this.isLoading = false;
        if (data) {
            // Transform or process data
            this.contacts = data.map(contact => ({
                ...contact,
                displayName: `${contact.Name} (${contact.Email || 'No email'})`
            }));
            this.error = undefined;
        } else if (error) {
            this.contacts = undefined;
            this.error = error;
        }
    }
}
```

### Reactive Parameters

Parameters prefixed with `$` are reactive — the wire re-fires when they change:

```javascript
@api recordId;           // When parent changes recordId, wire re-fires
searchKey = '';           // When this.searchKey changes, wire re-fires

@wire(searchContacts, { accountId: '$recordId', searchTerm: '$searchKey' })
contacts;
```

**Important:** The `$` prefix refers to a **property on the component class**, not a JavaScript variable. `$recordId` maps to `this.recordId`.

---

## Imperative Apex Calls

Use imperative calls when:
- You need to perform DML (create, update, delete).
- You need to control when the call happens (e.g., on button click).
- You need to chain multiple server calls.

### Basic Pattern

```javascript
import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createContact from '@salesforce/apex/ContactController.createContact';

export default class CreateContact extends LightningElement {
    @api recordId;
    isLoading = false;

    async handleSave() {
        this.isLoading = true;
        try {
            const contact = {
                FirstName: this.template.querySelector('[data-id="firstName"]').value,
                LastName: this.template.querySelector('[data-id="lastName"]').value,
                AccountId: this.recordId
            };
            const result = await createContact({ newContact: contact });
            this.dispatchEvent(new ShowToastEvent({
                title: 'Success',
                message: `Contact ${result.Name} created`,
                variant: 'success'
            }));
            // Notify parent to refresh
            this.dispatchEvent(new CustomEvent('contactcreated', {
                detail: { contactId: result.Id }
            }));
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error creating contact',
                message: error.body?.message || 'Unknown error',
                variant: 'error'
            }));
        } finally {
            this.isLoading = false;
        }
    }
}
```

### Refreshing Wire Data After DML

After an imperative call modifies data, refresh any related wire adapters using `refreshApex`:

```javascript
import { LightningElement, api, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import getContacts from '@salesforce/apex/ContactController.getContacts';
import deleteContact from '@salesforce/apex/ContactController.deleteContact';

export default class ContactList extends LightningElement {
    @api recordId;

    // Store the full wire result for refreshApex
    wiredContactsResult;

    @wire(getContacts, { accountId: '$recordId' })
    wiredContacts(result) {
        this.wiredContactsResult = result; // Store the provisioned value
        const { data, error } = result;
        if (data) {
            this.contacts = data;
        } else if (error) {
            this.error = error;
        }
    }

    contacts;
    error;

    async handleDelete(event) {
        const contactId = event.target.dataset.id;
        try {
            await deleteContact({ contactId });
            // Refresh the wire adapter's cached data
            await refreshApex(this.wiredContactsResult);
        } catch (error) {
            console.error('Delete failed:', error);
        }
    }
}
```

**Critical:** Pass the **entire provisioned value** (the `result` object from the wire function) to `refreshApex`, not just `data` or `error`.

---

## Lightning Data Service (LDS)

LDS provides wire adapters for standard CRUD operations without writing Apex. It handles caching, sharing rules, and field-level security automatically.

### Import Schema References

Always import field and object references rather than using string literals:

```javascript
import ACCOUNT_OBJECT from '@salesforce/schema/Account';
import NAME_FIELD from '@salesforce/schema/Account.Name';
import INDUSTRY_FIELD from '@salesforce/schema/Account.Industry';
import OWNER_NAME_FIELD from '@salesforce/schema/Account.Owner.Name'; // Spanning relationship
```

### getRecord — Read a Single Record

```javascript
import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import NAME_FIELD from '@salesforce/schema/Account.Name';
import INDUSTRY_FIELD from '@salesforce/schema/Account.Industry';
import ANNUAL_REVENUE_FIELD from '@salesforce/schema/Account.AnnualRevenue';

const FIELDS = [NAME_FIELD, INDUSTRY_FIELD, ANNUAL_REVENUE_FIELD];

export default class AccountDetail extends LightningElement {
    @api recordId;

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    account;

    get name() {
        return getFieldValue(this.account.data, NAME_FIELD);
    }

    get industry() {
        return getFieldValue(this.account.data, INDUSTRY_FIELD);
    }

    get annualRevenue() {
        return getFieldValue(this.account.data, ANNUAL_REVENUE_FIELD);
    }

    get hasError() {
        return !!this.account.error;
    }
}
```

**`fields` vs `optionalFields`:**
- `fields`: The wire errors if the user lacks access to any listed field.
- `optionalFields`: Missing fields return `undefined` instead of erroring. Use for fields the user might not have permission to see.

### getRecord with Layout

Fetch all fields from a specific page layout:

```javascript
import { getRecord } from 'lightning/uiRecordApi';

@wire(getRecord, { recordId: '$recordId', layoutTypes: ['Full'] })
account;
```

### createRecord

```javascript
import { LightningElement } from 'lwc';
import { createRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import CONTACT_OBJECT from '@salesforce/schema/Contact';
import FIRST_NAME_FIELD from '@salesforce/schema/Contact.FirstName';
import LAST_NAME_FIELD from '@salesforce/schema/Contact.LastName';
import ACCOUNT_FIELD from '@salesforce/schema/Contact.AccountId';

export default class CreateContact extends LightningElement {
    async handleCreate() {
        const fields = {};
        fields[FIRST_NAME_FIELD.fieldApiName] = 'Jane';
        fields[LAST_NAME_FIELD.fieldApiName] = 'Doe';
        fields[ACCOUNT_FIELD.fieldApiName] = this.accountId;

        try {
            const record = await createRecord({ apiName: CONTACT_OBJECT.objectApiName, fields });
            this.dispatchEvent(new ShowToastEvent({
                title: 'Success',
                message: 'Contact created with Id: ' + record.id,
                variant: 'success'
            }));
        } catch (error) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: error.body?.message || 'Could not create record',
                variant: 'error'
            }));
        }
    }
}
```

### updateRecord

```javascript
import { updateRecord } from 'lightning/uiRecordApi';
import ID_FIELD from '@salesforce/schema/Contact.Id';
import EMAIL_FIELD from '@salesforce/schema/Contact.Email';

async handleUpdate() {
    const fields = {};
    fields[ID_FIELD.fieldApiName] = this.recordId;
    fields[EMAIL_FIELD.fieldApiName] = this.newEmail;

    try {
        await updateRecord({ fields });
        this.dispatchEvent(new ShowToastEvent({
            title: 'Success',
            message: 'Record updated',
            variant: 'success'
        }));
    } catch (error) {
        this.dispatchEvent(new ShowToastEvent({
            title: 'Error',
            message: error.body?.message || 'Update failed',
            variant: 'error'
        }));
    }
}
```

### deleteRecord

```javascript
import { deleteRecord } from 'lightning/uiRecordApi';

async handleDelete() {
    try {
        await deleteRecord(this.recordId);
        this.dispatchEvent(new ShowToastEvent({
            title: 'Deleted',
            message: 'Record deleted',
            variant: 'success'
        }));
    } catch (error) {
        this.dispatchEvent(new ShowToastEvent({
            title: 'Error',
            message: error.body?.message || 'Delete failed',
            variant: 'error'
        }));
    }
}
```

### getRecordNotifyChange (Deprecated) vs notifyRecordUpdateAvailable

For API 55+, use `notifyRecordUpdateAvailable` to tell LDS that a record has changed (after imperative Apex DML):

```javascript
import { notifyRecordUpdateAvailable } from 'lightning/uiRecordApi';

async handleSave() {
    await updateContactApex({ contactId: this.recordId, email: this.newEmail });
    // Notify LDS to refetch this record's data
    await notifyRecordUpdateAvailable([{ recordId: this.recordId }]);
}
```

---

## Other Useful Wire Adapters

### getObjectInfo

Get metadata about an object (field definitions, record type info):

```javascript
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import ACCOUNT_OBJECT from '@salesforce/schema/Account';

@wire(getObjectInfo, { objectApiName: ACCOUNT_OBJECT })
accountInfo;

get recordTypeOptions() {
    if (!this.accountInfo.data) return [];
    const rtInfos = this.accountInfo.data.recordTypeInfos;
    return Object.values(rtInfos)
        .filter(rt => rt.available)
        .map(rt => ({ label: rt.name, value: rt.recordTypeId }));
}
```

### getPicklistValues

```javascript
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import INDUSTRY_FIELD from '@salesforce/schema/Account.Industry';

@wire(getPicklistValues, { recordTypeId: '$recordTypeId', fieldApiName: INDUSTRY_FIELD })
industryOptions;
```

### getListUi (List Views)

```javascript
import { getListUi } from 'lightning/uiListApi';
import ACCOUNT_OBJECT from '@salesforce/schema/Account';

@wire(getListUi, { objectApiName: ACCOUNT_OBJECT, listViewApiName: 'AllAccounts' })
listView;
```

---

## Error Handling Patterns

### Standard Error Shape

Apex errors from `@wire` and imperative calls follow this structure:

```javascript
{
    body: {
        message: 'An error occurred',           // Human-readable message
        errorCode: 'INVALID_FIELD',             // Optional error code
        fieldErrors: {},                         // Field-level errors
        pageErrors: [{ message: '...' }]        // Page-level errors
    },
    status: 400,                                // HTTP status code
    statusText: 'Bad Request'
}
```

### Reusable Error Reducer

```javascript
/**
 * Reduces one or more error types into a flat array of error messages.
 * Works with wire errors, imperative Apex errors, and LDS errors.
 */
export function reduceErrors(errors) {
    if (!Array.isArray(errors)) {
        errors = [errors];
    }
    return errors
        .filter(error => !!error)
        .map(error => {
            if (Array.isArray(error.body)) {
                return error.body.map(e => e.message);
            } else if (error.body && typeof error.body.message === 'string') {
                return error.body.message;
            } else if (typeof error.message === 'string') {
                return error.message;
            }
            return error.statusText || 'Unknown error';
        })
        .reduce((prev, curr) => prev.concat(curr), []);
}
```

Import and use this utility across components for consistent error handling.
