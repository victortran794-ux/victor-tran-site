# Document Processing — Case Study Notes

Last updated: 2026-06-02

Status: `live`

This is the durable package manifest for the live Document Processing case study. It keeps notes, facts, narrative direction, media guidance, redesign notes, and implementation reminders that should not live in the generated `content/` exports or the final HTML.

## Quick status

- Intended visibility: live password-protected portfolio case study
- Public indexing: keep `noindex,nofollow`
- Current publication state: live/protected is acceptable as-is; the password gate is the visitor-privacy layer, not an unresolved launch blocker
- Screenshot/media safety: use the consolidated Claude Code + Figma media-audit handoff before adding or replacing visuals: `C:\Users\Victor\Documents\Website Items\Portfolio Handoffs\Document Processing\document-processing-claude-code-figma-media-audit-consolidated-2026-06-02.md`
- Change safety: preserve the gate and current navigation visibility; do not add homepage/sitemap promotion, screenshots, metrics, launch claims, or major copy changes without Vic approval
- Package model: source page `document-processing.html`, generated export `content/document-processing.md`, package manifest `case-studies/document-processing.md`, historical source notes in `archive/doc-pro-case-study-handoff.md`, and private media-audit source material in the PC-side Website Items folder
- Current source material: restored 2026-05-11 handoff, tightened 2026-05-12, plus the working notes below

## Next action

Keep the live password-protected page stable unless Vic asks for a refinement pass. If revisiting the package, focus on one clearly approved scope at a time: copy polish, media replacement, claim verification, or visibility changes. Use the consolidated Claude Code + Figma media-audit handoff as source material before changing visuals or claims, with Hermes reviewing any agent output before implementation.

## Do not do without explicit approval

- Do not remove or weaken the password gate or `noindex,nofollow`.
- Do not add a homepage card, sitemap entry, or change navigation visibility until Vic asks.
- Do not invent screenshots, image paths, metrics, launch claims, or new final wording.
- Do not treat the mere existence of the live protected route as a problem; the current protected live state is acceptable.

---

## Current Narrative + Implementation Notes

Status: working case-study narrative and implementation handoff for a live protected page. Treat this as the planning/source doc for future refinements; `document-processing.html` is the implemented page.

Source: restored from archived 2026-05-11 handoff and tightened on 2026-05-12. Original draft came from Vic’s Discord attachment and was described as a tighter second draft: more portfolio-facing, less internal product-spec.

## Recommendation

Keep this as a **password-protected portfolio case study**. Vic is comfortable with the current live protected state; future work should improve the story/media without changing visibility unless explicitly requested.

Recommended path:

1. Preserve the current live password-gated/noindex route.
2. Confirm any new factual/ownership details before changing claims.
3. Replace placeholders or add media only with approved safe assets.
4. Keep homepage/sitemap promotion and navigation visibility changes separate from content refinement and only do them if Vic asks.

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

**Note for Vic:** This section is strong, but “lead designer” and “led independently” should be confirmed before any future claim/copy refinement.

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

## Still confirm before future refinements

The page may remain live in its current password-gated/noindex state. Confirm these only before changing the relevant content or promotion:

- Any measurable impact or concrete outcome that can be safely mentioned.
- Any additional confidentiality constraints beyond the current password-gated/noindex setup.
- Which screens, diagrams, or media are safe to add or replace.
- Whether “newer agent model” is safe/public language.
- Whether to promote the page in homepage, navigation, or sitemap. Default: do not promote.

## Future refinement plan for Claude Code / Codex

1. Preserve the existing `document-processing.html` implementation, password gate, and `noindex,nofollow` metadata.
2. Treat `document-processing.html` as the implemented page and this file as planning/source context.
3. Scope future work narrowly: copy polish, approved media replacement, claim verification, or optional promotion should be separate tasks.
4. Do not add `Document Processing` to the Work dropdown, homepage, or sitemap unless Vic explicitly asks.
5. Do not invent assets, metrics, dates, launch claims, or new final wording.
6. After page copy changes, run:

```bash
node scripts/html-to-md.mjs
```

7. Verify:
   - `document-processing.html` loads locally.
   - Password overlay appears in a fresh session.
   - Correct password unlocks the page.
   - The route remains omitted from the sitemap unless promotion is approved.
   - Generated `content/document-processing.md` and `content/site-index.json` update correctly when copy changes.
8. Commit/push only after Vic approves the specific task and review path.

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
