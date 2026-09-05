import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const pkg = JSON.parse(read('package.json'));
const preflight = read('scripts/preflight.sh');
const workflow = read('.github/workflows/health-check.yml');
const failures = [];
const need = (condition, message) => { if (!condition) failures.push(message); };

need(pkg.scripts?.['test:vercel-review-feedback-wiring'] === 'node scripts/test-vercel-review-feedback-wiring.mjs',
  'package.json must expose the exact review-feedback wiring self-test.');
need(pkg.scripts?.['check:vercel-review-feedback'] === 'node scripts/check-vercel-review-feedback.mjs',
  'package.json must expose the exact review-feedback contract command.');
const preflightWiring = preflight.indexOf('run_required "Vercel review feedback wiring" npm run test:vercel-review-feedback-wiring');
const preflightContract = preflight.indexOf('run_required "Vercel review feedback contract" npm run check:vercel-review-feedback');
need(preflightWiring >= 0 && preflightContract > preflightWiring,
  'preflight must run the wiring self-test before the review-feedback contract.');
need(preflight.includes('SITE_URL="$site_url" DNA_HERO_EVIDENCE_DIR="$(mktemp -d)" npm run check:engraved-dna-hero-browser'),
  'preflight must run the Design DNA browser contract against its owned ephemeral server with temporary evidence.');
const step = workflow.match(/- name: Vercel review feedback contract[\s\S]*?run:\s*\|[\s\S]*?npm run check:vercel-review-feedback/)?.[0] ?? '';
need(Boolean(step), 'health-check workflow must run the review-feedback contract.');
need(step.includes('npm run test:vercel-review-feedback-wiring') && step.indexOf('test:vercel-review-feedback-wiring') < step.indexOf('check:vercel-review-feedback'),
  'health-check workflow must run the wiring self-test before the functional contract.');
for (const scope of ['all', 'shared', 'home', 'about', 'ibm', 'pikapp', 'gallery', 'pci', 'wxo']) {
  need(step.includes(`needs.changes.outputs.${scope} == 'true'`), `workflow feedback step must include ${scope} scope.`);
}

if (failures.length) {
  console.error('VERCEL REVIEW FEEDBACK WIRING: FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('VERCEL REVIEW FEEDBACK WIRING: PASS');
