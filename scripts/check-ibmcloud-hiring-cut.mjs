import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const html = read('ibmcloud.html');
const manifest = JSON.parse(read('data/projects.json'));
const preflight = read('scripts/preflight.sh');
const failures = [];
const require = (condition, message) => { if (!condition) failures.push(message); };

const project = manifest.projects.find(item => item.slug === 'ibmcloud');
require(Boolean(project), 'IBM Cloud project manifest entry is missing');
if (project) {
  require(project.protected === true, 'IBM Cloud manifest must be protected');
  require(project.noindex === true, 'IBM Cloud manifest must be noindex');
  require(project.sitemap === false, 'IBM Cloud manifest must be excluded from sitemap');
  require(project.url === 'ibmcloud.html', 'IBM Cloud route must remain ibmcloud.html');
  require(project.images?.[0]?.src === 'images/ibm-thumb-light.png', 'light homepage thumbnail changed');
  require(project.images?.[1]?.src === 'images/ibm-thumb-dark.png', 'dark homepage thumbnail changed');
}

for (const phrase of [
  '<meta name="robots" content="noindex,nofollow">',
  "sessionStorage.getItem('vtd-unlock')!=='ok'",
  '<link rel="stylesheet" href="css/password-gate.css">',
  '<script src="js/password-gate.js" defer></script>',
  '<link rel="stylesheet" href="css/ibmcloud-hiring.css">',
  'data-project="ibm-cloud"',
  'class="nav"',
  'class="lens-switcher"',
  'class="footer"',
  'class="project-nav"',
  'href="wxo-canvas.html"',
  'href="ibm-patterns.html"',
  'I design complex enterprise workflows, stay close to implementation quality, and build visual methods intended to make complex work easier to understand and extend.',
  '2021–2023',
  'id="product-work"',
  'id="team-action"',
  'id="visual-systems"',
  'Carried complex product work',
  'Turned review findings into team action',
  'Designed visual systems for reuse',
  'Event Notifications gave me one of my clearest opportunities to carry a complex workflow from framing through testing and recommendation.',
  'fast-track concept',
  'four dark-mode issues',
  'Reconstructed working method',
  'Improvement Jam findings translated into a UX backlog.',
  'Figma illustration kit developed for pilot use',
  'Create leverage beyond the artifact.',
  'Across IBM Cloud, my strongest work connected individual design decisions to the systems around them',
  'images/ibm-thumb-light.png',
  'images/ibm-thumb-dark.png',
  'images/ibm-p4-world-hifi.jpg',
  'images/ibm-p4-world-01.jpg',
  'images/ibm-p1-sketch.jpg',
  'images/ibm-p1-devops.jpg',
]) {
  require(html.includes(phrase), `missing required protected hiring-page contract: ${phrase}`);
}

for (const phrase of [
  '2021–2024',
  'first project I owned end-to-end',
  'second-largest revenue-generating',
  'nine user interviews',
  'Roughly half',
  'I led UI design across',
  'helped designers build complex assets faster',
  'reusable connected-experiences pattern',
  'Shipped complex product work',
  'PRIVATE REVIEW · NOT FOR PUBLICATION',
  'data:image/',
  'ibm-en-conditions.jpg',
  'ibm-en-custom-domains.jpg',
]) {
  require(!html.includes(phrase), `forbidden legacy/private phrase or asset remains: ${phrase}`);
}

const proofIds = [...html.matchAll(/<section\b[^>]*\bclass="[^"]*\bibm-proof\b[^"]*"[^>]*\bid="([^"]+)"/gi)].map(match => match[1]);
require(JSON.stringify(proofIds) === JSON.stringify(['product-work', 'team-action', 'visual-systems']), `expected exactly three ordered proof sections, found: ${proofIds.join(', ')}`);

const svgLabels = [...html.matchAll(/<svg\b[^>]*\baria-label="([^"]+)"/gi)].map(match => match[1]);
require(svgLabels.length === 3, `expected three sanitized Event Notifications SVGs, found ${svgLabels.length}`);

const images = [...html.matchAll(/<img\b[^>]*>/gi)].map(match => match[0]);
require(images.length >= 8, `expected production shell and selected evidence images, found ${images.length}`);
for (const tag of images) {
  require(/\bwidth="\d+"/i.test(tag), `image missing numeric width: ${tag.slice(0, 100)}`);
  require(/\bheight="\d+"/i.test(tag), `image missing numeric height: ${tag.slice(0, 100)}`);
  require(/\balt="[^"]*"/i.test(tag), `image missing alt attribute: ${tag.slice(0, 100)}`);
}

require(fs.existsSync(path.join(root, 'css/ibmcloud-hiring.css')), 'page-specific IBM hiring CSS is missing');
if (fs.existsSync(path.join(root, 'css/ibmcloud-hiring.css'))) {
  const css = read('css/ibmcloud-hiring.css');
  require(css.includes('[data-project="ibm-cloud"]'), 'IBM hiring CSS must be scoped by data-project');
  require(!/var\(--(?:orange|fg|fg-muted|space-7)\b/.test(css), 'IBM hiring CSS uses an undefined or stale token');
}

require(preflight.includes('node scripts/check-ibmcloud-hiring-cut.mjs'), 'IBM hiring-page contract is not wired into preflight');

if (failures.length) {
  console.error('IBM CLOUD HIRING CUT CONTRACT: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('IBM CLOUD HIRING CUT CONTRACT: PASS');
console.log(`proofs=${proofIds.length} sanitized_svgs=${svgLabels.length} images=${images.length}`);
