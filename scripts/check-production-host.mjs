import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const expectedHost = 'https://www.victortrandesign.com';
const legacyHost = 'https://victortrandesign.com';
const files = [
  'index.html', 'about.html', 'abilityexperience.html', 'artillustration.html',
  'document-processing.html', 'graphicgallery.html', 'ibm-patterns.html',
  'ibmcloud.html', 'pci.html', 'pikappapp.html', 'salmagazine.html', 'wxo-canvas.html',
  'sitemap.xml', 'robots.txt', 'scripts/health-check.sh',
  '.github/workflows/health-check.yml', 'PORTFOLIO_SYSTEM.md',
  'case-studies/document-processing.md', 'CLAUDE.md', 'victor-tran-site.md',
];
const failures = [];
for (const file of files) {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  if (content.includes(legacyHost)) {
    failures.push(`${file}: still uses the redirecting production host.`);
  }
}

const workflow = fs.readFileSync(path.join(root, '.github/workflows/health-check.yml'), 'utf8');
if (!workflow.includes('run: node scripts/check-production-host.mjs')) {
  failures.push('.github/workflows/health-check.yml: CI must execute the production-host regression check.');
}
if (!workflow.includes("needs.changes.outputs.deployable == 'true'")) {
  failures.push('.github/workflows/health-check.yml: production-host validation must use deployable scope.');
}

const htmlFiles = files.filter((file) => file.endsWith('.html'));
for (const file of htmlFiles) {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  for (const pattern of [
    /<link rel="canonical" href="(https:[^"]+)"/,
    /<meta property="og:url" content="(https:[^"]+)"/,
    /<meta property="og:image" content="(https:[^"]+)"/,
  ]) {
    const value = content.match(pattern)?.[1];
    let origin = null;
    try {
      origin = value ? new URL(value).origin : null;
    } catch {
      origin = null;
    }
    if (origin !== expectedHost) failures.push(`${file}: production metadata must use ${expectedHost}.`);
  }
}

if (failures.length) {
  console.error(`Production-host regression check failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`Production-host regression check passed for ${files.length} active files.`);
