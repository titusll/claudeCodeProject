# Salesforce Accessibility Patterns

This reference covers accessibility patterns specific to Salesforce development — LWC,
Aura, SLDS, Apex controllers, flows, and Experience Cloud. Use it alongside the WCAG
checklist when reviewing Salesforce components.

## Table of Contents

1. [Lightning Web Components (LWC)](#lightning-web-components)
2. [SLDS and Design Tokens](#slds-and-design-tokens)
3. [Base Component Accessibility](#base-component-accessibility)
4. [Aura Components](#aura-components)
5. [Apex Controllers](#apex-controllers)
6. [Flows](#flows)
7. [Experience Cloud](#experience-cloud)
8. [Common Anti-Patterns](#common-anti-patterns)
9. [Testing Approaches](#testing-approaches)

---

## Lightning Web Components

### Template Structure

Use semantic HTML within LWC templates. The Shadow DOM encapsulates styles but
assistive technologies still traverse the composed DOM tree.

```html
<!-- Good: semantic structure -->
<template>
  <article>
    <h2>{title}</h2>
    <section>
      <p>{description}</p>
    </section>
    <footer>
      <lightning-button label="Save" onclick={handleSave}></lightning-button>
    </footer>
  </article>
</template>

<!-- Bad: div soup -->
<template>
  <div class="slds-card">
    <div class="title">{title}</div>
    <div class="body">
      <div>{description}</div>
    </div>
    <div class="footer">
      <lightning-button label="Save" onclick={handleSave}></lightning-button>
    </div>
  </div>
</template>
```

### Heading Hierarchy

Maintain logical heading levels. A component does not always start at `<h1>` — it
depends on where it appears in the page.

- Use `@api headingLevel` to make heading level configurable by the parent
- Never skip heading levels within a component (e.g., `<h2>` to `<h4>`)

```javascript
// Configurable heading level pattern
import { LightningElement, api } from 'lwc';

export default class CardComponent extends LightningElement {
    @api headingLevel = '2';

    get headingTag() {
        return `h${this.headingLevel}`;
    }
}
```

### Keyboard Navigation

All custom interactive elements must be keyboard-accessible:

```html
<!-- Custom clickable element — needs keyboard support -->
<div
  role="button"
  tabindex="0"
  onclick={handleClick}
  onkeydown={handleKeydown}
  aria-label="Expand details">
  <lightning-icon icon-name="utility:chevronright" size="x-small"></lightning-icon>
</div>
```

```javascript
handleKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.handleClick(event);
    }
}
```

Prefer using `<button>` or `<a>` instead of `<div>` with `role="button"` — native
elements get keyboard support for free.

### Focus Management

After dynamic content changes (conditional rendering, navigation, modal open/close),
manage focus explicitly:

```javascript
// After inserting content, move focus to it
handleExpand() {
    this.isExpanded = true;
    // Wait for DOM update
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    setTimeout(() => {
        const content = this.template.querySelector('.expanded-content');
        if (content) {
            content.focus();
        }
    }, 0);
}

// After closing a modal, return focus to the trigger
handleCloseModal() {
    this.showModal = false;
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    setTimeout(() => {
        const trigger = this.template.querySelector('[data-id="modal-trigger"]');
        if (trigger) {
            trigger.focus();
        }
    }, 0);
}
```

### ARIA in LWC

Use ARIA attributes to communicate state to assistive technology:

```html
<!-- Expandable section -->
<button
  aria-expanded={isExpanded}
  aria-controls="detail-section"
  onclick={toggleSection}>
  Details
</button>
<div id="detail-section" role="region" if:true={isExpanded}>
  {detailContent}
</div>

<!-- Loading state -->
<div aria-busy={isLoading} aria-live="polite">
  <template if:true={isLoading}>
    <lightning-spinner alternative-text="Loading records"></lightning-spinner>
  </template>
  <template if:false={isLoading}>
    <!-- Content here -->
  </template>
</div>

<!-- Live region for dynamic updates -->
<div aria-live="polite" class="slds-assistive-text">
  {screenReaderMessage}
</div>
```

### Conditional Rendering and Accessibility

When using `if:true` / `if:false` or `lwc:if` / `lwc:else`:
- Ensure hidden content is truly removed from DOM (LWC handles this)
- After toggling, manage focus (see Focus Management above)
- Do not use CSS `display: none` as a substitute for conditional rendering when
  content should be removed from the accessibility tree

### Forms in LWC

```html
<!-- Always use labels -->
<lightning-input
  label="Email Address"
  type="email"
  required
  message-when-value-missing="Please enter your email address"
  message-when-type-mismatch="Please enter a valid email (e.g., name@example.com)">
</lightning-input>

<!-- Grouped inputs need fieldset semantics -->
<fieldset>
  <legend>Shipping Address</legend>
  <lightning-input label="Street"></lightning-input>
  <lightning-input label="City"></lightning-input>
  <lightning-combobox label="Region" options={regionOptions}></lightning-combobox>
</fieldset>

<!-- Help text for additional context -->
<lightning-input
  label="Account Number"
  field-level-help="Found on your statement, typically 8 digits">
</lightning-input>
```

---

## SLDS and Design Tokens

### Colour Contrast

SLDS design tokens are engineered to meet WCAG AA contrast requirements.
Always use tokens instead of hardcoded colours:

```css
/* Good: uses SLDS tokens */
.status-text {
    color: var(--slds-g-color-error-base-40, #ea001e);
}

/* Bad: hardcoded colour with unknown contrast */
.status-text {
    color: #ff6b6b;
}
```

### Focus Indicators

SLDS provides focus styles out of the box. Do not remove them:

```css
/* NEVER do this */
:focus {
    outline: none;
}

/* If you must customise, provide an alternative */
:focus-visible {
    outline: 2px solid var(--slds-g-color-brand-base-50);
    outline-offset: 2px;
}
```

### Utility Classes for Accessibility

SLDS provides utility classes for screen reader content:

```html
<!-- Visually hidden but announced by screen readers -->
<span class="slds-assistive-text">Required field</span>

<!-- Hide from screen readers (decorative content) -->
<span aria-hidden="true">★</span>
```

---

## Base Component Accessibility

Lightning base components include built-in accessibility. Prefer them over custom HTML:

| Need | Use | NOT |
|---|---|---|
| Buttons | `lightning-button`, `lightning-button-icon` | `<div onclick>`, `<span onclick>` |
| Forms | `lightning-input`, `lightning-combobox`, `lightning-textarea` | `<input>` without labels |
| Data display | `lightning-datatable` | Custom `<table>` without headers |
| Navigation | `lightning-breadcrumbs`, `lightning-vertical-navigation` | `<div>` with click handlers |
| Notifications | `ShowToastEvent` | Custom divs without `aria-live` |
| Modals | `LightningModal` | Custom modal without focus trap |
| Progress | `lightning-progress-bar`, `lightning-spinner` | CSS-only animations |
| Tabs | `lightning-tabset` | Custom tabs without ARIA roles |
| Trees | `lightning-tree` | Custom tree without ARIA tree pattern |
| Menus | `lightning-button-menu` | Custom dropdown without ARIA |

### Base Component Checklist

Even with base components, verify:
- [ ] `lightning-button-icon` always has `alternative-text`
- [ ] `lightning-icon` has `alternative-text` when conveying meaning (omit for decorative)
- [ ] `lightning-spinner` has `alternative-text`
- [ ] `lightning-input` has `label` (use `variant="label-hidden"` only when label is
  provided elsewhere via `aria-label` or surrounding heading)
- [ ] `lightning-datatable` has meaningful column labels
- [ ] `lightning-helptext` used for field guidance (not `title` attributes)
- [ ] Toast messages are descriptive — they use `aria-live` internally
- [ ] `LightningModal` returns focus to trigger on close

---

## Aura Components

Legacy Aura components need extra attention as they lack some of LWC's accessibility
defaults.

### Key Differences from LWC

- Aura uses `$A.util.addClass` / `$A.util.removeClass` for visibility — ensure these
  also update `aria-hidden` when hiding content from assistive tech
- `aura:if` removes content from DOM (good), but focus management is manual
- Event handling: use `{!c.handleKeydown}` pattern for keyboard support
- Lightning base components in Aura (`lightning:button`, etc.) have the same accessibility
  features as their LWC counterparts

### Aura Accessibility Patterns

```html
<!-- Aura: always include type="button" to prevent form submission -->
<lightning:button label="Save" onclick="{!c.handleSave}" type="button" />

<!-- Aura: icon buttons need alternativeText -->
<lightning:buttonIcon iconName="utility:close"
                      alternativeText="Close dialog"
                      onclick="{!c.handleClose}" />

<!-- Aura: conditional content with accessibility -->
<aura:if isTrue="{!v.isExpanded}">
    <div aura:id="expandedContent" role="region" aria-label="Details">
        {!v.detailContent}
    </div>
</aura:if>
```

---

## Apex Controllers

Apex controllers affect accessibility through the error messages and data they return
to the UI layer.

### Error Messages

```java
// Good: descriptive, user-readable error
throw new AuraHandledException(
    'Unable to save the registration. The email address "' +
    email + '" is already in use. Please use a different email.'
);

// Bad: technical error exposed to UI
throw new AuraHandledException(e.getMessage());
// Might produce: "DUPLICATE_VALUE: duplicate value found: Email__c..."
```

### Data for Accessible Display

When returning data that will be displayed in a UI:
- Include display labels, not just API names
- Include help text or descriptions for fields where available
- Return sort/filter state so the UI can communicate it to assistive tech
- For large datasets, return pagination metadata so the UI can announce "Page 2 of 5"

```java
@AuraEnabled(cacheable=true)
public static DataTableResponse getRecords(Integer pageNumber, Integer pageSize) {
    DataTableResponse response = new DataTableResponse();
    response.records = queryRecords(pageNumber, pageSize);
    response.totalRecords = countRecords();
    response.currentPage = pageNumber;
    response.totalPages = (Integer)Math.ceil((Decimal)response.totalRecords / pageSize);
    // UI can announce: "Showing page 2 of 5, 50 records total"
    return response;
}
```

---

## Flows

### Screen Flows

Screen flows use standard Lightning components and inherit their accessibility.
However, review:

- [ ] Screen components have clear labels and help text
- [ ] Validation error messages are descriptive
- [ ] Decision element outcomes cover all paths (no silent failures)
- [ ] Flow fault paths display user-friendly error messages
- [ ] Multi-step flows indicate progress (step X of Y)

### Custom Flow Screen Components (LWC)

LWC components used in flows via `FlowAttributeChangeEvent` must:
- Validate input and communicate errors accessibly
- Support keyboard navigation fully
- Announce state changes to screen readers

```javascript
// Flow screen component — validate and report accessibly
import { api, LightningElement } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';

export default class FlowEmailInput extends LightningElement {
    @api email;

    @api
    validate() {
        const input = this.template.querySelector('lightning-input');
        if (!input.checkValidity()) {
            input.reportValidity(); // Shows accessible error message
            return {
                isValid: false,
                errorMessage: 'Please enter a valid email address.'
            };
        }
        return { isValid: true };
    }
}
```

---

## Experience Cloud

Experience Cloud sites (formerly Communities) are public-facing and fully subject to
WCAG 2.2 AA and NZ Government Web Standards.

### Key Areas to Review

- [ ] **Page titles** — each page has a unique, descriptive `<title>`
- [ ] **Skip navigation** — skip link present (Experience Cloud themes may include this)
- [ ] **Navigation landmark** — `<nav>` with `aria-label` for primary navigation
- [ ] **Language attribute** — `<html lang="en-NZ">` set in theme
- [ ] **Contact information** — accessible from every page (NZ requirement)
- [ ] **Privacy statements** — linked and accessible (NZ requirement)
- [ ] **NZ Relay Service** — link present in contact information (NZ requirement)
- [ ] **File download links** — include format and size (NZ requirement)
- [ ] **Print stylesheet** — main content printable on A4 with org name/logo

### Custom Theme Components

If using custom theme layouts:
- The theme must provide landmark regions (`<header>`, `<nav>`, `<main>`, `<footer>`)
- Custom headers/footers must not trap keyboard focus
- Mobile navigation must be keyboard-accessible (hamburger menus need ARIA)

---

## Common Anti-Patterns

These are the most frequently encountered accessibility issues in Salesforce development.
Flag them as **critical** during review.

### 1. Icon-Only Buttons Without Labels

```html
<!-- FAIL: no accessible name -->
<lightning-button-icon icon-name="utility:delete" onclick={handleDelete}>
</lightning-button-icon>

<!-- PASS -->
<lightning-button-icon
  icon-name="utility:delete"
  alternative-text="Delete record"
  onclick={handleDelete}>
</lightning-button-icon>
```

### 2. Clickable Divs

```html
<!-- FAIL: not keyboard accessible, no role -->
<div class="clickable-card" onclick={handleSelect}>
  {recordName}
</div>

<!-- PASS: use a button -->
<button class="card-button" onclick={handleSelect}>
  {recordName}
</button>
```

### 3. Colour-Only Status Indicators

```html
<!-- FAIL: relies on colour alone -->
<span class={statusClass}>{statusLabel}</span>

<!-- PASS: icon + text + colour -->
<span class={statusClass}>
  <lightning-icon
    icon-name={statusIcon}
    size="x-small"
    alternative-text={statusLabel}>
  </lightning-icon>
  {statusLabel}
</span>
```

### 4. Missing Form Labels

```html
<!-- FAIL: label-hidden without alternative -->
<lightning-input variant="label-hidden" placeholder="Search...">
</lightning-input>

<!-- PASS: visually hidden but accessible -->
<lightning-input
  label="Search records"
  variant="label-hidden"
  placeholder="Search...">
</lightning-input>
```

### 5. Focus Styles Removed

```css
/* FAIL: removes all focus indication */
* { outline: none; }
:focus { outline: none; box-shadow: none; }

/* PASS: custom focus style */
:focus-visible {
    outline: 2px solid var(--slds-g-color-brand-base-50);
    outline-offset: 2px;
    border-radius: 4px;
}
```

### 6. Dynamic Content Without Announcement

```javascript
// FAIL: updates UI but screen reader doesn't know
this.records = newRecords;

// PASS: announce the change
this.records = newRecords;
this.screenReaderMessage = `${newRecords.length} records loaded`;
// Template has: <div aria-live="polite" class="slds-assistive-text">{screenReaderMessage}</div>
```

### 7. Modal Without Focus Trap

```javascript
// FAIL: opening a custom modal without managing focus
this.showModal = true;

// PASS: use LightningModal (handles focus trapping automatically)
import MyModal from 'c/myModal';
const result = await MyModal.open({
    size: 'medium',
    description: 'Edit record details'
});
```

### 8. Tables Without Headers

```html
<!-- FAIL: data table with no column headers -->
<table>
  <tr><td>John Smith</td><td>john@example.com</td></tr>
</table>

<!-- PASS: proper headers (prefer lightning-datatable for built-in a11y) -->
<table>
  <thead>
    <tr>
      <th scope="col">Name</th>
      <th scope="col">Email</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>John Smith</td><td>john@example.com</td></tr>
  </tbody>
</table>
```

---

## Testing Approaches

### Automated Testing

**In Jest tests** — integrate `jest-axe` for automated WCAG checking:

```javascript
import { createElement } from 'lwc';
import { axe, toHaveNoViolations } from 'jest-axe';
import MyComponent from 'c/myComponent';

expect.extend(toHaveNoViolations);

describe('c-my-component accessibility', () => {
    it('has no accessibility violations', async () => {
        const element = createElement('c-my-component', { is: MyComponent });
        document.body.appendChild(element);

        // Wait for async rendering
        await Promise.resolve();

        const results = await axe(element);
        expect(results).toHaveNoViolations();
    });
});
```

### Manual Testing Checklist

1. **Keyboard-only navigation**: tab through the entire component without using a mouse
2. **Screen reader**: test with NVDA (Windows) or VoiceOver (macOS)
3. **Zoom to 200%**: verify no content loss or overlap
4. **Zoom to 400%**: verify content reflows without horizontal scrolling
5. **High contrast mode**: verify content remains visible in Windows High Contrast Mode
6. **Reduced motion**: enable `prefers-reduced-motion` and verify animations stop
7. **Browser DevTools**: run Lighthouse accessibility audit or axe DevTools scan
