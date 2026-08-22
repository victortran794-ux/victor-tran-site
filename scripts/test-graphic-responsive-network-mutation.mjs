#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import process from 'node:process';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const port = 9400 + (process.pid % 400);
const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], {
  cwd: root,
  stdio: 'ignore',
});
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

try {
  await delay(300);
  const result = spawnSync('node', ['scripts/check-visual-archives-browser.mjs', 'graphic'], {
    cwd: root,
    env: {
      ...process.env,
      SITE_URL: `http://127.0.0.1:${port}`,
      VISUAL_ARCHIVES_NETWORK_MUTATION: 'future-graphic-responsive-request',
    },
    encoding: 'utf8',
  });
  if (result.status === 0) {
    throw new Error('Graphic browser contract accepted a controlled future deferred request while the DOM remained unchanged');
  }
  const output = `${result.stdout}\n${result.stderr}`;
  if (!output.includes('fresh 390px navigation requested lazy or original Graphic media')) {
    throw new Error(`Graphic browser checker failed without the expected initial-network signal:\n${output}`);
  }
  console.log('GRAPHIC RESPONSIVE NETWORK MUTATION: PASS future-request=rejected');
} finally {
  server.kill('SIGTERM');
  await Promise.race([new Promise((resolve) => server.once('exit', resolve)), delay(1000)]);
}
