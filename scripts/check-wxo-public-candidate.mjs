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

if (!fs.existsSync(htmlPath)) fail(`${htmlPath} must exist.`);
if (!fs.existsSync(cssPath)) fail(`${cssPath} must exist.`);
if (!fs.existsSync(manifestPath)) fail(`${manifestPath} must exist.`);
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
for (const file of ['15-node-key-states-dark.png', '16-node-size-variants-dark.png', '17-flow-control-elements-dark.png', '18-flow-control-containers-dark.png', '19-application-example-dark.png', '20-illustration-vignettes-dark.png', '21-workflow-anchors-dark.png']) requireText(main, file, `Canonical wxO narrative missing audited dark evidence ${file}.`);
forbid(main, /<video\b|<iframe\b/i, 'Canonical candidate must remain a static evidence narrative.');
forbid(main, /target="_blank"|Open full board/i, 'Evidence must open in the in-window carousel, not a new tab or repeated full-board action.');
requireText(html, 'data-wxo-gallery', 'Canonical candidate must provide the in-window evidence carousel.');
requireText(main, 'pilot-epic-container pilot-activity-epic', 'User Activity screens must share one annotated epic container.');
const activityStory = main.match(/pilot-activity-epic[\s\S]*?pilot-side-quest-bridge/i)?.[0] ?? '';
if (count(activityStory, /pilot-step-arrow/g) !== 2) {
  fail('User Activity must use two substantial progression arrows between its three numbered stages.');
}
requireText(main, 'pilot-side-quest-bridge', 'wxO umbrella must retain a visible Document Processing bridge.');
requireText(main, 'pilot-main-illustration', 'Canvas system must open with the prior main workflow illustration.');
requireText(main, 'pilot-canvas-opening', 'Canvas intro copy and main illustration must share one deliberate opening composition.');
requireText(main, '<div class="pilot-hero-aside"><div class="wxo-orbits" aria-hidden="true"><span></span><span></span><span></span></div>', 'Opening hero must restore the original three-dot orbital graphic.');
requireText(main, 'protected/wxo/images/current/01-skill-studio-main.png', 'Opening illustration must use the complete prior authored asset.');
requireText(main, 'pilot-bridge-thumbnail', 'Document Processing handoff must include an outlined screen thumbnail.');
requireText(main, 'href="document-processing.html"', 'wxO umbrella must link to the standalone Document Processing route.');
forbid(main, /pilot-doc-epic|pilot-doc-frame|id="document-processing"/i, 'wxO umbrella must not embed the full Document Processing arc.');
forbid(main, /accuracy improvement|efficiency improvement|adoption|customer impact|measured (?:improvement|increase|decrease|impact|result)/i,
  'Canonical candidate must not add unsupported outcome claims.');

if (count(main, /class="[^"]*\bpilot-evidence\b[^"]*"/gi) !== 15) fail('Canonical umbrella must contain fifteen evidence display units across the preserved evolution and revised supporting narrative.');
if (count(main, /class="[^"]*\bpilot-activity-frame\b[^"]*"/gi) !== 3) {
  fail('Canonical candidate must contain the three approved User Activity frames.');
}

requireText(main, 'pilot-flow-evidence', 'Canvas evolution must use the reviewed flow-control narrative group.');
if (count(main, /class="[^"]*\bpilot-expansion-frame\b[^"]*"/gi) !== 3) fail('Canonical candidate must preserve three Canvas evolution states.');
if (count(main, /data-wxo-evidence/gi) !== 15 || count(main, /<img\b/gi) !== 17) fail('Canonical umbrella must contain fifteen carousel images, one opening illustration, and one Document Processing handoff thumbnail.');
forbid(main, /src="protected\/wxo\/assets\/public-candidate\/13-floating-studies\.png"/i, 'The monolithic Floating Studies board must not remain in the rendered composition.');
forbid(main, /13b-flow-types\.png|13c-connector-mechanics\.png|pilot-study--types|pilot-study--connectors/i, 'Removed trailing Floating Studies must not remain rendered.');
for (const token of ['pilot-flow-evidence', 'Flow-control elements', 'Flow-control containers', 'Application example', 'Workflow anchors']) requireText(main, token, `Canvas evolution must expose reviewed narrative evidence: ${token}`);
if (!(main.indexOf('pilot-main-illustration') < main.indexOf('pilot-released-canvas') && main.indexOf('pilot-activity-epic') < main.indexOf('pilot-vignettes') && main.indexOf('pilot-vignettes') < main.indexOf('pilot-side-quest-bridge'))) {
  fail('Main illustration must open Canvas; wide centered vignettes must return after User Activity and before the route handoff.');
}

const expectedAssets = (manifest.assets ?? []).map((asset) => asset.file);
const manifestFiles = (manifest.assets ?? []).map((asset) => asset.file);
if (JSON.stringify(manifestFiles) !== JSON.stringify(expectedAssets)) {
  fail('Canonical candidate provenance manifest must retain legacy derivatives and list all twelve theme-sequence exports.');
}
if (manifest.status !== 'protected-preview-candidate' || manifest.publicationApproved !== false || manifest.commitApproved !== true || manifest.branchPushApproved !== true || manifest.protectedPreviewApproved !== true || manifest.productionApproved !== false || manifest.deliveryStatus !== 'protected-preview-candidate') {
  fail('Canonical provenance manifest must record branch-commit approval for the protected Preview without claiming public publication or production approval.');
}
if (!/Branch commit, branch push, and protected Preview are approved[\s\S]*Public publication, merge, and production release remain separate approval gates/.test(manifest.approvalScope ?? '')) {
  fail('Canonical provenance manifest must state the bounded Preview authorization scope.');
}
for (const entry of manifest.assets ?? []) {
  if (/^(?:[A-Za-z]:[\\/]|\/mnt\/|\/home\/)/.test(entry.source ?? '')) {
    fail(`Provenance source must be portable and must not expose an absolute local path: ${entry.file}`);
  }
  const assetPath = entry.namespace === 'theme-sequences'
    ? `protected/wxo/assets/theme-sequences/${entry.file}`
    : entry.namespace === 'public-images'
      ? `images/wxo-canvas/${entry.file}`
      : `protected/wxo/assets/public-candidate/${entry.file}`;
  if (!fs.existsSync(assetPath)) {
    fail(`Missing pilot derivative: ${assetPath}`);
    continue;
  }
  const hasSourceRecord = /^\d+:\d+$/.test(entry.figmaNode ?? '')
    || entry.figmaNode === 'source-export-frame-unrecorded'
    || (entry.sourceRecordType === 'owner-supplied-export-filename-and-sha256' && Boolean(entry.sourceFilename) && Boolean(entry.ownerExportContext));
  if (!entry.source || !entry.sourceSha256 || !entry.sha256 || !hasSourceRecord || !Array.isArray(entry.dimensions) || !['wxo-canvas.html', 'document-processing.html', 'source-only'].includes(entry.route)) {
    fail(`Incomplete provenance entry: ${entry.file}`);
  }
  if (entry.sourceRecordType === 'owner-supplied-export-filename-and-sha256' && entry.sourceSha256 !== entry.sha256) fail(`Byte-preserved owner export must retain matching source and derivative hashes: ${entry.file}`);
  if (sha256(assetPath) !== entry.sha256) fail(`Canonical candidate derivative hash drift: ${entry.file}`);
  if (entry.route === 'source-only' && !entry.retainedReason) fail(`Source-only provenance must state why its unrendered derivative is retained: ${entry.file}`);
  if (entry.namespace === 'theme-sequences' && (!entry.ownerExportContext || !entry.prototypeDataClassification?.includes('fictional'))) fail(`Theme-sequence provenance must retain owner-export context and fictional prototype-data classification: ${entry.file}`);
  if (entry.route !== 'wxo-canvas.html' || !main.includes(assetPath)) continue;
  requireText(main, assetPath, `Canonical umbrella HTML must reference ${assetPath}.`);
  if (entry.namespace === 'theme-sequences' || ['20-illustration-vignettes-dark.png', 'wxo-home-thumbnail-dark.png'].includes(entry.file)) continue;
  const escapedPath = assetPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const imageTag = main.match(new RegExp(`<img\\b[^>]*src=["']${escapedPath}["'][^>]*>`, 'i'))?.[0] ?? '';
  requireText(imageTag, `width="${entry.dimensions[0]}"`, `Canonical candidate HTML width must match ${entry.file}.`);
  requireText(imageTag, `height="${entry.dimensions[1]}"`, `Canonical candidate HTML height must match ${entry.file}.`);
}

for (const selector of [
  '.pilot-hero',
  '.pilot-system-grid',
  '.pilot-epic-container',
  '.pilot-flow-sequence',
  '.pilot-step-arrow',
  '.pilot-vignettes',
  '.pilot-expansion-grid',
  '.pilot-flow-control-composition',
  '.pilot-gallery-dialog',
  '@media (max-width: 720px)',
  'prefers-reduced-motion',
]) requireText(css, selector, `Canonical candidate CSS missing scoped layout or accessibility rule: ${selector}`);

forbid(css, /\.wxo-public-pilot \.pilot-story::before|\.wxo-public-pilot \.pilot-section::before|\.wxo-public-pilot \.pilot-section:not\(:first-child\)::after/,
  'Canonical candidate must not use the ambiguous decorative story spine, dots, or chapter chevrons.');

for (const token of ['--pilot-visual-overhang', '@media (min-width: 1440px)']) {
  requireText(css, token, `Canonical candidate missing selective wide-screen evidence expansion: ${token}`);
}
for (const selector of ['.pilot-vignettes', '.pilot-activity-epic', '.pilot-side-quest-bridge', '.pilot-expansion-grid']) {
  const wideRule = css.match(new RegExp(`\\.wxo-public-pilot \\${selector}\\s*\\{([^}]*)\\}`, 'g'));
  if (!wideRule?.length) fail(`Canonical candidate missing wide-screen composition rule for ${selector}`);
}

const evidenceRule = css.match(/\.wxo-public-pilot \.pilot-evidence\s*\{([^}]*)\}/)?.[1] ?? '';
const evidenceImageRule = css.match(/\.wxo-public-pilot \.pilot-image-button img\s*\{([^}]*)\}/)?.[1] ?? '';
const storyRule = css.match(/\.wxo-public-pilot \.pilot-story\s*\{([^}]*)\}/)?.[1] ?? '';
const sectionHeadingRule = css.match(/\.wxo-public-pilot \.pilot-section-heading\s*\{([^}]*)\}/)?.[1] ?? '';
const bridgeRule = css.match(/\.wxo-public-pilot \.pilot-side-quest-bridge\s*\{([^}]*)\}/)?.[1] ?? '';
const activityRule = css.match(/\.wxo-public-pilot \.pilot-activity-epic\s*\{([^}]*)\}/)?.[1] ?? '';
const releasedRule = css.match(/\.wxo-public-pilot \.pilot-released-canvas\s*\{([^}]*)\}/)?.[1] ?? '';
const vignetteRule = css.match(/\.wxo-public-pilot \.pilot-vignettes\s*\{([^}]*)\}/)?.[1] ?? '';
const mainIllustrationRule = css.match(/\.wxo-public-pilot \.pilot-main-illustration\s*\{([^}]*)\}/)?.[1] ?? '';
const canvasOpeningRule = css.match(/\.wxo-public-pilot \.pilot-canvas-opening\s*\{([^}]*)\}/)?.[1] ?? '';
const closeRule = css.match(/\.wxo-public-pilot \.pilot-close\s*\{([^}]*)\}/)?.[1] ?? '';
if (!evidenceRule || !evidenceImageRule) fail('Canonical candidate must define explicit evidence and evidence-image rules.');
for (const [rule, declarations, label] of [
  [storyRule, ['width: min(100%, var(--max-w))', 'margin-inline: auto'], 'centered outer story rail'],
  [sectionHeadingRule, ['padding-inline: var(--page-x)'], 'chapter text rail'],
  [bridgeRule, ['padding-inline: var(--page-x)', 'grid-template-columns: minmax(230px, 0.29fr) minmax(0, 1fr) minmax(220px, 0.72fr)'], 'feature-deep-dive bridge rail'],
  [activityRule, ['background: linear-gradient'], 'green User Activity story field'],
  [releasedRule, ['max-width: 980px', 'margin-inline: auto', 'border-radius: 0.875rem'], 'centered dark-only released-product screen'],
  [vignetteRule, ['width: 100%'], 'full evidence-rail vignette board'],
  [mainIllustrationRule, ['width: min(100%, 1024px)', 'margin-inline: auto'], 'centered native-scale opening illustration'],
  [canvasOpeningRule, ['display: grid', 'grid-template-columns: minmax(320px, 0.82fr) minmax(0, 1.18fr)'], 'side-by-side Canvas opening composition'],
  [closeRule, ['padding-inline: var(--page-x)'], 'closing text rail'],
]) {
  for (const declaration of declarations) requireText(rule, declaration, `Canonical candidate missing ${label}: ${declaration}`);
}
for (const token of ['--pilot-bridge-bleed', 'margin-inline: calc(-1 * var(--pilot-bridge-bleed))']) {
  requireText(css, token, `Document Processing route handoff must use a full-span field: ${token}`);
}
for (const token of ['width: calc(100% + (2 * var(--pilot-visual-overhang)))', 'margin-inline: calc(-1 * var(--pilot-visual-overhang))']) {
  requireText(css, token, `Wide illustration vignette must expand symmetrically around the centered story rail: ${token}`);
}
for (const token of ['width: 5px', 'border-top: 0.9rem solid var(--pilot-green)', 'opacity: 1']) {
  requireText(css, token, `Sequence connectors must use substantial directional arrows: ${token}`);
}
for (const token of ['.pilot-activity-frame .pilot-image-button', '.pilot-bridge-thumbnail', 'border-radius: 0.875rem', 'overflow: hidden']) {
  requireText(css, token, `Outlined screen framing contract missing: ${token}`);
}
for (const token of ['.pilot-evolution-primary', 'grid-column: 2 / 12', '.pilot-study--nodes']) {
  requireText(css, token, `Canvas evolution composition missing centered primary or orbiting study treatment: ${token}`);
}
for (const token of ['.wxo-orbits', 'radial-gradient(circle at center', 'var(--wxo-orange)', 'var(--wxo-green)', 'var(--wxo-purple)']) {
  requireText(css, token, `Original three-dot orbital treatment missing: ${token}`);
}
for (const token of ['overflow-wrap: anywhere', 'overflow-x: hidden', 'min-width: 0', 'flex: 0 0 48px']) {
  requireText(css, token, `Long image-viewer headers need viewport-safe containment: ${token}`);
}
forbid(css, /\.pilot-study--types|\.pilot-study--connectors/, 'Removed trailing Floating Studies must not retain layout rules.');
forbid(css, /\.pilot-step-arrow--long\s*\{/, 'Shared evidence CSS must not retain the clipped long-arrow exception.');
for (const token of ['.pilot-bridge-copy a:hover', '.pilot-bridge-thumbnail:hover', 'transform: translateX(0.3rem)']) {
  requireText(css, token, `Document Processing handoff links need a visible hover response: ${token}`);
}
forbid(evidenceRule, /(?:border|background|box-shadow|border-radius)\s*:/i,
  'Supplied evidence figures must not return to bordered or card-backed framing.');
for (const declaration of ['border: 0', 'border-radius: 0', 'box-shadow: none', 'object-fit: contain']) {
  requireText(evidenceImageRule, declaration, `Supplied board presentation missing neutral framing rule: ${declaration}`);
}
forbid(evidenceImageRule, /object-fit\s*:\s*cover/i,
  'Supplied board derivatives must remain fully contained in the page and carousel.');
for (const cropped of ['02-component-showcase.png', '07-agent-orchestration-light.png', '08-flow-control-elements-light.png', '14-workflow-detail.png']) {
  const entry = manifest.assets.find((asset) => asset.file === cropped);
  if (!entry?.treatment?.includes('removes only the repeated Carbon Flow System navigation header')) {
    fail(`Canonical derivative must disclose the bounded Carbon Flow System header crop: ${cropped}`);
  }
}
forbid(css, /(^|[}\s])(?:body|html|\.nav|\.footer)\s*\{/m,
  'Canonical candidate stylesheet must not redefine shared shell selectors.');

if (!process.exitCode) console.log('PASS: canonical wxO public candidate source contract');
