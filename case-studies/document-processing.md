# Document Processing — Case Study Notes

Last updated: 2026-05-18

Status: `drafting`

This is the single durable planning/source file for the Document Processing case study. It keeps notes, facts, draft direction, media guidance, and implementation reminders that should not live in the generated `content/` exports or the final HTML.

## Quick status

- Intended visibility: confirmed password-gated portfolio case study
- Public indexing: use `noindex,nofollow` if implemented
- Screenshot safety: needs confirmation from Vic
- Publish safety: visibility is confirmed, but screenshots, claims, and final wording still need review
- Current source material: restored 2026-05-11 handoff, tightened 2026-05-12, plus the working notes below

## Next action

Confirm the open claims/safety notes in this file, then decide whether to:

1. continue drafting only,
2. continue refining `document-processing.html` locally without pushing, or
3. pause until approved screenshots/assets are available.

## Do not do yet

- Do not push a live Document Processing page without Vic approval.
- Do not add a homepage card until Vic has an approved thumbnail/photo or explicitly approves a placeholder.
- Do not invent screenshots, image paths, metrics, or launch claims.

---

## Current Narrative + Implementation Notes

Status: working case-study narrative and implementation handoff. This is not published. Treat this as the current planning doc until `document-processing.html` exists and Vic approves it.

Source: restored from archived 2026-05-11 handoff and tightened on 2026-05-12. Original draft came from Vic’s Discord attachment and was described as a tighter second draft: more portfolio-facing, less internal product-spec.

## Recommendation

Build this as a **password-protected portfolio case study** after Vic confirms the open claims below. The strongest version is not a text dump; it should feel like a focused AI/workflow design story with a few lightweight visuals or placeholders.

Recommended path:

1. Confirm the few factual/ownership details in “Claims to confirm.”
2. Scaffold `document-processing.html` locally from an existing protected case-study page.
3. Add the polished narrative below with TODO media slots.
4. Keep the page local/committed until Vic says to push.

Do **not** push a text-only page live unless Vic explicitly says that is okay.

## Strongest story direction

**Thesis:** I designed the evaluation layer that helped builders understand, measure, and improve AI document extraction before trusting it in production.

This is a good portfolio story because it is not just “I designed AI screens.” It shows Vic working in the hard middle of enterprise AI UX: accuracy, trust, ground truth, iteration, and the bridge between technical evaluation and usable builder workflows.

Primary hiring signals:

- Can make complex AI systems understandable
- Can design for enterprise trust and risk
- Can turn technical concepts into usable workflows
- Can own an ambiguous product area independently
- Can think in loops/systems instead of isolated screens

Recommended category:

- **Primary:** Enterprise/platform UX
- **Secondary:** AI workflow design, UXE/prototyping-ready product design

## Target page

- Suggested file: `document-processing.html`
- Suggested public URL: `https://victortrandesign.com/document-processing`
- Suggested title: `Document Processing · Victor Tran Design`
- Suggested nav label: `Document Processing`
- Suggested project type label: `Product Design / AI Workflow Design`
- Protection: same password gate pattern as `pci.html`, `ibmcloud.html`, and `ibm-patterns.html`

## Source-of-truth / site conventions

Read first before implementation:

- `CLAUDE.md`
- `victor-tran-site.md`

Important conventions:

- Plain HTML / CSS / JS. No framework, no build step.
- Existing HTML pages are the source of truth for public portfolio content.
- Use the same `<nav>`, `.cursor-dot` / `.cursor-ring`, and `<footer>` blocks as existing pages.
- Case studies use:
  - `<header class="page-header">`
  - `<article class="case-study">`
  - section labels with `<p class="section-label label-default">`
- Use existing image patterns:
  - `.case-study-full-img`
  - `.case-study-images.wide`
- After editing page content, run:

```bash
node scripts/html-to-md.mjs
```

## Password protection instructions

Use the same password-gate setup as protected pages.

In the `<head>` of `document-processing.html`, include:

```html
<!-- password gate -->
<meta name="robots" content="noindex,nofollow">
<script>if(sessionStorage.getItem('vtd-unlock')!=='ok'){document.documentElement.classList.add('locked');}</script>
<link rel="stylesheet" href="css/password-gate.css">
<script src="js/password-gate.js" defer></script>
```

Notes:

- This is client-side portfolio gating, not true security.
- Keep `meta name="robots" content="noindex,nofollow"` because this should not be indexed.
- Do not duplicate or alter the password hash unless Vic asks.

## Proposed page copy

### Hero

**Eyebrow:** Product Design / AI Workflow Design

**Title:** Designing the trust layer for AI document processing

**Deck:** Watson Orchestrate’s document processing capabilities helped teams automate work across business documents like invoices, purchase orders, bills of lading, and utility bills. I contributed to the broader classifier and extractor experiences, then owned Accuracy Evaluation: a workflow for helping builders test extraction quality against ground truth, understand where automation was reliable, and improve document schemas before deployment.

**Meta:**

- Role: Lead designer for Accuracy Evaluation; contributor across shipped classifier and extractor experiences
- Product/context: Watson Orchestrate document processing
- Focus: AI document extraction, ground truth, evaluation metrics, schema improvement, builder workflows
- Tools/system: Carbon-aligned product design

**Media placeholder:** Hero image or abstract workflow visual showing document input → extraction → evaluation → improvement. Avoid inventing screenshots.

### Overview

Watson Orchestrate’s document processing capabilities helped teams automate work across business documents like invoices, purchase orders, bills of lading, and utility bills.

I contributed to the broader classifier and extractor experiences, helping shape how builders configured document workflows, selected schemas, and worked with AI-generated extraction results.

But the most important question came after extraction:

**How do builders know if the AI is accurate enough to trust?**

That became the focus of Accuracy Evaluation, a workflow I owned as the lead designer. The goal was to help builders test extraction quality against ground truth, understand where automation was reliable, and improve their document schemas before deploying workflows at scale.

### The problem — AI extraction was useful, but hard to validate

Document extraction could identify fields, pull values, and support automation. But for enterprise teams, “it worked on a few examples” was not enough.

Builders needed to answer questions like:

- How accurate is this extractor across a real test set?
- Which fields are reliable?
- Which fields keep failing?
- Are schema changes improving results?
- Is this workflow ready for production?

Without a structured evaluation workflow, teams had to rely on small manual spot-checks and subjective confidence. That made it difficult to responsibly scale document automation.

The problem was not just extracting data. It was making extraction quality measurable, explainable, and improvable.

**Media placeholder:** A simple “before” diagram or callout: informal spot-checking → no clear readiness signal → risky production confidence.

### Platform context — classifier and extractor work

Before leading Accuracy Evaluation, I tag-teamed work across the shipped document classifier and extractor experiences.

That work included:

- document classification flows
- schema-based extraction patterns
- confidence thresholds
- builder configuration experiences
- alignment with the newer agent model
- Carbon and visual consistency across related document processing work

This gave me a working understanding of the system: how builders created extractors, how document types shaped schemas, how AI confidence surfaced, and where the experience broke down between testing and deployment.

With classifier and extractor shipped, Accuracy Evaluation became the missing loop.

### My role — lead designer for Accuracy Evaluation

For Accuracy Evaluation, I led the design direction for the Accuracy Evaluation experience.

My role was to define how builders could move from informal testing to a repeatable evaluation workflow:

- prepare a representative test set
- create or import ground truth
- run an evaluation
- review overall and field-level accuracy
- identify weak spots
- adjust schema definitions
- rerun evaluation and compare results

The design needed to serve technical accuracy goals while still feeling usable to builders who were configuring workflows, not performing data science.

**Note for Vic:** This section is strong, but “lead designer” and “led independently” should be confirmed before publishing.

### The design approach — turning evaluation into an iteration loop

The workflow centered around a simple quality loop:

**test set → ground truth → evaluation → metrics → schema improvement → rerun**

Instead of treating accuracy as a static score, the design framed evaluation as part of the builder’s iteration process.

A builder could upload a larger set of documents, confirm the expected values, run the extractor, and compare the AI output against ground truth. From there, they could inspect weak fields, understand where extraction failed, and make targeted schema changes.

The goal was not just to show whether an extractor passed or failed. It was to help builders understand what to improve next.

**Media placeholder:** This section wants the main diagram: `test set → ground truth → evaluation → metrics → schema improvement → rerun`.

### Key design decisions

#### Make metrics actionable

Accuracy, precision, recall, and F1 score are useful, but they can quickly become abstract.

The design needed to translate those metrics into builder-friendly signals:

- what changed
- what failed
- which fields need attention
- which documents are causing issues
- whether the extractor is improving over time

The priority was clarity over dashboard complexity.

#### Reuse familiar review patterns

Ground truth creation could have become a completely separate experience. Instead, the direction reused familiar review patterns from human-in-the-loop document review.

That kept the experience connected to the broader platform and reduced the amount of new behavior builders had to learn.

#### Connect failures back to schema changes

The evaluation workflow was only useful if builders could act on it.

When a field performed poorly, the experience needed to help builders connect that result back to the schema: field names, descriptions, examples, document variation, or model behavior.

The design framed evaluation as a bridge between AI output and better configuration.

#### Design for uncertainty

AI document processing will always have edge cases. The experience could not imply perfect automation.

Instead, the design made uncertainty visible and manageable. Builders could see where the system performed well, where it struggled, and what needed human attention before production use.

**Media placeholder:** If screenshots exist, use one annotated UI detail here instead of a giant gallery. Show one decision deeply.

### Outcome — a measurable quality loop for document automation

Accuracy Evaluation is planned to release this summer and defines a design direction for making document extraction quality easier to measure and improve.

It connected the broader document processing platform into a clearer loop:

**classify → extract → review → evaluate → improve**

For builders, this created a path from “the AI extracted something” to “I understand how well it performs, where it fails, and what I can do next.”

For the platform, it helped frame document processing as a more trustworthy enterprise workflow: configurable, reviewable, and measurable.

**Note for Vic:** If this shipped, influenced roadmap, or was handed off to engineering, add one concrete sentence here. If not, keep this as “defined a design direction” to avoid overclaiming.

### What this project shows

This project shows my ability to design inside complex AI product systems where trust depends on more than a polished interface.

It reflects my strengths in:

- AI product UX
- enterprise workflow design
- builder tools
- systems thinking
- Carbon-aligned product design
- translating technical concepts into usable workflows
- owning an ambiguous product area independently

## Recommended page structure

Use this order for implementation:

1. Hero / overview
2. Problem
3. Platform context
4. Role
5. Design approach / iteration loop
6. Key design decisions
7. Outcome
8. What this project shows

This is tighter than a generic problem → process → solution → impact flow because the project’s real story is the **evaluation loop**.

## Media guidance

Add imagery later. Strongest candidates:

- Hero visual: final Document Processing UI, workflow mockup, or abstract diagram.
- Before/after: informal spot-checking vs structured evaluation loop.
- Flow diagram: classify → extract → review → evaluate → improve.
- Prototype clip/GIF: running an evaluation or reviewing weak fields.
- Annotated UI: field-level metrics or failure-to-schema improvement moment.
- System/detail shot: component states, empty/loading/error, confidence, review controls.

Implementation note: create placeholder blocks in `document-processing.html` with comments like:

```html
<!-- TODO: Replace with Document Processing hero image once selected. -->
```

Do not invent image paths.

## Confirmed details from Vic

- Public project/page name: `Document Processing`.
- Classifier and extractor are fully shipped.
- Accuracy Evaluation is planned to come out this summer.
- Vic was the lead designer on the Accuracy Evaluation experience.
- If this appears on the homepage, it should sit above IBM Cloud, but wait for a suitable photo/thumbnail before adding the homepage card.

## Still confirm before publishing

- Any measurable impact or concrete outcome that can be safely mentioned.
- Any confidentiality constraints.
- Vic confirmed the screens he provides for this case study will be okay for release.
- Keep the password gate on Document Processing.
- Whether “newer agent model” is safe/public language.

## Implementation plan for Claude Code

1. Create `document-processing.html` by copying the structure from an existing protected case study, preferably `ibm-patterns.html` for a product/UX-heavy story.
2. Update all metadata:
   - `<title>`
   - meta description
   - canonical URL
   - Open Graph title/description/url
   - active nav state
3. Add `Document Processing` to the Work dropdown nav on relevant pages, above IBM Cloud Observability. Follow existing nav ordering.
4. Add the password-gate head block.
5. Add the proposed page copy above.
6. Add placeholder media blocks where visuals will go later. Use comments/TODOs instead of inventing assets.
7. Add a featured card on `index.html` above IBM Cloud only once Vic has a suitable thumbnail/photo. Until then, avoid a homepage card or use a clearly intentional placeholder only if Vic approves.
8. Run:

```bash
node scripts/html-to-md.mjs
```

9. Verify:
   - `document-processing.html` loads locally.
   - Password overlay appears in a fresh session.
   - Correct password unlocks the page.
   - Nav links work.
   - Generated `content/document-processing.md` and `content/site-index.json` update correctly.
10. Commit changes only after Vic approves the implementation direction. Push only if Vic confirms the page should go live.

## Suggested homepage/card copy, if featured later

**Title:** Document Processing

**Description:** Designing an evaluation workflow that helped builders measure, understand, and improve AI document extraction before trusting it in production.

**Category:** Product Design / AI Workflow Design

**Thumbnail:** TODO — add later.

## Review checklist for Vic

Before implementation/publishing, confirm:

- [ ] Exact public project name and product label.
- [ ] Whether the work shipped, prototyped, or stayed exploratory.
- [ ] Role/ownership wording is accurate.
- [x] Password-protected page is acceptable for this work.
- [ ] Whether it should be linked from homepage now or only available through nav/direct URL.
- [ ] Any imagery that should be included immediately.
- [ ] Whether Claude Code should commit only, or commit + push.
