#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');
const fail = message => failures.push(message);
const requireText = (text, needle, message) => {
  if (!text.includes(needle)) fail(message);
};
const requirePhrase = (text, phrase, message) => {
  if (!text.toLowerCase().includes(phrase.toLowerCase())) fail(message);
};
const forbid = (text, pattern, message) => {
  if (pattern.test(text)) fail(message);
};

const workflow = read('.github/workflows/health-check.yml');
const packageJson = JSON.parse(read('package.json'));
const preflight = read('scripts/preflight.sh');
const scopeClassifier = read('scripts/classify-health-check-scope.mjs');
const scopeFixture = read('scripts/test-classify-health-check-scope.mjs');
const docs = {
  system: read('PORTFOLIO_SYSTEM.md'),
  workflows: read('PORTFOLIO_AGENT_WORKFLOWS.md'),
  dashboard: read('PORTFOLIO_DASHBOARD.md'),
};
const directionBrief = read('PORTFOLIO_DIRECTION_BRIEF.md');

const jobBlock = jobId => {
  const marker = `\n  ${jobId}:\n`;
  const start = workflow.indexOf(marker);
  if (start < 0) return '';
  const rest = workflow.slice(start + marker.length);
  const next = rest.search(/\n  [a-zA-Z0-9_-]+:\n/);
  return next < 0 ? rest : rest.slice(0, next);
};

for (const [name, jobId] of [['desktop', 'lighthouse'], ['mobile', 'lighthouse-mobile']]) {
  const block = jobBlock(jobId);
  if (!block) {
    fail(`${name} Lighthouse job block was not found`);
    continue;
  }
  requireText(block, 'temporaryPublicStorage: false', `${name} Lighthouse must disable temporary public storage`);
  for (const route of ['wxo-canvas', 'document-processing']) {
    forbid(block, new RegExp(`\\$\\{\\{ steps\\.url\\.outputs\\.base \\}\\}/${route}(?:\\s|$)`), `${name} Lighthouse must not audit protected /${route}`);
  }
}

for (const phrase of [
  'Five logical statuses now run inside that workflow',
  'Documentation-only changes stop after the fast baseline',
  'Shared and workflow/tooling changes fail safely to full coverage',
  'every `main` push performs the full maintenance suite',
  'Pull requests intentionally skip both production-domain Lighthouse jobs',
  'No classic branch protection or repository ruleset currently requires these checks before merge',
  'Victor-specific claims, privacy/provenance, archive, shell, and browser contracts remain portfolio-only',
  '### Privacy and provenance classification',
  'Privacy checks must classify evidence from source and provenance',
  'are not proof of live or private records',
  'When provenance is unknown or contradictory, fail closed',
  'A fictional-sample-data disclosure is useful framing, not a waiver',
  'Automated string scans may flag candidates for review',
]) requirePhrase(docs.system, phrase, `portfolio system must state: ${phrase}`);

const changesJob = jobBlock('changes');
const triggerBlock = workflow.slice(0, workflow.indexOf('\njobs:'));
forbid(triggerBlock, /^\s+paths:/m, 'health workflow must emit scope and baseline statuses for every PR and main push');
if (!changesJob) fail('scope-selection job was not found');
else {
  requireText(changesJob, 'fetch-depth: 0', 'scope selection must fetch both diff endpoints');
  requireText(changesJob, 'set -euo pipefail', 'scope selection must fail closed when git diff or the classifier fails');
  requireText(changesJob, 'if [[ "$EVENT_NAME" != "pull_request" ]]', 'main, scheduled, and manual runs must force full coverage');
  requireText(changesJob, 'BASE_SHA="$PR_BASE_SHA"', 'pull requests must use the immutable base SHA');
  requireText(changesJob, 'HEAD_SHA="$PR_HEAD_SHA"', 'pull requests must use the immutable head SHA');
  requireText(changesJob, 'scripts/classify-health-check-scope.mjs --all', 'scope selection must preserve safe full-run fallback');
  requireText(changesJob, 'git diff --name-only "$BASE_SHA" "$HEAD_SHA"', 'scope selection must classify the exact event diff');
}

const checkJob = jobBlock('links');
if (!checkJob) fail('primary check job was not found');
else {
  requireText(checkJob, 'needs: changes', 'portfolio checks must depend on scope selection');
  requireText(checkJob, 'if: always()', 'portfolio checks must emit a failing stable status when scope selection fails');
  requireText(checkJob, "if: needs.changes.result != 'success'", 'portfolio checks must explicitly reject failed scope selection');
  requireText(checkJob, 'node scripts/test-classify-health-check-scope.mjs', 'portfolio checks must run the scope fixture');
  requireText(checkJob, "needs.changes.outputs.pikapp == 'true'", 'Pi Kapp contracts must be path scoped');
  requireText(checkJob, "needs.changes.outputs.gallery == 'true'", 'gallery contracts must be path scoped');
  requireText(checkJob, "needs.changes.outputs.wxo == 'true'", 'wxO contracts must be path scoped');
  requireText(checkJob, 'npm run test:content-export-policy', 'primary check job must preserve the content export policy fixture');
  requireText(checkJob, 'npm run check:content-export-policy', 'primary check job must run current-artifact content export policy validation');
  requireText(checkJob, 'node scripts/validate-project-manifest.mjs', 'primary check job must validate the current project manifest');
  requireText(checkJob, 'npm run check:final-site-reconciliation', 'primary check job must run the final reconciliation contract');
}

for (const [name, jobId] of [['desktop', 'lighthouse'], ['mobile', 'lighthouse-mobile']]) {
  const block = jobBlock(jobId);
  requireText(block, 'needs: changes', `${name} Lighthouse must depend on scope selection`);
  requireText(block, "needs.changes.outputs.deployable == 'true'", `${name} Lighthouse must be limited to deployable changes outside forced full runs`);
}

const imagesJob = jobBlock('images');
requireText(imagesJob, 'needs: changes', 'image scan must depend on scope selection');
requireText(imagesJob, "needs.changes.outputs.images == 'true'", 'image scan must be limited to image changes outside forced full runs');

requireText(scopeClassifier, 'unknownDeployable', 'scope classifier must fail unknown deployable paths toward shared coverage');
requireText(scopeClassifier, 'hasUnknownPath', 'scope classifier must fail every unrecognized non-documentation path toward full coverage');
requireText(scopeFixture, 'docsOnly', 'scope fixture must protect documentation-only behavior');
requireText(scopeFixture, 'unknown public HTML must fail safely to shared coverage', 'scope fixture must protect unknown deployable fallback');
requireText(scopeFixture, 'must fail safely to full coverage', 'scope fixture must protect unknown tooling and configuration fallback');

const protectedPages = ['wxo-canvas.html', 'document-processing.html'];
for (const page of protectedPages) {
  const html = read(page);
  requireText(html, '<meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex">', `${page} must use the full protected robots policy`);
  requireText(html, '<meta name="referrer" content="no-referrer">', `${page} must set no-referrer metadata`);
}

requireText(packageJson.scripts?.['check:final-site-reconciliation'] ?? '', 'scripts/check-final-site-reconciliation.mjs', 'package.json must register the reconciliation contract');
requireText(packageJson.scripts?.['test:health-check-scope'] ?? '', 'scripts/test-classify-health-check-scope.mjs', 'package.json must register the scope fixture');
requireText(preflight, 'check:final-site-reconciliation', 'preflight must run the reconciliation contract');
requireText(preflight, 'test:health-check-scope', 'preflight must run the scope fixture');

for (const [name, text] of Object.entries(docs)) {
  requirePhrase(text, 'static client-side password gate is visitor deterrence and discovery reduction, not server-side access control', `${name} must state the client-side gate limitation`);
  requirePhrase(text, 'served HTML can contain the page source', `${name} must state served-source exposure`);
  requirePhrase(text, 'No material requiring true confidentiality may be added', `${name} must prohibit truly confidential material`);
  requirePhrase(text, 'server-side protection or private-hosting architecture', `${name} must name the required future protection architecture`);
}

for (const [name, text] of Object.entries({ system: docs.system, workflows: docs.workflows, workflow: workflow })) {
  forbid(text, /currently linked from the Work dropdown/i, `${name} must not claim Document Processing is linked from the Work dropdown`);
}
for (const [name, text] of Object.entries({ system: docs.system, workflows: docs.workflows, dashboard: docs.dashboard })) {
  requirePhrase(text, 'manifest nav=false/homepage=false', `${name} must document Document Processing manifest visibility`);
  requirePhrase(text, 'permanently redirects to `/wxo-canvas#document-processing`', `${name} must document the intentional Document Processing redirect`);
  requirePhrase(text, 'raw `.html`', `${name} must document the raw HTML route artifact`);
  requirePhrase(text, 'implementation artifact', `${name} must document the raw HTML route artifact`);
}

forbid(docs.dashboard, /de404074ee680f9cdccbf5ab85817562bc709ef6/, 'dashboard must not pin current status to the stale Pi Kapp production SHA');
forbid(docs.dashboard, /production is clean through Pi Kapp PR #123/i, 'dashboard must not claim the Pi Kapp checkpoint is the current production boundary');
forbid(docs.dashboard, /Art & Illustration \| next active page lane/i, 'dashboard Art tracker status must be refreshed');
forbid(docs.dashboard, /Graphic Design \| queued after Art/i, 'dashboard Graphic tracker status must be refreshed');
forbid(docs.dashboard, /Home \+ global shell \| lens portal production-verified in PRs #114 and #116; broader August 7 list remains open/i, 'dashboard Home/global tracker status must be refreshed');
for (const phrase of [
  'production-verified through PR #152',
  'production-verified through PR #153',
  '`00364c03e3a522274027bf538be8c0d420d26a2e`',
  'the Vercel application was subsequently submitted and closed',
  'The Mendenhall delivery optimization is production-verified through PR #153',
  'production-verified across every live shared-shell route through PR #154',
  '`8644d9f65f62e2ef9540b94d883d3208f038d802`',
  'route-specific Theme Continuity content remains scoped to Home, IBM Cloud, and About',
  'The optional PCI orientation proof was evaluated and discarded',
  'final whole-site reconciliation is closed',
  'wxO remains password-gated, `noindex`, and omitted from the sitemap',
  'Document Processing remains a protected chapter inside wxO',
  'Getting In is retired from the public portfolio',
  'Pi Kapp and Heart of the Frozen Void are public and closed',
  'production-verified through PR #165',
  '`a13d369780f599efd4b148582bec7a452fe0908c`',
  'PR #162 evolved the protected wxO story from V1 foundation to V2 studies',
  'PR #163 released the name-first Victor TRAN Homepage hero',
  'PR #164 renamed the public UI Gallery label to Interface Studies',
  'PR #165 expanded Interface Studies with the complete Ekos desktop/mobile pair',
  'The next bounded implementation candidate is Pi Kapp static-screen simplification',
  'Preserve the stable `/pikappapp` case-study route',
  'Remove the standalone runnable V2 demo only after its links, build dependencies, browser contracts, Lighthouse inventory, and generated exports are reconciled',
  'Site checks and balances is an active governance audit',
  'Realistic labels, metrics, names, dates, status text, or topology are not proof that a design screen contains live or private records',
  'a fictional-sample-data label never overrides evidence that real client, employee, customer, or operational data is present',
  'KitBitz is tracked separately as an external illustration resource',
  'Retire `UI Fragments` as a separate concept',
  'Keep generic gallery overlays and A2UI parked',
  'Use targeted source intake only; do not repeat a broad asset inventory',
]) requirePhrase(docs.dashboard, phrase, `dashboard must state: ${phrase}`);

forbid(docs.dashboard, /No further enhancement lane is queued/i, 'dashboard must not retain the superseded no-enhancement-lane state');
forbid(docs.dashboard, /New authored V1\/V2 Canvas evidence now supports one active protected wxO story lane/i, 'dashboard must not describe the released wxO lane as active');
forbid(docs.dashboard, /Homepage hero plus Design DNA entry and UI Gallery naming plus approved-artifact review are sequenced behind wxO/i, 'dashboard must not describe the released Home and Interface Studies lanes as queued');
forbid(docs.dashboard, /no further Pi Kapp work or route is queued/i, 'dashboard must record the approved Pi Kapp simplification candidate');
forbid(docs.dashboard, /UI Fragments is review-later/i, 'dashboard must not retain UI Fragments as a separate review-later concept');
forbid(docs.dashboard, /bounded lens-to-DNA comparison is active/i, 'dashboard must not describe the superseded Home lens comparison as active');
forbid(docs.dashboard, /feat\/vercel-content-alignment/i, 'dashboard must not describe the released Vercel branch as active');
forbid(docs.dashboard, /await(?:s|ing) (?:Victor's )?preview/i, 'dashboard must not describe the released Vercel alignment as awaiting preview');
forbid(docs.dashboard, /Heart of the Frozen Void assets are parked/i, 'dashboard must not carry the completed Heart of the Frozen Void asset reminder');
forbid(docs.dashboard, /theme-continuity work remains an isolated preview proof/i, 'dashboard must not describe released Theme Continuity work as a preview');

requireText(docs.dashboard, 'Last updated: 2026-08-21', 'dashboard must use the August 21 PR #160 closeout date');
forbid(docs.dashboard, /Last updated: 2026-08-(?:0[89]|16)/i, 'dashboard must not retain a superseded August 8, August 9, or August 16 current-status date');
forbid(docs.dashboard, /Final whole-site reconciliation is active/i, 'dashboard must not describe the closed whole-site reconciliation as active');
forbid(docs.dashboard, /asset-dependent items and separate route-opening gates remain open/i, 'dashboard must not describe parked asset work as an open release blocker');
forbid(docs.dashboard, /Keep broader DNA reassessment parked/i, 'dashboard must not describe broader DNA reassessment as parked');
forbid(docs.dashboard, /(?:remove|reopen|pending)[^\n.]*visible `Light`\s*\/\s*`Dark` words|visible `Light`\s*\/\s*`Dark` words[^\n.]*(?:remain|are) pending/i, 'dashboard must not present visible Light/Dark words as pending');
forbid(docs.dashboard, /visible `Copy email` (?:action|wording|treatment)/i, 'dashboard must not present visible Copy email as current or pending');
forbid(docs.dashboard, /Current known mismatch: the manifest marks IBM Patterns and PCI as public\/indexable\/sitemap-eligible/i, 'dashboard must not present the resolved IBM Patterns/PCI visibility mismatch as current');
forbid(docs.dashboard, /Active protected V1\/V2 story audit and redesign proposal/i, 'dashboard project tracker must not describe the released wxO lane as active');
forbid(docs.dashboard, /Pi Kapp App[^\n]*\| No current action;/i, 'dashboard project tracker must record the Pi Kapp simplification candidate');
forbid(docs.dashboard, /\| UI Gallery \|[^\n]*Sequenced naming and approved-artifact audit after Home/i, 'dashboard project tracker must not retain the released Interface Studies lane as queued');
for (const phrase of [
  '| wxO Canvas | production-verified through PR #162',
  '| Pi Kapp App | production-verified through PR #159',
  'Static-screen simplification candidate',
  '| Interface Studies | production-verified through PR #165',
]) requirePhrase(docs.dashboard, phrase, `dashboard project tracker must state: ${phrase}`);

forbid(directionBrief, /portfolio\/wxo-v1-v2-story-2026-08-21/i, 'direction brief must not point to the completed wxO worktree as the next action');
forbid(directionBrief, /After wxO, open the Homepage hero plus Design DNA entry lane/i, 'direction brief must not queue the released Home and Interface Studies sequence');
forbid(directionBrief, /After VicO2 reconciliation, should the existing home-only Design DNA overlay be refreshed/i, 'direction brief must not treat the released Design DNA entry as an unresolved pre-release question');
forbid(directionBrief, /What final sequence should coordinate the homepage, Work menu, and previous and next links after wxO Canvas is considered/i, 'direction brief must not treat the released wxO sequence as unresolved');
for (const phrase of [
  '### Current bounded next actions',
  'Pi Kapp static-screen simplification',
  'Site checks and balances',
  'production/reset baseline through PR #165',
  'Classify privacy from source and provenance rather than realistic-looking interface strings alone',
  'Does Pi Kapp static-screen simplification preserve the strongest authored evidence',
  'Which existing checks should be required before merge',
]) requirePhrase(directionBrief, phrase, `direction brief must state: ${phrase}`);
for (const phrase of [
  'PR #127 established the accessible icon-only theme control',
  'PR #154 released that shared refinement across live shared-shell routes',
  'without normalizing project-native surfaces or route-specific content furniture',
  'visible `Email` action uses a direct `mailto:` link',
  'About retains the full email sentence',
  'IBM Cloud, IBM Patterns, and the sanitized PCI story are approved as public archive projects',
]) requirePhrase(docs.dashboard, phrase, `dashboard must state: ${phrase}`);

if (failures.length) {
  console.error('Final site reconciliation contract failed:');
  for (const message of failures) console.error(`- ${message}`);
  process.exitCode = 1;
} else {
  console.log('Final site reconciliation contract passed.');
}
