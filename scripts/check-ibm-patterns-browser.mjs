#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const root = process.cwd();
const baseUrl = process.env.SITE_URL || 'http://127.0.0.1:8765';
const evidenceDir = process.env.IBM_PATTERNS_EVIDENCE_DIR || path.join(root, '.hermes', 'evidence', 'ibm-patterns');
const chrome = [process.env.CHROME_BIN, '/home/victortran794/.agent-browser/browsers/chrome-149.0.7827.55/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find((candidate) => fs.existsSync(candidate));
if (!chrome) throw new Error('Chrome binary not found; set CHROME_BIN');

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ibm-patterns-browser-'));
const port = 9600 + (process.pid % 300);
let chromeLog = '';
const child = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--remote-allow-origins=*', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--window-size=1280,720', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
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
      waiters.push(resolve);
      this.waiters.set(method, waiters);
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
    await this.call('Page.navigate', { url });
    await loaded;
    await delay(150);
  }
  async screenshot(fileName) {
    const result = await this.call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(evidenceDir, fileName), Buffer.from(result.data, 'base64'));
  }
}

let cdp;
try {
  fs.mkdirSync(evidenceDir, { recursive: true });
  cdp = new Cdp((await waitForTarget()).webSocketDebuggerUrl);
  await cdp.open();
  await cdp.call('Page.enable');
  await cdp.call('Runtime.enable');
  await cdp.call('Network.enable');

  await cdp.navigate(`${baseUrl}/ibm-patterns.html`);
  const gate = await cdp.evaluate(`({locked:document.documentElement.classList.contains('locked'),gate:Boolean(document.getElementById('vtd-gate')),dialog:document.querySelector('#vtd-gate [role="dialog"]')?.getAttribute('aria-modal'),focused:document.activeElement?.id})`);
  assert(gate.locked && gate.gate && gate.dialog === 'true' && gate.focused === 'vtd-gate-input', `password gate failed: ${JSON.stringify(gate)}`);
  await cdp.evaluate(`sessionStorage.setItem('vtd-unlock','ok')`);

  let checks = 0;
  let motionChecks = 0;
  for (const viewport of [{ label: '390', width: 390, height: 844, mobile: true }, { label: '1280', width: 1280, height: 720, mobile: false }]) {
    await cdp.call('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile });
    for (const theme of ['light', 'dark']) {
      await cdp.navigate(`${baseUrl}/ibm-patterns.html`);
      await cdp.evaluate(`localStorage.setItem('lens', ${JSON.stringify(theme)})`);
      await cdp.navigate(`${baseUrl}/ibm-patterns.html`);
      const state = await cdp.evaluate(`(async()=>{
        const images=[...document.querySelectorAll('.patterns-page img')];
        images.forEach((image)=>{image.loading='eager'});
        await Promise.all(images.map(async(image)=>{try{await image.decode()}catch{}}));
        const root=document.documentElement;
        const rgb=(value)=>{const parts=value.match(/[\\d.]+/g)?.map(Number)||[];return parts.slice(0,3)};
        const luminance=(value)=>{const [r,g,b]=rgb(value).map((channel)=>{const n=channel/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4});return .2126*r+.7152*g+.0722*b};
        const caption=document.querySelector('.patterns-playback-single .patterns-evidence-caption');
        const captionFg=luminance(getComputedStyle(caption).color);
        const captionBg=luminance(getComputedStyle(caption.closest('.patterns-playback-single')).backgroundColor);
        const captionContrast=(Math.max(captionFg,captionBg)+.05)/(Math.min(captionFg,captionBg)+.05);
        const eyebrowRect=document.querySelector('.patterns-hero-copy .patterns-eyebrow').getBoundingClientRect();
        const statusRect=document.querySelector('.site-route-status').getBoundingClientRect();
        const statusOverlap=!(eyebrowRect.right<=statusRect.left||eyebrowRect.left>=statusRect.right||eyebrowRect.bottom<=statusRect.top||eyebrowRect.top>=statusRect.bottom);
        const controls=[...document.querySelectorAll('.patterns-motion-toggle,.project-nav-item,.nav-logo,.nav-dropdown-toggle,.nav-links>li>a,.footer-cta,.footer-social a,.footer-copy-email')]
          .filter((element)=>{const r=element.getBoundingClientRect();const s=getComputedStyle(element);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'})
          .map((element)=>{const r=element.getBoundingClientRect();return {label:element.getAttribute('aria-label')||element.textContent.trim().replace(/\\s+/g,' ').slice(0,60),width:r.width,height:r.height}});
        return {viewport:[innerWidth,innerHeight],theme:root.dataset.theme,stored:localStorage.getItem('lens'),overflow:root.scrollWidth-root.clientWidth,
          images:images.length,failed:images.filter((image)=>!image.complete||image.naturalWidth<=0).map((image)=>image.getAttribute('src')),controls,
          main:document.querySelector('.patterns-page')?.id,tabindex:document.querySelector('.patterns-page')?.getAttribute('tabindex'),current:document.querySelector('nav[aria-label="Primary"] [aria-current="page"]')?.getAttribute('href'),
          shell:Boolean(document.querySelector('nav.nav')&&document.querySelector('footer.footer')&&document.querySelector('.project-nav')),gate:Boolean(document.getElementById('vtd-gate')),
          process:document.querySelectorAll('.patterns-process-item').length,heroes:document.querySelectorAll('.patterns-hero-study').length,atlas:document.querySelectorAll('.patterns-atlas-item').length,
          eyebrowTop:eyebrowRect.top,statusBottom:statusRect.bottom,statusOverlap,captionContrast,
          reviewText:['Private humanized story','local review','not approved for production'].some((text)=>document.body.textContent.includes(text))};
      })()`);
      assert(state.viewport[0] === viewport.width && state.viewport[1] === viewport.height, `viewport drift ${state.viewport}`);
      assert((theme === 'dark' ? state.theme === 'dark' : !state.theme || state.theme === 'light') && state.stored === theme, `theme failed ${viewport.label} ${theme}`);
      assert(state.overflow === 0, `${state.overflow}px root overflow at ${viewport.label} ${theme}`);
      assert(state.images === 12 && !state.failed.length, `media failure at ${viewport.label} ${theme}: ${JSON.stringify(state)}`);
      assert(state.main === 'main-content' && state.tabindex === '-1' && state.current === 'ibm-patterns.html' && state.shell, 'shell or route state failed');
      assert(!state.gate && state.process === 4 && state.heroes === 2 && state.atlas === 3 && !state.reviewText, 'approved protected page state drifted');
      assert(!state.statusOverlap, `route status overlaps hero content at ${viewport.label} ${theme}: ${JSON.stringify({eyebrowTop:state.eyebrowTop,statusBottom:state.statusBottom})}`);
      assert(state.captionContrast >= 4.5, `playback caption contrast ${state.captionContrast.toFixed(2)}:1 at ${viewport.label} ${theme}`);
      if (viewport.mobile) {
        const undersized = state.controls.filter((control) => control.width < 44 || control.height < 44);
        assert(!undersized.length, `undersized mobile controls: ${JSON.stringify(undersized)}`);
      }
      if (viewport.mobile && theme === 'light') {
        const motionBefore = await cdp.evaluate(`(()=>{const button=document.getElementById('patterns-motion-toggle');const image=document.querySelector('.patterns-hero-image');return {label:button.textContent.trim(),pressed:button.getAttribute('aria-pressed'),paused:document.querySelector('.patterns-hero-visual').classList.contains('is-paused'),playState:getComputedStyle(image).animationPlayState}})()`);
        assert(motionBefore.label === 'Pause' && motionBefore.pressed === 'false' && !motionBefore.paused && motionBefore.playState === 'running', `motion toggle initial state failed: ${JSON.stringify(motionBefore)}`);
        await cdp.evaluate(`document.getElementById('patterns-motion-toggle').click()`);
        await delay(50);
        const motionAfter = await cdp.evaluate(`(()=>{const button=document.getElementById('patterns-motion-toggle');const image=document.querySelector('.patterns-hero-image');return {label:button.textContent.trim(),pressed:button.getAttribute('aria-pressed'),paused:document.querySelector('.patterns-hero-visual').classList.contains('is-paused'),playState:getComputedStyle(image).animationPlayState}})()`);
        assert(motionAfter.label === 'Play' && motionAfter.pressed === 'true' && motionAfter.paused && motionAfter.playState === 'paused', `motion toggle activated state failed: ${JSON.stringify(motionAfter)}`);
        await cdp.evaluate(`document.getElementById('patterns-motion-toggle').click()`);
        motionChecks += 1;
        await cdp.screenshot('ibm-patterns-390-light-opening.png');
        await cdp.evaluate(`document.querySelector('.patterns-process').scrollIntoView({block:'start',behavior:'instant'}); scrollBy(0,-140)`);
        await delay(100);
        await cdp.screenshot('ibm-patterns-390-light-process.png');
      }
      if (!viewport.mobile && theme === 'dark') {
        await cdp.evaluate(`document.getElementById('chapter-04').scrollIntoView({block:'start',behavior:'instant'})`);
        await delay(100);
        await cdp.screenshot('ibm-patterns-1280-dark-playback.png');
      }
      checks += 1;
    }
  }

  await cdp.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await cdp.call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await cdp.navigate(`${baseUrl}/ibm-patterns.html`);
  const reduced = await cdp.evaluate(`(()=>{const image=document.querySelector('.patterns-hero-image');const button=document.getElementById('patterns-motion-toggle');return {animation:getComputedStyle(image).animationName,transform:getComputedStyle(image).transform,button:getComputedStyle(button).display}})()`);
  assert(reduced.animation === 'none' && reduced.transform === 'none' && reduced.button === 'none', `reduced motion failed: ${JSON.stringify(reduced)}`);
  assert(!cdp.exceptions.length, `JavaScript exceptions: ${JSON.stringify(cdp.exceptions)}`);
  assert(!cdp.consoleErrors.length, `console errors: ${JSON.stringify(cdp.consoleErrors)}`);
  console.log(`IBM PATTERNS BROWSER CONTRACT: PASS states=${checks} images=12 overflow=0 gate=pass reduced-motion=pass motion-toggle=${motionChecks} controls=pass`);
  console.log(`Evidence: ${evidenceDir}`);
} finally {
  if (cdp?.socket) cdp.socket.close();
  child.kill('SIGTERM');
  await delay(150);
  try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 4, retryDelay: 100 }); } catch {}
}
