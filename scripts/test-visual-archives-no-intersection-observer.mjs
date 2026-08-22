#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import process from 'node:process';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const port = 8996 + (process.pid % 400);
const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
try {
  await delay(300);
  const result = spawnSync('node', ['scripts/check-visual-archives-browser.mjs', 'art'], {
    cwd: root,
    env: { ...process.env, SITE_URL: `http://127.0.0.1:${port}`, VISUAL_ARCHIVES_DISABLE_IO: '1' },
    encoding: 'utf8',
  });
  if (result.status !== 0) throw new Error(`no-IntersectionObserver Art browser contract failed:\n${result.stdout}\n${result.stderr}`);
  console.log('VISUAL ARCHIVES NO-IO: PASS fallback=active-next-and-controls');
} finally {
  server.kill('SIGTERM');
}
