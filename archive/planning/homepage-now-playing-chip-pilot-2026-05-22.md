# Homepage Now-Playing Chip Pilot

Date: 2026-05-22
Status: local design pilot
Scope: one small public homepage treatment

## Goal

Build on the homepage tracklist intro with a small “now playing” cue, without adding scroll tracking, pinned UI, or complex interaction yet.

The intended effect is:

- make the curated-sequence idea more visible;
- introduce a lightweight chapter/progress pattern;
- keep the homepage editorial and calm;
- leave copy easy to revise later.

## Implemented pilot

Public page: `index.html`

Implemented:

1. Added a compact `now-playing-chip` below the featured intro heading.
2. Set the current chapter to `Systems at scale` with a `01/03` progress marker.
3. Used a pink status dot and neutral pill surface so the cue feels connected to the existing homepage palette.
4. Kept it static and homepage-only; no scroll tracking, sticky behavior, or card-level state.

## Design rules tested

- The chip should feel like a quiet stagehand cue, not an app dashboard.
- The current-state pattern should be visible but not louder than the project cards.
- The progress marker should be compact enough for mobile.
- If this feels right, a later pass can decide whether the chip should update with scroll position.

## Review checklist

Manual review:

- Homepage Light mode.
- Homepage Dark mode.
- Mobile width around the featured intro and chip.
- Confirm the chip does not compete with the hero CTA or project cards.

Commands:

```bash
git diff --check
./scripts/preflight.sh
```

## Deferred

- Scroll-aware active chapter updates.
- Sticky now-playing behavior.
- Mapping individual project cards to chapters.
- A2UI showcase/state components.
