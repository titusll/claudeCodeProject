# WCAG 2.2 Level AA — Full Checklist

This reference covers every WCAG 2.2 success criterion required for Level AA conformance.
Use it when reviewing any web content, LWC template, or UI-facing code.

Official specification: [WCAG 2.2 — W3C Recommendation](https://www.w3.org/TR/WCAG22/)

## Table of Contents

1. [Perceivable (Principle 1)](#perceivable)
2. [Operable (Principle 2)](#operable)
3. [Understandable (Principle 3)](#understandable)
4. [Robust (Principle 4)](#robust)

---

## Perceivable

Content must be presentable in ways all users can perceive.

### 1.1 Text Alternatives

**SC 1.1.1 Non-text Content (Level A)**
Every non-text element needs a text alternative that serves the same purpose.

- Images: `alt="description of what the image conveys"`
- Decorative images: `alt=""` plus `aria-hidden="true"`
- Icon buttons: `aria-label` or `alternative-text` attribute
- Complex images (charts, diagrams): provide a long description nearby or via `aria-describedby`
- CAPTCHAs: provide an alternative form (audio, logical puzzle)

```html
<!-- Good: meaningful alt -->
<img src="chart.png" alt="Q4 revenue up 15% year-over-year">

<!-- Good: decorative -->
<img src="divider.png" alt="" aria-hidden="true">

<!-- Good: LWC icon button -->
<lightning-button-icon
  icon-name="utility:delete"
  alternative-text="Delete this record">
</lightning-button-icon>
```

### 1.2 Time-Based Media

**SC 1.2.1 Audio-only and Video-only (Level A)**
- Audio-only: provide a text transcript
- Video-only: provide a text description or audio track

**SC 1.2.2 Captions (Prerecorded) (Level A)**
- All prerecorded video with audio must have synchronised captions

**SC 1.2.3 Audio Description or Media Alternative (Level A)**
- Prerecorded video provides audio description or a full text alternative

**SC 1.2.4 Captions (Live) (Level AA)**
- Live audio content must have real-time captions
- NZ Standard: MUST have live captions if content is high-stakes (see NZ reference)

**SC 1.2.5 Audio Description (Prerecorded) (Level AA)**
- Prerecorded video must have audio description
- NZ Standard: Required for video published on or after 17 March 2025

### 1.3 Adaptable

**SC 1.3.1 Info and Relationships (Level A)**
- Structure conveyed visually must also be conveyed programmatically
- Use semantic HTML: `<h1>`–`<h6>`, `<nav>`, `<main>`, `<table>`, `<th>`, `<ul>/<ol>`
- Form fields must be associated with labels via `<label for="">` or `aria-labelledby`
- Data tables need proper headers with `scope="col"` / `scope="row"`

**SC 1.3.2 Meaningful Sequence (Level A)**
- DOM order must match visual reading order
- CSS layout (`flex`, `grid`) should not reorder content in a way that breaks reading sequence

**SC 1.3.3 Sensory Characteristics (Level A)**
- Instructions must not rely solely on shape, colour, size, position, or sound
- Bad: "Click the green button" / "See the sidebar on the right"
- Good: "Click the Submit button" / "See the Related Records section"

**SC 1.3.4 Orientation (Level AA)**
- Content must not be restricted to a single display orientation unless essential

**SC 1.3.5 Identify Input Purpose (Level AA)**
- Input fields collecting personal data should use `autocomplete` attributes
- Example: `autocomplete="email"`, `autocomplete="given-name"`

### 1.4 Distinguishable

**SC 1.4.1 Use of Colour (Level A)**
- Colour must not be the only visual means of conveying information
- Error states: use icon + text + colour, not just red text
- Links: distinguish from surrounding text by underline or icon, not just colour
- Status indicators: pair colour with icon, shape, or text label

**SC 1.4.2 Audio Control (Level A)**
- Audio that plays automatically for more than 3 seconds must have pause/stop/volume controls

**SC 1.4.3 Contrast (Minimum) (Level AA)**
- Normal text: **4.5:1** contrast ratio minimum
- Large text (18pt / 14pt bold): **3:1** minimum
- Use SLDS design tokens — they are engineered for compliance
- Test with browser DevTools contrast checker or axe

**SC 1.4.4 Resize Text (Level AA)**
- Text must be resizable up to 200% without loss of content or functionality
- Use `rem`/`em`/`%` not `px` for font sizes
- Do not set `max-height` with `overflow: hidden` on text containers

**SC 1.4.5 Images of Text (Level AA)**
- Do not use images to display text unless essential (logos are exempt)
- Use actual HTML text with CSS styling

**SC 1.4.10 Reflow (Level AA)**
- Content reflows at 320px CSS width (equivalent to 400% zoom on 1280px viewport)
- No horizontal scrolling for vertical-reading content
- No vertical scrolling for horizontal-reading content

**SC 1.4.11 Non-text Contrast (Level AA)**
- UI components and graphical objects: **3:1** contrast against adjacent colours
- Applies to: form field borders, icons conveying meaning, chart segments, focus indicators

**SC 1.4.12 Text Spacing (Level AA)**
- Content must remain readable and functional when users override:
  - Line height to 1.5x font size
  - Paragraph spacing to 2x font size
  - Letter spacing to 0.12x font size
  - Word spacing to 0.16x font size
- Avoid fixed-height containers that clip text when spacing changes

**SC 1.4.13 Content on Hover or Focus (Level AA)**
- Tooltips/popovers triggered by hover or focus must be:
  - Dismissable (e.g., Escape key) without moving focus
  - Hoverable (user can move pointer over the tooltip)
  - Persistent (stays visible until user dismisses, moves focus, or the trigger is removed)

---

## Operable

UI components and navigation must be operable by all users.

### 2.1 Keyboard Accessible

**SC 2.1.1 Keyboard (Level A)**
- All functionality available via mouse must also be available via keyboard
- All interactive elements must be focusable and activatable with keyboard
- Custom components need `tabindex="0"` and keyboard event handlers

**SC 2.1.2 No Keyboard Trap (Level A)**
- Focus must never become trapped in a component
- Modals: focus should be trapped inside while open, but Escape must close and return focus
- Dropdowns: Escape closes and returns focus to trigger

**SC 2.1.4 Character Key Shortcuts (Level A)**
- Single-character keyboard shortcuts must be remappable or disableable

### 2.2 Enough Time

**SC 2.2.1 Timing Adjustable (Level A)**
- If a time limit exists, users can turn off, adjust, or extend it
- Session timeouts: warn before expiry and allow extension

**SC 2.2.2 Pause, Stop, Hide (Level A)**
- Moving, blinking, or auto-updating content can be paused, stopped, or hidden
- Auto-advancing carousels need pause controls

### 2.3 Seizures and Physical Reactions

**SC 2.3.1 Three Flashes or Below Threshold (Level A)**
- Content must not flash more than 3 times per second

### 2.4 Navigable

**SC 2.4.1 Bypass Blocks (Level A)**
- Provide a mechanism to skip repeated blocks of content (skip navigation links)

**SC 2.4.2 Page Titled (Level A)**
- Pages have descriptive titles. In LWC, set via `document.title` or `NavigationMixin`

**SC 2.4.3 Focus Order (Level A)**
- Focus order is logical and meaningful
- Avoid `tabindex` values greater than 0
- After dynamic content changes, manage focus programmatically

**SC 2.4.4 Link Purpose (In Context) (Level A)**
- Link text describes the destination. Avoid "click here" or "read more" without context
- If link text alone is ambiguous, surrounding context (sentence, paragraph, `aria-label`) must clarify

**SC 2.4.5 Multiple Ways (Level AA)**
- More than one way to locate a page (navigation, search, sitemap)

**SC 2.4.6 Headings and Labels (Level AA)**
- Headings and labels describe the topic or purpose
- Heading levels should not skip (e.g., `<h1>` to `<h3>` without `<h2>`)

**SC 2.4.7 Focus Visible (Level AA)**
- Keyboard focus indicator is visible on all interactive elements
- Do not use `outline: none` without a visible replacement
- SLDS provides default focus styles — do not override them

**SC 2.4.11 Focus Not Obscured (Minimum) (Level AA) — NEW in 2.2**
- When an element receives focus, it is not entirely hidden by other content
- Sticky headers, footers, or overlays must not cover focused elements

**SC 2.4.12 Focus Not Obscured (Enhanced) (Level AAA — informational)**
- No part of the focused element is obscured (stricter than 2.4.11)

**SC 2.4.13 Focus Appearance (Level AAA — informational)**
- Focus indicator has sufficient size and contrast

### 2.5 Input Modalities

**SC 2.5.1 Pointer Gestures (Level A)**
- Multi-point or path-based gestures have single-pointer alternatives

**SC 2.5.2 Pointer Cancellation (Level A)**
- For single-pointer actions, at least one of: no down-event, abort/undo, up-event reverses

**SC 2.5.3 Label in Name (Level A)**
- Visible label text is included in the accessible name

**SC 2.5.4 Motion Actuation (Level A)**
- Functionality triggered by device motion can be disabled and has UI alternatives

**SC 2.5.7 Dragging Movements (Level AA) — NEW in 2.2**
- Any dragging operation has a non-dragging alternative (e.g., up/down buttons, menus)
- Common in Salesforce: kanban boards, reorderable lists, drag-to-assign

**SC 2.5.8 Target Size (Minimum) (Level AA) — NEW in 2.2**
- Interactive target size is at least **24x24 CSS pixels**
- Exception: inline links within text, targets with sufficient spacing
- Check: small icon buttons, close buttons, compact table actions

---

## Understandable

Content and interface operation must be understandable.

### 3.1 Readable

**SC 3.1.1 Language of Page (Level A)**
- Page language declared: `<html lang="en-NZ">`

**SC 3.1.2 Language of Parts (Level AA)**
- Content in a different language from the page has `lang` attribute set

### 3.2 Predictable

**SC 3.2.1 On Focus (Level A)**
- Receiving focus does not trigger a context change (page navigation, form submission)

**SC 3.2.2 On Input (Level A)**
- Changing a form control does not automatically cause a context change unless the user is warned

**SC 3.2.3 Consistent Navigation (Level AA)**
- Navigation mechanisms in the same relative order across pages

**SC 3.2.4 Consistent Identification (Level AA)**
- Components with the same functionality have consistent labels

### 3.3 Input Assistance

**SC 3.3.1 Error Identification (Level A)**
- Errors are identified and described in text (not just colour)
- Error messages specify which field has the error

**SC 3.3.2 Labels or Instructions (Level A)**
- Form inputs have labels or instructions
- Required fields are indicated programmatically (`required` attribute, `aria-required`)

**SC 3.3.3 Error Suggestion (Level AA)**
- If an error is detected and suggestions are known, they are provided
- Example: "Email format: name@example.com"

**SC 3.3.4 Error Prevention (Legal, Financial, Data) (Level AA)**
- Submissions that cause legal/financial commitments are reversible, verified, or confirmed

**SC 3.3.7 Redundant Entry (Level A) — NEW in 2.2**
- Information previously entered by the user is auto-populated or selectable
- Do not re-ask for email, name, or address across steps in a multi-step form

**SC 3.3.8 Accessible Authentication (Minimum) (Level AA) — NEW in 2.2**
- Authentication does not require a cognitive function test (e.g., solving a puzzle, remembering a password without paste support)
- Allow password managers, copy-paste, and biometric/SSO authentication
- CAPTCHAs: provide object-recognition alternative, not just text-distortion

---

## Robust

Content must be robust enough for assistive technologies.

### 4.1 Compatible

**SC 4.1.2 Name, Role, Value (Level A)**
- Custom UI components expose:
  - Accessible name (via label, `aria-label`, or `aria-labelledby`)
  - Role (via semantic HTML or `role` attribute)
  - Value/state (via `aria-checked`, `aria-expanded`, `aria-selected`, etc.)

**SC 4.1.3 Status Messages (Level AA)**
- Status messages (success, error, progress) are communicated to assistive tech without receiving focus
- Use `aria-live="polite"` for non-urgent updates, `aria-live="assertive"` for critical alerts
- Lightning toast notifications handle this automatically — custom implementations must set `aria-live`
