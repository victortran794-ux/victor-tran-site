#!/usr/bin/env node
import assert from 'node:assert/strict';
import { once } from 'node:events';
import net from 'node:net';
import { spawn } from 'node:child_process';

const {
  findAvailablePort,
  terminateChild,
  waitForServerBound,
} = await import('./about-browser-process.mjs');

const host = '127.0.0.1';

const exited = spawn(process.execPath, ['-e', 'process.exit(0)'], { stdio: 'ignore' });
await once(exited, 'exit');
const alreadyExitedStart = Date.now();
await terminateChild(exited, { graceMs: 100 });
assert(Date.now() - alreadyExitedStart < 500, 'cleanup must resolve immediately for an already-exited child');

const occupiedPort = await findAvailablePort(host);
const blocker = net.createServer();
await new Promise((resolve, reject) => blocker.once('error', reject).listen(occupiedPort, host, resolve));
const collided = spawn('python3', ['-u', '-m', 'http.server', String(occupiedPort), '--bind', host], {
  stdio: ['ignore', 'pipe', 'pipe'],
});
await assert.rejects(
  waitForServerBound(collided, { expectedPort: occupiedPort, timeoutMs: 1500 }),
  /exited|failed|timed out/i,
  'server readiness must fail when the owned child cannot bind',
);
await terminateChild(collided, { graceMs: 100 });
await new Promise(resolve => blocker.close(resolve));

const ownedPort = await findAvailablePort(host);
const owned = spawn('python3', ['-u', '-m', 'http.server', String(ownedPort), '--bind', host], {
  stdio: ['ignore', 'pipe', 'pipe'],
});
const boundPort = await waitForServerBound(owned, { expectedPort: ownedPort, timeoutMs: 1500 });
assert.equal(boundPort, ownedPort, 'readiness must come from the owned child’s bind message');
const response = await fetch(`http://${host}:${ownedPort}/about.html`, { signal: AbortSignal.timeout(1000) });
assert.equal(response.status, 200, 'owned server must serve the About source');
await terminateChild(owned, { graceMs: 1000 });
assert(owned.exitCode !== null || owned.signalCode !== null, 'owned server must be reaped');

console.log('About browser process lifecycle tests passed.');
