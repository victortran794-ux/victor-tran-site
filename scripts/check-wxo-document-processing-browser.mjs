#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const root = process.cwd();
const ownsServer = !process.env.SITE_URL;
const sitePort = 8800 + (process.pid % 800);
const baseUrl = process.env.SITE_URL || `http://127.0.0.1:${sitePort}`;
const evidenceDir = process.env.WXO_DOCUMENT_EVIDENCE_DIR || path.join(root, '.hermes', 'evidence', 'wxo-document-processing');
const chrome = [process.env.CHROME_BIN, '/home/victortran794/.agent-browser/browsers/chrome-149.0.7827.55/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium']
  .filter(Boolean).find((candidate) => fs.existsSync(candidate));
if (!chrome) throw new Error('Chrome binary not found; set CHROME_BIN');

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'wxo-document-browser-'));
const port = 9900 + (process.pid % 90);
let chromeLog = '';
let serverLog = '';
const server = ownsServer
  ? spawn('python3', ['-m', 'http.server', String(sitePort), '--bind', '127.0.0.1'], { cwd: root, stdio: ['ignore', 'ignore', 'pipe'] })
  : null;
server?.stderr.on('data', (chunk) => { serverLog += chunk.toString(); });
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

async function waitForSite() {
  if (!ownsServer) return;
  let lastError;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/wxo-canvas.html`);
      if (response.ok) return;
      lastError = new Error(`${response.status} ${baseUrl}/wxo-canvas.html`);
    } catch (error) { lastError = error; }
    if (server?.exitCode !== null) throw new Error(`Local server exited ${server.exitCode}: ${serverLog}`);
    await delay(100);
  }
  throw lastError || new Error(`Local server did not become ready at ${baseUrl}`);
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
    const loaded = this.event('Page.loadEventFired', 45000);
    await this.call('Page.navigate', { url });
    try {
      await loaded;
    } catch (error) {
      const state = await this.evaluate(`({ href: location.href, readyState: document.readyState })`);
      if (state.href !== url || state.readyState !== 'complete') {
        throw new Error(`${url}: ${error.message}; state=${JSON.stringify(state)}`);
      }
    }
    await delay(180);
  }
  async reload() {
    const loaded = this.event('Page.loadEventFired', 45000);
    await this.call('Page.reload', { ignoreCache: true });
    await loaded;
    await delay(180);
  }
  async screenshot(fileName) {
    const result = await this.call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(evidenceDir, fileName), Buffer.from(result.data, 'base64'));
  }
  async screenshotElement(selector, fileName) {
    const clip = await this.evaluate(`(()=>{const element=document.querySelector(${JSON.stringify(selector)});if(!element)return null;const rect=element.getBoundingClientRect();return {x:rect.left+scrollX,y:rect.top+scrollY,width:rect.width,height:rect.height,scale:1}})()`);
    if (!clip || clip.width <= 0 || clip.height <= 0) throw new Error(`Cannot capture missing or empty element: ${selector}`);
    const result = await this.call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip });
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
  wxo: { file: 'wxo-canvas.html', bodyClass: 'wxo-page', title: 'IBM watsonx Orchestrate', mainImages: 12, current: 'wxo-canvas.html?lock=1' },
  doc: { file: 'document-processing.html', bodyClass: 'doc-processing-page', title: 'Document Processing', mainImages: 13, current: null },
};
const protectedPages = JSON.parse(fs.readFileSync(path.join(root, 'data', 'content-export-policy.json'), 'utf8'))
  .protectedPages.map(({ source }) => ({ file: source }));

let cdp;
try {
  fs.mkdirSync(evidenceDir, { recursive: true });
  await waitForSite();
  cdp = new Cdp((await waitForTarget()).webSocketDebuggerUrl);
  await cdp.open();
  await cdp.call('Page.enable');
  await cdp.call('Runtime.enable');
  await cdp.call('Network.enable');
  await cdp.call('Network.setCacheDisabled', { cacheDisabled: true });

  let gateChecks = 0;
  for (const viewport of [
    { label: '1280', width: 1280, height: 720, mobile: false },
    { label: '390', width: 390, height: 844, mobile: true },
  ]) {
    await cdp.call('Emulation.setDeviceMetricsOverride', {
      width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile,
    });
    await cdp.navigate(`${baseUrl}/wxo-access.html?next=%2Fwxo-canvas`);
    const gate = await cdp.evaluate(`({
      dialog:document.querySelector('#vtd-gate [role="dialog"]')?.getAttribute('aria-modal'),
      labelledBy:document.querySelector('#vtd-gate [role="dialog"]')?.getAttribute('aria-labelledby'),
      titleId:document.querySelector('.vtd-gate-title')?.id,
      describedBy:document.querySelector('#vtd-gate [role="dialog"]')?.getAttribute('aria-describedby'),
      descriptionId:document.querySelector('.vtd-gate-body')?.id,
      errorLive:document.querySelector('.vtd-gate-error')?.getAttribute('aria-live'),
      errorHidden:document.querySelector('.vtd-gate-error')?.hidden,
      focused:document.activeElement?.id,
      method:document.querySelector('.vtd-gate-form')?.method,
      action:new URL(document.querySelector('.vtd-gate-form')?.action).pathname,
      next:document.querySelector('input[name="next"]')?.value,
      overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      card:(()=>{const r=document.querySelector('.vtd-gate-card').getBoundingClientRect();return {left:r.left,right:r.right}})()
    })`);
    assert(gate.dialog === 'true' && gate.labelledBy === gate.titleId && gate.describedBy === gate.descriptionId &&
      gate.errorLive === 'assertive' && gate.errorHidden && gate.focused === 'vtd-gate-input' && gate.method === 'post' &&
      gate.action === '/api/wxo-access' && gate.next === '/wxo-canvas' && gate.overflow === 0 &&
      gate.card.left >= 0 && gate.card.right <= viewport.width,
      `wxo-access.html: gate semantics or geometry failed at ${viewport.label} ${JSON.stringify(gate)}`);
    for (const expected of ['Unlock', 'Back to portfolio', 'Email me', 'vtd-gate-input']) {
      await cdp.key('Tab', 'Tab', 9);
      const focus = await cdp.evaluate(`({id:document.activeElement?.id,text:document.activeElement?.textContent?.trim()})`);
      assert(focus.id === expected || focus.text?.includes(expected),
        `wxo-access.html: focus order failed; expected ${expected}, got ${JSON.stringify(focus)}`);
    }
    await cdp.key('Escape', 'Escape', 27);
    assert(await cdp.evaluate(`document.activeElement?.id==='vtd-gate-input'`),
      'Escape must keep focus inside the public gate');
    await cdp.navigate(`${baseUrl}/wxo-access.html?next=%2Fwxo-canvas&error=1`);
    const invalid = await cdp.evaluate(`({hidden:document.querySelector('.vtd-gate-error').hidden,text:document.querySelector('.vtd-gate-error').textContent.trim(),focused:document.activeElement?.id})`);
    assert(!invalid.hidden && invalid.text === 'Incorrect password. Try again.' && invalid.focused === 'vtd-gate-input',
      `wxo-access.html: server-returned invalid state failed ${JSON.stringify(invalid)}`);
    gateChecks += 1;
  }

  let deepLinkChecks = 0;
  for (const viewport of [
    { label: '390', width: 390, height: 844, mobile: true },
    { label: '1280', width: 1280, height: 577, mobile: false },
  ]) {
    await cdp.call('Emulation.setDeviceMetricsOverride', {
      width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile,
    });
    await cdp.navigate(`${baseUrl}/wxo-canvas.html#document-processing`);
    const deepLink = await cdp.evaluate(`({
      path:location.pathname,
      heading:document.querySelector('h1')?.textContent.trim(),
      overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
    })`);
    assert(deepLink.path.endsWith('/document-processing.html')&&deepLink.heading==='Make the trust loop visible.'&&deepLink.overflow===0,
      `wxo-canvas.html: legacy Document Processing hash did not forward to the standalone route at ${viewport.label} ${JSON.stringify(deepLink)}`);
    await cdp.screenshot(`document-processing-${viewport.label}-legacy-hash-forward.png`);
    deepLinkChecks+=1;
  }

  let checks = 0;
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
      { label: '1600', width: 1600, height: 900, mobile: false },
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
          const controls=[...document.querySelectorAll('.nav-logo,.nav-dropdown-toggle,.nav-links>li>a,.nav-dropdown-menu a,.nav-mobile-lens-btn,.footer-cta,.footer-social a,.footer-copy-email,.pilot-main a,.pilot-main button,[data-wxo-evidence],.workflow-companion-link a,.project-nav-item')]
            .filter((element)=>{const r=element.getBoundingClientRect();const s=getComputedStyle(element);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'})
            .map((element)=>{const r=element.getBoundingClientRect();return {label:element.getAttribute('aria-label')||element.textContent.trim().replace(/\\s+/g,' ').slice(0,60),width:r.width,height:r.height}});
          const statusElement=document.querySelector('.site-route-status');
          const status=statusElement?.getBoundingClientRect();
          const heading=document.querySelector('.workflow-label')?.getBoundingClientRect();
          const candidateImages=[...document.querySelectorAll('.pilot-evidence img')];
          const expected=${JSON.stringify(name === 'wxo'
            ? [[3168,2084],[2944,1984],[3168,1800],[3168,1800],[3168,1800],[3780,884],[2952,1992],[2952,2712],[2600,276],[2992,2012]]
            : [[1024,664],[1024,780],[1024,674],[1024,674]])};
          const gridColumns=(selector)=>{const grid=document.querySelector(selector);return grid?getComputedStyle(grid).gridTemplateColumns.split(' ').length:null};
          const contrastTarget=document.querySelector(${name === 'wxo' ? "'.pilot-section-heading > div > p'" : "'.doc-feature-arc-intro > p:last-child'"});
          const contrastSurface=document.querySelector('body');
          return {
            viewport:[innerWidth,innerHeight],theme:document.documentElement.dataset.theme,stored:localStorage.getItem('lens'),
            overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
            bodyClass:document.body.className,title:document.title,mainId:document.querySelector('main')?.id,
            cssPageX:getComputedStyle(document.documentElement).getPropertyValue('--page-x').trim(),headerPadding:getComputedStyle(document.querySelector('.page-header')).paddingLeft,

            tabindex:document.querySelector('main')?.getAttribute('tabindex'),noindex:document.querySelector('meta[name="robots"]')?.content,
            current:document.querySelector('nav[aria-label="Primary"] [aria-current="page"]')?.getAttribute('href')||null,
            shell:Boolean(document.querySelector('nav.nav')&&document.querySelector('footer.footer')&&statusElement),gate:Boolean(document.getElementById('vtd-gate')),
            images:images.length,failedImages:images.filter((image)=>!image.complete||image.naturalWidth<=0).map((image)=>image.getAttribute('src')),
            controls,statusDisplay:statusElement?getComputedStyle(statusElement).display:null,
            statusOverlap:Boolean(status&&heading&&!(status.right<=heading.left||status.left>=heading.right||status.bottom<=heading.top||status.top>=heading.bottom)),
            candidateCount:candidateImages.length,
            candidateLoaded:candidateImages.length===expected.length&&candidateImages.every((image,index)=>image.complete&&image.naturalWidth===expected[index][0]&&image.naturalHeight===expected[index][1]),
            candidateTriggers:[...document.querySelectorAll('[data-wxo-evidence]')].map((trigger)=>({label:trigger.getAttribute('aria-label'),tag:trigger.tagName,type:trigger.type,src:trigger.querySelector('img')?.getAttribute('src')})),
            candidateActivity:document.querySelectorAll('.pilot-activity-frame').length,candidateExpansions:document.querySelectorAll('.pilot-expansion-frame').length,candidateDocs:document.querySelectorAll('.pilot-doc-frame').length,
            candidateSystemColumns:gridColumns('.pilot-system-grid'),candidateExpansionColumns:gridColumns('.pilot-expansion-grid'),
            activityStepColumns:[...document.querySelectorAll('.pilot-activity-epic .pilot-flow-step')].map((step)=>getComputedStyle(step).gridTemplateColumns.split(' ').length),
            docStepColumns:[...document.querySelectorAll('.pilot-doc-epic .pilot-flow-step')].map((step)=>getComputedStyle(step).gridTemplateColumns.split(' ').length),
            epicContainers:[...document.querySelectorAll('.pilot-epic-container')].map((container)=>{const r=container.getBoundingClientRect();const style=getComputedStyle(container);return {left:r.left,right:r.right,width:r.width,background:style.backgroundColor,backgroundImage:style.backgroundImage}}),
            stepArrows:[...document.querySelectorAll('.pilot-step-arrow')].map((arrow)=>{const r=arrow.getBoundingClientRect();const head=getComputedStyle(arrow,'::after');return {width:r.width,height:r.height,display:getComputedStyle(arrow).display,head:parseFloat(head.borderLeftWidth),headColor:head.borderTopColor}}),
            longArrowHeight:document.querySelector('.pilot-step-arrow--long')?.getBoundingClientRect().height||0,
            gallerySemantics:(()=>{const dialog=document.querySelector('[data-wxo-gallery]');return dialog?{tag:dialog.tagName,labelledBy:dialog.getAttribute('aria-labelledby'),titleId:dialog.querySelector('[data-wxo-gallery-title]')?.id,closeLabel:dialog.querySelector('.pilot-gallery-close')?.getAttribute('aria-label'),prev:Boolean(dialog.querySelector('[data-wxo-gallery-prev]')),next:Boolean(dialog.querySelector('[data-wxo-gallery-next]'))}:null})(),
            imageContainment:candidateImages.map((image)=>{const r=image.getBoundingClientRect();const b=image.closest('button').getBoundingClientRect();return {ratio:r.width/r.height,natural:image.naturalWidth/image.naturalHeight,inside:r.left>=b.left-1&&r.right<=b.right+1&&r.top>=b.top-1&&r.bottom<=b.bottom+1}}),
            candidateVignette:(()=>{const image=document.querySelector('.pilot-vignettes img');const main=document.querySelector('.pilot-story');if(!image||!main)return null;const r=image.getBoundingClientRect(),m=main.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,container:m.width,center:(r.left+r.right)/2,railCenter:(m.left+m.right)/2}})(),
            heroOrbit:(()=>{const orbit=document.querySelector('.pilot-hero-aside .wxo-orbits');const hero=document.querySelector('.pilot-hero');if(!orbit||!hero)return null;const r=orbit.getBoundingClientRect(),h=hero.getBoundingClientRect(),s=getComputedStyle(orbit);return {dots:orbit.querySelectorAll(':scope > span').length,left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,heroLeft:h.left,heroRight:h.right,heroTop:h.top,heroBottom:h.bottom,background:s.backgroundImage}})(),
            canvasOpening:(()=>{const root=document.querySelector('.pilot-canvas-opening');const copy=root?.querySelector('.pilot-section-heading');const image=root?.querySelector('.pilot-main-illustration');if(!root||!copy||!image)return null;const rr=root.getBoundingClientRect(),cr=copy.getBoundingClientRect(),ir=image.getBoundingClientRect();return {columns:getComputedStyle(root).gridTemplateColumns.split(' ').length,left:rr.left,right:rr.right,copyRight:cr.right,imageLeft:ir.left}})(),
            evolutionPrimary:[...document.querySelectorAll('.pilot-evolution-primary')].map((node)=>{const r=node.getBoundingClientRect(),m=document.querySelector('.pilot-story').getBoundingClientRect();return {left:r.left,right:r.right,center:(r.left+r.right)/2,railCenter:(m.left+m.right)/2}}),
            flowComposition:(()=>{const root=document.querySelector('.pilot-flow-control-composition');if(!root)return null;const r=root.getBoundingClientRect();const boxes=[...root.querySelectorAll('.pilot-expansion-frame')].map((node)=>{const b=node.getBoundingClientRect();return {className:node.className,left:b.left,right:b.right,center:(b.left+b.right)/2}});return {left:r.left,right:r.right,center:(r.left+r.right)/2,columns:getComputedStyle(root).gridTemplateColumns.split(' ').length,boxes}})(),
            canvasReturn:(()=>{const links=[...document.querySelectorAll('main a[href="wxo-canvas.html"]')];const close=document.querySelector('.workflow-close')?.getBoundingClientRect();const finalLink=links.at(-1);const arrow=finalLink?.querySelector('span[aria-hidden="true"]');let arrowGap=null;if(finalLink?.firstChild&&arrow){const range=document.createRange();range.selectNodeContents(finalLink.firstChild);arrowGap=arrow.getBoundingClientRect().left-range.getBoundingClientRect().right;}return {count:links.length,arrowGap,finalInside:Boolean(close&&finalLink&&(()=>{const r=finalLink.getBoundingClientRect();return r.top>=close.top&&r.bottom<=close.bottom})())}})(),
            outlinedPilotFrames:[...document.querySelectorAll('.pilot-activity-frame .pilot-image-button, .pilot-doc-frame .pilot-image-button')].map((node)=>{const s=getComputedStyle(node);return {radius:parseFloat(s.borderTopLeftRadius),overflow:s.overflow,border:parseFloat(s.borderTopWidth)}}),
            bridgeThumbnail:(()=>{const node=document.querySelector('.pilot-bridge-thumbnail');const image=node?.querySelector('img');if(!node||!image)return null;const r=node.getBoundingClientRect();const s=getComputedStyle(node);return {left:r.left,right:r.right,radius:parseFloat(s.borderTopLeftRadius),overflow:s.overflow,loaded:image.complete&&image.naturalWidth>0}})(),
            currentFrameRadii:[...document.querySelectorAll('.doc-current-frame img')].map((node)=>{const s=getComputedStyle(node);return [s.borderTopLeftRadius,s.borderTopRightRadius,s.borderBottomRightRadius,s.borderBottomLeftRadius].map(parseFloat)}),
            motionFrameRadius:(()=>{const node=document.querySelector('.doc-motion-frame');if(!node)return null;const s=getComputedStyle(node);return {radius:parseFloat(s.borderTopLeftRadius),overflow:s.overflow}})(),
            currentPairGeometry:[...document.querySelectorAll('.doc-current-pair, .doc-current-evaluator-grid')].map((node)=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width}}),
            spineGeometry:(()=>{const left=(selector)=>document.querySelector(selector)?.getBoundingClientRect().left??null;const lefts=(selector)=>[...document.querySelectorAll(selector)].map((node)=>node.getBoundingClientRect().left);return {
              heroLabel:left('.page-header > .workflow-label'),heroTitle:left('.page-header-title'),
              storyOuter:left('.pilot-story'),chapterIndexOuter:left('.pilot-chapter-index'),
              sectionLabels:lefts('.pilot-section-heading > .workflow-label'),sectionTitles:lefts('.pilot-section-heading h2'),
              bridgeOuter:left('.pilot-side-quest-bridge'),bridgeLabel:left('.pilot-side-quest-bridge > .workflow-label'),bridgeTitle:left('.pilot-side-quest-bridge h2'),
              closeLabel:left('.pilot-close > .workflow-label'),closeTitle:left('.pilot-close h2'),
              chapterLabels:lefts('.workflow-chapter-head > .workflow-label'),chapterTitles:lefts('.workflow-chapter-head h2'),
              chapterBody:lefts('.workflow-chapter > p'),featureIntro:left('.doc-feature-arc-intro'),docEpicOuter:left('.pilot-doc-epic')
            }})(),
            currentStages:document.querySelectorAll('.doc-current-stage').length,currentFrames:document.querySelectorAll('.doc-current-frame').length,
            currentFramesLoaded:[...document.querySelectorAll('.doc-current-frame img')].every((image)=>image.complete&&image.naturalWidth===1024&&[664,674,780].includes(image.naturalHeight)),
            currentStoryGeometry:(()=>{const story=document.querySelector('.doc-current-story');if(!story||story.getClientRects().length===0)return null;const rect=story.getBoundingClientRect();return {left:rect.left,right:rect.right,width:rect.width}})(),
            currentPairColumns:[...document.querySelectorAll('.doc-current-pair')].filter((pair)=>pair.getClientRects().length).map((pair)=>getComputedStyle(pair).gridTemplateColumns.split(' ').length),
            currentEvaluatorColumns:[...document.querySelectorAll('.doc-current-evaluator-grid')].filter((grid)=>grid.getClientRects().length).map((grid)=>getComputedStyle(grid).gridTemplateColumns.split(' ').length),
            videoReady:video?video.readyState:null,videoSources:video?[...video.querySelectorAll('source')].length:0,videoAutoplay:video?video.autoplay&&video.muted&&video.loop&&video.playsInline&&!video.controls:null,
            docLoop:document.querySelectorAll('.doc-loop>div').length,endingGrids:document.querySelectorAll('.doc-ending-grid').length,decisionRows:document.querySelectorAll('.doc-decision-row').length,contributionRows:document.querySelectorAll('.doc-contribution-row').length,
            reduced:getComputedStyle(document.querySelector('.reveal')||document.body).transitionDuration,
            contrastForeground:getComputedStyle(contrastTarget).color,contrastBackground:getComputedStyle(contrastSurface).backgroundColor,
            epicLabelColor:getComputedStyle(document.querySelector('.pilot-epic-label')).color,
          };
        })()`);
        assert(Math.abs(state.viewport[0]-viewport.width)<=3&&Math.abs(state.viewport[1]-viewport.height)<=5,`${spec.file}: viewport drift ${JSON.stringify(state)}`);
        assert((theme==='dark'?state.theme==='dark':!state.theme||state.theme==='light')&&state.stored===theme,`${spec.file}: ${theme} theme failed`);
        assert(state.overflow===0,`${spec.file}: ${state.overflow}px overflow at ${viewport.label} ${theme}`);
        assert(state.bodyClass.includes(spec.bodyClass)&&state.title.includes(spec.title)&&state.mainId==='main-content'&&state.tabindex==='-1'&&state.current===spec.current&&state.shell&&!state.gate,`${spec.file}: route identity, shell, or unlocked state failed ${JSON.stringify(state)}`);
        assert(state.noindex==='noindex,nofollow,noarchive,nosnippet,noimageindex',`${spec.file}: robots metadata drifted`);
        assert(state.images===spec.mainImages&&!state.failedImages.length,`${spec.file}: image count or decode failed ${JSON.stringify(state)}`);
        assert(!state.statusOverlap,`${spec.file}: protected status overlaps opening label`);
        const ratio=contrastRatio(state.contrastForeground,state.contrastBackground);
        assert(ratio>=4.5,`${spec.file}: custom text contrast ${ratio.toFixed(2)}:1 failed at ${viewport.label} ${theme}`);
        const expectedEpicLabel=name==='wxo'?(theme==='dark'?'rgb(66, 190, 101)':'rgb(22, 119, 77)'):(theme==='dark'?'rgb(120, 169, 255)':'rgb(0, 67, 206)');
        const epicSurface=name==='wxo'?(theme==='dark'?'rgb(16, 39, 29)':'rgb(223, 244, 232)'):(theme==='dark'?'rgb(24, 24, 24)':'rgb(246, 246, 244)');
        const epicRatio=contrastRatio(state.epicLabelColor,epicSurface);
        assert(state.epicLabelColor===expectedEpicLabel&&epicRatio>=4.5,`${spec.file}: epic label color/contrast ${state.epicLabelColor} ${epicRatio.toFixed(2)}:1 failed at ${viewport.label} ${theme}`);
        assert(parseFloat(state.reduced)<=0.001,`${spec.file}: reduced-motion transition remained ${state.reduced}`);
        const evidenceNarrow=viewport.width<=860;
        assert(state.gallerySemantics?.tag==='DIALOG'&&state.gallerySemantics.labelledBy===state.gallerySemantics.titleId&&state.gallerySemantics.closeLabel==='Close image viewer'&&state.gallerySemantics.prev&&state.gallerySemantics.next,`${spec.file}: evidence carousel semantics failed ${JSON.stringify(state.gallerySemantics)}`);
        assert(state.candidateTriggers.every(({label,tag,type,src})=>label?.startsWith('Open ')&&tag==='BUTTON'&&type==='button'&&src?.startsWith('protected/wxo/assets/public-candidate/')),`${spec.file}: in-window evidence triggers failed ${JSON.stringify(state.candidateTriggers)}`);
        assert(state.imageContainment.every(({ratio,natural,inside})=>inside&&Math.abs(ratio-natural)<0.015),`${spec.file}: evidence containment or aspect ratio failed ${JSON.stringify(state.imageContainment)}`);
        if(name==='wxo'){
          const systemNarrow=viewport.width<=860;
          const expectedOuter=(viewport.width-Math.min(viewport.width,1200))/2;
          const expectedText=expectedOuter+(viewport.width<=600?20:viewport.width<=900?24:48);
          const visualOverhang=viewport.width>=1440?Math.min(viewport.width*.08,(viewport.width-1200)/3):0;
          const near=(value,target)=>value!==null&&Math.abs(value-target)<=2;
          const primarySpine=[state.spineGeometry.heroLabel,state.spineGeometry.heroTitle,...state.spineGeometry.sectionLabels,state.spineGeometry.bridgeLabel,state.spineGeometry.closeLabel,state.spineGeometry.closeTitle];
          assert(primarySpine.every((left)=>near(left,expectedText)),`${spec.file}: primary text spine drifted at ${viewport.label} ${JSON.stringify({expectedText,spines:state.spineGeometry})}`);
          assert([state.spineGeometry.storyOuter,state.spineGeometry.chapterIndexOuter].every((left)=>near(left,expectedOuter)),`${spec.file}: outer story field rail drifted at ${viewport.label} ${JSON.stringify({expectedOuter,spines:state.spineGeometry})}`);
          const bridgeBleed=Math.max(0,(viewport.width-1200)/2);
          assert(near(state.spineGeometry.bridgeOuter,expectedOuter-bridgeBleed),`${spec.file}: full-span bridge field rail drifted at ${viewport.label} ${JSON.stringify({expectedOuter,bridgeBleed,spines:state.spineGeometry})}`);
          if(viewport.width<=1000){
            assert([...state.spineGeometry.sectionTitles,state.spineGeometry.bridgeTitle].every((left)=>near(left,expectedText)),`${spec.file}: stacked chapter text must return to the primary rail at ${viewport.label} ${JSON.stringify(state.spineGeometry)}`);
          }else{
            const [openingTitle,...chapterTitles]=state.spineGeometry.sectionTitles;
            assert(near(openingTitle,expectedText)&&chapterTitles.every((left)=>near(left,state.spineGeometry.bridgeTitle)),`${spec.file}: desktop opening copy and later chapter rails must align ${JSON.stringify(state.spineGeometry)}`);
          }
          assert(state.candidateCount===10&&state.candidateLoaded&&state.candidateActivity===3&&state.candidateExpansions===4&&state.candidateDocs===0,`${spec.file}: approved ten-image umbrella narrative or native dimensions failed ${JSON.stringify(state)}`);
          assert(state.candidateTriggers.length===10&&state.imageContainment.length===10,`${spec.file}: umbrella carousel evidence count failed`);
          assert(state.candidateSystemColumns===(systemNarrow?1:2)&&state.candidateExpansionColumns===(evidenceNarrow?1:12)&&state.activityStepColumns.length===3&&state.activityStepColumns.every((columns)=>columns===(evidenceNarrow?1:12))&&state.docStepColumns.length===0,`${spec.file}: responsive umbrella grids failed at ${viewport.label} ${JSON.stringify(state)}`);
          assert(state.epicContainers.length===1&&state.epicContainers.every(({left,right,width,background,backgroundImage})=>left>=-1&&right<=viewport.width+1&&width>0&&(background!=='rgba(0, 0, 0, 0)'||backgroundImage!=='none')),`${spec.file}: User Activity epic containment failed ${JSON.stringify(state.epicContainers)}`);
          assert(state.stepArrows.length===2&&state.stepArrows.every(({width,height,display,head})=>width>=5&&height>20&&head>=10&&display!=='none')&&!state.longArrowHeight,`${spec.file}: substantial User Activity progression arrows failed ${JSON.stringify(state.stepArrows)}`);
          assert(state.heroOrbit&&state.heroOrbit.dots===3&&Math.abs(state.heroOrbit.width-state.heroOrbit.height)<=2&&state.heroOrbit.width>=140&&state.heroOrbit.left>=state.heroOrbit.heroLeft&&state.heroOrbit.right<=state.heroOrbit.heroRight&&state.heroOrbit.top>=state.heroOrbit.heroTop&&state.heroOrbit.bottom<=state.heroOrbit.heroBottom&&state.heroOrbit.background!=='none',`${spec.file}: original three-dot hero orbital failed ${JSON.stringify(state.heroOrbit)}`);
          assert(state.canvasOpening&&state.canvasOpening.columns===(viewport.width<=1000?1:2)&&state.canvasOpening.left>=0&&state.canvasOpening.right<=viewport.width&&(viewport.width<=1000||state.canvasOpening.copyRight<state.canvasOpening.imageLeft),`${spec.file}: side-by-side Canvas opening failed ${JSON.stringify(state.canvasOpening)}`);
          assert(state.candidateVignette&&state.candidateVignette.width>=state.candidateVignette.container*.98&&Math.abs(state.candidateVignette.center-state.candidateVignette.railCenter)<=2&&state.candidateVignette.left>=-1&&state.candidateVignette.right<=viewport.width+1,`${spec.file}: later illustration vignette must remain centered across the full evidence rail ${JSON.stringify(state.candidateVignette)}`);
          assert(state.evolutionPrimary.length===2&&state.evolutionPrimary.every(({left,right,center,railCenter})=>left>=-1&&right<=viewport.width+1&&Math.abs(center-railCenter)<=2),`${spec.file}: Agent and Workflow detail boards must remain centered ${JSON.stringify(state.evolutionPrimary)}`);
          assert(state.flowComposition&&state.flowComposition.columns===(evidenceNarrow?1:12)&&state.flowComposition.boxes.length===2&&state.flowComposition.boxes.every(({left,right})=>left>=-1&&right<=viewport.width+1),`${spec.file}: Flow Controls composition or Node States containment failed ${JSON.stringify(state.flowComposition)}`);
          if(!evidenceNarrow){const centered=state.flowComposition.boxes.filter(({className})=>/pilot-study--nodes|pilot-flow-control-primary/.test(className));assert(centered.length===2&&centered.every(({center})=>Math.abs(center-state.flowComposition.center)<=2),`${spec.file}: node states and Flow Controls must anchor the centered composition ${JSON.stringify(centered)}`);}
          assert(state.outlinedPilotFrames.length===3&&state.outlinedPilotFrames.every(({radius,overflow,border})=>radius>=13&&overflow==='hidden'&&border>=1),`${spec.file}: User Activity screens must use complete outlined rounded frames ${JSON.stringify(state.outlinedPilotFrames)}`);
          assert(state.bridgeThumbnail?.loaded&&state.bridgeThumbnail.radius>=13&&state.bridgeThumbnail.overflow==='hidden'&&state.bridgeThumbnail.left>=0&&state.bridgeThumbnail.right<=viewport.width,`${spec.file}: Document Processing handoff thumbnail failed ${JSON.stringify(state.bridgeThumbnail)}`);
        }
        if(name==='doc'){
          const expectedOuter=(viewport.width-Math.min(viewport.width,1200))/2;
          const expectedText=expectedOuter+(viewport.width<=600?20:viewport.width<=900?24:48);
          const visualOverhang=viewport.width>=1440?Math.min(viewport.width*.08,(viewport.width-1200)/3):0;
          const safeSpines=[state.spineGeometry.heroLabel,state.spineGeometry.heroTitle,...state.spineGeometry.chapterLabels,...state.spineGeometry.chapterBody,state.spineGeometry.featureIntro].filter((left)=>left!==null);
          assert(safeSpines.every((left)=>left>=expectedText-3),`${spec.file}: text or evidence field crossed the protected left gutter at ${viewport.label} ${JSON.stringify({expectedText,cssPageX:state.cssPageX,headerPadding:state.headerPadding,spines:state.spineGeometry})}`);
          assert(Math.abs(state.spineGeometry.heroLabel-expectedText)<=3&&state.spineGeometry.chapterLabels.every((left)=>Math.abs(left-expectedText)<=2),`${spec.file}: header and chapter labels must share the primary text spine ${JSON.stringify(state.spineGeometry)}`);
          assert(Math.abs(state.spineGeometry.docEpicOuter-(expectedText-visualOverhang))<=2,`${spec.file}: standalone feature evidence overhang drifted ${JSON.stringify({expectedText,visualOverhang,spines:state.spineGeometry})}`);
          assert(state.candidateCount===4&&state.candidateLoaded&&state.candidateDocs===4&&state.candidateTriggers.length===4&&state.imageContainment.length===4,`${spec.file}: standalone four-board feature arc failed ${JSON.stringify(state)}`);
          assert(state.docStepColumns.length===4&&state.docStepColumns.every((columns)=>columns===(evidenceNarrow?1:12)),`${spec.file}: standalone feature arc responsive grid failed ${JSON.stringify(state.docStepColumns)}`);
          assert(state.epicContainers.length===1&&state.epicContainers.every(({left,right,width,background,backgroundImage})=>left>=-1&&right<=viewport.width+1&&width>0&&(background!=='rgba(0, 0, 0, 0)'||backgroundImage!=='none')),`${spec.file}: standalone feature arc containment failed ${JSON.stringify(state.epicContainers)}`);
          assert(state.stepArrows.length===3&&state.stepArrows.every(({width,height,display,head})=>width>=5&&height>20&&head>=10&&display!=='none')&&!state.longArrowHeight,`${spec.file}: contained standalone feature arrows failed ${JSON.stringify({arrows:state.stepArrows,long:state.longArrowHeight})}`);
          assert(state.currentStages===4&&state.currentFrames===9&&state.currentFramesLoaded&&state.currentStoryGeometry&&state.currentStoryGeometry.left>=0&&state.currentStoryGeometry.right<=viewport.width,`${spec.file}: current four-stage evidence story failed ${JSON.stringify(state)}`);
          assert(state.outlinedPilotFrames.length===4&&state.outlinedPilotFrames.every(({radius,overflow,border})=>radius>=13&&overflow==='hidden'&&border>=1),`${spec.file}: Document Processing feature screens must use complete outlined rounded frames ${JSON.stringify(state.outlinedPilotFrames)}`);
          assert(state.currentFrameRadii.length===9&&state.currentFrameRadii.every((corners)=>corners.every((radius)=>radius>=13)),`${spec.file}: current screens must round all four corners consistently ${JSON.stringify(state.currentFrameRadii)}`);
          assert(state.motionFrameRadius?.radius>=13&&state.motionFrameRadius.overflow==='hidden',`${spec.file}: motion screen must round and clip all corners ${JSON.stringify(state.motionFrameRadius)}`);
          if(viewport.width>=1440) assert(state.currentPairGeometry.length===3&&state.currentPairGeometry.every(({right})=>right>state.currentStoryGeometry.right+100&&right<=viewport.width),`${spec.file}: paired current screens must expand across the wider evidence rail ${JSON.stringify({story:state.currentStoryGeometry,pairs:state.currentPairGeometry})}`);
          assert(state.currentPairColumns.every((columns)=>columns===(viewport.width<=860?1:2))&&state.currentEvaluatorColumns.every((columns)=>columns===(viewport.width<=860?1:2)),`${spec.file}: current evidence responsive geometry failed ${JSON.stringify(state)}`);
          assert(state.docLoop===0&&state.endingGrids===0&&state.decisionRows===0&&state.contributionRows===0&&state.videoReady>=1&&state.videoSources===2&&state.videoAutoplay,`${spec.file}: redundant section removal or autoplay video failed ${JSON.stringify(state)}`);
          assert(state.canvasReturn.count===2&&state.canvasReturn.finalInside&&state.canvasReturn.arrowGap>=4,`${spec.file}: opening and closing return paths or final arrow spacing failed ${JSON.stringify(state.canvasReturn)}`);
        }
        if(viewport.mobile){const undersized=state.controls.filter((control)=>control.width<44||control.height<44);assert(!undersized.length,`${spec.file}: undersized mobile controls ${JSON.stringify(undersized)}`);}
        if(name==='wxo'&&viewport.label==='390'&&theme==='light'){
          await cdp.evaluate(`document.querySelector('.nav-dropdown-toggle').click();scrollTo(0,0)`);await delay(60);await cdp.screenshot('wxo-canvas-390-light-opening.png');
          await cdp.screenshotElement('.pilot-hero','wxo-canvas-390-light-hero-full.png');
          for(const [selector,fileName] of [['.pilot-main-illustration','wxo-canvas-390-light-main-illustration.png'],['.pilot-system-grid','wxo-canvas-390-light-system.png'],['.pilot-activity-epic','wxo-canvas-390-light-user-activity.png'],['.pilot-vignettes','wxo-canvas-390-light-vignettes.png'],['.pilot-side-quest-bridge','wxo-canvas-390-light-document-processing-bridge.png'],['.pilot-expansion-grid','wxo-canvas-390-light-expansions.png']]){await cdp.evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});scrollTo({top:el.getBoundingClientRect().top+scrollY-84,behavior:'instant'})})()`);await delay(80);await cdp.screenshot(fileName);}
          await cdp.screenshotElement('.pilot-flow-control-composition','wxo-canvas-390-light-flow-control-composition-full.png');
          await cdp.evaluate(`(()=>{const trigger=document.querySelectorAll('[data-wxo-evidence]')[0];trigger.dataset.originalTitle=trigger.dataset.title;trigger.dataset.title='AgentCanvasOrchestrationVocabularyForComplexHumanAndAutomatedWorkflowRelationshipsWithoutWhitespace';trigger.click()})()`);await delay(100);
          const longTitleMobile=await cdp.evaluate(`(()=>{const d=document.querySelector('[data-wxo-gallery]'),layout=d.querySelector('.pilot-gallery-layout'),details=d.querySelector('.pilot-gallery-details'),title=d.querySelector('[data-wxo-gallery-title]'),close=d.querySelector('.pilot-gallery-close');const dr=d.getBoundingClientRect(),cr=close.getBoundingClientRect(),style=getComputedStyle(title);return {documentOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,dialogOverflow:d.scrollWidth-d.clientWidth,layoutOverflow:layout.scrollWidth-layout.clientWidth,detailsOverflow:details.scrollWidth-details.clientWidth,titleOverflow:title.scrollWidth-title.clientWidth,dialogLeft:dr.left,dialogRight:dr.right,closeLeft:cr.left,closeRight:cr.right,titleWrap:style.overflowWrap,titleFont:parseFloat(style.fontSize)}})()`);
          assert(longTitleMobile.documentOverflow===0&&longTitleMobile.dialogOverflow===0&&longTitleMobile.layoutOverflow===0&&longTitleMobile.detailsOverflow===0&&longTitleMobile.titleOverflow===0&&longTitleMobile.dialogLeft>=0&&longTitleMobile.dialogRight<=viewport.width&&longTitleMobile.closeLeft>=longTitleMobile.dialogLeft&&longTitleMobile.closeRight<=longTitleMobile.dialogRight&&longTitleMobile.titleWrap==='anywhere'&&longTitleMobile.titleFont<=32,`wxo-canvas.html: mobile long gallery title overflowed or remained oversized ${JSON.stringify(longTitleMobile)}`);
          await cdp.screenshot('wxo-canvas-390-light-gallery-long-title.png');
          await cdp.key('Escape','Escape',27);await delay(60);
          await cdp.evaluate(`(()=>{const trigger=document.querySelectorAll('[data-wxo-evidence]')[0];trigger.dataset.title=trigger.dataset.originalTitle;delete trigger.dataset.originalTitle;trigger.click()})()`);await delay(100);
          const galleryOpen=await cdp.evaluate(`(async()=>{const d=document.querySelector('[data-wxo-gallery]');const i=d.querySelector('[data-wxo-gallery-image]');try{await i.decode()}catch{}const r=i.getBoundingClientRect();const s=d.querySelector('.pilot-gallery-stage').getBoundingClientRect();return {open:d.open,body:document.body.classList.contains('wxo-gallery-open'),count:d.querySelector('[data-wxo-gallery-count]').textContent.trim(),title:d.querySelector('[data-wxo-gallery-title]').textContent.trim(),loaded:i.complete&&i.naturalWidth>0,contained:r.left>=s.left&&r.right<=s.right&&r.top>=s.top&&r.bottom<=s.bottom,focus:document.activeElement===d.querySelector('.pilot-gallery-close')}})()`);
          assert(galleryOpen.open&&galleryOpen.body&&galleryOpen.count==='01 / 10'&&galleryOpen.title==='Released canvas'&&galleryOpen.loaded&&galleryOpen.contained&&galleryOpen.focus,`wxo-canvas.html: mobile gallery open failed ${JSON.stringify(galleryOpen)}`);
          await cdp.key('ArrowRight','ArrowRight',39);
          const galleryNext=await cdp.evaluate(`({count:document.querySelector('[data-wxo-gallery-count]').textContent.trim(),title:document.querySelector('[data-wxo-gallery-title]').textContent.trim()})`);
          assert(galleryNext.count==='02 / 10'&&galleryNext.title==='Component showcase',`wxo-canvas.html: gallery next failed ${JSON.stringify(galleryNext)}`);
          await cdp.screenshot('wxo-canvas-390-light-gallery.png');
          await cdp.key('Escape','Escape',27);await delay(60);
          const galleryClosed=await cdp.evaluate(`({open:document.querySelector('[data-wxo-gallery]').open,body:document.body.classList.contains('wxo-gallery-open'),focus:document.activeElement===document.querySelectorAll('[data-wxo-evidence]')[0]})`);
          assert(!galleryClosed.open&&!galleryClosed.body&&galleryClosed.focus,`wxo-canvas.html: gallery close and focus return failed ${JSON.stringify(galleryClosed)}`);
        }
        if(name==='wxo'&&viewport.label==='1280'&&theme==='dark'){
          for(const [selector,fileName] of [['.pilot-activity-epic','wxo-canvas-1280-dark-user-activity.png'],['.pilot-side-quest-bridge','wxo-canvas-1280-dark-document-processing-bridge.png'],['.pilot-expansion-grid','wxo-canvas-1280-dark-expansions.png'],['.pilot-flow-control-composition','wxo-canvas-1280-dark-flow-control-composition.png']]){await cdp.evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});scrollTo({top:el.getBoundingClientRect().top+scrollY-84,behavior:'instant'})})()`);await delay(80);await cdp.screenshot(fileName);}
          const handoffPoint=await cdp.evaluate(`(()=>{const el=document.querySelector('.pilot-bridge-copy a');scrollTo({top:el.getBoundingClientRect().top+scrollY-innerHeight/2,behavior:'instant'});const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()`);
          await cdp.call('Input.dispatchMouseEvent',{type:'mouseMoved',x:handoffPoint.x,y:handoffPoint.y});await delay(250);
          const handoffHover=await cdp.evaluate(`(()=>{const el=document.querySelector('.pilot-bridge-copy a');const s=getComputedStyle(el);return {hover:el.matches(':hover'),transform:s.transform,decoration:s.textDecorationThickness}})()`);
          assert(handoffHover.hover&&handoffHover.transform!=='none'&&parseFloat(handoffHover.decoration)>=2,`wxo-canvas.html: Document Processing handoff hover failed ${JSON.stringify(handoffHover)}`);
          await cdp.screenshot('wxo-canvas-1280-dark-handoff-hover.png');
          await cdp.evaluate(`document.querySelector('.pilot-bridge-copy a').focus()`);await delay(250);
          const handoffFocus=await cdp.evaluate(`(()=>{const el=document.querySelector('.pilot-bridge-copy a');const s=getComputedStyle(el);return {focusVisible:el.matches(':focus-visible'),transform:s.transform,outline:s.outlineStyle,outlineWidth:s.outlineWidth}})()`);
          assert(handoffFocus.focusVisible&&handoffFocus.transform!=='none'&&handoffFocus.outline!=='none'&&parseFloat(handoffFocus.outlineWidth)>0,`wxo-canvas.html: Document Processing handoff focus failed ${JSON.stringify(handoffFocus)}`);
          await cdp.screenshot('wxo-canvas-1280-dark-handoff-focus.png');
          await cdp.evaluate(`(()=>{const trigger=document.querySelectorAll('[data-wxo-evidence]')[0];trigger.dataset.originalTitle=trigger.dataset.title;trigger.dataset.title='AgentCanvasOrchestrationVocabularyForComplexHumanAndAutomatedWorkflowRelationshipsWithoutWhitespace';trigger.click()})()`);await delay(100);
          const longTitleDesktop=await cdp.evaluate(`(()=>{const d=document.querySelector('[data-wxo-gallery]'),layout=d.querySelector('.pilot-gallery-layout'),details=d.querySelector('.pilot-gallery-details'),title=d.querySelector('[data-wxo-gallery-title]'),close=d.querySelector('.pilot-gallery-close');const dr=d.getBoundingClientRect(),cr=close.getBoundingClientRect(),style=getComputedStyle(title);return {documentOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,dialogOverflow:d.scrollWidth-d.clientWidth,layoutOverflow:layout.scrollWidth-layout.clientWidth,detailsOverflow:details.scrollWidth-details.clientWidth,titleOverflow:title.scrollWidth-title.clientWidth,dialogLeft:dr.left,dialogRight:dr.right,closeLeft:cr.left,closeRight:cr.right,titleWrap:style.overflowWrap,titleFont:parseFloat(style.fontSize)}})()`);
          assert(longTitleDesktop.documentOverflow===0&&longTitleDesktop.dialogOverflow===0&&longTitleDesktop.layoutOverflow===0&&longTitleDesktop.detailsOverflow===0&&longTitleDesktop.titleOverflow===0&&longTitleDesktop.dialogLeft>=0&&longTitleDesktop.dialogRight<=viewport.width&&longTitleDesktop.closeLeft>=longTitleDesktop.dialogLeft&&longTitleDesktop.closeRight<=longTitleDesktop.dialogRight&&longTitleDesktop.titleWrap==='anywhere'&&longTitleDesktop.titleFont<=40,`wxo-canvas.html: desktop long gallery title overflowed or remained oversized ${JSON.stringify(longTitleDesktop)}`);
          await cdp.screenshot('wxo-canvas-1280-dark-gallery-long-title.png');
          await cdp.key('Escape','Escape',27);await delay(60);
          await cdp.evaluate(`(()=>{const trigger=document.querySelectorAll('[data-wxo-evidence]')[0];trigger.dataset.title=trigger.dataset.originalTitle;delete trigger.dataset.originalTitle})()`);
        }
        if(name==='wxo'&&viewport.label==='1600'&&theme==='dark'){
          await cdp.screenshotElement('.pilot-hero','wxo-canvas-1600-dark-hero-full.png');
          for(const [selector,fileName] of [['.pilot-canvas-opening','wxo-canvas-1600-dark-canvas-opening.png'],['.pilot-vignettes','wxo-canvas-1600-dark-vignettes.png'],['.pilot-released-canvas','wxo-canvas-1600-dark-released-canvas.png'],['.pilot-activity-epic','wxo-canvas-1600-dark-user-activity.png'],['.pilot-side-quest-bridge','wxo-canvas-1600-dark-document-processing-bridge.png'],['.pilot-expansion-grid','wxo-canvas-1600-dark-expansions.png'],['.pilot-flow-control-composition','wxo-canvas-1600-dark-flow-control-composition.png']]){await cdp.evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});scrollTo({top:el.getBoundingClientRect().top+scrollY-84,behavior:'instant'})})()`);await delay(80);await cdp.screenshot(fileName);}
          await cdp.screenshotElement('.pilot-flow-control-composition','wxo-canvas-1600-dark-flow-control-composition-full.png');
        }
        if(name==='doc'&&viewport.label==='390'&&theme==='light'){
          await cdp.evaluate(`document.querySelector('.nav-dropdown-toggle').click();scrollTo(0,0)`);
          await delay(60);
          await cdp.screenshot('document-processing-390-light-opening.png');
          for(const [selector,fileName] of [['.pilot-doc-epic','document-processing-390-light-feature-arc.png'],['.pilot-doc-epic .pilot-flow-step--late','document-processing-390-light-accuracy-evaluation.png']]){await cdp.evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});scrollTo({top:el.getBoundingClientRect().top+scrollY-84,behavior:'instant'})})()`);await delay(80);await cdp.screenshot(fileName);}
          await cdp.evaluate(`document.querySelectorAll('[data-wxo-evidence]')[0].click()`);await delay(100);
          const docGallery=await cdp.evaluate(`(async()=>{const d=document.querySelector('[data-wxo-gallery]');const i=d.querySelector('[data-wxo-gallery-image]');try{await i.decode()}catch{}return {open:d.open,count:d.querySelector('[data-wxo-gallery-count]').textContent.trim(),title:d.querySelector('[data-wxo-gallery-title]').textContent.trim(),loaded:i.complete&&i.naturalWidth>0,focus:document.activeElement===d.querySelector('.pilot-gallery-close')}})()`);
          assert(docGallery.open&&docGallery.count==='01 / 04'&&docGallery.title==='Classify'&&docGallery.loaded&&docGallery.focus,`document-processing.html: feature-arc gallery open failed ${JSON.stringify(docGallery)}`);
          await cdp.key('ArrowRight','ArrowRight',39);
          const docGalleryNext=await cdp.evaluate(`({count:document.querySelector('[data-wxo-gallery-count]').textContent.trim(),title:document.querySelector('[data-wxo-gallery-title]').textContent.trim()})`);
          assert(docGalleryNext.count==='02 / 04'&&docGalleryNext.title==='Extract',`document-processing.html: feature-arc gallery next failed ${JSON.stringify(docGalleryNext)}`);
          await cdp.screenshot('document-processing-390-light-gallery.png');
          await cdp.key('Escape','Escape',27);await delay(60);
          await cdp.evaluate(`(async()=>{const video=document.querySelector('.doc-motion-frame video');await video.play();document.querySelector('[data-doc-motion-toggle]').focus()})()`);
          await cdp.key(' ', 'Space', 32);
          const pausedMotion=await cdp.evaluate(`(()=>{const video=document.querySelector('.doc-motion-frame video');const button=document.querySelector('[data-doc-motion-toggle]');const rect=button.getBoundingClientRect();const style=getComputedStyle(button);return {paused:video.paused,label:button.textContent.trim(),pressed:button.getAttribute('aria-pressed'),focused:document.activeElement===button,width:rect.width,height:rect.height,outlineStyle:style.outlineStyle,outlineWidth:style.outlineWidth}})()`);
          assert(pausedMotion.paused&&pausedMotion.label==='Play animation'&&pausedMotion.pressed==='true'&&pausedMotion.focused&&pausedMotion.width>=44&&pausedMotion.height>=44&&pausedMotion.outlineStyle!=='none'&&parseFloat(pausedMotion.outlineWidth)>0, `document-processing.html: keyboard motion pause control failed ${JSON.stringify(pausedMotion)}`);
          await cdp.key('Enter', 'Enter', 13);
          const resumedMotion=await cdp.evaluate(`(()=>{const video=document.querySelector('.doc-motion-frame video');const button=document.querySelector('[data-doc-motion-toggle]');return {paused:video.paused,label:button.textContent.trim(),pressed:button.getAttribute('aria-pressed')}})()`);
          assert(!resumedMotion.paused&&resumedMotion.label==='Pause animation'&&resumedMotion.pressed==='false', `document-processing.html: keyboard motion resume control failed ${JSON.stringify(resumedMotion)}`);
          await cdp.evaluate(`(()=>{const el=document.querySelector('.workflow-close');const offset=document.querySelector('.nav').getBoundingClientRect().height+12;scrollTo({top:el.getBoundingClientRect().top+scrollY-offset,behavior:'instant'})})()`);
          await delay(80);
          await cdp.screenshot('document-processing-390-light-ending.png');
        }
        if(name==='doc'&&viewport.label==='1280'&&theme==='dark'){
          await cdp.evaluate(`(()=>{const el=document.querySelector('.pilot-doc-epic');scrollTo({top:el.getBoundingClientRect().top+scrollY-80,behavior:'instant'})})()`);
          await delay(80);
          await cdp.screenshot('document-processing-1280-dark-feature-arc.png');
          await cdp.evaluate(`(()=>{const el=document.querySelector('.workflow-close');scrollTo({top:el.getBoundingClientRect().top+scrollY-80,behavior:'instant'})})()`);
          await delay(80);
          await cdp.screenshot('document-processing-1280-dark-ending.png');
          const returnPoint=await cdp.evaluate(`(()=>{const el=document.querySelector('.workflow-return-link');const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()`);
          await cdp.call('Input.dispatchMouseEvent',{type:'mouseMoved',x:returnPoint.x,y:returnPoint.y});await delay(250);
          const returnHover=await cdp.evaluate(`(()=>{const el=document.querySelector('.workflow-return-link');const s=getComputedStyle(el);return {hover:el.matches(':hover'),transform:s.transform,decoration:s.textDecorationThickness}})()`);
          assert(returnHover.hover&&returnHover.transform!=='none'&&parseFloat(returnHover.decoration)>=2,`document-processing.html: closing Canvas return hover failed ${JSON.stringify(returnHover)}`);
          await cdp.screenshot('document-processing-1280-dark-return-hover.png');
          await cdp.evaluate(`document.querySelector('.workflow-return-link').focus()`);await delay(250);
          const returnFocus=await cdp.evaluate(`(()=>{const el=document.querySelector('.workflow-return-link');const s=getComputedStyle(el);return {focusVisible:el.matches(':focus-visible'),transform:s.transform,outline:s.outlineStyle,outlineWidth:s.outlineWidth}})()`);
          assert(returnFocus.focusVisible&&returnFocus.transform!=='none'&&returnFocus.outline!=='none'&&parseFloat(returnFocus.outlineWidth)>0,`document-processing.html: closing Canvas return focus failed ${JSON.stringify(returnFocus)}`);
          await cdp.screenshot('document-processing-1280-dark-return-focus.png');
        }
        if(name==='doc'&&viewport.label==='1600'&&theme==='dark'){
          for(const [selector,fileName] of [['.pilot-doc-epic','document-processing-1600-dark-feature-arc.png'],['.doc-motion-frame','document-processing-1600-dark-motion.png'],['.doc-current-story','document-processing-1600-dark-current-story.png'],['.doc-current-pair','document-processing-1600-dark-screen-pair.png'],['.doc-current-evaluator-grid','document-processing-1600-dark-evaluator-grid.png']]){await cdp.evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});scrollTo({top:el.getBoundingClientRect().top+scrollY-84,behavior:'instant'})})()`);await delay(80);await cdp.screenshot(fileName);}
        }
        checks+=1;
      }
    }
  }
  assert(gateChecks === 2,
    `expected two public-gate viewport checks; found ${gateChecks}`);
  assert(deepLinkChecks===2, `expected two wxO native deep-link checks; found ${deepLinkChecks}`);
  assert(cdp.exceptions.length===0, `browser exceptions: ${JSON.stringify(cdp.exceptions)}`);
  assert(cdp.consoleErrors.length===0, `console errors: ${JSON.stringify(cdp.consoleErrors)}`);
  assert(cdp.httpErrors.length===0, `HTTP errors: ${JSON.stringify(cdp.httpErrors)}`);
  assert(cdp.networkFailures.length===0, `network failures: ${JSON.stringify(cdp.networkFailures)}`);
  console.log(`WXO + DOCUMENT PROCESSING BROWSER CHECK: PASS gates=${gateChecks} states=${checks} deepLinks=${deepLinkChecks} evidence=${evidenceDir}`);
} finally {
  try { cdp?.socket?.close(); } catch {}
  child.kill('SIGTERM');
  server?.kill('SIGTERM');
  await Promise.race([new Promise((resolve)=>child.once('exit',resolve)),delay(1500)]);
  if(child.exitCode===null) child.kill('SIGKILL');
  if(server){
    await Promise.race([new Promise((resolve)=>server.once('exit',resolve)),delay(1500)]);
    if(server.exitCode===null) server.kill('SIGKILL');
  }
  try { fs.rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100}); } catch {}
}
