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
const docs = {
  system: read('PORTFOLIO_SYSTEM.md'),
  workflows: read('PORTFOLIO_AGENT_WORKFLOWS.md'),
  dashboard: read('PORTFOLIO_DASHBOARD.md'),
};

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
  requireText(block, '${{ steps.url.outputs.base }}/pikappapp/demo', `${name} Lighthouse must retain public noindex Pi Kapp demo coverage`);
}

const checkJob = jobBlock('links');
if (!checkJob) fail('primary check job was not found');
else {
  requireText(checkJob, 'npm run test:content-export-policy', 'primary check job must preserve the content export policy fixture');
  requireText(checkJob, 'npm run check:content-export-policy', 'primary check job must run current-artifact content export policy validation');
  requireText(checkJob, 'node scripts/validate-project-manifest.mjs', 'primary check job must validate the current project manifest');
  requireText(checkJob, 'npm run check:final-site-reconciliation', 'primary check job must run the final reconciliation contract');
}

const protectedPages = ['wxo-canvas.html', 'document-processing.html'];
for (const page of protectedPages) {
  const html = read(page);
  requireText(html, '<meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex">', `${page} must use the full protected robots policy`);
  requireText(html, '<meta name="referrer" content="no-referrer">', `${page} must set no-referrer metadata`);
}

requireText(packageJson.scripts?.['check:final-site-reconciliation'] ?? '', 'scripts/check-final-site-reconciliation.mjs', 'package.json must register the reconciliation contract');
requireText(preflight, 'check:final-site-reconciliation', 'preflight must run the reconciliation contract');

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
  'New authored V1/V2 Canvas evidence now supports one active protected wxO story lane',
  'Document Processing remains its smaller protected chapter',
  'Homepage hero plus Design DNA entry and UI Gallery naming plus approved-artifact review are sequenced behind wxO',
  'Retire `UI Fragments` as a separate concept',
  'Keep generic gallery overlays and A2UI parked',
  'Use targeted source intake only; do not repeat a broad asset inventory',
]) requirePhrase(docs.dashboard, phrase, `dashboard must state: ${phrase}`);

forbid(docs.dashboard, /No further enhancement lane is queued/i, 'dashboard must not retain the superseded no-enhancement-lane state');
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
