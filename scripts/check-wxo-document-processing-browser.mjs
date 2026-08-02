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
        this.httpErrors.push(`${message.params.response.status} ${message.params.response.url}`);
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
  async screenshot(fileName) {
    const result = await this.call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(evidenceDir, fileName), Buffer.from(result.data, 'base64'));
  }
}

const pages = {
  wxo: { file: 'wxo-canvas.html', bodyClass: 'wxo-page', title: 'wxO Canvas', mainImages: 6, current: null },
  doc: { file: 'document-processing.html', bodyClass: 'doc-processing-page', title: 'Document Processing', mainImages: 3, current: 'document-processing.html' },
};

let cdp;
try {
  fs.mkdirSync(evidenceDir, { recursive: true });
  cdp = new Cdp((await waitForTarget()).webSocketDebuggerUrl);
  await cdp.open();
  await cdp.call('Page.enable');
  await cdp.call('Runtime.enable');
  await cdp.call('Network.enable');

  for (const spec of Object.values(pages)) {
    await cdp.navigate(`${baseUrl}/${spec.file}`);
    await cdp.evaluate(`sessionStorage.removeItem('vtd-unlock')`);
    await cdp.navigate(`${baseUrl}/${spec.file}`);
    const gate = await cdp.evaluate(`({
      locked:document.documentElement.classList.contains('locked'),
      gate:Boolean(document.getElementById('vtd-gate')),
      dialog:document.querySelector('#vtd-gate [role="dialog"]')?.getAttribute('aria-modal'),
      focused:document.activeElement?.id,
      contentHidden:getComputedStyle(document.querySelector('main')).visibility==='hidden'
    })`);
    assert(gate.locked && gate.gate && gate.dialog === 'true' && gate.focused === 'vtd-gate-input' && gate.contentHidden,
      `${spec.file}: password gate failed ${JSON.stringify(gate)}`);
  }
  await cdp.evaluate(`sessionStorage.setItem('vtd-unlock','ok')`);

  let checks = 0;
  let lensChecks = 0;
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
          const controls=[...document.querySelectorAll('.nav-logo,.nav-dropdown-toggle,.nav-links>li>a,.nav-dropdown-menu a,.nav-mobile-lens-btn,.footer-cta,.footer-social a,.footer-copy-email,.wxo-review-controls button,.workflow-companion-link a,.project-nav-item')]
            .filter((element)=>{const r=element.getBoundingClientRect();const s=getComputedStyle(element);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'})
            .map((element)=>{const r=element.getBoundingClientRect();return {label:element.getAttribute('aria-label')||element.textContent.trim().replace(/\\s+/g,' ').slice(0,60),width:r.width,height:r.height}});
          const status=document.querySelector('.site-route-status').getBoundingClientRect();
          const header=document.querySelector('.page-header .workflow-label').getBoundingClientRect();
          const contrastTarget=document.querySelector(${name === 'wxo' ? "'.wxo-future h2'" : "'.doc-loop span'"});
          const contrastSurface=document.querySelector(${name === 'wxo' ? "'.wxo-future'" : "'.doc-loop > div'"});
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
            controls, statusOverlap:!(status.right<=header.left||status.left>=header.right||status.bottom<=header.top||status.top>=header.bottom),
            wxoCurrent:document.querySelectorAll('[data-wxo-lens="current"]:not([hidden])').length,
            wxoFuture:document.querySelectorAll('[data-wxo-lens="future"]:not([hidden])').length,
            docLoop:document.querySelectorAll('.doc-loop>div').length,
            reduced:getComputedStyle(document.querySelector('.reveal')||document.body).transitionDuration,
            contrastForeground:getComputedStyle(contrastTarget).color,
            contrastBackground:getComputedStyle(contrastSurface).backgroundColor,
          };
        })()`);
        assert(state.viewport[0]===viewport.width&&state.viewport[1]===viewport.height, `${spec.file}: viewport drift ${state.viewport}`);
        assert((theme==='dark'?state.theme==='dark':!state.theme||state.theme==='light')&&state.stored===theme, `${spec.file}: ${theme} theme failed`);
        assert(state.overflow===0, `${spec.file}: ${state.overflow}px overflow at ${viewport.label} ${theme}`);
        assert(state.bodyClass.includes(spec.bodyClass)&&state.title.includes(spec.title), `${spec.file}: route identity failed`);
        assert(state.mainId==='main-content'&&state.tabindex==='-1'&&state.current===spec.current&&state.shell&&!state.gate, `${spec.file}: shared shell or unlocked state failed`);
        assert(state.noindex==='noindex,nofollow,noarchive,nosnippet,noimageindex', `${spec.file}: robots metadata drifted`);
        assert(state.images===spec.mainImages&&!state.failedImages.length, `${spec.file}: image failure ${JSON.stringify(state.failedImages)}`);
        assert(!state.statusOverlap, `${spec.file}: protected status overlaps page header at ${viewport.label} ${theme}`);
        const ratio=contrastRatio(state.contrastForeground,state.contrastBackground);
        assert(ratio>=4.5, `${spec.file}: custom text contrast ${ratio.toFixed(2)}:1 failed at ${viewport.label} ${theme}`);
        assert(parseFloat(state.reduced)<=0.001, `${spec.file}: reduced-motion transition remained ${state.reduced} at ${viewport.label} ${theme}`);
        if(name==='wxo') assert(state.wxoCurrent===4&&state.wxoFuture===1, `wxo-canvas.html: Both lens state failed ${JSON.stringify(state)}`);
        if(name==='doc') assert(state.docLoop===5&&state.videoReady>=1&&state.videoSources===2, `document-processing.html: trust loop or video failed ${JSON.stringify(state)}`);
        if(viewport.mobile){
          const undersized=state.controls.filter((control)=>control.width<44||control.height<44);
          assert(!undersized.length, `${spec.file}: undersized mobile controls ${JSON.stringify(undersized)}`);
        }
        if(name==='wxo'&&viewport.label==='390'&&theme==='light'){
          await cdp.evaluate(`document.querySelector('.nav-dropdown-toggle').click();scrollTo(0,0)`);
          await delay(60);
          await cdp.screenshot('wxo-canvas-390-light-opening.png');
          await cdp.evaluate(`document.querySelector('[data-wxo-review="current"]').focus()`);
          await cdp.call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
          await cdp.call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
          const middleFocus=await cdp.evaluate(`document.activeElement===document.querySelector('[data-wxo-review="both"]')`);
          assert(middleFocus, 'wxo-canvas.html: lens control keyboard focus order failed at Both');
          await cdp.call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
          await cdp.call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
          const focusStyle=await cdp.evaluate(`(()=>{const button=document.querySelector('[data-wxo-review="future"]');const style=getComputedStyle(button);return {active:document.activeElement===button,outlineStyle:style.outlineStyle,outlineWidth:style.outlineWidth,boxShadow:style.boxShadow}})()`);
          assert(focusStyle.active&&(focusStyle.outlineStyle!=='none'&&parseFloat(focusStyle.outlineWidth)>0||focusStyle.boxShadow!=='none'), `wxo-canvas.html: lens control lacks visible keyboard focus ${JSON.stringify(focusStyle)}`);
          await cdp.call('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',windowsVirtualKeyCode:32});
          await cdp.call('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32});
          const future=await cdp.evaluate(`({pressed:document.querySelector('[data-wxo-review="future"]').getAttribute('aria-pressed'),current:document.querySelectorAll('[data-wxo-lens="current"]:not([hidden])').length,future:document.querySelectorAll('[data-wxo-lens="future"]:not([hidden])').length})`);
          assert(future.pressed==='true'&&future.current===0&&future.future===1, `wxo-canvas.html: Future lens keyboard interaction failed ${JSON.stringify(future)}`);
          await cdp.evaluate(`document.querySelector('.wxo-future').scrollIntoView({block:'start',behavior:'instant'});scrollBy(0,-100)`);
          await delay(60);
          await cdp.screenshot('wxo-canvas-390-light-future.png');
          await cdp.call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,modifiers:8});
          await cdp.call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,modifiers:8});
          await cdp.call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,modifiers:8});
          await cdp.call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,modifiers:8});
          const currentFocused=await cdp.evaluate(`document.activeElement===document.querySelector('[data-wxo-review="current"]')`);
          assert(currentFocused, 'wxo-canvas.html: keyboard could not return focus to Current lens');
          await cdp.call('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',windowsVirtualKeyCode:32});
          await cdp.call('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32});
          const current=await cdp.evaluate(`({pressed:document.querySelector('[data-wxo-review="current"]').getAttribute('aria-pressed'),current:document.querySelectorAll('[data-wxo-lens="current"]:not([hidden])').length,future:document.querySelectorAll('[data-wxo-lens="future"]:not([hidden])').length})`);
          assert(current.pressed==='true'&&current.current===4&&current.future===0, `wxo-canvas.html: Current lens keyboard interaction failed ${JSON.stringify(current)}`);
          await cdp.call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
          await cdp.call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
          const bothFocused=await cdp.evaluate(`document.activeElement===document.querySelector('[data-wxo-review="both"]')`);
          assert(bothFocused, 'wxo-canvas.html: keyboard could not advance focus to Both lens');
          await cdp.call('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',windowsVirtualKeyCode:32});
          await cdp.call('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32});
          const both=await cdp.evaluate(`({pressed:document.querySelector('[data-wxo-review="both"]').getAttribute('aria-pressed'),current:document.querySelectorAll('[data-wxo-lens="current"]:not([hidden])').length,future:document.querySelectorAll('[data-wxo-lens="future"]:not([hidden])').length})`);
          assert(both.pressed==='true'&&both.current===4&&both.future===1, `wxo-canvas.html: Both lens keyboard interaction failed ${JSON.stringify(both)}`);
          lensChecks+=1;
        }
        if(name==='wxo'&&viewport.label==='1280'&&theme==='dark'){
          await cdp.evaluate(`document.querySelector('.wxo-future').scrollIntoView({block:'start',behavior:'instant'});scrollBy(0,-100)`);
          await delay(80);
          await cdp.screenshot('wxo-canvas-1280-dark-future.png');
        }
        if(name==='doc'&&viewport.label==='390'&&theme==='light'){
          await cdp.evaluate(`document.querySelector('.nav-dropdown-toggle').click();scrollTo(0,0)`);
          await delay(60);
          await cdp.screenshot('document-processing-390-light-opening.png');
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
  assert(lensChecks===1, `expected one wxO interactive lens check; found ${lensChecks}`);
  assert(cdp.exceptions.length===0, `browser exceptions: ${JSON.stringify(cdp.exceptions)}`);
  assert(cdp.consoleErrors.length===0, `console errors: ${JSON.stringify(cdp.consoleErrors)}`);
  assert(cdp.httpErrors.length===0, `HTTP errors: ${JSON.stringify(cdp.httpErrors)}`);
  assert(cdp.networkFailures.length===0, `network failures: ${JSON.stringify(cdp.networkFailures)}`);
  console.log(`WXO + DOCUMENT PROCESSING BROWSER CHECK: PASS states=${checks} lens=${lensChecks} evidence=${evidenceDir}`);
} finally {
  try { cdp?.socket?.close(); } catch {}
  child.kill('SIGTERM');
  await Promise.race([new Promise((resolve)=>child.once('exit',resolve)),delay(1500)]);
  if(child.exitCode===null) child.kill('SIGKILL');
  try { fs.rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100}); } catch {}
}
