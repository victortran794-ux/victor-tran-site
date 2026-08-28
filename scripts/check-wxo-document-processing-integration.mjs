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
const workflowJs = read('js/wxo-workflows-vico2.js');
const accessGate = read('wxo-access.html');
const accessFunction = read('api/wxo-access.mjs');
const protectedAccess = read('lib/protected-access.mjs');
const protectedMiddleware = read('lib/protected-middleware.mjs');
const middleware = read('middleware.ts');
const healthWorkflow = read('.github/workflows/health-check.yml');
const vercel = JSON.parse(read('vercel.json'));
const deployIgnore = read('.vercelignore');
const v2ManifestPath = 'data/wxo-canvas-v2-provenance.json';
if (fs.existsSync('assets/wxo-canvas-future')) fail('Retired Future Canvas media must not remain in the deployable asset tree.');
if (fs.existsSync('data/wxo-canvas-future-provenance.json')) fail('Retired separate-source Future Canvas provenance must not remain active beside the canonical V1/V2 ledger.');
requireText(deployIgnore, 'data/', 'Repository-only wxO provenance must remain excluded from deployment.');

if (vercel.redirects?.some((rule) => rule.source === '/document-processing')) {
  fail('Document Processing redirect must remain behind middleware authorization.');
}
requireText(middleware, "matcher: ['/:path*']", 'Routing Middleware must inspect every request so encoded protected paths cannot bypass authorization.');
for (const value of ['WXO_SESSION_SECRET', 'handleProtectedRequest', 'next', 'rewrite']) {
  requireText(middleware, value, `Routing Middleware missing server boundary marker: ${value}`);
}
for (const value of ['WXO_PASSWORD_VERIFIER', 'WXO_SESSION_SECRET', "SameSite=Lax", "HttpOnly", "Secure", "request.headers.get('origin')"]) {
  requireText(accessFunction, value, `Server login function missing security marker: ${value}`);
}
requireText(protectedAccess, "export const COOKIE_NAME = '__Host-wxo'", 'Protected session must use a host-only cookie name.');
forbid(protectedMiddleware, /location:\s*['"]\/wxo-canvas#document-processing['"]/u, 'Authorized Document Processing must not redirect back to the retired Canvas hash.');
requireText(protectedMiddleware, "? '/document-processing'", 'Anonymous Document Processing access must preserve the standalone route through the gate.');
requireText(accessFunction, "return candidate;", 'Server login must preserve a safe standalone Document Processing destination.');
requireText(accessGate, 'action="/api/wxo-access"', 'Public access gate must post to the server login function.');
forbid(accessGate, /wxo-workflows-vico2|protected\/wxo\/|images\/wxo-canvas\/current|assets\/document-processing/i, 'Public access gate must not reference protected content or route-specific assets.');
if (fs.existsSync('js/password-gate.js')) fail('Retired client-side password verifier must not remain deployable.');

requireText(healthWorkflow, "needs.changes.outputs.wxo == 'true'", 'Health-check workflow must scope wxO and Document Processing through classifier ownership.');
requireText(healthWorkflow, "needs.changes.outputs.shared == 'true'", 'Health-check workflow must include shared-shell changes in protected-route validation.');
requireText(healthWorkflow, 'npm run check:wxo-document-processing', 'Health-check workflow must run the wxO and Document Processing source contract.');
requireText(healthWorkflow, 'node scripts/check-wxo-public-candidate.mjs', 'Health-check workflow must run the canonical wxO candidate and provenance contract.');
requireText(healthWorkflow, 'node scripts/check-wxo-route-split.mjs', 'Health-check workflow must run the wxO route-split contract.');
requireText(healthWorkflow, 'npm run check:wxo-document-processing-browser', 'Health-check workflow must run the locked deep-link browser regression.');

for (const [name, html] of [['IBM watsonx Orchestrate', wxo], ['Document Processing', doc]]) {
  forbid(html, /sessionStorage\.getItem\(['"]vtd-unlock|js\/password-gate\.js/i, `${name} must not contain browser-side authorization logic.`);
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
requireText(index, 'href="wxo-canvas.html?lock=1"', 'The public homepage must force a fresh protected wxO gate.');
forbid(index, /<a href="document-processing\.html" class="featured-item/i, 'Document Processing must not remain a standalone homepage card.');

const documentProject = projects.projects.find((project) => project.slug === 'document-processing');
if (!documentProject || documentProject.protected !== true || documentProject.noindex !== true || documentProject.sitemap !== false || documentProject.homepage !== false || documentProject.nav !== false) {
  fail('Document Processing must remain protected and hidden from homepage and primary navigation.');
}
const wxoProject = projects.projects.find((project) => project.slug === 'wxo-canvas');
if (!wxoProject || wxoProject.entryUrl !== 'wxo-canvas.html?lock=1' || wxoProject.protected !== true || wxoProject.noindex !== true || wxoProject.sitemap !== false || wxoProject.homepage !== true || wxoProject.nav !== true || wxoProject.homepageOverlay !== true) {
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

requireText(workflowCss, '.workflow-companion-link a {', 'Standalone route must style its return link.');
for (const token of ['.workflow-companion-link a:hover', 'transform: translateX(0.3rem)']) requireText(workflowCss, token, `Return-to-Canvas link needs a visible hover response: ${token}`);
requireText(doc, 'class="workflow-return-link"', 'Standalone route must provide a final return-to-Canvas action after the closing statement.');
if (count(mainHtml(doc), /href="wxo-canvas\.html"/gi) !== 2) fail('Document Processing must provide both opening and end-of-page return paths to Canvas.');
for (const token of ['.workflow-return-link {', '.workflow-return-link:hover', 'transform: translateX(0.3rem)']) requireText(workflowCss, token, `Final return-to-Canvas action needs a visible hover response: ${token}`);
requireText(workflowCss, '.doc-processing-page .site-route-status {', 'The wxO and Document Processing pages must hide the redundant protected-status note.');
requireText(workflowCss, 'display: none;', 'The redundant protected-status note must not render.');
requireText(workflowCss, '.doc-motion-toggle {', 'The autoplay journey must expose a visible pause control.');
requireText(workflowCss, '.doc-current-story {', 'The current Document Processing evidence story must have a scoped layout.');
requireText(workflowCss, '.doc-current-stage {', 'Each current Document Processing stage must have a scoped layout.');
for (const token of ['border-radius: 0.875rem', 'overflow: hidden', '.doc-current-pair,', 'margin-right: calc(-1 * var(--pilot-visual-overhang))']) {
  requireText(workflowCss + read('css/wxo-public-candidate.css'), token, `Document Processing screen-frame and wide-pair contract missing: ${token}`);
}
requireText(workflowJs, "document.querySelectorAll('[data-doc-motion-toggle]')", 'The autoplay journey pause control must be wired in the scoped workflow script.');

// Canonical-local wxO public-candidate narrative.
for (const value of [
  '<link rel="stylesheet" href="css/wxo-public-candidate.css">',
  '<script src="js/wxo-public-candidate.js" defer></script>',
  'A shared visual language for agentic workflows.',
  'I evolved an inherited Flow Builder toward a more robust, Carbon-aligned canvas system for automation, agentic work, and human tasks.',
  'Make complex workflows easier to read.',
  'Nodes, connectors, flow controls, and user activities share a consistent grammar across the builder.',
  'User activities stay connected to the canvas.',
  'Canvas evolution',
  'A visual system that kept expanding.',
  'I also supported the agent canvas vision',
  'Feature deep dive',
  'Document Processing needed its own trust loop.',
  'Developed in parallel with the broader canvas work',
  'One system for automation, specialized work, and human judgment.',
]) requireText(wxo, value, `Canonical wxO candidate missing approved marker: ${value}`);

if (count(wxo, /protected\/wxo\/assets\/public-candidate\//gi) !== 11) fail('Canonical-local wxO umbrella must keep ten carousel sources plus one handoff thumbnail under guarded delivery until publication approval.');
forbid(wxo, /<video\b|<iframe\b/i, 'Canonical wxO candidate must remain a static evidence narrative.');
forbid(mainHtml(wxo), /target="_blank"|Open full board/i, 'Canonical evidence must use the in-window carousel instead of new tabs.');
requireText(wxo, 'data-wxo-gallery', 'Canonical wxO candidate must provide the in-window evidence carousel.');
requireText(wxo, 'pilot-epic-container pilot-activity-epic', 'Canonical User Activity evidence must share one epic container.');
requireText(wxo, 'pilot-side-quest-bridge', 'Canonical wxO umbrella must provide the Document Processing bridge.');
forbid(mainHtml(wxo), /pilot-doc-epic|pilot-doc-frame|id="document-processing"/i, 'Canonical wxO umbrella must not embed the full Document Processing arc.');
forbid(wxo, /wxo-workflows-vico2\.css|wxo-workflows-vico2\.js/i, 'Canonical wxO candidate must not load retired route-specific runtime or archive styling.');
forbid(wxo, /V2 system evolution|V2 authored exploration|Visual system in motion|prototype sequence|Canvas Future/i, 'Canonical wxO candidate must not expose retired V2, motion-prototype, or Canvas Future framing.');
forbid(wxo, /accuracy improvement|efficiency improvement|adoption|customer impact|measured (?:improvement|increase|decrease|impact|result)/i, 'Canonical wxO candidate must not add unsupported outcome claims.');
forbid(mainHtml(wxo), /—/, 'Canonical wxO candidate primary copy must not use em dashes.');
if (count(wxo, /class="[^"]*\bpilot-evidence\b[^"]*"/gi) !== 10) fail('Canonical wxO umbrella must contain exactly ten evidence units.');
if (count(wxo, /class="[^"]*\bpilot-activity-frame\b[^"]*"/gi) !== 3) fail('Canonical wxO candidate must contain three User Activity frames.');
if (count(wxo, /class="[^"]*\bpilot-expansion-frame\b[^"]*"/gi) !== 4) fail('Canonical wxO candidate must contain four Canvas evolution studies.');
if (count(mainHtml(wxo), /<img\b/gi) !== 12) fail('Canonical wxO umbrella must contain ten carousel images, one opening illustration, and one handoff thumbnail inside main.');

const candidateManifestPath = 'data/wxo-canvas-public-provenance.json';
const candidateFiles = [
  '01-released-canvas.png',
  '02-component-showcase.png',
  '03-user-activity-workflow.png',
  '04-user-activity-configuration.png',
  '05-user-activity-summary.png',
  '06-illustration-vignettes.png',
  '09-document-classify.png',
  '10-document-extract.png',
  '11-document-review.png',
  '12-document-evaluate.png',
  '07-agent-orchestration-light.png',
  '14-workflow-detail.png',
  '13a-node-states.png',
  '08-flow-control-elements-light.png',
  '13b-flow-types.png',
  '13c-connector-mechanics.png',
  '13-floating-studies.png',
];
if (!fs.existsSync(candidateManifestPath)) fail('Repository-only canonical wxO candidate provenance must exist.');
else {
  const candidateManifest = JSON.parse(read(candidateManifestPath));
  if (candidateManifest.status !== 'production-release-approved' || candidateManifest.canonicalMigrationApproved !== true || candidateManifest.publicationApproved !== true || candidateManifest.commitApproved !== true || candidateManifest.productionApproved !== true) {
    fail('Canonical wxO candidate provenance must preserve the approved canonical migration and production release gates.');
  }
  if (JSON.stringify((candidateManifest.assets ?? []).map((entry) => entry.file)) !== JSON.stringify(candidateFiles)) {
    fail('Canonical wxO candidate provenance must list fourteen routed derivatives plus three retained source-only studies.');
  }
  for (const entry of candidateManifest.assets ?? []) {
    const assetPath = `protected/wxo/assets/public-candidate/${entry.file}`;
    if (!entry.source || !entry.sourceSha256 || !entry.sha256 || !entry.figmaNode || !Array.isArray(entry.dimensions) || !['wxo-canvas.html', 'document-processing.html', 'source-only'].includes(entry.route)) fail(`Incomplete canonical wxO candidate provenance: ${entry.file}`);
    if (!fs.existsSync(assetPath)) fail(`Missing canonical wxO candidate derivative: ${assetPath}`);
    else if (sha256(assetPath) !== entry.sha256) fail(`Canonical wxO candidate derivative hash drift: ${entry.file}`);
    if (entry.route === 'source-only') continue;
    const routeHtml = entry.route === 'wxo-canvas.html' ? wxo : doc;
    requireText(routeHtml, assetPath, `${entry.route} missing routed candidate asset ${assetPath}.`);
    requireText(routeHtml, `width="${entry.dimensions[0]}" height="${entry.dimensions[1]}"`, `${entry.route} dimensions must match ${entry.file}.`);
  }
}
if (fs.existsSync('protected/wxo/assets/public-candidate/manifest.json')) fail('Detailed canonical wxO provenance must remain outside the guarded image namespace.');
requireText(deployIgnore, 'data/', 'Canonical wxO candidate provenance must remain excluded from deployment.');
requireText(wxo, '<meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex">', 'Canonical wxO candidate must remain protected and noindex until publication approval.');
requireText(wxo, 'class="site-route-status"', 'Canonical wxO candidate must preserve the protected-route shell marker.');

for (const text of [
  'Make the trust loop visible.',
  'Product design · 2025–2026',
  'Classifier + Extractor specifications',
  'Human-in-the-loop shared patterns',
  'Evaluation direction · released July 2026',
  'I joined the work in 2025',
  'lead designer for Accuracy Evaluation',
  'Interface details use fictional sample data and are shown as design examples, not measured outcomes.',
]) requireText(doc, text, `Document Processing missing required source-safe phrase: ${text}`);

for (const text of [
  'Developed in parallel with the broader canvas work',
  'pilot-epic-container pilot-doc-epic',
  'Later phase · Evaluate',
  'data-wxo-gallery',
]) requireText(doc, text, `Standalone Document Processing feature arc missing: ${text}`);
if (count(mainHtml(doc), /data-wxo-evidence/gi) !== 4) fail('Standalone Document Processing must contain four feature-arc carousel triggers.');

forbid(doc, /Evidence boundary:/i, 'Document Processing must not repeat evidence-boundary callouts.');
forbid(doc, /Protected private candidate|local sanitized assets|source-backed|no shipment claim|no public implementation authorized|Current Figma source\. Fictional prototype data shown|(?:alt|aria-label)="Sanitized/i, 'Document Processing viewer-facing copy must not expose internal release-gate language.');
requireText(doc, '<video autoplay muted loop playsinline', 'Document Processing journey must autoplay silently and loop.');
requireText(doc, 'data-doc-motion-toggle', 'Document Processing journey must provide a pause control.');
requireText(doc, '<script src="js/wxo-workflows-vico2.js" defer></script>', 'Document Processing must load the scoped workflow behavior.');
forbid(doc, /<video[^>]*\bcontrols\b/i, 'Document Processing journey must not require manual playback controls.');
if (count(doc, /class="doc-story-grid/gi) !== 0) fail('The redundant standalone Document Processing storyboard must be removed.');

for (const asset of [
  'doc-pro-evaluation-loop-sanitized.webm',
  'doc-pro-evaluation-loop-sanitized.mp4',
  'doc-pro-poster-sanitized.png',
  'classify-suggested-sanitized.png',
  'extract-field-sanitized.png',
  'extract-error-sanitized.png',
  'review-table-sanitized.png',
  'review-verified-sanitized.png',
  'evaluate-rerun-sanitized.png',
  'evaluate-test-set-sanitized.png',
  'evaluate-results-sanitized.png',
  'evaluate-indicators-sanitized.png',
]) requireText(doc, asset, `Document Processing missing approved sanitized evidence ${asset}`);
if (count(doc, /class="doc-current-stage"/gi) !== 4) fail('Document Processing must show four current evidence stages.');
if (count(doc, /class="doc-current-frame"/gi) !== 9) fail('Document Processing must show nine curated current Figma frames.');
if (count(doc, /class="doc-current-stage-head"/gi) !== 4) fail('Standalone current stage headers must stay compact and text-light.');
requireText(doc, 'class="doc-current-evaluator-grid"', 'The standalone Evaluate finale must use a distinct four-screen grid.');
forbid(doc, /doc-ending|doc-decision-row|doc-contribution-row|The screens carry the story|02 \/ Decisions \+ contribution/i, 'Redundant website-only decisions and contribution chapter must be removed.');
forbid(doc, /pilot-step-arrow--long/, 'The final Document Processing arrow must use the same contained geometry as the earlier arrows.');
forbid(doc, /doc-loop-title|class="doc-loop|class="doc-decision-grid|class="workflow-role-grid"|classify → extract → review → evaluate → improve/i, 'The redundant trust-loop and card-heavy ending must be removed from Document Processing.');
forbid(doc, /classify-mapping-sanitized\.png|>Data mapping</i, 'The redundant classifier data-mapping screen must be removed.');
forbid(doc, /03-evaluation-details-sanitized\.png|class="doc-evaluation-specimen"/i, 'Document Processing must replace the superseded one-off evaluation specimen.');

const expectedDocumentAssets = {
  'protected/wxo/assets/document-processing/media/doc-pro-evaluation-loop-sanitized.webm': '472376539f7fe8c8b10d1f8fe480b1052f95f6b5a8fadbeb16954396ceb4626e',
  'protected/wxo/assets/document-processing/media/doc-pro-evaluation-loop-sanitized.mp4': '1c41a0dffbfc0fb40c65c86cba37d9f9a7d19235ec3f14a395669fdbac749867',
  'protected/wxo/assets/document-processing/media/doc-pro-poster-sanitized.png': 'f4e01d2d8c3665321cf53c6ba2f902182062da6485e03994bf44e12bfbab8b45',
  'protected/wxo/assets/document-processing/storyboard/01-select-training-documents-sanitized.png': '74078eb8e24ee8fd26de7a75d00b464c358a7d57fa18241c417fa6aa5e71dd8c',
  'protected/wxo/assets/document-processing/storyboard/02-review-and-correct-sanitized.png': 'f4e01d2d8c3665321cf53c6ba2f902182062da6485e03994bf44e12bfbab8b45',
  'protected/wxo/assets/document-processing/storyboard/03-evaluation-details-sanitized.png': 'e60feb0d7b7de1105e2b40d640598d2a81250d48effd60747fd05e105589f1b9',
  'protected/wxo/assets/document-processing/current/classify-suggested-sanitized.png': '5887a9bb43c1d70bf1262112289751046d79fc61f7c985627cc9bbb1befcc933',
  'protected/wxo/assets/document-processing/current/extract-field-sanitized.png': 'c88c80dd393a1570a1d737cd7e3116b5144836e8bad057242561632210c2cbab',
  'protected/wxo/assets/document-processing/current/extract-error-sanitized.png': 'a4b1510fe034d6503de89caa0ace9ca3a9b9889ebdf454b42a3387a35022387e',
  'protected/wxo/assets/document-processing/current/review-table-sanitized.png': '3fcff8622aff6c432c250b16b03cb2960bb9f0090d4c790e467a407d8b021240',
  'protected/wxo/assets/document-processing/current/review-verified-sanitized.png': 'e79069cd3e41a6ad3d14ae12c8e774d85756b34e378bf91cbf3c16265980ff95',
  'protected/wxo/assets/document-processing/current/evaluate-test-set-sanitized.png': 'c30c6532fc7b905ccf6dfd53f26c08453a8c4e37aeb077037f114085cf0ad2b0',
  'protected/wxo/assets/document-processing/current/evaluate-rerun-sanitized.png': 'bbbf63b69e6ac4b31f9b1fe039b153c108672f46c71d0c8ba1ee01d3f772b283',
  'protected/wxo/assets/document-processing/current/evaluate-results-sanitized.png': '7f74584271f90011c692f0dab6e51716bf27e4a5d552723835dddff3a1cae403',
  'protected/wxo/assets/document-processing/current/evaluate-indicators-sanitized.png': 'bfd12f4b657c364dc03f7b88f58f695f816c16e46fc953f34b4c4e4fb2db66e5',
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
