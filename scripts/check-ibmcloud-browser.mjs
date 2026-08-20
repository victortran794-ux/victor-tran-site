#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const root = process.cwd();
const baseUrl = process.env.SITE_URL || 'http://127.0.0.1:8765';
const evidenceDir = process.env.IBM_CLOUD_EVIDENCE_DIR || path.join(root, '.hermes', 'evidence', 'ibm-cloud');
const chrome = [process.env.CHROME_BIN, '/home/victortran794/.agent-browser/browsers/chrome-149.0.7827.55/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find((candidate) => fs.existsSync(candidate));
if (!chrome) throw new Error('Chrome binary not found; set CHROME_BIN');

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ibm-cloud-browser-'));
const devToolsPortFile = path.join(profile, 'DevToolsActivePort');
let port;
let chromeLog = '';
const child = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--remote-allow-origins=*', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--window-size=1440,1000', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
child.stderr.on('data', (chunk) => { chromeLog += chunk.toString(); });
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

const targetReadyTimeoutMs = 30_000;
async function waitForTarget() {
  const startedAt = Date.now();
  let lastError;
  while (Date.now() - startedAt < targetReadyTimeoutMs) {
    try {
      if (!port && fs.existsSync(devToolsPortFile)) {
        const candidate = Number.parseInt(fs.readFileSync(devToolsPortFile, 'utf8').split(/\r?\n/, 1)[0], 10);
        if (Number.isInteger(candidate) && candidate > 0) port = candidate;
      }
      if (!port) throw new Error('Chrome DevTools port is not ready');
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

  let checks = 0;
  for (const viewport of [
    { label: '390', width: 390, height: 844, mobile: true },
    { label: '768', width: 768, height: 1024, mobile: true },
    { label: '1440', width: 1440, height: 1000, mobile: false },
  ]) {
    await cdp.call('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile });
    for (const theme of ['light', 'dark']) {
      await cdp.navigate(`${baseUrl}/ibmcloud.html`);
      await cdp.evaluate(`localStorage.setItem('lens', ${JSON.stringify(theme)})`);
      await cdp.navigate(`${baseUrl}/ibmcloud.html`);
      const state = await cdp.evaluate(`(async()=>{
        const images=[...document.querySelectorAll('[data-project="ibm-cloud"] img')];
        images.forEach((image)=>{image.loading='eager'});
        await Promise.all(images.map(async(image)=>{try{await image.decode()}catch{}}));
        const root=document.documentElement;
        const hero=document.querySelector('.ibm-hiring-hero');
        const controls=[...document.querySelectorAll('.project-nav-item,.nav-logo,.nav-dropdown-toggle,.nav-links>li>a,.footer-cta,.footer-social a,.footer-copy-email')]
          .filter((element)=>{const r=element.getBoundingClientRect();const s=getComputedStyle(element);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'})
          .map((element)=>{const r=element.getBoundingClientRect();return {label:element.getAttribute('aria-label')||element.textContent.trim().replace(/\\s+/g,' ').slice(0,60),width:r.width,height:r.height}});
        const adaptationCards=[...document.querySelectorAll('.ibm-adaptation-artifact')].map((card)=>{const r=card.getBoundingClientRect();const image=card.querySelector('img');return {width:r.width,left:r.left,right:r.right,src:image?.getAttribute('src'),natural:[image?.naturalWidth||0,image?.naturalHeight||0],alt:image?.getAttribute('alt')||''}});
        return {viewport:[innerWidth,innerHeight],theme:root.dataset.theme,stored:localStorage.getItem('lens'),overflow:root.scrollWidth-root.clientWidth,
          images:images.length,failed:images.filter((image)=>!image.complete||image.naturalWidth<=0).map((image)=>image.getAttribute('src')),controls,
          shell:Boolean(document.querySelector('nav.nav')&&document.querySelector('footer.footer')&&document.querySelector('.project-nav')),gate:Boolean(document.getElementById('vtd-gate')),
          proofs:document.querySelectorAll('.ibm-proof').length,artifacts:document.querySelectorAll('.ibm-evidence-artifact').length,techContext:document.querySelectorAll('.ibm-tech-context').length,reservations:document.querySelectorAll('.ibm-evidence-reservation').length,atlas:Boolean(document.querySelector('.ibm-visual-atlas')),
          client:[...document.querySelectorAll('.case-study-meta dt')].some((node)=>node.textContent.trim()==='Client'),heroBorder:getComputedStyle(hero).borderBottomWidth,
          openingEvidenceTop:document.querySelector('.ibm-hiring-hero-art').getBoundingClientRect().top,adaptationCards};
      })()`);
      assert(state.viewport[0] === viewport.width && state.viewport[1] === viewport.height, `viewport drift ${state.viewport}`);
      assert((theme === 'dark' ? state.theme === 'dark' : !state.theme || state.theme === 'light') && state.stored === theme, `theme failed ${viewport.label} ${theme}`);
      assert(state.overflow === 0, `${state.overflow}px root overflow at ${viewport.label} ${theme}`);
      assert(state.images === 27 && !state.failed.length, `media failure at ${viewport.label} ${theme}: ${JSON.stringify(state)}`);
      assert(state.shell && !state.gate && state.proofs === 3 && state.artifacts === 9 && state.techContext === 1 && state.reservations === 0 && !state.atlas && !state.client, `approved page state drifted: ${JSON.stringify(state)}`);
      assert(state.adaptationCards.length === 1 && state.adaptationCards.every((card)=>card.width>0&&card.left>=0&&card.right<=viewport.width&&card.natural[0]>0&&card.natural[1]>0&&card.alt.length>0), `Proof 02 adaptation evidence drifted at ${viewport.label} ${theme}: ${JSON.stringify(state.adaptationCards)}`);
      assert(state.heroBorder === '0px', `crowded header divider returned at ${viewport.label} ${theme}`);
      if (viewport.width === 390) {
        assert(state.openingEvidenceTop <= 720, `IBM Cloud opening evidence begins too late at ${state.openingEvidenceTop}px`);
        const undersized = state.controls.filter((control) => control.width < 44 || control.height < 44);
        assert(!undersized.length, `undersized mobile controls: ${JSON.stringify(undersized)}`);
      }
      if (viewport.width === 390 && theme === 'light') {
        await cdp.screenshot('ibm-cloud-390-light-opening.png');
        await cdp.evaluate(`document.querySelector('#event-flow-artifact').scrollIntoView({block:'center',behavior:'instant'})`);
        await delay(800);
        await cdp.screenshot('ibm-cloud-390-light-event-flow-artifact.png');
        await cdp.evaluate(`document.querySelector('.ibm-adaptation-artifact').scrollIntoView({block:'start',behavior:'instant'})`);
        await delay(800);
        await cdp.screenshot('ibm-cloud-390-light-proof02-token-translation.png');
      }
      if (viewport.width === 1440 && theme === 'dark') {
        await cdp.evaluate(`document.getElementById('team-action').scrollIntoView({block:'start',behavior:'instant'})`);
        await delay(800);
        await cdp.screenshot('ibm-cloud-1440-dark-team-action.png');
        await cdp.evaluate(`document.querySelector('.ibm-adaptation-artifact').scrollIntoView({block:'start',behavior:'instant'})`);
        await delay(800);
        await cdp.screenshot('ibm-cloud-1440-dark-proof02-token-translation.png');
        await cdp.evaluate(`document.querySelector('.ibm-theme-family').scrollIntoView({block:'start',behavior:'instant'})`);
        await delay(800);
        await cdp.screenshot('ibm-cloud-1440-dark-theme-family.png');
      }
      if (viewport.width === 390 && theme === 'dark') {
        await cdp.evaluate(`document.querySelector('.ibm-theme-family').scrollIntoView({block:'start',behavior:'instant'})`);
        await delay(800);
        await cdp.screenshot('ibm-cloud-390-dark-theme-family.png');
      }
      checks += 1;
    }
  }

  assert(!cdp.exceptions.length, `JavaScript exceptions: ${JSON.stringify(cdp.exceptions)}`);
  assert(!cdp.consoleErrors.length, `console errors: ${JSON.stringify(cdp.consoleErrors)}`);
  console.log(`IBM CLOUD BROWSER CONTRACT: PASS states=${checks} images=27 proofs=3 artifacts=9 adaptation_artifacts=1 tech_context=1 reservations=0 overflow=0 public=pass controls=pass`);
  console.log(`Evidence: ${evidenceDir}`);
} finally {
  if (cdp?.socket) cdp.socket.close();
  child.kill('SIGTERM');
  await delay(150);
  try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 4, retryDelay: 100 }); } catch {}
}
