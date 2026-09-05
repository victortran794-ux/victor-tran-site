#!/usr/bin/env node
import fs from 'node:fs';

const html = fs.readFileSync('wxo-canvas.html', 'utf8');
const css = fs.readFileSync('css/wxo-public-candidate.css', 'utf8');
const fail = (message) => { console.error(`FAIL: ${message}`); process.exitCode = 1; };

const activity = html.match(/<section class="pilot-section" aria-labelledby="pilot-activity-title">([\s\S]*?)<\/section>/)?.[1] ?? '';
if (!/pilot-activity-epic[\s\S]*pilot-activity-intro[\s\S]*id="pilot-activity-title"/.test(activity)) {
  fail('User Activities intro must be inside its existing green epic container.');
}
if (!css.includes('.wxo-public-pilot .pilot-activity-intro')) fail('User Activities needs a scoped in-container intro rule.');
if (!css.includes('.wxo-public-pilot .pilot-close h2 {\n  max-width: 100%;\n  font-size: clamp(2.25rem, 2.9vw, 3.25rem);')) {
  fail('Throughline heading must use the bounded closing scale.');
}
if (!css.includes('.wxo-public-pilot .pilot-close-media {\n  min-width: 0;')) fail('Closing illustration column must be allowed to shrink without clipping.');
if (!css.includes('.wxo-public-pilot .pilot-exploration-grid--node {\n  grid-template-columns: 1fr;\n  max-width: 1080px;')) {
  fail('Node-state studies must use one readable column instead of two cramped panels.');
}
if (!process.exitCode) console.log('PASS: wxO bounded layout follow-up source contract');
