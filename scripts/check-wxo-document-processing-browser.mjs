#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const root = process.cwd();
const ownsServer = !process.env.SITE_URL;
const sitePort = 8800 + (process.pid % 800);
const baseUrl = process.env.SITE_URL || `http://127.0.0.1:${sitePort}`;
// Evidence is intentionally kept outside the repository. Callers may supply a durable path.
const evidenceDir = process.env.WXO_DOCUMENT_EVIDENCE_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'wxo-document-evidence-'));
const chrome = [
  process.env.CHROME_BIN,
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean).find((candidate) => fs.existsSync(candidate));
if (!chrome) throw new Error('Chrome binary not found; set CHROME_BIN');

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'wxo-document-browser-'));
const port = 9900 + (process.pid % 90);
let chromeLog = '';
let serverLog = '';
const server = ownsServer ? spawn('python3', ['-m', 'http.server', String(sitePort), '--bind', '127.0.0.1'], { cwd: root, stdio: ['ignore', 'ignore', 'pipe'] }) : null;
server?.stderr.on('data', (chunk) => { serverLog += chunk.toString(); });
const child = spawn(chrome, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--remote-allow-origins=*',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--window-size=1280,720', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });
child.stderr.on('data', (chunk) => { chromeLog += chunk.toString(); });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
async function json(url) { const response = await fetch(url); if (!response.ok) throw new Error(`${response.status} ${url}`); return response.json(); }
async function waitForSite() {
  if (!ownsServer) return;
  let error;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try { if ((await fetch(`${baseUrl}/wxo-canvas.html`)).ok) return; } catch (caught) { error = caught; }
    if (server?.exitCode !== null) throw new Error(`Local server exited ${server.exitCode}: ${serverLog}`);
    await delay(100);
  }
  throw error || new Error('Local site did not become ready');
}
async function target() {
  let error;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try { const page = (await json(`http://127.0.0.1:${port}/json/list`)).find((item) => item.type === 'page'); if (page?.webSocketDebuggerUrl) return page; } catch (caught) { error = caught; }
    if (child.exitCode !== null) throw new Error(`Chrome exited ${child.exitCode}: ${chromeLog}`);
    await delay(100);
  }
  throw error || new Error('Chrome DevTools target did not become ready');
}
class Cdp {
  constructor(url) { this.url = url; this.id = 0; this.pending = new Map(); this.exceptions = []; this.consoleErrors = []; this.httpErrors = []; }
  async open() {
    this.socket = new WebSocket(this.url);
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id) { const pending = this.pending.get(message.id); if (!pending) return; this.pending.delete(message.id); message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result); return; }
      if (message.method === 'Runtime.exceptionThrown') this.exceptions.push(message.params.exceptionDetails.text);
      if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') this.consoleErrors.push(message.params.args.map((item) => item.value || item.description).join(' '));
      if (message.method === 'Network.responseReceived' && message.params.response.status >= 400 && !message.params.response.url.includes('/_vercel/')) this.httpErrors.push(`${message.params.response.status} ${message.params.response.url}`);
    });
    await new Promise((resolve, reject) => { this.socket.addEventListener('open', resolve, { once: true }); this.socket.addEventListener('error', reject, { once: true }); });
  }
  call(method, params = {}) { const id = ++this.id; return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.socket.send(JSON.stringify({ id, method, params })); setTimeout(() => { if (this.pending.delete(id)) reject(new Error(`${method} timed out`)); }, 15000); }); }
  async evaluate(expression) { const result = await this.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.text); return result.result.value; }
  async navigate(url) { await this.call('Page.navigate', { url }); for (let attempt = 0; attempt < 100; attempt += 1) { const ready = await this.evaluate('document.readyState'); if (ready === 'complete') break; await delay(50); } await delay(120); }
  async key(key, code, keyCode) { const event = { key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode }; if (key === 'Enter') Object.assign(event, { text: '\r', unmodifiedText: '\r' }); await this.call('Input.dispatchKeyEvent', { type: 'keyDown', ...event }); await this.call('Input.dispatchKeyEvent', { type: 'keyUp', ...event }); await delay(50); }
  async screenshot(name) { const { data } = await this.call('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(evidenceDir, name), Buffer.from(data, 'base64')); }
}

let cdp;
try {
  await waitForSite();
  fs.mkdirSync(evidenceDir, { recursive: true });
  cdp = new Cdp((await target()).webSocketDebuggerUrl);
  await cdp.open();
  await cdp.call('Page.enable'); await cdp.call('Runtime.enable'); await cdp.call('Network.enable');

  // The public gate remains the entry point only for the protected Document Processing route.
  let gateChecks = 0;
  for (const viewport of [{ width: 390, height: 844, mobile: true }, { width: 1280, height: 720, mobile: false }]) {
    await cdp.call('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor: 1 });
    await cdp.navigate(`${baseUrl}/wxo-access.html?next=%2Fdocument-processing`);
    const gate = await cdp.evaluate(`(()=>{const dialog=document.querySelector('#vtd-gate [role="dialog"]');const card=document.querySelector('.vtd-gate-card').getBoundingClientRect();return {modal:dialog?.getAttribute('aria-modal'),labelled:dialog?.getAttribute('aria-labelledby'),title:document.querySelector('.vtd-gate-title')?.id,described:dialog?.getAttribute('aria-describedby'),description:document.querySelector('.vtd-gate-body')?.id,method:document.querySelector('.vtd-gate-form')?.method,action:new URL(document.querySelector('.vtd-gate-form')?.action).pathname,next:document.querySelector('input[name="next"]')?.value,focus:document.activeElement?.id,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,card:[card.left,card.right]}})()`);
    await cdp.screenshot(`document-processing-gate-${viewport.width}.png`);
    assert(gate.modal === 'true' && gate.labelled === gate.title && gate.described === gate.description && gate.method === 'post' && gate.action === '/api/wxo-access' && gate.next === '/document-processing' && gate.focus === 'vtd-gate-input' && gate.overflow === 0 && gate.card[0] >= 0 && gate.card[1] <= viewport.width, `Protected gate semantics or geometry failed ${JSON.stringify(gate)}`);
    for (const expected of ['Unlock', 'Back to portfolio', 'Email me', 'vtd-gate-input']) {
      await cdp.key('Tab', 'Tab', 9);
      const focus = await cdp.evaluate(`({id:document.activeElement?.id,text:document.activeElement?.textContent?.trim()})`);
      assert(focus.id === expected || focus.text?.includes(expected), `Protected gate focus order failed; expected ${expected}, got ${JSON.stringify(focus)}`);
    }
    await cdp.key('Escape', 'Escape', 27);
    assert(await cdp.evaluate(`document.activeElement?.id === 'vtd-gate-input'`), 'Escape must keep focus inside the protected access gate.');
    gateChecks += 1;
  }

  await cdp.navigate(`${baseUrl}/wxo-access.html?next=%2Fdocument-processing&error=1`);
  const invalidGate = await cdp.evaluate(`({hidden:document.querySelector('.vtd-gate-error')?.hidden,text:document.querySelector('.vtd-gate-error')?.textContent.trim(),focus:document.activeElement?.id})`);
  assert(!invalidGate.hidden && invalidGate.text === 'Incorrect password. Try again.' && invalidGate.focus === 'vtd-gate-input', `Protected gate invalid-password state failed ${JSON.stringify(invalidGate)}`);

  let states = 0;
  for (const spec of [
    { name: 'wxo', file: 'wxo-canvas.html', body: 'wxo-page', robots: 'index,follow', images: 14, evidence: 13 },
    { name: 'doc', file: 'document-processing.html', body: 'doc-processing-page', robots: 'noindex,nofollow,noarchive,nosnippet,noimageindex', images: 12, evidence: 4 },
  ]) {
    for (const viewport of [{ width: 390, height: 844, mobile: true }, { width: 1280, height: 720, mobile: false }]) {
      await cdp.call('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor: 1 });
      for (const theme of ['light', 'dark']) {
        await cdp.navigate(`${baseUrl}/${spec.file}`);
        await cdp.evaluate(`localStorage.setItem('lens', ${JSON.stringify(theme)})`);
        await cdp.navigate(`${baseUrl}/${spec.file}`);
        const state = await cdp.evaluate(`(async()=>{const main=document.querySelector('main');const images=[...main.querySelectorAll('img')];await Promise.all(images.map(async(image)=>{image.loading='eager';try{await image.decode()}catch{}}));const triggers=[...document.querySelectorAll('[data-wxo-evidence]')];return {body:document.body.className,theme:document.documentElement.dataset.theme||'light',robots:document.querySelector('meta[name="robots"]')?.content,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,images:images.length,failed:images.filter((image)=>!image.complete||image.naturalWidth<1).map((image)=>image.src),evidence:triggers.length,triggerSources:triggers.map((trigger)=>trigger.querySelector('img')?.getAttribute('src')),protectedRefs:[...main.querySelectorAll('[src],[href]')].map((node)=>node.getAttribute('src')||node.getAttribute('href')).filter((value)=>value?.includes('protected/wxo/')),bridge:document.querySelector('.pilot-side-quest-bridge')?{images:document.querySelectorAll('.pilot-side-quest-bridge img').length,href:document.querySelector('.pilot-side-quest-bridge a')?.getAttribute('href')}:null,status:Boolean(document.querySelector('.site-route-status')),gate:Boolean(document.getElementById('vtd-gate')),currentScreens:new Set([...main.querySelectorAll('img[src*="document-processing/current/"]')].map((image)=>image.getAttribute('src'))).size,gallery:document.querySelector('[data-wxo-gallery]')?.tagName}})()`);
        assert(state.body.includes(spec.body) && state.theme === theme && state.robots === spec.robots && state.overflow === 0 && state.images === spec.images && !state.failed.length && state.evidence === spec.evidence && state.gallery === 'DIALOG' && !state.gate, `${spec.file}: public/protected presentation state failed ${JSON.stringify(state)}`);
        if (spec.name === 'wxo') {
          assert(!state.status && state.protectedRefs.length === 0 && state.triggerSources.every((source) => source?.startsWith('images/wxo-canvas/public/')) && state.bridge?.images === 0 && state.bridge?.href === 'document-processing.html?lock=1', `wxo-canvas.html: public asset boundary or textual protected handoff failed ${JSON.stringify(state)}`);
        } else {
          assert(state.status && state.currentScreens === 8 && state.triggerSources.every((source) => source?.startsWith('protected/wxo/assets/document-processing/current/')), `document-processing.html: protected evidence state failed ${JSON.stringify(state)}`);
        }
        states += 1;
      }
    }
  }

  // Exercise the public runtime through its visible theme control, not only storage setup.
  await cdp.navigate(`${baseUrl}/wxo-canvas.html`);
  await cdp.evaluate(`document.querySelector('.lens-switcher [data-lens="dark"]').focus()`);
  await cdp.key('Enter', 'Enter', 13);
  const darkTheme = await cdp.evaluate(`(async()=>{const images=[...document.querySelectorAll('[data-wxo-theme-image]')];await Promise.all(images.map(async(image)=>{try{await image.decode()}catch{}}));return {theme:document.documentElement.dataset.theme,allDark:images.length>0&&images.every((image)=>image.getAttribute('src')===image.dataset.themeDarkSrc),overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth}})()`);
  assert(darkTheme.theme === 'dark' && darkTheme.allDark && darkTheme.overflow === 0, `Public wxO visible theme toggle failed ${JSON.stringify(darkTheme)}`);
  await cdp.evaluate(`document.querySelector('.lens-switcher [data-lens="light"]').focus()`);
  await cdp.key('Enter', 'Enter', 13);
  const lightTheme = await cdp.evaluate(`({theme:document.documentElement.dataset.theme || 'light',focused:document.activeElement?.outerHTML, mismatches:[...document.querySelectorAll('[data-wxo-theme-image]')].filter((image)=>image.getAttribute('src')!==image.dataset.themeLightSrc).map((image)=>({id:image.dataset.wxoThemeImage,src:image.getAttribute('src'),expected:image.dataset.themeLightSrc}))})`);
  assert(lightTheme.theme === 'light' && lightTheme.mismatches.length === 0, `Public wxO visible theme toggle did not restore Light sources: ${JSON.stringify(lightTheme)}`);

  // Keyboard gallery behavior is shared by the public wxO narrative and protected Doc study.
  let galleries = 0;
  for (const spec of [
    { file: 'wxo-canvas.html', count: '01 / 13', next: '02 / 13', title: 'Historical Canvas', nextTitle: 'Node key states' },
    { file: 'document-processing.html', count: '01 / 04', next: '02 / 04', title: 'Classify', nextTitle: 'Extract' },
  ]) {
    await cdp.navigate(`${baseUrl}/${spec.file}`);
    await cdp.evaluate(`document.querySelector('[data-wxo-evidence]').focus()`);
    await cdp.key('Enter', 'Enter', 13);
    const opened = await cdp.evaluate(`(()=>{const dialog=document.querySelector('[data-wxo-gallery]');return {open:dialog?.open,focus:document.activeElement===dialog?.querySelector('.pilot-gallery-close'),count:dialog?.querySelector('[data-wxo-gallery-count]')?.textContent.trim(),title:dialog?.querySelector('[data-wxo-gallery-title]')?.textContent.trim(),semantics:dialog?.tagName==='DIALOG'&&dialog.getAttribute('aria-labelledby')===dialog.querySelector('[data-wxo-gallery-title]')?.id}})()`);
    assert(opened.open && opened.focus && opened.count === spec.count && opened.title === spec.title && opened.semantics, `${spec.file}: keyboard gallery open failed ${JSON.stringify(opened)}`);
    await cdp.key('Tab', 'Tab', 9); await cdp.key('Tab', 'Tab', 9); await cdp.key('Tab', 'Tab', 9);
    assert(await cdp.evaluate(`document.activeElement === document.querySelector('.pilot-gallery-close')`), `${spec.file}: gallery focus trap failed.`);
    await cdp.key('ArrowRight', 'ArrowRight', 39);
    const next = await cdp.evaluate(`({count:document.querySelector('[data-wxo-gallery-count]').textContent.trim(),title:document.querySelector('[data-wxo-gallery-title]').textContent.trim()})`);
    assert(next.count === spec.next && next.title === spec.nextTitle, `${spec.file}: keyboard gallery next failed ${JSON.stringify(next)}`);
    await cdp.screenshot(`${spec.file.replace('.html', '')}-gallery-keyboard.png`);
    await cdp.key('Escape', 'Escape', 27);
    assert(await cdp.evaluate(`!document.querySelector('[data-wxo-gallery]').open && document.activeElement === document.querySelector('[data-wxo-evidence]')`), `${spec.file}: gallery Escape/focus restoration failed.`);
    galleries += 1;
  }
  await cdp.navigate(`${baseUrl}/wxo-canvas.html`);
  await cdp.evaluate(`document.querySelector('[data-wxo-evidence]').click()`);
  await delay(80);
  const gallery = await cdp.evaluate(`(()=>{const dialog=document.querySelector('[data-wxo-gallery]');return {open:dialog?.open,focus:document.activeElement===dialog?.querySelector('.pilot-gallery-close'),count:dialog?.querySelector('[data-wxo-gallery-count]')?.textContent.trim()}})()`);
  assert(gallery.open && gallery.focus && gallery.count === '01 / 13', `Public wxO gallery interaction failed ${JSON.stringify(gallery)}`);
  await cdp.key('Escape', 'Escape', 27);
  assert(await cdp.evaluate(`!document.querySelector('[data-wxo-gallery]').open`), 'Public wxO gallery must close with Escape.');
  assert(gateChecks === 2 && states === 8 && galleries === 2, `Unexpected browser check totals gates=${gateChecks} states=${states} galleries=${galleries}`);
  assert(cdp.exceptions.length === 0 && cdp.consoleErrors.length === 0 && cdp.httpErrors.length === 0, `Browser errors: ${JSON.stringify({ exceptions: cdp.exceptions, console: cdp.consoleErrors, http: cdp.httpErrors })}`);
  console.log(`WXO PUBLIC + DOCUMENT PROCESSING BROWSER CHECK: PASS gates=${gateChecks} states=${states} galleries=${galleries} publicEvidence=13 docExports=8 evidence=${evidenceDir}`);
} finally {
  try { cdp?.socket?.close(); } catch {}
  child.kill('SIGTERM'); server?.kill('SIGTERM');
  await Promise.race([new Promise((resolve) => child.once('exit', resolve)), delay(1500)]);
  if (child.exitCode === null) child.kill('SIGKILL');
  if (server) { await Promise.race([new Promise((resolve) => server.once('exit', resolve)), delay(1500)]); if (server.exitCode === null) server.kill('SIGKILL'); }
  try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); } catch {}
}
