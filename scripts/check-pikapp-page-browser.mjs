#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const root = process.cwd();
const baseUrl = process.env.SITE_URL || 'http://127.0.0.1:8765';
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
  constructor(url) { this.url = url; this.nextId = 1; this.pending = new Map(); this.waiters = new Map(); this.exceptions = []; this.consoleErrors = []; }
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
      waiters.push(resolve); this.waiters.set(method, waiters);
      setTimeout(() => reject(new Error(`${method} event timed out`)), timeout);
    });
  }
  async evaluate(expression) {
    const result = await this.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  async navigate(url) {
    const loaded = this.event('Page.loadEventFired');
    await this.call('Page.navigate', { url }); await loaded; await delay(120);
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
  fs.mkdirSync(evidenceDir, { recursive: true });
  const target = await waitForTarget();
  cdp = new Cdp(target.webSocketDebuggerUrl); await cdp.open();
  await cdp.call('Page.enable'); await cdp.call('Runtime.enable'); await cdp.call('Network.enable');
  await cdp.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });

  let checks = 0;
  for (const viewport of [
    { label: '390', width: 390, height: 844, mobile: true },
    { label: '1280', width: 1280, height: 720, mobile: false },
  ]) {
    await cdp.call('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile });
    for (const theme of ['light', 'dark']) {
      await cdp.navigate(`${baseUrl}/pikappapp.html`);
      await cdp.evaluate(`localStorage.setItem('lens', ${JSON.stringify(theme)})`);
      await cdp.navigate(`${baseUrl}/pikappapp.html`);
      await cdp.call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 1 });
      const state = await cdp.evaluate(`(async()=>{
        const images=[...document.querySelectorAll('.pikapp-page img[src]')];
        const deferredImages=[...document.querySelectorAll('.pikapp-page img[data-src]:not([src])')];
        images.forEach((image)=>{image.loading='eager'});
        await Promise.all(images.map(async(image)=>{try{await image.decode()}catch{}}));
        const root=document.documentElement;
        const controls=[...document.querySelectorAll('.phone-story__controls button,.prototype-embed__link,.project-nav-item,.nav-logo,.nav-dropdown-toggle,.nav-links>li>a,.footer-cta,.footer-social a,.footer-copy-email')]
          .filter((element)=>{const r=element.getBoundingClientRect();const s=getComputedStyle(element);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'})
          .map((element)=>{const r=element.getBoundingClientRect();return {label:element.getAttribute('aria-label')||element.textContent.trim().replace(/\\s+/g,' ').slice(0,60),width:r.width,height:r.height}});
        const page=document.querySelector('.pikapp-page');
        const boundaryElement=document.querySelector('.coda__boundary');
        const boundaryStyle=getComputedStyle(boundaryElement);
        const avatars=[...document.querySelectorAll('.member-card__avatar')].map((avatar)=>{const card=avatar.closest('.member-card');const ar=avatar.getBoundingClientRect();return {color:getComputedStyle(avatar).color,border:getComputedStyle(card).borderTopColor,width:ar.width,height:ar.height}});
        const futureScreens=[...document.querySelectorAll('.coda__image')].map((image)=>{const style=getComputedStyle(image);return {borderRadius:style.borderRadius,boxShadow:style.boxShadow}});
        const cue=document.querySelector('.expansion-archive-cue');
        const prototypeFrame=document.querySelector('.prototype-embed__frame');
        const prototypeRect=prototypeFrame?.getBoundingClientRect();
        return {viewport:[innerWidth,innerHeight],theme:root.dataset.theme,stored:localStorage.getItem('lens'),overflow:root.scrollWidth-root.clientWidth,
          images:images.length,deferredImages:deferredImages.length,failed:images.filter((image)=>!image.complete||image.naturalWidth<=0).map((image)=>image.getAttribute('src')),
          controls,main:page?.id,tabindex:page?.getAttribute('tabindex'),current:document.querySelector('nav[aria-label="Primary"] [aria-current="page"]')?.getAttribute('href'),
          shell:Boolean(document.querySelector('nav.nav')&&document.querySelector('footer.footer')&&document.querySelector('.project-nav')),
          principles:document.querySelectorAll('.future-principle').length,codaScreens:document.querySelectorAll('.coda__screen').length,phoneSlides:document.querySelectorAll('.phone-slide').length,
          boundary:boundaryElement?.textContent.trim().replace(/\\s+/g,' '),boundaryStyle:{fontStyle:boundaryStyle.fontStyle,fontSize:boundaryStyle.fontSize,padding:boundaryStyle.padding,borderLeftWidth:boundaryStyle.borderLeftWidth,backgroundColor:boundaryStyle.backgroundColor},avatars,futureScreens,
          cue:{text:cue.textContent.trim(),opacity:getComputedStyle(cue).opacity},hoverNone:matchMedia('(hover: none)').matches,archiveViewLabels:[...document.querySelectorAll('.archive-view')].map((button)=>({text:button.textContent.trim(),label:button.getAttribute('aria-label')})),
          next:{href:document.querySelector('.project-nav-item--next')?.getAttribute('href'),label:document.querySelector('.project-nav-item--next')?.getAttribute('aria-label')},pattern:getComputedStyle(document.querySelector('.poster'),'::after').backgroundImage,
          prototype:{src:prototypeFrame?.getAttribute('src'),title:prototypeFrame?.getAttribute('title'),loading:prototypeFrame?.getAttribute('loading'),sandbox:prototypeFrame?.getAttribute('sandbox'),width:prototypeRect?.width,height:prototypeRect?.height,link:document.querySelector('.prototype-embed__link')?.getAttribute('href')},
          reviewUi:Boolean(document.querySelector('.reviewbar,.decision,[data-view-button]')),privateText:['Private page review','Requested decision','KEEP / ADJUST / REJECT'].some((text)=>document.body.textContent.includes(text))};
      })()`);
      assert(state.viewport[0]===viewport.width&&state.viewport[1]===viewport.height,`viewport drift ${state.viewport}`);
      assert((theme==='dark'?state.theme==='dark':!state.theme||state.theme==='light')&&state.stored===theme,`theme failed ${viewport.label} ${theme}`);
      assert(state.overflow===0,`${state.overflow}px root overflow at ${viewport.label} ${theme}`);
      assert(state.images===15&&state.deferredImages===4&&!state.failed.length,`media failure at ${viewport.label} ${theme}: ${JSON.stringify(state)}`);
      assert(state.main==='main-content'&&state.tabindex==='-1'&&state.current==='pikappapp.html'&&state.shell,'shell or route state failed');
      assert(state.principles===3&&state.codaScreens===7&&state.phoneSlides===3,'approved evidence counts drifted');
      assert(state.boundary==='Illustrative and unvalidated. A small direction study, not a complete app, current product proposal, or live service.','boundary copy drifted');
      assert(state.boundaryStyle.fontStyle==='italic'&&state.boundaryStyle.fontSize==='13px'&&state.boundaryStyle.padding==='0px'&&state.boundaryStyle.borderLeftWidth==='0px'&&state.boundaryStyle.backgroundColor==='rgba(0, 0, 0, 0)',`boundary caption styling drifted: ${JSON.stringify(state.boundaryStyle)}`);
      assert(state.futureScreens.length===7&&state.futureScreens.every((screen)=>screen.borderRadius==='0px'&&screen.boxShadow==='none'),`future-state screenshots regained an artificial rounded shadow: ${JSON.stringify(state.futureScreens)}`);
      assert(state.prototype.src==='pikappapp/demo.html'&&state.prototype.title==='Earlier interactive Pi Kapp member-dashboard prototype'&&state.prototype.loading==='lazy'&&state.prototype.sandbox==='allow-scripts allow-same-origin'&&state.prototype.link==='pikappapp/demo.html',`prototype boundary drifted: ${JSON.stringify(state.prototype)}`);
      assert(state.prototype.width>0&&state.prototype.width<=340&&Math.abs((state.prototype.width/state.prototype.height)-(390/844))<0.01,`prototype embed escaped its phone viewport: ${JSON.stringify(state.prototype)}`);
      assert(state.avatars.length===3&&state.avatars.every((avatar)=>avatar.color===avatar.border&&avatar.width>=42&&avatar.height>=42),`member avatar treatment drifted: ${JSON.stringify(state.avatars)}`);
      assert(state.cue.text===''&&state.cue.opacity===((viewport.mobile||state.hoverNone)?'1':'0'),`archive cue initial state drifted at ${viewport.label}: ${JSON.stringify({cue:state.cue,hoverNone:state.hoverNone})}`);
      assert(state.archiveViewLabels.length===2&&state.archiveViewLabels.every((view)=>!view.text)&&state.archiveViewLabels.map((view)=>view.label).join('|')==='View portfolio cover|View environmental context',`archive page labels drifted: ${JSON.stringify(state.archiveViewLabels)}`);
      assert(state.next.href==='artillustration.html'&&state.next.label==='Next project: Art & Illustration',`Pi Kapp next-project route drifted: ${JSON.stringify(state.next)}`);
      assert(state.pattern.includes('pattern-dark-blue.svg'),'approved pattern hero failed to resolve');
      assert(!state.reviewUi&&!state.privateText,'private review UI or copy escaped production');
      if (viewport.mobile) {
        const undersized=state.controls.filter((control)=>control.width<44||control.height<44);
        assert(!undersized.length,`undersized mobile controls: ${JSON.stringify(undersized)}`);
      }
      if (viewport.mobile&&theme==='light') {
        await cdp.screenshot('pikapp-390-light-opening.png');
        await cdp.evaluate(`document.querySelector('.member-cards').scrollIntoView({block:'center',behavior:'instant'})`); await delay(80);
        await cdp.screenshot('pikapp-390-light-members.png');
        await cdp.evaluate(`document.querySelector('.prototype-embed').scrollIntoView({block:'center',behavior:'instant'})`); await delay(2200);
        await cdp.screenshot('pikapp-390-light-prototype.png');
        await cdp.evaluate(`document.getElementById('present-day-coda').scrollIntoView({block:'start',behavior:'instant'})`); await delay(80);
        await cdp.screenshot('pikapp-390-light-coda.png');
        await cdp.evaluate(`document.querySelector('.coda__screens').scrollIntoView({block:'start',behavior:'instant'})`); await delay(80);
        await cdp.screenshot('pikapp-390-light-future-screens.png');
        await cdp.evaluate(`document.querySelector('.coda__state-pair').scrollIntoView({block:'start',behavior:'instant'})`); await delay(80);
        await cdp.screenshot('pikapp-390-light-review-states.png');
        await cdp.evaluate(`document.querySelector('.coda__state-pair--theme').scrollIntoView({block:'start',behavior:'instant'})`); await delay(80);
        await cdp.screenshot('pikapp-390-light-theme-states.png');
        await cdp.evaluate(`document.querySelector('.coda__boundary').scrollIntoView({block:'center',behavior:'instant'})`); await delay(80);
        await cdp.screenshot('pikapp-390-light-boundary.png');
      }
      if (!viewport.mobile&&theme==='dark') {
        await cdp.evaluate(`document.querySelector('.member-cards').scrollIntoView({block:'center',behavior:'instant'})`); await delay(80);
        await cdp.screenshot('pikapp-1280-dark-members.png');
        await cdp.evaluate(`document.querySelector('.prototype-embed').scrollIntoView({block:'center',behavior:'instant'})`); await delay(2200);
        await cdp.screenshot('pikapp-1280-dark-prototype.png');
        await cdp.evaluate(`document.getElementById('present-day-coda').scrollIntoView({block:'start',behavior:'instant'})`); await delay(80);
        await cdp.screenshot('pikapp-1280-dark-coda.png');
        await cdp.evaluate(`document.querySelector('.coda__screens').scrollIntoView({block:'start',behavior:'instant'})`); await delay(80);
        await cdp.screenshot('pikapp-1280-dark-future-screens.png');
        await cdp.evaluate(`document.querySelector('.coda__state-pair').scrollIntoView({block:'start',behavior:'instant'})`); await delay(80);
        await cdp.screenshot('pikapp-1280-dark-review-states.png');
        await cdp.evaluate(`document.querySelector('.coda__state-pair--theme').scrollIntoView({block:'start',behavior:'instant'})`); await delay(80);
        await cdp.screenshot('pikapp-1280-dark-theme-states.png');
        await cdp.evaluate(`document.querySelector('.coda__boundary').scrollIntoView({block:'center',behavior:'instant'})`); await delay(80);
        await cdp.screenshot('pikapp-1280-dark-boundary.png');
      }
      checks += 1;
    }
  }

  await cdp.call('Emulation.setDeviceMetricsOverride', { width:390,height:844,deviceScaleFactor:1,mobile:true });
  await cdp.navigate(`${baseUrl}/pikappapp.html`);
  await cdp.evaluate(`document.querySelector('.prototype-embed').scrollIntoView({block:'center',behavior:'instant'})`);
  await delay(2200);
  const prototypeReady=await cdp.evaluate(`(()=>{const frame=document.querySelector('.prototype-embed__frame');const doc=frame.contentDocument;const tabs=doc?[...doc.querySelectorAll('[role="tab"]')]:[];const text=doc?.body.textContent.toLowerCase()||'';return {sameOrigin:Boolean(doc),boot:Boolean(doc?.querySelector('.prototype-boot')),bulletin:text.includes('chapter bulletin'),milestones:text.includes('milestones'),selected:tabs.find((tab)=>tab.getAttribute('aria-selected')==='true')?.textContent.trim()||''}})()`);
  assert(prototypeReady.sameOrigin&&!prototypeReady.boot&&prototypeReady.bulletin&&prototypeReady.milestones&&prototypeReady.selected==='Member',`embedded prototype did not leave its loading state: ${JSON.stringify(prototypeReady)}`);
  await cdp.evaluate(`(()=>{const doc=document.querySelector('.prototype-embed__frame').contentDocument;[...doc.querySelectorAll('[role="tab"]')].find((tab)=>tab.textContent.trim()==='Chapter')?.click()})()`);
  await delay(240);
  const prototypeChapter=await cdp.evaluate(`(()=>{const doc=document.querySelector('.prototype-embed__frame').contentDocument;const selected=[...doc.querySelectorAll('[role="tab"]')].find((tab)=>tab.getAttribute('aria-selected')==='true')?.textContent.trim();return {selected,text:doc.body.textContent.replace(/\\s+/g,' ').trim()}})()`);
  assert(prototypeChapter.selected==='Chapter'&&prototypeChapter.text.includes('Brother roster, chapter-wide milestones, and weekly standings live here.'),`embedded prototype controls did not respond: ${JSON.stringify(prototypeChapter)}`);

  const verifyArchive = async ({ label, width, height, mobile }) => {
    await cdp.call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
    await cdp.navigate(`${baseUrl}/pikappapp.html`);
    await cdp.evaluate(`localStorage.setItem('lens','light')`);
    await cdp.navigate(`${baseUrl}/pikappapp.html`);
    await cdp.call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 1 });
    const beforeArchive = await cdp.evaluate(`(()=>{const trigger=document.querySelector('.expansion-archive-trigger');trigger.scrollIntoView({block:'center',behavior:'instant'});const cue=trigger.querySelector('.expansion-archive-cue');const dialog=document.querySelector('[data-archive-dialog]');return {open:dialog.open,bodyLocked:document.body.classList.contains('archive-open'),deferred:dialog.querySelectorAll('img[data-src]:not([src])').length,coverSource:dialog.querySelector('[data-archive-master="cover"]').getAttribute('src'),rootOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,cueText:cue.textContent.trim(),cueOpacity:getComputedStyle(cue).opacity,hoverNone:matchMedia('(hover: none)').matches}})()`);
    assert(!beforeArchive.open&&!beforeArchive.bodyLocked&&beforeArchive.deferred===4&&!beforeArchive.coverSource&&beforeArchive.rootOverflow===0&&!beforeArchive.cueText&&beforeArchive.cueOpacity===((mobile||beforeArchive.hoverNone)?'1':'0'),`${label}: archive loaded, labeled, or locked before activation: ${JSON.stringify(beforeArchive)}`);
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
    assert(opened.viewLabels.every((view)=>!view.text)&&opened.viewLabels.map((view)=>view.label).join('|')==='View portfolio cover|View environmental context',`${label}: archive page labels or accessible names drifted: ${JSON.stringify(opened.viewLabels)}`);
    assert(opened.pressed==='true'&&opened.status==='Cover view selected.'&&opened.objectFit==='contain'&&opened.contained,`${label}: cover selection or containment failed: ${JSON.stringify(opened)}`);
    assert(opened.rootOverflow===0&&opened.dialogRect.left>=-1&&opened.dialogRect.top>=-1&&opened.dialogRect.width<=width+1&&opened.dialogRect.height<=height+1,`${label}: dialog escaped viewport: ${JSON.stringify(opened)}`);
    if (mobile) {
      assert(opened.scrollRegions.length===1&&opened.scrollRegions[0].includes('archive-layout')&&opened.layoutScrollHeight>opened.layoutClientHeight,`${label}: mobile archive must expose one internal vertical scroll: ${JSON.stringify(opened)}`);
    }
    await cdp.screenshot(`pikapp-archive-${label}-cover.png`);
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
    await cdp.key('Tab','Tab',9);
    await cdp.key('Tab','Tab',9);
    await cdp.key('Tab','Tab',9);
    const forwardTrap = await cdp.evaluate(`document.activeElement?.className || ''`);
    assert(forwardTrap.includes('archive-close'),`${label}: forward Tab escaped the modal instead of cycling to Close: ${forwardTrap}`);
    await cdp.key('Tab','Tab',9,8);
    const reverseTrap = await cdp.evaluate(`document.activeElement?.dataset?.archiveView || ''`);
    assert(reverseTrap==='context',`${label}: Shift+Tab did not cycle from Close to Context: ${reverseTrap}`);
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
  const semantics=await cdp.evaluate(`(()=>{const button=document.getElementById('phone-next');button.click();return {tag:button.tagName,type:button.type,label:button.getAttribute('aria-label'),index:[...document.querySelectorAll('.phone-slide')].findIndex((slide)=>slide.classList.contains('is-active')),count:document.getElementById('phone-story-count').textContent}})()`);
  assert(semantics.tag==='BUTTON'&&semantics.type==='button'&&semantics.label==='Next app screen','phone control lost native keyboard semantics');
  assert(semantics.index===(before.index+1)%3&&semantics.count===`${semantics.index+1} / 3`,`next control failed: before=${JSON.stringify(before)} after=${JSON.stringify(semantics)}`);
  assert(!cdp.exceptions.length,`JavaScript exceptions: ${JSON.stringify(cdp.exceptions)}`);
  assert(!cdp.consoleErrors.length,`console errors: ${JSON.stringify(cdp.consoleErrors)}`);
  console.log(`PI KAPP BROWSER CONTRACT: PASS states=${checks} images=15 overflow=0 archive=2 keyboard=pass reduced-motion=pass controls=pass prototype=pass`);
  console.log(`Evidence: ${evidenceDir}`);
} finally {
  try { cdp?.socket?.close(); } catch {}
  await stopChild(child);
  try { fs.rmSync(profile,{recursive:true,force:true,maxRetries:4,retryDelay:100}); } catch {}
}
