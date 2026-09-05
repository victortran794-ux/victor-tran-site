#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';

const root = path.resolve(process.argv[2] || process.cwd());
const baseUrl = process.env.SITE_URL || 'http://127.0.0.1:8896';
const evidenceDir = process.env.SHELL_EVIDENCE_DIR || path.join(root, '.hermes', 'evidence', 'shared-shell');
const projectManifest = JSON.parse(fs.readFileSync(path.join(root, 'data', 'projects.json'), 'utf8'));
const workLinks = projectManifest.projects
  .filter((project) => project.nav)
  .map((project) => project.entryUrl || project.url);
const firstWorkLink = workLinks[0];
const lastWorkLink = workLinks.at(-1);
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

async function waitForViewport(cdp, width, height) {
  let actual = null;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    actual = await cdp.evaluate(`({inner:[innerWidth,innerHeight],client:[document.documentElement.clientWidth,document.documentElement.clientHeight],visual:[visualViewport?.width,visualViewport?.height]})`);
    if ((actual.inner[0] === width && actual.inner[1] === height) || (actual.client[0] === width && actual.client[1] === height)) return;
    await delay(50);
  }
  throw new Error(`viewport did not settle at ${width}x${height}: ${JSON.stringify(actual)}`);
}

const geometryExpression = `(() => {
  const selectors = [
    '.nav-logo', '.nav-dropdown-toggle', '.nav-links > li > a',
    '.nav-dropdown-menu a', '.nav-mobile-lens-btn', '.footer-cta',
    '.footer-social a', '.footer-email', '.project-nav-item'
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
    logoText: document.querySelector('.nav-logo')?.textContent.replace(/\\s+/g, ' ').trim(),
    logoParts: [...document.querySelectorAll('.nav-logo-victor, .nav-logo-tran')].map((part) => ({
      text: part.textContent.trim(),
      fontStyle: getComputedStyle(part).fontStyle,
    })),
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
    width: 390, height: 844, deviceScaleFactor: 1, mobile: false,
  });
  await cdp.call('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  await cdp.call('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  await cdp.navigate(`${baseUrl}/index.html`);
  await cdp.call('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, screenWidth: 390, screenHeight: 844, positionX: 0, positionY: 0, deviceScaleFactor: 1, scale: 1, mobile: false, dontSetVisibleSize: false,
  });
  await waitForViewport(cdp, 390, 844);
  await cdp.evaluate(`document.querySelector('.nav-dropdown-toggle').click()`);
  await delay(100);

  const mobile = await cdp.evaluate(geometryExpression);
  assert(mobile.width === 390 && mobile.height === 844, `mobile viewport drifted: ${mobile.width}x${mobile.height}`);
  assert(mobile.overflow === 0, `index.html has ${mobile.overflow}px root overflow at 390px`);
  assert(mobile.logoText === 'Victor Tran'
    && mobile.logoParts.map((part) => part.text).join('|') === 'Victor|Tran'
    && mobile.logoParts.every((part) => part.fontStyle === 'italic'),
  `homepage shell wordmark drifted: ${JSON.stringify(mobile.logoParts)}`);
  const undersized = mobile.controls.filter((control) => control.width < 44 || control.height < 44);
  assert(!undersized.length, `undersized 390px shell controls: ${JSON.stringify(undersized)}`);
  assert(mobile.controls.some((control) => control.label === 'Light mode'), 'mobile Light control is unavailable');
  assert(mobile.controls.some((control) => control.label === 'Dark mode'), 'mobile Dark control is unavailable');
  const mobileContact = await cdp.evaluate(`(() => {
    const footer = document.querySelector('footer');
    const email = footer.querySelector('.footer-email');
    return {
      text: footer.textContent.replace(/\\s+/g, ' ').trim(),
      emailHref: email?.getAttribute('href'),
      emailLabel: email?.getAttribute('aria-label'),
      hasMailIcon: Boolean(email?.querySelector('svg[aria-hidden="true"]')),
      hasCopyBehavior: Boolean(footer.querySelector('[data-copy-email], [data-copy-email-status]')),
    };
  })()`);
  assert(!mobileContact.text.includes('See you soon.') && !mobileContact.text.includes('Copy email'), 'mobile footer retained retired invitation or copy-email text');
  assert(mobileContact.emailHref === 'mailto:victortran794@gmail.com', 'mobile footer email action is not direct mailto');
  assert(mobileContact.emailLabel === 'Email Victor Tran at victortran794@gmail.com' && mobileContact.hasMailIcon, 'mobile footer email action lost its accessible icon treatment');
  assert(!mobileContact.hasCopyBehavior, 'mobile footer retained dead copy-email behavior');

  await cdp.evaluate(`document.querySelector('.nav-dropdown-toggle').focus()`);
  await cdp.key('ArrowDown', 'ArrowDown', 40);
  const arrowDownHref = await cdp.evaluate(`document.activeElement?.getAttribute('href')`);
  assert(arrowDownHref === firstWorkLink, `ArrowDown did not focus the first Work link; focused=${arrowDownHref}`);
  await cdp.key('End', 'End', 35);
  assert(await cdp.evaluate(`document.activeElement?.getAttribute('href')`) === lastWorkLink, 'End did not focus the last Work link');
  await cdp.key('Home', 'Home', 36);
  assert(await cdp.evaluate(`document.activeElement?.getAttribute('href')`) === firstWorkLink, 'Home did not focus the first Work link');
  await cdp.key('Escape', 'Escape', 27);
  const escapeState = await cdp.evaluate(`({focused: document.activeElement?.classList.contains('nav-dropdown-toggle'), expanded: document.querySelector('.nav-dropdown-toggle').getAttribute('aria-expanded')})`);
  assert(escapeState.focused && escapeState.expanded === 'false', 'Escape did not close Work and restore trigger focus');
  await cdp.key('ArrowUp', 'ArrowUp', 38);
  assert(await cdp.evaluate(`document.activeElement?.getAttribute('href')`) === lastWorkLink, 'ArrowUp did not focus the last Work link');

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
  assert(!protectedState.cue, 'public Document Processing must not retain the private route cue');
  assert(protectedState.robots === 'index,follow', 'public Document Processing must be indexable');
  assert(!protectedState.gate, 'protected route loaded the retired client-side password-gate script');
  assert(protectedState.overflow === 0, `protected route has ${protectedState.overflow}px root overflow at 390px`);
  assert(protectedState.main === '-1', 'protected route main target lost tabindex=-1');
  await cdp.screenshot('document-processing-390-public.png');

  await cdp.call('Emulation.setDeviceMetricsOverride', {
    width: 1280, height: 720, deviceScaleFactor: 1, mobile: false,
  });
  await cdp.call('Emulation.setTouchEmulationEnabled', { enabled: false });
  await cdp.navigate(`${baseUrl}/abilityexperience.html`);
  const desktop = await cdp.evaluate(`({
    width: innerWidth,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    current: document.querySelector('nav[aria-label="Primary"] [aria-current="page"]')?.getAttribute('href'),
    desktopThemeVisible: getComputedStyle(document.querySelector('.nav-inner > .lens-switcher')).display !== 'none',
    desktopThemeLabels: document.querySelectorAll('.nav-inner > .lens-switcher .lens-switcher-label').length,
    desktopThemeControl: (() => {
      const control = document.querySelector('.nav-inner > .lens-switcher');
      const rail = control.querySelector('.lens-switcher-rail');
      return {
        iconStyle: control.dataset.iconTreatment,
        width: control.getBoundingClientRect().width,
        height: control.getBoundingClientRect().height,
        railWidth: rail?.getBoundingClientRect().width,
        railHeight: rail?.getBoundingClientRect().height,
        filledIcons: control.querySelectorAll('.lens-switcher-filled-icon').length,
      };
    })(),
    desktopThemeButtons: [...document.querySelectorAll('.nav-inner > .lens-switcher .lens-switcher-btn')].map((button) => ({
      width: button.getBoundingClientRect().width,
      height: button.getBoundingClientRect().height,
      label: button.getAttribute('aria-label'),
      tooltip: button.querySelector('.control-tooltip')?.textContent.trim(),
      tooltipHidden: button.querySelector('.control-tooltip')?.getAttribute('aria-hidden'),
    })),
    previousLabel: document.querySelector('.project-nav-item--prev')?.getAttribute('aria-label'),
    nextLabel: document.querySelector('.project-nav-item--next')?.getAttribute('aria-label')
  })`);
  assert(desktop.width === 1280 && desktop.overflow === 0, 'public case study failed desktop overflow check');
  assert(desktop.current === 'abilityexperience.html', 'public case study current-route state is wrong');
  assert(desktop.desktopThemeVisible, 'desktop Light/Dark controls are hidden');
  assert(desktop.desktopThemeLabels === 0, 'desktop Light/Dark controls retained visible text labels');
  assert(desktop.desktopThemeControl.iconStyle === 'filled' && desktop.desktopThemeControl.width === 96 && desktop.desktopThemeControl.height === 44, `desktop refined control geometry drifted: ${JSON.stringify(desktop.desktopThemeControl)}`);
  assert(desktop.desktopThemeControl.railWidth === 96 && desktop.desktopThemeControl.railHeight === 30 && desktop.desktopThemeControl.filledIcons === 2, `desktop refined visual rail or icons drifted: ${JSON.stringify(desktop.desktopThemeControl)}`);
  assert(desktop.desktopThemeButtons.length === 2 && desktop.desktopThemeButtons.every((button) => button.width === 48 && button.height === 44), 'desktop Light/Dark controls lost approved 48x44 targets');
  assert(desktop.desktopThemeButtons.every((button) => button.tooltip === button.label && button.tooltipHidden === 'true'), 'desktop viewing tooltips duplicate or drift from accessible labels');
  assert(desktop.previousLabel?.startsWith('Previous project:') && desktop.nextLabel?.startsWith('Next project:'), 'project navigation accessible labels are missing');
  await cdp.evaluate(`document.querySelector('.skip-link').focus()`);
  let focusedDesktopLens = false;
  for (let step = 0; step < 10; step += 1) {
    if (await cdp.evaluate(`document.activeElement?.matches('.nav-inner > .lens-switcher [data-lens="dark"]')`)) {
      focusedDesktopLens = true;
      break;
    }
    await cdp.key('Tab', 'Tab', 9);
  }
  assert(focusedDesktopLens, 'keyboard traversal did not reach the desktop Dark mode control');
  await delay(250);
  const desktopTooltip = await cdp.evaluate(`(() => {
    const tooltip = document.querySelector('.nav-inner > .lens-switcher [data-lens="dark"] .control-tooltip');
    const rect = tooltip.getBoundingClientRect();
    const style = getComputedStyle(tooltip);
    return { opacity: style.opacity, visibility: style.visibility, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
  })()`);
  assert(desktopTooltip.opacity === '1' && desktopTooltip.visibility === 'visible', 'desktop viewing tooltip is unavailable on keyboard focus');
  assert(desktopTooltip.left >= 0 && desktopTooltip.right <= desktop.width && desktopTooltip.top >= 0 && desktopTooltip.bottom <= 720, 'desktop viewing tooltip is clipped outside the viewport');
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
