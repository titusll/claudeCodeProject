# New Zealand Government Web Standards

This reference covers the NZ Government Web Accessibility Standard 1.2 and Web Usability
Standard 1.4, effective **17 March 2025**. These standards apply to all organisations
operating under NZ government web requirements, covering both publicly facing and
internally facing web pages.

Source: [DNS — New Web Standards for March 2025](https://dns.govt.nz/standards-and-guidance/nz-government-web-standards/new-web-standards-for-march-2025)

## Table of Contents

1. [Web Accessibility Standard 1.2](#web-accessibility-standard-12)
2. [High-Stakes Information](#high-stakes-information)
3. [Web Usability Standard 1.4](#web-usability-standard-14)
4. [Scope and Applicability](#scope-and-applicability)
5. [Review Checklist](#review-checklist)

---

## Web Accessibility Standard 1.2

The core requirement: **Web pages must meet WCAG 2.2 at Level AA.**

This is an upgrade from the previous standard which referenced WCAG 2.1. WCAG 2.2
introduced six new success criteria, all of which are now mandatory:

| New SC | Level | What it addresses |
|---|---|---|
| 2.4.11 Focus Not Obscured (Minimum) | AA | Focused element must not be entirely hidden |
| 2.4.12 Focus Not Obscured (Enhanced) | AAA | No part of focused element hidden (informational) |
| 2.4.13 Focus Appearance | AAA | Focus indicator size and contrast (informational) |
| 2.5.7 Dragging Movements | AA | Non-dragging alternatives for drag operations |
| 2.5.8 Target Size (Minimum) | AA | 24x24px minimum for interactive targets |
| 3.3.7 Redundant Entry | A | Auto-populate previously entered information |
| 3.3.8 Accessible Authentication (Minimum) | AA | No cognitive function tests for authentication |
| 3.3.9 Accessible Authentication (Enhanced) | AAA | Stricter auth requirement (informational) |

### Modified Success Criteria (NZ-Specific)

The NZ standard modifies two WCAG criteria beyond the standard wording:

**SC 1.2.4 — Captions (Live)**
- WCAG says: captions for all live audio
- NZ says: captions **should** be provided for all live audio, and **must** be provided
  if the content includes **high-stakes information** (see below)

**SC 1.2.5 — Audio Description (Prerecorded)**
- WCAG says: audio description for all prerecorded video
- NZ says: audio description **should** be provided for all prerecorded video content,
  and **must** be provided for video **published on or after 17 March 2025**

---

## High-Stakes Information

The NZ standard defines "high-stakes information" as content related to:

1. **Disability** — services, support, or rights for people with disabilities
2. **Emergency response** — civil defence, natural disasters, public safety
3. **Benefits and housing access** — welfare, housing assistance, social services
4. **Health services** — public health information, healthcare access
5. **Employment safety** — workplace health and safety, employment rights
6. **Criminal and civil proceedings** — court processes, legal rights
7. **Elections** — voting information, electoral processes
8. **Tax obligations** — tax filing, compliance requirements
9. **Public consultations** — consultations on policy and legislation

When reviewing Salesforce components that display or manage any of these content types,
apply the stricter "must" requirements for live captions and audio description.

---

## Web Usability Standard 1.4

Beyond accessibility, the NZ standards mandate usability requirements:

### Contact Information (Mandatory)

Every website must provide:
- A **daily-monitored email address** with 3 working day acknowledgement
- A **postal address**
- A **physical street address** (if one exists)
- A **telephone line**
- **Call centre numbers** (if applicable)
- A **link to the New Zealand Relay Service (NZ Relay)** for deaf or hard of hearing users

When reviewing Salesforce sites, communities, or Experience Cloud pages, verify that
contact pages or footer components include these elements.

### Privacy Statements (Mandatory)

Two distinct privacy statements are required:
1. **Organisation Privacy Statement** — how the organisation handles personal information
2. **Website Privacy Statement** — how the website specifically collects and uses data
   (cookies, analytics, form submissions)

### Non-HTML Link Labelling

Links to non-HTML resources (PDF, DOCX, XLSX, etc.) must include:
- The file **format** (e.g., "PDF", "Word document")
- The file **size** (e.g., "2.4 MB")

```html
<!-- Good -->
<a href="/report.pdf">Annual Report 2025 (PDF, 3.2 MB)</a>

<!-- Bad -->
<a href="/report.pdf">Annual Report 2025</a>
```

In Salesforce, check:
- `lightning-formatted-url` components linking to ContentVersion/ContentDocument files
- Custom download components in LWC
- Static resource links

### Printable Content

Main content must remain printable on A4 paper and include at least one instance of the
organisation's name or logo. Check for:
- Print stylesheets (`@media print`)
- Content not hidden by `display: none` in print context
- Navigation/chrome appropriately hidden in print view

---

## Scope and Applicability

### What's Covered

The standards apply to web pages an organisation is **"responsible for"**:
- **Publicly facing pages** — accessible to the general public
- **Internally facing pages** — employee-only intranets, internal tools

This means Salesforce components used in:
- Experience Cloud sites (public-facing)
- Internal Lightning apps and pages (internally facing)
- Custom Salesforce Sites

are ALL in scope.

### What's NOT Covered

- Merely **contributing content** to someone else's website does not trigger the requirements
- Third-party hosted content where the organisation has no editorial control

### Transition Period

- Standards effective: **17 March 2025**
- Audio description requirement applies to video **published on or after** 17 March 2025
- Existing video published before this date is encouraged but not mandated for audio description

---

## Review Checklist

When reviewing files before deployment, verify these NZ-specific requirements:

### For All Components
- [ ] WCAG 2.2 Level AA compliance (see `wcag-2-2-checklist.md`)
- [ ] Content language set to `en-NZ` (or appropriate language)

### For Media Components
- [ ] Prerecorded video has captions
- [ ] Prerecorded video (published after 17 March 2025) has audio description
- [ ] Live media with high-stakes information has live captions
- [ ] Audio-only content has transcripts

### For Experience Cloud / Salesforce Sites
- [ ] Contact information page includes all mandatory elements
- [ ] NZ Relay Service link present
- [ ] Organisation privacy statement linked and accessible
- [ ] Website privacy statement linked and accessible
- [ ] Print stylesheet tested on A4

### For File Downloads
- [ ] Links to non-HTML files include format and size
- [ ] File format and size are included in the link text itself, not just as hover text

### For Authentication Flows
- [ ] No cognitive function tests (puzzle CAPTCHAs, memory tests)
- [ ] Password paste/autofill not blocked
- [ ] SSO/biometric alternatives available where possible

### For Forms Spanning Multiple Pages
- [ ] Previously entered information is auto-populated or selectable
- [ ] Users are not asked to re-enter the same data across steps
