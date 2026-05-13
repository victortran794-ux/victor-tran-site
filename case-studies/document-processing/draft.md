# Document Processing — Draft

## Thesis

I designed the evaluation layer that helped builders understand, measure, and improve AI document extraction before trusting it in production.

## Why this story works

This is not just “AI screens.” It shows enterprise AI UX in the hard middle: accuracy, trust, ground truth, iteration, and translating technical evaluation into usable builder workflows.

## Primary hiring signals

- Can make complex AI systems understandable
- Can design for enterprise trust and risk
- Can turn technical concepts into usable workflows
- Can own an ambiguous product area independently
- Can think in loops/systems instead of isolated screens

## Recommended category

- Primary: Enterprise/platform UX
- Secondary: AI workflow design, UXE/prototyping-ready product design

## Structure

1. Hero / overview
2. Problem — AI extraction was useful, but hard to validate
3. Platform context — classifier and extractor work
4. Role — lead designer for Accuracy Evaluation
5. Design approach — evaluation as an iteration loop
6. Key design decisions
7. Outcome
8. What this project shows

## Core loop

`test set → ground truth → evaluation → metrics → schema improvement → rerun`

Broader platform loop:

`classify → extract → review → evaluate → improve`

## Current hero direction

Eyebrow: Product Design / AI Workflow Design

Title: Designing the trust layer for AI document processing

Deck direction: Watson Orchestrate’s document processing capabilities helped teams automate work across business documents. Vic contributed to classifier and extractor experiences, then led Accuracy Evaluation: a workflow for testing extraction quality against ground truth, understanding reliability, and improving schemas before deployment.

## Rewrite notes for next pass

- Keep the thesis specific and grounded.
- Emphasize the evaluation loop, not generic AI excitement.
- Avoid unsupported impact claims.
- Keep “planned to release this summer” unless status changes.
- Make the project feel like enterprise trust/workflow design, not a dashboard case study.

## Media plan

Screenshot safety is not confirmed. Treat all real UI/screenshots as unsafe until Vic says otherwise.

Options if real screens are risky:

- Redacted UI crops
- Recreated abstract diagrams
- Placeholder workflow visuals
- Annotated conceptual flows
- Blurred or simplified screenshots

Strong media candidates:

- Hero visual: final Document Processing UI, workflow mockup, or abstract diagram.
- Before/after: informal spot-checking vs structured evaluation loop.
- Flow diagram: classify → extract → review → evaluate → improve.
- Prototype clip/GIF: running an evaluation or reviewing weak fields.
- Annotated UI: field-level metrics or failure-to-schema improvement moment.
- System/detail shot: component states, empty/loading/error, confidence, review controls.

## Implementation notes

Suggested target:

- File: `document-processing.html`
- URL: `https://victortrandesign.com/document-processing`
- Title: `Document Processing · Victor Tran Design`
- Nav label: `Document Processing`
- Project type label: `Product Design / AI Workflow Design`
- Protection: same password gate pattern as `pci.html`, `ibmcloud.html`, and `ibm-patterns.html`

Read first:

- `CLAUDE.md`
- `victor-tran-site.md`
- `PORTFOLIO_SYSTEM.md`
- `PORTFOLIO_STATUS.md`
- `case-studies/document-processing/status.md`

Password gate head block:

```html
<!-- password gate -->
<meta name="robots" content="noindex,nofollow">
<script>if(sessionStorage.getItem('vtd-unlock')!=='ok'){document.documentElement.classList.add('locked');}</script>
<link rel="stylesheet" href="css/password-gate.css">
<script src="js/password-gate.js" defer></script>
```

Implementation checklist:

1. Confirm Vic wants local implementation work to begin.
2. Copy structure from an existing protected case study, preferably `ibm-patterns.html`.
3. Update metadata and active nav state.
4. Add `Document Processing` to Work dropdown nav where appropriate, above IBM Cloud Observability.
5. Add password gate head block.
6. Add draft copy from `document-processing-case-study-current-notes.md` or this file after a fresh writing pass.
7. Add placeholder media blocks with TODO comments; do not invent image paths.
8. Run `node scripts/html-to-md.mjs` after content changes.
9. Verify page load, password gate, nav links, and generated content.
10. Commit only after Vic approves. Push only if Vic confirms it should go live.
