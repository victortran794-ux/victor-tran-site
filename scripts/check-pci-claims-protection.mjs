import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const errors = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function fail(message) {
  errors.push(message);
}

function requireText(haystack, needle, label) {
  if (!haystack.includes(needle)) fail(`${label} must include: ${needle}`);
}

function forbid(pattern, sources, label) {
  for (const [name, text] of sources) {
    if (pattern.test(text)) fail(`${name} contains rejected ${label} claim`);
  }
}

let manifest;
let exportPolicy;
try {
  manifest = JSON.parse(read('data/projects.json'));
} catch (error) {
  fail(`data/projects.json is missing or invalid: ${error.message}`);
  manifest = { projects: [] };
}
try {
  exportPolicy = JSON.parse(read('data/content-export-policy.json'));
} catch (error) {
  fail(`data/content-export-policy.json is missing or invalid: ${error.message}`);
  exportPolicy = { protectedPages: [] };
}

const pci = (manifest.projects || []).find(project => project.slug === 'pci');
if (!pci) {
  fail('data/projects.json must define the PCI project');
} else {
  if (pci.protected !== true) fail('PCI manifest must set protected=true');
  if (pci.noindex !== true) fail('PCI manifest must set noindex=true');
  if (pci.sitemap !== false) fail('PCI manifest must set sitemap=false');
  requireText(pci.description || '', 'Freelance publication and environmental design', 'PCI manifest description');
  requireText(pci.description || '', 'recruitment banner concepts', 'PCI manifest description');
}

const pciHtml = read('pci.html');
const homepage = read('index.html');
const robots = read('robots.txt');
const sitemap = read('sitemap.xml');
const packageJson = read('package.json');
const preflight = read('scripts/preflight.sh');
const workflow = read('.github/workflows/health-check.yml');
let pciCss = '';
try {
  pciCss = read('css/pci-vico2.css');
} catch (error) {
  fail(`css/pci-vico2.css is missing: ${error.message}`);
}

const bookletSamples = new Map([
  ['images/pci-booklet-section-rhythm-desktop.jpg', '03fd70d2c3607e5a8410efee941a6b2183ba0b1cad25a4337b104d2ed9182fab'],
  ['images/pci-booklet-section-rhythm-mobile.jpg', 'e4c434d1637b61797230f0a96797faba3fd76d7d0c369488b428093a985dcf95'],
  ['images/pci-booklet-information-hierarchy-desktop.jpg', '6feac7fbac2257c037a29f218bb95a5093c3d75c9538208dd81e57bba403d7db'],
  ['images/pci-booklet-information-hierarchy-mobile.jpg', '16ebccc1b647b090bb32a10a1353c567e92c1f583f02ab5742c92953424ff7c4'],
]);
for (const [relativePath, expectedHash] of bookletSamples) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`PCI booklet source sample is missing: ${relativePath}`);
    continue;
  }
  const actualHash = crypto.createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex');
  if (actualHash !== expectedHash) fail(`PCI booklet source sample changed without privacy review: ${relativePath}`);
}

const hierarchyArtifacts = new Map([
  ['images/pci-booklet-statement-hierarchy.jpg', 'fc0839a0e15b7c589f8f25d7c4579fc970812f108623be4535d763aab0a23134'],
  ['images/pci-booklet-icon-supported-principles.jpg', 'ee3e4b7fbd4e8c5859a6153dbaf59a1888c1446aa496d66da2a73d5ba1a2ac86'],
  ['images/pci-booklet-pillar-diagram.jpg', '06c8f2328c2a7aa692756efe16a57b2a61f8397aaff12eb8259371ff422042d0'],
  ['images/pci-booklet-editorial-feature.jpg', 'a4fbb0c10c1450f495e1f5b1f32a4998c36773b1bac5ef044167508291722e1f'],
]);
for (const [relativePath, expectedHash] of hierarchyArtifacts) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`PCI hierarchy artifact is missing: ${relativePath}`);
    continue;
  }
  const actualHash = crypto.createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex');
  if (actualHash !== expectedHash) fail(`PCI hierarchy artifact changed without privacy review: ${relativePath}`);
  requireText(pciHtml, relativePath, 'PCI individual hierarchy artifact');
}
requireText(pciHtml, 'Publication System in Use', 'PCI booklet gallery heading');
if ((pciHtml.match(/data-pci-hierarchy-artifact=/g) || []).length !== 4) {
  fail('PCI hierarchy sequence must present exactly four distinct artifacts');
}
for (const composite of ['images/pci-booklet-information-hierarchy-desktop.jpg', 'images/pci-booklet-information-hierarchy-mobile.jpg']) {
  if (pciHtml.includes(composite)) fail(`PCI page must not present the four-artifact source composite as one artifact: ${composite}`);
}

const selectedArtifacts = new Map([
  ['images/pci-handbook-2-interstitial.jpg', 'fca40568ddedde2dacdca76ac33c926900bd7249af4f90981596ee52934de41e'],
  ['images/pci-handbook-1-cover.jpg', 'a953c5bb889daa2d51232e01b1379fdf14a7bbcf72b36742f64511bbe7aae3e0'],
  ['images/pci-handbook-41-locations.jpg', 'df1f7e1466919062a3fc7bd850f8c0fbab72f4bd80c970f1fcb52f5d2961248e'],
  ['images/pci-banners-1.jpg', 'c7b8e6efe776962226e102a16cb84ed138776f4776c5d31733f76675dba01e4b'],
  ['images/pci-banners-2.jpg', '312a7b4797de219bc53570770b1cc924e3ade64019b98d8f95233bdceb1786b4'],
  ['images/pci-banners-3.jpg', 'b1b8a5ebaa020a31cb5e60537199ac2ff6d600b03543621165b895bc902e4bca'],
  ['images/pci-banners-4.jpg', 'e0fecb6525f17e98265fab461e29591f673d89e2c068156b84e667949e9daf49'],
]);
for (const [relativePath, expectedHash] of selectedArtifacts) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`Selected PCI artifact is missing: ${relativePath}`);
    continue;
  }
  const actualHash = crypto.createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex');
  if (actualHash !== expectedHash) fail(`Selected PCI artifact changed without privacy review: ${relativePath}`);
  requireText(pciHtml, relativePath, 'Selected PCI artifact');
}

requireText(pciHtml, 'css/pci-vico2.css', 'PCI scoped stylesheet');
requireText(pciHtml, 'data-pci-artifact="red-hexagon-hero"', 'PCI red-hexagon hero');
requireText(pciHtml, 'data-pci-artifact-count="3"', 'PCI three-artifact interior sequence');
requireText(pciHtml, 'data-pci-artifact-count="4"', 'PCI four-artifact publication composition');
requireText(pciHtml, 'data-pci-artifact="national-footprint-map"', 'PCI standalone map');
requireText(pciHtml, 'landscape US Letter', 'PCI native-format disclosure');
requireText(pciHtml, 'four coordinated artifacts', 'PCI four-artifact composition disclosure');

for (const rejectedArtifact of [
  'images/pci-handbook-3-ceo-letter.jpg',
  'images/pci-handbook-42-back.jpg',
  'images/pci-banners-5.jpg',
]) {
  if (pciHtml.includes(rejectedArtifact)) fail(`PCI revised page must remove rejected artifact: ${rejectedArtifact}`);
}
for (const rejectedCopy of ["The CEO's Letter", 'miscellaneous assets']) {
  if (pciHtml.toLowerCase().includes(rejectedCopy.toLowerCase())) fail(`PCI revised page must remove rejected copy: ${rejectedCopy}`);
}

requireText(pciCss, '.pci-artifact img', 'PCI native-ratio image rule');
requireText(pciCss, 'height: auto', 'PCI native-ratio image rule');
const unscopedPciSelectors = pciCss
  .split('\n')
  .filter(line => /^\s*\.pci-(?!vico2\b)/.test(line));
if (unscopedPciSelectors.length) {
  fail(`PCI stylesheet selectors must be rooted in .pci-vico2 (${unscopedPciSelectors.length} unscoped selector lines)`);
}
if (/\.pci-artifact[^}]*background\s*:\s*(?:#fff(?:fff)?|white|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))/i.test(pciCss)) {
  fail('PCI artifacts must not add a white frame or faux paper background');
}
if (/\.pci-artifact[^}]*padding\s*:/i.test(pciCss)) {
  fail('PCI artifacts must not add padding that behaves like a faux mat');
}
if (/object-fit\s*:\s*cover/i.test(pciCss)) {
  fail('PCI scoped CSS must not crop artifacts with object-fit: cover');
}

if (!/<meta\s+name="robots"\s+content="noindex,nofollow,noarchive,nosnippet,noimageindex">/i.test(pciHtml)) {
  fail('pci.html must retain the full protected robots policy');
}
if (!/<meta\s+name="referrer"\s+content="no-referrer">/i.test(pciHtml)) {
  fail('pci.html must retain no-referrer metadata');
}
if (!/classList\.add\(['"]locked['"]\)/i.test(pciHtml) || !/password-gate\.js/i.test(pciHtml)) {
  fail('pci.html must retain the client-side protected gate');
}
if (!(exportPolicy.protectedPages || []).some(entry => entry.source === 'pci.html' && entry.slug === 'pci')) {
  fail('content export policy must retain PCI as protected');
}
for (const rule of ['Disallow: /pci', 'Disallow: /pci.html']) {
  if (!robots.includes(rule)) fail(`robots.txt must include ${rule}`);
}
if (/<loc>[^<]*\/pci(?:\.html)?<\/loc>/i.test(sitemap)) {
  fail('sitemap.xml must not include PCI');
}

requireText(pciHtml, 'freelance designer', 'PCI role framing');
requireText(pciHtml, "PCI's existing brand", 'PCI brand-extension framing');
requireText(pciHtml, 'distributed to hourly employees company-wide', 'PCI confirmed handbook outcome');
requireText(pciHtml, 'remained concepts', 'PCI banner status');
requireText(pciHtml, 'top national specialty contractor', 'PCI researched company-scale framing');
requireText(homepage, 'Freelance publication and environmental design', 'Homepage PCI description');
requireText(homepage, 'recruitment banner concepts', 'Homepage PCI description');

const publicClaims = [
  ['pci.html', pciHtml],
  ['index.html', homepage],
  ['data/projects.json', JSON.stringify(manifest)],
];
forbid(/rolled out across (?:PCG|PCI) offices nationwide/i, publicClaims, 'nationwide rollout');
forbid(/1,?400[- ]employee/i, publicClaims, '1,400 employee');
forbid(/every hourly employee/i, publicClaims, 'every-hourly-employee');
forbid(/banner system (?:has been |was )?rolled out/i, publicClaims, 'installed banner');
forbid(/both pieces shipped/i, publicClaims, 'both pieces shipped');
forbid(/internal brand refresh/i, publicClaims, 'formal internal brand refresh');
forbid(/would actually want to read/i, publicClaims, 'reader-response');

if (!/"check:pci-browser"\s*:\s*"node scripts\/check-pci-browser\.mjs"/.test(packageJson)) {
  fail('package.json must expose check:pci-browser');
}
if (!/npm run check:pci-browser/.test(workflow)) {
  fail('health-check workflow must run check:pci-browser');
}
for (const ownedServerGuard of [
  "PCI_PORT=$(python3 -c 'import socket;",
  'PCI_URL="http://127.0.0.1:${PCI_PORT}/pci.html"',
  'sleep 0.1',
  'if ! kill -0 "$SERVER_PID" 2>/dev/null; then',
  'PCI_SERVER_READY=1',
  'if [ "${PCI_SERVER_READY:-0}" -ne 1 ]; then',
  'SITE_URL="http://127.0.0.1:${PCI_PORT}" npm run check:pci-browser',
]) {
  requireText(workflow, ownedServerGuard, 'PCI browser workflow owned-server guard');
}
for (const requiredPath of ['pci.html', 'css/pci-vico2.css', 'scripts/check-pci-browser.mjs']) {
  const pattern = new RegExp(`- ["']?${requiredPath.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}["']?`, 'g');
  if ((workflow.match(pattern) || []).length < 2) fail(`health-check workflow must trigger for ${requiredPath} on push and pull requests`);
}

if (!/"check:pci-claims-protection"\s*:\s*"node scripts\/check-pci-claims-protection\.mjs"/.test(packageJson)) {
  fail('package.json must expose check:pci-claims-protection');
}
if (!/npm run check:pci-claims-protection/.test(preflight)) {
  fail('scripts/preflight.sh must run check:pci-claims-protection');
}
if (!/npm run check:pci-claims-protection/.test(workflow)) {
  fail('health-check workflow must run check:pci-claims-protection');
}
const exportPolicyTriggers = workflow.match(/- "data\/content-export-policy\.json"/g) || [];
if (exportPolicyTriggers.length !== 2) {
  fail('health-check workflow must trigger on content export policy changes for push and pull requests');
}

if (errors.length) {
  console.error('PCI CLAIMS AND PROTECTION CONTRACT: FAIL');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('PCI CLAIMS AND PROTECTION CONTRACT: PASS');
console.log('protection=aligned claims=bounded role=freelance banners=concepts');
