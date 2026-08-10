import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const workflowPath = path.join(root, '.github/workflows/health-check.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8');
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

const desktopRoutes = [
  '/', '/about', '/salmagazine', '/pikappapp', '/abilityexperience',
  '/artillustration', '/graphicgallery', '/ibmcloud', '/ibm-patterns', '/pci',
  '/pikappapp/demo',
];
const mobileRoutes = ['/', '/about', '/artillustration', '/ibmcloud', '/ibm-patterns', '/pci', '/pikappapp/demo'];

function jobBlock(jobId) {
  const marker = `\n  ${jobId}:\n`;
  const start = workflow.indexOf(marker);
  if (start < 0) return '';
  const rest = workflow.slice(start + marker.length);
  const next = rest.search(/\n  [a-zA-Z0-9_-]+:\n/);
  return next < 0 ? rest : rest.slice(0, next);
}

function lighthouseRoutes(block) {
  const match = block.match(/\n\s+urls: \|\n((?:\s+\$\{\{ steps\.url\.outputs\.base \}\}\/[^\n]*\n?)+)/);
  if (!match) return [];
  return match[1].trim().split('\n').map((line) => {
    const value = line.trim().replace('${{ steps.url.outputs.base }}', '');
    return value === '/' ? '/' : value;
  });
}

const desktopJob = jobBlock('lighthouse');
const mobileJob = jobBlock('lighthouse-mobile');
expect(JSON.stringify(lighthouseRoutes(desktopJob)) === JSON.stringify(desktopRoutes),
  `Desktop Lighthouse routes must exactly match the required ${desktopRoutes.length}-route inventory.`);
expect(JSON.stringify(lighthouseRoutes(mobileJob)) === JSON.stringify(mobileRoutes),
  `Mobile Lighthouse routes must exactly match the required ${mobileRoutes.length}-route inventory.`);
expect(desktopJob.includes('name: Lighthouse audit · desktop'), 'Workflow must identify the desktop Lighthouse job.');
expect(mobileJob.includes('name: Lighthouse audit · mobile'), 'Workflow must include a mobile Lighthouse job.');
expect(mobileJob.includes('configPath: ./.github/lighthouse-mobile.json'), 'Mobile Lighthouse job must use its mobile configuration.');
expect(desktopJob.includes('artifactName: lighthouse-results-desktop'), 'Desktop Lighthouse artifacts must use a unique name.');
expect(mobileJob.includes('artifactName: lighthouse-results-mobile'), 'Mobile Lighthouse artifacts must use a unique name.');
expect(desktopJob.includes("if: github.event_name != 'pull_request'") && mobileJob.includes("if: github.event_name != 'pull_request'"),
  'Production Lighthouse jobs must skip pull requests.');
for (const block of [desktopJob, mobileJob]) {
  expect(block.includes('temporaryPublicStorage: false'), 'Lighthouse results must not use temporary public storage.');
  expect(block.includes('BASE_INPUT: ${{ github.event.inputs.url }}'), 'Dispatch URL must enter the shell through an environment variable.');
  expect(!block.includes('BASE="${{ github.event.inputs.url }}"'), 'Dispatch URL must never be interpolated directly into shell source.');
  expect(block.includes("$'\\n'") && block.includes("$'\\r'"), 'Dispatch URL must reject embedded newlines.');
  expect(block.includes('^https?://'), 'Dispatch URL must be restricted to an http/https origin.');
}

const mobileConfigPath = path.join(root, '.github/lighthouse-mobile.json');
expect(fs.existsSync(mobileConfigPath), 'Mobile Lighthouse configuration must exist.');
if (fs.existsSync(mobileConfigPath)) {
  const config = JSON.parse(fs.readFileSync(mobileConfigPath, 'utf8'));
  const settings = config.ci?.collect?.settings;
  expect(settings?.formFactor === 'mobile', 'Mobile Lighthouse formFactor must be mobile.');
  expect(settings?.screenEmulation?.mobile === true, 'Mobile Lighthouse screen emulation must be enabled.');
  expect(settings?.screenEmulation?.width === 390, 'Mobile Lighthouse width must be 390 CSS pixels.');
  expect(settings?.screenEmulation?.height === 844, 'Mobile Lighthouse height must be 844 CSS pixels.');
  expect(settings?.screenEmulation?.deviceScaleFactor === 2, 'Mobile Lighthouse device scale factor must be 2.');
  const accessibility = config.ci?.assert?.assertions?.['categories:accessibility'];
  const performance = config.ci?.assert?.assertions?.['categories:performance'];
  expect(accessibility?.[0] === 'error' && accessibility?.[1]?.minScore === 0.90,
    'Mobile accessibility must block below 0.90.');
  expect(performance?.[0] === 'warn' && performance?.[1]?.minScore === 0.80,
    'Mobile performance must warn below 0.80.');
}

expect(workflow.includes('run: node scripts/check-lighthouse-coverage.mjs'), 'CI must execute the Lighthouse coverage regression check.');
expect(workflow.includes('"scripts/check-lighthouse-coverage.mjs"'), 'Coverage-check changes must trigger CI.');
expect(workflow.includes('".github/lighthouse-mobile.json"'), 'Mobile-config changes must trigger CI.');

if (failures.length) {
  console.error(`Lighthouse coverage regression check failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`Lighthouse coverage regression check passed: ${desktopRoutes.length} desktop routes and ${mobileRoutes.length} mobile routes.`);
