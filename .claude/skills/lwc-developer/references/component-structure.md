# Component Structure Reference

## HTML Template

The HTML file defines the component's markup. Every template is wrapped in a `<template>` root tag.

### Basic Template

```html
<template>
    <lightning-card title={cardTitle} icon-name="standard:account">
        <div class="slds-p-around_medium">
            <p>{greeting}</p>
        </div>
    </lightning-card>
</template>
```

### Conditional Rendering

Use `lwc:if`, `lwc:elseif`, and `lwc:else` (API 55+, preferred) or the legacy `if:true`/`if:false` directives:

```html
<!-- Preferred (API 55+) -->
<template>
    <template lwc:if={isLoading}>
        <lightning-spinner alternative-text="Loading"></lightning-spinner>
    </template>
    <template lwc:elseif={hasError}>
        <p class="slds-text-color_error">{errorMessage}</p>
    </template>
    <template lwc:else>
        <c-account-detail account={account}></c-account-detail>
    </template>
</template>

<!-- Legacy (still supported) -->
<template>
    <template if:true={isLoading}>
        <lightning-spinner alternative-text="Loading"></lightning-spinner>
    </template>
    <template if:false={isLoading}>
        <p>{data}</p>
    </template>
</template>
```

### Iteration with for:each

The `key` directive is **required** on the first element inside the loop. Use a unique, stable identifier (like `Id`), never an array index.

```html
<template>
    <ul>
        <template for:each={contacts} for:item="contact">
            <li key={contact.Id}>
                {contact.Name} — {contact.Email}
            </li>
        </template>
    </ul>
</template>
```

### Iteration with iterator

Use `iterator` when you need `first` or `last` flags for conditional styling:

```html
<template>
    <ul>
        <template iterator:it={contacts}>
            <li key={it.value.Id} class={it.last ? 'slds-border_bottom' : ''}>
                {it.value.Name}
            </li>
        </template>
    </ul>
</template>
```

### Slots (Composition)

Slots allow parent components to inject content into a child component's template.

**Child component (myCard.html):**
```html
<template>
    <div class="card">
        <div class="card-header">
            <slot name="header">Default Header</slot>
        </div>
        <div class="card-body">
            <slot>Default body content</slot>
        </div>
        <div class="card-footer">
            <slot name="footer"></slot>
        </div>
    </div>
</template>
```

**Parent usage:**
```html
<template>
    <c-my-card>
        <span slot="header">Account Details</span>
        <p>This goes in the default (unnamed) slot.</p>
        <div slot="footer">
            <lightning-button label="Save" onclick={handleSave}></lightning-button>
        </div>
    </c-my-card>
</template>
```

### Dynamic Value Binding

```html
<template>
    <!-- One-way binding (expression) -->
    <p>{fullName}</p>

    <!-- Attribute binding -->
    <lightning-input label="Name" value={name} onchange={handleNameChange}></lightning-input>

    <!-- Computed class binding -->
    <div class={computedClass}>Content</div>

    <!-- Spread operator for multiple attributes (API 60+) -->
    <lightning-button lwc:spread={buttonProps}></lightning-button>
</template>
```

---

## JavaScript Class

Every LWC JavaScript file exports a default class extending `LightningElement`.

### Complete Component Example

```javascript
import { LightningElement, api, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getContacts from '@salesforce/apex/ContactController.getContacts';
import CONTACT_NAME_FIELD from '@salesforce/schema/Contact.Name';

const MAX_RESULTS = 10;

export default class ContactList extends LightningElement {
    // Public property — set by parent or App Builder
    @api recordId;
    @api cardTitle = 'Contacts';

    // Private reactive properties (primitives are reactive by default)
    isLoading = true;
    errorMessage;

    // Deep-tracked property (needed for object/array mutation)
    @track filters = { status: 'Active', limit: MAX_RESULTS };

    // Wire — automatically called when recordId changes
    @wire(getContacts, { accountId: '$recordId', limit: '$filters.limit' })
    wiredContacts({ data, error }) {
        this.isLoading = false;
        if (data) {
            this.contacts = data;
            this.errorMessage = undefined;
        } else if (error) {
            this.contacts = undefined;
            this.errorMessage = error.body?.message || 'An error occurred';
        }
    }

    contacts;

    // Getter (computed property)
    get hasContacts() {
        return this.contacts && this.contacts.length > 0;
    }

    get contactCount() {
        return this.contacts ? this.contacts.length : 0;
    }

    // Lifecycle hooks
    connectedCallback() {
        // Component inserted into DOM
        console.log('Component connected, recordId:', this.recordId);
    }

    renderedCallback() {
        // Fires after every render — use a guard flag
        if (this._hasRendered) return;
        this._hasRendered = true;
        // One-time DOM setup here
    }

    disconnectedCallback() {
        // Cleanup: unsubscribe, remove listeners
    }

    // Event handlers
    handleContactSelect(event) {
        const contactId = event.detail.contactId;
        // Dispatch a custom event to the parent
        this.dispatchEvent(new CustomEvent('select', {
            detail: { contactId }
        }));
    }

    handleError() {
        this.dispatchEvent(new ShowToastEvent({
            title: 'Error',
            message: this.errorMessage,
            variant: 'error'
        }));
    }
}
```

### Getter Patterns

Use JavaScript getters for computed/derived values instead of storing redundant state:

```javascript
// Computed CSS class
get statusClass() {
    return this.isActive ? 'slds-text-color_success' : 'slds-text-color_weak';
}

// Derived data
get formattedName() {
    return `${this.firstName} ${this.lastName}`.trim();
}

// Conditional display
get showEmptyState() {
    return !this.isLoading && (!this.items || this.items.length === 0);
}
```

---

## CSS (Scoped Styles)

LWC styles are **scoped** to the component — they do not leak to parent or child components.

```css
/* myComponent.css */

/* Host element styling */
:host {
    display: block;
    padding: 1rem;
}

/* Use SLDS design tokens for consistency */
.header {
    font-size: var(--lwc-fontSize5);
    color: var(--lwc-colorTextDefault);
    margin-bottom: var(--lwc-spacingMedium);
}

.error-message {
    color: var(--lwc-colorTextError);
    padding: var(--lwc-spacingSmall);
    border: 1px solid var(--lwc-colorBorderError);
    border-radius: var(--lwc-borderRadiusMedium);
}

/* Slotted content styling */
::slotted(*) {
    margin-bottom: var(--lwc-spacingSmall);
}

/* Responsive layout */
@media (max-width: 48rem) {
    .two-column {
        flex-direction: column;
    }
}
```

### Key CSS Rules

- Use SLDS design tokens (`var(--lwc-*)`) instead of hardcoded values for colors, spacing, and font sizes.
- Use SLDS utility classes in HTML (`slds-p-around_medium`, `slds-text-heading_small`, etc.) before writing custom CSS.
- The `:host` selector targets the component's root element.
- You cannot style child component internals from a parent — each component owns its own styles.
- Use `::slotted(*)` to style content projected via slots.

---

## Metadata Configuration (js-meta.xml) Deep Dive

### Minimal Configuration (internal/private component)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>66.0</apiVersion>
    <isExposed>false</isExposed>
</LightningComponentBundle>
```

### Full Configuration with Design-Time Properties

```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>66.0</apiVersion>
    <isExposed>true</isExposed>
    <masterLabel>Account Contact List</masterLabel>
    <description>Displays contacts related to the current account record.</description>
    <targets>
        <target>lightning__RecordPage</target>
        <target>lightning__AppPage</target>
        <target>lightning__HomePage</target>
        <target>lightning__Tab</target>
    </targets>
    <targetConfigs>
        <targetConfig targets="lightning__RecordPage">
            <property name="cardTitle" type="String" label="Card Title" default="Contacts"
                      description="Title displayed at the top of the card" />
            <property name="maxRecords" type="Integer" label="Max Records" default="10"
                      description="Maximum number of contacts to display" />
            <property name="showEmail" type="Boolean" label="Show Email" default="true" />
            <objects>
                <object>Account</object>
            </objects>
        </targetConfig>
        <targetConfig targets="lightning__AppPage,lightning__HomePage">
            <property name="cardTitle" type="String" label="Card Title" default="All Contacts" />
        </targetConfig>
    </targetConfigs>
</LightningComponentBundle>
```

### Restricting to Specific Objects

Use the `<objects>` element within `targetConfig` to limit which record pages the component appears on:

```xml
<targetConfig targets="lightning__RecordPage">
    <objects>
        <object>Account</object>
        <object>Contact</object>
        <object>Custom_Object__c</object>
    </objects>
</targetConfig>
```

### Supported targetConfig Property Types

| Type | Renders As | Notes |
|---|---|---|
| `String` | Text input | Max 255 characters |
| `Integer` | Number input | Whole numbers only |
| `Boolean` | Checkbox | `default` must be `"true"` or `"false"` |
| `Color` | Color picker | Returns hex value |
| `Date` | Date picker | ISO 8601 format |
| `DateTime` | Date/time picker | ISO 8601 format |

### Using a Custom Apex Data Source for a Property

```xml
<property name="selectedAccount" type="String" label="Account"
          datasource="apex://AccountPicklistProvider" />
```

The Apex class must implement `VisualEditor.DynamicPickList`.
