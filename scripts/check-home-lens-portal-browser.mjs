#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const root = process.cwd();
const requestedUrl = process.env.SITE_URL;
const sitePort = 8897;
const baseUrl = requestedUrl || `http://127.0.0.1:${sitePort}`;
const evidenceDir = process.env.HOME_LENS_EVIDENCE_DIR || path.join(root, '.hermes', 'evidence', 'home-lens-portal');
const chrome = [
  process.env.CHROME_BIN,
  '/home/victortran794/.agent-browser/browsers/chrome-149.0.7827.55/chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean).find(candidate => fs.existsSync(candidate));
if (!chrome) throw new Error('Chrome binary not found; set CHROME_BIN');

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'home-lens-portal-'));
const cdpPort = 9950 + (process.pid % 40);
let chromeLog = '';
let serverLog = '';
const server = requestedUrl ? null : spawn('python3', ['-m', 'http.server', String(sitePort), '--bind', '127.0.0.1'], {
  cwd: root,
  stdio: ['ignore', 'ignore', 'pipe'],
});
server?.stderr.on('data', chunk => { serverLog += chunk.toString(); });
const browser = spawn(chrome, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  '--remote-allow-origins=*', `--remote-debugging-port=${cdpPort}`,
  `--user-data-dir=${profile}`, '--window-size=1280,800', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });
browser.stderr.on('data', chunk => { chromeLog += chunk.toString(); });

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
async function waitFor(url, label) {
  let lastError;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (error) { lastError = error; }
    await delay(100);
  }
  throw lastError || new Error(`${label} did not become ready`);
}

class Cdp {
  constructor(url) {
    this.url = url;
    this.nextId = 1;
    this.pending = new Map();
    this.waiters = new Map();
    this.consoleErrors = [];
    this.exceptions = [];
    this.networkErrors = [];
  }
  async open() {
    this.socket = new WebSocket(this.url);
    this.socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(`${pending.method}: ${message.error.message}`));
        else pending.resolve(message.result);
        return;
      }
      if (message.method === 'Runtime.exceptionThrown') this.exceptions.push(message.params.exceptionDetails.text);
      if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
        this.consoleErrors.push(message.params.args.map(arg => arg.value || arg.description).join(' '));
      }
      if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) {
        const url = message.params.response.url;
        const localInsight = baseUrl.startsWith('http://127.0.0.1:') &&
          (url.includes('/_vercel/speed-insights/') || url.includes('/_vercel/insights/'));
        if (!localInsight && !url.endsWith('/favicon.ico')) this.networkErrors.push(`${message.params.response.status} ${url}`);
      }
      const waiters = this.waiters.get(message.method) || [];
      this.waiters.delete(message.method);
      waiters.forEach(resolve => resolve(message.params));
    });
    await new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true });
      this.socket.addEventListener('error', reject, { once: true });
    });
  }
  call(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, method });
      this.socket.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (!this.pending.has(id)) return;
        this.pending.delete(id);
        reject(new Error(`${method} timed out`));
      }, 15000);
    });
  }
  event(method, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const waiters = this.waiters.get(method) || [];
      waiters.push(resolve);
      this.waiters.set(method, waiters);
      setTimeout(() => reject(new Error(`${method} event timed out`)), timeout);
    });
  }
  async navigate(url) {
    const loaded = this.event('Page.loadEventFired');
    await this.call('Page.navigate', { url });
    await loaded;
    await delay(220);
  }
  async evaluate(expression) {
    const result = await this.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  }
  async key(key, code, virtualKeyCode, modifiers = 0) {
    const params = { key, code, windowsVirtualKeyCode: virtualKeyCode, nativeVirtualKeyCode: virtualKeyCode, modifiers };
    if (key === 'Enter') Object.assign(params, { text: '\r', unmodifiedText: '\r' });
    await this.call('Input.dispatchKeyEvent', { type: 'keyDown', ...params });
    await this.call('Input.dispatchKeyEvent', { type: 'keyUp', ...params });
    await delay(55);
  }
  async screenshot(name) {
    const shot = await this.call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(evidenceDir, name), Buffer.from(shot.data, 'base64'));
  }
}

let cdp;
try {
  fs.mkdirSync(evidenceDir, { recursive: true });
  await waitFor(`${baseUrl}/index.html`, 'Home server');
  let page;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${cdpPort}/json/list`);
      const targets = response.ok ? await response.json() : [];
      page = targets.find(target => target.type === 'page');
      if (page?.webSocketDebuggerUrl) break;
    } catch {}
    if (browser.exitCode !== null) throw new Error(`Chrome exited ${browser.exitCode}: ${chromeLog}`);
    await delay(100);
  }
  assert(page?.webSocketDebuggerUrl, 'Chrome DevTools target did not become ready');
  cdp = new Cdp(page.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.call('Page.enable');
  await cdp.call('Runtime.enable');
  await cdp.call('Network.enable');

  const viewports = [
    { label: 'desktop', width: 1280, height: 800, mobile: false },
    { label: 'mobile', width: 390, height: 844, mobile: true },
  ];
  const states = [];

  for (const viewport of viewports) {
    await cdp.call('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.mobile,
    });
    await cdp.call('Emulation.setTouchEmulationEnabled', { enabled: viewport.mobile, maxTouchPoints: 1 });
    await cdp.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await cdp.navigate(`${baseUrl}/index.html`);
    await cdp.evaluate(`localStorage.removeItem('lens')`);
    await cdp.navigate(`${baseUrl}/index.html`);

    const base = await cdp.evaluate(`(() => {
      const portal = document.querySelector('.hero-lens-portal');
      const rect = portal.getBoundingClientRect();
      const portrait = document.querySelector('.hero-portrait-cutout');
      const switcher = document.querySelector('.lens-switcher');
      return {
        viewport: [innerWidth, innerHeight],
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        target: [rect.width, rect.height],
        targetVisible: rect.right > 0 && rect.left < innerWidth && rect.bottom > 0 && rect.top < innerHeight,
        portrait: [portrait.complete, portrait.naturalWidth, portrait.naturalHeight],
        switcherButtons: switcher.querySelectorAll('.lens-switcher-btn').length,
        dnaTabs: switcher.querySelectorAll('[data-lens="dna"], .dna-trigger').length,
        portalCount: document.querySelectorAll('.hero-lens-portal.dna-trigger').length,
        controls: portal.getAttribute('aria-controls'),
        hasPopup: portal.getAttribute('aria-haspopup'),
        describedBy: portal.getAttribute('aria-describedby'),
        tooltipId: document.querySelector('.hero-lens-tooltip')?.id,
        overlayHidden: document.getElementById('dnaOverlay').getAttribute('aria-hidden'),
      };
    })()`);
    assert(base.viewport[0] === viewport.width && base.viewport[1] === viewport.height, `${viewport.label}: viewport mismatch ${base.viewport}`);
    assert(base.overflow === 0, `${viewport.label}: horizontal overflow ${base.overflow}`);
    assert(base.target[0] >= 44 && base.target[1] >= 44 && base.targetVisible, `${viewport.label}: invalid lens target ${base.target}`);
    assert(base.portrait[0] && base.portrait[1] > 0 && base.portrait[2] > 0, `${viewport.label}: portrait failed to decode ${base.portrait}`);
    assert(base.switcherButtons === 2 && base.dnaTabs === 0, `${viewport.label}: top switcher still contains DNA ${JSON.stringify(base)}`);
    assert(base.portalCount === 1 && base.controls === 'dnaOverlay' && base.hasPopup === 'dialog' && base.describedBy === base.tooltipId,
      `${viewport.label}: accessible lens portal relationship failed ${JSON.stringify(base)}`);
    assert(base.overlayHidden === 'true', `${viewport.label}: DNA overlay must begin closed`);

    await cdp.evaluate(`document.activeElement?.blur()`);
    let reachedPortal = false;
    for (let index = 0; index < 16; index += 1) {
      await cdp.key('Tab', 'Tab', 9);
      reachedPortal = await cdp.evaluate(`document.activeElement?.classList.contains('hero-lens-portal')`);
      if (reachedPortal) break;
    }
    assert(reachedPortal, `${viewport.label}: keyboard navigation did not reach the lens portal`);
    await delay(240);
    const focusState = await cdp.evaluate(`(() => ({
      tooltipOpacity: parseFloat(getComputedStyle(document.querySelector('.hero-lens-tooltip')).opacity),
      outlineStyle: getComputedStyle(document.querySelector('.hero-lens-portal')).outlineStyle,
      outlineWidth: getComputedStyle(document.querySelector('.hero-lens-portal')).outlineWidth,
    }))()`);
    assert(focusState.tooltipOpacity > 0.9 && focusState.outlineStyle !== 'none' && parseFloat(focusState.outlineWidth) >= 2,
      `${viewport.label}: focus/tooltip state failed ${JSON.stringify(focusState)}`);
    await cdp.screenshot(`${viewport.label}-light-focus.png`);

    await cdp.key('Enter', 'Enter', 13);
    await delay(120);
    const opened = await cdp.evaluate(`({
      open: document.getElementById('dnaOverlay').classList.contains('is-open'),
      ariaHidden: document.getElementById('dnaOverlay').getAttribute('aria-hidden'),
      inert: document.getElementById('dnaOverlay').inert,
      focused: document.activeElement?.className,
    })`);
    assert(opened.open && opened.ariaHidden === 'false' && !opened.inert && opened.focused.includes('dna-close'),
      `${viewport.label}: Enter did not open the existing DNA overlay ${JSON.stringify(opened)}`);
    await delay(520);
    await cdp.screenshot(`${viewport.label}-overlay-open.png`);

    await cdp.key('Escape', 'Escape', 27);
    const closed = await cdp.evaluate(`({
      open: document.getElementById('dnaOverlay').classList.contains('is-open'),
      ariaHidden: document.getElementById('dnaOverlay').getAttribute('aria-hidden'),
      inert: document.getElementById('dnaOverlay').inert,
      portalFocused: document.activeElement?.classList.contains('hero-lens-portal'),
    })`);
    assert(!closed.open && closed.ariaHidden === 'true' && closed.inert && closed.portalFocused,
      `${viewport.label}: Escape/focus return failed ${JSON.stringify(closed)}`);

    if (viewport.mobile) {
      const center = await cdp.evaluate(`(() => {
        const rect = document.querySelector('.hero-lens-portal').getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      })()`);
      await cdp.call('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: center.x, y: center.y, radiusX: 4, radiusY: 4, force: 1, id: 1 }],
      });
      await cdp.call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await delay(120);
      const touchOpened = await cdp.evaluate(`document.getElementById('dnaOverlay').classList.contains('is-open')`);
      assert(touchOpened, `${viewport.label}: touch did not open the Design DNA overlay`);
      await cdp.key('Escape', 'Escape', 27);
    }
    await delay(420);

    const independentControls = await cdp.evaluate(`(() => {
      const dark = document.querySelector('.lens-switcher-btn[data-lens="dark"]');
      const cycle = document.querySelector('.hero-cycle');
      dark.click();
      cycle.click();
      return {
        theme: document.documentElement.getAttribute('data-theme'),
        selectedColor: document.querySelector('.hero').dataset.color,
        status: document.querySelector('[data-hero-status]').textContent,
        darkPressed: dark.getAttribute('aria-pressed'),
      };
    })()`);
    assert(independentControls.theme === 'dark' && independentControls.selectedColor === '1' &&
      independentControls.status.includes('Ambient cycling paused') && independentControls.darkPressed === 'true',
      `${viewport.label}: theme or color control regressed ${JSON.stringify(independentControls)}`);
    await cdp.screenshot(`${viewport.label}-dark.png`);

    await cdp.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    const reduced = await cdp.evaluate(`(() => {
      const pseudo = getComputedStyle(document.querySelector('.hero-lens-portal'), '::before');
      const tooltip = getComputedStyle(document.querySelector('.hero-lens-tooltip'));
      return {
        matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
        pseudoTransition: pseudo.transitionDuration,
        tooltipTransition: tooltip.transitionDuration,
      };
    })()`);
    assert(reduced.matches && parseFloat(reduced.pseudoTransition) <= 0.001 && parseFloat(reduced.tooltipTransition) <= 0.001,
      `${viewport.label}: reduced-motion lens state failed ${JSON.stringify(reduced)}`);
    states.push(`${viewport.width}x${viewport.height}`);
  }

  assert(cdp.consoleErrors.length === 0, `console errors: ${cdp.consoleErrors.join(' | ')}`);
  assert(cdp.exceptions.length === 0, `runtime exceptions: ${cdp.exceptions.join(' | ')}`);
  assert(cdp.networkErrors.length === 0, `network errors: ${cdp.networkErrors.join(' | ')}`);
  console.log(`HOME LENS PORTAL BROWSER CONTRACT: PASS states=${states.length * 3} evidence=${evidenceDir}`);
  console.log(`viewports=${states.join(',')} switcher=light-dark-only portal=keyboard-touch-ready overlay=reused`);
} finally {
  try { cdp?.socket?.close(); } catch {}
  browser.kill('SIGTERM');
  server?.kill('SIGTERM');
  await delay(100);
  fs.rmSync(profile, { recursive: true, force: true });
  if (browser.exitCode && browser.exitCode !== 0 && !browser.killed) console.error(chromeLog);
  if (server?.exitCode && server.exitCode !== 0 && !server.killed) console.error(serverLog);
}
