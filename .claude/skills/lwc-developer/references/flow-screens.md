# LWC for Flow Screens Reference

## Overview

Lightning Web Components can be embedded in Flow screens, allowing you to build custom UI that goes beyond what standard Flow screen fields offer. The LWC communicates with the Flow runtime through `@api` properties (for input/output), `FlowAttributeChangeEvent` (to push changes back to Flow), and `FlowNavigationMixin` (to control navigation).

---

## Metadata Configuration

The component must target `lightning__FlowScreen`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>66.0</apiVersion>
    <isExposed>true</isExposed>
    <masterLabel>Custom Lookup for Flow</masterLabel>
    <description>A custom lookup component for use in Flow screens.</description>
    <targets>
        <target>lightning__FlowScreen</target>
    </targets>
    <targetConfigs>
        <targetConfig targets="lightning__FlowScreen">
            <property name="objectApiName" type="String" label="Object API Name"
                      description="The API name of the object to search"
                      role="inputOnly" />
            <property name="label" type="String" label="Field Label"
                      description="Label displayed above the lookup"
                      role="inputOnly" />
            <property name="selectedRecordId" type="String" label="Selected Record ID"
                      description="The ID of the selected record"
                      role="outputOnly" />
            <property name="required" type="Boolean" label="Required"
                      description="Whether the field is required"
                      default="false"
                      role="inputOnly" />
        </targetConfig>
    </targetConfigs>
</LightningComponentBundle>
```

### Property Roles

| Role | Direction | Description |
|---|---|---|
| `inputOnly` | Flow to Component | Set by Flow admin; component reads but never writes back |
| `outputOnly` | Component to Flow | Component sets this; Flow reads it after navigation |
| (omitted) | Both | Input and output — Flow can set it, component can update it |

### Supported Property Types in Flow

| Type | Flow Variable Type |
|---|---|
| `String` | Text |
| `Integer` | Number (no decimals) |
| `Boolean` | Boolean |
| `Date` | Date |
| `DateTime` | Date/Time |
| `@salesforce/schema/SObjectName` | Record (SObject) |

For **collections** (lists), append `[]` to the type:
```xml
<property name="selectedIds" type="String[]" label="Selected Record IDs" role="outputOnly" />
```

---

## Input and Output with @api

Every property declared in `targetConfig` must have a matching `@api` property in the JS class:

```javascript
import { LightningElement, api } from 'lwc';

export default class FlowCustomLookup extends LightningElement {
    // Inputs from Flow
    @api objectApiName;
    @api label;
    @api required = false;

    // Output to Flow
    @api selectedRecordId;

    // Internal state
    searchResults = [];
}
```

---

## FlowAttributeChangeEvent

When an output property changes, notify the Flow runtime so it can store the new value:

```javascript
import { LightningElement, api } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';

export default class FlowCustomLookup extends LightningElement {
    @api objectApiName;
    @api label;
    @api required = false;
    @api selectedRecordId;

    handleRecordSelect(event) {
        this.selectedRecordId = event.detail.recordId;

        // Notify Flow that the output value changed
        this.dispatchEvent(new FlowAttributeChangeEvent(
            'selectedRecordId',      // The @api property name
            this.selectedRecordId    // The new value
        ));
    }
}
```

**Important:** Always dispatch `FlowAttributeChangeEvent` whenever an output value changes. Without this, the Flow won't see the updated value when the user clicks Next/Finish.

---

## FlowNavigationMixin

Control Flow navigation programmatically — useful for custom Next/Back/Finish/Pause buttons:

```javascript
import { LightningElement, api } from 'lwc';
import { FlowNavigationNextEvent, FlowNavigationBackEvent,
         FlowNavigationFinishEvent, FlowNavigationPauseEvent }
    from 'lightning/flowSupport';

export default class FlowCustomNavigation extends LightningElement {
    @api availableActions = [];

    get canGoNext() {
        return this.availableActions.includes('NEXT');
    }

    get canGoBack() {
        return this.availableActions.includes('BACK');
    }

    get canFinish() {
        return this.availableActions.includes('FINISH');
    }

    get canPause() {
        return this.availableActions.includes('PAUSE');
    }

    handleNext() {
        if (this.canGoNext) {
            this.dispatchEvent(new FlowNavigationNextEvent());
        }
    }

    handleBack() {
        if (this.canGoBack) {
            this.dispatchEvent(new FlowNavigationBackEvent());
        }
    }

    handleFinish() {
        if (this.canFinish) {
            this.dispatchEvent(new FlowNavigationFinishEvent());
        }
    }

    handlePause() {
        if (this.canPause) {
            this.dispatchEvent(new FlowNavigationPauseEvent());
        }
    }
}
```

**`availableActions`** is automatically populated by the Flow runtime with the actions available on the current screen (`'NEXT'`, `'BACK'`, `'FINISH'`, `'PAUSE'`).

---

## Validation

Implement the `validate()` method to prevent Flow from navigating away when the component's data is invalid. The Flow runtime calls this automatically when the user clicks Next or Finish:

```javascript
import { LightningElement, api } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';

export default class FlowRequiredInput extends LightningElement {
    @api label = 'Required Field';
    @api value;
    @api required = false;

    internalValue = '';

    connectedCallback() {
        if (this.value) {
            this.internalValue = this.value;
        }
    }

    handleChange(event) {
        this.internalValue = event.detail.value;
        this.dispatchEvent(new FlowAttributeChangeEvent('value', this.internalValue));
    }

    // Called automatically by Flow when user clicks Next/Finish
    @api
    validate() {
        if (this.required && !this.internalValue) {
            return {
                isValid: false,
                errorMessage: `${this.label} is required.`
            };
        }
        return { isValid: true };
    }
}
```

### Validation Return Shape

```javascript
// Valid
{ isValid: true }

// Invalid — shows error message on the screen
{
    isValid: false,
    errorMessage: 'Please select a record before proceeding.'
}
```

---

## Complete Flow Screen Component Example

A custom multi-select lookup for use in Flow screens:

### Metadata (flowMultiSelect.js-meta.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>66.0</apiVersion>
    <isExposed>true</isExposed>
    <masterLabel>Flow Multi-Select Lookup</masterLabel>
    <description>Allows users to search and select multiple records in a Flow screen.</description>
    <targets>
        <target>lightning__FlowScreen</target>
    </targets>
    <targetConfigs>
        <targetConfig targets="lightning__FlowScreen">
            <property name="objectApiName" type="String" label="Object API Name" role="inputOnly" />
            <property name="label" type="String" label="Component Label" role="inputOnly" />
            <property name="maxSelections" type="Integer" label="Max Selections" default="5" role="inputOnly" />
            <property name="selectedIds" type="String[]" label="Selected Record IDs" role="outputOnly" />
            <property name="required" type="Boolean" label="Required" default="false" role="inputOnly" />
        </targetConfig>
    </targetConfigs>
</LightningComponentBundle>
```

### Template (flowMultiSelect.html)

```html
<template>
    <div class="slds-form-element" aria-label={label}>
        <label class="slds-form-element__label">
            <template lwc:if={required}>
                <abbr class="slds-required" title="required">*</abbr>
            </template>
            {label}
        </label>

        <div class="slds-form-element__control">
            <lightning-input
                type="search"
                placeholder={searchPlaceholder}
                value={searchKey}
                onchange={handleSearch}>
            </lightning-input>
        </div>

        <!-- Selected items -->
        <template lwc:if={hasSelections}>
            <lightning-pill-container
                items={pillItems}
                onitemremove={handleRemove}>
            </lightning-pill-container>
        </template>

        <!-- Search results -->
        <template lwc:if={showResults}>
            <ul class="slds-listbox slds-listbox_vertical slds-dropdown slds-dropdown_fluid" role="listbox">
                <template for:each={searchResults} for:item="result">
                    <li key={result.Id} class="slds-listbox__item" role="option" onclick={handleSelect} data-id={result.Id}>
                        <span class="slds-truncate">{result.Name}</span>
                    </li>
                </template>
            </ul>
        </template>

        <!-- Validation error -->
        <template lwc:if={errorMessage}>
            <div class="slds-form-element__help slds-text-color_error">{errorMessage}</div>
        </template>
    </div>
</template>
```

### JavaScript (flowMultiSelect.js)

```javascript
import { LightningElement, api } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';
import search from '@salesforce/apex/FlowLookupController.search';

export default class FlowMultiSelect extends LightningElement {
    // Flow inputs
    @api objectApiName = 'Account';
    @api label = 'Select Records';
    @api maxSelections = 5;
    @api required = false;

    // Flow output
    @api selectedIds = [];

    // Internal state
    searchKey = '';
    searchResults = [];
    selectedRecords = [];
    errorMessage;
    _debounceTimer;

    get searchPlaceholder() {
        return `Search ${this.objectApiName}...`;
    }

    get hasSelections() {
        return this.selectedRecords.length > 0;
    }

    get showResults() {
        return this.searchResults.length > 0 && this.searchKey.length > 1;
    }

    get pillItems() {
        return this.selectedRecords.map(record => ({
            type: 'icon',
            label: record.Name,
            name: record.Id,
            iconName: 'standard:account'
        }));
    }

    get canAddMore() {
        return this.selectedRecords.length < this.maxSelections;
    }

    handleSearch(event) {
        clearTimeout(this._debounceTimer);
        this.searchKey = event.detail.value;
        if (this.searchKey.length < 2) {
            this.searchResults = [];
            return;
        }
        this._debounceTimer = setTimeout(() => {
            this.performSearch();
        }, 300);
    }

    async performSearch() {
        try {
            const results = await search({
                objectApiName: this.objectApiName,
                searchTerm: this.searchKey
            });
            // Filter out already-selected records
            const selectedSet = new Set(this.selectedRecords.map(r => r.Id));
            this.searchResults = results.filter(r => !selectedSet.has(r.Id));
        } catch (error) {
            this.searchResults = [];
        }
    }

    handleSelect(event) {
        if (!this.canAddMore) return;

        const selectedId = event.currentTarget.dataset.id;
        const selectedRecord = this.searchResults.find(r => r.Id === selectedId);
        if (selectedRecord) {
            this.selectedRecords = [...this.selectedRecords, selectedRecord];
            this.updateFlowOutput();
        }
        this.searchKey = '';
        this.searchResults = [];
        this.errorMessage = undefined;
    }

    handleRemove(event) {
        const removedId = event.detail.item.name;
        this.selectedRecords = this.selectedRecords.filter(r => r.Id !== removedId);
        this.updateFlowOutput();
    }

    updateFlowOutput() {
        this.selectedIds = this.selectedRecords.map(r => r.Id);
        this.dispatchEvent(new FlowAttributeChangeEvent('selectedIds', this.selectedIds));
    }

    // Flow calls this before navigating to the next screen
    @api
    validate() {
        if (this.required && this.selectedRecords.length === 0) {
            this.errorMessage = 'Please select at least one record.';
            return {
                isValid: false,
                errorMessage: this.errorMessage
            };
        }
        this.errorMessage = undefined;
        return { isValid: true };
    }
}
```

---

## Flow Reactive Properties (API 56+)

For components that need to react to changes made by other Flow screen components in real time (without navigating away), use `@api` setters:

```javascript
@api
get accountId() {
    return this._accountId;
}
set accountId(value) {
    this._accountId = value;
    // React to the change — e.g., re-fetch related contacts
    if (value) {
        this.fetchContacts(value);
    }
}
_accountId;
```

This allows one Flow screen component to drive another when the Flow admin connects their output to another component's input on the same screen.

---

## Testing Flow Components

When testing Flow components, mock the Flow support modules:

```javascript
import { createElement } from 'lwc';
import FlowMultiSelect from 'c/flowMultiSelect';

// Mock FlowAttributeChangeEvent
jest.mock(
    'lightning/flowSupport',
    () => ({
        FlowAttributeChangeEvent: jest.fn().mockImplementation((attrName, attrValue) => {
            return { attrName, attrValue };
        }),
        FlowNavigationNextEvent: jest.fn(),
        FlowNavigationBackEvent: jest.fn()
    }),
    { virtual: true }
);

describe('c-flow-multi-select', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    it('validates when required and nothing selected', () => {
        const element = createElement('c-flow-multi-select', { is: FlowMultiSelect });
        element.required = true;
        document.body.appendChild(element);

        const result = element.validate();
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toContain('at least one record');
    });

    it('passes validation when records are selected', async () => {
        const element = createElement('c-flow-multi-select', { is: FlowMultiSelect });
        element.required = true;
        document.body.appendChild(element);

        // Simulate selecting a record (set internal state)
        element.selectedIds = ['001XXXXXXXXXXXXXXX'];

        const result = element.validate();
        // Note: depends on component implementation — may need to set internal state differently
    });
});
```

---

## Common Pitfalls

1. **Forgetting `FlowAttributeChangeEvent`** — Output values won't reach Flow variables unless you dispatch this event. The most common bug in Flow LWC components.

2. **Not implementing `validate()`** — Without it, the Flow navigates forward even when your component's data is invalid.

3. **Using `role="inputOnly"` on output properties** — The Flow can't read the value back. Use `role="outputOnly"` or omit `role` for bidirectional.

4. **Collection types without `[]`** — If the property should be a list, use `type="String[]"`, not `type="String"`.

5. **Not checking `availableActions`** — Dispatching `FlowNavigationNextEvent` when `NEXT` isn't available causes a runtime error.
