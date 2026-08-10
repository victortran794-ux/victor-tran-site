import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const html = read('ibmcloud.html');
const manifest = JSON.parse(read('data/projects.json'));
const dashboard = read('PORTFOLIO_DASHBOARD.md');
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
  'I learned a technical platform, then used product and visual design to make its systems easier to understand.',
  '2021–2023',
  'id="product-work"',
  'id="team-action"',
  'id="visual-systems"',
  'Shaped a full product flow',
  'Turned findings into action',
  'Built visual methods for reuse',
  'Event Notifications was my first self-led product-design journey.',
  'faster sequence through Details, Sources, Destinations, and Review',
  'The flow was the main body of work.',
  'four dark-mode issues',
  'Reconstructed working method',
  'An Improvement Jam separated implementation fixes from wider product questions and translated the work into a UX backlog.',
  'Figma illustration kit developed for pilot use',
  'Design the next step.',
  'IBM Cloud taught me to understand the system before proposing the screen.',
  'images/ibm-thumb-light.png',
  'images/ibm-thumb-dark.png',
  'images/ibm-cloud-routing-architecture.png',
  'images/ibm-cloud-visual-system-foundations.png',
  'images/ibm-cloud-card-component-design.png',
  'images/ibm-cloud-event-flow-details.png',
  'images/ibm-cloud-event-flow-condition-empty.png',
  'images/ibm-cloud-event-flow-condition-compound.png',
  'images/ibm-cloud-research-framing.png',
  'images/ibm-cloud-research-findings.png',
  'images/ibm-cloud-concept-to-final.png',
  'images/ibm-cloud-isometric-compositions.png',
  'images/ibm-cloud-service-icons.png',
  'I took this component into high fidelity, focusing on hierarchy, connection status, and actions.',
  'The first round framed the research questions around subscription structure and flow.',
  'The findings sharpened hierarchy, terminology, and expectations for reusable destinations and sources.',
  'Events, metrics, and logs moved through a shared technical environment.',
  'Early sketches narrowed composition, service metaphors, and hierarchy before final rendering.',
  'Shared perspective and lighting rules connected distinct product stories without making them identical.',
  'A reduced service-icon set carried the same geometry and color discipline into smaller surfaces.',
  'Shared base, shadow, color, gradient, and lighting rules made the illustration language inspectable and reusable.',
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
  'clearest example',
  'Sysdig Secure and IBM Cloud Logs provide the release context around it.',
  'class="product-facsimile"',
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
require(narrativeWords <= 900, `IBM Cloud narrative exceeded the reduced-copy ceiling: ${narrativeWords} words`);
require(!html.includes('Pending protected asset selection'), 'cleared supporting images must replace both pending evidence reservations');
require(!html.includes('data-asset-status="victor-selection-required"'), 'IBM Cloud must not retain a Victor-selection placeholder after cleared assets are supplied');
require((html.match(/class="[^"]*\bibm-evidence-artifact\b[^"]*"/g) || []).length === 7, 'expected exactly seven curated artifact cards outside the three-screen product flow and dedicated technical-context figure');
require((html.match(/class="[^"]*\bibm-tech-context\b[^"]*"/g) || []).length === 1, 'expected one dedicated technical-context figure near the opening');

const selectedAssets = {
  'images/ibm-cloud-event-flow-details.png': {
    sha256: '48f8afd7a128bb8cb50dd7837475a3fc97b4daf33a47f7c940a7e3dcb731e8af',
    width: '1024',
    height: '656',
  },
  'images/ibm-cloud-event-flow-condition-empty.png': {
    sha256: 'd3c6552adda082a1a6bd3f8c0330207b21383168f12198045c66af7784fc20f3',
    width: '1024',
    height: '656',
  },
  'images/ibm-cloud-event-flow-condition-compound.png': {
    sha256: '416ccce17c3ff145374f4f8b9d279ed7fdeed96e6ce840968308b0f3bed74224',
    width: '1024',
    height: '656',
  },
  'images/ibm-cloud-routing-architecture.png': {
    sha256: '606ee4e19741eead6c0b545254b4858c4bf59880ae93f85a970bcad9859b8bd3',
    width: '1024',
    height: '768',
  },
  'images/ibm-cloud-visual-system-foundations.png': {
    sha256: '60b5f263629b627268815f79d7e758f0287605bdc556a2b7e8a64727c5884420',
    width: '1024',
    height: '350',
  },
  'images/ibm-cloud-card-component-design.png': {
    sha256: '50ba0a8dcf0c784584ec44b345b21256a2d5195491dd276bd859f47ea39c72c9',
    width: '1024',
    height: '640',
  },
  'images/ibm-cloud-research-framing.png': {
    sha256: '71c0dc8da093d0b2c3360614b0aa41f527c0d79f52f4779315f167990ae1ba6a',
    width: '1024',
    height: '324',
  },
  'images/ibm-cloud-research-findings.png': {
    sha256: '4b789a00f8e4f298e6e40f8635bb02ea1b5533312becd5b32338cc9e689d08cf',
    width: '1024',
    height: '304',
  },
  'images/ibm-cloud-concept-to-final.png': {
    sha256: 'a04c3acdcac03f6acbe79a097f013e6efb17506e58d356ef0e659afb3181d3dd',
    width: '820',
    height: '360',
  },
  'images/ibm-cloud-isometric-compositions.png': {
    sha256: '00811e67c5336b8874507aff2261ae546c2b1bc16da06bfdb7fcfdd09aec4cb5',
    width: '1024',
    height: '320',
  },
  'images/ibm-cloud-service-icons.png': {
    sha256: '123801a037b685a053d9bfe0fd3ac706b0815fb00923d93b35a9286e04c20095',
    width: '1024',
    height: '292',
  },
};
for (const [relative, expected] of Object.entries(selectedAssets)) {
  const absolute = path.join(root, relative);
  require(fs.existsSync(absolute), `selected IBM Cloud evidence asset is missing: ${relative}`);
  if (fs.existsSync(absolute)) {
    const digest = crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex');
    require(digest === expected.sha256, `selected IBM Cloud evidence asset drifted: ${relative}`);
  }
  const escaped = relative.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tag = html.match(new RegExp(`<img\\b[^>]*src="${escaped}"[^>]*>`, 'i'))?.[0] || '';
  require(Boolean(tag), `selected IBM Cloud evidence image is not rendered: ${relative}`);
  require(tag.includes(`width="${expected.width}"`) && tag.includes(`height="${expected.height}"`), `selected IBM Cloud evidence image has incorrect intrinsic dimensions: ${relative}`);
  require(/\balt="[^"]+"/i.test(tag), `selected IBM Cloud evidence image needs descriptive alt text: ${relative}`);
}

require(fs.existsSync(path.join(root, 'case-studies/ibmcloud.md')), 'IBM Cloud source and publication manifest is missing');
if (fs.existsSync(path.join(root, 'case-studies/ibmcloud.md'))) {
  const sourceManifest = read('case-studies/ibmcloud.md');
  for (const phrase of ['Figma node `6:7102`', 'Figma node `6:7107`', 'Figma node `6:7108`', 'Figma node `6:7238`', 'Figma node `6:8838`', 'Figma node `6:8635`', 'Figma node `6:8632`', 'Figma node `6:8633`', 'Figma node `6:8626`', 'Figma node `6:7278`', 'Figma node `6:7111`', 'sample-size metric removed', 'one-pixel export boundary removed', '40 pixels of bottom breathing room', ...Object.values(selectedAssets).map(asset => asset.sha256)]) {
    require(sourceManifest.includes(phrase), `IBM Cloud source manifest is missing provenance: ${phrase}`);
  }
}

const svgLabels = [...html.matchAll(/<svg\b[^>]*\baria-label="([^"]+)"/gi)].map(match => match[1]);
require(svgLabels.length === 0, `authentic Event Notifications exports must replace the three facsimile SVGs, found ${svgLabels.length} labeled SVGs`);

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
  require(css.includes('[data-project="ibm-cloud"] .ibm-evidence-artifact'), 'IBM Cloud selected evidence artifacts are unstyled');
  for (const selector of ['.ibm-tech-context', '.ibm-research-pair', '.ibm-visual-sequence']) {
    require(css.includes(`[data-project="ibm-cloud"] ${selector}`), `IBM Cloud revised evidence sequence is missing styles for ${selector}`);
  }
  require(!/var\(--(?:orange|fg|fg-muted|space-7)\b/.test(css), 'IBM hiring CSS uses an undefined or stale token');
}

require(preflight.includes('node scripts/check-ibmcloud-hiring-cut.mjs'), 'IBM hiring-page contract is not wired into preflight');
require(
  dashboard.includes('eleven-artifact Figma expansion production-verified in PR #135'),
  'Portfolio dashboard must record the approved IBM Cloud supporting-image expansion as production-verified in PR #135',
);

if (failures.length) {
  console.error('IBM CLOUD HIRING CUT CONTRACT: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('IBM CLOUD HIRING CUT CONTRACT: PASS');
console.log(`proofs=${proofIds.length} authentic_flow_images=3 evidence_assets=${Object.keys(selectedAssets).length} images=${images.length}`);
