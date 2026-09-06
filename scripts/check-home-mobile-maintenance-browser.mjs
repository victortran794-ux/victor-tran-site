#!/usr/bin/env node
/** Compact real-Chromium contract for Home's deferred responsive portraits. */
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceDir = process.env.HOME_MAINTENANCE_EVIDENCE_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'home-maintenance-evidence-'));
const chrome = process.env.CHROME_BIN || [
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].find(fs.existsSync);
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const mime = file => ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' }[path.extname(file)] || 'application/octet-stream');

async function ownServer() {
  const server = http.createServer((req, res) => {
    const raw = decodeURIComponent(new URL(req.url, 'http://local').pathname);
    const file = path.resolve(root, `.${raw === '/' ? '/index.html' : raw}`);
    if (!file.startsWith(`${root}${path.sep}`) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'content-type': mime(file), 'cache-control': 'no-store' }); fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}
class Cdp {
  constructor(url) { this.url = url; this.id = 0; this.pending = new Map(); this.errors = []; this.originals = []; this.portraits = []; }
  async open() {
    this.ws = new WebSocket(this.url);
    this.ws.addEventListener('message', e => { const m = JSON.parse(e.data);
      if (m.id) { const p = this.pending.get(m.id); if (!p) return; this.pending.delete(m.id); m.error ? p.reject(Error(`${p.method}: ${m.error.message}`)) : p.resolve(m.result); return; }
      if (m.method === 'Runtime.exceptionThrown') this.errors.push(m.params.exceptionDetails.text || 'exception');
      if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') this.errors.push(m.params.args.map(x => x.value || x.description || '').join(' '));
      if (m.method === 'Network.requestWillBeSent' && /\/images\/hero\/figure(?:19|20)\.webp(?:\?|$)/.test(m.params.request.url)) this.originals.push(m.params.request.url);
      if (m.method === 'Network.requestWillBeSent' && /\/images\/hero\/responsive\/figure(?:19|20)-\d+\.webp(?:\?|$)/.test(m.params.request.url)) this.portraits.push(m.params.request.url);
    });
    await new Promise((resolve, reject) => { this.ws.addEventListener('open', resolve, { once: true }); this.ws.addEventListener('error', reject, { once: true }); });
  }
  call(method, params = {}) { const id = ++this.id; return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject, method }); this.ws.send(JSON.stringify({ id, method, params })); setTimeout(() => { if (this.pending.delete(id)) reject(Error(`${method} timed out`)); }, 15000); }); }
  async eval(expression) { const r = await this.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; }
  async nav(url) { await this.call('Page.navigate', { url }); for (let i = 0; i < 100; i++) { if (await this.eval('document.readyState') === 'complete') break; await sleep(40); } await sleep(250); }
  async shot(name) { const r = await this.call('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(evidenceDir, name), Buffer.from(r.data, 'base64')); }
  async click(selector) { await this.eval(`(() => [...document.querySelectorAll(${JSON.stringify(selector)})].find(x => { const r=x.getBoundingClientRect(), s=getComputedStyle(x); return r.width&&r.height&&s.display!=='none'&&s.visibility!=='hidden' })?.scrollIntoView({block:'center',inline:'center'}) )()`); await sleep(40); const p = await this.eval(`(() => { const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(x => { const r=x.getBoundingClientRect(), s=getComputedStyle(x); return r.width&&r.height&&s.display!=='none'&&s.visibility!=='hidden'; }), r=e?.getBoundingClientRect(); return r?[r.left+r.width/2,r.top+r.height/2]:null })()`); assert(p, `visible target missing ${selector}`); for (const type of ['mousePressed', 'mouseReleased']) await this.call('Input.dispatchMouseEvent', { type, x: p[0], y: p[1], button: 'left', clickCount: 1 }); await sleep(120); }
}
async function launch() {
  assert(chrome && fs.existsSync(chrome), 'Chrome binary not found; set CHROME_BIN');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'home-maintenance-chrome-'));
  const browser = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
  const portFile = path.join(profile, 'DevToolsActivePort'); let port;
  for (let i = 0; i < 100; i++) { if (fs.existsSync(portFile)) { port = +fs.readFileSync(portFile, 'utf8').split(/\r?\n/)[0]; break; } if (browser.exitCode !== null) throw Error(`Chrome exited ${browser.exitCode}`); await sleep(50); }
  assert(port, 'Chrome DevTools endpoint did not start');
  let target; for (let i = 0; i < 100; i++) { try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(x => x.type === 'page'); if (target) break; } catch {} await sleep(50); }
  assert(target?.webSocketDebuggerUrl, 'Chrome page target unavailable'); return { browser, profile, cdp: new Cdp(target.webSocketDebuggerUrl) };
}
const probe = `(() => {
  const $ = s => document.querySelector(s), all = s => [...document.querySelectorAll(s)], box = e => { const r=e.getBoundingClientRect(); return [r.width,r.height,r.left,r.top]; };
  const hero=$('.hero'), ambient=$('.hero-ambient'), imgs=all('.hero-portrait-cutout');
  return { theme: document.documentElement.dataset.theme || 'light', overflow: document.documentElement.scrollWidth-document.documentElement.clientWidth,
    images: imgs.map(i=>({src:i.getAttribute('src')||'', current:i.currentSrc||'', complete:i.complete, natural:i.naturalWidth, display:getComputedStyle(i).display, opacity:+getComputedStyle(i.closest('.hero-portrait')).opacity})),
    hero: box(hero), ambient: box(ambient), ambientClient: [ambient.clientWidth, ambient.clientHeight], blobs: all('.hero-ambient-blob').map(e=>({left:getComputedStyle(e).left,top:getComputedStyle(e).top,transform:getComputedStyle(e).transform,shift:[getComputedStyle(e).getPropertyValue('--blob-shift-x'),getComputedStyle(e).getPropertyValue('--blob-shift-y')]})),
    dna: { expanded:$('.hero-dna-trigger')?.getAttribute('aria-expanded'), hidden:$('#heroDnaPanel')?.hidden },
  };
})()`;
async function switchLens(cdp, lens) {
  const desktop = `.lens-switcher > .lens-switcher-btn[data-lens=${lens}]`;
  const visible = await cdp.eval(`!![...document.querySelectorAll(${JSON.stringify(desktop)})].find(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&getComputedStyle(e).display!=='none'})`);
  if (visible) return cdp.click(desktop);
  await cdp.click('.nav-dropdown-toggle');
  await cdp.click(`.nav-mobile-theme-controls .lens-switcher-btn[data-lens=${lens}]`);
  await cdp.click('.nav-dropdown-toggle');
}
let owned; let launched; let cdp; const states = [];
try {
  fs.mkdirSync(evidenceDir, { recursive: true });
  owned = process.env.SITE_URL ? null : await ownServer();
  const siteUrl = (process.env.SITE_URL || owned.url).replace(/\/$/, '');
  assert((await fetch(`${siteUrl}/index.html`)).ok, `SITE_URL does not serve index.html: ${siteUrl}`);
  launched = await launch(); cdp = launched.cdp; await cdp.open();
  await Promise.all(['Page.enable', 'Runtime.enable', 'Network.enable'].map(m => cdp.call(m)));
  await cdp.call('Network.setCacheDisabled', { cacheDisabled: true });
  const matrix = [
    ['mobile-390-dpr2-light-motion',390,844,2,true,'light',false], ['mobile-390-dpr2-dark-motion',390,844,2,true,'dark',false],
    ['mobile-390-dpr2-light-reduced',390,844,2,true,'light',true], ['mobile-390-dpr2-dark-reduced',390,844,2,true,'dark',true],
    ['desktop-1440-light-motion',1440,900,1,false,'light',false], ['desktop-1440-dark-motion',1440,900,1,false,'dark',false],
    ['desktop-1440-light-reduced',1440,900,1,false,'light',true], ['desktop-1440-dark-reduced',1440,900,1,false,'dark',true],
  ];
  for (const [label,width,height,dpr,mobile,theme,reduced] of matrix) {
    await cdp.call('Emulation.setScriptExecutionDisabled', { value: false });
    await cdp.call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor:dpr, mobile, screenWidth:width, screenHeight:height });
    await cdp.call('Emulation.setTouchEmulationEnabled', mobile ? { enabled:true, maxTouchPoints:1 } : { enabled:false });
    await cdp.call('Emulation.setEmulatedMedia', { features:[{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}] });
    await cdp.nav(`${siteUrl}/index.html?maintenance=${label}`);
    await cdp.eval(`localStorage.setItem('lens', ${JSON.stringify(theme)})`);
    await cdp.nav('about:blank'); cdp.portraits = [];
    await cdp.nav(`${siteUrl}/index.html?maintenance=${label}&fresh=1`);
    const initial = await cdp.eval(probe); const expected = theme === 'light' ? 'figure20-' : 'figure19-';
    if (process.env.HOME_MAINTENANCE_INJECT_INACTIVE === '1') await cdp.eval(`fetch('images/hero/responsive/${theme === 'light' ? 'figure19' : 'figure20'}-320.webp?mutation=inactive')`);
    const initialRequests = [...cdp.portraits];
    assert(initialRequests.length > 0 && initialRequests.every(url => url.includes(expected)), `${label}: inactive portrait requested before theme switch ${JSON.stringify(initialRequests)}`);
    assert(initial.theme === theme, `${label}: saved theme did not apply (${initial.theme})`); assert(initial.overflow <= 0, `${label}: horizontal overflow ${initial.overflow}`);
    const loaded = initial.images.filter(i => i.src); assert(loaded.length === 1 && loaded[0].current.includes(expected), `${label}: initially only saved portrait must hydrate responsively ${JSON.stringify(initial.images)}`);
    assert(loaded[0].complete && loaded[0].natural > 0, `${label}: active portrait did not decode`);
    assert(loaded[0].current.includes('-320.webp') || loaded[0].current.includes('-640.webp'), `${label}: currentSrc is not responsive derivative ${loaded[0].current}`);
    await cdp.shot(`${label}.png`);
    const before = await cdp.eval(probe); await sleep(reduced ? 120 : 720); const after = await cdp.eval(probe);
    if (reduced) assert(after.blobs.every((b,i) => b.transform === before.blobs[i].transform), `${label}: ambient moves under reduced motion`);
    else assert(after.blobs.some((b,i) => b.transform !== before.blobs[i].transform || b.shift.join() !== before.blobs[i].shift.join()), `${label}: ambient transform did not move`);
    assert(after.blobs.every((b,i) => b.left === before.blobs[i].left && b.top === before.blobs[i].top), `${label}: ambient changed layout left/top rather than transform`);
    await switchLens(cdp, theme === 'light' ? 'dark' : 'light');
    const switched = await cdp.eval(probe); const other = theme === 'light' ? 'figure19-' : 'figure20-';
    assert(switched.images.filter(i=>i.src).length === 2 && switched.images.some(i=>i.current.includes(other) && i.complete && i.natural>0), `${label}: switching theme did not hydrate/decode counterpart ${JSON.stringify(switched.images)}`);
    await cdp.click('.hero-dna-trigger'); const open = await cdp.eval(`({expanded:document.querySelector('.hero-dna-trigger')?.getAttribute('aria-expanded'),hidden:document.getElementById('heroDnaPanel')?.hidden})`); assert(open.expanded === 'true' && !open.hidden, `${label}: DNA did not open`);
    await cdp.click('.hero-dna-trigger'); await sleep(reduced ? 60 : 520); const closed = await cdp.eval(`({expanded:document.querySelector('.hero-dna-trigger')?.getAttribute('aria-expanded'),hidden:document.getElementById('heroDnaPanel')?.hidden})`); assert(closed.expanded === 'false' && closed.hidden, `${label}: DNA did not close ${JSON.stringify(closed)}`);
    let resizeProof = null;
    if (!reduced && !mobile) {
      // Freeze the current orbit, not ResizeObserver, to isolate resize geometry.
      await cdp.eval(`window.requestAnimationFrame = () => 0; document.getAnimations().forEach(animation => animation.pause())`);
      await sleep(120); const prior = await cdp.eval(probe);
      await cdp.call('Emulation.setDeviceMetricsOverride', { width: 900, height: 700, deviceScaleFactor: dpr, mobile: false });
      // Responsive hero height has an existing CSS transition; await its settled box.
      await sleep(1200); const resized = await cdp.eval(probe);
      assert(resized.ambientClient[0] !== prior.ambientClient[0] && resized.ambientClient[1] !== prior.ambientClient[1], `${label}: resize did not change containing block`);
      for (let i = 0; i < prior.blobs.length; i++) for (let axis = 0; axis < 2; axis++) {
        const expectedShift = parseFloat(prior.blobs[i].shift[axis]) * resized.ambientClient[axis] / prior.ambientClient[axis];
        assert(Math.abs(parseFloat(resized.blobs[i].shift[axis]) - expectedShift) <= 0.03, `${label}: normalized orbit changed after resize for blob ${i}, axis ${axis}: expected ${expectedShift}, got ${resized.blobs[i].shift[axis]}, before=${JSON.stringify(prior)}, after=${JSON.stringify(resized)}`);
      }
      assert(resized.overflow <= 0, `${label}: resize created overflow`);
      resizeProof = { before: prior, after: resized };
    }
    states.push({label, initial, initialRequests, resizeProof, geometry:{hero:initial.hero,ambient:initial.ambient,ratio:[initial.ambient[0]/initial.hero[0],initial.ambient[1]/initial.hero[1]]}});
  }
  // JS-off must render the light noscript fallback rather than an empty portrait.
  await cdp.call('Emulation.setScriptExecutionDisabled', { value:true }); await cdp.call('Emulation.setDeviceMetricsOverride', { width:390,height:844,deviceScaleFactor:2,mobile:true }); await cdp.nav(`${siteUrl}/index.html?maintenance=js-off`);
  await cdp.shot('mobile-390-dpr2-light-js-off.png'); await cdp.call('Emulation.setScriptExecutionDisabled', { value:false });
  const noJs = await cdp.eval(`(() => {const i=document.querySelector('.hero-portrait-cutout[src]'); return i&&({src:i.currentSrc||i.src,complete:i.complete,natural:i.naturalWidth})})()`);
  assert(noJs?.src.includes('figure20-') && noJs.complete && noJs.natural > 0, `JS-off light portrait fallback failed ${JSON.stringify(noJs)}`);
  assert(cdp.originals.length === 0, `original figure19.webp/figure20.webp loaded: ${cdp.originals.join(', ')}`); assert(cdp.errors.length === 0, `runtime errors: ${cdp.errors.join(' | ')}`);
  fs.writeFileSync(path.join(evidenceDir, 'home-maintenance-runtime.json'), JSON.stringify({siteUrl, states, noJs, originalRequests:cdp.originals}, null, 2));
  console.log(`HOME MOBILE MAINTENANCE BROWSER: PASS states=${states.length} evidence=${evidenceDir}`);
} finally {
  try { cdp?.ws?.close(); } catch {} try { launched?.browser?.kill('SIGTERM'); } catch {} await sleep(100);
  try { if (launched) fs.rmSync(launched.profile, {recursive:true,force:true}); } catch {} try { await new Promise(resolve => owned?.server?.close(resolve) || resolve()); } catch {}
}
