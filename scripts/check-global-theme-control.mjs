import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const css = read('css/style.css');

const expectedSharedPages = [
  '404.html',
  'abilityexperience.html',
  'about.html',
  'artillustration.html',
  'document-processing.html',
  'graphicgallery.html',
  'ibm-patterns.html',
  'ibmcloud.html',
  'index.html',
  'pci.html',
  'pikappapp.html',
  'salmagazine.html',
  'uigallery.html',
  'wxo-canvas.html',
].sort();

const rootPages = fs.readdirSync('.')
  .filter(path => path.endsWith('.html'))
  .sort();

assert.deepEqual(
  rootPages,
  expectedSharedPages,
  'The global theme-control contract must enumerate every root HTML route',
);

for (const page of expectedSharedPages) {
  const html = read(page);
  assert.match(html, /<script\b[^>]*src="js\/main\.js"/, `${page} must retain the shared interaction script`);
  assert.match(html, /class="lens-switcher"[^>]*role="group"[^>]*aria-label="Viewing mode"/, `${page} must expose the desktop viewing-mode group`);
  assert.match(html, /data-lens="light"[^>]*aria-pressed="(?:true|false)"[^>]*aria-label="Light mode"/, `${page} must retain an accessible Light control`);
  assert.match(html, /data-lens="dark"[^>]*aria-pressed="(?:true|false)"[^>]*aria-label="Dark mode"/, `${page} must retain an accessible Dark control`);
}


const ruleBody = selector => {
  const start = css.indexOf(`${selector} {`);
  const end = start === -1 ? -1 : css.indexOf('}', start);
  return start === -1 || end === -1 ? '' : css.slice(start, end + 1);
};

assert.ok(
  ruleBody('.lens-switcher').includes('background: var(--surface-floating)'),
  'The shared switcher must use the semantic floating surface globally',
);
assert.match(css, /(?:^|\n)\.lens-switcher-icon::before\s*\{/, 'Shared controls must define a global glyph pseudo-element');
assert.match(css, /(?:^|\n)\[data-lens="light"\] \.lens-switcher-icon::before\s*\{\s*content:\s*'☼';\s*\}/, 'Shared Light controls must expose the sun glyph globally');
assert.match(css, /(?:^|\n)\[data-lens="dark"\] \.lens-switcher-icon::before\s*\{\s*content:\s*'☾';\s*\}/, 'Shared Dark controls must expose the moon glyph globally');
assert.match(css, /(?:^|\n)\.lens-switcher-btn\[aria-pressed="true"\]\s*\{/, 'Selected treatment must be tied globally to aria-pressed=true');
assert.match(css, /(?:^|\n)\.lens-switcher-btn\[aria-pressed="false"\]\s*\{/, 'Unselected treatment must be tied globally to aria-pressed=false');
assert.match(
  css,
  /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?(?:^|\n)\s*\.lens-switcher-btn,[\s\S]*?(?:^|\n)\s*\.lens-switcher-icon\s*\{\s*transition:\s*none;/m,
  'Shared theme controls must define global reduced-motion behavior',
);

for (const forbidden of [
  'html[data-finish-proof] .lens-switcher {',
  'html[data-finish-proof] .lens-switcher-icon',
  'html[data-finish-proof] [data-lens="light"] .lens-switcher-icon::before',
  'html[data-finish-proof] [data-lens="dark"] .lens-switcher-icon::before',
  'html[data-finish-proof] .lens-switcher-btn[aria-pressed="true"]',
  'html[data-finish-proof] .lens-switcher-btn[aria-pressed="false"]',
]) {
  assert.ok(!css.includes(forbidden), `Shared control behavior must no longer be proof-scoped: ${forbidden}`);
}

for (const scopedContentSelector of [
  'html[data-finish-proof] .home-practice-proof',
  'html[data-finish-proof] .page-context',
  'html[data-finish-proof] .about-jump-nav',
]) {
  assert.ok(css.includes(scopedContentSelector), `Route-specific content must remain proof-scoped: ${scopedContentSelector}`);
}

console.log(`GLOBAL THEME CONTROL CONTRACT: PASS shared_pages=${expectedSharedPages.length} standalone_holdouts=2 proof_content_scoped=3`);
