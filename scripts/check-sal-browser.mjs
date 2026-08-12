#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const root = process.cwd();
const baseUrl = process.env.SITE_URL || 'http://127.0.0.1:8765';
const evidenceDir = process.env.SAL_EVIDENCE_DIR || path.join(root, '.hermes', 'evidence', 'sal');
const chrome = [process.env.CHROME_BIN, '/home/victortran794/.agent-browser/browsers/chrome-149.0.7827.55/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find((candidate) => fs.existsSync(candidate));
if (!chrome) throw new Error('Chrome binary not found; set CHROME_BIN');

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'sal-browser-'));
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

async function waitForTarget() {
  let lastError;
  for (let attempt = 0; attempt < 80; attempt += 1) {
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
      await cdp.navigate(`${baseUrl}/salmagazine.html`);
      await cdp.evaluate(`localStorage.setItem('lens', ${JSON.stringify(theme)})`);
      await cdp.navigate(`${baseUrl}/salmagazine.html`);
      const state = await cdp.evaluate(`(async()=>{
        const images=[...document.querySelectorAll('main#main-content img')];
        images.forEach((image)=>{image.loading='eager'});
        await Promise.all(images.map(async(image)=>{try{await image.decode()}catch{}}));
        const root=document.documentElement;
        const cells=[...document.querySelectorAll('.sal-vico2-meta .case-study-meta-item')];
        const padding=cells.map((cell)=>{const s=getComputedStyle(cell);return [s.paddingTop,s.paddingRight,s.paddingBottom,s.paddingLeft]});
        const hero=document.querySelector('.sal-vico2-hero-media img');
        const cta=document.querySelector('.sal-vico2-archive-cta');
        const actions=[...document.querySelectorAll('.sal-vico2-archive-actions a')];
        const artifactLabel=document.querySelector('.sal-vico2-artifact-copy dt');
        const awardLabel=document.querySelector('.sal-vico2-awards p');
        const archiveLabel=document.querySelector('.sal-vico2-archive-link');
        const cover=document.querySelector('.sal-vico2-cover-wall img');
        const computed=(element,properties)=>Object.fromEntries(properties.map((property)=>[property,getComputedStyle(element)[property]]));
        return {viewport:[innerWidth,innerHeight],theme:root.dataset.theme,stored:localStorage.getItem('lens'),overflow:root.scrollWidth-root.clientWidth,
          images:images.length,failed:images.filter((image)=>!image.complete||image.naturalWidth<=0).map((image)=>image.getAttribute('src')),
          hero:hero?.getAttribute('src'),heroNatural:[hero?.naturalWidth,hero?.naturalHeight],cells:cells.length,padding,
          tokenOutcomes:{
            artifactLabel:computed(artifactLabel,['fontSize','letterSpacing']),
            awardLabel:computed(awardLabel,['fontSize','letterSpacing']),
            archiveLabel:computed(archiveLabel,['fontSize','letterSpacing']),
            cover:computed(cover,['transitionProperty','transitionDuration']),
          },
          cta:Boolean(cta),actions:actions.map((a)=>({text:a.textContent.trim(),href:a.href,target:a.target,rel:a.rel})),
          duplicateConnie:[...document.querySelectorAll('img[src="images/sal-f2020-connie-owen.jpg"]')].length,
          shell:Boolean(document.querySelector('nav.nav')&&document.querySelector('footer.footer')&&document.querySelector('.project-nav'))};
      })()`);
      assert(state.viewport[0] === viewport.width && state.viewport[1] === viewport.height, `viewport drift ${state.viewport}`);
      assert((theme === 'dark' ? state.theme === 'dark' : !state.theme || state.theme === 'light') && state.stored === theme, `theme failed ${viewport.label} ${theme}`);
      assert(state.overflow === 0, `${state.overflow}px root overflow at ${viewport.label} ${theme}`);
      assert(state.images === 32 && !state.failed.length, `media failure at ${viewport.label} ${theme}: count=${state.images} failed=${JSON.stringify(state.failed)}`);
      assert(state.hero === 'images/thumb-sal.webp' && state.heroNatural[0] === 1081 && state.heroNatural[1] === 1081, `hero drifted: ${JSON.stringify(state)}`);
      assert(state.cells === 4 && state.padding.every((values)=>[values[0],values[2],values[3]].every((value)=>Number.parseFloat(value)>0)) && (viewport.width <= 700 || state.padding.every((values)=>Number.parseFloat(values[1])>0)), `metadata padding failed at ${viewport.label}: ${JSON.stringify(state.padding)}`);
      assert(state.tokenOutcomes.artifactLabel.fontSize==='13px'&&state.tokenOutcomes.artifactLabel.letterSpacing==='1.04px',`artifact label token outcome failed: ${JSON.stringify(state.tokenOutcomes)}`);
      assert(state.tokenOutcomes.awardLabel.fontSize==='13px'&&state.tokenOutcomes.awardLabel.letterSpacing==='1.04px',`award label token outcome failed: ${JSON.stringify(state.tokenOutcomes)}`);
      assert(state.tokenOutcomes.archiveLabel.fontSize==='13px',`archive label token outcome failed: ${JSON.stringify(state.tokenOutcomes)}`);
      assert(state.tokenOutcomes.cover.transitionProperty==='transform'&&state.tokenOutcomes.cover.transitionDuration==='0.3s',`cover motion token outcome failed: ${JSON.stringify(state.tokenOutcomes)}`);
      assert(state.cta && state.actions.length === 2 && state.actions.every((action)=>action.target === '_blank' && action.rel.includes('noopener')), `archive actions failed: ${JSON.stringify(state.actions)}`);
      assert(state.duplicateConnie === 1 && state.shell, `page structure drifted: ${JSON.stringify(state)}`);
      if (viewport.width === 390 && theme === 'light') {
        await cdp.screenshot('sal-390-light-opening.png');
        await cdp.evaluate(`document.querySelector('.sal-vico2-archive-cta').scrollIntoView({block:'center',behavior:'instant'})`);
        await delay(800);
        await cdp.screenshot('sal-390-light-archive.png');
      }
      if (viewport.width === 1440 && theme === 'dark') {
        await cdp.screenshot('sal-1440-dark-opening.png');
        await cdp.evaluate(`document.querySelector('.sal-vico2-archive-cta').scrollIntoView({block:'center',behavior:'instant'})`);
        await delay(800);
        await cdp.screenshot('sal-1440-dark-archive.png');
      }
      checks += 1;
    }
  }
  await cdp.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await cdp.call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await cdp.navigate(`${baseUrl}/salmagazine.html`);
  const reducedMotion = await cdp.evaluate(`(()=>{const cover=document.querySelector('.sal-vico2-cover-wall img');const style=getComputedStyle(cover);return {duration:style.transitionDuration,property:style.transitionProperty}})()`);
  assert(reducedMotion.property==='transform'&&reducedMotion.duration==='1e-05s',`reduced-motion cover transition failed: ${JSON.stringify(reducedMotion)}`);
  assert(!cdp.exceptions.length, `JavaScript exceptions: ${JSON.stringify(cdp.exceptions)}`);
  assert(!cdp.consoleErrors.length, `Console errors: ${JSON.stringify(cdp.consoleErrors)}`);
  console.log(`SAL BROWSER CONTRACT: PASS states=${checks} images=32 padding=pass overflow=0 archive=pass`);
} finally {
  try { cdp?.socket?.close(); } catch {}
  child.kill('SIGTERM');
  await delay(100);
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
}
