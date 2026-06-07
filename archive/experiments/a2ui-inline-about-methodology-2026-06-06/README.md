# A2UI inline About-page methodology experiment: 2026-06-06

Status: parked contained experiment.

This folder preserves the inline About-page A2UI methodology prototype as source material for a future revisit. It should not be treated as active site work or a merge-ready feature.

## Why it is parked

Victor liked the direction visually, but the current prototype is not a real content-aware A2UI implementation. It does not read the generated Markdown pages, query `content/site-index.json`, run a live agent, or use a verified A2UI runtime/package. It is a static, local A2UI-inspired interface study with predefined payloads.

The experiment may become useful later when the portfolio has the infrastructure to support a real content-aware or agent-backed version.

## What is preserved here

- `spec.md` — the planning/spec note for the inline About-page direction.
- `inline-about-prototype.patch` — the prototype diff for `about.html`, `css/style.css`, `js/main.js`, and generated content exports.
- `planning-doc-updates.patch` — the temporary planning-doc diff from the prototype branch before the experiment was parked.

## Guardrails for future pickup

Before reviving this work:

1. Start from clean `main`.
2. Decide whether the feature should be:
   - a clearly labeled static interface study;
   - a content-aware browser using generated repo content such as `content/site-index.json`; or
   - a real agent/A2UI runtime integration.
3. Do not present it as a live assistant or actual A2UI implementation unless that is true.
4. Do not add homepage/nav/sitemap promotion without explicit approval.
5. Avoid floating chat widgets and site-wide chatbot behavior.
6. Keep protected/client content out of the experiment.
7. Verify Light/Dark/mobile behavior and run the normal repo checks before PR/merge.

## Current recommendation

Keep A2UI parked until the technology/infrastructure catches up or Victor explicitly selects it again. The portfolio docket should return to current-site review, public tone/copy, public visual polish, Document Processing protected-page review, or other future concepts as separate opt-in tracks.
