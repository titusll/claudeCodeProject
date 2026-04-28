# Jest Testing Reference

## Overview

LWC uses Jest via `@salesforce/sfdx-lwc-jest` for unit testing. Tests run locally without a Salesforce org — all server interactions (Apex, LDS, navigation) must be mocked.

### File Location

Tests live in a `__tests__` folder inside the component directory:

```
force-app/main/default/lwc/contactList/
├── contactList.html
├── contactList.js
├── contactList.js-meta.xml
└── __tests__/
    └── contactList.test.js
```

### Running Tests

```bash
npm test                       # Run all tests
npm run test:unit:watch        # Watch mode
npm run test:unit:coverage     # With coverage report
npx jest --testPathPattern contactList  # Run a specific component's tests
```

---

## Test File Structure

```javascript
import { createElement } from 'lwc';
import ContactList from 'c/contactList';

// Mock Apex
import getContacts from '@salesforce/apex/ContactController.getContacts';

// Mock data
const mockContacts = require('./data/getContacts.json');

// Tell Jest to mock the Apex import
jest.mock(
    '@salesforce/apex/ContactController.getContacts',
    () => ({ default: jest.fn() }),
    { virtual: true }
);

describe('c-contact-list', () => {
    // Reset DOM and mocks after each test
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    // Helper to flush microtasks (required after async operations)
    async function flushPromises() {
        return Promise.resolve();
    }

    it('renders contact list when data is returned', async () => {
        // Arrange: set up the mock to resolve with data
        getContacts.mockResolvedValue(mockContacts);

        // Act: create and insert the component
        const element = createElement('c-contact-list', { is: ContactList });
        element.recordId = '001XXXXXXXXXXXXXXX';
        document.body.appendChild(element);

        // Wait for async operations
        await flushPromises();

        // Assert: verify the DOM
        const items = element.shadowRoot.querySelectorAll('li');
        expect(items.length).toBe(mockContacts.length);
        expect(items[0].textContent).toBe(mockContacts[0].Name);
    });

    it('displays error message when Apex fails', async () => {
        getContacts.mockRejectedValue({ body: { message: 'Server error' } });

        const element = createElement('c-contact-list', { is: ContactList });
        element.recordId = '001XXXXXXXXXXXXXXX';
        document.body.appendChild(element);

        await flushPromises();

        const errorEl = element.shadowRoot.querySelector('.error-message');
        expect(errorEl).not.toBeNull();
        expect(errorEl.textContent).toContain('Server error');
    });
});
```

### Mock Data Files

Store mock data as JSON files in `__tests__/data/`:

```
__tests__/
├── contactList.test.js
└── data/
    ├── getContacts.json
    └── getContactsEmpty.json
```

**getContacts.json:**
```json
[
    {
        "Id": "003XXXXXXXXXXXXXXX",
        "Name": "Jane Doe",
        "Email": "jane@example.com",
        "Phone": "555-0100"
    },
    {
        "Id": "003YYYYYYYYYYYYYYY",
        "Name": "John Smith",
        "Email": "john@example.com",
        "Phone": "555-0200"
    }
]
```

---

## Mocking Wire Adapters

### Mocking @wire with Apex

For wire-to-function patterns, use `@salesforce/sfdx-lwc-jest`'s `emit` mechanism:

```javascript
import { createElement } from 'lwc';
import ContactList from 'c/contactList';
import getContacts from '@salesforce/apex/ContactController.getContacts';

const mockContacts = require('./data/getContacts.json');

jest.mock(
    '@salesforce/apex/ContactController.getContacts',
    () => {
        const { createApexTestWireAdapter } = require('@salesforce/sfdx-lwc-jest');
        return { default: createApexTestWireAdapter(jest.fn()) };
    },
    { virtual: true }
);

describe('c-contact-list with wire', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('renders contacts from wire', async () => {
        const element = createElement('c-contact-list', { is: ContactList });
        document.body.appendChild(element);

        // Emit data through the wire adapter
        getContacts.emit(mockContacts);

        await Promise.resolve();

        const items = element.shadowRoot.querySelectorAll('li');
        expect(items.length).toBe(mockContacts.length);
    });

    it('shows error from wire', async () => {
        const element = createElement('c-contact-list', { is: ContactList });
        document.body.appendChild(element);

        // Emit error through the wire adapter
        getContacts.error({ body: { message: 'Wire error' } });

        await Promise.resolve();

        const errorEl = element.shadowRoot.querySelector('.error-message');
        expect(errorEl.textContent).toContain('Wire error');
    });
});
```

### Mocking Lightning Data Service (getRecord, etc.)

```javascript
import { createElement } from 'lwc';
import AccountDetail from 'c/accountDetail';
import { getRecord } from 'lightning/uiRecordApi';

const mockRecord = require('./data/getRecord.json');

describe('c-account-detail', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('displays account name from getRecord', async () => {
        const element = createElement('c-account-detail', { is: AccountDetail });
        element.recordId = '001XXXXXXXXXXXXXXX';
        document.body.appendChild(element);

        // Emit mock record data
        getRecord.emit(mockRecord);

        await Promise.resolve();

        const nameEl = element.shadowRoot.querySelector('.account-name');
        expect(nameEl.textContent).toBe('Acme Corporation');
    });
});
```

**getRecord.json** (mock data matching LDS shape):
```json
{
    "apiName": "Account",
    "id": "001XXXXXXXXXXXXXXX",
    "fields": {
        "Name": { "value": "Acme Corporation", "displayValue": null },
        "Industry": { "value": "Technology", "displayValue": "Technology" },
        "AnnualRevenue": { "value": 1000000, "displayValue": "$1,000,000" }
    }
}
```

---

## Mocking Navigation

```javascript
import { createElement } from 'lwc';
import MyComponent from 'c/myComponent';
import { getNavigateCalledWith } from 'lightning/navigation';

// The jest-mocks directory in the project root provides automatic mocks
// for lightning/navigation

describe('c-my-component navigation', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('navigates to record on click', async () => {
        const element = createElement('c-my-component', { is: MyComponent });
        document.body.appendChild(element);

        // Simulate user action
        const button = element.shadowRoot.querySelector('lightning-button');
        button.click();

        await Promise.resolve();

        // Verify navigation was called with expected page reference
        const { pageReference } = getNavigateCalledWith();
        expect(pageReference.type).toBe('standard__recordPage');
        expect(pageReference.attributes.recordId).toBe('001XXXXXXXXXXXXXXX');
        expect(pageReference.attributes.actionName).toBe('view');
    });
});
```

---

## Mocking Toast Events

```javascript
import { createElement } from 'lwc';
import MyComponent from 'c/myComponent';
import { ShowToastEventName } from 'lightning/platformShowToastEvent';

describe('c-my-component toast', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('shows success toast after save', async () => {
        const element = createElement('c-my-component', { is: MyComponent });
        document.body.appendChild(element);

        // Listen for toast event
        const toastHandler = jest.fn();
        element.addEventListener(ShowToastEventName, toastHandler);

        // Trigger the action
        const saveButton = element.shadowRoot.querySelector('[data-id="save"]');
        saveButton.click();

        await Promise.resolve();

        // Verify toast
        expect(toastHandler).toHaveBeenCalledTimes(1);
        const toastEvent = toastHandler.mock.calls[0][0];
        expect(toastEvent.detail.title).toBe('Success');
        expect(toastEvent.detail.variant).toBe('success');
    });
});
```

---

## Testing Custom Events

```javascript
it('fires contactselect event when contact is clicked', async () => {
    const element = createElement('c-contact-list', { is: ContactList });
    document.body.appendChild(element);

    // Set up data
    getContacts.emit(mockContacts);
    await Promise.resolve();

    // Listen for the custom event
    const selectHandler = jest.fn();
    element.addEventListener('contactselect', selectHandler);

    // Click a contact
    const contactItem = element.shadowRoot.querySelector('li');
    contactItem.click();

    // Verify event was dispatched with correct detail
    expect(selectHandler).toHaveBeenCalledTimes(1);
    expect(selectHandler.mock.calls[0][0].detail.contactId).toBe(mockContacts[0].Id);
});
```

---

## Testing Public Properties and Methods

```javascript
it('reflects public property changes in the DOM', async () => {
    const element = createElement('c-greeting', { is: Greeting });
    element.name = 'World';
    document.body.appendChild(element);

    await Promise.resolve();

    const heading = element.shadowRoot.querySelector('h1');
    expect(heading.textContent).toBe('Hello, World!');

    // Change the property
    element.name = 'Salesforce';

    await Promise.resolve();

    expect(heading.textContent).toBe('Hello, Salesforce!');
});

it('validates input via public method', async () => {
    const element = createElement('c-input-form', { is: InputForm });
    document.body.appendChild(element);

    // Call the public @api method
    const isValid = element.validate();
    expect(isValid).toBe(false);  // No input yet

    // Fill in required field
    const input = element.shadowRoot.querySelector('lightning-input');
    input.value = 'Test Value';
    input.dispatchEvent(new CustomEvent('change', { detail: { value: 'Test Value' } }));

    await Promise.resolve();

    expect(element.validate()).toBe(true);
});
```

---

## Testing Conditional Rendering

```javascript
it('shows spinner when loading', async () => {
    const element = createElement('c-contact-list', { is: ContactList });
    document.body.appendChild(element);

    // Before data arrives, spinner should be visible
    const spinner = element.shadowRoot.querySelector('lightning-spinner');
    expect(spinner).not.toBeNull();

    // After data arrives, spinner should be gone
    getContacts.emit(mockContacts);
    await Promise.resolve();

    const spinnerAfter = element.shadowRoot.querySelector('lightning-spinner');
    expect(spinnerAfter).toBeNull();
});

it('shows empty state when no data', async () => {
    const element = createElement('c-contact-list', { is: ContactList });
    document.body.appendChild(element);

    getContacts.emit([]);
    await Promise.resolve();

    const emptyState = element.shadowRoot.querySelector('.empty-state');
    expect(emptyState).not.toBeNull();
    expect(emptyState.textContent).toContain('No contacts found');
});
```

---

## Common Testing Patterns

### Querying the Shadow DOM

```javascript
// Single element
const button = element.shadowRoot.querySelector('lightning-button');
const custom = element.shadowRoot.querySelector('c-child-component');
const byClass = element.shadowRoot.querySelector('.my-class');
const byData = element.shadowRoot.querySelector('[data-id="save"]');

// Multiple elements
const allItems = element.shadowRoot.querySelectorAll('li');
const allButtons = element.shadowRoot.querySelectorAll('lightning-button');
```

### Simulating User Input

```javascript
// lightning-input change
const input = element.shadowRoot.querySelector('lightning-input');
input.value = 'New Value';
input.dispatchEvent(new CustomEvent('change', { detail: { value: 'New Value' } }));

// lightning-combobox change
const combo = element.shadowRoot.querySelector('lightning-combobox');
combo.dispatchEvent(new CustomEvent('change', { detail: { value: 'option1' } }));

// Button click
const btn = element.shadowRoot.querySelector('lightning-button');
btn.click();
```

### Waiting for Multiple Async Operations

```javascript
// For multiple microtask cycles (e.g., chained promises)
async function flushPromises() {
    return Promise.resolve();
}

it('handles chained async operations', async () => {
    const element = createElement('c-my-component', { is: MyComponent });
    document.body.appendChild(element);

    // ... trigger action ...

    // Wait for multiple promise resolutions
    await flushPromises();
    await flushPromises();

    // Assert final state
});
```

### Test Setup Helpers

```javascript
function createComponent(props = {}) {
    const element = createElement('c-contact-list', { is: ContactList });
    Object.assign(element, props);
    document.body.appendChild(element);
    return element;
}

// Usage
it('example test', async () => {
    const element = createComponent({ recordId: '001XXX', maxRecords: 5 });
    // ...
});
```

---

## What NOT to Test

- **Lightning base component internals** — don't assert on the inner DOM of `lightning-input` or `lightning-button`. Test that you pass the right attributes and handle their events.
- **Apex logic** — Apex methods are mocked; test Apex separately with Apex tests.
- **Framework behavior** — don't test that `@api` reactivity works; trust the framework.
- **CSS styling** — Jest doesn't load CSS; test behavior and DOM structure, not visual appearance.
