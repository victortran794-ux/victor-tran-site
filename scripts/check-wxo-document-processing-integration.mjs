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
const deployIgnore = read('.vercelignore');
const v2ManifestPath = 'data/wxo-canvas-v2-provenance.json';
if (fs.existsSync('assets/wxo-canvas-future')) fail('Retired Future Canvas media must not remain in the deployable asset tree.');
if (fs.existsSync('data/wxo-canvas-future-provenance.json')) fail('Retired separate-source Future Canvas provenance must not remain active beside the canonical V1/V2 ledger.');
requireText(deployIgnore, 'data/', 'Repository-only wxO provenance must remain excluded from deployment.');

const documentProcessingRedirect = vercel.redirects?.find((rule) => rule.source === '/document-processing');
if (!documentProcessingRedirect || documentProcessingRedirect.destination !== '/wxo-canvas#document-processing' || documentProcessingRedirect.permanent !== true) {
  fail('Vercel must permanently retire /document-processing into the wxO Document Processing chapter.');
}

for (const value of [
  "const PROTECTED_HASH_STATE = 'vtdProtectedHash'",
  'history.replaceState(stateWithoutProtectedHash()',
  "window.dispatchEvent(new HashChangeEvent('hashchange'",
  "input.focus({ preventScroll: true })",
  "const FORCE_LOCK = new URLSearchParams(location.search).get('lock') === '1'",
  'if (FORCE_LOCK) sessionStorage.removeItem(KEY)',
  "url.searchParams.delete('lock')",
]) requireText(passwordGate, value, `Shared password gate missing protected deep-link behavior: ${value}`);

requireText(healthWorkflow, "needs.changes.outputs.wxo == 'true'", 'Health-check workflow must scope wxO and Document Processing through classifier ownership.');
requireText(healthWorkflow, "needs.changes.outputs.shared == 'true'", 'Health-check workflow must include shared-shell changes in protected-route validation.');
requireText(healthWorkflow, 'npm run check:wxo-document-processing', 'Health-check workflow must run the wxO and Document Processing source contract.');
requireText(healthWorkflow, 'npm run check:wxo-document-processing-browser', 'Health-check workflow must run the locked deep-link browser regression.');

for (const [name, html] of [['IBM watsonx Orchestrate', wxo], ['Document Processing', doc]]) {
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
requireText(workflowCss, '.doc-ending-grid {', 'The lean Document Processing ending must have a scoped two-part layout.');
requireText(workflowCss, '.doc-compact-list {', 'The lean ending must use restrained decision and contribution rows.');
requireText(workflowCss, '.doc-processing-page .site-route-status {', 'The wxO and Document Processing pages must hide the redundant protected-status note.');
requireText(workflowCss, 'display: none;', 'The redundant protected-status note must not render.');
requireText(workflowCss, '.doc-motion-toggle {', 'The autoplay journey must expose a visible pause control.');
requireText(workflowCss, '.doc-current-story {', 'The current Document Processing evidence story must have a scoped layout.');
requireText(workflowCss, '.doc-current-stage {', 'Each current Document Processing stage must have a scoped layout.');
requireText(workflowJs, "document.querySelectorAll('[data-doc-motion-toggle]')", 'The autoplay journey pause control must be wired in the scoped workflow script.');

for (const text of [
  'IBM watsonx Orchestrate · 2024–present',
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
requireText(workflowCss, 'grid-template-columns: minmax(0, 3fr) minmax(0, 1fr);', 'wxO chapter selector must preserve the smaller Document Processing tab.');
requireText(workflowCss, 'top: 58px;', 'The sticky wxO selector must meet the scrolled 58px site navigation without exposing the page background.');
forbid(wxo, /data-wxo-chapter="future-canvas"/i, 'Future Canvas must not appear as a peer chapter tab.');
requireText(wxo, 'A protected visual-system story spanning a V1 workflow foundation, later V2 canvas studies, and a smaller Document Processing pressure test.', 'wxO opening must separate the V1 foundation, later V2 studies, and subordinate Document Processing chapter.');
requireText(wxo, '>01 / V1 foundation</span>', 'wxO must identify the current Canvas evidence as the V1 foundation.');
requireText(wxo, 'class="wxo-v2-story reveal"', 'wxO must add the bounded V2 evolution story at the end of Canvas.');
requireText(wxo, '>V2 system evolution</h2>', 'wxO must name the new V2 system evolution chapter.');
requireText(wxo, 'V2 authored exploration', 'wxO must label V2 as authored exploration rather than shipped product evidence.');
if (count(wxo, /class="wxo-v2-image-link"/g) !== 4) fail('Every V2 board must provide an accessible full-size inspection link.');
if (count(wxo, />Open full-size board ↗<\/span>/g) !== 4) fail('Every V2 board must label its full-size inspection action.');
requireText(wxo, 'Complete V2 workflow-detail specification', 'Workflow-detail alt text must identify the complete authored specification.');
requireText(wxo, 'A complete authored specification checks the path from entry through forms, branching logic, and End.', 'Workflow-detail caption must identify the complete authored specification without implying implementation.');
requireText(wxo, '>Visual system in motion</h3>', 'wxO must present the original prototype as a visual-system sequence.');
requireText(wxo, 'Names and values are fictional sample data.', 'Prototype copy must identify the fictional sample-data boundary.');
forbid(wxo, /shipped V2|released V2|production V2|V2 shipped|V2 release evidence/i, 'wxO V2 copy must not imply shipment or production status.');
forbid(wxo, /Future state explorations|Coming soon|data-future-motion-toggle|wxo-future-canvas-motion/i, 'wxO must retire the obsolete Future Canvas teaser and motion control.');

const v2Assets = [
  ['01-component-system-showcase.png', 2880, 2048],
  ['02-agent-flow-showcase.png', 2880, 2616],
  ['03-flow-controls-showcase.png', 2880, 2048],
  ['04-workflow-detail-showcase.png', 2880, 2768],
];
if (!fs.existsSync(v2ManifestPath)) fail('Repository-only wxO V2 provenance manifest must exist outside the public artifact tree.');
else {
  const v2Manifest = JSON.parse(read(v2ManifestPath));
  if (v2Manifest.figmaFileKey !== 'PKr7T6508DtrWg9FhTTc75' || v2Manifest.sourcePage !== 'wxo flows v1 - v2') fail('wxO V2 manifest must identify the approved updated Figma source.');
  if (JSON.stringify((v2Manifest.assets ?? []).map((entry) => entry.file)) !== JSON.stringify(v2Assets.map(([file]) => file))) fail('wxO V2 manifest must record the four curated complete-frame assets in narrative order.');
  const expectedV2Sanitization = {
    '01-component-system-showcase.png': 'Replaced Connection timed out and runtime execution error copy with neutral review guidance; removed the external export-shadow matte; metadata stripped; no component structure changed.',
    '02-agent-flow-showcase.png': 'Removed the provider/model value, replaced it with neutral Model configuration copy, and removed the external export-shadow matte; no orchestration structure changed.',
    '03-flow-controls-showcase.png': 'Removed the external export-shadow matte and stripped metadata; no internal flow-control evidence changed.',
    '04-workflow-detail-showcase.png': 'Removed unsupported high-performance language, replaced it with neutral routing-study copy, and removed the external export-shadow matte; no workflow structure changed.',
  };
  for (const entry of v2Manifest.assets ?? []) {
    const expected = v2Assets.find(([file]) => file === entry.file);
    const assetPath = `images/wxo-canvas/v2/${entry.file}`;
    if (!entry.sourceNode || !Array.isArray(entry.sourceBounds) || !Array.isArray(entry.rawExportDimensions) || !entry.rawExportSha256 || !Array.isArray(entry.exportedDimensions) || !entry.treatment || !entry.privacyStatus || !entry.claimStatus) fail(`wxO V2 manifest entry ${entry.file ?? 'unknown'} is incomplete.`);
    if (!expected || JSON.stringify(entry.exportedDimensions) !== JSON.stringify(expected.slice(1))) fail(`V2 provenance must record exact native dimensions for ${entry.file}.`);
    if (entry.sanitization !== expectedV2Sanitization[entry.file]) fail(`V2 provenance must record the approved sanitization for ${entry.file}.`);
    if (!fs.existsSync(assetPath)) fail(`Missing wxO V2 derivative ${assetPath}.`);
    else if (sha256(assetPath) !== entry.sha256) fail(`wxO V2 derivative hash changed from its manifest: ${assetPath}.`);
    requireText(wxo, `images/wxo-canvas/v2/${entry.file}`, `wxO V2 story missing curated derivative ${entry.file}.`);
    requireText(wxo, `width="${expected[1]}" height="${expected[2]}"`, `wxO V2 HTML dimensions must match ${entry.file}.`);
  }
  const prototype = v2Manifest.prototypeExploration;
  if (!prototype || prototype.status !== 'published-authored-sequence' || prototype.sourceArtifact !== 'wxo-figma-interaction-demo.gif' || !/original matching MP4 and WebM exports/i.test(prototype.treatment) || !/visual-system prototype only/i.test(prototype.claimStatus) || !/fictional prototype sample content/i.test(prototype.privacyStatus)) fail('V2 prototype provenance must preserve the original authored sequence and fictional sample-data boundary.');
  const expectedMedia = {
    'v2-figma-interaction-demo-poster.png': '47494440f56fee47c753fccf511e625dda2dadfd77fe449653713f04e6d98a16',
    'v2-figma-interaction-demo.webm': '0e9df3c0e44fcf9fdfda6a034dbe9d62b1b37824525a242323026b27fdda6a0f',
    'v2-figma-interaction-demo.mp4': 'ae2392130a9723e1b3c52226cd99160fdd2c11d80bc91a1c05ea0ba42d0ec713',
  };
  for (const media of prototype?.media ?? []) {
    const mediaPath = `assets/wxo-canvas-v2/media/${media.file}`;
    if (expectedMedia[media.file] !== media.sha256 || !fs.existsSync(mediaPath) || sha256(mediaPath) !== media.sha256) fail(`V2 prototype media hash or inventory changed: ${media.file}.`);
  }
  if (Object.keys(expectedMedia).length !== (prototype?.media ?? []).length) fail('V2 prototype provenance must record exactly one poster and the two original video encodings.');
}
requireText(wxo, 'data-prototype-evidence="published-authored-sequence"', 'The prototype must remain explicitly bounded as an authored visual-system sequence.');
requireText(wxo, 'poster="assets/wxo-canvas-v2/media/v2-figma-interaction-demo-poster.png"', 'The original prototype sequence must provide a static poster.');
requireText(wxo, 'assets/wxo-canvas-v2/media/v2-figma-interaction-demo.webm', 'The original prototype sequence must provide its matching WebM source.');
requireText(wxo, 'assets/wxo-canvas-v2/media/v2-figma-interaction-demo.mp4', 'The original prototype sequence must provide its matching MP4 source.');
requireText(wxo, '<video controls playsinline preload="metadata"', 'The original prototype sequence must remain optional and user-controlled.');
forbid(wxo, /Main prototype 1|big builder yea|Alerts exploration|Floating right side|VT exploration/i, 'Internal prototype frame names must not enter viewer-facing copy.');
requireText(wxo, 'data-wxo-tab-status>Current view</small>', 'wxO chapter selector must identify the current view.');
requireText(workflowCss, 'position: sticky;', 'wxO chapter selector must remain available while reading either chapter.');
requireText(wxo, '<video autoplay muted loop playsinline', 'Document Processing journey must autoplay silently and loop.');
requireText(wxo, 'data-doc-motion-toggle', 'Document Processing journey must provide a pause control.');
requireText(wxo, '<script src="js/wxo-workflows-vico2.js" defer></script>', 'wxO must load the scoped workflow behavior.');
forbid(wxo, /<video autoplay muted loop playsinline[^>]*\bcontrols\b/i, 'Document Processing journey must not require manual playback controls.');

const currentCanvasAssets = [
  '01-skill-studio-main.png',
  '02-header-image.png',
  '03-main-illustration.png',
  '04-orbital-card.png',
  '06-key-screen.png',
  '07-agent-node-explorations.png',
  '08-node-color-enhancements.png',
  '10-palette-flow-controls.png',
  '12-palette-user-inputs.png',
  '13-user-activity-created.png',
  '14-user-activity-configure.png',
  '15-user-activity-form-filled.png',
  '16-user-activity-complete.png',
];
const expectedCurrentCanvasHashes = {
  '01-skill-studio-main.png': '6da44c427299af93c60a581d044956c1dbbdc4d7e669fb0db4a2b721917071be',
  '02-header-image.png': '9274a98802718b7b4c700bc73a88da70865583b35c6412e5b259ab69585cae68',
  '03-main-illustration.png': '28a1a333063a68fba1eb91a6685a7f7137182042dc72ebf4606be2a7f5197e5e',
  '04-orbital-card.png': '82e9e4aee554de71a5868ed06036cd10bf66fb21bc47f969b73944484a5ae51e',
  '06-key-screen.png': 'a5a6aaaed7e6798a3a8b2b0f960c4a4fc272a07e8b6e822daa062f53ae52b8c7',
  '07-agent-node-explorations.png': '4d1db072b43dc861524e4164b4bcac1ca18be259b4dfc36828ab378d074edbb9',
  '08-node-color-enhancements.png': '16298cabc6ac072a1e8048d6527d3b04cca29b85771996924f97936abfc76411',
  '10-palette-flow-controls.png': '279a63ed2ba0114f2ac9417cb09ce44964975b186665583ffbc7005c93df51c2',
  '12-palette-user-inputs.png': '8074bafc2f525d8d1ba35bdc32a069653d3cc4c41373ac987bea18a82d199487',
  '13-user-activity-created.png': '6d2ac52a2c14fd166d6064c117e2e2a3cc01189e93993b92294b4b410f32aab6',
  '14-user-activity-configure.png': '75d84dc2fbbd9d358f5677d9a734145a4e4349c2967556073037b58d0c0ddbaa',
  '15-user-activity-form-filled.png': '56c6a9dc2352cc42088ef6e5f60bea52403daed7a659a7197ffcb45e56a24c06',
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
  'Role and state',
  '15-user-activity-form-filled.png',
]) requireText(wxo, text, `wxO Canvas missing V1 viewer phrase: ${text}`);
if (count(wxo, /class="[^"]*\bwxo-v1-illustration\b[^"]*"/gi) !== 4) fail('wxO Canvas must place exactly four authored V1 illustration accents.');
requireText(wxo, 'src="images/wxo-canvas/current/03-main-illustration.png" width="870" height="546"', 'Direction stays visible must feature the predominantly blue branching-path illustration at native aspect ratio.');
if (count(wxo, /class="[^"]*\bwxo-v1-arrangement\b[^"]*"/gi) !== 7) fail('wxO Canvas must show seven complete V1 arrangement figures after removing the flawed connector sheet.');
if (count(wxo, /class="[^"]*\bwxo-v1-palette-piece\b[^"]*"/gi) !== 2) fail('wxO Canvas must compose only the two approved Palette child frames.');
forbid(wxo, /01-book-a-flight-context\.png|02-component-system-board\.png|03-user-activity-form\.png|04-straight-connector-states\.png|canvas1-flow-controls-sanitized\.png|canvas1-connectors-sanitized\.png/i, 'Superseded crops, reconstructed boards, zooms, and sparse plates must not remain referenced.');
forbid(wxo, /09-connectors\.png|11-palette-form-menu\.png|15-user-activity-form(?:-canvas|-panel)?\.png|wxo-v1-form-tearsheet|Refined language|Contextual actions/i, 'User-rejected connector, contextual-action, split form exports, and captions must not remain referenced.');
forbid(workflowCss, /wxo-v1-form-tearsheet/i, 'The rejected split-form layout styling must be removed.');
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
  const formFrame = (wxoManifest.assets ?? []).find((entry) => entry.file === '15-user-activity-form-filled.png');
  if (!formFrame || formFrame.sourceFileKey !== 'xCDC70RQXCft14QJmDTmrW' || formFrame.sourceNode !== '6:11024' ||
      JSON.stringify(formFrame.sourceBounds) !== JSON.stringify([1024, 674]) ||
      JSON.stringify(formFrame.exportedDimensions) !== JSON.stringify([900, 592]) ||
      formFrame.sourceArtifactSha256 !== 'cd33e7d462fc759c4b659da48fe8d05aed83660d6b505a59cbbe17ca6dca590f' ||
      !/complete uncropped authored frame/i.test(formFrame.treatment) || !/developer-note overlay removed/i.test(formFrame.treatment)) {
    fail('The approved Form filled frame must retain its original wxO source, full-frame dimensions, audited artifact hash, and bounded annotation cleanup provenance.');
  }
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
if (count(wxo, /<img\b/gi) !== 27) fail('wxO Canvas must use exactly twenty-seven images: shared nav image, thirteen V1 Canvas exports, four V2 showcase boards, and nine current Document Processing frames.');
if (count(wxo, /<video\b/gi) !== 2) fail('wxO Canvas must use exactly two bounded videos: the optional V2 builder walkthrough and the Document Processing motion loop.');
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
