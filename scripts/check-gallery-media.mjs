import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const failures = [];
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const expect = (condition, message) => { if (!condition) failures.push(message); };

const js = read('js/main.js');
const css = read('css/style.css');
const buildFunction = js.slice(
  js.indexOf('function buildThumbnails()'),
  js.indexOf('function goTo(idx)'),
);
const openFunction = js.match(/function open\([^)]*\) \{([\s\S]*?)\n  \}/)?.[1] ?? '';
expect(buildFunction.startsWith('function buildThumbnails()'),
  'Gallery lightbox must defer thumbnail construction behind buildThumbnails().');
expect(buildFunction.includes("btn.addEventListener('mouseenter'"),
  'Deferred lightbox thumbnails must retain the custom cursor hover-in behavior.');
expect(buildFunction.includes("btn.addEventListener('mouseleave'"),
  'Deferred lightbox thumbnails must retain the custom cursor hover-out behavior.');
const buildIndex = openFunction.indexOf('buildThumbnails();');
const goToIndex = openFunction.indexOf('goTo(idx);');
expect(buildIndex >= 0, 'Gallery lightbox must build thumbnails when the viewer opens.');
expect(goToIndex >= 0, 'Gallery lightbox must select the requested image when the viewer opens.');
expect(buildIndex >= 0 && goToIndex >= 0 && buildIndex < goToIndex,
  'Gallery lightbox must build thumbnails before selecting one when the viewer opens.');
expect(buildFunction.includes('if (canUseCustomCursor)'),
  'Deferred thumbnail cursor handlers must remain guarded for fine-pointer devices.');
expect(buildFunction.includes("ring.classList.add('cursor-ring--hover')"),
  'Deferred thumbnail hover-in must expand the custom cursor ring.');
expect(buildFunction.includes("ring.classList.remove('cursor-ring--hover')"),
  'Deferred thumbnail hover-out must restore the custom cursor ring.');

for (const selector of ['.gallery-grid img', '.gallery-spotlight-fig img', '.gallery-feature img']) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rule = css.match(new RegExp(`${escaped}\\s*\\{[^}]*\\}`, 's'))?.[0] ?? '';
  expect(/height:\s*auto;/.test(rule),
    `${selector} must preserve intrinsic image proportions with height: auto.`);
}

for (const [file, src] of [
  ['artillustration.html', 'images/illus-ibm-selectric-web.jpg'],
  ['graphicgallery.html', 'images/gg-edc-1.jpg'],
]) {
  const html = read(file);
  const escapedSrc = src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const image = html.match(new RegExp(`<img[^>]*src="${escapedSrc}"[^>]*>`))?.[0] ?? '';
  expect(image.includes('loading="eager"'), `${file}: the first gallery image must load eagerly.`);
  expect(image.includes('fetchpriority="high"'), `${file}: the first gallery image must have high fetch priority.`);
}

const checkCommand = 'node scripts/check-gallery-media.mjs';
const preflight = read('scripts/preflight.sh');
const workflow = read('.github/workflows/health-check.yml');
expect(preflight.includes(checkCommand), 'Local preflight must run the gallery media regression check.');
expect(workflow.includes('"scripts/check-gallery-media.mjs"'),
  'Gallery media regression script changes must trigger CI.');
expect(workflow.includes(`run: ${checkCommand}`), 'CI must run the gallery media regression check.');

if (failures.length) {
  console.error(`Gallery media regression check failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Gallery media regression check passed.');
