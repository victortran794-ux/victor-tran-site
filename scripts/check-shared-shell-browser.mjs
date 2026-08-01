#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';

const root = path.resolve(process.argv[2] || process.cwd());
const baseUrl = process.env.SITE_URL || 'http://127.0.0.1:8896';
const evidenceDir = process.env.SHELL_EVIDENCE_DIR || path.join(root, '.hermes', 'evidence', 'shared-shell');
const chromeCandidates = [
  process.env.CHROME_BIN,
  '/home/victortran794/.agent-browser/browsers/chrome-149.0.7827.55/chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const chrome = chromeCandidates.find((candidate) => fs.existsSync(candidate));
if (!chrome) throw new Error('Chrome binary not found; set CHROME_BIN');

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'shared-shell-browser-'));
const port = 9300 + (process.pid % 500);
let chromeLog = '';
const child = spawn(chrome, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--remote-allow-origins=*',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  '--window-size=1280,720',
  'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });
child.stderr.on('data', (chunk) => { chromeLog += chunk.toString(); });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}
async function waitForTarget() {
  let lastError;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const targets = await fetchJson(`http://127.0.0.1:${port}/json/list`);
      const page = targets.find((target) => target.type === 'page');
      if (page?.webSocketDebuggerUrl) return page;
    } catch (error) {
      lastError = error;
    }
    if (child.exitCode !== null) throw new Error(`Chrome exited ${child.exitCode}: ${chromeLog}`);
    await delay(100);
  }
  throw lastError || new Error('Chrome DevTools target did not become ready');
}

class Cdp {
  constructor(url) {
    this.url = url;
    this.nextId = 1;
    this.pending = new Map();
    this.waiters = new Map();
    this.exceptions = [];
  }

  async open() {
    this.socket = new WebSocket(this.url);
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(`${pending.method}: ${message.error.message}`));
        else pending.resolve(message.result);
        return;
      }
      if (message.method === 'Runtime.exceptionThrown') this.exceptions.push(message.params.exceptionDetails);
      const waiters = this.waiters.get(message.method) || [];
      this.waiters.delete(message.method);
      waiters.forEach((resolve) => resolve(message.params));
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
      }, 10000);
    });
  }

  event(method, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const waiters = this.waiters.get(method) || [];
      waiters.push(resolve);
      this.waiters.set(method, waiters);
      setTimeout(() => reject(new Error(`${method} event timed out`)), timeout);
    });
  }

  async evaluate(expression) {
    const result = await this.call('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed');
    return result.result.value;
  }

  async navigate(url) {
    const loaded = this.event('Page.loadEventFired');
    await this.call('Page.navigate', { url });
    await loaded;
    await delay(150);
  }

  async key(key, code, virtualKeyCode) {
    const params = { key, code, windowsVirtualKeyCode: virtualKeyCode, nativeVirtualKeyCode: virtualKeyCode };
    await this.call('Input.dispatchKeyEvent', { type: 'keyDown', ...params });
    await this.call('Input.dispatchKeyEvent', { type: 'keyUp', ...params });
    await delay(40);
  }

  async screenshot(fileName) {
    const result = await this.call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(evidenceDir, fileName), Buffer.from(result.data, 'base64'));
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const geometryExpression = `(() => {
  const selectors = [
    '.nav-logo', '.nav-dropdown-toggle', '.nav-links > li > a',
    '.nav-dropdown-menu a', '.nav-mobile-lens-btn', '.footer-cta',
    '.footer-social a', '.footer-copy-email', '.project-nav-item'
  ];
  const controls = [...document.querySelectorAll(selectors.join(','))]
    .filter((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    })
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return { label: element.getAttribute('aria-label') || element.textContent.trim().replace(/\\s+/g, ' ').slice(0, 60), width: rect.width, height: rect.height };
    });
  return {
    width: innerWidth,
    height: innerHeight,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    controls,
    logoDecoded: document.querySelector('.nav-logo img')?.complete && document.querySelector('.nav-logo img')?.naturalWidth > 0,
  };
})()`;

let cdp;
try {
  fs.mkdirSync(evidenceDir, { recursive: true });
  const target = await waitForTarget();
  cdp = new Cdp(target.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.call('Page.enable');
  await cdp.call('Runtime.enable');
  await cdp.call('Network.enable');

  await cdp.call('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 1, mobile: true,
  });
  await cdp.call('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  await cdp.navigate(`${baseUrl}/index.html`);
  await cdp.evaluate(`document.querySelector('.nav-dropdown-toggle').click()`);
  await delay(100);

  const mobile = await cdp.evaluate(geometryExpression);
  assert(mobile.width === 390 && mobile.height === 844, `mobile viewport drifted: ${mobile.width}x${mobile.height}`);
  assert(mobile.overflow === 0, `index.html has ${mobile.overflow}px root overflow at 390px`);
  assert(mobile.logoDecoded, 'homepage shell logo did not decode');
  const undersized = mobile.controls.filter((control) => control.width < 44 || control.height < 44);
  assert(!undersized.length, `undersized 390px shell controls: ${JSON.stringify(undersized)}`);
  assert(mobile.controls.some((control) => control.label === 'Light mode'), 'mobile Light control is unavailable');
  assert(mobile.controls.some((control) => control.label === 'Dark mode'), 'mobile Dark control is unavailable');

  await cdp.evaluate(`document.querySelector('.nav-dropdown-toggle').focus()`);
  await cdp.key('ArrowDown', 'ArrowDown', 40);
  const arrowDownHref = await cdp.evaluate(`document.activeElement?.getAttribute('href')`);
  assert(arrowDownHref === 'document-processing.html', `ArrowDown did not focus the first Work link; focused=${arrowDownHref}`);
  await cdp.key('End', 'End', 35);
  assert(await cdp.evaluate(`document.activeElement?.getAttribute('href')`) === 'graphicgallery.html', 'End did not focus the last Work link');
  await cdp.key('Home', 'Home', 36);
  assert(await cdp.evaluate(`document.activeElement?.getAttribute('href')`) === 'document-processing.html', 'Home did not focus the first Work link');
  await cdp.key('Escape', 'Escape', 27);
  const escapeState = await cdp.evaluate(`({focused: document.activeElement?.classList.contains('nav-dropdown-toggle'), expanded: document.querySelector('.nav-dropdown-toggle').getAttribute('aria-expanded')})`);
  assert(escapeState.focused && escapeState.expanded === 'false', 'Escape did not close Work and restore trigger focus');
  await cdp.key('ArrowUp', 'ArrowUp', 38);
  assert(await cdp.evaluate(`document.activeElement?.getAttribute('href')`) === 'graphicgallery.html', 'ArrowUp did not focus the last Work link');

  await cdp.evaluate(`document.querySelector('[data-mobile-lens="dark"]').click()`);
  const dark = await cdp.evaluate(`({theme: document.documentElement.dataset.theme, stored: localStorage.getItem('lens'), pressed: [...document.querySelectorAll('[data-lens="dark"]')].every((button) => button.getAttribute('aria-pressed') === 'true')})`);
  assert(dark.theme === 'dark' && dark.stored === 'dark' && dark.pressed, 'mobile Dark mode did not synchronize or persist');
  await cdp.screenshot('index-390-dark-menu.png');

  const reloaded = cdp.event('Page.loadEventFired');
  await cdp.call('Page.reload');
  await reloaded;
  assert(await cdp.evaluate(`document.documentElement.dataset.theme`) === 'dark', 'Dark mode did not survive reload');

  await cdp.evaluate(`document.querySelector('.skip-link').focus(); document.querySelector('.skip-link').click()`);
  await delay(50);
  const skip = await cdp.evaluate(`({hash: location.hash, target: document.activeElement?.id})`);
  assert(skip.hash === '#main-content' && skip.target === 'main-content', 'skip link did not move focus to main content');

  await cdp.navigate(`${baseUrl}/document-processing.html`);
  const protectedState = await cdp.evaluate(`({
    cue: document.querySelector('.site-route-status')?.textContent.trim().replace(/\\s+/g, ' '),
    robots: document.querySelector('meta[name="robots"]')?.content,
    gate: Boolean(document.querySelector('script[src="js/password-gate.js"]')),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    main: document.querySelector('main#main-content')?.getAttribute('tabindex')
  })`);
  assert(protectedState.cue === 'Private case studyAccess required' || protectedState.cue === 'Private case study Access required', 'protected route cue drifted');
  assert(protectedState.robots === 'noindex,nofollow', 'protected route lost noindex,nofollow');
  assert(protectedState.gate, 'protected route lost password-gate script');
  assert(protectedState.overflow === 0, `protected route has ${protectedState.overflow}px root overflow at 390px`);
  assert(protectedState.main === '-1', 'protected route main target lost tabindex=-1');
  await cdp.screenshot('document-processing-390-locked.png');

  await cdp.call('Emulation.setDeviceMetricsOverride', {
    width: 1280, height: 720, deviceScaleFactor: 1, mobile: false,
  });
  await cdp.navigate(`${baseUrl}/abilityexperience.html`);
  const desktop = await cdp.evaluate(`({
    width: innerWidth,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    current: document.querySelector('nav[aria-label="Primary"] [aria-current="page"]')?.getAttribute('href'),
    desktopThemeVisible: getComputedStyle(document.querySelector('.nav-inner > .lens-switcher')).display !== 'none',
    previousLabel: document.querySelector('.project-nav-item--prev')?.getAttribute('aria-label'),
    nextLabel: document.querySelector('.project-nav-item--next')?.getAttribute('aria-label')
  })`);
  assert(desktop.width === 1280 && desktop.overflow === 0, 'public case study failed desktop overflow check');
  assert(desktop.current === 'abilityexperience.html', 'public case study current-route state is wrong');
  assert(desktop.desktopThemeVisible, 'desktop Light/Dark controls are hidden');
  assert(desktop.previousLabel?.startsWith('Previous project:') && desktop.nextLabel?.startsWith('Next project:'), 'project navigation accessible labels are missing');
  await cdp.screenshot('abilityexperience-1280-dark.png');

  assert(cdp.exceptions.length === 0, `uncaught browser exceptions: ${cdp.exceptions.map((entry) => entry.text).join('; ')}`);
  console.log(`SHARED SHELL BROWSER CHECK: PASS mobile_controls=${mobile.controls.length} evidence=${evidenceDir}`);
} finally {
  try { cdp?.socket?.close(); } catch {}
  child.kill('SIGTERM');
  await Promise.race([new Promise((resolve) => child.once('exit', resolve)), delay(1500)]);
  if (child.exitCode === null) {
    child.kill('SIGKILL');
    await Promise.race([new Promise((resolve) => child.once('exit', resolve)), delay(1000)]);
  }
  try {
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  } catch {
    // Chrome crash-report helpers may briefly retain profile files after the test has passed.
  }
}
