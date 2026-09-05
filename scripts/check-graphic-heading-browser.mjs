#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import { spawn } from 'node:child_process';

const chromeCandidates = [
  process.env.CHROME_BIN,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);
const chrome = chromeCandidates.find((candidate) => fs.existsSync(candidate));
if (!chrome) throw new Error('Chrome or Chromium binary not found. Set CHROME_BIN to an executable browser path or install a supported system browser.');
const baseUrl = process.env.SITE_URL || 'http://127.0.0.1:8765';
const profile = fs.mkdtempSync(`${os.tmpdir()}/graphic-heading-`);
const portFile = `${profile}/DevToolsActivePort`;
const browser = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--remote-allow-origins=*', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let socket;
let nextId = 1;
const pending = new Map();

try {
  for (let attempt = 0; attempt < 100 && !fs.existsSync(portFile); attempt += 1) await wait(100);
  if (!fs.existsSync(portFile)) throw new Error('Chrome DevTools port was not ready');
  const port = Number(fs.readFileSync(portFile, 'utf8').split(/\r?\n/, 1)[0]);
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const target = targets.find((item) => item.type === 'page');
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  socket.addEventListener('message', (event) => { const message = JSON.parse(event.data); if (message.id && pending.has(message.id)) { const { resolve, reject } = pending.get(message.id); pending.delete(message.id); message.error ? reject(Error(message.error.message)) : resolve(message.result); } });
  const call = (method, params = {}) => new Promise((resolve, reject) => { const id = nextId++; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  const evaluate = async (expression) => { const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw Error(result.exceptionDetails.text); return result.result.value; };
  await call('Page.enable');
  await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await call('Page.navigate', { url: `${baseUrl}/graphicgallery.html` });
  await evaluate('document.fonts.ready.then(() => true)');
  await wait(100);
  const state = await evaluate(`(() => { const heading = document.querySelector('#graphic-archive-title'); const rect = heading.getBoundingClientRect(); const style = getComputedStyle(heading); return { text: heading.textContent.trim(), rootOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, headingRight: rect.right, viewport: innerWidth, fontSize: style.fontSize, fontFamily: style.fontFamily }; })()`);
  if (state.text !== 'Graphics. Design. Print.') throw new Error(`hero heading drifted: ${JSON.stringify(state)}`);
  if (Number.parseFloat(state.fontSize) > 75) throw new Error(`390px heading typography is too large for the exact title: ${JSON.stringify(state)}`);
  if (state.rootOverflow !== 0 || state.headingRight > state.viewport - 20) throw new Error(`390px heading escapes its 20px content rail: ${JSON.stringify(state)}`);
  console.log(`Graphic heading browser contract passed: 390px overflow=0 fontSize=${state.fontSize} headingRight=${state.headingRight} fontFamily=${state.fontFamily}.`);
} finally {
  try { socket?.close(); } catch {}
  browser.kill('SIGTERM');
  await wait(100);
  fs.rmSync(profile, { recursive: true, force: true });
}
