#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const fail = message => failures.push(message);
const requireText = (text, needle, message) => {
  if (!text.includes(needle)) fail(message);
};
const forbidText = (text, needle, message) => {
  if (text.includes(needle)) fail(message);
};

const manifest = JSON.parse(read('data/projects.json'));
const exportPolicy = JSON.parse(read('data/content-export-policy.json'));
const robots = read('robots.txt');
const sitemap = read('sitemap.xml');
const siteIndex = JSON.parse(read('content/site-index.json'));
const workflow = read('.github/workflows/health-check.yml');
const middleware = read('middleware.ts');
const preflight = read('scripts/preflight.sh');
const packageJson = JSON.parse(read('package.json'));

const publicProjects = [
  { slug: 'ibmcloud', source: 'ibmcloud.html', canonical: 'https://www.victortrandesign.com/ibmcloud' },
  { slug: 'ibm-patterns', source: 'ibm-patterns.html', canonical: 'https://www.victortrandesign.com/ibm-patterns' },
  { slug: 'pci', source: 'pci.html', canonical: 'https://www.victortrandesign.com/pci' },
];

for (const expected of publicProjects) {
  const project = manifest.projects.find(item => item.slug === expected.slug);
  if (!project) {
    fail(`${expected.slug} manifest entry is missing`);
    continue;
  }
  if (project.protected !== false) fail(`${expected.slug} must be public in data/projects.json`);
  if (project.noindex !== false) fail(`${expected.slug} must be indexable in data/projects.json`);
  if (project.sitemap !== true) fail(`${expected.slug} must be sitemap-eligible in data/projects.json`);

  const html = read(expected.source);
  for (const forbidden of [
    '<meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex">',
    '<meta name="referrer" content="no-referrer">',
    "sessionStorage.getItem('vtd-unlock')",
    'css/password-gate.css',
    'js/password-gate.js',
    'site-route-status',
  ]) forbidText(html, forbidden, `${expected.source} retained protected-route marker: ${forbidden}`);

  if (exportPolicy.protectedPages.some(item => item.source === expected.source)) {
    fail(`${expected.source} must be removed from the protected content-export policy`);
  }
  forbidText(robots, `Disallow: /${expected.slug}`, `robots.txt must not disallow /${expected.slug}`);
  requireText(sitemap, `<loc>${expected.canonical}</loc>`, `sitemap.xml must include ${expected.canonical}`);
  if (!siteIndex.some(page => page.source === expected.source)) {
    fail(`public site index must include ${expected.source}`);
  }
  const publicExport = read(`content/${expected.slug}.md`);
  forbidText(publicExport, 'Generated protected-content stub', `content/${expected.slug}.md must be a public source export`);
  requireText(publicExport, `source: "${expected.source}"`, `content/${expected.slug}.md must retain source metadata`);
}

requireText(middleware, "matcher: ['/:path*']", 'protected archive routes must remain covered by catch-all Vercel Routing Middleware');
for (const protectedPage of ['wxo-canvas.html', 'document-processing.html']) {
  const html = read(protectedPage);
  forbidText(html, "sessionStorage.getItem('vtd-unlock')", `${protectedPage} must not authorize through browser storage`);
  forbidText(html, 'js/password-gate.js', `${protectedPage} must not load the retired browser password gate`);
  requireText(html, '<meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex">', `${protectedPage} must remain noindex`);
  if (!exportPolicy.protectedPages.some(item => item.source === protectedPage)) {
    fail(`${protectedPage} must remain in the protected content-export policy`);
  }
}

for (const route of ['ibmcloud', 'ibm-patterns', 'pci']) {
  requireText(workflow, `\${{ steps.url.outputs.base }}/${route}`, `GitHub health workflow must audit public /${route}`);
}
requireText(packageJson.scripts?.['check:public-archive-routes'] ?? '', 'scripts/check-public-archive-routes.mjs', 'package.json must register the public archive-route contract');
requireText(preflight, 'check:public-archive-routes', 'preflight must run the public archive-route contract');
requireText(workflow, 'npm run check:public-archive-routes', 'GitHub health workflow must run the public archive-route contract');

if (failures.length) {
  console.error('PUBLIC ARCHIVE ROUTES CONTRACT: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('PUBLIC ARCHIVE ROUTES CONTRACT: PASS routes=ibmcloud,ibm-patterns,pci protected=wxo-canvas,document-processing');
