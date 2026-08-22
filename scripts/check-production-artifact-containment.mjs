import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const failures = [];
const require = (condition, message) => { if (!condition) failures.push(message); };

const ignoreLines = read('.vercelignore')
  .split(/\r?\n/)
  .map(line => line.trim())
  .filter(line => line && !line.startsWith('#'));

const requiredIgnoreEntries = [
  '*.md',
  '.gitattributes',
  '.hermes/',
  'archive/',
  'case-studies/',
  'content/',
  'scripts/',
  'data/',
  'pikappapp/demo-source.css',
  'pikappapp/demo-source.jsx',
  'pikappapp/tailwind.config.cjs',
];

for (const entry of requiredIgnoreEntries) {
  require(ignoreLines.includes(entry), `.vercelignore must exclude ${entry}`);
}

const packageJson = JSON.parse(read('package.json'));
require(
  packageJson.scripts?.['check:artifact-containment'] === 'node scripts/check-production-artifact-containment.mjs',
  'package.json must expose check:artifact-containment',
);
require(
  read('scripts/preflight.sh').includes('npm run check:artifact-containment'),
  'scripts/preflight.sh must run check:artifact-containment',
);
const workflow = read('.github/workflows/health-check.yml');
require(workflow.includes('run: npm run check:artifact-containment'), 'health-check workflow must run check:artifact-containment');
require(workflow.includes("needs.changes.outputs.deployable == 'true'"), 'artifact containment must use deployable scope');

const denylist = [
  '/MAGI_ACCESS_POLICY.md',
  '/PORTFOLIO_DASHBOARD.md',
  '/PORTFOLIO_SYSTEM.md',
  '/AGENTS.md',
  '/case-studies/document-processing.md',
  '/archive/doc-pro-case-study-handoff.md',
  '/archive/playground',
  '/archive/a2ui/examples/recruiter.json',
  '/archive/a2ui/examples/start-here.json',
  '/scripts/html-to-md.mjs',
  '/data/projects.json',
  '/data/content-export-policy.json',
  '/content/index.md',
  '/content/site-index.json',
  '/.gitattributes',
  '/.hermes/evidence/shared-shell/index-390-dark-menu.png',
  '/pikappapp/demo-source.css',
  '/pikappapp/demo-source.jsx',
  '/pikappapp/tailwind.config.cjs',
];

const runtimeFiles = fs.readdirSync(root)
  .filter(name => /\.(?:html|js|css)$/i.test(name));
for (const relative of runtimeFiles) {
  const source = read(relative);
  for (const prefix of ['archive/', 'case-studies/', 'content/', 'scripts/', 'data/']) {
    require(!source.includes(`\"${prefix}`) && !source.includes(`'${prefix}`), `${relative} contains a runtime reference to excluded ${prefix}`);
  }
}

const deploymentUrl = process.env.DEPLOYMENT_URL?.replace(/\/$/, '');
if (deploymentUrl) {
  for (const route of denylist) {
    const response = await fetch(`${deploymentUrl}${route}`, { redirect: 'manual' });
    require(response.status === 404, `${route} must return 404 from ${deploymentUrl}, received ${response.status}`);
  }
}

if (failures.length) {
  console.error('PRODUCTION ARTIFACT CONTAINMENT: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('PRODUCTION ARTIFACT CONTAINMENT: PASS');
console.log(`ignore_entries=${requiredIgnoreEntries.length} denylist_urls=${denylist.length} live=${Boolean(deploymentUrl)}`);
