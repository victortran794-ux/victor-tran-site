#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const root = process.cwd();
const baseUrl = process.env.SITE_URL || 'http://127.0.0.1:8898';
const evidenceDir = process.env.WXO_DOCUMENT_EVIDENCE_DIR || path.join(root, '.hermes', 'evidence', 'wxo-document-processing');
const chrome = [process.env.CHROME_BIN, '/home/victortran794/.agent-browser/browsers/chrome-149.0.7827.55/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium']
  .filter(Boolean).find((candidate) => fs.existsSync(candidate));
if (!chrome) throw new Error('Chrome binary not found; set CHROME_BIN');

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'wxo-document-browser-'));
const port = 9900 + (process.pid % 90);
let chromeLog = '';
const child = spawn(chrome, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  '--remote-allow-origins=*', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  '--window-size=1280,720', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });
child.stderr.on('data', (chunk) => { chromeLog += chunk.toString(); });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const parseRgb = (value) => (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
const relativeLuminance = (value) => {
  const [r, g, b] = parseRgb(value).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrastRatio = (foreground, background) => {
  const values = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
};
async function fetchJson(url) {
  const response = await fetch(url);
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
    } catch (error) { lastError = error; }
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
    this.consoleErrors = [];
    this.httpErrors = [];
    this.networkFailures = [];
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
      if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
        this.consoleErrors.push(message.params.args.map((arg) => arg.value || arg.description).join(' '));
      }
      if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) {
        const responseUrl = message.params.response.url;
        const localVercelInsights = baseUrl.startsWith('http://127.0.0.1:') &&
          responseUrl.startsWith(`${baseUrl}/_vercel/speed-insights/script.js`);
        if (!localVercelInsights) this.httpErrors.push(`${message.params.response.status} ${responseUrl}`);
      }
      if (message.method === 'Network.loadingFailed' && !message.params.canceled) {
        this.networkFailures.push(`${message.params.errorText} ${message.params.blockedReason || ''}`.trim());
      }
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
  async evaluate(expression) {
    const result = await this.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  }
  async navigate(url) {
    const loaded = this.event('Page.loadEventFired');
    await this.call('Page.navigate', { url });
    await loaded;
    await delay(180);
  }
  async reload() {
    const loaded = this.event('Page.loadEventFired');
    await this.call('Page.reload', { ignoreCache: true });
    await loaded;
    await delay(180);
  }
  async screenshot(fileName) {
    const result = await this.call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(evidenceDir, fileName), Buffer.from(result.data, 'base64'));
  }
  async key(key, code, virtualKeyCode, modifiers = 0) {
    const event = { key, code, windowsVirtualKeyCode: virtualKeyCode, nativeVirtualKeyCode: virtualKeyCode, modifiers };
    if (key === 'Enter') Object.assign(event, { text: '\r', unmodifiedText: '\r' });
    await this.call('Input.dispatchKeyEvent', { type: 'keyDown', ...event });
    await this.call('Input.dispatchKeyEvent', { type: 'keyUp', ...event });
    await delay(40);
  }
}

const pages = {
  wxo: { file: 'wxo-canvas.html', bodyClass: 'wxo-page', title: 'IBM watsonX Orchestrate', mainImages: 2, current: 'wxo-canvas.html' },
  doc: { file: 'document-processing.html', bodyClass: 'doc-processing-page', title: 'Document Processing', mainImages: 0, current: null },
};
const protectedPages = JSON.parse(fs.readFileSync(path.join(root, 'data', 'content-export-policy.json'), 'utf8'))
  .protectedPages.map(({ source }) => ({ file: source }));

let cdp;
try {
  fs.mkdirSync(evidenceDir, { recursive: true });
  cdp = new Cdp((await waitForTarget()).webSocketDebuggerUrl);
  await cdp.open();
  await cdp.call('Page.enable');
  await cdp.call('Runtime.enable');
  await cdp.call('Network.enable');

  let gateChecks = 0;
  for (const viewport of [
    { label: '1280', width: 1280, height: 720, mobile: false },
    { label: '390', width: 390, height: 844, mobile: true },
  ]) {
    await cdp.call('Emulation.setDeviceMetricsOverride', {
      width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile,
    });
    for (const spec of protectedPages) {
    await cdp.navigate(`${baseUrl}/${spec.file}`);
    await cdp.evaluate(`sessionStorage.removeItem('vtd-unlock')`);
    await cdp.reload();
    const gate = await cdp.evaluate(`({
      locked:document.documentElement.classList.contains('locked'),
      gate:Boolean(document.getElementById('vtd-gate')),
      dialog:document.querySelector('#vtd-gate [role="dialog"]')?.getAttribute('aria-modal'),
      labelledBy:document.querySelector('#vtd-gate [role="dialog"]')?.getAttribute('aria-labelledby'),
      titleId:document.querySelector('.vtd-gate-title')?.id,
      describedBy:document.querySelector('#vtd-gate [role="dialog"]')?.getAttribute('aria-describedby'),
      descriptionId:document.querySelector('.vtd-gate-body')?.id,
      errorLive:document.querySelector('.vtd-gate-error')?.getAttribute('aria-live'),
      backgroundInert:[...document.body.children].filter((element)=>element.id!=='vtd-gate').every((element)=>element.inert),
      focused:document.activeElement?.id,
      contentHidden:getComputedStyle(document.querySelector('main')).visibility==='hidden',
      viewport:[innerWidth,innerHeight],
      overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      cardRect:(()=>{const rect=document.querySelector('.vtd-gate-card').getBoundingClientRect();return {left:rect.left,right:rect.right,top:rect.top,width:rect.width}})()
    })`);
    assert(gate.locked && gate.gate && gate.dialog === 'true' && gate.labelledBy === gate.titleId &&
      gate.describedBy === gate.descriptionId &&
      gate.errorLive === 'assertive' && gate.backgroundInert && gate.focused === 'vtd-gate-input' && gate.contentHidden,
      `${spec.file}: password gate failed at ${viewport.label} ${JSON.stringify(gate)}`);
    assert(gate.viewport[0] === viewport.width && gate.viewport[1] === viewport.height && gate.overflow === 0 &&
      gate.cardRect.left >= 0 && gate.cardRect.right <= viewport.width,
      `${spec.file}: gate geometry failed at ${viewport.label} ${JSON.stringify(gate)}`);

    await cdp.key('Tab', 'Tab', 9);
    assert(await cdp.evaluate(`document.activeElement?.classList.contains('vtd-gate-submit')`),
      `${spec.file}: Tab from password input must focus Unlock`);
    const submitFocus = await cdp.evaluate(`(()=>{const style=getComputedStyle(document.activeElement);const surface=getComputedStyle(document.querySelector('.vtd-gate'));return {outlineStyle:style.outlineStyle,outlineWidth:style.outlineWidth,outlineColor:style.outlineColor,surface:surface.backgroundColor}})()`);
    assert(submitFocus.outlineStyle !== 'none' && parseFloat(submitFocus.outlineWidth) >= 2 &&
      contrastRatio(submitFocus.outlineColor, submitFocus.surface) >= 3,
      `${spec.file}: Unlock focus indicator must have 3:1 contrast at ${viewport.label} ${JSON.stringify(submitFocus)}`);
    await cdp.key('Tab', 'Tab', 9);
    const afterUnlockTab = await cdp.evaluate(`({tag:document.activeElement?.tagName,id:document.activeElement?.id,className:document.activeElement?.className,text:document.activeElement?.textContent?.trim()})`);
    assert(afterUnlockTab.tag === 'A' && afterUnlockTab.text?.includes('Back to portfolio'),
      `${spec.file}: Tab from Unlock must focus Back to portfolio ${JSON.stringify(afterUnlockTab)}`);
    await cdp.key('Tab', 'Tab', 9);
    assert(await cdp.evaluate(`document.activeElement?.tagName==='A'&&Boolean(document.activeElement.closest('.vtd-gate-body'))`),
      `${spec.file}: forward Tab must wrap from Back to portfolio to Email me`);
    await cdp.key('Tab', 'Tab', 9);
    assert(await cdp.evaluate(`document.activeElement?.id==='vtd-gate-input'`),
      `${spec.file}: Tab from Email me must focus the password input`);
    await cdp.key('Tab', 'Tab', 9, 8);
    assert(await cdp.evaluate(`document.activeElement?.tagName==='A'&&Boolean(document.activeElement.closest('.vtd-gate-body'))`),
      `${spec.file}: Shift+Tab from the password input must focus Email me without leaving the dialog`);
    const focusVisible = await cdp.evaluate(`(()=>{const style=getComputedStyle(document.activeElement);return {outlineStyle:style.outlineStyle,outlineWidth:style.outlineWidth}})()`);
    assert(focusVisible.outlineStyle !== 'none' && parseFloat(focusVisible.outlineWidth) >= 2,
      `${spec.file}: keyboard focus must remain visibly outlined at ${viewport.label} ${JSON.stringify(focusVisible)}`);

    await cdp.key('Tab', 'Tab', 9);
    await cdp.key('Escape', 'Escape', 27);
    const afterEscape = await cdp.evaluate(`({gate:Boolean(document.getElementById('vtd-gate')),focused:document.activeElement?.id})`);
    assert(afterEscape.gate && afterEscape.focused === 'vtd-gate-input',
      `${spec.file}: Escape must not bypass the protected gate ${JSON.stringify(afterEscape)}`);

    await cdp.call('Input.insertText', { text: 'definitely-wrong' });
    await cdp.key('Enter', 'Enter', 13);
    await delay(100);
    const invalid = await cdp.evaluate(`({
      hidden:document.querySelector('.vtd-gate-error').hidden,
      text:document.querySelector('.vtd-gate-error').textContent.trim(),
      focused:document.activeElement?.id,
      value:document.querySelector('#vtd-gate-input').value
    })`);
    assert(!invalid.hidden && invalid.text === 'Incorrect password. Try again.' &&
      invalid.focused === 'vtd-gate-input' && invalid.value === '',
      `${spec.file}: invalid password feedback failed ${JSON.stringify(invalid)}`);

    const expectedDigest = Array.from(Buffer.from('577ceca1249a0d345bbc81098c47abe8825294b2cb4724735403188a01a1ade1', 'hex'));
    await cdp.evaluate(`Object.defineProperty(crypto.subtle,'digest',{configurable:true,value:async()=>new Uint8Array(${JSON.stringify(expectedDigest)}).buffer})`);
    await cdp.call('Input.insertText', { text: 'accepted-by-test-digest' });
    await cdp.key('Enter', 'Enter', 13);
    await delay(380);
    const unlocked = await cdp.evaluate(`({
      locked:document.documentElement.classList.contains('locked'),
      gate:Boolean(document.getElementById('vtd-gate')),
      mainInert:document.querySelector('main').inert,
      focused:document.activeElement?.id
    })`);
    assert(!unlocked.locked && !unlocked.gate && !unlocked.mainInert && unlocked.focused === 'main-content',
      `${spec.file}: unlock must restore the underlay and focus main content ${JSON.stringify(unlocked)}`);
    gateChecks += 1;
    }
  }

  await cdp.navigate(`${baseUrl}/document-processing.html`);
  await cdp.evaluate(`sessionStorage.removeItem('vtd-unlock')`);
  await cdp.call('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 1, mobile: true,
  });
  await cdp.navigate(`${baseUrl}/wxo-canvas.html#document-processing`);
  const lockedDeepLink = await cdp.evaluate(`({
    locked:document.documentElement.classList.contains('locked'),
    gate:Boolean(document.getElementById('vtd-gate')),
    focused:document.activeElement?.id,
    scrollY,
    hash:location.hash,
    pendingHash:history.state?.vtdProtectedHash || null,
    historyLength:history.length
  })`);
  assert(lockedDeepLink.locked && lockedDeepLink.gate && lockedDeepLink.focused === 'vtd-gate-input' &&
    lockedDeepLink.scrollY === 0 && lockedDeepLink.hash === '' && lockedDeepLink.pendingHash === '#document-processing',
    `wxo-canvas.html: locked Document Processing deep link must preserve gate focus without fragment scrolling ${JSON.stringify(lockedDeepLink)}`);
  await cdp.screenshot('wxo-document-processing-390-locked-deep-link.png');

  await cdp.evaluate(`sessionStorage.setItem('vtd-unlock','ok')`);
  await cdp.reload();
  const restoredDeepLink = await cdp.evaluate(`({
    locked:document.documentElement.classList.contains('locked'),
    gate:Boolean(document.getElementById('vtd-gate')),
    hash:location.hash,
    pendingHash:history.state?.vtdProtectedHash || null,
    current:document.querySelector('.wxo-chapter-nav [aria-current="true"]')?.getAttribute('href'),
    canvas:!document.querySelector('#canvas').hidden,
    document:!document.querySelector('#document-processing').hidden,
    focused:document.activeElement?.id,
    scrollY,
    historyLength:history.length,
    viewportHeight:innerHeight,
    panelTop:document.querySelector('#document-processing').getBoundingClientRect().top,
    fixedBottom:Math.max(
      document.querySelector('.nav').getBoundingClientRect().bottom,
      document.querySelector('.site-route-status').getBoundingClientRect().bottom
    )
  })`);
  assert(!restoredDeepLink.locked && !restoredDeepLink.gate && restoredDeepLink.hash === '#document-processing' &&
    restoredDeepLink.pendingHash === null && restoredDeepLink.current === '#document-processing' &&
    !restoredDeepLink.canvas && restoredDeepLink.document && restoredDeepLink.focused === 'document-processing' &&
    restoredDeepLink.historyLength === lockedDeepLink.historyLength &&
    restoredDeepLink.scrollY > 0 && restoredDeepLink.panelTop >= restoredDeepLink.fixedBottom + 8 &&
    restoredDeepLink.panelTop <= restoredDeepLink.viewportHeight * 0.35,
    `wxo-canvas.html: unlocked Document Processing deep link must restore its chapter ${JSON.stringify(restoredDeepLink)}`);
  await cdp.screenshot('wxo-document-processing-390-restored-chapter.png');

  await cdp.navigate(`${baseUrl}/document-processing.html`);
  await cdp.evaluate(`sessionStorage.removeItem('vtd-unlock')`);
  await cdp.call('Emulation.setDeviceMetricsOverride', {
    width: 1280, height: 577, deviceScaleFactor: 1, mobile: false,
  });
  await cdp.navigate(`${baseUrl}/wxo-canvas.html#document-processing`);
  const lockedDesktopDeepLink = await cdp.evaluate(`({
    locked:document.documentElement.classList.contains('locked'),
    gate:Boolean(document.getElementById('vtd-gate')),
    focused:document.activeElement?.id,
    scrollY,
    hash:location.hash,
    pendingHash:history.state?.vtdProtectedHash || null,
    historyLength:history.length
  })`);
  assert(lockedDesktopDeepLink.locked && lockedDesktopDeepLink.gate &&
    lockedDesktopDeepLink.focused === 'vtd-gate-input' && lockedDesktopDeepLink.scrollY === 0 &&
    lockedDesktopDeepLink.hash === '' && lockedDesktopDeepLink.pendingHash === '#document-processing',
    `wxo-canvas.html: desktop locked Document Processing deep link failed ${JSON.stringify(lockedDesktopDeepLink)}`);
  await cdp.screenshot('wxo-document-processing-1280-locked-deep-link.png');

  await cdp.evaluate(`sessionStorage.setItem('vtd-unlock','ok')`);
  await cdp.reload();
  const restoredDesktopDeepLink = await cdp.evaluate(`({
    locked:document.documentElement.classList.contains('locked'),
    gate:Boolean(document.getElementById('vtd-gate')),
    hash:location.hash,
    pendingHash:history.state?.vtdProtectedHash || null,
    current:document.querySelector('.wxo-chapter-nav [aria-current="true"]')?.getAttribute('href'),
    canvas:!document.querySelector('#canvas').hidden,
    document:!document.querySelector('#document-processing').hidden,
    focused:document.activeElement?.id,
    scrollY,
    historyLength:history.length,
    viewportHeight:innerHeight,
    panelTop:document.querySelector('#document-processing').getBoundingClientRect().top,
    fixedBottom:Math.max(
      document.querySelector('.nav').getBoundingClientRect().bottom,
      document.querySelector('.site-route-status').getBoundingClientRect().bottom
    )
  })`);
  assert(!restoredDesktopDeepLink.locked && !restoredDesktopDeepLink.gate &&
    restoredDesktopDeepLink.hash === '#document-processing' && restoredDesktopDeepLink.pendingHash === null &&
    restoredDesktopDeepLink.current === '#document-processing' && !restoredDesktopDeepLink.canvas &&
    restoredDesktopDeepLink.document && restoredDesktopDeepLink.focused === 'document-processing' &&
    restoredDesktopDeepLink.historyLength === lockedDesktopDeepLink.historyLength &&
    restoredDesktopDeepLink.scrollY > 0 && restoredDesktopDeepLink.panelTop >= restoredDesktopDeepLink.fixedBottom + 8 &&
    restoredDesktopDeepLink.panelTop <= restoredDesktopDeepLink.viewportHeight * 0.35,
    `wxo-canvas.html: desktop unlocked Document Processing deep link failed ${JSON.stringify(restoredDesktopDeepLink)}`);
  await cdp.screenshot('wxo-document-processing-1280-restored-chapter.png');

  let checks = 0;
  let chapterChecks = 0;
  await cdp.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  for (const [name, spec] of Object.entries(pages)) {
    for (const viewport of [
      { label: '390', width: 390, height: 844, mobile: true },
      { label: '520', width: 520, height: 844, mobile: true },
      { label: '521', width: 521, height: 844, mobile: true },
      { label: '859', width: 859, height: 900, mobile: false },
      { label: '860', width: 860, height: 900, mobile: false },
      { label: '861', width: 861, height: 900, mobile: false },
      { label: '1280', width: 1280, height: 720, mobile: false },
    ]) {
      await cdp.call('Emulation.setDeviceMetricsOverride', {
        width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile,
      });
      for (const theme of ['light', 'dark']) {
        await cdp.navigate(`${baseUrl}/${spec.file}`);
        await cdp.evaluate(`localStorage.setItem('lens', ${JSON.stringify(theme)})`);
        await cdp.navigate(`${baseUrl}/${spec.file}`);
        if (viewport.mobile) {
          await cdp.evaluate(`document.querySelector('.nav-dropdown-toggle').click()`);
          await delay(60);
        }
        const state = await cdp.evaluate(`(async()=>{
          const images=[...document.querySelectorAll('main img')];
          images.forEach((image)=>{image.loading='eager'});
          await Promise.all(images.map(async(image)=>{try{await image.decode()}catch{}}));
          const video=document.querySelector('main video');
          if(video){video.preload='metadata';video.load();await Promise.race([new Promise((resolve)=>video.addEventListener('loadedmetadata',resolve,{once:true})),new Promise((resolve)=>setTimeout(resolve,3000))]);}
          const controls=[...document.querySelectorAll('.nav-logo,.nav-dropdown-toggle,.nav-links>li>a,.nav-dropdown-menu a,.nav-mobile-lens-btn,.footer-cta,.footer-social a,.footer-copy-email,.wxo-chapter-nav a,.workflow-companion-link a,.project-nav-item')]
            .filter((element)=>{const r=element.getBoundingClientRect();const s=getComputedStyle(element);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'})
            .map((element)=>{const r=element.getBoundingClientRect();return {label:element.getAttribute('aria-label')||element.textContent.trim().replace(/\\s+/g,' ').slice(0,60),width:r.width,height:r.height}});
          const status=document.querySelector('.site-route-status').getBoundingClientRect();
          const header=document.querySelector('.page-header .workflow-label').getBoundingClientRect();
          const chapterFirst=document.querySelector('.wxo-chapter-nav a')?.getBoundingClientRect();
          const contrastTarget=document.querySelector(${name === 'wxo' ? "'.wxo-chapter-nav a[aria-current=\"true\"]'" : "'.doc-loop span'"});
          const contrastSurface=document.querySelector(${name === 'wxo' ? "'.wxo-chapter-nav a[aria-current=\"true\"]'" : "'.doc-loop > div'"});
          return {
            viewport:[innerWidth,innerHeight], theme:document.documentElement.dataset.theme, stored:localStorage.getItem('lens'),
            overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
            bodyClass:document.body.className, title:document.title, mainId:document.querySelector('main')?.id,
            tabindex:document.querySelector('main')?.getAttribute('tabindex'), noindex:document.querySelector('meta[name="robots"]')?.content,
            current:document.querySelector('nav[aria-label="Primary"] [aria-current="page"]')?.getAttribute('href')||null,
            shell:Boolean(document.querySelector('nav.nav')&&document.querySelector('footer.footer')&&document.querySelector('.site-route-status')),
            gate:Boolean(document.getElementById('vtd-gate')), images:images.length,
            failedImages:images.filter((image)=>!image.complete||image.naturalWidth<=0).map((image)=>image.getAttribute('src')),
            videoReady:video?video.readyState:null, videoSources:video?[...video.querySelectorAll('source')].length:0,
            videoAutoplay:video?video.autoplay&&video.muted&&video.loop&&video.playsInline&&!video.controls:null,
            controls, statusDisplay:getComputedStyle(document.querySelector('.site-route-status')).display, statusPosition:getComputedStyle(document.querySelector('.site-route-status')).position, statusOverlap:!(status.right<=header.left||status.left>=header.right||status.bottom<=header.top||status.top>=header.bottom),
            statusChapterOverlap:chapterFirst?!(status.right<=chapterFirst.left||status.left>=chapterFirst.right||status.bottom<=chapterFirst.top||status.top>=chapterFirst.bottom):false,
            wxoCanvasVisible:!document.querySelector('#canvas')?.hidden,
            wxoDocumentVisible:!document.querySelector('#document-processing')?.hidden,
            wxoChapter:document.querySelector('.wxo-chapter-nav [aria-current="true"]')?.getAttribute('href'),
            wxoChapterPosition:document.querySelector('.wxo-chapter-nav')?getComputedStyle(document.querySelector('.wxo-chapter-nav')).position:null,
            wxoChapterRatio:(()=>{const links=[...document.querySelectorAll('.wxo-chapter-nav a')];if(links.length!==2)return null;return links[0].getBoundingClientRect().width/links[1].getBoundingClientRect().width})(),
            docLoop:document.querySelectorAll('.doc-loop>div').length,
            reduced:getComputedStyle(document.querySelector('.reveal')||document.body).transitionDuration,
            contrastForeground:getComputedStyle(contrastTarget).color,
            contrastBackground:getComputedStyle(contrastSurface).backgroundColor,
          };
        })()`);
        assert(state.viewport[0]===viewport.width&&state.viewport[1]===viewport.height, `${spec.file}: viewport drift expected=${viewport.width}x${viewport.height} actual=${state.viewport} state=${JSON.stringify(state)}`);
        assert((theme==='dark'?state.theme==='dark':!state.theme||state.theme==='light')&&state.stored===theme, `${spec.file}: ${theme} theme failed`);
        assert(state.overflow===0, `${spec.file}: ${state.overflow}px overflow at ${viewport.label} ${theme}`);
        assert(state.bodyClass.includes(spec.bodyClass)&&state.title.includes(spec.title), `${spec.file}: route identity failed`);
        assert(state.mainId==='main-content'&&state.tabindex==='-1'&&state.current===spec.current&&state.shell&&!state.gate, `${spec.file}: shared shell or unlocked state failed`);
        assert(state.noindex==='noindex,nofollow,noarchive,nosnippet,noimageindex', `${spec.file}: robots metadata drifted`);
        assert(state.images===spec.mainImages&&!state.failedImages.length, `${spec.file}: expected ${spec.mainImages} main images, got ${state.images}; failures ${JSON.stringify(state.failedImages)}`);
        if(name==='wxo') assert(state.statusDisplay==='none'&&state.wxoChapterPosition==='sticky'&&state.wxoChapterRatio>=2.9&&state.wxoChapterRatio<=3.1, `${spec.file}: hidden status or sticky 3:1 chapter selector failed ${JSON.stringify(state)}`);
        assert(!state.statusOverlap, `${spec.file}: protected status overlaps page header at ${viewport.label} ${theme}`);
        if(name==='wxo'&&viewport.mobile) assert(!state.statusChapterOverlap, `${spec.file}: protected status overlaps first chapter tab at ${viewport.label} ${theme}`);
        const ratio=contrastRatio(state.contrastForeground,state.contrastBackground);
        assert(ratio>=4.5, `${spec.file}: custom text contrast ${ratio.toFixed(2)}:1 failed at ${viewport.label} ${theme}`);
        assert(parseFloat(state.reduced)<=0.001, `${spec.file}: reduced-motion transition remained ${state.reduced} at ${viewport.label} ${theme}`);
        if(name==='wxo') assert(state.wxoCanvasVisible&&!state.wxoDocumentVisible&&state.wxoChapter==='#canvas', `wxo-canvas.html: default Canvas chapter failed ${JSON.stringify(state)}`);
        if(name==='doc') assert(state.docLoop===5&&state.videoReady>=1&&state.videoSources===2&&state.videoAutoplay, `document-processing.html: trust loop or autoplay video failed ${JSON.stringify(state)}`);
        if(viewport.mobile){
          const undersized=state.controls.filter((control)=>control.width<44||control.height<44);
          assert(!undersized.length, `${spec.file}: undersized mobile controls ${JSON.stringify(undersized)}`);
        }
        if(name==='wxo'&&viewport.label==='390'&&theme==='light'){
          await cdp.evaluate(`document.querySelector('.nav-dropdown-toggle').click();scrollTo(0,0)`);
          await delay(60);
          await cdp.screenshot('wxo-canvas-390-light-opening.png');
          await cdp.evaluate(`document.querySelector('[data-wxo-chapter="canvas"]').focus()`);
          await cdp.call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
          await cdp.call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
          const focusStyle=await cdp.evaluate(`(()=>{const link=document.querySelector('[data-wxo-chapter="document-processing"]');const style=getComputedStyle(link);return {active:document.activeElement===link,outlineStyle:style.outlineStyle,outlineWidth:style.outlineWidth,boxShadow:style.boxShadow}})()`);
          assert(focusStyle.active&&(focusStyle.outlineStyle!=='none'&&parseFloat(focusStyle.outlineWidth)>0||focusStyle.boxShadow!=='none'), `wxo-canvas.html: chapter link lacks visible keyboard focus ${JSON.stringify(focusStyle)}`);
          await cdp.call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
          await cdp.call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
          await delay(60);
          const documentChapter=await cdp.evaluate(`(async()=>{const panel=document.querySelector('#document-processing').getBoundingClientRect();const nav=document.querySelector('.nav').getBoundingClientRect();const status=document.querySelector('.site-route-status').getBoundingClientRect();const firstChapter=document.querySelector('.wxo-chapter-nav a');const firstChapterRect=firstChapter.getBoundingClientRect();const hit=document.elementFromPoint(Math.min(firstChapterRect.right-8,firstChapterRect.left+150),firstChapterRect.top+firstChapterRect.height/2);const images=[...document.querySelectorAll('#document-processing img')];await Promise.all(images.map(async(image)=>{try{await image.decode()}catch{}}));const video=document.querySelector('#document-processing video');if(video){video.load();await Promise.race([new Promise((resolve)=>video.addEventListener('loadedmetadata',resolve,{once:true})),new Promise((resolve)=>setTimeout(resolve,3000))]);}return {hash:location.hash,current:document.querySelector('.wxo-chapter-nav [aria-current="true"]')?.getAttribute('href'),canvas:!document.querySelector('#canvas').hidden,document:!document.querySelector('#document-processing').hidden,focused:document.activeElement?.id,panelTop:panel.top,fixedBottom:Math.max(nav.bottom,status.bottom),firstChapterRect:{left:firstChapterRect.left,right:firstChapterRect.right,top:firstChapterRect.top,bottom:firstChapterRect.bottom},statusRect:{left:status.left,right:status.right,top:status.top,bottom:status.bottom},hitTag:hit?.tagName,hitClass:hit?.className,firstChapterOccluded:!firstChapter.contains(hit),images:images.length,failedImages:images.filter((image)=>!image.complete||image.naturalWidth<=0).map((image)=>image.src),loop:document.querySelectorAll('#document-processing .doc-loop-item').length,decisions:document.querySelectorAll('#document-processing .doc-decision-card').length,roles:document.querySelectorAll('#document-processing .doc-role-card').length,videoReady:video?.readyState,videoSources:video?.querySelectorAll('source').length};})()`);
          assert(documentChapter.hash==='#document-processing'&&documentChapter.current==='#document-processing'&&!documentChapter.canvas&&documentChapter.document&&documentChapter.focused==='document-processing', `wxo-canvas.html: Document Processing keyboard chapter failed ${JSON.stringify(documentChapter)}`);
          assert(!documentChapter.firstChapterOccluded, `wxo-canvas.html: protected status occludes first chapter tab after chapter navigation ${JSON.stringify(documentChapter)}`);
          assert(documentChapter.images===0&&!documentChapter.failedImages.length&&documentChapter.loop===5&&documentChapter.decisions===4&&documentChapter.roles===4&&documentChapter.videoReady>=1&&documentChapter.videoSources===2, `wxo-canvas.html: consolidated Document Processing chapter failed ${JSON.stringify(documentChapter)}`);
          assert(documentChapter.panelTop>=documentChapter.fixedBottom+8, `wxo-canvas.html: focused Document Processing chapter is obscured by fixed UI ${JSON.stringify(documentChapter)}`);
          await cdp.screenshot('wxo-canvas-390-light-document-processing.png');

          await cdp.evaluate(`(()=>{const el=document.querySelector('#document-processing .doc-loop');scrollTo(0,el.getBoundingClientRect().top+scrollY-80)})()`);
          await delay(80);
          await cdp.screenshot('wxo-canvas-390-light-document-loop.png');
          await cdp.evaluate(`(()=>{const el=document.querySelector('#document-processing .wxo-doc-outcome');scrollTo(0,el.getBoundingClientRect().top+scrollY-80)})()`);
          await delay(80);
          await cdp.screenshot('wxo-canvas-390-light-document-outcome.png');
          await cdp.evaluate(`document.querySelector('[data-wxo-chapter="canvas"]').focus()`);
          await cdp.call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
          await cdp.call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
          await delay(60);
          const canvasChapter=await cdp.evaluate(`({hash:location.hash,current:document.querySelector('.wxo-chapter-nav [aria-current="true"]')?.getAttribute('href'),canvas:!document.querySelector('#canvas').hidden,document:!document.querySelector('#document-processing').hidden})`);
          assert(canvasChapter.hash==='#canvas'&&canvasChapter.current==='#canvas'&&canvasChapter.canvas&&!canvasChapter.document, `wxo-canvas.html: Canvas keyboard chapter failed ${JSON.stringify(canvasChapter)}`);
          chapterChecks+=1;
        }
        if(name==='wxo'&&viewport.label==='1280'&&theme==='dark'){
          await cdp.evaluate(`document.querySelector('#canvas .wxo-system-grid').scrollIntoView({block:'center',behavior:'instant'})`);
          await delay(80);
          await cdp.screenshot('wxo-canvas-1280-dark-canvas-system.png');
          await cdp.evaluate(`(()=>{document.querySelector('[data-wxo-chapter="document-processing"]').click();const frame=document.querySelector('#document-processing .doc-motion-frame');const navHeight=document.querySelector('.nav').getBoundingClientRect().height;const chapterHeight=document.querySelector('.wxo-chapter-nav').getBoundingClientRect().height;scrollTo({top:frame.getBoundingClientRect().top+scrollY-navHeight-chapterHeight-16,behavior:'instant'})})()`);
          await delay(120);
          await cdp.screenshot('wxo-canvas-1280-dark-document-media.png');
          await cdp.evaluate(`document.querySelector('#document-processing .doc-loop').scrollIntoView({block:'center',behavior:'instant'})`);
          await delay(80);
          await cdp.screenshot('wxo-canvas-1280-dark-document-loop.png');
          await cdp.evaluate(`document.querySelector('#document-processing .wxo-doc-outcome').scrollIntoView({block:'center',behavior:'instant'})`);
          await delay(80);
          await cdp.screenshot('wxo-canvas-1280-dark-document-outcome.png');
        }
        if(name==='doc'&&viewport.label==='390'&&theme==='light'){
          await cdp.evaluate(`document.querySelector('.nav-dropdown-toggle').click();scrollTo(0,0)`);
          await delay(60);
          await cdp.screenshot('document-processing-390-light-opening.png');
          await cdp.evaluate(`(async()=>{const video=document.querySelector('.doc-motion-frame video');await video.play();document.querySelector('[data-doc-motion-toggle]').focus()})()`);
          await cdp.key(' ', 'Space', 32);
          const pausedMotion=await cdp.evaluate(`(()=>{const video=document.querySelector('.doc-motion-frame video');const button=document.querySelector('[data-doc-motion-toggle]');const rect=button.getBoundingClientRect();const style=getComputedStyle(button);return {paused:video.paused,label:button.textContent.trim(),pressed:button.getAttribute('aria-pressed'),focused:document.activeElement===button,width:rect.width,height:rect.height,outlineStyle:style.outlineStyle,outlineWidth:style.outlineWidth}})()`);
          assert(pausedMotion.paused&&pausedMotion.label==='Play animation'&&pausedMotion.pressed==='true'&&pausedMotion.focused&&pausedMotion.width>=44&&pausedMotion.height>=44&&pausedMotion.outlineStyle!=='none'&&parseFloat(pausedMotion.outlineWidth)>0, `document-processing.html: keyboard motion pause control failed ${JSON.stringify(pausedMotion)}`);
          await cdp.key('Enter', 'Enter', 13);
          const resumedMotion=await cdp.evaluate(`(()=>{const video=document.querySelector('.doc-motion-frame video');const button=document.querySelector('[data-doc-motion-toggle]');return {paused:video.paused,label:button.textContent.trim(),pressed:button.getAttribute('aria-pressed')}})()`);
          assert(!resumedMotion.paused&&resumedMotion.label==='Pause animation'&&resumedMotion.pressed==='false', `document-processing.html: keyboard motion resume control failed ${JSON.stringify(resumedMotion)}`);
        }
        if(name==='doc'&&viewport.label==='1280'&&theme==='dark'){
          await cdp.evaluate(`document.querySelector('.doc-loop').scrollIntoView({block:'center',behavior:'instant'})`);
          await delay(80);
          await cdp.screenshot('document-processing-1280-dark-loop.png');
        }
        checks+=1;
      }
    }
  }
  assert(gateChecks === protectedPages.length * 2,
    `expected ${protectedPages.length * 2} protected-gate checks; found ${gateChecks}`);
  assert(chapterChecks===1, `expected one wxO interactive chapter check; found ${chapterChecks}`);
  assert(cdp.exceptions.length===0, `browser exceptions: ${JSON.stringify(cdp.exceptions)}`);
  assert(cdp.consoleErrors.length===0, `console errors: ${JSON.stringify(cdp.consoleErrors)}`);
  assert(cdp.httpErrors.length===0, `HTTP errors: ${JSON.stringify(cdp.httpErrors)}`);
  assert(cdp.networkFailures.length===0, `network failures: ${JSON.stringify(cdp.networkFailures)}`);
  console.log(`WXO + DOCUMENT PROCESSING BROWSER CHECK: PASS gates=${gateChecks} states=${checks} chapters=${chapterChecks} evidence=${evidenceDir}`);
} finally {
  try { cdp?.socket?.close(); } catch {}
  child.kill('SIGTERM');
  await Promise.race([new Promise((resolve)=>child.once('exit',resolve)),delay(1500)]);
  if(child.exitCode===null) child.kill('SIGKILL');
  try { fs.rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100}); } catch {}
}
