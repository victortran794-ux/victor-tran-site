import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const activePages = [
  'index.html', 'about.html', '404.html', 'abilityexperience.html',
  'artillustration.html', 'document-processing.html', 'graphicgallery.html',
  'ibm-patterns.html', 'ibmcloud.html', 'pci.html', 'pikappapp.html',
  'salmagazine.html', 'uigallery.html', 'wxo-canvas.html',
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
  if (file === 'index.html') {
    expect(/class="nav-logo-victor">Victor<\/span>\s*<span class="nav-logo-tran">Tran<\/span>/.test(html),
      'index.html: canonical joined wordmark must remain visible inside the named home link.');
  } else {
    expect(/<img\s+src="images\/nav-logo\.webp"\s+alt=""/.test(html),
      `${file}: navigation avatar must be decorative with alt="".`);
  }
}

const homepage = read('index.html');
expect(/class="hero-dna-trigger"[^>]*aria-expanded="false"[^>]*aria-controls="heroDnaPanel"[^>]*aria-label="Reveal Victor Tran's Design DNA"/.test(homepage),
  'The portrait trigger must name and control the inline Design DNA disclosure.');
expect(/id="heroDnaPanel"[^>]*hidden/.test(homepage),
  'The inline Design DNA panel must begin hidden.');
expect(!/id="dnaOverlay"|aria-modal="true"|aria-label="Change color"|Color shift/i.test(homepage),
  'Retired modal and independent hero color-control semantics must remain absent.');

const js = read('js/main.js');
expect(js.includes('function setDnaExpanded('), 'DNA open and close behavior must share one state setter.');
expect(js.includes("event.key === 'Escape'") && js.includes('restoreFocus: true'),
  'Escape and the close control must restore focus to the portrait trigger.');
expect(js.includes('panel.hidden = false') && js.includes('panel.hidden = true'),
  'Inline DNA behavior must expose and hide the controlled panel.');

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
