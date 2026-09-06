#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

const html = read('index.html');
const css = read('css/style.css');
const js = read('js/main.js');
const generatorPath = path.join(root, 'scripts/generate-home-portrait-derivatives.py');
const generator = fs.existsSync(generatorPath) ? fs.readFileSync(generatorPath, 'utf8') : '';
const responsive = [
  'images/hero/responsive/figure20-320.webp',
  'images/hero/responsive/figure20-640.webp',
  'images/hero/responsive/figure19-320.webp',
  'images/hero/responsive/figure19-640.webp',
];
const browser = read('scripts/check-home-mobile-maintenance-browser.mjs');
expect(!/\/home\/[a-z0-9_-]+\//i.test(browser), 'browser harness must not contain private machine paths');
expect(browser.includes('resizeProof') && browser.includes('normalized orbit changed'), 'browser harness must exercise post-navigation resizing and normalized orbit invariance');
const provenancePath = path.join(root, 'images/hero/responsive/provenance.json');

expect(!/style\.setProperty\(['"]--blob-x/.test(js) && !/style\.setProperty\(['"]--blob-y/.test(js),
  'ambient orbit must not update left/top coordinate variables during animation');
expect(/--blob-shift-x/.test(js) && /--blob-shift-y/.test(js),
  'ambient orbit must express movement through transform shift variables');
expect(/left:\s*var\(--blob-anchor-x\)/.test(css) && /top:\s*var\(--blob-anchor-y\)/.test(css),
  'ambient blobs must begin from the approved static anchors');
expect(/transform:\s*translate\(-50%,\s*-50%\)\s*translate3d\(var\(--blob-shift-x/.test(css),
  'ambient blobs must apply their field movement in transform');
expect(/will-change:\s*transform,\s*border-radius/.test(css),
  'ambient blobs must not advertise left/top layout changes');
expect(/hero-ambient-blob--a\s*\{[^}]*--blob-anchor-x:\s*17\.678227360308284%[^}]*--blob-anchor-y:\s*23\.300970873786408%/s.test(css),
  'blob A static anchor must match the approved ambient baseline');
expect(/hero-ambient-blob--b\s*\{[^}]*--blob-anchor-x:\s*45\.13487475915222%[^}]*--blob-anchor-y:\s*79\.87643424536628%/s.test(css),
  'blob B static anchor must match the approved ambient baseline');

const bootstrap = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1]).find(source => source.includes('const portrait'));
for (const lens of ['light', 'dark', 'storage-blocked']) {
  const links = [];
  try {
    vm.runInNewContext(bootstrap || '', {
      localStorage: { getItem() { if (lens === 'storage-blocked') throw new Error('blocked'); return lens; } },
      document: { documentElement: { setAttribute() {} }, createElement: () => ({}), head: { appendChild: link => links.push(link) } },
    });
    const portrait = lens === 'dark' ? 'figure19' : 'figure20';
    expect(links.length === 1 && links[0].href === `images/hero/responsive/${portrait}-320.webp`
      && links[0].imageSrcset.includes(`${portrait}-640.webp 640w`) && links[0].imageSizes === '112px'
      && links[0].fetchPriority === 'high', `preload must select only the active portrait: ${lens}`);
  } catch (error) { expect(false, `portrait preload must work without document.write or storage access: ${error.message}`); }
}
expect(!/<link rel="preload"[^>]+figure19/.test(html),
  'inactive dark portrait must not preload on the default light visit');
expect(/data-theme-portrait="light"[^>]*>[\s\S]*?<img class="hero-portrait-cutout"[^>]*src="images\/hero\/responsive\/figure20-320\.webp"[^>]*srcset="images\/hero\/responsive\/figure20-320\.webp 320w, images\/hero\/responsive\/figure20-640\.webp 640w"[^>]*sizes="112px"[^>]*width="320" height="461"/s.test(html),
  'the JS-off light portrait fallback must use truthful responsive delivery');
expect(/data-theme-portrait="dark"[^>]*>[\s\S]*?<img class="hero-portrait-cutout"[^>]*data-hero-portrait-src="images\/hero\/responsive\/figure19-320\.webp"[^>]*data-hero-portrait-srcset="images\/hero\/responsive\/figure19-320\.webp 320w, images\/hero\/responsive\/figure19-640\.webp 640w"[^>]*data-hero-portrait-sizes="112px"[^>]*width="320" height="470"/s.test(html),
  'the dark portrait must remain deferred with truthful responsive metadata');
expect(js.includes('function syncHeroPortraits(lens)') && js.includes('portrait.dataset.heroPortraitSrc'),
  'theme changes must hydrate the requested hero portrait promptly');

expect(/hero-ambient-blob--a\s*\{[^}]*--blob-size-scale:\s*0\.81/s.test(css)
  && /hero-ambient-blob--b\s*\{[^}]*--blob-size-scale:\s*0\.5;/s.test(css), 'initial blob sizes must match the approved preset, avoiding initialization shifts');
expect(js.includes('ambient.clientWidth') && js.includes('ambient.clientHeight'), 'transform distance must use the actual ambient containing block');

expect(generator.includes("images/hero/figure20.webp") && generator.includes("images/hero/figure19.webp")
  && generator.includes('320, 640') && generator.includes('pillow==12.3.0'),
  'the dedicated portrait generator must pin the selected sources, widths, and encoder runtime');
for (const relative of responsive) expect(fs.existsSync(path.join(root, relative)), `${relative} must exist`);
expect(fs.existsSync(provenancePath), 'portrait provenance must exist');
if (fs.existsSync(provenancePath)) {
  const provenance = JSON.parse(fs.readFileSync(provenancePath, 'utf8'));
  expect(provenance.generator === 'scripts/generate-home-portrait-derivatives.py', 'provenance must name the public generator path');
  expect(provenance.encoder?.format === 'WEBP' && provenance.encoder?.quality === 82 && provenance.encoder?.method === 6,
    'provenance must record the pinned WebP encoder settings');
  for (const [source, expectedHash] of Object.entries({
    'images/hero/figure20.webp': 'af0f6af4f57994047b157ebc5b2f1a7ff8b7212627bfcb54a0338da43eb9258c',
    'images/hero/figure19.webp': '9aab8905eda63e703ce6af6b0639a86ae4e7022b69bb593b08482a7011cc36de',
  })) {
    const bytes = fs.readFileSync(path.join(root, source));
    expect(crypto.createHash('sha256').update(bytes).digest('hex') === expectedHash, `${source} source hash changed`);
    expect(provenance.sources?.[source]?.sha256 === expectedHash, `${source} provenance hash must match source`);
  }
  for (const relative of responsive) {
    const entry = provenance.outputs?.[relative];
    expect(entry?.bytes === fs.statSync(path.join(root, relative)).size, `${relative} provenance byte count must match`);
    expect(entry?.sha256 === crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relative))).digest('hex'), `${relative} provenance hash must match`);
  }
}

if (failures.length) {
  console.error('HOME MOBILE MAINTENANCE CONTRACT: FAIL');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('HOME MOBILE MAINTENANCE CONTRACT: PASS');
