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
  async key(key, code, virtualKeyCode) {
    const params = { key, code, windowsVirtualKeyCode: virtualKeyCode, nativeVirtualKeyCode: virtualKeyCode };
    await this.call('Input.dispatchKeyEvent', { type: 'keyDown', ...params });
    await this.call('Input.dispatchKeyEvent', { type: 'keyUp', ...params });
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
        const images=[...document.querySelectorAll('.pikapp-page img')];
        images.forEach((image)=>{image.loading='eager'});
        await Promise.all(images.map(async(image)=>{try{await image.decode()}catch{}}));
        const root=document.documentElement;
        const controls=[...document.querySelectorAll('.phone-story__controls button,.project-nav-item,.nav-logo,.nav-dropdown-toggle,.nav-links>li>a,.footer-cta,.footer-social a,.footer-copy-email')]
          .filter((element)=>{const r=element.getBoundingClientRect();const s=getComputedStyle(element);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'})
          .map((element)=>{const r=element.getBoundingClientRect();return {label:element.getAttribute('aria-label')||element.textContent.trim().replace(/\\s+/g,' ').slice(0,60),width:r.width,height:r.height}});
        const page=document.querySelector('.pikapp-page');
        return {viewport:[innerWidth,innerHeight],theme:root.dataset.theme,stored:localStorage.getItem('lens'),overflow:root.scrollWidth-root.clientWidth,
          images:images.length,failed:images.filter((image)=>!image.complete||image.naturalWidth<=0).map((image)=>image.getAttribute('src')),
          controls,main:page?.id,tabindex:page?.getAttribute('tabindex'),current:document.querySelector('nav[aria-label="Primary"] [aria-current="page"]')?.getAttribute('href'),
          shell:Boolean(document.querySelector('nav.nav')&&document.querySelector('footer.footer')&&document.querySelector('.project-nav')),
          principles:document.querySelectorAll('.future-principle').length,codaScreens:document.querySelectorAll('.coda__screen').length,phoneSlides:document.querySelectorAll('.phone-slide').length,
          boundary:document.querySelector('.coda__boundary')?.textContent.trim().replace(/\\s+/g,' '),pattern:getComputedStyle(document.querySelector('.poster'),'::after').backgroundImage,
          reviewUi:Boolean(document.querySelector('.reviewbar,.decision,[data-view-button]')),privateText:['Private page review','Requested decision','KEEP / ADJUST / REJECT'].some((text)=>document.body.textContent.includes(text))};
      })()`);
      assert(state.viewport[0]===viewport.width&&state.viewport[1]===viewport.height,`viewport drift ${state.viewport}`);
      assert((theme==='dark'?state.theme==='dark':!state.theme||state.theme==='light')&&state.stored===theme,`theme failed ${viewport.label} ${theme}`);
      assert(state.overflow===0,`${state.overflow}px root overflow at ${viewport.label} ${theme}`);
      assert(state.images===11&&!state.failed.length,`media failure at ${viewport.label} ${theme}: ${JSON.stringify(state)}`);
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
  console.log(`PI KAPP BROWSER CONTRACT: PASS states=${checks} images=11 overflow=0 reduced-motion=pass controls=pass`);
  console.log(`Evidence: ${evidenceDir}`);
} finally {
  if (cdp?.socket) cdp.socket.close();
  child.kill('SIGTERM');
  await delay(150);
  try { fs.rmSync(profile,{recursive:true,force:true,maxRetries:4,retryDelay:100}); } catch {}
}
