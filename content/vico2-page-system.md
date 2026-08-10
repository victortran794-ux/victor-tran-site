# VicO2 Page System

## Authority and purpose

This document records the reusable page anatomy that is visibly proven in the production portfolio. It is an implementation inventory, not a mandate to make every project look alike.

VicO2 separates two layers:

- **Carbon structure:** accessible behavior, responsive geometry, semantic hierarchy, shared facts, and reliable transitions.
- **Victor-led expression:** project color, image rhythm, typography moments, archive density, diagrams, and authored irregularity.

A pattern enters the shared system only when it is already used by at least two real pages, or when a second approved page has a confirmed need. Candidate CSS does not count as a component by itself.

## Shared shell

The generated site shell is the broadest reusable system. It owns:

- primary navigation and Work disclosure behavior;
- desktop icon-only Light/Dark controls with accessible names and tooltips;
- mobile Light/Dark controls with visible labels;
- skip link and main focus target;
- footer contact hierarchy and direct email action;
- route-aware current-page state.

The shell is generated from `data/site-shell.json` by `scripts/generate-site-shell.mjs`. Individual pages do not hand-edit generated shell fences.

## Editorial opener

The optional straight case-study opener uses:

- `.page-header`;
- `.page-header-title`;
- `.page-header-desc`;
- optional `.case-study-meta` immediately after the opening.

This anatomy is proven on Document Processing, IBM Cloud, PCI, and IBM watsonx Orchestrate. It is a useful default for direct product and client stories. It is not required for Star & Lamp, Ability Experience, Pi Kapp, Art & Illustration, or Graphic Design.

## Project metadata

`.case-study-meta` and `.case-study-meta-item` form the shared project-facts pattern. The semantic source is a `<dl>` whose items describe facts such as role, client, year, or project type.

Rules:

- factual labels stay concise;
- values remain readable without decorative context;
- mobile collapse preserves definition-list reading order;
- protected or withheld facts use direct text, never blur alone.

## Project transition

`.project-nav` and `.project-nav-item` form the proven previous/next transition pattern across project pages.

Rules:

- navigation order follows the canonical project manifest;
- visible previous/next language and accessible destinations agree;
- gallery routes remain outside the primary case-study transition sequence;
- protected destinations retain their existing route and gate behavior.

## Archive-field family

Art & Illustration and Graphic Design share an archive-field family:

- chapter-led browsing;
- media-first groupings;
- restrained labels;
- project-native color and typography;
- a shared lightbox behavior where applicable.

This is a paired visual-archive system, not a universal case-study template. Art keeps its warm, artwork-first field. Graphic Design keeps its violet, pink, acid-yellow, and cream contact-sheet identity.

## Media motion controls

The `.media-motion-toggle` primitive is shared by two live motion presentations: the Horned Woman slideshow in Art & Illustration and the scrolling historical deliverable on IBM Patterns.

The shared layer owns only the proven control anatomy:

- a consistent 12px bottom/end inset inside the media frame;
- a stable 72 × 44px minimum control size;
- centered Pause/Play labels and button semantics;
- page-level color, typography, focus treatment, and motion behavior remain project-native.

Slideshow cadence is configured per instance rather than imposed globally. The Horned Woman series advances every two seconds, while IBM Patterns retains its slower presentation pan. Both controls preserve pause/resume state, page-visibility handling, and reduced-motion behavior appropriate to their media type.

## Workflow-story family

IBM watsonx Orchestrate and Document Processing share a bounded workflow-story family through `css/wxo-workflows-vico2.css` and `js/wxo-workflows-vico2.js`.

The shared layer supports:

- chapter anatomy;
- workflow and decision sequences;
- responsive collapse;
- Light/Dark behavior;
- keyboard and focus contracts where controls are interactive.

The family remains scoped to related product-system stories. It does not authorize generic cards or invented product behavior.

## Project-native variants

Project-native variants are first-class system decisions:

- **Star & Lamp:** editorial publication rhythm and spread-led evidence.
- **Ability Experience:** identity-system sequence and project-specific diagram language.
- **Pi Kapp App:** deep blue, gold star, and white shield language.
- **Art & Illustration:** artwork-first field with minimal framing.
- **Graphic Design:** colorful contact-sheet and campaign archive language.
- **IBM work:** project-specific structural language with explicit privacy, provenance, and claim boundaries.
- **Home:** asymmetric project cards and the portrait-lens Design DNA portal.

A native variant is not technical debt merely because another page uses different anatomy. Consolidation is justified only when shared structure is already visible in real content.

## Live shared inventory

The production-backed shared inventory is:

- generated shared shell;
- section labels and mono kickers;
- optional editorial opener;
- project metadata;
- project transitions;
- Archive-field family;
- Media motion controls;
- Workflow-story family.

Home's `.featured-item*` anatomy remains a one-page composition. It should not be promoted into a universal project card without a second real-page need.

## Dormant and deferred candidates

The following selectors or concepts may exist in CSS or documentation, but they are not current production-backed shared components:

- `gallery-section-label`;
- `stat-grid` / `stat-card`;
- `callout-card`;
- `screen-frame`;
- `color-punct-card`.

They remain dormant candidates until an approved page demonstrates a real need. Do not invent usage to satisfy a reuse count.

The following anatomy contracts remain deferred until a real content lane requires them:

- artifact or process evidence;
- media provenance and evidence state;
- accessible technical relationship diagram;
- protected-page gate anatomy beyond the existing route-specific implementation.

## Adoption and verification contract

A new shared primitive must satisfy all of these conditions:

1. It appears on at least two real pages, or has an approved second-page need.
2. It preserves project-native variants rather than flattening them.
3. It defines Light/Dark behavior.
4. It defines exact-mobile behavior and zero root overflow.
5. It defines keyboard, focus, and reduced-motion behavior where relevant.
6. It preserves decoded-media, privacy, route, and generated-output contracts.
7. It is added to `content/design-system.md`, `content/design-system.json`, and the Design DNA overlay only after the implementation is live.

The Design DNA overlay may present this inventory as evidence. It must not turn dormant candidates or DNA-only samples into fictional production components.
