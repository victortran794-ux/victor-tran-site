#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const root = process.cwd();
const localSitePort = 8765 + (process.pid % 500);
const baseUrl = process.env.SITE_URL || `http://127.0.0.1:${localSitePort}`;
const evidenceDir = process.env.PIKAPP_EVIDENCE_DIR || path.join(root, '.hermes', 'evidence', 'pikapp-page');
const chrome = [
  process.env.CHROME_BIN,
  '/home/victortran794/.agent-browser/browsers/chrome-149.0.7827.55/chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean).find((candidate) => fs.existsSync(candidate));
if (!chrome) throw new Error('Chrome binary not found; set CHROME_BIN');

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'pikapp-page-browser-'));
const port = 9400 + (process.pid % 400);
let chromeLog = '';
let siteChild;
let siteLog = '';
const child = spawn(chrome, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  '--remote-allow-origins=*', `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`, '--window-size=1280,720', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });
child.stderr.on('data', (chunk) => { chromeLog += chunk.toString(); });
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
async function stopChild(process, timeout = 2000) {
  if (process.exitCode !== null) return;
  let resolveExit;
  const exited = new Promise((resolve) => { resolveExit = resolve; process.once('exit', resolve); });
  if (process.exitCode !== null) { process.off('exit', resolveExit); return; }
  process.kill('SIGTERM');
  if (await Promise.race([exited.then(() => true), delay(timeout).then(() => false)])) return;
  if (process.exitCode === null) process.kill('SIGKILL');
  await Promise.race([exited, delay(1000)]);
}

async function fetchJson(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}
async function ensureSite() {
  if (process.env.SITE_URL) return;
  siteChild = spawn('python3', ['-m', 'http.server', String(localSitePort), '--bind', '127.0.0.1'], { cwd: root, stdio: ['ignore', 'ignore', 'pipe'] });
  siteChild.stderr.on('data', (chunk) => { siteLog += chunk.toString(); });
  const deadline = Date.now() + 10000;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/pikappapp.html`);
      if (response.ok) return;
      lastError = new Error(`${response.status} ${response.statusText}`);
    } catch (error) { lastError = error; }
    if (siteChild.exitCode !== null) throw new Error(`Local site server exited ${siteChild.exitCode}: ${siteLog}`);
    await delay(100);
  }
  throw new Error(`Local site server did not become ready within 10s: ${lastError?.message || 'unknown error'}\n${siteLog}`);
}
async function waitForTarget() {
  let lastError;
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try {
      const remaining = Math.max(1, deadline - Date.now());
      const targets = await fetchJson(`http://127.0.0.1:${port}/json/list`, Math.min(1000, remaining));
      const page = targets.find((target) => target.type === 'page');
      if (page?.webSocketDebuggerUrl) return page;
    } catch (error) { lastError = error; }
    if (child.exitCode !== null) throw new Error(`Chrome exited ${child.exitCode}: ${chromeLog}`);
    await delay(100);
  }
  throw new Error(`Chrome DevTools target did not become ready within 20s: ${lastError?.message || 'unknown error'}\n${chromeLog}`);
}

class Cdp {
  constructor(url) { this.url = url; this.nextId = 1; this.pending = new Map(); this.waiters = new Map(); this.exceptions = []; this.consoleErrors = []; this.contextsByFrame = new Map(); this.mainFrameId = null; }
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
      if (message.method === 'Runtime.executionContextCreated') {
        const context = message.params.context;
        if (context.auxData?.isDefault && context.auxData.frameId) this.contextsByFrame.set(context.auxData.frameId, context.id);
      }
      if (message.method === 'Runtime.executionContextDestroyed') {
        for (const [frameId, contextId] of this.contextsByFrame) if (contextId === message.params.executionContextId) this.contextsByFrame.delete(frameId);
      }
      if (message.method === 'Runtime.executionContextsCleared') this.contextsByFrame.clear();
      if (message.method === 'Runtime.exceptionThrown') this.exceptions.push(message.params.exceptionDetails);
      if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') this.consoleErrors.push(message.params.args.map((arg) => arg.value || arg.description).join(' '));
      const waiters = this.waiters.get(message.method) || [];
      this.waiters.delete(message.method);
      waiters.forEach((resolve) => resolve(message.params));
    });
    await new Promise((resolve, reject) => {
      let timer;
      const finish = (callback, value) => {
        clearTimeout(timer);
        this.socket.removeEventListener('open', onOpen);
        this.socket.removeEventListener('error', onError);
        callback(value);
      };
      const onOpen = () => finish(resolve);
      const onError = (event) => finish(reject, new Error(`WebSocket open failed: ${event.message || 'unknown error'}`));
      this.socket.addEventListener('open', onOpen, { once: true });
      this.socket.addEventListener('error', onError, { once: true });
      timer = setTimeout(() => {
        try { this.socket.close(); } catch {}
        finish(reject, new Error('WebSocket open timed out'));
      }, 10000);
    });
  }
  call(method, params = {}, sessionId = null) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, method });
      this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
      const timeout = method === 'Runtime.evaluate' ? 60000 : 15000;
      setTimeout(() => {
        if (!this.pending.has(id)) return;
        this.pending.delete(id);
        reject(new Error(`${method} timed out`));
      }, timeout);
    });
  }
  event(method, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const waiters = this.waiters.get(method) || [];
      waiters.push(resolve); this.waiters.set(method, waiters);
      setTimeout(() => reject(new Error(`${method} event timed out`)), timeout);
    });
  }
  async waitForContext(frameId, timeout = 5000) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const contextId = this.contextsByFrame.get(frameId);
      if (contextId) return contextId;
      await delay(20);
    }
    throw new Error(`Default execution context did not become ready for frame ${frameId}`);
  }
  async evaluateInFrame(frameId, expression) {
    const contextId = await this.waitForContext(frameId);
    const result = await this.call('Runtime.evaluate', { expression, contextId, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  async evaluateInSession(sessionId, expression) {
    const result = await this.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId);
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  async evaluate(expression) {
    if (!this.mainFrameId) throw new Error('Main frame is not initialized');
    return this.evaluateInFrame(this.mainFrameId, expression);
  }
  async navigate(url) {
    this.contextsByFrame.clear();
    const loaded = this.event('Page.loadEventFired');
    const navigation = await this.call('Page.navigate', { url });
    this.mainFrameId = navigation.frameId;
    await loaded; await this.waitForContext(this.mainFrameId); await delay(120);
  }
  async key(key, code, virtualKeyCode, modifiers = 0) {
    const params = { key, code, windowsVirtualKeyCode: virtualKeyCode, nativeVirtualKeyCode: virtualKeyCode, modifiers };
    if (key === 'Enter') {
      await this.call('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...params });
      await this.call('Input.dispatchKeyEvent', { type: 'char', ...params, text: '\r', unmodifiedText: '\r' });
    } else {
      await this.call('Input.dispatchKeyEvent', { type: 'keyDown', ...params });
    }
    await this.call('Input.dispatchKeyEvent', { type: 'keyUp', ...params });
  }
  async clickAt(x, y) {
    await this.call('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    await this.call('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await this.call('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  }
  async screenshot(fileName) {
    const result = await this.call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(evidenceDir, fileName), Buffer.from(result.data, 'base64'));
  }
}

let cdp;
try {
  await ensureSite();
  fs.mkdirSync(evidenceDir, { recursive: true });
  const target = await waitForTarget();
  cdp = new Cdp(target.webSocketDebuggerUrl); await cdp.open();
  await cdp.call('Page.enable'); await cdp.call('Runtime.enable'); await cdp.call('Network.enable');
  await cdp.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });

  let checks = 0;
  for (const viewport of [
    { label: '390', width: 390, height: 844, mobile: true },
    { label: '600', width: 600, height: 900, mobile: false, compact: true },
    { label: '820', width: 820, height: 900, mobile: false, tablet: true },
    { label: '1280', width: 1280, height: 720, mobile: false },
  ]) {
    await cdp.call('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: false });
    await cdp.call('Emulation.setTouchEmulationEnabled', { enabled: viewport.mobile, maxTouchPoints: 1 });
    for (const theme of ['light', 'dark']) {
      await cdp.navigate(`${baseUrl}/pikappapp.html`);
      const topContext = await cdp.evaluate(`({href:location.href,origin:location.origin,isTop:window===top})`);
      assert(topContext.href===`${baseUrl}/pikappapp.html`&&topContext.isTop,`main-frame context drifted before theme setup: ${JSON.stringify(topContext)}`);
      await cdp.evaluate(`localStorage.setItem('lens', ${JSON.stringify(theme)})`);
      await cdp.navigate(`${baseUrl}/pikappapp.html`);
      await cdp.call('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, screenWidth: viewport.width, screenHeight: viewport.height, positionX: 0, positionY: 0, deviceScaleFactor: 1, scale: 1, mobile: false, dontSetVisibleSize: false });
      await cdp.call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 1 });
      const state = await cdp.evaluate(`(async()=>{
        const images=[...document.querySelectorAll('.pikapp-page img[src]')];
        const deferredImages=[...document.querySelectorAll('.pikapp-page img[data-src]:not([src])')];
        images.forEach((image)=>{image.loading='eager'});
        await Promise.all(images.map(async(image)=>{try{await image.decode()}catch{}}));
        const root=document.documentElement;
        const controls=[...document.querySelectorAll('.phone-story__controls button,.project-nav-gallery-primary,.project-nav-gallery-link,.project-nav-item,.nav-logo,.nav-dropdown-toggle,.nav-links>li>a,.footer-cta,.footer-social a,.footer-copy-email')]
          .filter((element)=>{const r=element.getBoundingClientRect();const s=getComputedStyle(element);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'})
          .map((element)=>{const r=element.getBoundingClientRect();return {label:element.getAttribute('aria-label')||element.textContent.trim().replace(/\\s+/g,' ').slice(0,60),width:r.width,height:r.height}});
        const page=document.querySelector('.pikapp-page');
        const boundaryElement=document.querySelector('.coda__boundary');
        const boundaryStyle=getComputedStyle(boundaryElement);
        const avatars=[...document.querySelectorAll('.member-card__avatar')].map((avatar)=>{const card=avatar.closest('.member-card');const ar=avatar.getBoundingClientRect();return {color:getComputedStyle(avatar).color,border:getComputedStyle(card).borderTopColor,width:ar.width,height:ar.height}});
        const personaLabels=[...document.querySelectorAll('.member-card h3')].map((heading)=>heading.textContent.trim());
        const phoneSlideRadii=[...document.querySelectorAll('.phone-slide')].map((slide)=>getComputedStyle(slide).borderRadius);
        const remasterScreens=[...document.querySelectorAll('.coda__screen')].map((screen)=>{const frame=screen.querySelector('.coda__frame');const image=screen.querySelector('.coda__image');const caption=screen.querySelector('figcaption');const step=screen.querySelector('.coda__step');const frameStyle=getComputedStyle(frame);const imageStyle=getComputedStyle(image);const screenRect=screen.getBoundingClientRect();const imageRect=image.getBoundingClientRect();const captionRect=caption.getBoundingClientRect();return {step:step.textContent.trim(),screen:{left:screenRect.left,right:screenRect.right,top:screenRect.top,width:screenRect.width},image:{left:imageRect.left,right:imageRect.right,top:imageRect.top,bottom:imageRect.bottom,width:imageRect.width,height:imageRect.height},caption:{top:captionRect.top,left:captionRect.left,width:captionRect.width},frameBorderRadius:frameStyle.borderRadius,frameOverflow:frameStyle.overflow,borderRadius:imageStyle.borderRadius,boxShadow:imageStyle.boxShadow,objectFit:imageStyle.objectFit,aspect:imageRect.width/imageRect.height}});
        const explorationScreens=[...document.querySelectorAll('.exploration-screen')].map((screen)=>{const image=screen.querySelector('img');const screenRect=screen.getBoundingClientRect();const imageRect=image.getBoundingClientRect();const imageStyle=getComputedStyle(image);return {screen:{left:screenRect.left,right:screenRect.right,width:screenRect.width,top:screenRect.top},image:{left:imageRect.left,right:imageRect.right,width:imageRect.width,height:imageRect.height},objectFit:imageStyle.objectFit,borderRadius:imageStyle.borderRadius,boxShadow:imageStyle.boxShadow,aspect:imageRect.width/imageRect.height}});
        const explorationStudies=[...document.querySelectorAll('.exploration-study')].map((study)=>{const image=study.querySelector('img');const rect=image.getBoundingClientRect();return {width:rect.width,height:rect.height,objectFit:getComputedStyle(image).objectFit}});
        const explorationFlow=document.querySelector('.exploration-flow');
        const explorationBoundary=document.querySelector('.exploration-boundary');
        const triptych=document.querySelector('.coda__triptych');
        const triptychStyle=getComputedStyle(triptych);
        const triptychRhythm=['.member-cards','.coda__triptych'].map((selector)=>{const grid=document.querySelector(selector);const rect=grid.getBoundingClientRect();const children=[...grid.children].map((child)=>{const childRect=child.getBoundingClientRect();return childRect.left+(childRect.width/2)});return {selector,left:rect.left,right:rect.right,width:rect.width,centers:children}});
        const cue=document.querySelector('.expansion-archive-cue');
        const finaleRects=['.coda__head','.coda__triptych','.coda__boundary','.project-nav-item--prev','.project-nav-gallery-panel'].map((selector)=>{const rect=document.querySelector(selector).getBoundingClientRect();return {selector,left:rect.left,right:rect.right,width:rect.width}});
        const galleryGrid=document.querySelector('.project-nav-gallery-links');
        const galleryStyle=getComputedStyle(galleryGrid);
        const galleryItems=[document.querySelector('.project-nav-gallery-primary'),...galleryGrid.querySelectorAll('.project-nav-gallery-link')].map((link)=>{const rect=link.getBoundingClientRect();return {href:link.getAttribute('href'),left:rect.left,right:rect.right,width:rect.width,height:rect.height}});
        return {viewport:[innerWidth,innerHeight],theme:root.dataset.theme,stored:localStorage.getItem('lens'),overflow:root.scrollWidth-root.clientWidth,
          images:images.length,deferredImages:deferredImages.length,failed:images.filter((image)=>!image.complete||image.naturalWidth<=0).map((image)=>image.getAttribute('src')),
          controls,main:page?.id,tabindex:page?.getAttribute('tabindex'),current:document.querySelector('nav[aria-label="Primary"] [aria-current="page"]')?.getAttribute('href'),
          shell:Boolean(document.querySelector('nav.nav')&&document.querySelector('footer.footer')&&document.querySelector('.project-nav')),
          principles:document.querySelectorAll('.future-principle').length,codaScreens:document.querySelectorAll('.coda__screen').length,phoneSlides:document.querySelectorAll('.phone-slide').length,explorationStudyCount:explorationStudies.length,explorationScreenCount:explorationScreens.length,
          boundary:boundaryElement?.textContent.trim().replace(/\\s+/g,' '),boundaryStyle:{fontStyle:boundaryStyle.fontStyle,fontSize:boundaryStyle.fontSize,padding:boundaryStyle.padding,borderLeftWidth:boundaryStyle.borderLeftWidth,backgroundColor:boundaryStyle.backgroundColor},avatars,personaLabels,phoneSlideRadii,remasterScreens,explorationScreens,explorationStudies,explorationBoundary:explorationBoundary?.textContent.trim().replace(/\\s+/g,' '),explorationFlow:explorationFlow?{display:getComputedStyle(explorationFlow).display,columns:getComputedStyle(explorationFlow).gridTemplateColumns,overflowX:getComputedStyle(explorationFlow).overflowX,clientWidth:explorationFlow.clientWidth,scrollWidth:explorationFlow.scrollWidth,tabindex:explorationFlow.getAttribute('tabindex')}:null,
          cue:{text:cue.textContent.trim(),opacity:getComputedStyle(cue).opacity},hoverNone:matchMedia('(hover: none)').matches,archiveViewLabels:[...document.querySelectorAll('.archive-view')].map((button)=>({text:button.textContent.trim(),label:button.getAttribute('aria-label')})),
          next:{title:document.querySelector('.project-nav-gallery-panel .project-nav-title')?.textContent.trim(),label:document.querySelector('.project-nav-gallery-panel')?.getAttribute('aria-label')},pattern:getComputedStyle(document.querySelector('.poster'),'::after').backgroundImage,
          triptych:{display:triptychStyle.display,columns:triptychStyle.gridTemplateColumns,overflowX:triptychStyle.overflowX,clientWidth:triptych.clientWidth,scrollWidth:triptych.scrollWidth,tabindex:triptych.getAttribute('tabindex')},triptychRhythm,finaleRects,gallery:{columns:galleryStyle.gridTemplateColumns,items:galleryItems},
          reviewUi:Boolean(document.querySelector('.reviewbar,.decision,[data-view-button]')),privateText:['Private page review','Requested decision','KEEP / ADJUST / REJECT'].some((text)=>document.body.textContent.includes(text))};
      })()`);
      assert(state.viewport[0]===viewport.width&&state.viewport[1]===viewport.height,`viewport drift ${state.viewport}`);
      assert((theme==='dark'?state.theme==='dark':!state.theme||state.theme==='light')&&state.stored===theme,`theme failed ${viewport.label} ${theme}`);
      assert(state.overflow===0,`${state.overflow}px root overflow at ${viewport.label} ${theme}`);
      assert(state.images===16&&state.deferredImages===16&&!state.failed.length,`media failure at ${viewport.label} ${theme}: ${JSON.stringify(state)}`);
      assert(state.main==='main-content'&&state.tabindex==='-1'&&state.current==='pikappapp.html'&&state.shell,'shell or route state failed');
      assert(state.principles===0&&state.codaScreens===6&&state.phoneSlides===6&&state.explorationStudyCount===0&&state.explorationScreenCount===0&&!state.explorationBoundary&&!state.explorationFlow,'approved source-first evidence counts drifted');
      assert(state.boundary==='Illustrative concept screens. Names, dates, rankings, and activity are fictional.','boundary copy drifted');
      assert(state.boundaryStyle.fontStyle==='italic'&&state.boundaryStyle.fontSize==='13px'&&state.boundaryStyle.padding==='0px'&&state.boundaryStyle.borderLeftWidth==='0px'&&state.boundaryStyle.backgroundColor==='rgba(0, 0, 0, 0)',`boundary caption styling drifted: ${JSON.stringify(state.boundaryStyle)}`);
      assert(state.remasterScreens.length===6&&state.remasterScreens.map((screen)=>screen.step).join('|')==='01 App launch|02 Welcome|03 Member view|04 Responsibility|05 Task detail|06 Milestones',`remaster sequence drifted: ${JSON.stringify(state.remasterScreens)}`);
      assert(state.personaLabels.join('|')==='Associate member|Chapter secretary|Graduating senior',`member journey lost its role-based persona labels: ${JSON.stringify(state.personaLabels)}`);
      assert(state.phoneSlideRadii.length===6&&state.phoneSlideRadii.every((radius)=>radius==='26px'),`V1 phone screens lost their rounded treatment: ${JSON.stringify(state.phoneSlideRadii)}`);
      assert(state.remasterScreens.every((screen)=>screen.frameBorderRadius==='0px'&&screen.frameOverflow==='visible'&&screen.borderRadius==='0px'&&screen.boxShadow==='none'&&screen.objectFit==='contain'&&Math.abs(screen.aspect-(390/844))<0.002),`remaster screens lost complete uncropped 390/844 treatment: ${JSON.stringify(state.remasterScreens)}`);
      assert(state.explorationScreens.length===0,'AI-assisted exploration screens returned to the public case-study sequence');
      assert(state.explorationStudies.length===0,`redundant broad exploration studies returned: ${JSON.stringify(state.explorationStudies)}`);
      assert(state.gallery.items.map((item)=>item.href).join('|')==='artillustration.html|graphicgallery.html|uigallery.html',`consolidated gallery order drifted: ${JSON.stringify(state.gallery)}`);
      assert(state.gallery.items.every((item)=>item.left>=-1&&item.right<=viewport.width+1&&item.width>0&&item.height>=44),`consolidated gallery panel escaped or became undersized: ${JSON.stringify(state.gallery)}`);
      assert(state.gallery.columns.split(' ').length===(viewport.width<=760?1:2),`consolidated secondary gallery columns drifted at ${viewport.label}: ${JSON.stringify(state.gallery)}`);
      if (viewport.mobile||viewport.compact) {
        assert(state.finaleRects.every((rect)=>rect.left>=24-1&&rect.right<=viewport.width-24+1),`compact finale gutter escaped 24px boundary: ${JSON.stringify(state.finaleRects)}`);
        assert(state.triptych.display==='grid'&&state.triptych.columns.split(' ').length===2&&state.triptych.overflowX==='visible'&&state.triptych.scrollWidth===state.triptych.clientWidth,`compact remaster must be a complete two-up grid without clipping: ${JSON.stringify(state.triptych)}`);
        const widths=state.remasterScreens.map((screen)=>screen.image.width);
        assert(Math.max(...widths)-Math.min(...widths)<=1&&state.remasterScreens.every((screen)=>screen.image.left>=24-1&&screen.image.right<=viewport.width-24+1),`compact remaster screens escaped their contained two-up layout: ${JSON.stringify(state.remasterScreens)}`);
      } else {
        const widths=state.remasterScreens.map((screen)=>screen.image.width); const heights=state.remasterScreens.map((screen)=>screen.image.height);
        const rows=[0,3].map((start)=>state.remasterScreens.slice(start,start+3));
        const rowsAligned=rows.every((row)=>Math.max(...row.map((screen)=>screen.image.top))-Math.min(...row.map((screen)=>screen.image.top))<=1&&Math.max(...row.map((screen)=>screen.caption.top))-Math.min(...row.map((screen)=>screen.caption.top))<=1);
        assert(state.triptych.display==='grid'&&Math.max(...widths)-Math.min(...widths)<=1&&Math.max(...heights)-Math.min(...heights)<=1&&rowsAligned,`desktop/tablet remaster frames must share geometry and per-row caption baselines: ${JSON.stringify(state.remasterScreens)}`);
        const gridWidths=state.triptychRhythm.map((grid)=>grid.width); const gridLefts=state.triptychRhythm.map((grid)=>grid.left); const gridRights=state.triptychRhythm.map((grid)=>grid.right);
        assert(state.triptych.columns.split(' ').length===3,`desktop/tablet final sequence must preserve three columns: ${JSON.stringify(state.triptych)}`);
      }
      assert(state.avatars.length===3&&state.avatars.every((avatar)=>avatar.color===avatar.border&&avatar.width>=42&&avatar.height>=42),`member avatar treatment drifted: ${JSON.stringify(state.avatars)}`);
      assert(state.cue.text===''&&state.cue.opacity===(state.hoverNone?'1':'0'),`archive cue initial state drifted at ${viewport.label}: ${JSON.stringify({cue:state.cue,hoverNone:state.hoverNone})}`);
      assert(state.archiveViewLabels.length===8&&state.archiveViewLabels.every((view)=>!view.text)&&state.archiveViewLabels.map((view)=>view.label).join('|')==='View portfolio cover|View Creighton opener|View expansion timeline|View post-expansion support|View national statistics|View regional map|View event application|View environmental context',`archive page labels drifted: ${JSON.stringify(state.archiveViewLabels)}`);
      assert(state.next.title==='Art & Illustration'&&state.next.label==='Next galleries',`Pi Kapp Next gallery panel drifted: ${JSON.stringify(state.next)}`);
      assert(state.pattern.includes('pattern-dark-blue-display.svg'),'edge-clean pattern hero failed to resolve');
      assert(!state.reviewUi&&!state.privateText,'private review UI or copy escaped production');
      if (viewport.mobile) {
        const undersized=state.controls.filter((control)=>control.width<44||control.height<44);
        assert(!undersized.length,`undersized mobile controls: ${JSON.stringify(undersized)}`);
      }
      if (viewport.mobile&&theme==='light') {
        await cdp.screenshot('pikapp-390-light-opening.png');
        await cdp.evaluate(`document.querySelector('.member-cards').scrollIntoView({block:'center',behavior:'instant'})`); await delay(80);
        await cdp.screenshot('pikapp-390-light-members.png');
        await cdp.evaluate(`document.getElementById('chapter-4').scrollIntoView({block:'start',behavior:'instant'})`); await delay(80);
        await cdp.screenshot('pikapp-390-light-final-remaster-opening.png');

        await cdp.evaluate(`document.getElementById('chapter-4').scrollIntoView({block:'start',behavior:'instant'})`); await delay(80);
        await cdp.screenshot('pikapp-390-light-coda.png');
        await cdp.evaluate(`document.querySelector('.coda__triptych').scrollIntoView({block:'start',behavior:'instant'})`); await delay(80);
        await cdp.screenshot('pikapp-390-light-remaster-sequence.png');
        await cdp.evaluate(`document.querySelector('.coda__boundary').scrollIntoView({block:'center',behavior:'instant'})`); await delay(80);
        await cdp.screenshot('pikapp-390-light-boundary.png');
        await cdp.evaluate(`document.querySelector('.close').scrollIntoView({block:'center',behavior:'instant'})`); await delay(80);
        await cdp.screenshot('pikapp-390-light-looking-back.png');
        await cdp.evaluate(`document.querySelector('.project-nav-gallery-panel').scrollIntoView({block:'center',behavior:'instant'})`); await delay(80);
        await cdp.screenshot('pikapp-390-light-next-galleries.png');
      }
      if (viewport.label==='1280'&&theme==='dark') {
        await cdp.evaluate(`document.querySelector('.member-cards').scrollIntoView({block:'center',behavior:'instant'})`); await delay(80);
        await cdp.screenshot('pikapp-1280-dark-members.png');
        await cdp.evaluate(`document.getElementById('chapter-4').scrollIntoView({block:'start',behavior:'instant'})`); await delay(80);
        await cdp.screenshot('pikapp-1280-dark-final-remaster-opening.png');

        await cdp.evaluate(`document.getElementById('chapter-4').scrollIntoView({block:'start',behavior:'instant'})`); await delay(80);
        await cdp.screenshot('pikapp-1280-dark-coda.png');
        await cdp.evaluate(`document.querySelector('.coda__triptych').scrollIntoView({block:'start',behavior:'instant'})`); await delay(80);
        await cdp.screenshot('pikapp-1280-dark-remaster-sequence.png');
        await cdp.evaluate(`document.querySelector('.coda__boundary').scrollIntoView({block:'center',behavior:'instant'})`); await delay(80);
        await cdp.screenshot('pikapp-1280-dark-boundary.png');
        await cdp.evaluate(`document.querySelector('.close').scrollIntoView({block:'center',behavior:'instant'})`); await delay(80);
        await cdp.screenshot('pikapp-1280-dark-looking-back.png');
        await cdp.evaluate(`document.querySelector('.project-nav-gallery-panel').scrollIntoView({block:'center',behavior:'instant'})`); await delay(80);
        await cdp.screenshot('pikapp-1280-dark-next-galleries.png');
      }
      checks += 1;
    }
  }

  const waitForPath = async (expectedPath, label) => {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      cdp.contextsByFrame.clear();
      try {
        if (await cdp.evaluate('location.pathname') === expectedPath) return;
      } catch {}
      await delay(100);
    }
    throw new Error(`${label}: expected ${expectedPath}, found ${await cdp.evaluate('location.pathname')}`);
  };
  await cdp.navigate(`${baseUrl}/pikappapp.html`);
  await cdp.evaluate(`document.querySelector('.project-nav-gallery-primary').scrollIntoView({block:'center',behavior:'instant'}); document.querySelector('.project-nav-gallery-primary').focus({preventScroll:true});`);
  await cdp.key('Enter', 'Enter', 13);
  await waitForPath('/artillustration.html', 'Pi Kapp primary gallery keyboard activation');
  await cdp.navigate(`${baseUrl}/pikappapp.html`);
  const interfacePoint = await cdp.evaluate(`(()=>{const link=document.querySelector('.project-nav-gallery-link[href="uigallery.html"]');link.scrollIntoView({block:'center',behavior:'instant'});const rect=link.getBoundingClientRect();return {x:rect.left+rect.width/2,y:rect.top+rect.height/2};})()`);
  await cdp.clickAt(interfacePoint.x, interfacePoint.y);
  await waitForPath('/uigallery.html', 'Pi Kapp interface-gallery pointer activation');
  await cdp.evaluate(`document.querySelector('.project-nav-item--next[href="about.html"]').scrollIntoView({block:'center',behavior:'instant'}); document.querySelector('.project-nav-item--next[href="about.html"]').focus({preventScroll:true});`);
  await cdp.key('Enter', 'Enter', 13);
  await waitForPath('/about.html', 'Interface Studies About keyboard activation');

  const verifyArchive = async ({ label, width, height, mobile }) => {
    await cdp.call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
    await cdp.navigate(`${baseUrl}/pikappapp.html`);
    await cdp.evaluate(`localStorage.setItem('lens','light')`);
    await cdp.navigate(`${baseUrl}/pikappapp.html`);
    await cdp.call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 1 });
    const beforeArchive = await cdp.evaluate(`(()=>{const trigger=document.querySelector('.expansion-archive-trigger');trigger.scrollIntoView({block:'center',behavior:'instant'});const cue=trigger.querySelector('.expansion-archive-cue');const dialog=document.querySelector('[data-archive-dialog]');return {open:dialog.open,bodyLocked:document.body.classList.contains('archive-open'),deferred:dialog.querySelectorAll('img[data-src]:not([src])').length,coverSource:dialog.querySelector('[data-archive-master="cover"]').getAttribute('src'),rootOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,cueText:cue.textContent.trim(),cueOpacity:getComputedStyle(cue).opacity,hoverNone:matchMedia('(hover: none)').matches}})()`);
    assert(!beforeArchive.open&&!beforeArchive.bodyLocked&&beforeArchive.deferred===16&&!beforeArchive.coverSource&&beforeArchive.rootOverflow===0&&!beforeArchive.cueText&&beforeArchive.cueOpacity===(beforeArchive.hoverNone?'1':'0'),`${label}: archive loaded, labeled, or locked before activation: ${JSON.stringify(beforeArchive)}`);
    const triggerPoint = await cdp.evaluate(`(()=>{const r=document.querySelector('.expansion-archive-trigger').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,width:r.width,height:r.height}})()`);
    assert(triggerPoint.width>=44&&triggerPoint.height>=44,`${label}: archival trigger is undersized`);
    await cdp.call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: triggerPoint.x, y: triggerPoint.y });
    await delay(240);
    const hoveredCue = await cdp.evaluate(`getComputedStyle(document.querySelector('.expansion-archive-cue')).opacity`);
    assert(hoveredCue==='1',`${label}: archive icon cue did not appear on hover/focus`);
    await cdp.screenshot(`pikapp-archive-${label}-entry.png`);
    await cdp.clickAt(triggerPoint.x, triggerPoint.y);
    await delay(180);
    await cdp.evaluate(`Promise.all([...document.querySelectorAll('[data-archive-dialog] img[src]')].map(async(image)=>{try{await image.decode()}catch{}}))`);
    const opened = await cdp.evaluate(`(()=>{const dialog=document.querySelector('[data-archive-dialog]');const stage=dialog.querySelector('.archive-stage');const master=dialog.querySelector('[data-archive-master="cover"]');const context=dialog.querySelector('[data-archive-master="context"]');const layout=dialog.querySelector('.archive-layout');const dr=dialog.getBoundingClientRect();const sr=stage.getBoundingClientRect();const mr=master.getBoundingClientRect();const scrollRegions=[...dialog.querySelectorAll('*')].filter((element)=>{const style=getComputedStyle(element);return element.scrollHeight>element.clientHeight+2&&['auto','scroll'].includes(style.overflowY)}).map((element)=>element.className);return {open:dialog.open,focus:document.activeElement?.className,bodyLocked:document.body.classList.contains('archive-open'),coverLoaded:master.getAttribute('src')?.endsWith('expansion-cover-detail.jpg'),contextDeferred:!context.hasAttribute('src'),thumbnailsLoaded:[...dialog.querySelectorAll('.archive-view img')].every((image)=>image.hasAttribute('src')),viewLabels:[...dialog.querySelectorAll('.archive-view')].map((button)=>({text:button.textContent.trim(),label:button.getAttribute('aria-label')})),pressed:dialog.querySelector('[data-archive-view="cover"]').getAttribute('aria-pressed'),status:dialog.querySelector('.archive-status').textContent.trim(),objectFit:getComputedStyle(master).objectFit,contained:mr.left>=sr.left-1&&mr.right<=sr.right+1&&mr.top>=sr.top-1&&mr.bottom<=sr.bottom+1,dialogRect:{left:dr.left,top:dr.top,width:dr.width,height:dr.height},rootOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,scrollRegions,layoutScrollHeight:layout.scrollHeight,layoutClientHeight:layout.clientHeight}})()`);
    assert(opened.open&&opened.focus.includes('archive-close')&&opened.bodyLocked,`${label}: dialog did not open with close focus and body lock: ${JSON.stringify(opened)}`);
    assert(opened.coverLoaded&&opened.contextDeferred&&opened.thumbnailsLoaded,`${label}: deferred archive loading failed: ${JSON.stringify(opened)}`);
    assert(opened.viewLabels.length===8&&opened.viewLabels.every((view)=>!view.text)&&opened.viewLabels.map((view)=>view.label).join('|')==='View portfolio cover|View Creighton opener|View expansion timeline|View post-expansion support|View national statistics|View regional map|View event application|View environmental context',`${label}: archive page labels or accessible names drifted: ${JSON.stringify(opened.viewLabels)}`);
    assert(opened.pressed==='true'&&opened.status==='Cover view selected.'&&opened.objectFit==='contain'&&opened.contained,`${label}: cover selection or containment failed: ${JSON.stringify(opened)}`);
    assert(opened.rootOverflow===0&&opened.dialogRect.left>=-1&&opened.dialogRect.top>=-1&&opened.dialogRect.width<=width+1&&opened.dialogRect.height<=height+1,`${label}: dialog escaped viewport: ${JSON.stringify(opened)}`);
    if (mobile) {
      assert(opened.scrollRegions.length===1&&opened.scrollRegions[0].includes('archive-layout')&&opened.layoutScrollHeight>opened.layoutClientHeight,`${label}: mobile archive must expose one internal vertical scroll: ${JSON.stringify(opened)}`);
    }
    await cdp.screenshot(`pikapp-archive-${label}-cover.png`);
    const authoredViews = [
      ['creighton', 'expansion-creighton-opener.webp', 'Creighton opener view selected.'],
      ['timeline', 'expansion-timeline.webp', 'Expansion timeline view selected.'],
      ['support', 'expansion-post-support.webp', 'Post-expansion support view selected.'],
      ['statistics', 'expansion-national-statistics.webp', 'National statistics view selected.'],
      ['map', 'expansion-regional-map.webp', 'Regional map view selected.'],
      ['event', 'expansion-event-application.webp', 'Event application view selected.'],
    ];
    for (const [view, filename, expectedStatus] of authoredViews) {
      const viewPoint = await cdp.evaluate(`(()=>{const button=document.querySelector('[data-archive-view="${view}"]');button.scrollIntoView({block:'center',behavior:'instant'});const r=button.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()`);
      await delay(60);
      await cdp.clickAt(viewPoint.x, viewPoint.y);
      await delay(100);
      const selected = await cdp.evaluate(`(()=>{const dialog=document.querySelector('[data-archive-dialog]');const master=dialog.querySelector('[data-archive-master="${view}"]');return {visible:!master.hidden,loaded:master.getAttribute('src')?.endsWith('${filename}'),pressed:dialog.querySelector('[data-archive-view="${view}"]').getAttribute('aria-pressed'),activeMasters:[...dialog.querySelectorAll('[data-archive-master]')].filter((image)=>!image.hidden).map((image)=>image.dataset.archiveMaster),status:dialog.querySelector('.archive-status').textContent.trim()}})()`);
      assert(selected.visible&&selected.loaded&&selected.pressed==='true'&&selected.activeMasters.length===1&&selected.activeMasters[0]===view&&selected.status===expectedStatus,`${label}: ${view} archive selection failed: ${JSON.stringify(selected)}`);
    }
    const contextPoint = await cdp.evaluate(`(()=>{const button=document.querySelector('[data-archive-view="context"]');button.scrollIntoView({block:'center',behavior:'instant'});const r=button.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()`);
    await delay(60);
    await cdp.clickAt(contextPoint.x, contextPoint.y);
    await delay(140);
    const switched = await cdp.evaluate(`(()=>{const dialog=document.querySelector('[data-archive-dialog]');const cover=dialog.querySelector('[data-archive-master="cover"]');const context=dialog.querySelector('[data-archive-master="context"]');return {coverHidden:cover.hidden,contextHidden:context.hidden,contextLoaded:context.getAttribute('src')?.endsWith('belltower-expansion.jpg'),coverPressed:dialog.querySelector('[data-archive-view="cover"]').getAttribute('aria-pressed'),contextPressed:dialog.querySelector('[data-archive-view="context"]').getAttribute('aria-pressed'),status:dialog.querySelector('.archive-status').textContent.trim()}})()`);
    assert(switched.coverHidden&&!switched.contextHidden&&switched.contextLoaded&&switched.coverPressed==='false'&&switched.contextPressed==='true'&&switched.status==='Context view selected.',`${label}: related-view switch failed: ${JSON.stringify(switched)}`);
    await cdp.key('Escape','Escape',27);
    await delay(120);
    const closed = await cdp.evaluate(`(()=>{const dialog=document.querySelector('[data-archive-dialog]');return {open:dialog.open,bodyLocked:document.body.classList.contains('archive-open'),focus:document.activeElement?.className,bodyPadding:document.body.style.getPropertyValue('--archive-scrollbar')}})()`);
    assert(!closed.open&&!closed.bodyLocked&&closed.focus.includes('expansion-archive-trigger')&&!closed.bodyPadding,`${label}: Escape did not close, unlock, and restore focus: ${JSON.stringify(closed)}`);
    await cdp.key('Enter','Enter',13);
    await delay(120);
    const keyboardOpen = await cdp.evaluate(`(()=>{const dialog=document.querySelector('[data-archive-dialog]');return {open:dialog.open,focus:document.activeElement?.className,bodyLocked:document.body.classList.contains('archive-open'),layoutScrollTop:dialog.querySelector('.archive-layout').scrollTop,status:dialog.querySelector('.archive-status').textContent.trim(),coverPressed:dialog.querySelector('[data-archive-view="cover"]').getAttribute('aria-pressed')}})()`);
    assert(keyboardOpen.open&&keyboardOpen.focus.includes('archive-close')&&keyboardOpen.bodyLocked&&keyboardOpen.layoutScrollTop<=1&&keyboardOpen.status==='Cover view selected.'&&keyboardOpen.coverPressed==='true',`${label}: Enter did not reactivate the archive in a synchronized cover state: ${JSON.stringify(keyboardOpen)}`);
    for (let index = 0; index < 9; index += 1) await cdp.key('Tab','Tab',9);
    const forwardTrap = await cdp.evaluate(`document.activeElement?.className || ''`);
    assert(forwardTrap.includes('archive-close'),`${label}: forward Tab escaped the modal instead of cycling to Close: ${forwardTrap}`);
    await cdp.key('Tab','Tab',9,8);
    const reverseTrap = await cdp.evaluate(`document.activeElement?.dataset?.archiveView || ''`);
    assert(reverseTrap==='context',`${label}: Shift+Tab did not cycle from Close to final archive view: ${reverseTrap}`);
    await cdp.key('Escape','Escape',27);
    await delay(80);
  };

  await verifyArchive({ label: '1280x720', width: 1280, height: 720, mobile: false });
  await verifyArchive({ label: '390x844', width: 390, height: 844, mobile: true });

  await cdp.call('Emulation.setDeviceMetricsOverride', { width:390,height:844,deviceScaleFactor:1,mobile:true });
  await cdp.navigate(`${baseUrl}/pikappapp.html`);
  const before=await cdp.evaluate(`({index:[...document.querySelectorAll('.phone-slide')].findIndex((slide)=>slide.classList.contains('is-active')),count:document.getElementById('phone-story-count').textContent})`);
  await delay(5400);
  const afterWait=await cdp.evaluate(`({index:[...document.querySelectorAll('.phone-slide')].findIndex((slide)=>slide.classList.contains('is-active')),count:document.getElementById('phone-story-count').textContent})`);
  assert(before.index===afterWait.index&&before.count===afterWait.count,'reduced-motion mode did not stop auto-rotation');
  const semantics=await cdp.evaluate(`(()=>{const button=document.getElementById('phone-next');button.click();return {tag:button.tagName,type:button.type,label:button.getAttribute('aria-label'),index:[...document.querySelectorAll('.phone-slide')].findIndex((slide)=>slide.classList.contains('is-active')),count:document.getElementById('phone-story-count').textContent,advancing:document.querySelector('[data-phone-story]').classList.contains('is-advancing')}})()`);
  assert(semantics.tag==='BUTTON'&&semantics.type==='button'&&semantics.label==='Next app screen','phone control lost native keyboard semantics');
  assert(semantics.index===(before.index+1)%6&&semantics.count===`${semantics.index+1} / 6`,`next control failed: before=${JSON.stringify(before)} after=${JSON.stringify(semantics)}`);
  assert(!semantics.advancing,'reduced-motion mode must not add the transition state');
  await cdp.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  const motion=await cdp.evaluate(`(()=>{const story=document.querySelector('[data-phone-story]');document.getElementById('phone-next').click();const active=story.querySelector('.phone-slide.is-active');const index=[...story.querySelectorAll('.phone-slide')].indexOf(active);return {direction:story.dataset.direction,advancing:story.classList.contains('is-advancing'),screenAnimation:getComputedStyle(active).animationName,titleAnimation:getComputedStyle(document.getElementById('phone-story-title')).animationName,index,count:document.getElementById('phone-story-count').textContent}})()`);
  assert(motion.direction==='next'&&motion.advancing&&motion.screenAnimation==='phone-enter-next'&&motion.titleAnimation==='phone-copy-rise',`normal-motion transition failed: ${JSON.stringify(motion)}`);
  const previousMotion=await cdp.evaluate(`(()=>{const story=document.querySelector('[data-phone-story]');document.getElementById('phone-prev').click();const active=story.querySelector('.phone-slide.is-active');const index=[...story.querySelectorAll('.phone-slide')].indexOf(active);return {direction:story.dataset.direction,advancing:story.classList.contains('is-advancing'),screenAnimation:getComputedStyle(active).animationName,titleAnimation:getComputedStyle(document.getElementById('phone-story-title')).animationName,index,count:document.getElementById('phone-story-count').textContent}})()`);
  assert(previousMotion.index===(motion.index+5)%6&&previousMotion.count===`${previousMotion.index+1} / 6`&&previousMotion.direction==='previous'&&previousMotion.advancing&&previousMotion.screenAnimation==='phone-enter-previous'&&previousMotion.titleAnimation==='phone-copy-rise',`previous normal-motion transition failed: ${JSON.stringify({motion,previousMotion})}`);
  assert(!cdp.exceptions.length,`JavaScript exceptions: ${JSON.stringify(cdp.exceptions)}`);
  assert(!cdp.consoleErrors.length,`console errors: ${JSON.stringify(cdp.consoleErrors)}`);
  console.log(`PI KAPP BROWSER CONTRACT: PASS states=${checks} images=16 overflow=0 archive=8 reduced-motion=pass transitions=pass controls=pass v2-static=removed explorations=0 remaster=6 galleries=3`);
  console.log(`Evidence: ${evidenceDir}`);
} finally {
  try { cdp?.socket?.close(); } catch {}
  await stopChild(child);
  if (siteChild) await stopChild(siteChild);
  try { fs.rmSync(profile,{recursive:true,force:true,maxRetries:4,retryDelay:100}); } catch {}
}
