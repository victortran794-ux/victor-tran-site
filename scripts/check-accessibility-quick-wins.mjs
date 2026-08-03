import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const activePages = [
  'index.html', 'about.html', '404.html', 'abilityexperience.html',
  'artillustration.html', 'document-processing.html', 'graphicgallery.html',
  'ibm-patterns.html', 'ibmcloud.html', 'pci.html', 'pikappapp.html',
  'salmagazine.html', 'wxo-canvas.html',
];
const failures = [];
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const expect = (condition, message) => { if (!condition) failures.push(message); };

const hexToRgb = (hex) => {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((start) => Number.parseInt(value.slice(start, start + 2), 16));
};
const luminance = (hex) => {
  const channels = hexToRgb(hex).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
};
const contrast = (a, b) => {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
};

const css = read('css/style.css');
const textBlueMatch = css.match(/--blue-text:\s*(#[0-9a-f]{6})/i);
expect(textBlueMatch, 'Define a six-digit --blue-text semantic token.');
if (textBlueMatch) {
  expect(contrast(textBlueMatch[1], '#ffffff') >= 4.5,
    `--blue-text ${textBlueMatch[1]} must reach 4.5:1 on white.`);
}
for (const selector of ['.label-default', '.about-now-label', '.footer-cta']) {
  const escaped = selector.replace('.', '\\.');
  const rule = css.match(new RegExp(`${escaped}[^\\{]*\\{[^}]*\\}`, 's'))?.[0] ?? '';
  expect(rule.includes('var(--blue-text)'), `${selector} must use var(--blue-text).`);
}

for (const file of activePages) {
  const html = read(file);
  expect(/<a\s+href="index\.html"\s+class="nav-logo"\s+aria-label="Victor Tran home">/.test(html),
    `${file}: navigation logo link must retain an accessible name when its visible text is hidden.`);
  expect(/<img\s+src="images\/nav-logo\.webp"\s+alt=""/.test(html),
    `${file}: navigation avatar must be decorative with alt="".`);
}

const homepage = read('index.html');
expect(/id="dnaOverlay"[^>]*\sinert(?:\s|>)/.test(homepage),
  'The closed Design DNA overlay must begin inert.');
expect(/aria-label="Change color"/i.test(homepage),
  'The hero color button accessible name must match its visible “Change color” text.');
expect(!/Color shift/i.test(homepage),
  'The hero color control must not expose the former “Color shift” label.');

const js = read('js/main.js');
expect(js.includes('overlay.inert = false'), 'DNA open behavior must remove inert.');
expect(js.includes('overlay.inert = true'), 'DNA close behavior must restore inert.');
expect(js.includes("e.key === 'Tab'"), 'DNA overlay must trap Tab focus while open.');
expect(js.includes("[contenteditable=\"true\"]"),
  'DNA focus discovery must include the contenteditable playground.');
expect(js.includes('!overlay.contains(document.activeElement)'),
  'DNA Tab handling must recover focus when the active element is outside the open dialog.');
expect(js.includes("e.shiftKey ? last : first"),
  'DNA outside-focus recovery must respect forward and reverse Tab direction.');

const preflight = read('scripts/preflight.sh');
expect(preflight.includes('run_required "Accessibility quick-win regression check" node scripts/check-accessibility-quick-wins.mjs'),
  'Preflight must invoke the accessibility regression check unconditionally.');
expect(!preflight.includes('if [ -f "scripts/check-accessibility-quick-wins.mjs" ]'),
  'Preflight must fail rather than silently skip a missing accessibility regression check.');

const sitemap = read('sitemap.xml');
expect(!sitemap.includes('/playground'), 'The sitemap must not include the dead /playground URL.');

if (failures.length) {
  console.error(`Accessibility quick-win regression check failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Accessibility quick-win regression check passed for ${activePages.length} active pages.`);
