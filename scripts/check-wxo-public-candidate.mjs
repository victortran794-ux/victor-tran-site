#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';

const fail = (message) => {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
};
const requireText = (text, value, message) => {
  if (!text.includes(value)) fail(message);
};
const forbid = (text, pattern, message) => {
  if (pattern.test(text)) fail(message);
};
const count = (text, pattern) => [...text.matchAll(pattern)].length;
const sha256 = (path) => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');

const htmlPath = 'wxo-canvas.html';
const cssPath = 'css/wxo-public-candidate.css';
const manifestPath = 'data/wxo-canvas-public-provenance.json';
for (const path of [htmlPath, cssPath, manifestPath]) {
  if (!fs.existsSync(path)) fail(`${path} must exist.`);
}
if (process.exitCode) process.exit(1);

const html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');
const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? '';
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

requireText(html, '<link rel="stylesheet" href="css/wxo-public-candidate.css">', 'Canonical candidate HTML must load its scoped stylesheet.');
requireText(html, '<script src="js/wxo-public-candidate.js" defer></script>', 'Canonical candidate HTML must load its bounded native-anchor stabilizer.');
for (const phrase of [
  'A shared visual language for agentic workflows.',
  'I evolved an inherited Flow Builder toward a more robust, Carbon-aligned canvas system for automation, agentic work, and human tasks.',
  'Make complex workflows easier to read.',
  'Nodes, connectors, flow controls, and user activities share a consistent grammar across the builder.',
  'The challenge was not a single screen.',
  'Primary story',
  'Feature deep dive',
  'Document Processing needed its own trust loop.',
  'Developed in parallel with the broader canvas work',
  'Canvas evolution',
  'A visual system that kept expanding.',
  'I supported the agent canvas vision',
  'One system for automation, specialized work, and human judgment.',
]) requireText(main, phrase, `Pilot missing approved phrase: ${phrase}`);

forbid(main, /—/, 'Canonical candidate primary copy must not use em dashes.');
forbid(main, /V2 system evolution|V2 authored exploration|Visual system in motion|prototype sequence|Canvas Future/i,
  'Canonical candidate must not expose retired V2, motion-prototype, or Canvas Future framing.');
forbid(main, /<video\b|<iframe\b/i, 'Canonical candidate must remain a static evidence narrative.');
forbid(main, /target="_blank"|Open full board/i, 'Evidence must open in the in-window carousel, not a new tab or repeated full-board action.');
requireText(html, 'data-wxo-gallery', 'Canonical candidate must provide the in-window evidence carousel.');
requireText(main, 'pilot-epic-container pilot-activity-epic', 'User Activity screens must share one annotated epic container.');
const activityStory = main.match(/pilot-activity-epic[\s\S]*?pilot-side-quest-bridge/i)?.[0] ?? '';
if (count(activityStory, /pilot-step-arrow/g) !== 2) fail('User Activity must use two substantial progression arrows between its three numbered stages.');
requireText(main, 'pilot-side-quest-bridge', 'wxO umbrella must retain a visible Document Processing bridge.');
requireText(main, 'href="document-processing.html"', 'wxO umbrella must link to the standalone Document Processing route.');
const bridge = main.match(/<aside class="pilot-side-quest-bridge"[\s\S]*?<\/aside>/i)?.[0] ?? '';
forbid(bridge, /\?lock=|protected|locked|aria-hidden[^>]*>.*(?:🔒|lock|→)/i,
  'Document Processing bridge must remain text-only and must not force a locked route state.');
forbid(main, /pilot-main-illustration|pilot-vignettes|20-illustration-vignettes/i,
  'The retired opening illustration and vignettes must not re-enter the active wxO narrative.');
forbid(main, /pilot-doc-epic|pilot-doc-frame|id="document-processing"/i,
  'wxO umbrella must not embed the full Document Processing arc.');
forbid(main, /accuracy improvement|efficiency improvement|adoption|customer impact|measured (?:improvement|increase|decrease|impact|result)/i,
  'Canonical candidate must not add unsupported outcome claims.');

if (count(main, /class="[^"]*\bpilot-evidence\b[^"]*"/gi) !== 13) fail('Canonical umbrella must retain thirteen active evidence display units.');
if (count(main, /class="[^"]*\bpilot-activity-frame\b[^"]*"/gi) !== 3) fail('Canonical candidate must contain the three approved User Activity frames.');
requireText(main, 'pilot-flow-evidence', 'Canvas evolution must use the reviewed flow-control narrative group.');
if (count(main, /class="[^"]*\bpilot-expansion-frame\b[^"]*"/gi) !== 3) fail('Canonical candidate must preserve three Canvas evolution states.');
if (count(main, /data-wxo-evidence/gi) !== 13) fail('Canonical umbrella must retain thirteen carousel images.');
for (const token of ['pilot-flow-evidence', 'Flow-control elements', 'Flow-control containers', 'Application example', 'Workflow anchors']) requireText(main, token, `Canvas evolution must expose reviewed narrative evidence: ${token}`);

const closingAssets = ['closing-illustration-light.png', 'closing-illustration-dark.png'];
for (const file of closingAssets) requireText(main, `images/wxo-canvas/public/${file}`, `Closing illustration must reference ${file}.`);
requireText(main, 'data-wxo-theme-image="closing-illustration"', 'Closing illustration must follow the selected Light or Dark theme.');
const close = main.match(/<section class="pilot-close"[\s\S]*?<\/section>/i)?.[0] ?? '';
if (count(close, /<img\b/gi) !== 1) fail('The closing section must render exactly one thematic illustration.');
forbid(close, /current-workflow|v2-workflow|form-workflow/i, 'The closing illustration must not repeat a workflow screenshot.');

const activeAssets = (manifest.assets ?? []).filter((asset) => asset.namespace === 'public-route' && asset.route === 'wxo-canvas.html');
if (activeAssets.length !== 26) fail('Public wxO provenance must retain twenty-six active public exports, including the closing Light/Dark illustration pair.');
if ((manifest.assets ?? []).filter((asset) => asset.route === 'source-only').length !== 18) fail('wxO provenance must retain eighteen retired derivatives as source-only history.');
for (const entry of activeAssets) {
  const assetPath = `images/wxo-canvas/public/${entry.file}`;
  if (!fs.existsSync(assetPath)) {
    fail(`Missing active public derivative: ${assetPath}`);
    continue;
  }
  const hasSourceRecord = /^\d+:\d+$/.test(entry.figmaNode ?? '')
    || (entry.sourceRecordType === 'owner-supplied-export-filename-and-sha256' && Boolean(entry.sourceFilename) && Boolean(entry.ownerExportContext));
  if (!entry.source || !entry.sourceSha256 || !entry.sha256 || !hasSourceRecord || !Array.isArray(entry.dimensions)) fail(`Incomplete active public provenance entry: ${entry.file}`);
  if (entry.sourceRecordType === 'owner-supplied-export-filename-and-sha256' && entry.sourceSha256 !== entry.sha256) fail(`Byte-preserved owner export must retain matching source and derivative hashes: ${entry.file}`);
  if (sha256(assetPath) !== entry.sha256) fail(`Active public derivative hash drift: ${entry.file}`);
  requireText(main, assetPath, `Canonical umbrella HTML must reference ${assetPath}.`);
}
for (const file of closingAssets) {
  const entry = activeAssets.find((asset) => asset.file === file);
  if (!entry) {
    fail(`Closing illustration provenance is missing: ${file}`);
    continue;
  }
  if (!entry.role?.includes('closing illustration') || !entry.treatment?.includes('byte-for-byte') || entry.sourceSha256 !== entry.sha256) {
    fail(`Closing illustration must record an exact authentic source copy: ${file}`);
  }
}

for (const selector of [
  '.pilot-hero',
  '.pilot-epic-container',
  '.pilot-flow-sequence',
  '.pilot-step-arrow',
  '.pilot-gallery-dialog',
  '.pilot-close-media',
  '@media (max-width: 720px)',
  'prefers-reduced-motion',
]) requireText(css, selector, `Canonical candidate CSS missing scoped layout or accessibility rule: ${selector}`);
forbid(css, /\.pilot-vignettes|\.pilot-main-illustration/, 'Retired opening/vignette layout rules must not remain in wxO CSS.');
forbid(css, /\.wxo-public-pilot \.pilot-story::before|\.wxo-public-pilot \.pilot-section::before|\.wxo-public-pilot \.pilot-section:not\(:first-child\)::after/,
  'Canonical candidate must not use the ambiguous decorative story spine, dots, or chapter chevrons.');
for (const token of ['--pilot-visual-overhang', '@media (min-width: 1440px)']) requireText(css, token, `Canonical candidate missing selective wide-screen evidence expansion: ${token}`);
for (const token of ['width: 5px', 'border-top: 0.9rem solid var(--pilot-green)', 'opacity: 1']) requireText(css, token, `Sequence connectors must use substantial directional arrows: ${token}`);
for (const token of ['.pilot-activity-frame .pilot-image-button', 'border-radius: 0.875rem', 'overflow: hidden']) requireText(css, token, `Outlined screen framing contract missing: ${token}`);
for (const token of ['.wxo-orbits', 'radial-gradient(circle at center', 'var(--wxo-orange)', 'var(--wxo-green)', 'var(--wxo-purple)']) requireText(css, token, `Original three-dot orbital treatment missing: ${token}`);
for (const token of ['overflow-wrap: anywhere', 'overflow-x: hidden', 'min-width: 0', 'flex: 0 0 48px']) requireText(css, token, `Long image-viewer headers need viewport-safe containment: ${token}`);
forbid(css, /(^|[}\s])(?:body|html|\.nav|\.footer)\s*\{/m, 'Canonical candidate stylesheet must not redefine shared shell selectors.');

const evidenceRule = css.match(/\.wxo-public-pilot \.pilot-evidence\s*\{([^}]*)\}/)?.[1] ?? '';
const evidenceImageRule = css.match(/\.wxo-public-pilot \.pilot-image-button img\s*\{([^}]*)\}/)?.[1] ?? '';
const storyRule = css.match(/\.wxo-public-pilot \.pilot-story\s*\{([^}]*)\}/)?.[1] ?? '';
const sectionHeadingRule = css.match(/\.wxo-public-pilot \.pilot-section-heading\s*\{([^}]*)\}/)?.[1] ?? '';
const bridgeRule = css.match(/\.wxo-public-pilot \.pilot-side-quest-bridge\s*\{([^}]*)\}/)?.[1] ?? '';
const activityRule = css.match(/\.wxo-public-pilot \.pilot-activity-epic\s*\{([^}]*)\}/)?.[1] ?? '';
const historyRule = css.match(/\.wxo-public-pilot \.pilot-history-canvas\s*\{([^}]*)\}/)?.[1] ?? '';
const canvasStackRule = css.match(/\.wxo-public-pilot \.pilot-canvas-media-stack\s*\{([^}]*)\}/)?.[1] ?? '';
if (!evidenceRule || !evidenceImageRule) fail('Canonical candidate must define explicit evidence and evidence-image rules.');
for (const [rule, declarations, label] of [
  [storyRule, ['width: min(100%, var(--max-w))', 'margin-inline: auto'], 'centered outer story rail'],
  [sectionHeadingRule, ['padding-inline: var(--page-x)'], 'chapter text rail'],
  [bridgeRule, ['padding-inline: var(--page-x)', 'grid-template-columns: minmax(230px, 0.29fr) minmax(0, 1fr)'], 'text-only feature-deep-dive bridge rail'],
  [activityRule, ['background: linear-gradient'], 'green User Activity story field'],
  [historyRule, ['padding: clamp(', 'border-radius: 0.875rem'], 'padded theme-aware Historical Canvas screen'],
  [canvasStackRule, ['display: grid', 'gap: clamp('], 'stacked Canvas media arrangement'],
]) {
  for (const declaration of declarations) requireText(rule, declaration, `Canonical candidate missing ${label}: ${declaration}`);
}
forbid(evidenceRule, /(?:border|background|box-shadow|border-radius)\s*:/i, 'Supplied evidence figures must not return to bordered or card-backed framing.');
for (const declaration of ['border: 0', 'border-radius: 0', 'box-shadow: none', 'object-fit: contain']) requireText(evidenceImageRule, declaration, `Supplied board presentation missing neutral framing rule: ${declaration}.`);
forbid(evidenceImageRule, /object-fit\s*:\s*cover/i, 'Supplied board derivatives must remain fully contained in the page and carousel.');
for (const token of ['--pilot-bridge-bleed', 'margin-inline: calc(-1 * var(--pilot-bridge-bleed))', '.pilot-gallery-layout', '.pilot-gallery-stage', '.pilot-gallery-details', 'object-fit: contain']) {
  requireText(css, token, `Canonical candidate missing retained bridge or gallery geometry: ${token}`);
}

const closeRule = css.match(/\.wxo-public-pilot \.pilot-close-media\s*\{([^}]*)\}/)?.[1] ?? '';
const closeImageRule = css.match(/\.wxo-public-pilot \.pilot-close-media img\s*\{([^}]*)\}/)?.[1] ?? '';
for (const declaration of ['margin: 0']) requireText(closeRule, declaration, `Closing media layout must retain ${declaration}.`);
for (const declaration of ['display: block', 'width: 100%', 'height: auto']) requireText(closeImageRule, declaration, `Closing illustration must retain complete-image geometry: ${declaration}.`);
forbid(closeImageRule, /object-fit\s*:\s*cover/i, 'Closing illustration must remain fully contained.');

if (!process.exitCode) console.log('PASS: canonical wxO public candidate source contract');
