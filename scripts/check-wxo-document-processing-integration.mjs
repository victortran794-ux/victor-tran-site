#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const fail = (message) => { console.error(`FAIL: ${message}`); process.exitCode = 1; };
const requireText = (source, value, message) => { if (!source.includes(value)) fail(message); };
const forbid = (source, pattern, message) => { if (pattern.test(source)) fail(message); };
const count = (source, pattern) => [...source.matchAll(pattern)].length;
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const pngDimensions = (file) => {
  const bytes = fs.readFileSync(file);
  if (bytes.subarray(0, 8).compare(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) !== 0) return null;
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
};
const main = (html) => html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? '';

const wxo = read('wxo-canvas.html');
const doc = read('document-processing.html');
const sitemap = read('sitemap.xml');
const robots = read('robots.txt');
const projects = JSON.parse(read('data/projects.json'));
const policy = JSON.parse(read('data/content-export-policy.json'));
const publicLedger = JSON.parse(read('data/wxo-canvas-public-provenance.json'));
const documentLedger = JSON.parse(read('data/document-processing-current-provenance.json'));
const healthWorkflow = read('.github/workflows/health-check.yml');

// The public route has a public metadata, navigation, export, and asset boundary.
requireText(wxo, '<meta name="robots" content="index,follow">', 'Public wxO must use index,follow robots metadata.');
forbid(wxo, /noindex,nofollow,noarchive,nosnippet,noimageindex|site-route-status|wxo-access\.html/i,
  'Public wxO must not retain protected-route metadata, status, or gate markup.');
forbid(main(wxo), /(?:src|href|data-theme-(?:light|dark)-src)="(?:\.?\/)?protected\/wxo\//i,
  'Public wxO must not embed protected images or guarded resources.');
requireText(wxo, 'href="document-processing.html"', 'Public wxO must expose the textual Document Processing handoff.');
forbid(wxo, /document-processing\.html\?lock=1/i, 'Public wxO must not retain a lock query on the public Document Processing handoff.');
forbid(main(wxo), /pilot-bridge-thumbnail|<img\b[^>]*document-processing|document-processing\/current/i,
  'Public wxO must not embed a Document Processing thumbnail or current protected media.');
forbid(main(wxo), /pilot-doc-epic|pilot-doc-frame|id="document-processing"/i,
  'Public wxO must not embed the protected Document Processing feature arc.');
if (count(main(wxo), /data-wxo-evidence/gi) !== 13) fail('Public wxO must contain exactly thirteen evidence triggers.');
if (!sitemap.includes('https://www.victortrandesign.com/wxo-canvas')) fail('Public wxO must be present in sitemap.xml.');
forbid(robots, /^Disallow: \/wxo-canvas(?:\.html)?$/m, 'robots.txt must not disallow public wxO aliases.');

const wxoProject = projects.projects.find((project) => project.slug === 'wxo-canvas');
if (!wxoProject || wxoProject.url !== 'wxo-canvas.html' || wxoProject.protected || wxoProject.noindex || wxoProject.sitemap !== true || !wxoProject.homepage || !wxoProject.nav) {
  fail('wxO manifest must classify the route as public, homepage-visible, navigable, and sitemap-visible.');
}
if ((policy.protectedPages || []).some((entry) => entry.source === 'wxo-canvas.html')) fail('Public wxO must not remain in the protected export policy.');
const publicAssets = (publicLedger.assets || []).filter((asset) => asset.route === 'wxo-canvas.html');
if (publicAssets.length !== 26) fail('Public wxO provenance must contain exactly twenty-six active exports.');
if (JSON.stringify(publicAssets.filter((asset) => /^closing-illustration-(?:light|dark)\.png$/.test(asset.file)).map((asset) => asset.file).sort()) !== JSON.stringify(['closing-illustration-dark.png', 'closing-illustration-light.png'])) {
  fail('Public wxO provenance must include exactly the approved closing-illustration light/dark pair.');
}
for (const asset of publicAssets) {
  const assetPath = `images/wxo-canvas/public/${asset.file}`;
  if (!fs.existsSync(assetPath)) fail(`Missing public wxO export ${assetPath}.`);
  else if (sha256(assetPath) !== asset.sha256) fail(`Public wxO export hash drift: ${asset.file}.`);
  requireText(wxo, assetPath, `Public wxO missing active audited export ${asset.file}.`);
}

// Document Processing is public, subordinate, and byte-bound to its eight audited exports.
requireText(doc, '<meta name="robots" content="index,follow">', 'Document Processing must use public robots metadata.');
forbid(doc, /noindex,nofollow,noarchive,nosnippet,noimageindex|site-route-status|wxo-access\.html|protected\/wxo\//i,
  'Public Document Processing must not retain protected metadata, status, gate markup, or guarded media paths.');
const documentProject = projects.projects.find((project) => project.slug === 'document-processing');
if (!documentProject || documentProject.protected !== false || documentProject.noindex !== false || documentProject.sitemap !== true || documentProject.homepage !== false || documentProject.nav !== false) {
  fail('Document Processing must be public and sitemap-visible while remaining subordinate to wxO navigation.');
}
if ((policy.protectedPages || []).some((entry) => entry.source === 'document-processing.html')) fail('Public Document Processing must not remain in the protected export policy.');
for (const route of ['/document-processing', '/document-processing.html']) forbid(robots, new RegExp(`^Disallow: ${route.replace('.', '\\.')}$`, 'm'), `robots.txt must not disallow public ${route}.`);
requireText(sitemap, 'https://www.victortrandesign.com/document-processing', 'Public Document Processing must be present in sitemap.xml.');

if ((documentLedger.assets || []).length !== 8) fail('Document Processing active provenance must contain exactly eight audited owner exports.');
const expectedDocPaths = [
  'classify-setup.png', 'extract-field.png', 'review-table.png', 'review-verified.png',
  'evaluate-test-set.png', 'evaluate-rerun.png', 'evaluate-results.png', 'evaluate-indicators.png',
].map((file) => `images/document-processing/public/${file}`).sort();
const docSources = new Set([...main(doc).matchAll(/<img\b[^>]*src="(images\/document-processing\/public\/[^"]+)"/gi)].map((match) => match[1]));
if (JSON.stringify([...docSources].sort()) !== JSON.stringify(expectedDocPaths)) fail(`Document Processing must render exactly the eight approved public owner exports, found ${docSources.size}.`);
for (const asset of documentLedger.assets || []) {
  if (asset.route !== 'document-processing.html' || asset.sourceRecordType !== 'owner-supplied-export-filename-and-sha256' || asset.sourceSha256 !== asset.outputSha256 || !asset.operations?.includes('None; repository asset is byte-identical to the owner export')) {
    fail(`Document Processing provenance must preserve byte-identical public owner export ${asset.file}.`);
    continue;
  }
  if (!fs.existsSync(asset.file) || sha256(asset.file) !== asset.outputSha256 || JSON.stringify(pngDimensions(asset.file)) !== JSON.stringify(asset.dimensions)) {
    fail(`Document Processing public owner export changed: ${asset.file}.`);
  }
  if (!docSources.has(asset.file)) fail(`Document Processing markup missing public owner export ${asset.file}.`);
}
const classify = documentLedger.assets?.find((asset) => asset.file.endsWith('/classify-setup.png'));
if (classify?.additionalRoutes) fail('Current Classify provenance must not retain obsolete route permissions.');
if (count(main(doc), /data-wxo-evidence/gi) !== 4) fail('Document Processing must retain exactly four feature-arc triggers.');

// Keep CI ownership for the public route and the public-route split contracts.
for (const command of ['npm run check:wxo-document-processing', 'node scripts/check-wxo-route-split.mjs', 'npm run check:wxo-document-processing-browser']) {
  requireText(healthWorkflow, command, `Health-check workflow missing wxO/Document Processing contract: ${command}`);
}

if (process.exitCode) process.exit(1);
console.log(`WXO PUBLIC + DOCUMENT PROCESSING CONTRACT: PASS publicAssets=${publicAssets.length} docExports=${docSources.size}`);
