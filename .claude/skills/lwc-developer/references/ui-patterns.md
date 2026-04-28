# UI Patterns Reference

## Lightning Base Components

Always prefer Lightning base components over custom HTML elements — they include built-in accessibility, responsive design, and consistent Salesforce styling.

### Common Input Components

```html
<!-- Text input -->
<lightning-input
    label="Account Name"
    value={accountName}
    onchange={handleNameChange}
    required>
</lightning-input>

<!-- Number input -->
<lightning-input
    type="number"
    label="Amount"
    value={amount}
    formatter="currency"
    step="0.01"
    onchange={handleAmountChange}>
</lightning-input>

<!-- Date input -->
<lightning-input
    type="date"
    label="Start Date"
    value={startDate}
    onchange={handleDateChange}>
</lightning-input>

<!-- Checkbox -->
<lightning-input
    type="checkbox"
    label="Active"
    checked={isActive}
    onchange={handleActiveChange}>
</lightning-input>

<!-- Search input with debounce -->
<lightning-input
    type="search"
    label="Search Contacts"
    value={searchKey}
    onchange={handleSearchChange}
    placeholder="Search by name...">
</lightning-input>
```

### Handling Input Changes

```javascript
handleNameChange(event) {
    this.accountName = event.detail.value;
}

handleActiveChange(event) {
    this.isActive = event.detail.checked;  // Checkboxes use 'checked'
}

// Debounced search
handleSearchChange(event) {
    clearTimeout(this._debounceTimer);
    const searchKey = event.detail.value;
    this._debounceTimer = setTimeout(() => {
        this.searchKey = searchKey;
    }, 300);
}
```

### Combobox (Dropdown)

```html
<lightning-combobox
    name="industry"
    label="Industry"
    value={selectedIndustry}
    placeholder="Select an industry"
    options={industryOptions}
    onchange={handleIndustryChange}>
</lightning-combobox>
```

```javascript
get industryOptions() {
    return [
        { label: 'Technology', value: 'Technology' },
        { label: 'Finance', value: 'Finance' },
        { label: 'Healthcare', value: 'Healthcare' }
    ];
}

handleIndustryChange(event) {
    this.selectedIndustry = event.detail.value;
}
```

### Dual Listbox (Multi-Select)

```html
<lightning-dual-listbox
    label="Select Fields"
    source-label="Available"
    selected-label="Selected"
    options={fieldOptions}
    value={selectedFields}
    onchange={handleFieldChange}>
</lightning-dual-listbox>
```

### Buttons

```html
<!-- Standard button -->
<lightning-button label="Save" variant="brand" onclick={handleSave}></lightning-button>

<!-- Button with icon -->
<lightning-button label="New" icon-name="utility:add" onclick={handleNew}></lightning-button>

<!-- Icon-only button -->
<lightning-button-icon
    icon-name="utility:delete"
    alternative-text="Delete"
    variant="bare"
    onclick={handleDelete}>
</lightning-button-icon>

<!-- Button group -->
<lightning-button-group>
    <lightning-button label="Edit" onclick={handleEdit}></lightning-button>
    <lightning-button label="Delete" onclick={handleDelete}></lightning-button>
    <lightning-button-menu alternative-text="More actions">
        <lightning-menu-item label="Clone" value="clone" onclick={handleAction}></lightning-menu-item>
        <lightning-menu-item label="Share" value="share" onclick={handleAction}></lightning-menu-item>
    </lightning-button-menu>
</lightning-button-group>
```

**Button Variants:** `base`, `neutral` (default), `brand`, `brand-outline`, `destructive`, `destructive-text`, `inverse`, `success`

---

## lightning-card

The most common container component for building UI sections:

```html
<lightning-card title={cardTitle} icon-name="standard:contact">
    <!-- Header actions (right side of header) -->
    <lightning-button
        slot="actions"
        label="New Contact"
        icon-name="utility:add"
        onclick={handleNew}>
    </lightning-button>

    <!-- Card body -->
    <div class="slds-p-horizontal_small">
        <template lwc:if={hasContacts}>
            <template for:each={contacts} for:item="contact">
                <div key={contact.Id} class="slds-p-vertical_x-small">
                    <p class="slds-text-heading_small">{contact.Name}</p>
                    <p class="slds-text-body_small slds-text-color_weak">{contact.Email}</p>
                </div>
            </template>
        </template>
        <template lwc:else>
            <div class="slds-align_absolute-center slds-p-around_medium">
                <p class="slds-text-color_weak">No contacts found</p>
            </div>
        </template>
    </div>

    <!-- Footer -->
    <div slot="footer">
        <span class="slds-text-body_small">{contactCount} contacts</span>
    </div>
</lightning-card>
```

---

## lightning-datatable

For displaying tabular data with built-in sorting, inline editing, row selection, and infinite scrolling.

### Template

```html
<template>
    <lightning-card title="Contacts">
        <lightning-datatable
            key-field="Id"
            data={contacts}
            columns={columns}
            sorted-by={sortedBy}
            sorted-direction={sortedDirection}
            onsort={handleSort}
            onrowaction={handleRowAction}
            hide-checkbox-column
            show-row-number-column>
        </lightning-datatable>
    </lightning-card>
</template>
```

### JavaScript

```javascript
import { LightningElement, api, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getContacts from '@salesforce/apex/ContactController.getContacts';

const COLUMNS = [
    {
        label: 'Name',
        fieldName: 'nameUrl',
        type: 'url',
        typeAttributes: {
            label: { fieldName: 'Name' },
            target: '_blank'
        },
        sortable: true
    },
    { label: 'Email', fieldName: 'Email', type: 'email', sortable: true },
    { label: 'Phone', fieldName: 'Phone', type: 'phone' },
    {
        label: 'Created Date',
        fieldName: 'CreatedDate',
        type: 'date',
        typeAttributes: {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        },
        sortable: true
    },
    {
        label: 'Annual Revenue',
        fieldName: 'AnnualRevenue',
        type: 'currency',
        typeAttributes: { currencyCode: 'USD' }
    },
    {
        type: 'action',
        typeAttributes: {
            rowActions: [
                { label: 'View', name: 'view' },
                { label: 'Edit', name: 'edit' },
                { label: 'Delete', name: 'delete' }
            ]
        }
    }
];

export default class ContactTable extends NavigationMixin(LightningElement) {
    @api recordId;
    columns = COLUMNS;
    contacts = [];
    sortedBy;
    sortedDirection = 'asc';

    @wire(getContacts, { accountId: '$recordId' })
    wiredContacts({ data, error }) {
        if (data) {
            this.contacts = data.map(contact => ({
                ...contact,
                nameUrl: `/${contact.Id}`
            }));
        }
    }

    handleSort(event) {
        const { fieldName, sortDirection } = event.detail;
        this.sortedBy = fieldName;
        this.sortedDirection = sortDirection;

        const clonedData = [...this.contacts];
        clonedData.sort((a, b) => {
            let valueA = a[fieldName] || '';
            let valueB = b[fieldName] || '';
            if (typeof valueA === 'string') {
                valueA = valueA.toLowerCase();
                valueB = valueB.toLowerCase();
            }
            const direction = sortDirection === 'asc' ? 1 : -1;
            if (valueA > valueB) return direction;
            if (valueA < valueB) return -direction;
            return 0;
        });
        this.contacts = clonedData;
    }

    handleRowAction(event) {
        const action = event.detail.action;
        const row = event.detail.row;
        switch (action.name) {
            case 'view':
                this[NavigationMixin.Navigate]({
                    type: 'standard__recordPage',
                    attributes: {
                        recordId: row.Id,
                        actionName: 'view'
                    }
                });
                break;
            case 'edit':
                this[NavigationMixin.Navigate]({
                    type: 'standard__recordPage',
                    attributes: {
                        recordId: row.Id,
                        actionName: 'edit'
                    }
                });
                break;
            case 'delete':
                this.handleDelete(row.Id);
                break;
            default:
                break;
        }
    }
}
```

### Column Type Reference

| Type | Description | Common typeAttributes |
|---|---|---|
| `text` | Plain text (default) | |
| `number` | Formatted number | `minimumFractionDigits`, `maximumFractionDigits` |
| `currency` | Currency value | `currencyCode`, `minimumFractionDigits` |
| `percent` | Percentage | `minimumFractionDigits` |
| `date` | Date/datetime | `year`, `month`, `day`, `hour`, `minute` |
| `email` | Clickable email | |
| `phone` | Clickable phone | |
| `url` | Clickable link | `label`, `target`, `tooltip` |
| `boolean` | Checkbox | |
| `action` | Row action menu | `rowActions` (array), `menuAlignment` |
| `button` | Inline button | `label`, `variant`, `name` |
| `button-icon` | Inline icon button | `iconName`, `name`, `alternativeText` |

### Inline Editing

```javascript
const COLUMNS = [
    { label: 'Name', fieldName: 'Name', editable: true },
    { label: 'Email', fieldName: 'Email', type: 'email', editable: true }
];
```

```html
<lightning-datatable
    key-field="Id"
    data={contacts}
    columns={columns}
    onsave={handleInlineEdit}
    draft-values={draftValues}>
</lightning-datatable>
```

```javascript
async handleInlineEdit(event) {
    const updatedFields = event.detail.draftValues;
    try {
        await updateContacts({ contacts: updatedFields });
        this.draftValues = [];
        await refreshApex(this.wiredContactsResult);
        this.dispatchEvent(new ShowToastEvent({
            title: 'Success',
            message: 'Records updated',
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

---

## lightning-record-form / lightning-record-edit-form / lightning-record-view-form

### lightning-record-form (Simplest — Auto Layout)

Displays a form that automatically handles create, edit, and view modes:

```html
<lightning-record-form
    record-id={recordId}
    object-api-name="Contact"
    fields={fields}
    mode="edit"
    onsuccess={handleSuccess}
    onerror={handleError}>
</lightning-record-form>
```

```javascript
import NAME_FIELD from '@salesforce/schema/Contact.Name';
import EMAIL_FIELD from '@salesforce/schema/Contact.Email';
import PHONE_FIELD from '@salesforce/schema/Contact.Phone';

fields = [NAME_FIELD, EMAIL_FIELD, PHONE_FIELD];

handleSuccess(event) {
    this.dispatchEvent(new ShowToastEvent({
        title: 'Success',
        message: 'Record saved',
        variant: 'success'
    }));
}
```

### lightning-record-edit-form (Custom Layout)

For full control over field layout and submission:

```html
<lightning-record-edit-form
    record-id={recordId}
    object-api-name="Contact"
    onsuccess={handleSuccess}
    onerror={handleError}>

    <lightning-messages></lightning-messages>

    <div class="slds-grid slds-gutters">
        <div class="slds-col slds-size_1-of-2">
            <lightning-input-field field-name="FirstName"></lightning-input-field>
            <lightning-input-field field-name="LastName"></lightning-input-field>
        </div>
        <div class="slds-col slds-size_1-of-2">
            <lightning-input-field field-name="Email"></lightning-input-field>
            <lightning-input-field field-name="Phone"></lightning-input-field>
        </div>
    </div>

    <div class="slds-m-top_medium">
        <lightning-button variant="brand" type="submit" label="Save"></lightning-button>
        <lightning-button label="Cancel" onclick={handleCancel} class="slds-m-left_x-small"></lightning-button>
    </div>
</lightning-record-edit-form>
```

### lightning-record-view-form (Read-Only Custom Layout)

```html
<lightning-record-view-form record-id={recordId} object-api-name="Contact">
    <div class="slds-grid slds-gutters">
        <div class="slds-col">
            <lightning-output-field field-name="Name"></lightning-output-field>
            <lightning-output-field field-name="Email"></lightning-output-field>
        </div>
        <div class="slds-col">
            <lightning-output-field field-name="Phone"></lightning-output-field>
            <lightning-output-field field-name="CreatedDate"></lightning-output-field>
        </div>
    </div>
</lightning-record-view-form>
```

---

## SLDS Utility Classes

Use SLDS utility classes for spacing, alignment, and text styling instead of writing custom CSS:

### Spacing

| Class Pattern | Example | Effect |
|---|---|---|
| `slds-p-{side}_{size}` | `slds-p-around_medium` | Padding on all sides |
| `slds-m-{side}_{size}` | `slds-m-top_small` | Margin on top |

**Sides:** `around`, `horizontal`, `vertical`, `top`, `bottom`, `left`, `right`
**Sizes:** `xxx-small`, `xx-small`, `x-small`, `small`, `medium`, `large`, `x-large`, `xx-large`

### Grid Layout

```html
<!-- Two equal columns -->
<div class="slds-grid slds-gutters">
    <div class="slds-col slds-size_1-of-2">Column 1</div>
    <div class="slds-col slds-size_1-of-2">Column 2</div>
</div>

<!-- Three columns, responsive -->
<div class="slds-grid slds-wrap slds-gutters">
    <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-3">Col 1</div>
    <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-3">Col 2</div>
    <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-3">Col 3</div>
</div>

<!-- Centered content -->
<div class="slds-align_absolute-center" style="height: 200px;">
    <p>Centered content</p>
</div>
```

### Text

```html
<p class="slds-text-heading_large">Large Heading</p>
<p class="slds-text-heading_medium">Medium Heading</p>
<p class="slds-text-heading_small">Small Heading</p>
<p class="slds-text-body_regular">Regular body text</p>
<p class="slds-text-body_small">Small body text</p>
<p class="slds-text-color_error">Error text</p>
<p class="slds-text-color_success">Success text</p>
<p class="slds-text-color_weak">Muted text</p>
<p class="slds-text-align_center">Centered text</p>
<p class="slds-truncate" title="Long text that might overflow">Long text...</p>
```

---

## Modal (lightning-modal)

Available from API 55+. Create a modal by extending `LightningModal`:

### Modal Component (myModal.js)

```javascript
import LightningModal from 'lightning/modal';

export default class MyModal extends LightningModal {
    // Public property for the modal content
    label;    // Accessed via .open({ label: 'value' })
    content;

    handleConfirm() {
        // Close the modal and return a result
        this.close('confirm');
    }

    handleCancel() {
        this.close('cancel');
    }
}
```

### Modal Template (myModal.html)

```html
<template>
    <lightning-modal-header label={label}></lightning-modal-header>
    <lightning-modal-body>
        <p>{content}</p>
    </lightning-modal-body>
    <lightning-modal-footer>
        <lightning-button label="Cancel" onclick={handleCancel}></lightning-button>
        <lightning-button variant="brand" label="Confirm" onclick={handleConfirm}></lightning-button>
    </lightning-modal-footer>
</template>
```

### Opening the Modal from a Parent

```javascript
import MyModal from 'c/myModal';

async handleOpenModal() {
    const result = await MyModal.open({
        size: 'medium',         // 'small' | 'medium' | 'large' | 'full'
        label: 'Confirm Action',
        content: 'Are you sure you want to proceed?'
    });

    if (result === 'confirm') {
        // User confirmed
        await this.performAction();
    }
}
```

---

## Spinner / Loading State

```html
<template>
    <lightning-card title="My Component">
        <template lwc:if={isLoading}>
            <div class="slds-is-relative" style="min-height: 100px;">
                <lightning-spinner
                    alternative-text="Loading"
                    size="medium">
                </lightning-spinner>
            </div>
        </template>
        <template lwc:else>
            <!-- Content -->
        </template>
    </lightning-card>
</template>
```

---

## Tab Set

```html
<lightning-tabset>
    <lightning-tab label="Details" icon-name="utility:description">
        <c-account-details record-id={recordId}></c-account-details>
    </lightning-tab>
    <lightning-tab label="Contacts" icon-name="standard:contact">
        <c-contact-list record-id={recordId}></c-contact-list>
    </lightning-tab>
    <lightning-tab label="Activity" icon-name="standard:task">
        <c-activity-timeline record-id={recordId}></c-activity-timeline>
    </lightning-tab>
</lightning-tabset>
```

---

## Pill Container (Selected Items)

```html
<lightning-pill-container
    items={selectedItems}
    onitemremove={handleRemove}>
</lightning-pill-container>
```

```javascript
get selectedItems() {
    return this.selectedContacts.map(c => ({
        type: 'icon',
        label: c.Name,
        name: c.Id,
        iconName: 'standard:contact'
    }));
}

handleRemove(event) {
    const removedId = event.detail.item.name;
    this.selectedContacts = this.selectedContacts.filter(c => c.Id !== removedId);
}
```
