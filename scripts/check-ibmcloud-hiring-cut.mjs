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
  require(project.protected === false, 'IBM Cloud manifest must be public');
  require(project.noindex === false, 'IBM Cloud manifest must be indexable');
  require(project.sitemap === true, 'IBM Cloud manifest must be included in the sitemap');
  require(project.url === 'ibmcloud.html', 'IBM Cloud route must remain ibmcloud.html');
  require(project.surface === 'ibm-inverse', 'IBM Cloud homepage card must use the bounded inverse surface');
  require(project.images?.length === 1, 'IBM Cloud homepage card must use one dominant thumbnail');
  require(project.images?.[0]?.src === 'images/ibm-thumb-dark.png', 'IBM Cloud homepage thumbnail must use the existing dark-theme image');
}

for (const phrase of [
  '<link rel="stylesheet" href="css/ibmcloud-hiring.css">',
  'data-project="ibm-cloud"',
  'class="nav"',
  'class="lens-switcher"',
  'class="footer"',
  'class="project-nav"',
  'href="wxo-canvas.html"',
  'href="ibm-patterns.html"',
  'My journey into observability',
  '2021–2023',
  'id="product-work"',
  'id="team-action"',
  'id="visual-systems"',
  'Pending protected asset selection',
  'Carried complex product work',
  'Turned review findings into team action',
  'Designed visual systems for reuse',
  'Event Notifications gave me one of my clearest opportunities to carry a complex workflow from framing through testing and recommendation.',
  'faster sequence through Details, Sources, Destinations, and Review',
  'four dark-mode issues',
  'Reconstructed working method',
  'Improvement Jam findings translated into a UX backlog.',
  'Figma illustration kit developed for pilot use',
  'Create leverage beyond the artifact.',
  'Across IBM Cloud, I moved from needing the system explained to me',
  'images/ibm-thumb-light.png',
  'images/ibm-thumb-dark.png',
]) {
  require(html.includes(phrase), `missing required protected hiring-page contract: ${phrase}`);
}

for (const phrase of [
  '<meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex">',
  '<meta name="referrer" content="no-referrer">',
  "sessionStorage.getItem('vtd-unlock')",
  'css/password-gate.css',
  'js/password-gate.js',
  'site-route-status',
  '2021–2024',
  'first project I owned end-to-end',
  'second-largest revenue-generating',
  'nine user interviews',
  'Roughly half',
  'I led UI design across',
  'helped designers build complex assets faster',
  'reusable connected-experiences pattern',
  'Shipped complex product work',
  'Some releases shipped',
  'PRIVATE REVIEW · NOT FOR PUBLICATION',
  'data:image/',
  'ibm-en-conditions.jpg',
  'ibm-en-custom-domains.jpg',
  '<dt>Client</dt>',
  'class="ibm-visual-atlas',
]) {
  require(!html.includes(phrase), `forbidden legacy/private phrase or asset remains: ${phrase}`);
}

const proofIds = [...html.matchAll(/<section\b[^>]*\bclass="[^"]*\bibm-proof\b[^"]*"[^>]*\bid="([^"]+)"/gi)].map(match => match[1]);
require(JSON.stringify(proofIds) === JSON.stringify(['product-work', 'team-action', 'visual-systems']), `expected exactly three ordered proof sections, found: ${proofIds.join(', ')}`);
const narrativeWords = (html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || '')
  .replace(/<(?:script|style|svg)\b[\s\S]*?<\/(?:script|style|svg)>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .trim()
  .split(/\s+/)
  .filter(Boolean).length;
require(narrativeWords <= 1150, `IBM Cloud narrative exceeded the reduced-copy ceiling: ${narrativeWords} words`);
require((html.match(/class="[^"]*\bibm-evidence-reservation\b[^"]*"/g) || []).length === 2, 'expected exactly two honest pending evidence reservations');
require((html.match(/data-media-slot data-asset-status="victor-selection-required"/g) || []).length === 2, 'pending slots must remain empty and explicitly require Victor selection');
const pendingReservations = [...html.matchAll(/<aside\b[^>]*\bibm-evidence-reservation\b[^>]*>([\s\S]*?)<\/aside>/gi)].map(match => match[1]);
require(pendingReservations.length === 2 && pendingReservations.every(slot => !/<(?:img|picture|svg)\b|\bsrc\s*=/i.test(slot)), 'pending evidence reservations must not impersonate selected media');

const svgLabels = [...html.matchAll(/<svg\b[^>]*\baria-label="([^"]+)"/gi)].map(match => match[1]);
require(svgLabels.length === 3, `expected three sanitized Event Notifications SVGs, found ${svgLabels.length}`);

const images = [...html.matchAll(/<img\b[^>]*>/gi)].map(match => match[0]);
require(images.length >= 3, `expected production shell and approved hero evidence images, found ${images.length}`);
for (const tag of images) {
  require(/\bwidth="\d+"/i.test(tag), `image missing numeric width: ${tag.slice(0, 100)}`);
  require(/\bheight="\d+"/i.test(tag), `image missing numeric height: ${tag.slice(0, 100)}`);
  require(/\balt="[^"]*"/i.test(tag), `image missing alt attribute: ${tag.slice(0, 100)}`);
}

require(fs.existsSync(path.join(root, 'css/ibmcloud-hiring.css')), 'page-specific IBM hiring CSS is missing');
if (fs.existsSync(path.join(root, 'css/ibmcloud-hiring.css'))) {
  const css = read('css/ibmcloud-hiring.css');
  require(css.includes('[data-project="ibm-cloud"]'), 'IBM hiring CSS must be scoped by data-project');
  require(css.includes('[data-project="ibm-cloud"] .ibm-hiring-hero {') && css.includes('border-bottom: 0;'), 'IBM Cloud must remove the crowded page-header divider');
  require(css.includes('[data-project="ibm-cloud"] .ibm-evidence-reservation'), 'IBM Cloud pending evidence reservations are unstyled');
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
