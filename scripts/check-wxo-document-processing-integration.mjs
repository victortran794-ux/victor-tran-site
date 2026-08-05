import fs from 'node:fs';
import crypto from 'node:crypto';

const read = (path) => fs.readFileSync(path, 'utf8');
const fail = (message) => { console.error(`FAIL: ${message}`); process.exitCode = 1; };
const requireText = (text, value, message) => { if (!text.includes(value)) fail(message); };
const forbid = (text, pattern, message) => { if (pattern.test(text)) fail(message); };
const count = (text, pattern) => [...text.matchAll(pattern)].length;
const sha256 = (path) => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const mainHtml = (html) => html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? '';

const wxoPath = 'wxo-canvas.html';
const docPath = 'document-processing.html';
if (!fs.existsSync(wxoPath)) fail('wxo-canvas.html must exist as the protected local umbrella candidate.');
if (!fs.existsSync(docPath)) fail('document-processing.html must exist.');
if (process.exitCode) process.exit(1);

const wxo = read(wxoPath);
const doc = read(docPath);
const sitemap = read('sitemap.xml');
const robots = read('robots.txt');
const projects = JSON.parse(read('data/projects.json'));
const exportPolicy = JSON.parse(read('data/content-export-policy.json'));
const shellConfig = JSON.parse(read('data/site-shell.json'));
const workflowCss = read('css/wxo-workflows-vico2.css');
const passwordGate = read('js/password-gate.js');
const healthWorkflow = read('.github/workflows/health-check.yml');
const vercel = JSON.parse(read('vercel.json'));

const documentProcessingRedirect = vercel.redirects?.find((rule) => rule.source === '/document-processing');
if (!documentProcessingRedirect || documentProcessingRedirect.destination !== '/wxo-canvas#document-processing' || documentProcessingRedirect.permanent !== true) {
  fail('Vercel must permanently retire /document-processing into the wxO Document Processing chapter.');
}

for (const value of [
  "const PROTECTED_HASH_STATE = 'vtdProtectedHash'",
  'history.replaceState(stateWithoutProtectedHash()',
  "window.dispatchEvent(new HashChangeEvent('hashchange'",
  "input.focus({ preventScroll: true })",
]) requireText(passwordGate, value, `Shared password gate missing protected deep-link behavior: ${value}`);

for (const path of [
  'vercel.json',
  'scripts/check-wxo-document-processing-integration.mjs',
  'scripts/check-wxo-document-processing-browser.mjs',
]) {
  if (count(healthWorkflow, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) < 2) {
    fail(`Health-check workflow must watch ${path} for push and pull requests.`);
  }
}
requireText(healthWorkflow, 'npm run check:wxo-document-processing', 'Health-check workflow must run the wxO and Document Processing source contract.');
requireText(healthWorkflow, 'npm run check:wxo-document-processing-browser', 'Health-check workflow must run the locked deep-link browser regression.');

for (const [name, html] of [['IBM watsonX Orchestrate', wxo], ['Document Processing', doc]]) {
  requireText(html, 'sessionStorage.getItem(\'vtd-unlock\')', `${name} must preserve the session-only password gate.`);
  requireText(html, 'css/password-gate.css', `${name} must preserve the shared password-gate stylesheet.`);
  requireText(html, 'js/password-gate.js', `${name} must preserve the shared password-gate script.`);
  requireText(html, 'noindex,nofollow,noarchive,nosnippet,noimageindex', `${name} must preserve the full protected robots policy.`);
  requireText(html, '<!-- generated:site-shell-header:start -->', `${name} must use the generated shared header.`);
  requireText(html, '<!-- generated:site-shell-footer:start -->', `${name} must use the generated shared footer.`);
  requireText(html, 'id="main-content" tabindex="-1"', `${name} must preserve the shared focus target.`);
  requireText(html, 'class="site-route-status"', `${name} must show the protected-route status.`);
  requireText(html, '<meta property="og:image" content="https://www.victortrandesign.com/images/hero-vic.jpg">', `${name} must not advertise protected story media through Open Graph metadata.`);
  forbid(html, /fonts\.googleapis|fonts\.gstatic|_vercel\/insights|_vercel\/speed-insights/i, `${name} must use local/system assets only.`);
  forbid(html, /password\s*[=:]\s*["'][^"']+/i, `${name} must not embed a password or gate value.`);
  forbid(mainHtml(html), /—/, `${name} primary copy must not use em dashes.`);
  forbid(mainHtml(html), /:[A-Za-z]/, `${name} primary copy contains a colon without following whitespace.`);
}

forbid(sitemap, /wxo-canvas|document-processing/i, 'Both protected routes must remain omitted from sitemap.xml.');
for (const route of ['/wxo-canvas', '/wxo-canvas.html', '/document-processing', '/document-processing.html']) {
  requireText(robots, `Disallow: ${route}`, `robots.txt must disallow ${route}.`);
}
const index = read('index.html');
requireText(index, 'href="wxo-canvas.html"', 'The public homepage must link to the protected wxO gate.');
forbid(index, /<a href="document-processing\.html" class="featured-item/i, 'Document Processing must not remain a standalone homepage card.');

const documentProject = projects.projects.find((project) => project.slug === 'document-processing');
if (!documentProject || documentProject.protected !== true || documentProject.noindex !== true || documentProject.sitemap !== false || documentProject.homepage !== false || documentProject.nav !== false) {
  fail('Document Processing must remain protected and hidden from homepage and primary navigation.');
}
const wxoProject = projects.projects.find((project) => project.slug === 'wxo-canvas');
if (!wxoProject || wxoProject.protected !== true || wxoProject.noindex !== true || wxoProject.sitemap !== false || wxoProject.homepage !== true || wxoProject.nav !== true || wxoProject.homepageOverlay !== true) {
  fail('wxO Canvas must be the protected public-gate entry and single homepage overlay project.');
}
const protectedEntries = new Map(exportPolicy.protectedPages.map((entry) => [entry.source, entry]));
for (const source of ['wxo-canvas.html', 'document-processing.html']) {
  const entry = protectedEntries.get(source);
  if (!entry || entry.provisional) fail(`${source} must be an active non-provisional protected export.`);
}
if (!shellConfig.pages.includes('wxo-canvas.html')) fail('wxO Canvas must be governed by the shared-shell generator.');
requireText(workflowCss, "html[data-theme='dark'] .workflow-pages", 'Workflow styles must define dark-theme project tokens.');
requireText(workflowCss, '--doc-blue: #78a9ff', 'Document Processing must use the contrast-safe dark-theme blue token.');
requireText(workflowCss, '.wxo-doc-meta {', 'The consolidated Document Processing summary must have scoped spacing.');
requireText(workflowCss, '.wxo-doc-outcome {', 'The consolidated Document Processing outcome must have scoped separation.');
requireText(workflowCss, '.wxo-page .site-route-status {', 'The wxO protected status must scroll with the page instead of covering chapter content.');

for (const text of [
  'IBM watsonX Orchestrate · 2024–present',
  'Agentic workflow canvas.',
  'Document Processing is a focused chapter',
  'released in July 2026',
  'Make the trust loop visible.',
  'Classifier + Extractor specifications',
  'HITL + shared patterns',
  'Evaluation direction · released July 2026',
  'classify → extract → review → evaluate → improve',
  'I joined the work in 2025',
  'lead designer for Accuracy Evaluation',
  'Canvas 1',
  'no shipment claim',
  'Product design, systems, specifications',
  'href="#canvas"',
  'href="#document-processing"',
]) requireText(wxo, text, `wxO Canvas missing required source-safe phrase: ${text}`);

for (const asset of [
  'canvas1-flow-controls-sanitized.png',
  'canvas1-connectors-sanitized.png',
  'doc-pro-evaluation-loop-sanitized.webm',
  'doc-pro-evaluation-loop-sanitized.mp4',
  'doc-pro-poster-sanitized.png',
  '01-select-training-documents-sanitized.png',
  '02-review-and-correct-sanitized.png',
  '03-evaluation-details-sanitized.png',
]) requireText(wxo, asset, `wxO Canvas missing approved derivative ${asset}`);

forbid(wxo, /href="document-processing\.html"/i, 'The wxO chapter must not link out to the retired standalone Document Processing story.');
if (count(wxo, /class="doc-loop-item"/gi) !== 5) fail('The wxO Document Processing chapter must show all five trust-loop steps.');
if (count(wxo, /class="doc-story-frame/gi) !== 3) fail('The wxO Document Processing chapter must show the three approved storyboard frames.');
if (count(wxo, /class="doc-decision-card/gi) !== 4) fail('The wxO Document Processing chapter must show four bounded product decisions.');
if (count(wxo, /class="doc-role-card/gi) !== 4) fail('The wxO Document Processing chapter must show four bounded contribution cards.');

forbid(wxo, /Canvas Future|future-(inventory|builder|debug)-sanitized/i, 'Future-state material must remain withheld from the ordinary protected page.');
for (const asset of [
  'images/wxo-canvas/future-inventory-sanitized.png',
  'images/wxo-canvas/future-builder-sanitized.png',
  'images/wxo-canvas/future-debug-sanitized.png',
]) {
  if (fs.existsSync(asset)) fail(`Withheld future-state asset must not remain in the public repository: ${asset}.`);
}

const expectedWxoAssets = {
  'images/wxo-canvas/canvas1-connectors-sanitized.png': 'ef582f1b925602c4c54b783ce636acdc7ecd8cb32fa4f2692dbe61cbc31b7443',
  'images/wxo-canvas/canvas1-flow-controls-sanitized.png': 'c6c44d358e660055b1f47dfedb1872286500e334d2494f1dfd1fd3058fbad8d9',
  'images/wxo-canvas/document-processing-storyboard.png': '758d72c025a02073d5aa427a3ed7d855412284a3e9389c6c0f78b9415c5aac08',
  'images/wxo-canvas/wxo-home-thumbnail.png': '690c128b97bb004151c496025857ceaa7d88a50fdd81aeae37125689d05502ee',
};
for (const [asset, expected] of Object.entries(expectedWxoAssets)) {
  if (!fs.existsSync(asset)) fail(`Missing approved wxO derivative ${asset}.`);
  else if (sha256(asset) !== expected) fail(`Approved wxO derivative changed: ${asset}.`);
}

if (count(wxo, /<img\b/gi) !== 6) fail('wxO Canvas must use exactly six images: shared nav image, two Canvas derivatives, and three Document Processing frames.');
forbid(wxo, /accuracy improvement|efficiency improvement|adoption|customer impact|Canvas 1 shipped|Canvas Future shipped|measured outcome/i, 'wxO Canvas must not claim unsupported shipment, adoption, or outcomes.');

for (const text of [
  'Make the trust loop visible.',
  'Product design · 2025–2026',
  'Classifier + Extractor specifications',
  'HITL + shared patterns',
  'Evaluation direction · released July 2026',
  'classify → extract → review → evaluate → improve',
  'I joined the work in 2025',
  'lead designer for Accuracy Evaluation',
]) requireText(doc, text, `Document Processing missing required source-safe phrase: ${text}`);

for (const asset of [
  'doc-pro-evaluation-loop-sanitized.webm',
  'doc-pro-evaluation-loop-sanitized.mp4',
  'doc-pro-poster-sanitized.png',
  '01-select-training-documents-sanitized.png',
  '02-review-and-correct-sanitized.png',
  '03-evaluation-details-sanitized.png',
]) requireText(doc, asset, `Document Processing missing approved sanitized evidence ${asset}`);

const expectedDocumentAssets = {
  'assets/document-processing/media/doc-pro-evaluation-loop-sanitized.webm': '472376539f7fe8c8b10d1f8fe480b1052f95f6b5a8fadbeb16954396ceb4626e',
  'assets/document-processing/media/doc-pro-evaluation-loop-sanitized.mp4': '1c41a0dffbfc0fb40c65c86cba37d9f9a7d19235ec3f14a395669fdbac749867',
  'assets/document-processing/media/doc-pro-poster-sanitized.png': 'f4e01d2d8c3665321cf53c6ba2f902182062da6485e03994bf44e12bfbab8b45',
  'assets/document-processing/storyboard/01-select-training-documents-sanitized.png': '74078eb8e24ee8fd26de7a75d00b464c358a7d57fa18241c417fa6aa5e71dd8c',
  'assets/document-processing/storyboard/02-review-and-correct-sanitized.png': 'f4e01d2d8c3665321cf53c6ba2f902182062da6485e03994bf44e12bfbab8b45',
  'assets/document-processing/storyboard/03-evaluation-details-sanitized.png': 'e60feb0d7b7de1105e2b40d640598d2a81250d48effd60747fd05e105589f1b9',
};
for (const [asset, expected] of Object.entries(expectedDocumentAssets)) {
  if (!fs.existsSync(asset)) fail(`Missing approved Document Processing evidence ${asset}.`);
  else if (sha256(asset) !== expected) fail(`Approved Document Processing evidence changed: ${asset}.`);
}

forbid(doc, /document-processing-[^"']*-placeholder\.png/i, 'Document Processing must not retain placeholder image media.');
forbid(doc, /planned for the second half of 2026|hundreds|thousands|70%|90%|less than 5%|customer-validated|accelerat(?:e|ed).*month|100% complete|in production/i, 'Document Processing must not retain superseded or unsupported scale/outcome language.');
forbid(doc, /I owned as the lead designer|I designed the evaluation layer that helped builders|gave builders a structured way/i, 'Document Processing must avoid sole-ownership or unverified outcome phrasing.');

if (process.exitCode) process.exit(1);
console.log('WXO CANVAS + DOCUMENT PROCESSING SPRINT CONTRACT: PASS');
console.log(`wxo_images=${count(wxo, /<img\b/gi)} doc_images=${count(doc, /<img\b/gi)} doc_videos=${count(doc, /<video\b/gi)}`);
