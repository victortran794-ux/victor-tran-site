#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootArg = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
const root = path.resolve(rootArg || process.cwd());
const css = fs.readFileSync(path.join(root, 'css', 'style.css'), 'utf8');
const publicPages = [
  'abilityexperience.html', 'about.html', 'artillustration.html',
  'document-processing.html', 'graphicgallery.html', 'ibm-patterns.html',
  'ibmcloud.html', 'index.html', 'pci.html', 'pikappapp.html',
  'salmagazine.html', 'uigallery.html', 'wxo-canvas.html',
];

function rule(selector) {
  const match = css.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([\\s\\S]*?)\\n\\}`, 'm'));
  assert(match, `missing ${selector} rule`);
  return match[1];
}

assert.match(rule('.project-nav-item::before'), /content:\s*none;/, 'shared reading-path navigation must not retain the decorative diamond');
assert.match(rule('.footer'), /font-family:\s*'Barlow',\s*sans-serif;/, 'footer must own its body type instead of inheriting route-local type');
assert.match(rule('.footer-social li'), /list-style:\s*none;/, 'footer social items must suppress route list markers');
assert.match(rule('.footer-social li::before'), /content:\s*none;/, 'footer social items must suppress route decorative pseudo-markers');
for (const page of publicPages) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  const footer = html.match(/<!-- generated:site-shell-footer:start -->[\s\S]*?<!-- generated:site-shell-footer:end -->/)?.[0] || '';
  assert(footer, `${page} must retain the generator-owned shared footer`);
  assert.match(footer, /href="mailto:victortran794@gmail\.com" class="footer-email"/, `${page} lost its direct email link`);
  assert.match(footer, /href="https:\/\/www\.linkedin\.com\/in\/victortrandesign\/"/, `${page} lost its LinkedIn link`);
  assert.match(footer, /href="documents\/Victor-Tran-Resume\.pdf" target="_blank" rel="noopener">Résumé<\/a>/, `${page} lost its résumé link`);
}
if (process.argv.includes('--browser')) {
  const { default: os } = await import('node:os');
  const { spawn } = await import('node:child_process');
  const evidenceDir = process.env.FOOTER_EVIDENCE_DIR;
  const baseUrl = process.env.SITE_URL;
  assert(evidenceDir && baseUrl, 'browser mode requires FOOTER_EVIDENCE_DIR and SITE_URL');
  fs.mkdirSync(evidenceDir, { recursive: true });
  const chrome = [process.env.CHROME_BIN,  '/usr/bin/google-chrome', '/usr/bin/chromium']
    .filter(Boolean).find((candidate) => fs.existsSync(candidate));
  assert(chrome, 'Chrome binary not found');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'footer-contract-'));
  const port = 9400 + (process.pid % 400);
  const child = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--remote-allow-origins=*', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--window-size=1280,840', 'about:blank'], { stdio: 'ignore', detached: true });
  const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let socket;
  let nextId = 1;
  const pending = new Map();
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++;
    const timer = setTimeout(() => { if (pending.delete(id)) reject(new Error(`${method} timed out`)); }, 15000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
  try {
    let target;
    for (let attempt = 0; attempt < 100 && !target; attempt += 1) {
      try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((entry) => entry.type === 'page'); } catch {}
      if (!target) await pause(100);
    }
    assert(target?.webSocketDebuggerUrl, 'Chrome DevTools target did not become ready');
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
    socket.addEventListener('message', ({ data }) => { const message = JSON.parse(data); if (!message.id) return; const request = pending.get(message.id); if (!request) return; pending.delete(message.id); clearTimeout(request.timer); message.error ? request.reject(new Error(message.error.message)) : request.resolve(message.result); });
    await call('Page.enable'); await call('Runtime.enable');
    const evaluate = async (expression) => {
      const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      assert(!result.exceptionDetails, result.exceptionDetails?.text || 'browser evaluation failed');
      return result.result.value;
    };
    const navigate = async (url) => { await call('Page.navigate', { url }); const expectedPath = new URL(url).pathname; for (let attempt = 0; attempt < 100; attempt += 1) { if (await evaluate(`location.pathname === ${JSON.stringify(expectedPath)} && document.readyState === 'complete'`)) break; await pause(50); } await pause(120); };
    const results = [];
    for (const [width, height] of [[1440, 900], [390, 844]]) {
      await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
      for (const theme of ['light', 'dark']) {
        for (const page of publicPages) {
          await navigate(`${baseUrl}/${page}`);
          const selector = width < 600 ? `[data-mobile-lens="${theme}"]` : `.nav-inner > .lens-switcher [data-lens="${theme}"]`;
          if (width < 600) await evaluate(`document.querySelector('.nav-dropdown-toggle')?.click()`);
          await evaluate(`(async()=>{document.querySelector('${selector}')?.click();if(innerWidth<600)document.querySelector('.nav-dropdown-toggle')?.click();await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));})()`);
          const result = await evaluate(`(async () => {
            const footer = document.querySelector('footer.footer');
            const social = footer?.querySelector('.footer-social li');
            const pseudo = social ? getComputedStyle(social, '::before').content : null;
            const rect = footer?.getBoundingClientRect();
            footer?.scrollIntoView({ block: 'start', behavior: 'instant' });
            await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            // Lazy media above the footer can move it after the initial jump.
            // Keep the real target in view while waiting for its reveal transition.
            for (let attempt = 0; attempt < 40; attempt += 1) {
              footer.scrollIntoView({ block: 'start', behavior: 'instant' });
              await new Promise(resolve => setTimeout(resolve, 100));
              if (getComputedStyle(footer).opacity === '1' && footer.getBoundingClientRect().top < innerHeight) break;
            }
            const links = [...footer.querySelectorAll('a')].map((link) => { const r = link.getBoundingClientRect(); return { text: link.textContent.trim(), left: r.left, right: r.right, width: r.width, height: r.height }; });
            return { theme: document.documentElement.dataset.theme || 'light', font: getComputedStyle(footer).fontFamily, opacity: getComputedStyle(footer).opacity, listStyle: getComputedStyle(social).listStyleType, pseudo, rootOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, footerOverflow: footer.scrollWidth - footer.clientWidth, footerTop: footer.getBoundingClientRect().top, footerHeight: footer.getBoundingClientRect().height, viewport: innerWidth, links };
          })()`);
          assert(result.theme === theme, `${page} ${width}px did not activate ${theme}`);
          assert(/^Barlow/i.test(result.font), `${page} ${width}px ${theme} footer font drifted: ${result.font}`);
          assert(result.opacity === '1', `${page} ${width}px ${theme} footer did not reveal before capture`);
          assert(result.listStyle === 'none' && result.pseudo === 'none', `${page} ${width}px ${theme} retained a footer marker: ${JSON.stringify(result)}`);
          assert(result.rootOverflow === 0 && result.footerOverflow === 0, `${page} ${width}px ${theme} footer overflow: ${JSON.stringify(result)}`);
          assert(result.links.every((link) => link.left >= -1 && link.right <= result.viewport + 1 && link.width > 0 && link.height > 0), `${page} ${width}px ${theme} clipped a footer link: ${JSON.stringify(result.links)}`);
          results.push({ page, width, theme, ...result });
          if ((page === 'index.html' || page === 'salmagazine.html') && (theme === 'light' || theme === 'dark')) {
            const image = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
            fs.writeFileSync(path.join(evidenceDir, `${page.replace('.html', '')}-footer-${width}-${theme}.png`), Buffer.from(image.data, 'base64'));
          }
        }
      }
    }
    fs.writeFileSync(path.join(evidenceDir, 'footer-browser-matrix.json'), `${JSON.stringify(results, null, 2)}\n`);
    assert(results.length === publicPages.length * 4, `incomplete browser matrix: ${results.length}`);
    console.log(`FOOTER BROWSER CONTRACT: PASS states=${results.length}`);
  } finally {
    socket?.close();
    if (child.exitCode === null) {
      try { process.kill(-child.pid, 'SIGTERM'); } catch { child.kill('SIGTERM'); }
      await Promise.race([new Promise((resolve) => child.once('exit', resolve)), pause(1000)]);
    }
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 150 }); } catch {}
  }
}
console.log(`FOOTER CONTRACT: PASS pages=${publicPages.length}`);
