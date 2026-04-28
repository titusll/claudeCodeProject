# Component Communication Reference

## Overview

LWC provides three main patterns for component communication:

| Pattern | Direction | Scope | When to Use |
|---|---|---|---|
| Public properties (`@api`) | Parent to child | Direct parent-child | Passing data down |
| Custom events | Child to parent | Direct child-parent | Notifying parent of actions |
| Lightning Message Service (LMS) | Any to any | Entire page (cross-DOM) | Unrelated components on the same page |

General rule: prefer the simplest pattern that works. Use `@api` + events for parent-child, and LMS only when components are not in a direct ancestor-descendant relationship.

---

## Parent to Child: Public Properties (@api)

The parent sets values on the child via HTML attributes or JavaScript. The child declares them with `@api`.

### Child Component (childComponent.js)

```javascript
import { LightningElement, api } from 'lwc';

export default class ChildComponent extends LightningElement {
    @api title = 'Default Title';    // With default value
    @api recordId;                    // No default
    @api
    get formattedItems() {
        return this._items;
    }
    set formattedItems(value) {
        // Custom setter for validation or transformation
        this._items = value ? value.map(item => ({
            ...item,
            label: item.name.toUpperCase()
        })) : [];
    }
    _items = [];
}
```

### Parent Template

```html
<template>
    <!-- Static value -->
    <c-child-component title="Account Details"></c-child-component>

    <!-- Dynamic binding -->
    <c-child-component
        title={cardTitle}
        record-id={selectedRecordId}
        formatted-items={myItems}>
    </c-child-component>
</template>
```

**Important:** Property names are camelCase in JS (`recordId`) but kebab-case in HTML (`record-id`).

### Calling Public Methods on a Child

A parent can call `@api` methods on a child by querying the DOM:

**Child:**
```javascript
@api
validate() {
    const isValid = this.template.querySelector('lightning-input').reportValidity();
    return isValid;
}

@api
reset() {
    this.selectedValue = null;
}
```

**Parent:**
```javascript
handleSubmit() {
    const child = this.template.querySelector('c-child-component');
    if (child.validate()) {
        // Proceed with submission
    }
}
```

---

## Child to Parent: Custom Events

Children communicate up by dispatching `CustomEvent` instances. Parents listen with `on<eventname>` attributes.

### Basic Event (No Data)

**Child:**
```javascript
handleClick() {
    this.dispatchEvent(new CustomEvent('close'));
}
```

**Parent template:**
```html
<c-modal onclose={handleModalClose}></c-modal>
```

**Parent JS:**
```javascript
handleModalClose() {
    this.showModal = false;
}
```

### Event with Data

**Child:**
```javascript
handleSelect(event) {
    const selectedId = event.currentTarget.dataset.id;
    this.dispatchEvent(new CustomEvent('contactselect', {
        detail: {
            contactId: selectedId,
            contactName: this.contacts.find(c => c.Id === selectedId).Name
        }
    }));
}
```

**Parent template:**
```html
<c-contact-list oncontactselect={handleContactSelect}></c-contact-list>
```

**Parent JS:**
```javascript
handleContactSelect(event) {
    this.selectedContactId = event.detail.contactId;
    this.selectedContactName = event.detail.contactName;
}
```

### Event Naming Rules

- Event names MUST be **lowercase with no hyphens** and **no prefix**: `select`, `itemchange`, `save`.
- In HTML, the handler attribute is `on` + event name: `onselect`, `onitemchange`, `onsave`.
- Do NOT use camelCase in event names — `contactSelect` becomes the attribute `oncontactSelect`, which is confusing. Use `contactselect` instead.

### Event Bubbling and Composed

By default, custom events do **not** bubble and do **not** cross shadow DOM boundaries:

```javascript
// Default: does NOT bubble, does NOT escape shadow DOM
this.dispatchEvent(new CustomEvent('select', { detail: { id: '001' } }));

// Bubbles up through the DOM (still stops at shadow boundary)
this.dispatchEvent(new CustomEvent('select', {
    detail: { id: '001' },
    bubbles: true
}));

// Bubbles AND crosses shadow DOM boundaries (use sparingly)
this.dispatchEvent(new CustomEvent('select', {
    detail: { id: '001' },
    bubbles: true,
    composed: true
}));
```

**Best practice:** Keep the default (no bubbling) for most cases. Only use `bubbles: true` when grandparent components need to listen, and `composed: true` when crossing shadow DOM is genuinely necessary.

---

## Lightning Message Service (LMS)

LMS enables communication between components anywhere on the same Lightning page — even between LWC and Aura components. It uses a publish-subscribe model through **message channels**.

### Step 1: Create a Message Channel

File: `force-app/main/default/messageChannels/Record_Selected__c.messageChannel-meta.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightningMessageChannel xmlns="http://soap.sforce.com/2006/04/metadata">
    <masterLabel>Record Selected</masterLabel>
    <isExposed>true</isExposed>
    <description>Channel for communicating record selection across components</description>
    <lightningMessageFields>
        <fieldName>recordId</fieldName>
        <description>The ID of the selected record</description>
    </lightningMessageFields>
    <lightningMessageFields>
        <fieldName>recordName</fieldName>
        <description>The name of the selected record</description>
    </lightningMessageFields>
</LightningMessageChannel>
```

### Step 2: Publish Messages

```javascript
import { LightningElement, wire } from 'lwc';
import { publish, MessageContext } from 'lightning/messageService';
import RECORD_SELECTED_CHANNEL from '@salesforce/messageChannel/Record_Selected__c';

export default class PublisherComponent extends LightningElement {
    @wire(MessageContext)
    messageContext;

    handleRecordSelect(event) {
        const recordId = event.detail.recordId;
        const payload = {
            recordId: recordId,
            recordName: event.detail.recordName
        };
        publish(this.messageContext, RECORD_SELECTED_CHANNEL, payload);
    }
}
```

### Step 3: Subscribe to Messages

```javascript
import { LightningElement, wire } from 'lwc';
import { subscribe, unsubscribe, MessageContext } from 'lightning/messageService';
import RECORD_SELECTED_CHANNEL from '@salesforce/messageChannel/Record_Selected__c';

export default class SubscriberComponent extends LightningElement {
    @wire(MessageContext)
    messageContext;

    subscription = null;
    selectedRecordId;
    selectedRecordName;

    connectedCallback() {
        this.subscribeToChannel();
    }

    disconnectedCallback() {
        this.unsubscribeFromChannel();
    }

    subscribeToChannel() {
        if (!this.subscription) {
            this.subscription = subscribe(
                this.messageContext,
                RECORD_SELECTED_CHANNEL,
                (message) => this.handleMessage(message)
            );
        }
    }

    unsubscribeFromChannel() {
        unsubscribe(this.subscription);
        this.subscription = null;
    }

    handleMessage(message) {
        this.selectedRecordId = message.recordId;
        this.selectedRecordName = message.recordName;
    }
}
```

### LMS Best Practices

- **Always unsubscribe** in `disconnectedCallback` to prevent memory leaks.
- **Guard against duplicate subscriptions** — check `if (!this.subscription)` before subscribing.
- **Keep payloads small** — pass IDs and let subscribers fetch their own data.
- **Name channels descriptively** — `Record_Selected__c`, `Filter_Changed__c`, not `Channel1__c`.
- **Use `isExposed: true`** only if the channel should be available to Aura components or other namespaces.

---

## Navigation

Use `NavigationMixin` for programmatic navigation to records, pages, and external URLs.

### Setup

```javascript
import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class MyComponent extends NavigationMixin(LightningElement) {
    // Navigation methods are now available
}
```

### Navigate to a Record

```javascript
navigateToRecord(recordId) {
    this[NavigationMixin.Navigate]({
        type: 'standard__recordPage',
        attributes: {
            recordId: recordId,
            objectApiName: 'Account',
            actionName: 'view'     // 'view' | 'edit' | 'clone'
        }
    });
}
```

### Navigate to a List View

```javascript
navigateToListView() {
    this[NavigationMixin.Navigate]({
        type: 'standard__objectPage',
        attributes: {
            objectApiName: 'Contact',
            actionName: 'list'
        },
        state: {
            filterName: 'Recent'   // List view API name
        }
    });
}
```

### Navigate to a Custom Tab / App Page

```javascript
navigateToTab() {
    this[NavigationMixin.Navigate]({
        type: 'standard__navItemPage',
        attributes: {
            apiName: 'My_Custom_Tab'
        }
    });
}
```

### Navigate to a Web Page (External URL)

```javascript
navigateToExternal() {
    this[NavigationMixin.Navigate]({
        type: 'standard__webPage',
        attributes: {
            url: 'https://www.example.com'
        }
    });
}
```

### Generate a URL (Without Navigating)

```javascript
recordUrl;

connectedCallback() {
    this[NavigationMixin.GenerateUrl]({
        type: 'standard__recordPage',
        attributes: {
            recordId: this.recordId,
            actionName: 'view'
        }
    }).then(url => {
        this.recordUrl = url;
    });
}
```

---

## Toast Notifications

```javascript
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

// Success
this.dispatchEvent(new ShowToastEvent({
    title: 'Success',
    message: 'Record saved successfully',
    variant: 'success'        // 'success' | 'error' | 'warning' | 'info'
}));

// Error with details
this.dispatchEvent(new ShowToastEvent({
    title: 'Error',
    message: 'Could not save record: {0}',
    messageData: [error.body.message],
    variant: 'error',
    mode: 'sticky'            // 'dismissible' (default) | 'pester' | 'sticky'
}));

// With a clickable link in the message
this.dispatchEvent(new ShowToastEvent({
    title: 'Record Created',
    message: 'View the new {0}',
    messageData: [
        {
            url: `/${recordId}`,
            label: 'record'
        }
    ],
    variant: 'success'
}));
```

**Modes:**
- `dismissible` (default): Shows close button, auto-dismisses after ~3 seconds.
- `pester`: No close button, auto-dismisses after ~3 seconds.
- `sticky`: Shows close button, persists until user dismisses.
