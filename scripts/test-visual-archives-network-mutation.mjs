#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import process from 'node:process';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const port = 8896 + (process.pid % 500);
const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], {
  cwd: root,
  stdio: 'ignore',
});
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

try {
  await delay(300);
  const result = spawnSync('node', ['scripts/check-visual-archives-browser.mjs', 'art'], {
    cwd: root,
    env: {
      ...process.env,
      SITE_URL: `http://127.0.0.1:${port}`,
      VISUAL_ARCHIVES_NETWORK_MUTATION: 'future-horned-responsive-request',
    },
    encoding: 'utf8',
  });
  if (result.status === 0) {
    throw new Error('browser media contract accepted a controlled future deferred responsive request while the DOM remained unchanged');
  }
  if (!`${result.stdout}\n${result.stderr}`.includes('network')) {
    throw new Error(`browser checker failed without a network-contract signal:\n${result.stdout}\n${result.stderr}`);
  }
  console.log('VISUAL ARCHIVES NETWORK MUTATION: PASS future-request=rejected');
} finally {
  server.kill('SIGTERM');
}
