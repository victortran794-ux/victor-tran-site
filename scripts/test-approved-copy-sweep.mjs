import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const root = process.cwd();
const checker = path.join(root, 'scripts', 'check-approved-copy-sweep.mjs');
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'approved-copy-contract-'));
const htmlFiles = [
  'index.html',
  'about.html',
  'document-processing.html',
  'wxo-canvas.html',
  'wxo-access.html',
  'ibmcloud.html',
  'ibm-patterns.html',
  'pikappapp.html',
  'pci.html',
  'abilityexperience.html',
  'salmagazine.html',
  'artillustration.html',
  'graphicgallery.html',
  'uigallery.html',
];

function runChecker() {
  return spawnSync(process.execPath, [checker], {
    cwd: fixture,
    encoding: 'utf8',
  });
}

try {
  for (const file of htmlFiles) fs.copyFileSync(path.join(root, file), path.join(fixture, file));
  fs.cpSync(path.join(root, 'content'), path.join(fixture, 'content'), { recursive: true });
  fs.mkdirSync(path.join(fixture, 'data'), { recursive: true });
  fs.copyFileSync(path.join(root, 'data', 'content-export-policy.json'), path.join(fixture, 'data', 'content-export-policy.json'));

  const baseline = runChecker();
  if (baseline.status !== 0) {
    console.error('APPROVED COPY CONTRACT SELF-TEST: FAIL baseline fixture did not pass');
    console.error(baseline.stderr || baseline.stdout);
    process.exit(1);
  }

  const approvedBody = 'I work on interface hierarchy and reusable components for AI and automation workflows, alongside UX, product, and development partners.';
  const aboutPath = path.join(fixture, 'about.html');
  const about = fs.readFileSync(aboutPath, 'utf8');
  if (!about.includes(approvedBody)) throw new Error('Self-test could not locate approved About body copy');
  fs.writeFileSync(aboutPath, `${about.replace(approvedBody, 'BROKEN BODY COPY')}\n<!-- ${approvedBody} -->\n`);

  const compromised = runChecker();
  if (compromised.status === 0) {
    console.error('APPROVED COPY CONTRACT SELF-TEST: FAIL comment injection satisfied visible-copy contract');
    process.exit(1);
  }

  console.log('APPROVED COPY CONTRACT SELF-TEST: PASS comments cannot satisfy visible-copy assertions');
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}
