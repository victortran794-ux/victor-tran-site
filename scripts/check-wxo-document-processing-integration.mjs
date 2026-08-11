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
  'js/wxo-workflows-vico2.js',
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
requireText(workflowCss, '.doc-ending-grid {', 'The lean Document Processing ending must have a scoped two-part layout.');
requireText(workflowCss, '.doc-compact-list {', 'The lean ending must use restrained decision and contribution rows.');
requireText(workflowCss, '.doc-processing-page .site-route-status {', 'The wxO and Document Processing pages must hide the redundant protected-status note.');
requireText(workflowCss, 'display: none;', 'The redundant protected-status note must not render.');
requireText(workflowCss, '.doc-motion-toggle {', 'The autoplay journey must expose a visible pause control.');
requireText(workflowCss, '.doc-current-story {', 'The current Document Processing evidence story must have a scoped layout.');
requireText(workflowCss, '.doc-current-stage {', 'Each current Document Processing stage must have a scoped layout.');
requireText(workflowJs, "document.querySelectorAll('[data-doc-motion-toggle]')", 'The autoplay journey pause control must be wired in the scoped workflow script.');

for (const text of [
  'IBM watsonX Orchestrate · 2024–present',
  'Agentic workflow canvas.',
  'Document Processing is a focused chapter',
  'Visual Designer',
  'Human-in-the-loop shared patterns',
  'User activities',
  'released in July 2026',
  'Make the trust loop visible.',
  'Classifier + Extractor specifications',
  'Evaluation direction · released July 2026',
  'I joined the work in 2025',
  'Led Accuracy Evaluation',
  'Interface details use fictional sample data and are shown as design examples, not measured outcomes.',
  'href="#canvas"',
  'href="#document-processing"',
]) requireText(wxo, text, `wxO Canvas missing required source-safe phrase: ${text}`);

forbid(wxo, /<dt>Scope<\/dt>|<dt>Status<\/dt>/i, 'wxO hero must keep the role and period only.');
forbid(wxo, /Evidence boundary:/i, 'wxO umbrella must not repeat evidence-boundary callouts.');
forbid(wxo, /Protected private candidate|local sanitized assets|source-backed|no shipment claim|no public implementation authorized|Current Figma source\. Fictional prototype data shown|(?:alt|aria-label)="Sanitized/i, 'wxO viewer-facing copy must not expose internal release-gate language.');
forbid(wxo, /Context travels with the task|Judgment has a return path|04 \/ Design to implementation/i, 'Deferred Canvas sections must not remain in the active story.');
requireText(workflowCss, 'grid-template-columns: minmax(0, 3fr) minmax(0, 1fr);', 'wxO chapter selector must weight Canvas and Document Processing 3:1.');
requireText(workflowCss, 'position: sticky;', 'wxO chapter selector must remain available while reading either chapter.');
requireText(wxo, '<video autoplay muted loop playsinline', 'Document Processing journey must autoplay silently and loop.');
requireText(wxo, 'data-doc-motion-toggle', 'Document Processing journey must provide a pause control.');
requireText(wxo, '<script src="js/wxo-workflows-vico2.js" defer></script>', 'wxO must load the scoped workflow behavior.');
forbid(wxo, /<video[^>]*\bcontrols\b/i, 'Document Processing journey must not require manual playback controls.');

const currentCanvasAssets = [
  '01-skill-studio-main.png',
  '02-header-image.png',
  '03-main-illustration.png',
  '04-orbital-card.png',
  '05-orbital-insert.png',
  '06-key-screen.png',
  '07-agent-node-explorations.png',
  '08-node-color-enhancements.png',
  '09-connectors.png',
  '10-palette-flow-controls.png',
  '11-palette-form-menu.png',
  '12-palette-user-inputs.png',
  '13-user-activity-created.png',
  '14-user-activity-configure.png',
  '15-user-activity-form.png',
  '16-user-activity-complete.png',
];
const expectedCurrentCanvasHashes = {
  '01-skill-studio-main.png': '6da44c427299af93c60a581d044956c1dbbdc4d7e669fb0db4a2b721917071be',
  '02-header-image.png': '9274a98802718b7b4c700bc73a88da70865583b35c6412e5b259ab69585cae68',
  '03-main-illustration.png': '28a1a333063a68fba1eb91a6685a7f7137182042dc72ebf4606be2a7f5197e5e',
  '04-orbital-card.png': '82e9e4aee554de71a5868ed06036cd10bf66fb21bc47f969b73944484a5ae51e',
  '05-orbital-insert.png': 'e0f2c09fd4e1eda19e3c9cabdcbb56571e83fa1c5244f4de6f3929840f546f2a',
  '06-key-screen.png': 'a5a6aaaed7e6798a3a8b2b0f960c4a4fc272a07e8b6e822daa062f53ae52b8c7',
  '07-agent-node-explorations.png': '4d1db072b43dc861524e4164b4bcac1ca18be259b4dfc36828ab378d074edbb9',
  '08-node-color-enhancements.png': '16298cabc6ac072a1e8048d6527d3b04cca29b85771996924f97936abfc76411',
  '09-connectors.png': 'e9e759d6adc2b85059a6036f67c7418fe4c340cce02a5e936133149a08a0d673',
  '10-palette-flow-controls.png': '279a63ed2ba0114f2ac9417cb09ce44964975b186665583ffbc7005c93df51c2',
  '11-palette-form-menu.png': 'a9cdf2991e480ef609e64811d498f3bebaa39706482230ca25f9b267949f1465',
  '12-palette-user-inputs.png': '8074bafc2f525d8d1ba35bdc32a069653d3cc4c41373ac987bea18a82d199487',
  '13-user-activity-created.png': '6d2ac52a2c14fd166d6064c117e2e2a3cc01189e93993b92294b4b410f32aab6',
  '14-user-activity-configure.png': '75d84dc2fbbd9d358f5677d9a734145a4e4349c2967556073037b58d0c0ddbaa',
  '15-user-activity-form.png': 'acf68cb38a2383739f3c6adbd29c9887ada1a024c80360e4b3ee21a74b113159',
  '16-user-activity-complete.png': '9064113da7bfd832382c1b2d4e048aa3aea9c8b5dcba5faab0633e3b9334319f',
};
for (const asset of [
  ...currentCanvasAssets.map((file) => `current/${file}`),
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
]) requireText(wxo, asset, `wxO Canvas missing approved derivative ${asset}`);

for (const text of [
  'Full canvas',
  'Node language',
  'Connection grammar',
  'Palette pieces',
  'Human work in the flow',
]) requireText(wxo, text, `wxO Canvas missing V1 viewer phrase: ${text}`);
if (count(wxo, /class="[^"]*\bwxo-v1-illustration\b[^"]*"/gi) !== 5) fail('wxO Canvas must place exactly five authored V1 illustration accents.');
if (count(wxo, /class="[^"]*\bwxo-v1-arrangement\b[^"]*"/gi) !== 8) fail('wxO Canvas must show eight complete V1 arrangement sheets.');
if (count(wxo, /class="[^"]*\bwxo-v1-palette-piece\b[^"]*"/gi) !== 3) fail('wxO Canvas must compose three Palette child frames individually.');
forbid(wxo, /01-book-a-flight-context\.png|02-component-system-board\.png|03-user-activity-form\.png|04-straight-connector-states\.png|canvas1-flow-controls-sanitized\.png|canvas1-connectors-sanitized\.png/i, 'Superseded crops, reconstructed boards, zooms, and sparse plates must not remain referenced.');
forbid(wxo, /7:\d+|26:\d+|25:\d+|screen-visible|component-lineage proof|private provenance/i, 'wxO viewer-facing copy must not expose internal provenance identifiers or working labels.');

forbid(wxo, /href="document-processing\.html"/i, 'The wxO chapter must not link out to the retired standalone Document Processing story.');
if (count(wxo, /class="doc-story-frame/gi) !== 0) fail('The redundant three-frame Document Processing storyboard must be removed.');
if (count(wxo, /class="doc-ending-grid"/gi) !== 1) fail('The wxO Document Processing chapter must use one lean ending grid.');
if (count(wxo, /class="doc-decision-row"/gi) !== 3) fail('The wxO Document Processing chapter must show three concise product decisions.');
if (count(wxo, /class="doc-contribution-row"/gi) !== 3) fail('The wxO Document Processing chapter must show three restrained contribution rows.');
forbid(wxo, /wxo-doc-loop-title|class="doc-loop|class="doc-decision-card|class="doc-role-card|class="workflow-role-grid"|classify → extract → review → evaluate → improve/i, 'The redundant trust-loop and card-heavy ending must be removed from wxO.');

forbid(wxo, /Canvas Future|future-(inventory|builder|debug)-sanitized/i, 'Future-state material must remain withheld from the ordinary protected page.');
for (const asset of [
  'images/wxo-canvas/future-inventory-sanitized.png',
  'images/wxo-canvas/future-builder-sanitized.png',
  'images/wxo-canvas/future-debug-sanitized.png',
]) {
  if (fs.existsSync(asset)) fail(`Withheld future-state asset must not remain in the public repository: ${asset}.`);
}

const wxoPublicManifestPath = 'images/wxo-canvas/current/manifest.json';
if (fs.existsSync(wxoPublicManifestPath)) fail('Detailed wxO provenance must not exist in the publicly deployable image directory.');
const vercelIgnore = read('.vercelignore');
if (!/^data\/$/m.test(vercelIgnore)) fail('Vercel deployment must exclude the repository-only data provenance directory.');
const wxoManifestPath = 'data/wxo-canvas-current-provenance.json';
if (!fs.existsSync(wxoManifestPath)) fail('Repository-only wxO V1 provenance manifest must exist outside the public artifact tree.');
else {
  const wxoManifest = JSON.parse(read(wxoManifestPath));
  if (wxoManifest.figmaFileKey !== 'FgPd6zpmuOVymcCypIiGPY' || wxoManifest.sourceSection !== '7:99357') fail('wxO manifest must identify the linked Agentic Workflow Canvas V1 source.');
  if (!Array.isArray(wxoManifest.assets) || wxoManifest.assets.length !== currentCanvasAssets.length) fail(`wxO current-system manifest must record exactly ${currentCanvasAssets.length} curated assets.`);
  const manifestFiles = (wxoManifest.assets ?? []).map((entry) => entry.file);
  if (JSON.stringify(manifestFiles) !== JSON.stringify(currentCanvasAssets)) fail('wxO manifest assets must remain in the approved V1 narrative order.');
  for (const entry of wxoManifest.assets ?? []) {
    const assetPath = `images/wxo-canvas/current/${entry.file}`;
    if (!entry.sourceNode || !entry.sourceFrame || !Array.isArray(entry.sourceBounds) || !Array.isArray(entry.exportedDimensions) || !entry.treatment || !entry.privacyStatus || !entry.claimStatus || !entry.approvalState) fail(`wxO manifest entry ${entry.file ?? 'unknown'} is missing Figma provenance, dimensions, treatment, privacy, claims, or approval metadata.`);
    if (!fs.existsSync(assetPath)) fail(`Missing wxO current-system derivative ${assetPath}.`);
    else {
      const actualHash = sha256(assetPath);
      if (actualHash !== entry.sha256) fail(`wxO current-system derivative hash changed from its manifest: ${assetPath}.`);
      if (actualHash !== expectedCurrentCanvasHashes[entry.file]) fail(`wxO current-system derivative changed from the independently approved snapshot: ${assetPath}.`);
    }
  }
}

const expectedWxoAssets = {
  'images/wxo-canvas/document-processing-storyboard.png': '758d72c025a02073d5aa427a3ed7d855412284a3e9389c6c0f78b9415c5aac08',
  'images/wxo-canvas/wxo-home-thumbnail.png': '690c128b97bb004151c496025857ceaa7d88a50fdd81aeae37125689d05502ee',
};
for (const [asset, expected] of Object.entries(expectedWxoAssets)) {
  if (!fs.existsSync(asset)) fail(`Missing approved wxO derivative ${asset}.`);
  else if (sha256(asset) !== expected) fail(`Approved wxO derivative changed: ${asset}.`);
}

if (count(wxo, /class="doc-current-stage"/gi) !== 4) fail('The wxO Document Processing chapter must show four current evidence stages.');
if (count(wxo, /class="doc-current-frame"/gi) !== 9) fail('The wxO Document Processing chapter must show nine curated current Figma frames.');
if (count(wxo, /<img\b/gi) !== 26) fail('wxO Canvas must use exactly twenty-six images: shared nav image, sixteen V1 Canvas exports, and nine current Document Processing frames.');
if (count(wxo, /<\/span><h3\b/gi) !== 4) fail('Current stage headers must stay compact and text-light.');
requireText(wxo, 'class="doc-current-evaluator-grid"', 'The Evaluate finale must use a distinct four-screen grid.');
forbid(wxo, /classify-mapping-sanitized\.png|>Data mapping</i, 'The redundant classifier data-mapping screen must be removed.');
forbid(wxo, /03-evaluation-details-sanitized\.png|class="doc-evaluation-specimen"/i, 'The superseded one-off evaluation specimen must be replaced by the current four-stage story.');
forbid(wxo, /accuracy improvement|efficiency improvement|adoption|customer impact|Canvas 1 shipped|Canvas Future shipped|measured (?:improvement|increase|decrease|impact|result)/i, 'wxO Canvas must not claim unsupported shipment, adoption, or outcomes.');

for (const text of [
  'Make the trust loop visible.',
  'Product design · 2025–2026',
  'Classifier + Extractor specifications',
  'Human-in-the-loop shared patterns',
  'Evaluation direction · released July 2026',
  'I joined the work in 2025',
  'Led Accuracy Evaluation',
  'Interface details use fictional sample data and are shown as design examples, not measured outcomes.',
]) requireText(doc, text, `Document Processing missing required source-safe phrase: ${text}`);

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
if (count(doc, /<\/span><h3\b/gi) !== 4) fail('Standalone current stage headers must stay compact and text-light.');
requireText(doc, 'class="doc-current-evaluator-grid"', 'The standalone Evaluate finale must use a distinct four-screen grid.');
if (count(doc, /class="doc-ending-grid"/gi) !== 1) fail('Document Processing must use one lean ending grid.');
if (count(doc, /class="doc-decision-row"/gi) !== 3) fail('Document Processing must show three concise product decisions.');
if (count(doc, /class="doc-contribution-row"/gi) !== 3) fail('Document Processing must show three restrained contribution rows.');
forbid(doc, /doc-loop-title|class="doc-loop|class="doc-decision-grid|class="workflow-role-grid"|classify → extract → review → evaluate → improve/i, 'The redundant trust-loop and card-heavy ending must be removed from Document Processing.');
forbid(doc, /classify-mapping-sanitized\.png|>Data mapping</i, 'The redundant classifier data-mapping screen must be removed.');
forbid(doc, /03-evaluation-details-sanitized\.png|class="doc-evaluation-specimen"/i, 'Document Processing must replace the superseded one-off evaluation specimen.');

const expectedDocumentAssets = {
  'assets/document-processing/media/doc-pro-evaluation-loop-sanitized.webm': '472376539f7fe8c8b10d1f8fe480b1052f95f6b5a8fadbeb16954396ceb4626e',
  'assets/document-processing/media/doc-pro-evaluation-loop-sanitized.mp4': '1c41a0dffbfc0fb40c65c86cba37d9f9a7d19235ec3f14a395669fdbac749867',
  'assets/document-processing/media/doc-pro-poster-sanitized.png': 'f4e01d2d8c3665321cf53c6ba2f902182062da6485e03994bf44e12bfbab8b45',
  'assets/document-processing/storyboard/01-select-training-documents-sanitized.png': '74078eb8e24ee8fd26de7a75d00b464c358a7d57fa18241c417fa6aa5e71dd8c',
  'assets/document-processing/storyboard/02-review-and-correct-sanitized.png': 'f4e01d2d8c3665321cf53c6ba2f902182062da6485e03994bf44e12bfbab8b45',
  'assets/document-processing/storyboard/03-evaluation-details-sanitized.png': 'e60feb0d7b7de1105e2b40d640598d2a81250d48effd60747fd05e105589f1b9',
  'assets/document-processing/current/classify-suggested-sanitized.png': '5887a9bb43c1d70bf1262112289751046d79fc61f7c985627cc9bbb1befcc933',
  'assets/document-processing/current/extract-field-sanitized.png': 'c88c80dd393a1570a1d737cd7e3116b5144836e8bad057242561632210c2cbab',
  'assets/document-processing/current/extract-error-sanitized.png': 'a4b1510fe034d6503de89caa0ace9ca3a9b9889ebdf454b42a3387a35022387e',
  'assets/document-processing/current/review-table-sanitized.png': '3fcff8622aff6c432c250b16b03cb2960bb9f0090d4c790e467a407d8b021240',
  'assets/document-processing/current/review-verified-sanitized.png': 'e79069cd3e41a6ad3d14ae12c8e774d85756b34e378bf91cbf3c16265980ff95',
  'assets/document-processing/current/evaluate-test-set-sanitized.png': 'c30c6532fc7b905ccf6dfd53f26c08453a8c4e37aeb077037f114085cf0ad2b0',
  'assets/document-processing/current/evaluate-rerun-sanitized.png': 'bbbf63b69e6ac4b31f9b1fe039b153c108672f46c71d0c8ba1ee01d3f772b283',
  'assets/document-processing/current/evaluate-results-sanitized.png': '7f74584271f90011c692f0dab6e51716bf27e4a5d552723835dddff3a1cae403',
  'assets/document-processing/current/evaluate-indicators-sanitized.png': 'bfd12f4b657c364dc03f7b88f58f695f816c16e46fc953f34b4c4e4fb2db66e5',
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
