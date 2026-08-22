#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'responsive-output-bounds-'));
const fixtureImages = path.join(fixture, 'images');
const sources = [
  'about-vic-japan.jpg', 'patterns-hero.webp', 'pci-handbook-1-cover.webp', 'dna-preview.jpg', 'thumb-sal.webp',
  'illus-ibm-selectric-web.jpg',
  ...Array.from({ length: 7 }, (_, index) => `illus-untitled-${index + 5}.jpg`),
];
const copy = (relative) => fs.cpSync(path.join(root, relative), path.join(fixture, relative), { recursive: true });
const run = (command, args) => execFileSync(command, args, {
  cwd: root,
  env: { ...process.env, RESPONSIVE_IMAGES_ROOT: fixture },
  encoding: 'utf8',
  stdio: 'pipe',
});

try {
  fs.mkdirSync(fixtureImages, { recursive: true });
  sources.forEach((name) => copy(`images/${name}`));
  copy('images/art-archive-v2/old-one.webp');
  copy('images/responsive');
  // The checker also verifies production references; retain those inputs in this
  // process-owned fixture so its failure signal is specifically the extra WebP.
  [
    'PORTFOLIO_DASHBOARD.md', 'about.html', 'index.html', 'data/projects.json',
    'case-studies/ibm-patterns.md', '.github/workflows/health-check.yml',
  ].forEach(copy);

  const output = path.join(fixtureImages, 'responsive');
  const marker = `__responsive-bounds-test-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const stale = path.join(output, `${marker}.webp`);
  const nonWebp = path.join(output, `${marker}.keep`);
  fs.writeFileSync(stale, 'process-owned stale WebP fixture');
  fs.writeFileSync(nonWebp, 'unrelated non-WebP must survive reconciliation');

  let checkerOutput = '';
  try {
    run('node', ['scripts/check-responsive-images.mjs']);
  } catch (error) {
    checkerOutput = `${error.stdout || ''}\n${error.stderr || ''}`;
  }
  if (!checkerOutput.includes('Responsive output directory WebP set must exactly match the expected derivative set.')) {
    throw new Error(`checker did not reject the process-owned unexpected responsive WebP output: ${checkerOutput}`);
  }

  run('uv', ['run', '--python', '3.14', '--with', 'pillow==12.3.0', 'python3', 'scripts/generate-responsive-images.py']);
  if (fs.existsSync(stale)) throw new Error('generator did not reconcile the process-owned stale responsive WebP output');
  if (!fs.existsSync(nonWebp)) throw new Error('generator removed an unrelated non-WebP file');

  console.log('RESPONSIVE OUTPUT BOUNDS: PASS checker=rejects-extra generator=reconciles-managed-webp');
} finally {
  fs.rmSync(fixture, { recursive: true, force: true, maxRetries: 3 });
}
