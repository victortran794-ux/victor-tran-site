import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const html = read('ibmcloud.html');
const css = read('css/ibmcloud-hiring.css');
const manifest = JSON.parse(read('data/projects.json'));
const sourceManifest = read('case-studies/ibmcloud.md');
const dashboard = read('PORTFOLIO_DASHBOARD.md');
const preflight = read('scripts/preflight.sh');
const failures = [];
const require = (condition, message) => { if (!condition) failures.push(message); };

const project = manifest.projects.find(item => item.slug === 'ibmcloud');
require(Boolean(project), 'IBM Cloud project manifest entry is missing');
if (project) {
  require(project.protected === false, 'IBM Cloud manifest must remain public');
  require(project.noindex === false, 'IBM Cloud manifest must remain indexable');
  require(project.sitemap === true, 'IBM Cloud must remain in the sitemap');
  require(project.url === 'ibmcloud.html', 'IBM Cloud route must remain ibmcloud.html');
  require(project.surface === 'ibm-inverse', 'IBM Cloud homepage card must retain its inverse surface');
  require(project.images?.length === 1 && project.images[0]?.src === 'images/ibm-thumb-dark.png', 'IBM Cloud homepage card must retain one dark-theme thumbnail');
}

for (const phrase of [
  '<link rel="stylesheet" href="css/ibmcloud-hiring.css">',
  'data-project="ibm-cloud"',
  'class="nav"',
  'class="lens-switcher"',
  'class="footer"',
  'class="project-nav"',
  'href="wxo-canvas.html?lock=1"',
  'href="ibm-patterns.html"',
  'I used product design and reusable visual systems to make complex cloud work easier to understand and extend.',
  '2021–2023',
  'id="product-work"',
  'id="team-action"',
  'id="visual-systems"',
  'Design a subscription flow people can understand.',
  'My first start-to-finish product-design project consolidated sources, destinations, subscriptions, and conditions into a simpler stepped flow. Concept testing supported the direction.',
  'Proposed and concept-tested, not evidence of shipment or measured impact.',
  'Adapt an existing product toward IBM Cloud conventions.',
  'I explored how IBM Cloud Logs could adopt IBM Cloud visual conventions.',
  'Token translation mapped source visualization roles toward IBM theme values.',
  'Token translation · Internal exploration',
  'Build a visual method the team could extend.',
  'I created most of the original product illustrations and reusable components, then partnered with the team to document and scale the method.',
  'Concept to final',
  'Reusable foundations',
  'Light and dark product family',
  'Reduced service metaphors',
  'images/ibm-thumb-light.png',
  'images/ibm-thumb-dark.png',
  'images/ibm-cloud-event-flow-details.png',
  'images/ibm-cloud-event-flow-condition-empty.png',
  'images/ibm-cloud-event-flow-condition-compound.png',
  'images/ibm-cloud-proof02-token-translation.png',
  'images/ibm-cloud-concept-to-final.png',
  'images/ibm-cloud-visual-system-foundations.png',
  'images/ibm-cloud-service-icons.png',
]) require(html.includes(phrase), `missing lean IBM Cloud requirement: ${phrase}`);

for (const phrase of [
  'ibm-hiring-intro',
  'ibm-tech-context',
  'ibm-proof-index',
  'ibm-product-research',
  'ibm-research-pair',
  'ibm-ux-decision-rail',
  'ibm-ux-decision-item',
  'ibm-component-artifact',
  'ibm-proof-copy',
  'ibm-systems-layout',
  'ibm-system-result',
  'ibm-hiring-close',
  'images/ibm-cloud-routing-architecture.png',
  'images/ibm-cloud-research-framing.png',
  'images/ibm-cloud-research-findings.png',
  'images/ibm-cloud-card-component-design.png',
  'images/ibm-cloud-isometric-compositions.png',
  'images/ibm-cloud-observability-light.png',
  'images/ibm-cloud-observability-dark.png',
  'Research, exploration, and moments of delight.',
  'Not proof of shipment',
  'Sanitized source',
  'based on Coralogix',
  'Monitoring heuristic evaluation',
  'Mentoring',
  'onboarding',
  '<dt>Client</dt>',
  'data:image/',
  'css/password-gate.css',
  'js/password-gate.js',
]) require(!html.includes(phrase), `presentation-only or retired material remains in the public composition: ${phrase}`);

const proofIds = [...html.matchAll(/<section\b[^>]*\bclass="[^"]*\bibm-proof\b[^"]*"[^>]*\bid="([^"]+)"/gi)].map(match => match[1]);
require(JSON.stringify(proofIds) === JSON.stringify(['product-work', 'team-action', 'visual-systems']), `expected three ordered proof sections, found: ${proofIds.join(', ')}`);
const classTokens = [...html.matchAll(/\bclass="([^"]*)"/gi)].flatMap(match => match[1].trim().split(/\s+/));
require(classTokens.filter(token => token === 'ibm-flow-screen').length === 3, 'expected exactly three Event Notifications screens');
require(classTokens.filter(token => token === 'ibm-theme-pair').length === 5, 'expected exactly five product-family pairs after the Observability hero');
require(classTokens.filter(token => token === 'ibm-evidence-artifact').length === 5, 'expected exactly five curated evidence figures outside the three-screen flow and hero');

const narrativeWords = (html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || '')
  .replace(/<(?:script|style|svg)\b[\s\S]*?<\/(?:script|style|svg)>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .trim()
  .split(/\s+/)
  .filter(Boolean).length;
require(narrativeWords <= 520, `IBM Cloud lean narrative exceeded 520 words: ${narrativeWords}`);

const selectedAssets = {
  'images/ibm-thumb-light.png': ['3cfbde727064eda8947f0707c32d1477a08768e57051671e2ebae6743770de35', '960', '540'],
  'images/ibm-thumb-dark.png': ['50615fbf95ae0c7c282c1f30f31447de6501aad434596868352dfa05a21e4c27', '960', '540'],
  'images/ibm-cloud-event-flow-details.png': ['48f8afd7a128bb8cb50dd7837475a3fc97b4daf33a47f7c940a7e3dcb731e8af', '1024', '656'],
  'images/ibm-cloud-event-flow-condition-empty.png': ['d3c6552adda082a1a6bd3f8c0330207b21383168f12198045c66af7784fc20f3', '1024', '656'],
  'images/ibm-cloud-event-flow-condition-compound.png': ['416ccce17c3ff145374f4f8b9d279ed7fdeed96e6ce840968308b0f3bed74224', '1024', '656'],
  'images/ibm-cloud-proof02-token-translation.png': ['9a0e4971a673cb3b5c8b5b05e34bdfa2f18c3126d65c9b1d39671be3100ceb17', '1322', '440'],
  'images/ibm-cloud-concept-to-final.png': ['a04c3acdcac03f6acbe79a097f013e6efb17506e58d356ef0e659afb3181d3dd', '820', '360'],
  'images/ibm-cloud-visual-system-foundations.png': ['60b5f263629b627268815f79d7e758f0287605bdc556a2b7e8a64727c5884420', '1024', '350'],
  'images/ibm-cloud-code-engine-light.png': ['ff92d0376ee9d9856d4d765e046853049efd0ea3b89f18deba0bbf5cde26a8b0', '960', '540'],
  'images/ibm-cloud-code-engine-dark.png': ['fb1d537c314db31d8aea0e40909da3ea15ddb00f74bc8216b66622d6d781394a', '960', '540'],
  'images/ibm-cloud-registry-light.png': ['dacafe983711e93a5964650639c74f7038cb838b36dbeb17da5511680a8d5fc2', '960', '540'],
  'images/ibm-cloud-registry-dark.png': ['b5b1ebb8d190ee17a5ab0dc540e6bcd12b6a15a3be9a2d020548d5fdb71a1bed', '960', '540'],
  'images/ibm-cloud-satellite-light.png': ['309bf21f3e8e765ffefa737147bbc9f53bd086349c7e680907d953eb852df8a1', '960', '540'],
  'images/ibm-cloud-satellite-dark.png': ['71a62b275551e535c859a712c45074b93465f5218950fb9616a0eb72c4ad5e69', '960', '540'],
  'images/ibm-cloud-iks-light.png': ['cd77b871571bd01ae95ede4d6103c1a93cecdb91a3108d600b82f7d942a9a13f', '960', '540'],
  'images/ibm-cloud-iks-dark.png': ['d5ab895329122e3f39ee69109fd7b8c5d1b7068cb2e0931ab2141d4e8118275f', '960', '540'],
  'images/ibm-cloud-roks-light.png': ['548670e0c1d856fb7a25dc2ac4c42432d477ad10effb5999a688f6c5f2f30861', '960', '540'],
  'images/ibm-cloud-roks-dark.png': ['b31f03f791314f14cc34b124f9a50909f859a9eedaed486862245d3160ff2565', '960', '540'],
  'images/ibm-cloud-service-icons.png': ['123801a037b685a053d9bfe0fd3ac706b0815fb00923d93b35a9286e04c20095', '1024', '292'],
};
for (const [relative, [sha256, width, height]] of Object.entries(selectedAssets)) {
  const absolute = path.join(root, relative);
  require(fs.existsSync(absolute), `selected IBM Cloud asset is missing: ${relative}`);
  if (fs.existsSync(absolute)) require(crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex') === sha256, `selected IBM Cloud asset drifted: ${relative}`);
  const escaped = relative.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tag = html.match(new RegExp(`<img\\b[^>]*src="${escaped}"[^>]*>`, 'i'))?.[0] || '';
  require(Boolean(tag), `selected IBM Cloud image is not rendered: ${relative}`);
  require(tag.includes(`width="${width}"`) && tag.includes(`height="${height}"`), `selected IBM Cloud image has incorrect intrinsic dimensions: ${relative}`);
  require(/\balt="[^"]+"/i.test(tag), `selected IBM Cloud image needs descriptive alt text: ${relative}`);
  require(sourceManifest.includes(sha256) || relative.startsWith('images/ibm-thumb-'), `IBM Cloud source manifest is missing retained asset provenance: ${relative}`);
}

const mainHtml = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || '';
const images = [...mainHtml.matchAll(/<img\b[^>]*>/gi)].map(match => match[0]);
require(images.length === 19, `expected exactly 19 case-study images representing 13 editorial display units, found ${images.length}`);
for (const tag of images) {
  require(/\bwidth="\d+"/i.test(tag), `image missing numeric width: ${tag.slice(0, 100)}`);
  require(/\bheight="\d+"/i.test(tag), `image missing numeric height: ${tag.slice(0, 100)}`);
  require(/\balt="[^"]*"/i.test(tag), `image missing alt attribute: ${tag.slice(0, 100)}`);
}

require(css.includes('[data-project="ibm-cloud"]'), 'IBM Cloud CSS must remain route-scoped');
for (const selector of ['.ibm-hiring-hero', '.ibm-proof', '.ibm-product-evidence', '.ibm-adaptation-evidence', '.ibm-visual-sequence', '.ibm-theme-family-grid']) {
  require(css.includes(`[data-project="ibm-cloud"] ${selector}`), `IBM Cloud lean composition is missing styles for ${selector}`);
}
for (const deadSelector of ['.ibm-tech-context', '.ibm-product-research', '.ibm-ux-decision-rail', '.ibm-component-artifact', '.ibm-hiring-close']) {
  require(!css.includes(`[data-project="ibm-cloud"] ${deadSelector}`), `dead IBM Cloud selector remains after the lean trim: ${deadSelector}`);
}
require(!/var\(--(?:orange|fg|fg-muted|space-7)\b/.test(css), 'IBM Cloud CSS uses an undefined or stale token');
require(preflight.includes('node scripts/check-ibmcloud-hiring-cut.mjs'), 'IBM Cloud contract is not wired into preflight');
require(dashboard.includes('eleven-artifact Figma expansion production-verified in PR #135'), 'Portfolio dashboard must retain the prior production record');

if (failures.length) {
  console.error('IBM CLOUD LEAN PAGE CONTRACT: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('IBM CLOUD LEAN PAGE CONTRACT: PASS');
console.log(`proofs=${proofIds.length} display_units=13 images=${images.length} evidence_figures=5 family_pairs=5 narrative_words=${narrativeWords}`);
