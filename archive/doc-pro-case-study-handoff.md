# Doc Pro Case Study — Claude Code Handoff

Status: implementation handoff scaffold. Final case-study copy still needs to be pasted/confirmed before implementation.

## Recommendation

Implement this as a new password-protected portfolio case study page once the final copy is ready. The current website already has a reusable client-side password gate on protected case studies, so Claude Code can scaffold the page from an existing protected case study and add imagery later.

Do **not** push a text-only page live unless Vic explicitly confirms it is okay to publish as a draft. Better default: prepare the page locally, add placeholders for imagery, then ship when visuals are selected.

## Target page

- Suggested file: `doc-pro.html`
- Suggested public URL: `https://victortrandesign.com/doc-pro`
- Suggested title: `Doc Pro · Victor Tran Design`
- Suggested nav label: `Doc Pro`
- Suggested project type label: `Product Design / UXE` or `AI Workflow Design` — confirm based on final narrative.
- Protection: same password gate pattern as `pci.html`, `ibmcloud.html`, and `ibm-patterns.html`.

## Source of truth / site conventions

Read these first:

- `CLAUDE.md`
- `victor-tran-site.md`

Important conventions from the site docs:

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

In the `<head>` of `doc-pro.html`, include:

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

## Implementation plan for Claude Code

1. Create `doc-pro.html` by copying the structure from an existing protected case study, preferably `ibm-patterns.html` if the story is product/UX heavy, or `pci.html` if the page should be simpler.
2. Update all metadata:
   - `<title>`
   - meta description
   - canonical URL
   - Open Graph title/description/url
   - active nav state
3. Add `Doc Pro` to the Work dropdown nav on every relevant page, or at minimum on `index.html` and all case study pages. Follow the existing nav ordering.
4. Add the password-gate head block.
5. Add the case study copy from the section below.
6. Add placeholder image blocks where media will go later. Use comments/TODOs instead of inventing assets.
7. Optionally add a featured card on `index.html` only if Vic wants Doc Pro visible from the homepage.
8. Run:

```bash
node scripts/html-to-md.mjs
```

9. Verify:
   - `doc-pro.html` loads locally.
   - Password overlay appears in a fresh session.
   - Correct password unlocks the page.
   - Nav links work.
   - Generated `content/doc-pro.md` and `content/site-index.json` update correctly.
10. Commit changes, but only push if Vic confirms the page should go live.

## Draft page structure

Use this structure unless the final copy suggests a stronger one:

1. Hero / overview
2. Project context
3. The problem
4. Role and constraints
5. Approach
6. Key design decisions
7. Solution
8. Outcome / impact
9. Reflection / what this shows

## Final / proposed page copy

Source note: pasted from Vic's Discord attachment on 2026-05-11. Described as “a tighter second draft — more portfolio-facing, less internal product-spec.”

### Hero

**Eyebrow:** Product Design / AI Workflow Design

**Title:** Designing the trust layer for AI document processing

**Deck:** Watson Orchestrate’s document processing capabilities helped teams automate work across business documents like invoices, purchase orders, bills of lading, and utility bills. I contributed to the broader classifier and extractor experiences, then owned Accuracy Evaluation: a workflow for helping builders test extraction quality against ground truth, understand where automation was reliable, and improve document schemas before deployment.

**Meta:**

- Role: Solo designer for Accuracy Evaluation; contributor across classifier and extractor experiences
- Product/context: Watson Orchestrate document processing
- Focus: AI document extraction, ground truth, evaluation metrics, schema improvement, builder workflows
- Tools/system: Carbon-aligned product design

### Overview

Watson Orchestrate’s document processing capabilities helped teams automate work across business documents like invoices, purchase orders, bills of lading, and utility bills.

I contributed to the broader classifier and extractor experiences, helping shape how builders configured document workflows, selected schemas, and worked with AI-generated extraction results.

But the most important question came after extraction:

**How do builders know if the AI is accurate enough to trust?**

That became the focus of Accuracy Evaluation, a workflow I owned as the solo designer. The goal was to help builders test extraction quality against ground truth, understand where automation was reliable, and improve their document schemas before deploying workflows at scale.

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

### Platform context — classifier and extractor work

Before owning Accuracy Evaluation, I tag-teamed work across the document classifier and extractor experiences.

That work included:

- document classification flows
- schema-based extraction patterns
- confidence thresholds
- builder configuration experiences
- alignment with the newer agent model
- Carbon and visual consistency across related document processing work

This gave me a strong understanding of the system: how builders created extractors, how document types shaped schemas, how AI confidence surfaced, and where the experience broke down between testing and deployment.

Accuracy Evaluation became the missing loop.

### My role — solo designer for Accuracy Evaluation

For Accuracy Evaluation, I led the design direction independently.

My role was to define how builders could move from informal testing to a repeatable evaluation workflow:

- prepare a representative test set
- create or import ground truth
- run an evaluation
- review overall and field-level accuracy
- identify weak spots
- adjust schema definitions
- rerun evaluation and compare results

The design needed to serve technical accuracy goals while still feeling usable to builders who were configuring workflows, not performing data science.

### The design approach — turning evaluation into an iteration loop

The workflow centered around a simple quality loop:

**test set → ground truth → evaluation → metrics → schema improvement → rerun**

Instead of treating accuracy as a static score, the design framed evaluation as part of the builder’s iteration process.

A builder could upload a larger set of documents, confirm the expected values, run the extractor, and compare the AI output against ground truth. From there, they could inspect weak fields, understand where extraction failed, and make targeted schema changes.

The goal was not just to show whether an extractor passed or failed. It was to help builders understand what to improve next.

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

### Outcome — a measurable quality loop for document automation

Accuracy Evaluation defined a design direction for making document extraction quality easier to measure and improve.

It connected the broader document processing platform into a clearer loop:

**classify → extract → review → evaluate → improve**

For builders, this created a path from “the AI extracted something” to “I understand how well it performs, where it fails, and what I can do next.”

For the platform, it helped frame document processing as a more trustworthy enterprise workflow: configurable, reviewable, and measurable.

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

The core story:

**I designed the evaluation layer that helped builders understand, measure, and improve AI document extraction before trusting it in production.**

## Media placeholders

Add imagery later. Good candidates:

- Hero visual: final Doc Pro UI or polished workflow mockup.
- Before/after: old workflow vs proposed Doc Pro flow.
- Flow diagram: document ingestion → processing → review → output.
- Prototype clip/GIF: key interaction or state transition.
- Annotated UI: explain one important design decision.
- System/detail shot: component states, empty/loading/error, AI confidence, review controls, etc.

Implementation note: create placeholder blocks in `doc-pro.html` with comments like:

```html
<!-- TODO: Replace with Doc Pro hero image once selected. -->
```

Do not invent image paths.

## Claims to confirm before publishing

- Exact project name: `Doc Pro`, `DocPro`, or another official spelling.
- Company/team/context.
- Whether the work shipped, prototyped, or remained exploratory.
- Vic’s exact role and ownership.
- Any measurable impact.
- Any confidentiality constraints.
- Whether screenshots can be public behind the client-side password gate.

## Suggested homepage/card copy, if featured later

**Title:** Doc Pro

**Description:** TODO — concise one-line description after final case study copy is confirmed.

**Category:** Product Design / UXE

**Thumbnail:** TODO — add later.

## Review checklist for Vic

Before asking Claude Code to implement, confirm:

- [ ] Final copy is pasted above.
- [ ] Password-protected page is acceptable for this work.
- [ ] Whether it should be linked from homepage now or only accessible by direct/nav link.
- [ ] Any imagery that should be included immediately.
- [ ] Whether Claude Code should commit only or commit + push.
