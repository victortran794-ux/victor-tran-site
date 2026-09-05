#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const fail = (message) => { console.error(`FAIL: ${message}`); process.exitCode = 1; };
const requireText = (source, text, message) => { if (!source.includes(text)) fail(message); };
const forbid = (source, pattern, message) => { if (pattern.test(source)) fail(message); };
const count = (source, pattern) => [...source.matchAll(pattern)].length;
const main = (source) => source.match(/<main\b[\s\S]*?<\/main>/i)?.[0] ?? '';

const wxo = read('wxo-canvas.html');
const doc = read('document-processing.html');
const publicLedger = JSON.parse(read('data/wxo-canvas-public-provenance.json'));
const documentLedger = JSON.parse(read('data/document-processing-current-provenance.json'));

// wxO is public. Its active narrative must depend only on the audited public namespace.
requireText(wxo, '<meta property="og:title" content="IBM watsonx Orchestrate · Case Study">', 'Public wxO share title must identify the public case study.');
requireText(wxo, '<meta property="og:description" content="A study of a shared visual language for agentic workflows and human judgment.">', 'Public wxO share description must not advertise protected access.');
requireText(wxo, '<meta name="robots" content="index,follow">', 'Public wxO must be indexable.');
forbid(wxo, /noindex,nofollow,noarchive,nosnippet,noimageindex|site-route-status|wxo-access\.html/i,
  'Public wxO must not retain protected-route metadata, status, or gate references.');
forbid(main(wxo), /(?:src|href|data-theme-(?:light|dark)-src)="(?:\.?\/)?protected\/wxo\//i,
  'Public wxO must not embed protected images or other guarded wxO resources.');
requireText(wxo, 'href="document-processing.html"', 'Public wxO must retain the textual Document Processing handoff.');
forbid(wxo, /document-processing\.html\?lock=1/i, 'Public wxO must not retain a lock query on the public Document Processing handoff.');
forbid(main(wxo), /pilot-bridge-thumbnail|<img\b[^>]*document-processing|document-processing\/current/i,
  'Public wxO handoff must remain textual and must not embed Document Processing media.');
forbid(main(wxo), /id="document-processing"|pilot-doc-epic|pilot-doc-frame|09-document-classify|10-document-extract|11-document-review|12-document-evaluate/i,
  'Public wxO must not embed the protected Document Processing feature arc.');
if (count(main(wxo), /data-wxo-evidence/gi) !== 13) fail('Public wxO must contain exactly thirteen carousel evidence triggers.');

const activePublicAssets = (publicLedger.assets ?? []).filter((asset) => asset.route === 'wxo-canvas.html');
if (activePublicAssets.length !== 26) fail('Public wxO provenance must retain exactly twenty-six audited active exports.');
if (JSON.stringify(activePublicAssets.filter((asset) => /^closing-illustration-(?:light|dark)\.png$/.test(asset.file)).map((asset) => asset.file).sort()) !== JSON.stringify(['closing-illustration-dark.png', 'closing-illustration-light.png'])) {
  fail('Public wxO provenance must include exactly the approved closing-illustration light/dark pair.');
}
for (const asset of activePublicAssets) {
  const assetPath = `images/wxo-canvas/public/${asset.file}`;
  if (!fs.existsSync(assetPath)) fail(`Missing public wxO export: ${assetPath}.`);
  else if (sha256(assetPath) !== asset.sha256) fail(`Public wxO export hash drift: ${asset.file}.`);
  requireText(wxo, assetPath, `Public wxO markup missing audited public export ${asset.file}.`);
}
for (const asset of publicLedger.assets ?? []) {
  if (!['wxo-canvas.html', 'index.html', 'source-only'].includes(asset.route)) fail(`Invalid wxO provenance route for ${asset.file}.`);
}
if ((publicLedger.assets ?? []).filter((asset) => asset.route === 'source-only').length !== 18) {
  fail('wxO provenance must retain eighteen retired derivatives as source-only history.');
}

// Document Processing is public, while only its eight audited owner exports move to the public namespace.
requireText(doc, '<meta name="robots" content="index,follow">', 'Document Processing must be indexable.');
forbid(doc, /noindex,nofollow,noarchive,nosnippet,noimageindex|site-route-status|wxo-access\.html|protected\/wxo\//i,
  'Public Document Processing must not retain protected-route metadata, status, gate references, or guarded media paths.');
const expectedDocFiles = [
  'classify-setup.png', 'extract-field.png', 'review-table.png', 'review-verified.png',
  'evaluate-test-set.png', 'evaluate-rerun.png', 'evaluate-results.png', 'evaluate-indicators.png',
].sort();
const expectedDocumentPaths = expectedDocFiles.map((file) => `images/document-processing/public/${file}`);
if (count(main(doc), /data-wxo-evidence/gi) !== 4) fail('Document Processing must contain exactly four feature-arc carousel triggers.');
if ((documentLedger.assets ?? []).length !== 8) fail('Document Processing provenance must contain exactly eight active owner exports.');
const documentFiles = (documentLedger.assets ?? []).map((asset) => asset.file);
if (JSON.stringify(documentFiles.slice().sort()) !== JSON.stringify(expectedDocumentPaths)) {
  fail('Document Processing provenance must allowlist exactly the eight approved public owner exports.');
}
for (const asset of documentLedger.assets ?? []) {
  if (asset.route !== 'document-processing.html' || asset.sourceSha256 !== asset.outputSha256 ||
      !asset.operations?.includes('None; repository asset is byte-identical to the owner export')) {
    fail(`Document Processing provenance must preserve byte-identical public owner export ${asset.file}.`);
    continue;
  }
  if (!fs.existsSync(asset.file)) fail(`Missing public Document Processing owner export ${asset.file}.`);
  else if (sha256(asset.file) !== asset.outputSha256) fail(`Document Processing owner export hash drift: ${asset.file}.`);
  requireText(doc, asset.file, `Document Processing markup missing routed public owner export ${asset.file}.`);
}
const classify = documentLedger.assets?.find((asset) => asset.file.endsWith('/classify-setup.png'));
if (classify?.additionalRoutes) fail('Current Classify provenance must not retain obsolete route permissions.');

if (process.exitCode) process.exit(1);
console.log('PASS: public wxO and public Document Processing route split contract');
