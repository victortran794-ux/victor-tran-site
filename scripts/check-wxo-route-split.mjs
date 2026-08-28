#!/usr/bin/env node
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const wxo = read('wxo-canvas.html');
const doc = read('document-processing.html');
const manifest = JSON.parse(read('data/wxo-canvas-public-provenance.json'));
const fail = (message) => { console.error(`FAIL: ${message}`); process.exitCode = 1; };
const requireText = (source, text, message) => { if (!source.includes(text)) fail(message); };
const forbid = (source, pattern, message) => { if (pattern.test(source)) fail(message); };
const count = (source, pattern) => [...source.matchAll(pattern)].length;
const main = (source) => source.match(/<main\b[\s\S]*?<\/main>/i)?.[0] ?? '';

requireText(wxo, 'class="pilot-side-quest-bridge"', 'wxO umbrella page must contain a visible Document Processing bridge.');
requireText(wxo, 'href="document-processing.html"', 'wxO umbrella page must link to the standalone Document Processing route.');
requireText(wxo, 'Developed in parallel with the broader canvas work', 'wxO bridge must preserve the parallel chronology.');
forbid(main(wxo), /id="document-processing"|pilot-doc-epic|pilot-doc-frame|10-document-extract|11-document-review|12-document-evaluate/i,
  'wxO umbrella page must not embed the full Document Processing feature arc.');
if (count(main(wxo), /09-document-classify\.png/gi) !== 1 || !main(wxo).includes('pilot-bridge-thumbnail')) fail('wxO handoff must reuse exactly one Classify thumbnail without embedding the feature arc.');
if (count(main(wxo), /data-wxo-evidence/gi) !== 10) fail('wxO umbrella page must contain exactly ten carousel evidence triggers.');

requireText(doc, '<link rel="stylesheet" href="css/wxo-public-candidate.css">', 'Standalone route must load the shared evidence presentation layer.');
requireText(doc, '<script src="js/wxo-public-candidate.js" defer></script>', 'Standalone route must load the shared evidence carousel behavior.');
requireText(doc, 'class="pilot-epic-container pilot-doc-epic"', 'Standalone route must own the annotated four-stage feature arc.');
forbid(doc, /pilot-step-arrow--long/, 'Standalone route must not use a clipped long-arrow exception.');
requireText(doc, 'Later phase · Evaluate', 'Standalone route must label Accuracy Evaluation as the later phase.');
requireText(doc, 'data-wxo-gallery', 'Standalone route must provide the in-window evidence carousel.');
for (const file of ['09-document-classify.png', '10-document-extract.png', '11-document-review.png', '12-document-evaluate.png']) {
  requireText(doc, `protected/wxo/assets/public-candidate/${file}`, `Standalone route missing feature-arc board ${file}.`);
  if (file !== '09-document-classify.png') forbid(wxo, new RegExp(file.replace('.', '\\.')), `wxO umbrella page must not retain ${file}.`);
}
if (count(main(doc), /data-wxo-evidence/gi) !== 4) fail('Standalone route must contain exactly four feature-arc carousel triggers.');

const placements = Object.fromEntries((manifest.assets ?? []).map((asset) => [asset.file, asset.route]));
for (const asset of manifest.assets ?? []) {
  if (!['wxo-canvas.html', 'document-processing.html', 'source-only'].includes(asset.route)) fail(`Manifest route missing or invalid for ${asset.file}.`);
}
for (const file of ['09-document-classify.png', '10-document-extract.png', '11-document-review.png', '12-document-evaluate.png']) {
  if (placements[file] !== 'document-processing.html') fail(`Document Processing asset must be routed to document-processing.html: ${file}.`);
}
if ((manifest.assets ?? []).filter((asset) => asset.route === 'wxo-canvas.html').length !== 10) fail('Manifest must route ten assets to wxO canvas.');
if ((manifest.assets ?? []).filter((asset) => asset.route === 'document-processing.html').length !== 4) fail('Manifest must route four assets to Document Processing.');
if ((manifest.assets ?? []).filter((asset) => asset.route === 'source-only').length !== 3 || !['13-floating-studies.png', '13b-flow-types.png', '13c-connector-mechanics.png'].every((file) => placements[file] === 'source-only')) fail('Manifest must retain the original board and two removed trailing studies as source-only provenance.');

if (process.exitCode) process.exit(1);
console.log('PASS: wxO umbrella and standalone Document Processing route split contract');
