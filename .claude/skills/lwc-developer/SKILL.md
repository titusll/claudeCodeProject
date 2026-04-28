---
name: lwc-developer
description: >
  Best practice guide for building Salesforce Lightning Web Components (LWC).
  Covers component structure, HTML templates, JavaScript classes, decorators
  (@api, @wire, @track), lifecycle hooks, Apex integration (wire and imperative),
  Lightning Data Service, component communication (parent-child, child-parent,
  Lightning Message Service), Jest unit testing, SLDS styling, navigation,
  toast notifications, and LWC for Flow screens.
  Use this skill whenever a user asks to create, modify, debug, or review any
  Lightning Web Component — even if they just say "build a component", "add a
  button", "wire up Apex", "write LWC tests", or "create a datatable" without
  explicitly mentioning LWC.
  NOT for Aura components, Salesforce Flows, Apex code or declarative
  metadata like objects/fields/permissions.
---

# Lightning Web Component Developer Guide

## General Principles

- All LWC files live under `force-app/main/default/lwc/`.
- Each component is a **folder** containing at minimum a `.js` file and a `.html` file with matching names.
- Use the API version defined in `sfdx-project.json` (read it at the start of each task). If unknown, default to **66.0**.
- Follow the **single responsibility principle** — one component does one thing well. Compose complex UIs from smaller components.
- Never manipulate the DOM directly. Use reactive properties and template directives to drive UI updates.
- All Apex methods called from LWC must be annotated `@AuraEnabled` (with `cacheable=true` for wire-compatible read operations).
- Prefer Lightning Data Service (`lightning/ui*Api`) over custom Apex for standard CRUD on single records.
- Always handle errors — display user-friendly messages via `ShowToastEvent` or inline in the template.

## Component File Structure

```
force-app/main/default/lwc/myComponent/
├── myComponent.html          # Template (required)
├── myComponent.js            # Controller class (required)
├── myComponent.js-meta.xml   # Metadata configuration (required)
├── myComponent.css           # Scoped styles (optional)
├── __tests__/
│   └── myComponent.test.js   # Jest unit tests
```

### Metadata Configuration (js-meta.xml)

Every component needs a metadata file that controls where it can be used:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>66.0</apiVersion>
    <isExposed>true</isExposed>
    <masterLabel>My Component</masterLabel>
    <description>Description of what this component does.</description>
    <targets>
        <target>lightning__RecordPage</target>
        <target>lightning__AppPage</target>
        <target>lightning__HomePage</target>
    </targets>
    <targetConfigs>
        <targetConfig targets="lightning__RecordPage">
            <property name="title" type="String" label="Card Title" default="Details" />
        </targetConfig>
    </targetConfigs>
</LightningComponentBundle>
```

#### Common Targets

| Target | Where It Appears |
|---|---|
| `lightning__RecordPage` | Record detail pages |
| `lightning__AppPage` | App Builder custom pages |
| `lightning__HomePage` | Home page |
| `lightning__FlowScreen` | Flow screen (see `references/flow-screens.md`) |
| `lightning__Tab` | Custom tab (standalone page) |
| `lightning__Inbox` | Outlook/Gmail integration |
| `lightning__UtilityBar` | Utility bar |
| `lightningCommunity__Page` | Experience Cloud pages |
| `lightningCommunity__Default` | Experience Cloud with configurable properties |

#### Property Types for targetConfig

| Type | Description |
|---|---|
| `String` | Text input |
| `Integer` | Whole number |
| `Boolean` | Checkbox |
| `Color` | Color picker |
| `Date` | Date picker |
| `DateTime` | Date and time picker |

Design-time properties defined in `targetConfig` are set by admins in App Builder and passed to the component as `@api` properties.

## Naming Conventions

- **Component folder/files**: camelCase. Example: `accountDetails`, `invoiceLineItem`.
- **HTML tag in markup**: kebab-case with `c-` namespace prefix. Example: `<c-account-details>`, `<c-invoice-line-item>`.
- **Public properties** (`@api`): camelCase in JS, kebab-case in HTML. Example: JS `recordId` becomes HTML `record-id`.
- **Private reactive properties**: camelCase, no decorator or use `@track` only for objects/arrays that need deep reactivity.
- **Event names**: lowercase, no hyphens, no prefix. Example: `select`, `itemchange`, `save`.
- **Apex method imports**: named imports matching the Apex method name. Example: `import getAccounts from '@salesforce/apex/AccountController.getAccounts';`
- **Constants**: UPPER_SNAKE_CASE. Example: `const MAX_RECORDS = 50;`

## Decorators

| Decorator | Purpose | Key Rules |
|---|---|---|
| `@api` | Public property or method — exposed to parent components and App Builder | Do NOT set `@api` properties from within the component itself; they are owned by the parent. |
| `@wire` | Reactive data binding to a wire adapter or Apex method | The function/property is called automatically when reactive parameters change. Cannot perform DML — use imperative Apex for mutations. |
| `@track` | Deep reactivity for object/array properties | Only needed when you mutate nested properties (e.g., `this.obj.name = 'x'`). Primitive properties are reactive by default since API 40+. |

## Lifecycle Hooks

| Hook | When It Fires | Common Uses |
|---|---|---|
| `constructor()` | Component created, no DOM | Initialize state. Do NOT access `this.template`. Must call `super()` first. |
| `connectedCallback()` | Inserted into DOM | Fetch data, subscribe to events/channels, set up listeners. |
| `renderedCallback()` | After every render | DOM measurements, third-party library init. Guard with a flag to avoid repeat work. |
| `disconnectedCallback()` | Removed from DOM | Unsubscribe from channels, remove listeners, clean up timers. |
| `errorCallback(error, stack)` | Descendant throws error | Log errors, show fallback UI. Only catches errors from child components. |

## Best Practices Summary

### Security

- **Never use `innerHTML`** — use `lwc:dom="manual"` only when absolutely necessary (e.g., third-party library integration), and sanitize all content.
- **Never hardcode record IDs** — use `@api recordId` or dynamic queries.
- **Use `@wire` with `cacheable=true`** for read operations to leverage the Lightning Data Service cache and reduce server calls.
- **Escape user input** — LWC templates auto-escape by default; do not bypass this.

### Performance

- **Minimize wire adapter calls** — combine related data into a single Apex method rather than multiple wires.
- **Use `if:true`/`if:false` or `lwc:if`/`lwc:elseif`/`lwc:else`** to conditionally render expensive sections (prefer `lwc:if` on API 55+).
- **Use `key` on `for:each` items** — this is required and enables efficient DOM diffing.
- **Debounce search inputs** — avoid calling Apex on every keystroke.
- **Avoid heavy logic in `renderedCallback`** — it fires on every render. Use a boolean guard.
- **Lazy load data** — fetch only what's visible; paginate large datasets.

### Error Handling

- Wrap imperative Apex calls in `try/catch`.
- Display errors with `ShowToastEvent` or an inline error template.
- Use `errorCallback` in container components to catch child component errors.
- Log errors for debugging — consider a centralized error-logging utility.

### Accessibility

- Use Lightning base components (`lightning-button`, `lightning-input`, etc.) — they include ARIA attributes and keyboard handling.
- Add `aria-label` or `aria-labelledby` to custom interactive elements.
- Maintain logical heading hierarchy (`h1` > `h2` > `h3`).
- Ensure all interactive elements are keyboard-navigable.

## Reference Files

Detailed templates, code examples, and pattern-specific guidance live in `references/`. Read the relevant file when working on that area:

| When you need to... | Read |
|---|---|
| Understand component anatomy, decorators, lifecycle hooks, or HTML template directives | `references/component-structure.md` |
| Fetch data with @wire, call imperative Apex, or use Lightning Data Service | `references/data-and-apex.md` |
| Pass data between components, dispatch custom events, or use Lightning Message Service | `references/communication.md` |
| Write Jest unit tests, mock wire adapters, Apex calls, or navigation | `references/testing.md` |
| Use SLDS styling, Lightning base components, datatables, conditional rendering, or iteration | `references/ui-patterns.md` |
| Build an LWC for use inside a Flow screen | `references/flow-screens.md` |

## Pre-Generation Checklist

Before writing any LWC files, confirm these details with the user — do not assume defaults:

- Component name and purpose
- Where it will be used (record page, app page, home page, flow screen, tab, community)
- What data it needs (Apex queries, Lightning Data Service, static)
- Whether it needs configurable properties (App Builder `targetConfig`)
- Parent-child relationships with other components
- What events it needs to fire or listen for
- Whether it modifies data (imperative Apex needed) or only reads (wire-compatible)
- Error handling approach (toast, inline, both)
- Whether Jest tests should be created alongside the component
- Object and field API names it will interact with

## Deploy Commands

```bash
# Deploy a specific component
sf project deploy start --source-dir force-app/main/default/lwc/myComponent

# Deploy all LWC components
sf project deploy start --source-dir force-app/main/default/lwc

# Validate without deploying
sf project deploy start --source-dir force-app/main/default/lwc --dry-run

# Run LWC Jest tests
npm test

# Run tests with coverage
npm run test:unit:coverage

# Lint LWC files
npm run lint
```

## Quick Links

- [LWC Developer Guide](https://developer.salesforce.com/docs/platform/lwc/guide)
- [Component Reference](https://developer.salesforce.com/docs/component-library/overview/components)
- [Wire Service](https://developer.salesforce.com/docs/platform/lwc/guide/data-wire-service-about.html)
- [Lightning Data Service](https://developer.salesforce.com/docs/platform/lwc/guide/data-ui-api.html)
- [Jest Testing](https://developer.salesforce.com/docs/platform/lwc/guide/testing.html)
- [SLDS](https://www.lightningdesignsystem.com/)
- [Accessibility Guide](https://developer.salesforce.com/docs/platform/lwc/guide/create-components-accessibility.html)
