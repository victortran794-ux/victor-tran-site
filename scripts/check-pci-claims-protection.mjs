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

function inspectJpeg(buffer) {
  if (!buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) throw new Error('not a JPEG');
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) throw new Error('invalid JPEG marker');
    while (buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    const length = buffer.readUInt16BE(offset);
    if (length < 2 || offset + length > buffer.length) throw new Error('invalid JPEG segment length');
    if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
      return { width: buffer.readUInt16BE(offset + 5), height: buffer.readUInt16BE(offset + 3) };
    }
    offset += length;
  }
  throw new Error('JPEG has no frame dimensions');
}

let manifest;
let exportPolicy;
let pillarProvenance;
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
try {
  pillarProvenance = JSON.parse(read('data/pci-pillar-diagram-provenance.json'));
} catch (error) {
  fail(`PCI pillar provenance is missing or invalid: ${error.message}`);
  pillarProvenance = {};
}

const pci = (manifest.projects || []).find(project => project.slug === 'pci');
if (!pci) {
  fail('data/projects.json must define the PCI project');
} else {
  if (pci.protected !== false) fail('PCI manifest must set protected=false');
  if (pci.noindex !== false) fail('PCI manifest must set noindex=false');
  if (pci.sitemap !== true) fail('PCI manifest must set sitemap=true');
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
  ['images/pci-booklet-pillar-diagram.jpg', '9610afe7ad2b62e8bbf22b1d73c20777d03b98e6842822dd9427b9491fddf1f7'],
  ['images/pci-booklet-editorial-feature.jpg', 'a4fbb0c10c1450f495e1f5b1f32a4998c36773b1bac5ef044167508291722e1f'],
]);
const pillarDiagram = pillarProvenance.pillarDiagram || {};
const sourcePdf = pillarDiagram.sourcePdf || {};
const cleanPageRender = pillarDiagram.cleanPageRender || {};
const sanitizedDerivative = pillarDiagram.sanitizedDerivative || {};
const repair = pillarDiagram.repair || {};
const finalDerivative = pillarDiagram.finalDerivative || {};
const requiredPillarFacts = [
  [pillarDiagram.artifact, 'images/pci-booklet-pillar-diagram.jpg', 'artifact'],
  [sourcePdf.intakeIdentifier, 'owner-handoff/pci-handbook-2026/Booklet_020526.pdf', 'portable PDF intake identifier'],
  [sourcePdf.filename, 'Booklet_020526.pdf', 'PDF filename'],
  [sourcePdf.sha256, 'a230554824f1a583e0e8ca05e65357039f6783d57265c7d17e3e3ab16ade272d', 'PDF SHA-256'],
  [sourcePdf.pageCount, 42, 'PDF page count'],
  [cleanPageRender.page, 12, 'clean PDF render page'],
  [cleanPageRender.sha256, 'a560d5366604ff6a385bbd06eb2d18d3dfb5a00d6d5106847255f640535bf61b', 'clean PDF render SHA-256'],
  [JSON.stringify(cleanPageRender.dimensions), JSON.stringify([830, 642]), 'clean PDF render dimensions'],
  [sanitizedDerivative.sha256, '06c8f2328c2a7aa692756efe16a57b2a61f8397aaff12eb8259371ff422042d', 'pre-repair sanitized derivative SHA-256'],
  [JSON.stringify(sanitizedDerivative.dimensions), JSON.stringify([830, 660]), 'pre-repair sanitized derivative dimensions'],
  [JSON.stringify(repair.clearResidualStrip), JSON.stringify({ x: [35, 265], y: [165, 175], fill: 'page-white' }), 'residual-strip clearance bounds'],
  [JSON.stringify(repair.replaceSourcePixels), JSON.stringify({ x: [35, 265], y: [175, 214], sourcePage: 12 }), 'source-pixel replacement bounds'],
  [finalDerivative.sha256, '9610afe7ad2b62e8bbf22b1d73c20777d03b98e6842822dd9427b9491fddf1f7', 'final repaired derivative SHA-256'],
  [JSON.stringify(finalDerivative.dimensions), JSON.stringify([830, 660]), 'final repaired derivative dimensions'],
];
for (const [actual, expected, label] of requiredPillarFacts) {
  if (actual !== expected) fail(`PCI pillar provenance must preserve the approved ${label}`);
}
if (/^(?:[A-Za-z]:[\\/]|\/)/.test(sourcePdf.intakeIdentifier || '')) {
  fail('PCI pillar provenance intake identifier must be portable, not an absolute path');
}
const pillarDiagramPath = path.join(root, 'images/pci-booklet-pillar-diagram.jpg');
if (fs.existsSync(pillarDiagramPath)) {
  const buffer = fs.readFileSync(pillarDiagramPath);
  const actualHash = crypto.createHash('sha256').update(buffer).digest('hex');
  if (actualHash !== finalDerivative.sha256) fail('PCI pillar derivative must match the provenance-record final SHA-256');
  try {
    const dimensions = inspectJpeg(buffer);
    if (JSON.stringify([dimensions.width, dimensions.height]) !== JSON.stringify(finalDerivative.dimensions)) {
      fail('PCI pillar derivative dimensions must match the provenance record');
    }
  } catch (error) {
    fail(`PCI pillar derivative cannot be inspected: ${error.message}`);
  }
}
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
  ['images/pci-handbook-1-cover.jpg', '41237171c4a77bf7f8453a74447335885403935e72a045f0a31185f0b024efb6'],
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
requireText(pciHtml, 'Internal text is obscured in these approved portfolio images.', 'PCI confidentiality disclosure');
requireText(pciHtml, 'Four examples: statement hierarchy, icon-supported principles, a pillar diagram, and a feature with photography.', 'PCI four-artifact composition disclosure');
requireText(pciHtml, '<figcaption class="pci-caption pci-caption--pillar"><strong>Pillar diagram</strong></figcaption>', 'PCI pillar diagram export caption');

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
requireText(pciCss, 'width: 100%;', 'PCI edge-touching hero width');
requireText(pciCss, 'grid-template-columns: minmax(0, 1.35fr) minmax(300px, 0.65fr);', 'PCI dominant hero artwork scale');
for (const required of [
  '.pci-vico2 .pci-caption--pillar',
  '.pci-vico2 .pci-artifact[data-pci-hierarchy-artifact="pillar-diagram"]',
  'width:min(100%,830px)',
  '.pci-vico2 .pci-map .pci-artifact::before',
  '.pci-vico2 .pci-map .pci-artifact::after',
  '.pci-vico2 .pci-outcome h2',
  'line-height: .94',
  '.pci-vico2 .project-nav-item--next .project-nav-title::before',
  'content:"◆"',
]) requireText(pciCss, required, 'PCI manual-review refinement');
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

if (/<meta\s+name="robots"\s+content="noindex,nofollow,noarchive,nosnippet,noimageindex">/i.test(pciHtml)) {
  fail('pci.html must not retain the protected robots policy');
}
if (/<meta\s+name="referrer"\s+content="no-referrer">/i.test(pciHtml)) {
  fail('pci.html must not retain protected no-referrer metadata');
}
if (/classList\.add\(['"]locked['"]\)|password-gate\.(?:js|css)/i.test(pciHtml)) {
  fail('pci.html must not retain the client-side protected gate');
}
if ((exportPolicy.protectedPages || []).some(entry => entry.source === 'pci.html')) {
  fail('content export policy must not retain PCI as protected');
}
for (const rule of ['Disallow: /pci', 'Disallow: /pci.html']) {
  if (robots.includes(rule)) fail(`robots.txt must not include ${rule}`);
}
if (!/<loc>https:\/\/www\.victortrandesign\.com\/pci<\/loc>/i.test(sitemap)) {
  fail('sitemap.xml must include PCI');
}

requireText(pciHtml, 'Freelance designer', 'PCI role framing');
requireText(pciHtml, "PCI's existing brand", 'PCI brand-extension framing');
requireText(pciHtml, 'distributed to hourly employees company-wide', 'PCI confirmed handbook outcome');
requireText(pciHtml, 'remained concepts', 'PCI banner status');
if (pciHtml.includes('top national specialty contractor')) fail('PCI page must not retain unsupported company-scale framing');
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
if (!workflow.includes("needs.changes.outputs.pci == 'true'")) fail('health-check workflow must scope PCI contracts through classifier ownership');

if (!/"check:pci-claims-protection"\s*:\s*"node scripts\/check-pci-claims-protection\.mjs"/.test(packageJson)) {
  fail('package.json must expose check:pci-claims-protection');
}
if (!/npm run check:pci-claims-protection/.test(preflight)) {
  fail('scripts/preflight.sh must run check:pci-claims-protection');
}
if (!/npm run check:pci-claims-protection/.test(workflow)) {
  fail('health-check workflow must run check:pci-claims-protection');
}


if (errors.length) {
  console.error('PCI CLAIMS AND PUBLICATION CONTRACT: FAIL');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('PCI CLAIMS AND PUBLICATION CONTRACT: PASS');
console.log('publication=public claims=bounded role=freelance banners=concepts');
