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

const bookletSamples = new Map([
  ['images/pci-booklet-section-rhythm-desktop.jpg', '03fd70d2c3607e5a8410efee941a6b2183ba0b1cad25a4337b104d2ed9182fab'],
  ['images/pci-booklet-section-rhythm-mobile.jpg', 'e4c434d1637b61797230f0a96797faba3fd76d7d0c369488b428093a985dcf95'],
  ['images/pci-booklet-information-hierarchy-desktop.jpg', '6feac7fbac2257c037a29f218bb95a5093c3d75c9538208dd81e57bba403d7db'],
  ['images/pci-booklet-information-hierarchy-mobile.jpg', '16ebccc1b647b090bb32a10a1353c567e92c1f583f02ab5742c92953424ff7c4'],
]);
for (const [relativePath, expectedHash] of bookletSamples) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`PCI booklet sample is missing: ${relativePath}`);
    continue;
  }
  const actualHash = crypto.createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex');
  if (actualHash !== expectedHash) fail(`PCI booklet sample changed without privacy review: ${relativePath}`);
  requireText(pciHtml, relativePath, 'PCI responsive booklet gallery');
}
requireText(pciHtml, 'Publication System in Use', 'PCI booklet gallery heading');
if ((pciHtml.match(/<source media="\(max-width: 600px\)"/g) || []).length < 2) {
  fail('PCI booklet gallery must provide two dedicated phone compositions');
}

if (!/<meta\s+name="robots"\s+content="noindex,nofollow">/i.test(pciHtml)) {
  fail('pci.html must remain noindex,nofollow');
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
