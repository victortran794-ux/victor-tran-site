# Portfolio Design Critique Rubric

Status: Active review standard for bounded portfolio redesign sprints

Use this rubric at two separate gates: before implementation to review structural direction, and after implementation to review rendered pages. The implementer must not be the sole approver.

## Review inputs

The reviewer receives:

- the sprint brief and exact two-page scope;
- current-page baselines;
- project manifests, approved source boundaries, and claims/privacy rules;
- annotated references with explicit `use` and `do not copy` notes;
- the selected structural direction;
- current screenshots or renders appropriate to the gate;
- the bounded diff or complete private artifact set.

## Direction review

Review each page for:

1. **Positioning and hiring signal** — The page supports Victor Tran as a senior visual/product designer who clarifies complex systems, creates scalable patterns, and balances visual craft with enterprise product thinking.
2. **Reader takeaway** — A recruiter can identify the project, Victor's contribution, and the central value within the opening movement.
3. **Narrative hierarchy** — Context, contribution, evidence, and reflection appear in an intentional order rather than as a feature inventory.
4. **Evidence roles** — Every major artifact has one role: hero, chapter anchor, supporting evidence, process evidence, compact note, or withheld source.
5. **Project-specific identity** — Composition comes from the project's evidence and character rather than a reusable visual skin.
6. **Structural originality** — The direction avoids oversized centered hero copy, repetitive equal cards, pill clusters, uniform three-column grids, fake dashboards, generic gradients, and purposeless decoration.
7. **Mobile story order** — Narrow-screen sequencing is intentional and preserves the story rather than merely stacking the desktop layout.
8. **System relationship** — The direction states what it reuses, adapts, or deliberately treats as a page-specific exception.
9. **Truth boundary** — Claims, roles, dates, outcomes, metrics, testimonials, and historical/present-day distinctions are source-backed and correctly qualified.

The direction gate passes only after Victor selects one proposition or a deliberate hybrid. A hybrid must name which structural ideas it combines and why.

## Rendered review

Review final desktop, tablet, and exact-mobile evidence for:

1. **Hierarchy** — The most important idea is visually dominant; captions, provenance, and controls remain subordinate.
2. **Typography** — Scale, line length, contrast, wrapping, metadata, and chapter spacing support long-form reading.
3. **Composition** — Alignment, asymmetry, whitespace, image scale, and section transitions feel authored rather than templated.
4. **Storytelling** — Visual evidence advances the narrative; no section exists only to make the page longer or more impressive.
5. **Artifact presentation** — Source ratios, crops, captions, enclosures, interaction, and provenance preserve the artifact's meaning.
6. **Responsiveness** — Desktop `1440 × 1000`, tablet `768 × 1024`, and exact mobile `390 × 844` are deliberately composed with no accidental overflow, clipping, or unreadable evidence.
7. **Originality** — The implementation still expresses the selected direction and has not drifted into generic portfolio or AI-generated visual conventions.
8. **System consistency** — Shared shell, tokens, controls, accessibility, and behavior remain coherent while page-specific visuals retain their own identity.
9. **Accessibility and interaction** — Keyboard, focus, touch targets, reduced motion, alternatives, controls, and state announcements are honest and usable.
10. **Factual integrity** — No implementation copy or visual implication expands claims, ownership, publication rights, or production status.

## Finding severity

- **Blocker** — Privacy or rights breach; false or unsupported claim; broken essential interaction; inaccessible essential content; missing required source; severe responsive failure; unintended production, gate, indexing, sitemap, navigation, or deployment change.
- **High impact** — Unclear story; weak hierarchy; generic composition; missing or misassigned evidence; poor mobile sequence; implementation no longer matches the selected direction.
- **Refinement** — Small spacing, typography, caption, wording, or optical issue that does not undermine the page.
- **Deferred** — Useful improvement outside the two-page sprint contract. Record it; do not implement it in the active sprint.

## Review verdict

The reviewer returns:

- `PASS`, `PASS WITH REFINEMENTS`, or `FAIL`;
- findings grouped by severity;
- page and viewport affected;
- evidence for each finding;
- whether the finding requires a fix, Victor decision, or deferral.

A fresh rendered review is required after blocker or high-impact corrections. Objective QA passing does not approve the design direction, and visual approval does not replace source, privacy, accessibility, or runtime verification.
