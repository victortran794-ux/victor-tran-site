#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'responsive-output-bounds-'));
const sources = [
  'about-vic-japan.jpg', 'patterns-hero.webp', 'pci-handbook-1-cover.webp', 'dna-preview.jpg', 'thumb-sal.webp',
  'illus-ibm-selectric-web.jpg', ...Array.from({ length: 7 }, (_, index) => `illus-untitled-${index + 5}.jpg`),
  'logos-2.jpg', 'gg-edc-1.jpg', 'gg-edc-0.jpg', 'gg-edc-2.jpg', 'gg-edc-3.jpg', 'thumb-sgla.webp',
  ...Array.from({ length: 16 }, (_, index) => `gg-slides-${index + 1}.jpg`),
  'gg-day-of-giving.png', 'gg-ibm-fan.jpg', 'logos-1.jpg', 'logos-3.jpg', 'logos-4.jpg',
  'gg-illus-1.jpg', 'gg-illus-2.jpg', 'gg-illus-3.jpg', 'gg-infographic.jpg',
];
const graphicArchiveSources = [
  'sgla-2024-identity-development.webp', 'sgla-2023-brand-guidelines.webp', 'sgla-2024-ballroom-system.webp',
  'sgla-2024-signage-system.webp', 'dog.webp', 'chantico.webp', 'abex.webp', 'sc56-instagram-panel-series.webp',
  'ibm-paltron-illustration-system.webp', 'wxo-illustration-system.webp',
];
const copy = (relative) => fs.cpSync(path.join(root, relative), path.join(fixture, relative), { recursive: true });
const run = () => execFileSync('uv', ['run', '--python', '3.14', '--with', 'pillow==12.3.0', 'python3', 'scripts/generate-responsive-images.py'], {
  cwd: root, env: { ...process.env, RESPONSIVE_IMAGES_ROOT: fixture }, encoding: 'utf8', stdio: 'pipe',
});
const workflow = fs.readFileSync(path.join(root, '.github/workflows/health-check.yml'), 'utf8');
const uvSetup = `      - uses: astral-sh/setup-uv@20cfd1bf945f4377ade1205e4dbc17946fc9a30d # v10.0.1
        if: >-
          needs.changes.outputs.all == 'true' ||
          needs.changes.outputs.shared == 'true' ||
          needs.changes.outputs.resume == 'true' ||
          needs.changes.outputs.images == 'true' ||
          needs.changes.outputs.gallery == 'true'
        with:
          version: "0.11.14"`;
const uvSetupIndex = workflow.indexOf(uvSetup);
const ownershipIndex = workflow.indexOf('      - name: Graphic responsive image ownership contracts');
if (uvSetupIndex === -1 || ownershipIndex === -1 || uvSetupIndex > ownershipIndex) {
  throw new Error('health-check workflow must install pinned uv before responsive image ownership tests');
}

try {
  fs.mkdirSync(path.join(fixture, 'images'), { recursive: true });
  sources.forEach((name) => copy(`images/${name}`));
  graphicArchiveSources.forEach((name) => copy(`images/graphic-archive-v2/${name}`));
  copy('images/art-archive-v2/old-one.webp');
  copy('images/responsive');
  // The shared checker also verifies these production-reference contracts; retain
  // their inputs so its RED signal is specifically the process-owned extra WebPs.
  [
    'PORTFOLIO_DASHBOARD.md', 'about.html', 'index.html', 'data/projects.json',
    'case-studies/ibm-patterns.md', '.github/workflows/health-check.yml',
  ].forEach(copy);

  const output = path.join(fixture, 'images', 'responsive');
  const graphic = path.join(output, 'graphic');
  const marker = `__responsive-bounds-test-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const staleTopLevel = path.join(output, `${marker}.webp`);
  const staleGraphic = path.join(graphic, `${marker}.webp`);
  const topLevelNonWebp = path.join(output, `${marker}.keep`);
  const graphicNonWebp = path.join(graphic, `${marker}.keep`);
  const sibling = path.join(output, 'other-route', `${marker}.webp`);
  fs.writeFileSync(staleTopLevel, 'process-owned stale top-level WebP fixture');
  fs.writeFileSync(staleGraphic, 'process-owned stale Graphic WebP fixture');
  fs.writeFileSync(topLevelNonWebp, 'unrelated top-level non-WebP must survive reconciliation');
  fs.writeFileSync(graphicNonWebp, 'unrelated Graphic non-WebP must survive reconciliation');
  fs.mkdirSync(path.dirname(sibling), { recursive: true });
  fs.writeFileSync(sibling, 'sibling-route WebP must survive Graphic-only reconciliation');

  let checkerOutput = '';
  try {
    execFileSync('node', ['scripts/check-responsive-images.mjs'], {
      cwd: root, env: { ...process.env, RESPONSIVE_IMAGES_ROOT: fixture }, encoding: 'utf8', stdio: 'pipe',
    });
  } catch (error) {
    checkerOutput = `${error.stdout || ''}\n${error.stderr || ''}`;
  }
  if (!checkerOutput.includes('Responsive output directory WebP set must exactly match the expected derivative set.')) {
    throw new Error(`checker did not reject process-owned unexpected top-level and Graphic WebP outputs: ${checkerOutput}`);
  }

  run();
  if (fs.existsSync(staleTopLevel)) throw new Error('generator did not reconcile the process-owned stale top-level WebP output');
  if (fs.existsSync(staleGraphic)) throw new Error('generator did not reconcile the process-owned stale Graphic WebP output');
  for (const file of [topLevelNonWebp, graphicNonWebp, sibling]) {
    if (!fs.existsSync(file)) throw new Error(`generator removed an output outside its exact managed WebP route: ${file}`);
  }

  console.log('RESPONSIVE OUTPUT BOUNDS: PASS checker=rejects-extra generator=reconciles-exact-graphic-webp preserves=siblings-top-level-and-nonwebp');
} finally {
  fs.rmSync(fixture, { recursive: true, force: true, maxRetries: 3 });
}
