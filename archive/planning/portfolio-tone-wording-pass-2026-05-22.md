# Portfolio Tone / Wording Pass

Date: 2026-05-22
Status: proposed enhancement track
Scope: pull quotes, section headers, labels, and supporting copy across public portfolio pages

## Goal

Make selected portfolio wording feel sharper, more grounded, and less cheesy without flattening Victor’s voice.

This is a tone/editing track, not a redesign. The target is the parts of the site most likely to read as over-written: pull quotes, section headers, callout labels, metaphor-heavy lines, and supporting copy around new visual patterns.

## Why this track exists

The recent enhancement work added more editorial framing: tracklist language, now-playing cues, color-punctuation notes, and chapter labels. Those patterns are directionally useful, but the wording should be reviewed so the site does not drift into theatre-kid, concept-album, or AI-hype language when a simpler phrase would feel more confident.

## Tone target

Prefer:

- specific over grand;
- grounded over poetic;
- confident over clever;
- useful labels over metaphor-first labels;
- Victor’s voice without over-explaining the concept.

Avoid:

- cheesy pull quotes;
- forced music/theatre metaphors;
- inflated claims;
- generic innovation language;
- “future of…” phrasing unless earned;
- labels that sound like a product launch rather than a portfolio.

## Candidate surfaces

Review these first:

1. Homepage
   - tracklist intro;
   - now-playing chip;
   - chapter labels;
   - project card supporting copy.
2. Phase C color-punctuation cards
   - IBM Cloud system note;
   - Ability Experience anniversary note;
   - SAL Magazine archive note.
3. Case-study pull quotes and section headers
   - all public pages first;
   - protected pages only after confirming scope.
4. About page
   - leave structure as-is unless specific wording feels off.
5. Directional terms in planning docs if they affect future implementation language.

## Review method

For each candidate line, classify it as:

- `keep` — works as-is;
- `soften` — good idea, too much metaphor;
- `ground` — needs a clearer factual anchor;
- `cut` — not helping;
- `rewrite` — preserve intent but replace wording.

## Suggested rewrite pattern

For every flagged line, record:

```text
Page:
Current wording:
Issue:
Suggested direction:
Replacement:
Risk/check:
```

Example:

```text
Page: homepage
Current wording: [line]
Issue: clever but vague
Suggested direction: make the navigation purpose explicit
Replacement: [new line]
Risk/check: verify mobile wrapping and content export
```

## Guardrails

- Do not rewrite factual case-study claims without checking source context.
- Do not edit protected/confidential pages unless explicitly approved.
- Keep Document Processing protected/noindex and do not add screenshots, metrics, or homepage/sitemap promotion.
- Preserve the site’s personal voice; do not turn it into generic corporate UX copy.
- Review changes in Light/Dark and mobile if copy affects visual rhythm.
- Run `node scripts/html-to-md.mjs` after public page copy edits.
- Run `./scripts/preflight.sh` before commit/push.

## First implementation slice

After Victor’s deep review, create a narrow branch such as:

`docs/tone-pass-public-pages`

Recommended first pass:

1. Audit homepage + the three Phase C cards only.
2. Produce a short list of flagged lines and proposed replacements.
3. Implement only the approved replacements.
4. Regenerate content exports.
5. Run preflight.
6. Review before expanding to more pages.

## Deferred

- Full site copy rewrite.
- Protected/confidential page copy edits.
- Major case-study narrative restructuring.
- New visual patterns.
- A2UI wording until A2UI is active again.
