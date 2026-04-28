---
name: accessibility-review
description: >
  Accessibility compliance review for Salesforce UX components against WCAG 2.2 Level AA
  and NZ Government Web Accessibility Standard 1.2. Use this skill when the user explicitly
  requests an accessibility review — phrases like "accessibility review", "a11y check",
  "run accessibility", "check accessibility", "review for accessibility", or
  "check my component for a11y". Also trigger when the user deploys, commits, or pushes
  changes that include Lightning Web Components (LWC), Aura components, or Visualforce
  pages — these are the customisable UX layers where accessibility standards apply.
  NOT for Apex classes, triggers, flows, custom objects, fields, permission sets, profiles,
  flexi pages, static resources, or any other non-UX metadata — those do not need this review.
---

# Accessibility Review

## Purpose

This skill reviews UI-facing Salesforce components against WCAG 2.2 Level AA and
New Zealand Government Web Accessibility Standard 1.2 before code reaches production.

Accessibility is a legal compliance requirement for organisations operating under
NZ Government Web Standards (effective 17 March 2025). Catching issues before deployment
is dramatically cheaper than remediating them in production.

## When This Skill Runs

Use this review when deploying, committing, or pushing changes to **customisable UX components**:
- **Lightning Web Components (LWC)** — `.html`, `.js`, `.css` files under `lwc/`
- **Aura components** — `.cmp`, `.app`, `.evt`, `.js`, `.css` files under `aura/`
- **Visualforce pages** — `.page`, `.component` files under `pages/` or `components/`

**Skip this review** for changes that only touch:
- Apex classes, triggers, or test classes
- Flows (screen or record-triggered)
- Custom objects, fields, validation rules, permission sets, profiles
- Flexi pages, static resources, custom labels
- SOQL scripts, anonymous Apex, or any other non-UX metadata

---

## Review Process

### Step 1 — Identify Changed Files

Determine which files are being deployed or pushed. Use one of:

```bash
# For git push — files changed on this branch vs main/master
git diff --name-only main...HEAD

# For SF deploy — check what's staged or specified in the deploy command
git diff --name-only --cached
```

Filter to customisable UX component file types only:
- `.html` — LWC templates (`lwc/`)
- `.js` — LWC JavaScript (`lwc/`) — dynamic rendering, ARIA manipulation, focus management
- `.css` — LWC / Aura styles (`lwc/`, `aura/`)
- `.cmp` / `.app` / `.evt` — Aura component markup (`aura/`)
- `.page` — Visualforce pages (`pages/`)
- `.component` — Visualforce components (`components/`)

Ignore all other file types (`.cls`, `.trigger`, `.xml`, `.object`, `.resource`, etc.).

If no LWC, Aura, or Visualforce files are changed, report "No UX component changes detected — accessibility review not required" and allow the operation to proceed.

### Step 2 — Run the Review Checklist

For each changed file, read its contents and evaluate against the checklist below.
Consult the reference files for detailed criteria when needed:

| File type | Reference to read |
|---|---|
| LWC HTML/JS/CSS | `references/salesforce-accessibility.md` |
| Any web content | `references/wcag-2-2-checklist.md` |
| NZ-regulated content | `references/nz-government-standards.md` |

### Step 3 — Report Findings

Present findings in this format:

```
## Accessibility Review Results

### Summary
- Files reviewed: X
- Issues found: X (Y critical, Z warnings)
- Status: PASS / NEEDS ATTENTION / BLOCKED

### Critical Issues (must fix before deploy)
1. [file:line] — Description of issue
   Rule: WCAG 2.2 SC X.X.X (Level AA) / NZ Standard reference
   Fix: Specific remediation guidance

### Warnings (should fix, not blocking)
1. [file:line] — Description of issue
   Rule: ...
   Fix: ...

### Passed Checks
- ✓ Brief summary of what passed
```

**Critical issues** block the deploy/push. **Warnings** are reported but do not block.

### Step 4 — Gate the Operation

- If **critical issues** exist: Do NOT proceed with the deploy or push. Present the
  issues and ask the user to fix them first. Offer to help fix each issue.
- If **only warnings** exist: Present them, then ask the user to confirm before proceeding.
- If **no issues** found: Report the clean result and proceed with the deploy/push.

---

## Quick Checklist

This is the abbreviated checklist to evaluate against. For the full criteria with
examples and Salesforce-specific patterns, read the reference files.

### Perceivable (WCAG Principle 1)

- [ ] **Images have alt text** — every `<img>`, `lightning-icon`, and `lightning-button-icon` has meaningful `alternative-text` or `alt` attributes. Decorative images use `alt=""` or `aria-hidden="true"`.
- [ ] **Video/audio has captions** — prerecorded media has captions; live media with high-stakes information has live captions (NZ requirement).
- [ ] **Audio description available** — prerecorded video published after 17 March 2025 provides audio description (NZ requirement).
- [ ] **Information not conveyed by colour alone** — status indicators use icons, text, or patterns in addition to colour.
- [ ] **Colour contrast meets 4.5:1** — text against background meets minimum ratio (3:1 for large text). Use SLDS design tokens rather than hardcoded colours.
- [ ] **Text resizable to 200%** — no content loss or overlap when text is scaled. Use relative units (`rem`, `em`, `%`), not `px` for font sizes.
- [ ] **Content reflows at 320px width** — no horizontal scrolling at 400% zoom (1280px viewport).

### Operable (WCAG Principle 2)

- [ ] **Full keyboard accessibility** — all interactive elements reachable and operable via keyboard. No keyboard traps.
- [ ] **Focus visible** — custom components have visible focus indicators. Do not remove `:focus` outlines without providing an alternative.
- [ ] **Focus order logical** — tab order follows visual reading order. Avoid positive `tabindex` values.
- [ ] **Skip navigation available** — pages with repeated navigation blocks offer a skip link.
- [ ] **No timing traps** — if timeouts exist, users can extend or disable them.
- [ ] **Motion/animation respects prefers-reduced-motion** — animated content honours the `prefers-reduced-motion` media query.
- [ ] **Dragging alternatives** — any drag-and-drop interaction has a non-dragging alternative (WCAG 2.2 new).
- [ ] **Target size minimum 24x24px** — interactive targets meet minimum size (WCAG 2.2 new).

### Understandable (WCAG Principle 3)

- [ ] **Language set** — page/component language is declared.
- [ ] **Labels and instructions clear** — form fields have visible labels (not just placeholders). Required fields are programmatically indicated.
- [ ] **Error messages descriptive** — validation errors identify the field and describe how to fix the problem. Apex `AuraHandledException` messages are user-readable.
- [ ] **Consistent navigation** — repeated components appear in the same relative order.
- [ ] **Redundant entry minimised** — information already entered is auto-populated or selectable, not re-requested (WCAG 2.2 new).
- [ ] **Accessible authentication** — login flows do not require cognitive function tests (WCAG 2.2 new).

### Robust (WCAG Principle 4)

- [ ] **Valid HTML structure** — proper heading hierarchy, semantic elements (`<nav>`, `<main>`, `<section>`), no duplicate IDs.
- [ ] **ARIA used correctly** — ARIA roles, states, and properties match the element's behaviour. Prefer native HTML semantics over ARIA where possible.
- [ ] **Name, Role, Value exposed** — custom components expose accessible name, role, and state to assistive technology.
- [ ] **Status messages use aria-live** — dynamic content updates (toasts, inline errors, loading states) are announced to screen readers.

### NZ Government Web Standards (Standard 1.2 / 1.4)

- [ ] **High-stakes content captioned live** — content related to health, emergency, employment safety, benefits, legal proceedings, elections, or tax has live captions.
- [ ] **Contact information present** — pages include email, postal address, phone, and NZ Relay Service link.
- [ ] **Non-HTML links labelled** — links to PDFs, DOCX, etc. include format and file size in the link text.
- [ ] **Privacy statements provided** — both organisation and website privacy statements are accessible.
- [ ] **Content printable on A4** — main content remains usable when printed.

---

## Reference Files

For detailed criteria, code examples, and remediation patterns, read:

| When you need... | Read |
|---|---|
| Full WCAG 2.2 AA success criteria breakdown | `references/wcag-2-2-checklist.md` |
| NZ Government Web Standards specifics | `references/nz-government-standards.md` |
| Salesforce/LWC/Aura/SLDS accessibility patterns | `references/salesforce-accessibility.md` |
