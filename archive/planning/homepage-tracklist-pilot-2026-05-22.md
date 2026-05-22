# Homepage Tracklist Pilot

Date: 2026-05-22
Status: local design pilot
Scope: one small public homepage treatment

## Goal

Test the “homepage as curated sequence” idea without turning the full homepage into a literal album or playlist interface.

The intended effect is:

- give the work grid a stronger editorial entrance;
- borrow tracklist behavior lightly through numbering and sequencing;
- keep the existing project cards and homepage hierarchy intact;
- avoid adding motion, filters, or complex state until the visual cue is approved.

## Implemented pilot

Public page: `index.html`

Implemented:

1. Added a compact `Now playing` intro above the featured-project grid.
2. Added a three-line numbered sequence:
   - `01` Systems at scale
   - `02` Brand and publication worlds
   - `03` Illustration and visual experiments
3. Styled the sequence as quiet mono tracklist rows with pink numbering and neutral rules.
4. Kept all featured-project cards, links, nav, and visibility rules unchanged.

## Design rules tested

- Tracklist cues should be structural, not decorative clutter.
- One numbered sequence is enough for the first pilot.
- The homepage should still feel editorial and personal, not like a dashboard.
- Copy is provisional and can be adjusted later without changing the component structure.

## Review checklist

Manual review:

- Homepage Light mode.
- Homepage Dark mode.
- Mobile width around the new featured intro.
- Confirm the existing hero, marquee, and featured cards still feel unchanged.

Commands:

```bash
git diff --check
./scripts/preflight.sh
```

## Deferred

- Now-playing chip/progress state.
- Scroll-motion or chapter-progress behavior.
- A2UI showcase.
- Applying numbered chapter labels to each project card.
