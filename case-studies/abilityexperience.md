# The Ability Experience — Project Package

## Project identity

- Title: The Ability Experience
- Slug: `abilityexperience`
- Public source page: `abilityexperience.html`
- Generated export: `content/abilityexperience.md`
- Type: Brand identity and collateral
- Visibility: Public and sitemap-indexed

## Current implementation

- Static HTML case-study page using the shared navigation, footer, lens switcher, cursor, reveal behavior, project navigation, and site-wide tokens.
- Project media lives in `images/abex-*` plus `images/thumb-abex.webp`.
- No project-specific JavaScript is required.

## Narrative

- Thesis: A full brand package built around a single anniversary moment.
- Strongest hiring signal: Victor can create a connected identity across iconography, commemorative illustration, print, and cycling apparel.
- Audience takeaway: The work is a coherent visual system carried across very different artifacts.
- Do not overclaim organizational impact, accessibility outcomes, participation totals beyond the existing public wording, or operational program results.

## Confirmed public facts

- The Ability Experience is the philanthropy of Pi Kappa Phi Fraternity.
- The public case study describes a 40th-anniversary brand package.
- Public artifacts include an anniversary mark, iconography, illustrated commemorative print, cycling kits, and an event map/backdrop.
- Existing public wording says the cycling kits were worn by nearly 100 student riders traveling coast to coast.

## Media

Approved existing public media:

- `images/thumb-abex.webp` — project/cyclist thumbnail
- `images/abex-print.jpg` — illustrated commemorative print
- `images/abex-40logo.jpg` — anniversary mark and explorations
- `images/abex-icons-1.jpg` — final iconography
- `images/abex-icons-2.jpg` — iconography sketches
- `images/abex-kits-1.jpg` — cycling-kit front
- `images/abex-kits-2.jpg` — cycling-kit back
- `images/abex-kits-3.jpg` — kit in use
- `images/abex-map.jpg` — SC56 map/backdrop

Preserve original imagery without AI generation, invented annotations, replacement art, or destructive asset edits.

## Redesign direction approved 2026-07-23

Victor approved a narrow production translation of the private Victor-on-Carbon proving-ground excerpt.

Must survive:

- Full-span, project-specific theatrical opening
- Ability Experience orange/blue visual identity
- Existing public copy, facts, and media
- Existing shared navigation, Light/Dark lens behavior, footer, cursor, reveal behavior, and project navigation
- Flat surfaces, hairlines, restrained radii, serif/sans/mono hierarchy, and portfolio-blue structural edge accents

Approved component patterns:

- Numbered chapter markers
- Asymmetric evidence layouts
- Artifact/decision card anatomy
- Editorial system diagram linking the existing public artifact categories
- Mobile recomposition into logical single-column and vertical-diagram order

Avoid:

- Dashboard/SaaS layout
- New impact metrics or launch claims
- Broad site-token or shared-component redesign
- New dependencies, framework migration, or project-specific JavaScript
- Site-wide navigation, homepage, sitemap, or other project-page changes

## Implementation boundary

This slice may change only:

- `abilityexperience.html`
- A bounded Ability Experience section in `css/style.css`
- `case-studies/abilityexperience.md`
- Generated `content/abilityexperience.md` and `content/site-index.json` if HTML export output changes
- A narrow automated contract under `scripts/`

Anything broader requires a new approval gate.

## Verification gate

Before commit, push, PR, merge, or deployment:

- Run the targeted Ability Experience contract.
- Run `git diff --check` and `./scripts/preflight.sh`.
- Review desktop and mobile in Light and Dark.
- Confirm protected-page behavior, homepage, navigation, sitemap, and unrelated project pages are unchanged.
- Obtain independent code review.
- Leave the branch uncommitted until Victor approves the production screenshots.
