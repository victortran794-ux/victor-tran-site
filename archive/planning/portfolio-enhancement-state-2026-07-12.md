# Portfolio enhancement state: 2026-07-12

This checkpoint reconciles the active dashboard and direction brief against the actual repo after the June closeout, the private 2026-06-09 site-review handoff, and project-manifest/order work through PR #80.

## Verified repo state at reconciliation

- `main` was clean and matched `origin/main` at commit `94bca82` before this docs-only branch was created.
- IBM Cloud empty placeholder slots were removed in the same merged slice that added the Document Processing homepage card (PR #76).
- Project metadata/order is now centralized in `data/projects.json`.
- PRs #78–#80 added manifest validation, generated homepage/Work sections, and aligned project-page previous/next navigation.
- The parked standalone A2UI branch remains unmerged and is not active work.

## Superseded implementation instructions

The two approved tasks in `Website Items/Portfolio Handoffs/Site Review 2026-06-09/site-review-handoff-2026-06-09.md` are complete:

1. Remove IBM Cloud placeholder slots.
2. Add the Document Processing homepage card while preserving its password gate, `noindex`, and sitemap omission.

Do not rerun those instructions.

## Current review gate

Run a fresh visual review across:

- Desktop Light
- Desktop Dark
- Mobile Light
- Mobile Dark

The 2026-06-09 review did not actually test mobile. Its mobile conclusions are void; mobile work starts from fresh verification.

Review focus:

1. Homepage primary-project versus Visual Archive hierarchy.
2. Homepage tracklist/chapter treatment and whether the metaphor feels grounded.
3. Art & Illustration Pause/Play control treatment.
4. About image/tone behavior.
5. Responsive navigation, cards, project navigation, and protected gate.
6. Copy that feels theatrical, overly clever, or agent-polished.

## Reconciled unapproved candidates

1. **Contact resilience:** candidate visible email, copy-email control, LinkedIn, and retained email link.
2. **Pi Kapp demo cold start:** candidate static pre-render loading/splash markup inside `#root`, replaced when React initializes.
3. **Time-sensitive Accuracy Evaluation wording:** verify actual status before editing `planned to release this summer`.
4. **Performance Contracting name consistency — resolved:** the official site identifies the company as Performance Contracting, Inc. Keep any project-label alignment as a separate narrow copy task.

## Future concepts remain opt-in

- Report-style project chapter system
- Lens/DNA inspection mode
- Selective motion/prototype behavior
- Asset/photo inventory after direction is chosen
- A2UI remains parked

## Guardrails

- Preserve password gates, `noindex`, and sitemap rules.
- Do not promote parked concepts.
- Do not turn the four candidates into a combined implementation batch.
- After visual review, select at most one narrow branch-sized slice.
