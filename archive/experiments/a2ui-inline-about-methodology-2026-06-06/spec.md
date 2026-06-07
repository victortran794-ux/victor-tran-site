# A2UI inline About-page methodology spec: 2026-06-06

## Decision

A2UI should not move forward as a page that only explains A2UI. The stronger direction is to install the methodology into the portfolio as a small inline agentic interface pattern, or skip the track if that pattern does not feel native after review.

The parked branch `feat/a2ui-showcase-static-prototype` at commit `87ddb60` remains useful source material, but it is not the preferred final format right now.

## Current recommendation

Proceed only as a planning/spec and later tiny prototype. Do not merge the parked standalone page yet.

Best first target: the About page's Play & Listen area, near the existing Tetris and playlist/listening material.

Reasoning:

- The About page already contains personal, playful, interactive context.
- A2UI is about agents producing declarative UI that the client renders with trusted components, not about adding a generic chatbot.
- An inline desktop experience can feel like part of Victor's studio system rather than a floating support widget.
- It keeps the homepage and primary case studies clean while the pattern proves itself.
- It can degrade to a normal static card or stay hidden/collapsed on smaller screens.

## Product framing

Working name: **Studio Assistant** or **Liner Notes Assistant**.

Purpose: let a visitor ask a small set of portfolio-native questions and receive rendered interface cards, not chat bubbles.

The chat input is only the trigger. The rendered, inspectable component surface is the point.

The experience should demonstrate:

1. **Intent** — the visitor asks a small contextual question.
2. **Declarative payload** — the system represents the answer as A2UI-style JSON.
3. **Trusted rendering** — the portfolio maps the payload into its own components and styling.
4. **Human control** — the visitor chooses follow-up chips such as explore work, show playlist notes, inspect DNA, or close.
5. **Inspectability** — a DNA/inspect view reveals the component payload and guardrails.

## Placement options

### Preferred: About page inline card

Add an inline A2UI surface near the Play & Listen section.

Possible desktop layout:

- Tetris card
- Playlist/listening card
- Studio Assistant card

Or, if three columns are too cramped, keep the existing two-column rhythm and place the assistant as a full-width card underneath the two playful modules.

Mobile behavior:

- Do not force a cramped chat UI.
- Collapse to a simple card with prompt chips and one rendered response.
- Hide the JSON/DNA panel behind a disclosure.

### Avoid for now

- Floating chat icon.
- Site-wide chat widget.
- Homepage-first placement.
- New standalone `a2ui.html` page as the primary expression.
- Sitemap/nav promotion.

## Example interaction model

Prompt chips should stay constrained and portfolio-specific:

- "What should I look at first?"
- "Explain the playlist vibe."
- "What does Tetris have to do with this page?"
- "Show the portfolio system DNA."
- "Recommend a case study."

The first prototype can be static or lightly scripted. It does not need a live LLM.

A static implementation is acceptable if it shows the methodology clearly:

- selecting a chip loads a predefined A2UI-style payload;
- the renderer maps payload component types to site-native cards;
- the DNA toggle shows the payload;
- no external calls, no tracking, no API keys, no user data persistence.

## Trusted component catalog

Keep the first catalog small and site-native:

- `StatusCard`: current state or response mode.
- `RecommendationCard`: a suggested project/page with reason.
- `EvidenceCard`: what the recommendation is based on.
- `PlaylistNote`: a personal/listening note tied to the About context.
- `GameNote`: a playful Tetris/page note.
- `ActionChips`: safe local follow-ups.
- `DnaPanel`: inspectable payload/guardrails.
- `RecoveryNote`: explains that the prototype is local/static if something is unavailable.

Do not let the agent define arbitrary markup, CSS, scripts, URLs, or image paths.

## A2UI mapping notes

A2UI concepts to preserve:

- **Surface:** the inline About-page assistant area.
- **Catalog:** the portfolio-approved component set above.
- **Message stream:** a sequence such as `createSurface`, `updateComponents`, `updateDataModel`.
- **Renderer:** a small site-local function that maps payload objects to existing HTML patterns.
- **Actions:** local-only actions for first pass: switch prompt, show DNA, open a project link, close/reset.
- **Theming:** renderer-controlled via existing portfolio tokens, not agent-controlled visual styling.

Use public language like "A2UI-inspired" or "agent-to-user interface methodology" unless a real A2UI renderer/package is installed and verified.

## Guardrails

- No merge or promotion of `feat/a2ui-showcase-static-prototype` as-is.
- No homepage/nav/sitemap links.
- No floating chat widget.
- No live LLM or remote service in the first prototype.
- No collection or persistence of visitor input.
- No protected Document Processing, IBM-private, PCI, client, credential, or internal content.
- Preserve About page content and the existing Tetris/playlist personality.
- Keep the About `Training for: (WIP)` line as intentional.
- Stop at a local/review-ready branch before PR/merge unless Victor explicitly approves closeout.

## Acceptance criteria for a future prototype

A future branch is worth showing only if:

1. The About page still feels like Victor's About page, not a SaaS demo.
2. The assistant is inline/contextual, not a generic chatbot.
3. At least two prompt chips render portfolio-native cards.
4. The DNA/inspect view makes the A2UI methodology understandable.
5. Desktop layout works near Tetris/playlist without crowding.
6. Mobile layout degrades cleanly.
7. Light and Dark modes both work.
8. `node scripts/html-to-md.mjs`, `node --check js/main.js`, `git diff --check`, and `./scripts/preflight.sh` pass or any expected direct-link production quirk is clearly reported.

## Skip criteria

Skip or keep A2UI private if the first prototype feels like:

- a gimmick pasted onto the site;
- a support chatbot;
- too much explanation for too little experience;
- a distraction from the portfolio work;
- a framework/build-system detour;
- a feature that needs live AI infrastructure to make sense.

## Recommended next implementation branch, if selected

`feat/a2ui-inline-about-methodology-prototype`

Suggested implementation sequence:

1. Branch from clean synced `main`.
2. Add a small static payload dataset for the About assistant in `js/main.js` or a tiny local module if the repo pattern supports it.
3. Add About-page markup for the inline assistant near the Play & Listen section.
4. Add page-scoped CSS near the existing About Play & Listen CSS.
5. Implement local chip switching, card rendering, and DNA toggle.
6. Regenerate generated content exports if About copy changes.
7. Verify desktop/mobile, Light/Dark, keyboard access, and reduced-motion safety.
8. Run preflight and stop for Victor review before merge/promotion.
