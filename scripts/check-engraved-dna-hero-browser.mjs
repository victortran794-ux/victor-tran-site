#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const baseUrl = process.env.SITE_URL;
if (!baseUrl) throw new Error('SITE_URL is required so the verifier cannot target an unowned server');
const evidenceDir = process.env.DNA_HERO_EVIDENCE_DIR || path.resolve('..', 'evidence');
const chrome = [
  process.env.CHROME_BIN,
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean).find(candidate => fs.existsSync(candidate));
if (!chrome) throw new Error('Chrome binary not found; set CHROME_BIN');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
async function waitForViewport(cdp, width, height) {
  let actual = null;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    actual = await cdp.evaluate(`({inner:[innerWidth,innerHeight],visual:[visualViewport?.width,visualViewport?.height,visualViewport?.scale],client:[document.documentElement.clientWidth,document.documentElement.clientHeight],screen:[screen.width,screen.height]})`);
    if ((actual.inner[0] === width && actual.inner[1] === height) || (actual.client[0] === width && actual.client[1] === height)) return;
    await delay(50);
  }
  throw new Error(`viewport did not settle at ${width}x${height}: ${JSON.stringify(actual)}`);
}
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'dna-hero-pilot-'));
const portFile = path.join(profile, 'DevToolsActivePort');
let chromeLog = '';
const browser = spawn(chrome, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  '--remote-allow-origins=*', '--remote-debugging-port=0',
  `--user-data-dir=${profile}`, '--window-size=1440,900', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });
browser.stderr.on('data', chunk => { chromeLog += chunk.toString(); });

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
        if (!url.endsWith('/favicon.ico') && !url.includes('/_vercel/')) this.networkErrors.push(`${message.params.response.status} ${url}`);
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
    await delay(320);
  }
  async evaluate(expression) {
    const result = await this.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  }
  async key(key, code, keyCode, text = '') {
    const params = { key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode };
    if (text) params.text = text;
    await this.call('Input.dispatchKeyEvent', { type: 'keyDown', ...params });
    await this.call('Input.dispatchKeyEvent', { type: 'keyUp', ...params });
    await delay(80);
  }
  async clickCenter(selector, mobile) {
    const center = await this.evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, width: rect.width, height: rect.height };
    })()`);
    assert(center && center.width > 0 && center.height > 0, `missing visible target ${selector}`);
    if (mobile) {
      await this.call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: center.x, y: center.y, radiusX: 4, radiusY: 4, force: 1, id: 1 }] });
      await this.call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await this.call('Input.dispatchMouseEvent', { type: 'mousePressed', x: center.x, y: center.y, button: 'left', clickCount: 1 });
      await this.call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: center.x, y: center.y, button: 'left', clickCount: 1 });
    }
  }
  async screenshot(name) {
    const shot = await this.call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(evidenceDir, name), Buffer.from(shot.data, 'base64'));
  }
}

let cdp;
try {
  fs.mkdirSync(evidenceDir, { recursive: true });
  const siteResponse = await fetch(`${baseUrl}/index.html`);
  assert(siteResponse.ok, `pilot server returned ${siteResponse.status}`);

  let cdpPort;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (fs.existsSync(portFile)) {
      cdpPort = Number(fs.readFileSync(portFile, 'utf8').split(/\r?\n/, 1)[0]);
      if (Number.isInteger(cdpPort) && cdpPort > 0) break;
    }
    if (browser.exitCode !== null) throw new Error(`Chrome exited ${browser.exitCode}: ${chromeLog}`);
    await delay(100);
  }
  assert(cdpPort, 'Chrome DevTools port did not become ready');

  let page;
  for (let attempt = 0; attempt < 100; attempt += 1) {
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

  await cdp.call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
  await cdp.navigate(`${baseUrl}/index.html?state=first-visit-setup`);
  await cdp.evaluate(`localStorage.removeItem('lens')`);
  await cdp.navigate(`${baseUrl}/index.html?state=first-visit-light-default`);
  const firstVisit = await cdp.evaluate(`({
    theme: document.documentElement.getAttribute('data-theme') || 'light',
    lightPressed: document.querySelector('[data-lens="light"]').getAttribute('aria-pressed'),
    darkPressed: document.querySelector('[data-lens="dark"]').getAttribute('aria-pressed'),
  })`);
  assert(firstVisit.theme === 'light' && firstVisit.lightPressed === 'true' && firstVisit.darkPressed === 'false',
    `first visit must default to Light even when system preference is Dark ${JSON.stringify(firstVisit)}`);

  const matrix = [
    { label: 'desktop-light', width: 1440, height: 900, mobile: false, theme: 'light', reduced: false },
    { label: 'desktop-dark', width: 1440, height: 900, mobile: false, theme: 'dark', reduced: false },
    { label: 'boundary-981-light', width: 981, height: 900, mobile: false, theme: 'light', reduced: false },
    { label: 'boundary-980-light', width: 980, height: 900, mobile: false, theme: 'light', reduced: false },
    { label: 'boundary-979-light', width: 979, height: 900, mobile: false, theme: 'light', reduced: false },
    { label: 'boundary-761-light', width: 761, height: 900, mobile: false, theme: 'light', reduced: false },
    { label: 'boundary-760-light', width: 760, height: 900, mobile: false, theme: 'light', reduced: false },
    { label: 'boundary-759-light', width: 759, height: 900, mobile: false, theme: 'light', reduced: false },
    { label: 'mobile-light', width: 390, height: 844, mobile: true, theme: 'light', reduced: false },
    { label: 'mobile-dark', width: 390, height: 844, mobile: true, theme: 'dark', reduced: false },
    { label: 'desktop-light-reduced', width: 1440, height: 900, mobile: false, theme: 'light', reduced: true },
    { label: 'desktop-dark-reduced', width: 1440, height: 900, mobile: false, theme: 'dark', reduced: true },
  ];
  const states = [];

  for (const item of matrix) {
    await cdp.call('Emulation.setDeviceMetricsOverride', { width: item.width, height: item.height, deviceScaleFactor: 1, mobile: item.mobile });
    await cdp.call('Emulation.setTouchEmulationEnabled', { enabled: item.mobile, maxTouchPoints: 1 });
    await cdp.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: item.reduced ? 'reduce' : 'no-preference' }] });
    await cdp.navigate(`${baseUrl}/index.html?state=${item.label}`);
    await cdp.evaluate(`localStorage.setItem('lens', ${JSON.stringify(item.theme)})`);
    await cdp.navigate(`${baseUrl}/index.html?state=${item.label}&fresh=1`);
    await cdp.call('Emulation.setDeviceMetricsOverride', { width: item.width, height: item.height, screenWidth: item.width, screenHeight: item.height, positionX: 0, positionY: 0, deviceScaleFactor: 1, scale: 1, mobile: false, dontSetVisibleSize: false });
    await waitForViewport(cdp, item.width, item.height);
    await cdp.evaluate(`(async () => {
      if (document.fonts?.ready) await document.fonts.ready;
      const image = document.querySelector('[data-home-theme-image]');
      if (image && !image.complete) await new Promise((resolve) => image.addEventListener('load', resolve, { once: true }));
      if (image) { try { await image.decode(); } catch {} }
    })()`);

    const dormant = await cdp.evaluate(`(() => {
      const hero = document.querySelector('.hero');
      const parseColor = value => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = value;
        context.fillRect(0, 0, 1, 1);
        const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
        return [red, green, blue, alpha / 255];
      };
      const channel = value => {
        value /= 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      };
      const luminance = color => 0.2126 * channel(color[0]) + 0.7152 * channel(color[1]) + 0.0722 * channel(color[2]);
      const contrast = element => {
        const foreground = parseColor(getComputedStyle(element).color);
        const background = parseColor(getComputedStyle(hero).backgroundColor);
        let opacity = foreground[3];
        for (let node = element; node && node !== hero; node = node.parentElement) opacity *= Number(getComputedStyle(node).opacity);
        const composite = foreground.slice(0, 3).map((value, index) => value * opacity + background[index] * (1 - opacity));
        const values = [luminance(composite), luminance(background)].sort((a, b) => b - a);
        return (values[0] + 0.05) / (values[1] + 0.05);
      };
      const frame = document.querySelector('.hero-portrait-frame').getBoundingClientRect();
      const trigger = document.querySelector('.hero-dna-trigger');
      const titleRect = document.querySelector('.hero-title').getBoundingClientRect();
      const ctaRect = document.querySelector('.hero-cta').getBoundingClientRect();
      const victor = document.querySelector('.hero-bigtype--victor');
      const tran = document.querySelector('.hero-bigtype--tran');
      const navVictor = document.querySelector('.nav-logo-victor');
      const navTran = document.querySelector('.nav-logo-tran');
      const intro = document.querySelector('.hero-intro-row').getBoundingClientRect();
      const headline = document.querySelector('.hero-typeblock h1');
      const textRect = element => {
        const range = document.createRange();
        range.selectNodeContents(element);
        return range.getBoundingClientRect();
      };
      const activePortraits = [...document.querySelectorAll('[data-theme-portrait]')].map(element => ({
        theme: element.dataset.themePortrait,
        opacity: parseFloat(getComputedStyle(element).opacity),
        src: element.querySelector('img').getAttribute('src'),
      }));
      const nav = getComputedStyle(document.querySelector('.nav'));
      const blobs = [...document.querySelectorAll('.hero-ambient-blob')].map(element => ({
        id: element.dataset.ambientId,
        left: getComputedStyle(element).left,
        top: getComputedStyle(element).top,
        width: parseFloat(getComputedStyle(element).width),
        animation: getComputedStyle(element).animationName,
      }));
      const orbs = [...document.querySelectorAll('.hero-ambient-orb')].map(element => {
        const style = getComputedStyle(element);
        return {
          id: element.dataset.ambientId,
          left: parseFloat(style.left),
          top: parseFloat(style.top),
          width: parseFloat(style.width),
          borderWidth: parseFloat(style.borderTopWidth),
          filter: style.filter,
          animation: style.animationName,
          hasNode: getComputedStyle(element, '::after').content !== 'none',
        };
      });
      const companions = [...document.querySelectorAll('.hero-ambient-companion')].map(element => {
        const style = getComputedStyle(element);
        return {
          id: element.dataset.ambientId,
          width: parseFloat(style.width),
          background: style.backgroundColor,
          borderWidth: parseFloat(style.borderTopWidth),
          borderColor: style.borderTopColor,
          zIndex: parseInt(style.zIndex, 10),
          shiftX: parseFloat(style.getPropertyValue('--companion-shift-x')) || 0,
          shiftY: parseFloat(style.getPropertyValue('--companion-shift-y')) || 0,
        };
      });
      const workPrimary = document.querySelector('.featured-item[href="wxo-canvas.html"]');
      const workRelated = workPrimary?.querySelector('.featured-item-bonus');
      const workBonusText = workRelated?.querySelector('em');
      const workImage = workPrimary?.querySelector('[data-home-theme-image]');
      const relatedStyle = workBonusText ? getComputedStyle(workBonusText) : null;
      const relatedRect = workRelated?.getBoundingClientRect();
      return {
        viewport: [Math.max(innerWidth, document.documentElement.clientWidth), innerHeight],
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        theme: document.documentElement.getAttribute('data-theme') || 'light',
        frame: [frame.width, frame.height],
        frameEdges: [frame.top, frame.bottom],
        frameRight: frame.right,
        copyLeft: document.querySelector('.hero-copy').getBoundingClientRect().left,
        copyRight: document.querySelector('.hero-copy').getBoundingClientRect().right,
        copyBox: (() => { const rect = document.querySelector('.hero-copy').getBoundingClientRect(); return [rect.width, rect.height]; })(),
        copyChildren: [...document.querySelector('.hero-copy').children].map(element => { const rect = element.getBoundingClientRect(); return [rect.top, rect.bottom, rect.height]; }),
        copyEdges: [titleRect.top, ctaRect.bottom],
        target: [trigger.getBoundingClientRect().width, trigger.getBoundingClientRect().height],
        name: {
          labels: [victor.textContent, tran.textContent, navVictor.textContent, navTran.textContent],
          colors: [victor, tran, navVictor, navTran].map(element => getComputedStyle(element).color),
          styles: [victor, tran, navVictor, navTran].map(element => getComputedStyle(element).fontStyle),
          sizes: [parseFloat(getComputedStyle(victor).fontSize), parseFloat(getComputedStyle(tran).fontSize)],
          navSizes: [parseFloat(getComputedStyle(navVictor).fontSize), parseFloat(getComputedStyle(navTran).fontSize)],
          joinedGap: textRect(tran).left - textRect(victor).right,
          overhang: headline.getBoundingClientRect().right - intro.right,
          transitionDurations: [victor, tran, navVictor, navTran].map(element => getComputedStyle(element).transitionDuration),
        },
        navAlignment: {
          logoTextCenter: (() => { const rect = textRect(navVictor); return (rect.top + rect.bottom) / 2; })(),
          menuTextCenter: (() => { const rect = textRect(document.querySelector('.nav-dropdown-toggle')); return (rect.top + rect.bottom) / 2; })(),
          logoAlignItems: getComputedStyle(document.querySelector('.nav-logo')).alignItems,
        },
        pageHierarchy: {
          heroLeft: document.querySelector('.hero-identity').getBoundingClientRect().left,
          servicesLeft: document.querySelector('.hero-services').getBoundingClientRect().left,
          sectionLabelLeft: document.querySelector('.featured-heading h2').getBoundingClientRect().left,
          headingHeight: document.querySelector('.featured-heading').getBoundingClientRect().height,
          headingLabelDepth: (() => {
            const row = document.querySelector('.featured-heading').getBoundingClientRect();
            const label = document.querySelector('.featured-heading h2').getBoundingClientRect();
            return ((label.top + label.height / 2) - row.top) / row.height;
          })(),
        },
        navBackground: nav.backgroundColor,
        portraits: activePortraits,
        blobCount: blobs.length,
        blobs,
        orbCount: orbs.length,
        orbs,
        companions,
        workCard: {
          hasPrimary: !!workPrimary,
          hasRelated: !!workRelated,
          relatedLabel: (workRelated?.textContent || '').replace('↳', '').trim(),
          relatedNested: !!workPrimary?.contains(workRelated),
          relatedHref: workRelated?.closest('a')?.getAttribute('href') || '',
          relatedHeight: relatedRect?.height || 0,
          relatedTextTransform: relatedStyle?.textTransform || '',
          relatedDecoration: relatedStyle?.textDecorationLine || '',
          source: workImage?.getAttribute('src') || '',
          lightSource: workImage?.dataset.themeLightSrc || '',
          darkSource: workImage?.dataset.themeDarkSrc || '',
          decoded: !!workImage?.complete && (workImage?.naturalWidth || 0) > 0,
        },
        hasAmbientTunerSurface: '__ambientFieldTunerApi' in window,
        hasCursorGlow: !!document.querySelector('.hero-cursor-wash'),
        dnaHidden: document.getElementById('heroDnaPanel').hidden,
        expanded: trigger.getAttribute('aria-expanded'),
        hasModal: !!document.querySelector('[aria-modal="true"]'),
        contrast: {
          nav: contrast(document.querySelector('.nav-dropdown-toggle')),
          services: contrast(document.querySelector('.hero-services')),
        },
      };
    })()`);

    assert(dormant.viewport[0] === item.width && dormant.viewport[1] === item.height, `${item.label}: viewport mismatch`);
    assert(dormant.overflow <= 0, `${item.label}: horizontal overflow ${dormant.overflow}`);
    assert(dormant.theme === item.theme, `${item.label}: theme mismatch ${dormant.theme}`);
    assert(dormant.workCard.hasPrimary && dormant.workCard.hasRelated,
      `${item.label}: wxO card must expose one primary action with its subtle bonus note ${JSON.stringify(dormant.workCard)}`);
    assert(dormant.workCard.relatedNested && dormant.workCard.relatedHref === 'wxo-canvas.html'
      && dormant.workCard.relatedLabel === 'There’s a bonus one here',
      `${item.label}: bonus note must remain inside the singular wxO case-study link ${JSON.stringify(dormant.workCard)}`);
    assert(dormant.workCard.relatedTextTransform === 'none' && dormant.workCard.relatedDecoration === 'none'
      && dormant.workCard.relatedHeight > 0,
      `${item.label}: bonus note must retain its subdued inline treatment ${JSON.stringify(dormant.workCard)}`);
    assert(dormant.workCard.decoded && dormant.workCard.source === dormant.workCard[`${item.theme}Source`],
      `${item.label}: wxO thumbnail must decode from the selected theme source ${JSON.stringify(dormant.workCard)}`);
    assert(Math.abs(dormant.frame[0] - dormant.frame[1]) < 1, `${item.label}: portrait frame must stay square ${dormant.frame}`);
    assert(Math.abs(dormant.frameEdges[0] - dormant.copyEdges[0]) < 2 && Math.abs(dormant.frameEdges[1] - dormant.copyEdges[1]) < 2,
      `${item.label}: portrait must span I design through See the work ${JSON.stringify({ frame: dormant.frameEdges, copy: dormant.copyEdges, copyBox: dormant.copyBox, children: dormant.copyChildren })}`);
    assert(dormant.copyLeft - dormant.frameRight >= 12,
      `${item.label}: portrait must not crowd or overlap the copy ${JSON.stringify({ frameRight: dormant.frameRight, copyLeft: dormant.copyLeft })}`);
    assert(dormant.copyRight <= item.width - (item.width <= 760 ? 24 : 32),
      `${item.label}: intro copy must remain visibly inside the viewport ${JSON.stringify({ copyRight: dormant.copyRight, viewport: item.width })}`);
    assert(dormant.target[0] >= 80 && dormant.target[1] >= 44, `${item.label}: portrait trigger too small ${dormant.target}`);
    assert(dormant.name.labels.join('|') === 'Victor|Tran|Victor|Tran', `${item.label}: name must be title-case in hero and header ${dormant.name.labels}`);
    if (item.width > 760) assert(dormant.navAlignment.logoAlignItems === 'center'
      && Math.abs(dormant.navAlignment.logoTextCenter - dormant.navAlignment.menuTextCenter) <= 2,
      `${item.label}: header name is not vertically centered with menu text ${JSON.stringify(dormant.navAlignment)}`);
    if (item.width > 980) assert(Math.abs(dormant.pageHierarchy.heroLeft - dormant.pageHierarchy.sectionLabelLeft) <= 1
      && Math.abs(dormant.pageHierarchy.servicesLeft - dormant.pageHierarchy.sectionLabelLeft) <= 1,
      `${item.label}: hero and page text rails do not align ${JSON.stringify(dormant.pageHierarchy)}`);
    assert(dormant.pageHierarchy.headingHeight >= (item.width <= 760 ? 132 : 156)
      && dormant.pageHierarchy.headingLabelDepth >= 0.66,
      `${item.label}: Other cool things row must be larger with its label in the lower third ${JSON.stringify(dormant.pageHierarchy)}`);
    assert(dormant.name.styles.every(style => style === 'italic'), `${item.label}: hero and header name must be italic ${dormant.name.styles}`);
    assert(Math.abs(dormant.name.sizes[1] - dormant.name.sizes[0]) < 0.1 && Math.abs(dormant.name.navSizes[1] - dormant.name.navSizes[0]) < 0.1,
      `${item.label}: Victor and Tran must be equal-size in hero and header ${JSON.stringify(dormant.name)}`);
    assert(dormant.name.joinedGap <= 2 && dormant.name.joinedGap >= -20,
      `${item.label}: VictorTran must read as one tight lockup ${dormant.name.joinedGap}`);
    if (item.width >= 1200) assert(dormant.name.overhang >= 60 && dormant.name.overhang <= 84,
      `${item.label}: VictorTran must overhang the content by about 72px ${dormant.name.overhang}`);
    const expectedNameColors = item.theme === 'light'
      ? ['rgb(85, 162, 247)', 'rgb(26, 26, 26)', 'rgb(22, 103, 185)', 'rgb(26, 26, 26)']
      : ['rgb(234, 59, 153)', 'rgb(247, 246, 243)', 'rgb(234, 59, 153)', 'rgb(247, 246, 243)'];
    assert(dormant.name.colors.every((color, index) => color === expectedNameColors[index]), `${item.label}: name palette mismatch ${dormant.name.colors}`);
    const expectedNameTransition = item.reduced ? '1e-05s' : '0.4s';
    assert(new Set(dormant.name.transitionDurations).size === 1 && dormant.name.transitionDurations[0] === expectedNameTransition,
      `${item.label}: name transition must flip seamlessly ${dormant.name.transitionDurations}`);
    assert(dormant.navBackground === 'rgba(0, 0, 0, 0)', `${item.label}: nav bar is not transparent ${dormant.navBackground}`);
    assert(dormant.blobCount === 2, `${item.label}: expected two blobs`);
    assert(dormant.blobs[1].width / dormant.blobs[0].width >= 0.60 && dormant.blobs[1].width / dormant.blobs[0].width <= 0.64,
      `${item.label}: selected 50/81 background-blob scale relationship must render ${JSON.stringify(dormant.blobs)}`);
    assert(dormant.orbCount === 9, `${item.label}: expected Victor's nine selected orbital circles`);
    assert(new Set(dormant.orbs.map(orb => Math.round(orb.width))).size >= 7,
      `${item.label}: orbital circles must vary substantially in size ${JSON.stringify(dormant.orbs)}`);
    assert(dormant.orbs.filter(orb => orb.hasNode).length === 3,
      `${item.label}: exactly three circles must have orbiting nodes ${JSON.stringify(dormant.orbs)}`);
    assert(dormant.companions.length === 2
      && dormant.companions.every(companion => companion.width === 42 && companion.zIndex === 3
        && companion.background === 'rgba(0, 0, 0, 0)' && companion.borderWidth === 1)
      && dormant.companions[0].borderColor === dormant.companions[1].borderColor,
      `${item.label}: Victor's two selected blue-purple companion strokes must remain on the top circle layer ${JSON.stringify(dormant.companions)}`);
    assert(!dormant.hasAmbientTunerSurface, `${item.label}: private ambient tuner API is exposed in production`);
    assert(dormant.blobs.map(blob => blob.id).join(',') === 'blob-a,blob-b'
      && dormant.orbs.map(orb => orb.id).join(',') === 'ring-a,ring-b,ring-c,ring-e,ring-f,ring-new-2,ring-new-3,ring-new-4,ring-new-5'
      && dormant.companions.map(companion => companion.id).join(',') === 'small-a,small-c',
      `${item.label}: submitted ambient identities did not become the normal-mode baseline ${JSON.stringify({ blobs: dormant.blobs, orbs: dormant.orbs, companions: dormant.companions })}`);
    assert(dormant.orbs.every(orb => Math.abs(orb.borderWidth - 1) < 0.1 && orb.filter === 'none'),
      `${item.label}: satellites must render as thin unblurred wxO-derived rings ${JSON.stringify(dormant.orbs)}`);
    if (item.reduced) assert(dormant.orbs.every(orb => orb.animation === 'none'), `${item.label}: small orbs animate under reduced motion`);
    assert(!dormant.hasCursorGlow, `${item.label}: removed cursor glow is still present`);
    assert(dormant.dnaHidden && dormant.expanded === 'false' && !dormant.hasModal, `${item.label}: dormant DNA semantics failed`);
    assert(dormant.contrast.nav >= 4.5, `${item.label}: nav contrast ${dormant.contrast.nav.toFixed(2)}:1`);
    assert(dormant.contrast.services >= 4.5, `${item.label}: service-label contrast ${dormant.contrast.services.toFixed(2)}:1`);

    const activePortrait = dormant.portraits.find(portrait => portrait.opacity > 0.95);
    assert(activePortrait?.theme === item.theme, `${item.label}: wrong active portrait ${JSON.stringify(dormant.portraits)}`);
    assert(activePortrait.src.endsWith(item.theme === 'light' ? 'figure20.webp' : 'figure19.webp'), `${item.label}: wrong portrait source ${activePortrait.src}`);
    if (item.reduced) assert(dormant.blobs.every(blob => blob.animation === 'none'), `${item.label}: blobs animate under reduced motion`);

    await cdp.screenshot(`${item.label}-dormant.png`);

    let pointerProof = null;
    if (item.label === 'desktop-light' || item.label === 'desktop-dark') {
      const before = dormant.blobs.map(blob => [parseFloat(blob.left), parseFloat(blob.top)]);
      const orbBefore = dormant.orbs.map(orb => [orb.left, orb.top]);
      await cdp.call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: item.width * 0.22, y: item.height * 0.72 });
      await delay(900);
      const first = await cdp.evaluate(`(() => ({
        blobs: [...document.querySelectorAll('.hero-ambient-blob')].map(element => [parseFloat(getComputedStyle(element).left), parseFloat(getComputedStyle(element).top)]),
        orbs: [...document.querySelectorAll('.hero-ambient-orb')].map(element => [parseFloat(getComputedStyle(element).left), parseFloat(getComputedStyle(element).top)]),
        companions: [...document.querySelectorAll('.hero-ambient-companion')].map(element => {
          const style = getComputedStyle(element);
          return [parseFloat(style.getPropertyValue('--companion-shift-x')) || 0, parseFloat(style.getPropertyValue('--companion-shift-y')) || 0];
        }),
      }))()`);
      assert(first.blobs.every((position, index) => Math.hypot(position[0] - before[index][0], position[1] - before[index][1]) >= 1), `${item.label}: both lava blobs must visibly travel`);
      const orbTravel = first.orbs.map((position, index) => Math.hypot(position[0] - orbBefore[index][0], position[1] - orbBefore[index][1]));
      const stationaryNodeTravel = orbTravel.filter((distance, index) => dormant.orbs[index].hasNode);
      const buoyantPlainTravel = orbTravel.filter((distance, index) => !dormant.orbs[index].hasNode);
      assert(stationaryNodeTravel.every(distance => distance <= 0.5),
        `${item.label}: dot-bearing rings must stay positionally stationary ${stationaryNodeTravel}`);
      assert(buoyantPlainTravel.every(distance => distance >= 1 && distance <= 180) && buoyantPlainTravel.filter(distance => distance >= 15).length >= 2,
        `${item.label}: plain separated circles must move buoyantly with visible range ${buoyantPlainTravel}`);
      assert(first.companions.length === 2 && first.companions.every(shift => Math.hypot(...shift) >= 2 && Math.hypot(...shift) <= 18),
        `${item.label}: small circles must respond subtly to the pointer ${JSON.stringify(first.companions)}`);
      await cdp.call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: item.width * 0.78, y: item.height * 0.28 });
      await delay(350);
      const second = await cdp.evaluate(`(() => ({
        companions: [...document.querySelectorAll('.hero-ambient-companion')].map(element => {
          const style = getComputedStyle(element);
          return [parseFloat(style.getPropertyValue('--companion-shift-x')) || 0, parseFloat(style.getPropertyValue('--companion-shift-y')) || 0];
        }),
      }))()`);
      assert(second.companions.every((shift, index) => Math.hypot(shift[0] - first.companions[index][0], shift[1] - first.companions[index][1]) >= 2.5),
        `${item.label}: small-circle response did not fluidly follow the pointer change ${JSON.stringify({ first: first.companions, second: second.companions })}`);
      await cdp.screenshot(`${item.label}-pointer.png`);

      const portraitCenter = await cdp.evaluate(`(() => {
        const rect = document.querySelector('.hero-portrait-frame').getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      })()`);
      await cdp.call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: portraitCenter.x, y: portraitCenter.y });
      await delay(380);
      const hover = await cdp.evaluate(`({
        overlayOpacity: parseFloat(getComputedStyle(document.querySelector('.hero-portrait-frame'), '::after').opacity),
        dnaHidden: document.getElementById('heroDnaPanel').hidden,
      })`);
      assert(hover.overlayOpacity >= 0.2 && hover.dnaHidden, `${item.label}: portrait hover must lighten without opening DNA ${JSON.stringify(hover)}`);
      await cdp.screenshot(`${item.label}-hover.png`);
      pointerProof = { before, orbBefore, first, second, hover };
    }

    if (item.label === 'desktop-light') {
      const backgroundTab = await cdp.call('Target.createTarget', { url: 'about:blank' });
      await delay(180);
      const hiddenState = await cdp.evaluate(`({
        hidden: document.hidden,
        paused: document.querySelector('.hero').classList.contains('hero-ambient-paused'),
      })`);
      assert(hiddenState.hidden && hiddenState.paused, `desktop-light: background tab did not pause ambient field ${JSON.stringify(hiddenState)}`);
      await cdp.call('Page.bringToFront');
      await delay(180);
      const visibleState = await cdp.evaluate(`({
        hidden: document.hidden,
        paused: document.querySelector('.hero').classList.contains('hero-ambient-paused'),
      })`);
      assert(!visibleState.hidden && !visibleState.paused, `desktop-light: foreground tab did not resume ambient field ${JSON.stringify(visibleState)}`);
      await cdp.call('Target.closeTarget', { targetId: backgroundTab.targetId });
    }

    if (item.label === 'desktop-light' || item.label === 'desktop-dark') {
      await cdp.evaluate(`(() => { document.body.tabIndex = -1; document.body.focus(); })()`);
      let focusedTrigger = false;
      for (let tab = 0; tab < 20; tab += 1) {
        await cdp.key('Tab', 'Tab', 9);
        focusedTrigger = await cdp.evaluate(`document.activeElement === document.querySelector('.hero-dna-trigger')`);
        if (focusedTrigger) break;
      }
      assert(focusedTrigger, `${item.label}: trusted Tab traversal did not reach DNA trigger`);
      if (item.label === 'desktop-light') await cdp.key('Enter', 'Enter', 13, '\r');
      else await cdp.key(' ', 'Space', 32, ' ');
    } else {
      await cdp.clickCenter('.hero-dna-trigger', item.mobile);
    }
    await delay(item.reduced ? 180 : 750);
    const active = await cdp.evaluate(`(() => {
      const panel = document.getElementById('heroDnaPanel');
      const parseColor = value => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = value;
        context.fillRect(0, 0, 1, 1);
        const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
        return [red, green, blue, alpha / 255];
      };
      const channel = value => {
        value /= 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      };
      const luminance = color => 0.2126 * channel(color[0]) + 0.7152 * channel(color[1]) + 0.0722 * channel(color[2]);
      const contrast = element => {
        const foreground = parseColor(getComputedStyle(element).color);
        const background = parseColor(getComputedStyle(document.querySelector('.hero')).backgroundColor);
        let opacity = foreground[3];
        for (let node = element; node && !node.classList.contains('hero'); node = node.parentElement) opacity *= Number(getComputedStyle(node).opacity);
        const composite = foreground.slice(0, 3).map((value, index) => value * opacity + background[index] * (1 - opacity));
        const values = [luminance(composite), luminance(background)].sort((a, b) => b - a);
        return (values[0] + 0.05) / (values[1] + 0.05);
      };
      const rect = panel.getBoundingClientRect();
      const hero = document.querySelector('.hero').getBoundingClientRect();
      const groups = [...panel.querySelectorAll('.hero-dna-group')];
      const panelStyle = getComputedStyle(panel);
      return {
        hidden: panel.hidden,
        active: panel.classList.contains('is-active'),
        expanded: document.querySelector('.hero-dna-trigger').getAttribute('aria-expanded'),
        opacity: parseFloat(getComputedStyle(panel).opacity),
        panel: [rect.left, rect.top, rect.right, rect.bottom],
        hero: [hero.left, hero.top, hero.right, hero.bottom],
        overflow: document.documentElement.scrollWidth - innerWidth,
        dnaContrast: contrast(document.querySelector('.hero-dna-label')),
        groupOpacity: groups.map(group => parseFloat(getComputedStyle(group).opacity)),
        groupRects: groups.map(group => { const box = group.getBoundingClientRect(); return [box.left, box.top, box.right, box.bottom]; }),
        gridColumns: panelStyle.gridTemplateColumns.split(' ').filter(Boolean).length,
        closeText: panel.querySelector('[data-dna-close]').textContent.trim(),
        groupLabels: groups.map(group => group.querySelector('.hero-dna-label')?.textContent.trim()),
        labelFontSize: parseFloat(getComputedStyle(panel.querySelector('.hero-dna-label')).fontSize),
        swatchWidth: parseFloat(getComputedStyle(panel.querySelector('.hero-dna-swatch-dot')).width),
        swatchCount: panel.querySelectorAll('.hero-dna-swatch').length,
        paletteTokens: [...panel.querySelectorAll('.hero-dna-swatch')].map(swatch => swatch.dataset.dnaToken),
        paletteValues: [...panel.querySelectorAll('.hero-dna-swatch-value')].map(value => value.textContent.trim()),
        faceNames: [...panel.querySelectorAll('.hero-dna-type-row b')].map(face => face.textContent.trim()),
        typeSampleSize: parseFloat(getComputedStyle(panel.querySelector('.hero-dna-type-sample')).fontSize),
        editableSample: panel.querySelector('.hero-dna-play-text')?.getAttribute('contenteditable'),
        sharedStructure: panel.textContent.includes('Shared structure'),
        layout: (() => {
          const box = selector => {
            const rect = panel.querySelector(selector).getBoundingClientRect();
            return [rect.left, rect.top, rect.right, rect.bottom];
          };
          return {
            spacing: box('.hero-dna-spacing'),
            shape: box('.hero-dna-shape'),
            type: box('.hero-dna-type'),
            typefaces: box('.hero-dna-typefaces'),
            playground: box('.hero-dna-type-playground'),
            typeColumns: getComputedStyle(panel.querySelector('.hero-dna-type')).gridTemplateColumns.split(' ').filter(Boolean).length,
          };
        })(),
      };
    })()`);
    assert(!active.hidden && active.active && active.expanded === 'true' && active.opacity > 0.95, `${item.label}: inline DNA did not activate ${JSON.stringify(active)}`);
    assert(active.panel[0] >= active.hero[0] && active.panel[2] <= active.hero[2] + 1 && active.panel[3] <= active.hero[3] + 1, `${item.label}: DNA panel escaped hero ${JSON.stringify(active)}`);
    assert(active.overflow <= 0, `${item.label}: expanded DNA overflow ${active.overflow}`);
    assert(active.dnaContrast >= 4.5, `${item.label}: DNA text contrast ${active.dnaContrast.toFixed(2)}:1`);
    assert(active.groupOpacity.every(opacity => opacity > 0.95), `${item.label}: DNA content must use normal opacity ${active.groupOpacity}`);
    assert(active.closeText === 'Close panel', `${item.label}: DNA close label mismatch ${active.closeText}`);
    assert(active.groupLabels.join('|') === 'Palette|Typography|Spacing|Shape',
      `${item.label}: expanded DNA board content mismatch ${active.groupLabels}`);
    assert(active.swatchCount === 9
      && ['--bg', '--bg-2', '--text', '--text-2', '--border'].every(token => active.paletteTokens.includes(token))
      && active.paletteValues.every(Boolean), `${item.label}: live palette values incomplete ${JSON.stringify(active)}`);
    assert(active.faceNames.join('|') === 'DM Serif Display|Barlow|Source Code Pro'
      && active.editableSample === 'true' && !active.sharedStructure,
      `${item.label}: restored DNA typography or section boundary failed ${JSON.stringify(active)}`);
    if (item.width > 760) assert(active.labelFontSize >= 9.9 && active.swatchWidth >= 32 && active.typeSampleSize >= 54,
      `${item.label}: desktop DNA content was not enlarged ${JSON.stringify({ labelFontSize: active.labelFontSize, swatchWidth: active.swatchWidth, typeSampleSize: active.typeSampleSize })}`);
    if (item.width > 760) assert(Math.abs(active.layout.spacing[0] - active.layout.shape[0]) <= 1
      && active.layout.shape[1] > active.layout.spacing[1]
      && active.layout.typeColumns === 2
      && active.layout.typefaces[2] <= active.layout.playground[0] + 1,
      `${item.label}: grouped rhythm and side-by-side typography layout failed ${JSON.stringify(active.layout)}`);
    if (item.width > 980) assert(active.panel[0] >= active.hero[0] + (active.hero[2] - active.hero[0]) * 0.47 && active.panel[2] >= active.hero[2] - 61,
      `${item.label}: DNA must make deliberate use of the right side ${JSON.stringify(active.panel)}`);
    if (item.width <= 760) assert(active.gridColumns === 2 && active.panel[0] <= active.hero[0] + 25 && active.panel[2] >= active.hero[2] - 25,
      `${item.label}: mobile DNA layout parity failed ${JSON.stringify(active)}`);
    await cdp.clickCenter('.hero-dna-swatch[data-dna-token="--pink"]', item.mobile);
    await cdp.evaluate(`new Promise((resolve) => {
      const startedAt = performance.now();
      const waitForTint = () => {
        const tint = document.querySelector('.hero-dna-tint');
        const ready = tint.classList.contains('is-active') && parseFloat(getComputedStyle(tint).opacity) >= 0.2;
        if (ready || performance.now() - startedAt >= 2000) return resolve();
        requestAnimationFrame(waitForTint);
      };
      waitForTint();
    })`);
    const tintState = await cdp.evaluate(`(() => {
      const tint = document.querySelector('.hero-dna-tint');
      const swatch = document.querySelector('.hero-dna-swatch[data-dna-token="--pink"]');
      return {
        active: tint.classList.contains('is-active'),
        opacity: parseFloat(getComputedStyle(tint).opacity),
        background: getComputedStyle(tint).backgroundColor,
        selected: swatch.classList.contains('is-selected'),
        pressed: swatch.getAttribute('aria-pressed'),
        status: document.querySelector('.hero-dna-tint-status').textContent.trim(),
      };
    })()`);
    assert(tintState.active && tintState.opacity >= 0.2 && tintState.selected && tintState.pressed === 'true'
      && tintState.background !== 'rgba(0, 0, 0, 0)' && tintState.status.includes('Hero wash'),
      `${item.label}: whole-hero palette tint failed ${JSON.stringify(tintState)}`);
    await cdp.screenshot(`${item.label}-dna.png`);

    if (item.label === 'desktop-light') {
      await cdp.evaluate(`document.querySelector('.hero-dna-panel').scrollTop = document.querySelector('.hero-dna-panel').scrollHeight`);
      await delay(180);
      await cdp.clickCenter('.hero-dna-chip[data-dna-font="\'Barlow\', sans-serif"]', false);
      await cdp.clickCenter('.hero-dna-chip[data-dna-italic]', false);
      const typePlay = await cdp.evaluate(`(() => {
        const sample = document.querySelector('.hero-dna-play-text');
        return { family: getComputedStyle(sample).fontFamily, style: getComputedStyle(sample).fontStyle };
      })()`);
      assert(typePlay.family.includes('Barlow') && typePlay.style === 'italic',
        `desktop-light: typography playground controls failed ${JSON.stringify(typePlay)}`);
      await cdp.screenshot('desktop-light-dna-lower.png');
    }

    if (item.label === 'mobile-light') {
      await cdp.evaluate(`document.querySelector('[data-dna-close]').scrollIntoView({ block: 'center', behavior: 'instant' })`);
      await delay(350);
      await cdp.screenshot('mobile-light-dna-lower.png');
      await cdp.clickCenter('[data-dna-close]', true);
    } else {
      await cdp.key('Escape', 'Escape', 27);
    }
    await delay(item.reduced ? 30 : 480);
    const closed = await cdp.evaluate(`(() => ({
      hidden: document.getElementById('heroDnaPanel').hidden,
      expanded: document.querySelector('.hero-dna-trigger').getAttribute('aria-expanded'),
      focusReturned: document.activeElement === document.querySelector('.hero-dna-trigger'),
      tintActive: document.querySelector('.hero-dna-tint').classList.contains('is-active'),
    }))()`);
    assert(closed.hidden && closed.expanded === 'false' && closed.focusReturned && !closed.tintActive, `${item.label}: Escape close/focus return failed ${JSON.stringify(closed)}`);
    if (['desktop-light', 'desktop-dark', 'mobile-light', 'mobile-dark'].includes(item.label)) {
      await cdp.evaluate(`document.querySelector('.featured-heading').scrollIntoView({ block: 'center', behavior: 'instant' })`);
      await delay(80);
      await cdp.screenshot(`${item.label}-work-heading.png`);
    }
    if (['desktop-light', 'desktop-dark'].includes(item.label)) {
      await cdp.evaluate(`document.querySelector('.featured-item--surface-ibm-inverse .featured-item-content').scrollIntoView({ block: 'center', behavior: 'instant' })`);
      await delay(900);
      await cdp.screenshot(`${item.label}-ibm-cloud-card.png`);
      await cdp.evaluate(`document.getElementById('galleries').scrollIntoView({ block: 'center', behavior: 'instant' })`);
      await cdp.evaluate(`Promise.all([...document.querySelectorAll('#galleries img')].map(async (image) => { try { await image.decode(); } catch {} }))`);
      await delay(900);
      await cdp.screenshot(`${item.label}-equal-galleries.png`);
    }
    if (item.label === 'mobile-light') {
      await cdp.evaluate(`document.querySelector('#galleries .featured-item--gallery').scrollIntoView({ block: 'center', behavior: 'instant' })`);
      await cdp.evaluate(`Promise.all([...document.querySelectorAll('#galleries img')].map(async (image) => { try { await image.decode(); } catch {} }))`);
      await delay(900);
      await cdp.screenshot('mobile-light-equal-galleries.png');
    }
    states.push({ label: item.label, dormant, pointerProof, active, closed });
  }

  // tuner normal-mode isolation
  await cdp.call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 820, deviceScaleFactor: 1, mobile: false });
  await cdp.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await cdp.navigate(`${baseUrl}/index.html?state=tuner-normal-isolation`);
  await cdp.evaluate(`localStorage.removeItem('ambient-field-tuner-v1')`);
  await cdp.navigate(`${baseUrl}/index.html?state=tuner-normal-isolation-clean`);
  const normalTuner = await cdp.evaluate(`({ panel: !!document.querySelector('.ambient-tuner'), toggle: !!document.querySelector('.ambient-tuner-toggle') })`);
  assert(!normalTuner.panel && !normalTuner.toggle, `tuner normal-mode isolation failed ${JSON.stringify(normalTuner)}`);

  await cdp.navigate(`${baseUrl}/index.html?tune=1&state=production-tuner-containment`);
  await delay(160);
  const queryTuner = await cdp.evaluate(`({ panel: !!document.querySelector('.ambient-tuner'), toggle: !!document.querySelector('.ambient-tuner-toggle') })`);
  assert(!queryTuner.panel && !queryTuner.toggle, `production query must not expose private tuner UI ${JSON.stringify(queryTuner)}`);

  assert(cdp.consoleErrors.length === 0, `console errors: ${cdp.consoleErrors.join(' | ')}`);
  assert(cdp.exceptions.length === 0, `runtime exceptions: ${cdp.exceptions.join(' | ')}`);
  assert(cdp.networkErrors.length === 0, `network errors: ${cdp.networkErrors.join(' | ')}`);
  fs.writeFileSync(path.join(evidenceDir, 'runtime-states.json'), JSON.stringify(states, null, 2));
  console.log(`ENGRAVED DNA HERO BROWSER: PASS states=${states.length} evidence=${evidenceDir}`);
} finally {
  try { cdp?.socket?.close(); } catch {}
  browser.kill('SIGTERM');
  await delay(120);
  try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch {}
}
