---
name: accessibility-review
description: >
  Accessibility compliance review for Salesforce UX components against WCAG 2.2 Level AA,
  NZ Government Web Accessibility Standard 1.2, and NZ Government Web Usability Standard 1.4.
  Use this skill when the user explicitly requests an accessibility review — phrases like
  "accessibility review", "a11y check", "run accessibility", "check accessibility",
  "review for accessibility", or "check my component for a11y". Applies to Lightning Web
  Components (LWC), Aura components, Visualforce pages, and Screen Flows — the customisable
  UX layers where accessibility standards apply. NOT for Apex classes, triggers, non-screen
  flows (record-triggered, autolaunched, scheduled), custom objects, fields, permission sets,
  profiles, flexi pages, static resources, or any other non-UX metadata.
---

# Accessibility Review

## Purpose

This skill reviews UI-facing Salesforce components against WCAG 2.2 Level AA, the
New Zealand Government Web Accessibility Standard 1.2, and the NZ Government Web Usability
Standard 1.4 before code reaches production.

Accessibility is a legal compliance requirement for organisations operating under
NZ Government Web Standards (effective 17 March 2025). Catching issues before deployment
is dramatically cheaper than remediating them in production.

## In Scope

This skill applies to customisable UX components:
- **Lightning Web Components (LWC)** — `.html`, `.js`, `.css` files under `lwc/`
- **Aura components** — `.cmp`, `.app`, `.evt`, `.js`, `.css` files under `aura/`
- **Visualforce pages** — `.page`, `.component` files under `pages/` or `components/`
- **Screen Flows** — `.flow-meta.xml` files under `flows/` whose `<processType>` is `Flow` (screen-rendering flows only)

**Out of scope:** Apex classes, triggers, non-screen flows (record-triggered, autolaunched, scheduled — no UI surface), custom objects, fields, validation rules, permission sets, profiles, flexi pages, static resources, custom labels, SOQL scripts, anonymous Apex, or any other non-UX metadata.

## Authoritative Sources

Base every review on:

1. **NZ Government Web Standards** — https://www.digital.govt.nz/standards-and-guidance/nz-government-web-standards
   - Web Accessibility Standard (WCAG 2.2 Level AA + NZ-specific criteria)
   - Web Usability Standard
   - Inclusive design, plain language, and Te Reo Māori support guidance
2. **Salesforce-specific accessibility guidance** — Lightning Design System (SLDS) accessibility patterns, base component accessibility properties, and Screen Flow accessibility limitations.
3. **The reference files in this skill** — see [Reference Files](#reference-files) below for the full WCAG 2.2 AA criteria breakdown, NZ Standards specifics, and Salesforce/LWC/Aura/SLDS patterns.

---

## Review Workflow

1. **Confirm scope.** Ask the user which file(s) to review if it isn't already explicit. Gather the full set:
   - LWC: `.html`, `.js`, `.css`, `.js-meta.xml`, plus any imported child components under `force-app/main/default/lwc/`
   - Aura: `.cmp`, `.css`, `.js` controller/helper files under `force-app/main/default/aura/`
   - Screen Flows: the `.flow-meta.xml` under `force-app/main/default/flows/`
   - Supporting metadata: any custom labels, custom permissions, or field-level configuration referenced by the component

2. **Run the structured audit** against the [Quick Checklist](#quick-checklist) — Perceivable / Operable / Understandable / Robust / NZ-specific. Read the [Reference Files](#reference-files) for detailed criteria, code examples, and remediation patterns. Cover at minimum:
   - **Perceivable** — text alternatives (alt, aria-label), captions, colour contrast (4.5:1 normal text, 3:1 large/UI), responsive text resize, content reflow at 320 CSS pixels, non-text contrast, semantic structure (headings, landmarks, lists)
   - **Operable** — full keyboard accessibility, no keyboard traps, visible focus indicators (WCAG 2.4.7 + 2.4.11), skip links, target size (WCAG 2.5.8 minimum 24×24 CSS pixels), no seizure-inducing content, dragging movements alternatives (WCAG 2.5.7)
   - **Understandable** — language attribute (`lang="en-NZ"` or appropriate), consistent navigation, clear labels and instructions, error identification and suggestions, redundant entry avoidance (WCAG 3.3.7), accessible authentication (WCAG 3.3.8/3.3.9)
   - **Robust** — valid HTML, correct ARIA roles/states/properties, status messages, name/role/value exposed for custom components
   - **NZ-specific** — support for Te Reo Māori (correct lang attributes, macrons, character encoding), plain English (Web Usability Standard), New Zealand date/currency/address formats, links to NZ Government resources where appropriate

3. **Apply Salesforce-specific checks:**
   - **LWC** — prefer `lightning-*` base components over raw HTML for built-in a11y; verify `aria-*` attributes via `lwc:spread` or property bindings; check `<template lwc:if>` does not break focus management; ensure `<lightning-input>` has `label`, `field-level-help`, and proper `required` / `message-when-*` handling; verify modal trapping with `<lightning-modal>`.
   - **Aura** — check `aura:label` patterns and avoid deprecated components; ensure `force:inputField` accessibility.
   - **Screen Flows** — verify every screen field has a label, help text where appropriate, accessible component choices (use Display Text sparingly with semantic markup); validate logical reading order; check for keyboard-only completion path; ensure error messages are actionable; verify required field indicators.
   - **SLDS** — confirm correct use of utility classes for visually-hidden text (`slds-assistive-text`); avoid colour-only state indication; use SLDS icons with proper alt text.

4. **Verify with concrete evidence.** Quote the specific lines, elements, or flow steps that have issues. Cite the exact WCAG/NZ criterion (e.g. `WCAG 2.4.7 Focus Visible — Level AA`, `NZ Web Usability Standard §contact-info`). Drop any finding you cannot substantiate.

5. **Report findings** using the [Output Format](#output-format) below.

For detailed criteria and patterns while auditing, consult:

| File type | Reference to read |
|---|---|
| LWC HTML/JS/CSS | `references/salesforce-accessibility.md` |
| Aura `.cmp` / Visualforce `.page` | `references/salesforce-accessibility.md` |
| Screen Flow `.flow-meta.xml` | `references/salesforce-accessibility.md` (Flows section) |
| Any web content | `references/wcag-2-2-checklist.md` |
| NZ-regulated content | `references/nz-government-standards.md` |

---

## Output Format

Produce a Markdown report with these sections:

1. **Summary** — overall conformance verdict (`Pass` / `Pass with minor issues` / `Fails NZ Standard`), artefact reviewed, standards version applied (e.g. WCAG 2.2 AA + NZ Web Accessibility Standard 1.2 + NZ Web Usability Standard 1.4).

2. **Critical Issues** — blockers for NZ Government Web Accessibility Standard conformance. For each:
   - WCAG/NZ criterion reference (e.g. `WCAG 2.4.7 Focus Visible — Level AA`)
   - Affected file / line / element
   - Description of the issue
   - Suggested fix with code or configuration change

3. **Major Issues** — significant a11y or usability concerns that should be fixed before release.

4. **Minor Issues / Recommendations** — best-practice improvements.

5. **Positive Findings** — what is done well (encourage good patterns).

6. **Suggested Next Steps** — prioritised action list and the manual tests the developer should run:
   - Keyboard-only walkthrough of the changed flows
   - Screen reader pass (NVDA on Windows, VoiceOver on macOS)
   - Zoom to 200% and 400% — verify reflow at 320 CSS px
   - High-contrast mode and `prefers-reduced-motion` check

Use clear headings, code fences for snippets, and explicit standard references throughout (e.g. `(WCAG 2.4.7 Focus Visible — Level AA)`, `(NZ Web Usability Standard §X)`).

---

## Quick Checklist

This is the abbreviated checklist to evaluate against. For the full criteria with
examples and Salesforce-specific patterns, read the reference files.

### Perceivable (WCAG Principle 1)

- [ ] **Images have alt text** — every `<img>`, `lightning-icon`, and `lightning-button-icon` has meaningful `alternative-text` or `alt` attributes. Decorative images use `alt=""` or `aria-hidden="true"`. (WCAG 1.1.1)
- [ ] **Video/audio has captions** — prerecorded media has captions; live media with high-stakes information has live captions (NZ requirement). (WCAG 1.2.2 / 1.2.4)
- [ ] **Audio description available** — prerecorded video published after 17 March 2025 provides audio description (NZ requirement). (WCAG 1.2.5)
- [ ] **Information not conveyed by colour alone** — status indicators use icons, text, or patterns in addition to colour. (WCAG 1.4.1)
- [ ] **Colour contrast meets 4.5:1** — text against background meets minimum ratio (3:1 for large text and non-text UI). Use SLDS design tokens rather than hardcoded colours. (WCAG 1.4.3 / 1.4.11)
- [ ] **Text resizable to 200%** — no content loss or overlap when text is scaled. Use relative units (`rem`, `em`, `%`), not `px` for font sizes. (WCAG 1.4.4)
- [ ] **Content reflows at 320px width** — no horizontal scrolling at 400% zoom (1280px viewport). (WCAG 1.4.10)

### Operable (WCAG Principle 2)

- [ ] **Full keyboard accessibility** — all interactive elements reachable and operable via keyboard. No keyboard traps. (WCAG 2.1.1 / 2.1.2)
- [ ] **Focus visible and not obscured** — custom components have visible focus indicators. Do not remove `:focus` outlines without providing an alternative. The focused element must not be entirely hidden by sticky headers/overlays. (WCAG 2.4.7 + 2.4.11 — 2.4.11 new in 2.2)
- [ ] **Focus order logical** — tab order follows visual reading order. Avoid positive `tabindex` values. (WCAG 2.4.3)
- [ ] **Skip navigation available** — pages with repeated navigation blocks offer a skip link. (WCAG 2.4.1)
- [ ] **No timing traps** — if timeouts exist, users can extend or disable them. (WCAG 2.2.1)
- [ ] **Motion/animation respects `prefers-reduced-motion`** — animated content honours the media query.
- [ ] **Dragging alternatives** — any drag-and-drop interaction has a non-dragging alternative. (WCAG 2.5.7 — new in 2.2)
- [ ] **Target size minimum 24×24px** — interactive targets meet minimum size. (WCAG 2.5.8 — new in 2.2)

### Understandable (WCAG Principle 3)

- [ ] **Language set** — page/component language is declared. Use `lang="en-NZ"` for NZ English content; mark Te Reo Māori passages with `lang="mi"` and verify macrons render correctly (UTF-8 encoding, not stripped or substituted). (WCAG 3.1.1 / 3.1.2)
- [ ] **Labels and instructions clear** — form fields have visible labels (not just placeholders). Required fields are programmatically indicated. (WCAG 3.3.2)
- [ ] **Error messages descriptive** — validation errors identify the field and describe how to fix the problem. Apex `AuraHandledException` messages are user-readable. (WCAG 3.3.1 / 3.3.3)
- [ ] **Consistent navigation** — repeated components appear in the same relative order. (WCAG 3.2.3)
- [ ] **Redundant entry minimised** — information already entered is auto-populated or selectable, not re-requested. (WCAG 3.3.7 — new in 2.2)
- [ ] **Accessible authentication** — login flows do not require cognitive function tests (puzzle CAPTCHAs, memory tests). (WCAG 3.3.8 — new in 2.2)

### Robust (WCAG Principle 4)

- [ ] **Valid HTML structure** — proper heading hierarchy, semantic elements (`<nav>`, `<main>`, `<section>`), no duplicate IDs.
- [ ] **ARIA used correctly** — ARIA roles, states, and properties match the element's behaviour. Prefer native HTML semantics over ARIA where possible. (WCAG 4.1.2)
- [ ] **Name, Role, Value exposed** — custom components expose accessible name, role, and state to assistive technology. (WCAG 4.1.2)
- [ ] **Status messages use `aria-live`** — dynamic content updates (toasts, inline errors, loading states) are announced to screen readers. (WCAG 4.1.3)

### NZ Government Web Standards (Standard 1.2 / 1.4)

- [ ] **High-stakes content captioned live** — content related to health, emergency, employment safety, benefits, legal proceedings, elections, or tax has live captions.
- [ ] **Contact information present** — pages include email, postal address, phone, and NZ Relay Service link.
- [ ] **Non-HTML links labelled** — links to PDFs, DOCX, etc. include format and file size in the link text.
- [ ] **Privacy statements provided** — both organisation and website privacy statements are accessible.
- [ ] **Content printable on A4** — main content remains usable when printed.
- [ ] **NZ language and conventions** — Te Reo Māori passages tagged with `lang="mi"` and macrons preserved; plain-English readability; NZ date / currency / address formats.

---

## Operating Principles

- **Be specific, not generic** — name the file, line, and element. "Add `alternative-text=\"Close dialog\"` to `lightning-button-icon` on line 42 of `customerModal.html`" beats "improve aria labels".
- **Quote concrete evidence** — every finding must cite a specific WCAG/NZ criterion AND a specific file/line/element. Drop anything you cannot substantiate.
- **Prioritise ruthlessly** — the developer should know the single thing to fix first.
- **Acknowledge Salesforce constraints** — when a base component or Screen Flow Display Text limit blocks the ideal fix, call out the constraint and suggest the realistic mitigation.
- **Ask when unclear** — if you cannot locate the artefact, the user's intent is ambiguous, or you need to see a parent component / flow, ask before guessing.
- **Stay scoped** — review only the changed/created artefacts unless the user explicitly broadens the scope.

## Reference Files

For detailed criteria, code examples, and remediation patterns, read:

| When you need... | Read |
|---|---|
| Full WCAG 2.2 AA success criteria breakdown | `references/wcag-2-2-checklist.md` |
| NZ Government Web Standards specifics | `references/nz-government-standards.md` |
| Salesforce/LWC/Aura/SLDS accessibility patterns | `references/salesforce-accessibility.md` |
