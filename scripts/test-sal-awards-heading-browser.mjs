#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const root = process.cwd();
const evidenceDir = process.env.SAL_AWARDS_EVIDENCE_DIR
  || fs.mkdtempSync(path.join(os.tmpdir(), 'sal-awards-evidence-'));
const chrome = [
  process.env.CHROME_BIN,
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((candidate) => candidate && fs.existsSync(candidate));
if (!chrome) throw new Error('Chrome binary not found; set CHROME_BIN');

const mimeTypes = { '.css': 'text/css', '.html': 'text/html', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
  const relative = pathname === '/' ? 'salmagazine.html' : pathname.replace(/^\/+/, '');
  const file = path.resolve(root, relative);
  if (!file.startsWith(`${root}${path.sep}`) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(response);
});
const listen = () => new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const closeServer = () => new Promise((resolve) => server.close(resolve));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

class Cdp {
  constructor(url) { this.url = url; this.nextId = 1; this.pending = new Map(); this.events = new Map(); this.exceptions = []; this.consoleErrors = []; }
  async open() {
    this.socket = new WebSocket(this.url);
    this.socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        message.error ? pending.reject(new Error(`${pending.method}: ${message.error.message}`)) : pending.resolve(message.result);
        return;
      }
      if (message.method === 'Runtime.exceptionThrown') this.exceptions.push(message.params.exceptionDetails);
      if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') this.consoleErrors.push(message.params.args.map((arg) => arg.value || arg.description).join(' '));
      const waiters = this.events.get(message.method) || [];
      this.events.delete(message.method);
      waiters.forEach((resolve) => resolve(message.params));
    });
    await new Promise((resolve, reject) => { this.socket.addEventListener('open', resolve, { once: true }); this.socket.addEventListener('error', reject, { once: true }); });
  }
  call(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, method });
      this.socket.send(JSON.stringify({ id, method, params }));
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); reject(new Error(`${method} timed out`)); } }, 15000);
    });
  }
  event(method) { return new Promise((resolve) => { const waiters = this.events.get(method) || []; waiters.push(resolve); this.events.set(method, waiters); }); }
  async evaluate(expression) {
    const result = await this.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  }
  async navigate(url) { const loaded = this.event('Page.loadEventFired'); await this.call('Page.navigate', { url }); await loaded; await delay(200); }
  async screenshot(name) { const result = await this.call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); fs.writeFileSync(path.join(evidenceDir, name), Buffer.from(result.data, 'base64')); }
}

let browser;
let cdp;
let profile;
try {
  fs.mkdirSync(evidenceDir, { recursive: true });
  await listen();
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  profile = fs.mkdtempSync(path.join(os.tmpdir(), 'sal-awards-browser-'));
  const devToolsPortFile = path.join(profile, 'DevToolsActivePort');
  browser = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
  for (let attempt = 0; attempt < 80 && !fs.existsSync(devToolsPortFile); attempt += 1) await delay(100);
  assert(fs.existsSync(devToolsPortFile), 'owned Chrome DevTools endpoint did not become ready');
  const port = Number.parseInt(fs.readFileSync(devToolsPortFile, 'utf8'), 10);
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  cdp = new Cdp(targets.find((target) => target.type === 'page').webSocketDebuggerUrl);
  await cdp.open();
  await cdp.call('Page.enable');
  await cdp.call('Runtime.enable');

  let states = 0;
  for (const viewport of [{ width: 1440, height: 900, label: 'desktop' }, { width: 390, height: 844, label: 'mobile' }]) {
    await cdp.call('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.width === 390 });
    for (const theme of ['light', 'dark']) {
      await cdp.navigate(`${baseUrl}/salmagazine.html`);
      await cdp.evaluate(`localStorage.setItem('lens', '${theme}')`);
      await cdp.navigate(`${baseUrl}/salmagazine.html`);
      await cdp.evaluate(`document.querySelector('.sal-vico2-evidence').scrollIntoView({ block: 'center', behavior: 'instant' })`);
      await delay(250);
      const state = await cdp.evaluate(`(() => {
        const evidence = document.querySelector('.sal-vico2-evidence');
        const heading = evidence.querySelector('h3');
        const evidenceBox = evidence.getBoundingClientRect();
        const headingBox = heading.getBoundingClientRect();
        const headingStyle = getComputedStyle(heading);
        return {
          viewport: [innerWidth, innerHeight], theme: document.documentElement.dataset.theme || 'light',
          rootOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          fontSize: Number.parseFloat(headingStyle.fontSize), lineHeight: Number.parseFloat(headingStyle.lineHeight), whiteSpace: headingStyle.whiteSpace,
          heading: [headingBox.left, headingBox.top, headingBox.right, headingBox.bottom, headingBox.width, headingBox.height],
          evidence: [evidenceBox.left, evidenceBox.top, evidenceBox.right, evidenceBox.bottom],
          contained: headingBox.left >= evidenceBox.left && headingBox.right <= evidenceBox.right && headingBox.top >= evidenceBox.top && headingBox.bottom <= evidenceBox.bottom,
        };
      })()`);
      assert(state.viewport[0] === viewport.width && state.viewport[1] === viewport.height, `viewport drift: ${JSON.stringify(state)}`);
      assert(state.theme === theme, `theme did not apply: ${JSON.stringify(state)}`);
      assert(state.rootOverflow === 0, `horizontal overflow at ${viewport.label} ${theme}: ${state.rootOverflow}px`);
      assert(state.contained, `awards heading escapes its evidence panel at ${viewport.label} ${theme}: ${JSON.stringify(state)}`);
      assert(state.whiteSpace === 'normal', `awards heading cannot wrap at ${viewport.label} ${theme}: ${state.whiteSpace}`);
      assert(state.fontSize <= (viewport.width === 1440 ? 48 : 32), `awards heading remains oversized at ${viewport.label} ${theme}: ${state.fontSize}px`);
      await cdp.screenshot(`sal-awards-${viewport.width}-${theme}.png`);
      states += 1;
    }
  }
  assert(!cdp.exceptions.length, `page exceptions: ${JSON.stringify(cdp.exceptions)}`);
  assert(!cdp.consoleErrors.length, `console errors: ${JSON.stringify(cdp.consoleErrors)}`);
  console.log(`SAL AWARDS HEADING BROWSER CONTRACT: PASS states=${states} owned-server=pass`);
} finally {
  try { cdp?.socket?.close(); } catch {}
  browser?.kill('SIGTERM');
  await delay(100);
  await closeServer();
  if (profile) fs.rmSync(profile, { recursive: true, force: true });
}
