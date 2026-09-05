#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const root = process.cwd();
const evidenceDir = process.env.WXO_LAYOUT_EVIDENCE_DIR
  || fs.mkdtempSync(path.join(os.tmpdir(), 'wxo-layout-evidence-'));
const chrome = [
  process.env.CHROME_BIN,
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((candidate) => candidate && fs.existsSync(candidate));
if (!chrome) throw new Error('Chrome binary not found; set CHROME_BIN');

const mimeTypes = { '.css': 'text/css', '.html': 'text/html', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
  const relative = pathname === '/' ? 'wxo-canvas.html' : pathname.replace(/^\/+/, '');
  const file = path.resolve(root, relative);
  if (!file.startsWith(`${root}${path.sep}`) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return response.writeHead(404).end();
  response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(response);
});
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
class Cdp {
  constructor(url) { this.url = url; this.nextId = 1; this.pending = new Map(); this.events = new Map(); this.exceptions = []; this.consoleErrors = []; }
  async open() {
    this.socket = new WebSocket(this.url);
    this.socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data);
      if (message.id) { const p = this.pending.get(message.id); if (!p) return; this.pending.delete(message.id); message.error ? p.reject(new Error(`${p.method}: ${message.error.message}`)) : p.resolve(message.result); return; }
      if (message.method === 'Runtime.exceptionThrown') this.exceptions.push(message.params.exceptionDetails);
      if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') this.consoleErrors.push(message.params.args.map((arg) => arg.value || arg.description).join(' '));
      const waiters = this.events.get(message.method) || []; this.events.delete(message.method); waiters.forEach((resolve) => resolve(message.params));
    });
    await new Promise((resolve, reject) => { this.socket.addEventListener('open', resolve, { once: true }); this.socket.addEventListener('error', reject, { once: true }); });
  }
  call(method, params = {}) { const id = this.nextId++; return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject, method }); this.socket.send(JSON.stringify({ id, method, params })); setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); reject(new Error(`${method} timed out`)); } }, 15000); }); }
  event(method) { return new Promise((resolve) => { const waiters = this.events.get(method) || []; waiters.push(resolve); this.events.set(method, waiters); }); }
  async evaluate(expression) { const result = await this.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text); return result.result.value; }
  async navigate(url) { const loaded = this.event('Page.loadEventFired'); await this.call('Page.navigate', { url }); await loaded; await delay(250); }
  async screenshot(name) { const result = await this.call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); fs.writeFileSync(path.join(evidenceDir, name), Buffer.from(result.data, 'base64')); }
}

let browser;
let cdp;
let profile;
try {
  fs.mkdirSync(evidenceDir, { recursive: true });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  profile = fs.mkdtempSync(path.join(os.tmpdir(), 'wxo-layout-browser-'));
  const portFile = path.join(profile, 'DevToolsActivePort');
  browser = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 80 && !fs.existsSync(portFile); i += 1) await delay(100);
  assert(fs.existsSync(portFile), 'owned Chrome DevTools endpoint did not become ready');
  const port = Number.parseInt(fs.readFileSync(portFile, 'utf8'), 10);
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  cdp = new Cdp(targets.find((target) => target.type === 'page').webSocketDebuggerUrl);
  await cdp.open(); await cdp.call('Page.enable'); await cdp.call('Runtime.enable');

  let states = 0;
  const nodeSpacing = [];
  for (const viewport of [{ width: 1440, height: 900, label: 'desktop' }, { width: 390, height: 844, label: 'mobile' }]) {
    await cdp.call('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.width === 390 });
    for (const theme of ['light', 'dark']) {
      await cdp.navigate(`${baseUrl}/wxo-canvas.html`);
      await cdp.evaluate(`localStorage.setItem('lens', '${theme}')`);
      await cdp.navigate(`${baseUrl}/wxo-canvas.html`);
      const state = await cdp.evaluate(`(() => {
        const box = (el) => { const r = el.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom, r.width, r.height]; };
        const close = document.querySelector('.pilot-close');
        const heading = close.querySelector('h2');
        const media = close.querySelector('.pilot-close-media');
        const epic = document.querySelector('.pilot-activity-epic');
        const activity = document.querySelector('.pilot-activity-intro');
        const nodeGrid = document.querySelector('.pilot-exploration-grid--node');
        const nodeItems = [...nodeGrid.children];
        const firstNodeImage = nodeGrid.querySelector('img');
        const firstNodeCaption = nodeItems[0].querySelector('figcaption');
        const secondNode = nodeItems[1];
        const firstNode = nodeItems[0];
        return {
          viewport: [innerWidth, innerHeight], theme: document.documentElement.dataset.theme || 'light', rootOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          close: box(close), heading: box(heading), media: box(media), activity: box(activity), epic: box(epic), nodeGrid: box(nodeGrid), nodeImage: box(firstNodeImage),
          activityInsideEpic: epic.contains(activity), nodeColumns: getComputedStyle(nodeGrid).gridTemplateColumns,
          closeHeadingFontSize: Number.parseFloat(getComputedStyle(heading).fontSize), closeHeadingLineHeight: Number.parseFloat(getComputedStyle(heading).lineHeight),
          nodeCaption: box(firstNodeCaption), firstNode: box(firstNode), secondNode: box(secondNode),
        };
      })()`);
      assert(state.viewport[0] === viewport.width && state.viewport[1] === viewport.height, `viewport drift: ${JSON.stringify(state)}`);
      assert(state.theme === theme, `theme did not apply: ${JSON.stringify(state)}`);
      assert(state.rootOverflow === 0, `horizontal overflow at ${viewport.label} ${theme}: ${state.rootOverflow}px`);
      assert(state.activityInsideEpic && state.activity[0] >= state.epic[0] && state.activity[2] <= state.epic[2], `activity intro escapes green epic container: ${JSON.stringify(state)}`);
      assert(state.heading[0] >= 0 && state.heading[2] <= viewport.width && state.media[0] >= 0 && state.media[2] <= viewport.width, `throughline geometry clips: ${JSON.stringify(state)}`);
      assert(state.closeHeadingFontSize <= (viewport.width === 1440 ? 56 : 48) && (viewport.width !== 1440 || state.heading[5] / state.closeHeadingLineHeight <= 5.1), `throughline heading remains too large or too narrow: ${JSON.stringify(state)}`);
      assert(state.nodeColumns.split(' ').length === 1 && state.nodeImage[4] >= (viewport.width === 1440 ? 800 : 300), `node state 01 remains cramped: ${JSON.stringify(state)}`);
      assert(state.nodeCaption[1] - state.nodeImage[3] >= 16 && state.secondNode[1] - state.firstNode[3] >= 24, `node state 01 caption or panel spacing is cramped: ${JSON.stringify(state)}`);
      if (viewport.width === 1440) assert(state.heading[2] <= state.media[0], `throughline heading overlaps illustration: ${JSON.stringify(state)}`);
      nodeSpacing.push({ viewport: viewport.width, theme, imageWidth: state.nodeImage[4], captionGap: state.nodeCaption[1] - state.nodeImage[3], panelGap: state.secondNode[1] - state.firstNode[3] });
      for (const [target, selector] of [['nodes', '.pilot-exploration-grid--node'], ['activities', '.pilot-activity-intro'], ['throughline', '.pilot-close']]) {
        await cdp.evaluate(`document.querySelector('${selector}').scrollIntoView({ block: 'center', behavior: 'instant' })`);
        await delay(150);
        await cdp.screenshot(`wxo-${target}-${viewport.width}-${theme}.png`);
      }
      states += 1;
    }
  }
  assert(!cdp.exceptions.length, `page exceptions: ${JSON.stringify(cdp.exceptions)}`);
  assert(!cdp.consoleErrors.length, `console errors: ${JSON.stringify(cdp.consoleErrors)}`);
  console.log(`WXO LAYOUT FOLLOW-UP BROWSER CONTRACT: PASS states=${states} screenshots=${states * 3} owned-server=pass nodeSpacing=${JSON.stringify(nodeSpacing)}`);
} finally {
  try { cdp?.socket?.close(); } catch {}
  browser?.kill('SIGTERM');
  await delay(100);
  await new Promise((resolve) => server.close(resolve));
  if (profile) fs.rmSync(profile, { recursive: true, force: true });
}
