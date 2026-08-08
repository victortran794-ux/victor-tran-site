#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import {
  findAvailablePort,
  terminateChild,
  waitForServerBound,
} from './about-browser-process.mjs';

const root = process.cwd();
const requestedUrl = process.env.SITE_URL;
const sitePort = requestedUrl ? null : await findAvailablePort();
const cdpPort = await findAvailablePort();
const baseUrl = requestedUrl || `http://127.0.0.1:${sitePort}`;
const evidenceDir = process.env.ABOUT_EVIDENCE_DIR || path.join(root, '.hermes', 'evidence', 'about-voice-calibration');
const chrome = [
  process.env.CHROME_BIN,
  '/home/victortran794/.agent-browser/browsers/chrome-149.0.7827.55/chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean).find(candidate => fs.existsSync(candidate));
if (!chrome) throw new Error('Chrome binary not found; set CHROME_BIN');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'about-voice-calibration-'));
let chromeLog = '';
let serverLog = '';
const server = requestedUrl ? null : spawn('python3', ['-u', '-m', 'http.server', String(sitePort), '--bind', '127.0.0.1'], {
  cwd: root,
  stdio: ['ignore', 'pipe', 'pipe'],
});
server?.stdout.on('data', chunk => { serverLog += chunk.toString(); });
server?.stderr.on('data', chunk => { serverLog += chunk.toString(); });
const serverReady = server
  ? waitForServerBound(server, { expectedPort: sitePort, timeoutMs: 5000 })
  : Promise.resolve();
const browser = spawn(chrome, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  '--remote-allow-origins=*', `--remote-debugging-port=${cdpPort}`,
  `--user-data-dir=${profile}`, '--window-size=1280,800', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });
let browserSpawnError;
browser.on('error', error => {
  browserSpawnError = error;
  chromeLog += `Chrome spawn error: ${error.message}\n`;
});
browser.stderr.on('data', chunk => { chromeLog += chunk.toString(); });

async function waitFor(url, label) {
  let lastError;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (response.ok) return response;
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
    await delay(350);
  }
  async evaluate(expression) {
    const result = await this.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  }
  async screenshot(name) {
    const shot = await this.call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(evidenceDir, name), Buffer.from(shot.data, 'base64'));
  }
}

let cdp;
try {
  fs.mkdirSync(evidenceDir, { recursive: true });
  await serverReady;
  await waitFor(`${baseUrl}/about.html`, 'About server');
  let target;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${cdpPort}/json/list`, { signal: AbortSignal.timeout(1000) });
      const targets = response.ok ? await response.json() : [];
      target = targets.find(item => item.type === 'page');
      if (target?.webSocketDebuggerUrl) break;
    } catch {}
    if (browserSpawnError) throw browserSpawnError;
    if (browser.exitCode !== null) throw new Error(`Chrome exited ${browser.exitCode}: ${chromeLog}`);
    await delay(100);
  }
  assert(target?.webSocketDebuggerUrl, 'Chrome DevTools target did not become ready');
  cdp = new Cdp(target.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.call('Page.enable');
  await cdp.call('Runtime.enable');

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

    for (const theme of ['light', 'dark']) {
      await cdp.navigate(`${baseUrl}/about.html?about-review=1`);
      await cdp.evaluate(`document.querySelector('button[data-lens="${theme}"]')?.click()`);
      await delay(350);

      const state = await cdp.evaluate(`(() => {
        const root = document.documentElement;
        const current = document.querySelector('.about-current');
        const currentTitle = document.querySelector('.about-current-heading h2');
        const skills = document.querySelector('.about-skills');
        const skillsTitle = document.querySelector('.about-skills-section h3');
        const work = document.querySelector('.about-work');
        const primaryTitle = document.querySelector('.about-role-primary h3');
        const secondaryTitle = document.querySelector('.about-role:not(.about-role-primary) h3');
        const tag = document.querySelector('.tag');
        const photo = document.querySelector('.about-photo img');
        const outliers = [...document.querySelectorAll('body *')].filter(element => {
          const style = getComputedStyle(element);
          if (style.position === 'fixed' || style.display === 'none') return false;
          const rect = element.getBoundingClientRect();
          return rect.width > 1 && (rect.left < -1 || rect.right > root.clientWidth + 1);
        }).slice(0, 8).map(element => [element.tagName, element.className, element.getBoundingClientRect().left, element.getBoundingClientRect().right]);
        return {
          viewport: [innerWidth, innerHeight],
          theme: root.dataset.theme || 'light',
          overflow: root.scrollWidth - root.clientWidth,
          outliers,
          h1Count: document.querySelectorAll('main h1').length,
          order: [current, skills, work].map(element => element?.offsetTop ?? -1),
          currentRegion: current?.getAttribute('aria-labelledby'),
          sectionLabelStyles: [currentTitle, skillsTitle].map(title => {
            const style = getComputedStyle(title);
            return [style.fontFamily, style.fontSize, style.fontWeight, style.letterSpacing, style.textTransform];
          }),
          roleCount: current?.querySelectorAll('.about-role').length,
          roleSizes: [parseFloat(getComputedStyle(primaryTitle).fontSize), parseFloat(getComputedStyle(secondaryTitle).fontSize)],
          roleRows: [primaryTitle, secondaryTitle].map(title => {
            const role = title.closest('.about-role');
            const roleStyle = getComputedStyle(role);
            const markerStyle = getComputedStyle(role, '::before');
            return {
              backgroundColor: roleStyle.backgroundColor,
              borderBottomWidth: roleStyle.borderBottomWidth,
              markerContent: markerStyle.content,
              markerWidth: parseFloat(markerStyle.width),
            };
          }),
          tagRadius: getComputedStyle(tag).borderRadius,
          tagHeight: tag.getBoundingClientRect().height,
          image: [photo.complete, photo.naturalWidth, photo.naturalHeight],
        };
      })()`);
      assert(state.viewport[0] === viewport.width && state.viewport[1] === viewport.height,
        `${viewport.label}/${theme}: viewport mismatch ${state.viewport}`);
      assert(state.theme === theme, `${viewport.label}/${theme}: theme did not settle (${state.theme})`);
      assert(state.overflow === 0 && state.outliers.length === 0,
        `${viewport.label}/${theme}: horizontal geometry failed ${JSON.stringify(state)}`);
      assert(state.h1Count === 1 && state.currentRegion === 'about-current-title' && state.roleCount === 2,
        `${viewport.label}/${theme}: About structure failed ${JSON.stringify(state)}`);
      assert(JSON.stringify(state.sectionLabelStyles[0]) === JSON.stringify(state.sectionLabelStyles[1]),
        `${viewport.label}/${theme}: “What I’m doing now” must match “What I design” ${JSON.stringify(state.sectionLabelStyles)}`);
      assert(state.order[0] < state.order[1] && state.order[1] < state.order[2],
        `${viewport.label}/${theme}: current/skills/past order failed ${state.order}`);
      assert(state.roleSizes[0] > state.roleSizes[1],
        `${viewport.label}/${theme}: current role must be visually stronger ${state.roleSizes}`);
      assert(state.roleSizes[0] <= (viewport.mobile ? 34 : 38),
        `${viewport.label}/${theme}: current role title is oversized ${state.roleSizes[0]}px`);
      assert(state.roleRows.every(row =>
        row.backgroundColor === 'rgba(0, 0, 0, 0)' &&
        row.borderBottomWidth === '1px' &&
        row.markerContent !== 'none' &&
        row.markerWidth >= 8
      ), `${viewport.label}/${theme}: positions must use editorial list rows ${JSON.stringify(state.roleRows)}`);
      assert(state.tagRadius === '0px' && state.tagHeight >= 44,
        `${viewport.label}/${theme}: tag treatment failed ${JSON.stringify(state)}`);
      assert(state.image[0] && state.image[1] > 0 && state.image[2] > 0,
        `${viewport.label}/${theme}: portrait failed to decode ${state.image}`);

      await cdp.evaluate(`(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 0); })()`);
      await delay(100);
      await cdp.screenshot(`${viewport.label}-${theme}-intro.png`);
      await cdp.evaluate(`(() => { const target = document.querySelector('.about-current'); scrollTo(0, target.offsetTop - 88); })()`);
      await delay(100);
      await cdp.screenshot(`${viewport.label}-${theme}-current.png`);
      await cdp.evaluate(`(() => { const target = document.querySelector('.about-role-primary'); scrollTo(0, target.offsetTop - 88); })()`);
      await delay(100);
      await cdp.screenshot(`${viewport.label}-${theme}-roles.png`);
      await cdp.evaluate(`(() => { const target = document.querySelector('.about-skills'); scrollTo(0, target.offsetTop - 88); })()`);
      await delay(100);
      await cdp.screenshot(`${viewport.label}-${theme}-skills.png`);
      states.push(`${viewport.label}-${theme}`);
    }
  }

  assert(cdp.consoleErrors.length === 0, `Console errors: ${JSON.stringify(cdp.consoleErrors)}`);
  assert(cdp.exceptions.length === 0, `Runtime exceptions: ${JSON.stringify(cdp.exceptions)}`);
  console.log(`ABOUT VOICE CALIBRATION BROWSER CONTRACT: PASS states=${states.length} evidence=${evidenceDir}`);
  console.log(`viewports=1280x800,390x844 themes=light-dark screenshots=${states.length * 4}`);
} catch (error) {
  console.error(error.stack || error.message);
  if (serverLog) console.error(`Server log:\n${serverLog}`);
  if (chromeLog) console.error(`Chrome log:\n${chromeLog.slice(-3000)}`);
  process.exitCode = 1;
} finally {
  try { cdp?.socket?.close(); } catch {}
  await Promise.allSettled([
    terminateChild(browser, { graceMs: 3000 }),
    terminateChild(server, { graceMs: 3000 }),
  ]);
  await delay(250);
  try {
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 150 });
  } catch (error) {
    console.warn(`Profile cleanup warning: ${error.message}`);
  }
}
