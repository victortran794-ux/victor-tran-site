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
      const state = await cdp.evaluate(`(async()=>{
        const images=[...document.querySelectorAll('.pikapp-page img[src]')];
        const deferredImages=[...document.querySelectorAll('.pikapp-page img[data-src]:not([src])')];
        images.forEach((image)=>{image.loading='eager'});
        await Promise.all(images.map(async(image)=>{try{await image.decode()}catch{}}));
        const root=document.documentElement;
        const controls=[...document.querySelectorAll('.phone-story__controls button,.project-nav-item,.nav-logo,.nav-dropdown-toggle,.nav-links>li>a,.footer-cta,.footer-social a,.footer-copy-email')]
          .filter((element)=>{const r=element.getBoundingClientRect();const s=getComputedStyle(element);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'})
          .map((element)=>{const r=element.getBoundingClientRect();return {label:element.getAttribute('aria-label')||element.textContent.trim().replace(/\\s+/g,' ').slice(0,60),width:r.width,height:r.height}});
        const page=document.querySelector('.pikapp-page');
        return {viewport:[innerWidth,innerHeight],theme:root.dataset.theme,stored:localStorage.getItem('lens'),overflow:root.scrollWidth-root.clientWidth,
          images:images.length,deferredImages:deferredImages.length,failed:images.filter((image)=>!image.complete||image.naturalWidth<=0).map((image)=>image.getAttribute('src')),
          controls,main:page?.id,tabindex:page?.getAttribute('tabindex'),current:document.querySelector('nav[aria-label="Primary"] [aria-current="page"]')?.getAttribute('href'),
          shell:Boolean(document.querySelector('nav.nav')&&document.querySelector('footer.footer')&&document.querySelector('.project-nav')),
          principles:document.querySelectorAll('.future-principle').length,codaScreens:document.querySelectorAll('.coda__screen').length,phoneSlides:document.querySelectorAll('.phone-slide').length,
          boundary:document.querySelector('.coda__boundary')?.textContent.trim().replace(/\\s+/g,' '),pattern:getComputedStyle(document.querySelector('.poster'),'::after').backgroundImage,
          reviewUi:Boolean(document.querySelector('.reviewbar,.decision,[data-view-button]')),privateText:['Private page review','Requested decision','KEEP / ADJUST / REJECT'].some((text)=>document.body.textContent.includes(text))};
      })()`);
      assert(state.viewport[0]===viewport.width&&state.viewport[1]===viewport.height,`viewport drift ${state.viewport}`);
      assert((theme==='dark'?state.theme==='dark':!state.theme||state.theme==='light')&&state.stored===theme,`theme failed ${viewport.label} ${theme}`);
      assert(state.overflow===0,`${state.overflow}px root overflow at ${viewport.label} ${theme}`);
      assert(state.images===11&&state.deferredImages===4&&!state.failed.length,`media failure at ${viewport.label} ${theme}: ${JSON.stringify(state)}`);
      assert(state.main==='main-content'&&state.tabindex==='-1'&&state.current==='pikappapp.html'&&state.shell,'shell or route state failed');
      assert(state.principles===3&&state.codaScreens===3&&state.phoneSlides===3,'approved evidence counts drifted');
      assert(state.boundary==='Illustrative and unvalidated. A small direction study, not a complete app, current product proposal, or live service.','boundary copy drifted');
      assert(state.pattern.includes('pattern-dark-blue.svg'),'approved pattern hero failed to resolve');
      assert(!state.reviewUi&&!state.privateText,'private review UI or copy escaped production');
      if (viewport.mobile) {
        const undersized=state.controls.filter((control)=>control.width<44||control.height<44);
        assert(!undersized.length,`undersized mobile controls: ${JSON.stringify(undersized)}`);
      }
      if (viewport.mobile&&theme==='light') {
        await cdp.screenshot('pikapp-390-light-opening.png');
        await cdp.evaluate(`document.getElementById('present-day-coda').scrollIntoView({block:'start',behavior:'instant'})`); await delay(80);
        await cdp.screenshot('pikapp-390-light-coda.png');
      }
      if (!viewport.mobile&&theme==='dark') {
        await cdp.evaluate(`document.getElementById('present-day-coda').scrollIntoView({block:'start',behavior:'instant'})`); await delay(80);
        await cdp.screenshot('pikapp-1280-dark-coda.png');
      }
      checks += 1;
    }
  }

  const verifyArchive = async ({ label, width, height, mobile }) => {
    await cdp.call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
    await cdp.navigate(`${baseUrl}/pikappapp.html`);
    await cdp.evaluate(`localStorage.setItem('lens','light')`);
    await cdp.navigate(`${baseUrl}/pikappapp.html`);
    const beforeArchive = await cdp.evaluate(`(()=>{const trigger=document.querySelector('.expansion-archive-trigger');trigger.scrollIntoView({block:'center',behavior:'instant'});const dialog=document.querySelector('[data-archive-dialog]');return {open:dialog.open,bodyLocked:document.body.classList.contains('archive-open'),deferred:dialog.querySelectorAll('img[data-src]:not([src])').length,coverSource:dialog.querySelector('[data-archive-master="cover"]').getAttribute('src'),rootOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth}})()`);
    assert(!beforeArchive.open&&!beforeArchive.bodyLocked&&beforeArchive.deferred===4&&!beforeArchive.coverSource&&beforeArchive.rootOverflow===0,`${label}: archive loaded or locked before activation: ${JSON.stringify(beforeArchive)}`);
    await delay(80);
    await cdp.screenshot(`pikapp-archive-${label}-entry.png`);
    const triggerPoint = await cdp.evaluate(`(()=>{const r=document.querySelector('.expansion-archive-trigger').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,width:r.width,height:r.height}})()`);
    assert(triggerPoint.width>=44&&triggerPoint.height>=44,`${label}: archival trigger is undersized`);
    await cdp.clickAt(triggerPoint.x, triggerPoint.y);
    await delay(180);
    await cdp.evaluate(`Promise.all([...document.querySelectorAll('[data-archive-dialog] img[src]')].map(async(image)=>{try{await image.decode()}catch{}}))`);
    const opened = await cdp.evaluate(`(()=>{const dialog=document.querySelector('[data-archive-dialog]');const stage=dialog.querySelector('.archive-stage');const master=dialog.querySelector('[data-archive-master="cover"]');const context=dialog.querySelector('[data-archive-master="context"]');const layout=dialog.querySelector('.archive-layout');const dr=dialog.getBoundingClientRect();const sr=stage.getBoundingClientRect();const mr=master.getBoundingClientRect();const scrollRegions=[...dialog.querySelectorAll('*')].filter((element)=>{const style=getComputedStyle(element);return element.scrollHeight>element.clientHeight+2&&['auto','scroll'].includes(style.overflowY)}).map((element)=>element.className);return {open:dialog.open,focus:document.activeElement?.className,bodyLocked:document.body.classList.contains('archive-open'),coverLoaded:master.getAttribute('src')?.endsWith('expansion-cover-detail.jpg'),contextDeferred:!context.hasAttribute('src'),thumbnailsLoaded:[...dialog.querySelectorAll('.archive-view img')].every((image)=>image.hasAttribute('src')),pressed:dialog.querySelector('[data-archive-view="cover"]').getAttribute('aria-pressed'),status:dialog.querySelector('.archive-status').textContent.trim(),objectFit:getComputedStyle(master).objectFit,contained:mr.left>=sr.left-1&&mr.right<=sr.right+1&&mr.top>=sr.top-1&&mr.bottom<=sr.bottom+1,dialogRect:{left:dr.left,top:dr.top,width:dr.width,height:dr.height},rootOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,scrollRegions,layoutScrollHeight:layout.scrollHeight,layoutClientHeight:layout.clientHeight}})()`);
    assert(opened.open&&opened.focus.includes('archive-close')&&opened.bodyLocked,`${label}: dialog did not open with close focus and body lock: ${JSON.stringify(opened)}`);
    assert(opened.coverLoaded&&opened.contextDeferred&&opened.thumbnailsLoaded,`${label}: deferred archive loading failed: ${JSON.stringify(opened)}`);
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
  console.log(`PI KAPP BROWSER CONTRACT: PASS states=${checks} images=11 overflow=0 archive=2 keyboard=pass reduced-motion=pass controls=pass`);
  console.log(`Evidence: ${evidenceDir}`);
} finally {
  if (cdp?.socket) cdp.socket.close();
  child.kill('SIGTERM');
  await delay(150);
  try { fs.rmSync(profile,{recursive:true,force:true,maxRetries:4,retryDelay:100}); } catch {}
}
