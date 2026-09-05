#!/usr/bin/env node
import fs from 'node:fs';

const failures = [];
const fail = (message) => failures.push(message);
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const preflight = fs.readFileSync('scripts/preflight.sh', 'utf8');
const workflow = fs.readFileSync('.github/workflows/health-check.yml', 'utf8');

if (pkg.scripts?.['test:manual-review-followups-wiring'] !== 'node scripts/test-manual-review-followups-wiring.mjs') {
  fail('package.json must expose the manual-review wiring self-test');
}
if (pkg.scripts?.['check:manual-review-followups'] !== 'node scripts/check-manual-review-followups.mjs') {
  fail('package.json must expose the manual-review contract');
}
const preflightWiring = 'run_required "Manual review follow-up wiring" npm run test:manual-review-followups-wiring';
const preflightCheck = 'run_required "Manual review follow-up contract" npm run check:manual-review-followups';
const preflightWiringAt = preflight.indexOf(preflightWiring);
const preflightCheckAt = preflight.indexOf(preflightCheck);
if (preflightWiringAt < 0 || preflightCheckAt < 0 || preflightWiringAt > preflightCheckAt) {
  fail('preflight must run the manual-review wiring self-test before its functional contract');
}
const workflowWiring = 'npm run test:manual-review-followups-wiring';
const workflowCheck = 'npm run check:manual-review-followups';
const workflowWiringAt = workflow.indexOf(workflowWiring);
const workflowCheckAt = workflow.indexOf(workflowCheck);
if (workflowWiringAt < 0 || workflowCheckAt < 0 || workflowWiringAt > workflowCheckAt) {
  fail('scoped CI must run the manual-review wiring self-test before its functional contract');
}
const reviewCondition = "needs.changes.outputs.home == 'true' || needs.changes.outputs.about == 'true' || needs.changes.outputs.ibm == 'true' || needs.changes.outputs.pikapp == 'true' || needs.changes.outputs.gallery == 'true' || needs.changes.outputs.pci == 'true' || needs.changes.outputs.wxo == 'true'";
if (!workflow.includes(reviewCondition)) fail('manual-review CI step must retain all changed-route scopes');

const wxoCandidateCommand = 'node scripts/check-wxo-public-candidate.mjs';
for (const [label, source] of [['preflight', preflight], ['CI', workflow]]) {
  if (!source.includes(wxoCandidateCommand) || source.indexOf(wxoCandidateCommand) > source.indexOf('node scripts/check-wxo-route-split.mjs')) {
    fail(`${label} must run the wxO public-candidate contract before route-split verification`);
  }
}

if (failures.length) {
  console.error('MANUAL REVIEW WIRING: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('MANUAL REVIEW WIRING: PASS');
