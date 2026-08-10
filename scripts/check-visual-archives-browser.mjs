#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';

const root = process.cwd();
const scope = process.argv[2] ?? 'all';
if (!['art', 'graphic', 'all'].includes(scope)) {
  throw new Error('Usage: node scripts/check-visual-archives-browser.mjs [art|graphic|all]');
}
const baseUrl = process.env.SITE_URL || 'http://127.0.0.1:8896';
const evidenceDir = process.env.VISUAL_ARCHIVES_EVIDENCE_DIR || path.join(root, '.hermes', 'evidence', 'visual-archives');
const chromeCandidates = [
  process.env.CHROME_BIN,
  '/home/victortran794/.agent-browser/browsers/chrome-149.0.7827.55/chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const chrome = chromeCandidates.find((candidate) => fs.existsSync(candidate));
if (!chrome) throw new Error('Chrome binary not found; set CHROME_BIN');

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'visual-archives-browser-'));
const port = 9300 + (process.pid % 500);
let chromeLog = '';
const child = spawn(chrome, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--remote-allow-origins=*',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  '--window-size=1280,720',
  'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });
child.stderr.on('data', (chunk) => { chromeLog += chunk.toString(); });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function fetchJson(url, options) {
  const response = await fetch(url, options);
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
    } catch (error) {
      lastError = error;
    }
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
      }, 10000);
    });
  }

  event(method, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const waiters = this.waiters.get(method) || [];
      waiters.push(resolve);
      this.waiters.set(method, waiters);
      setTimeout(() => reject(new Error(`${method} event timed out`)), timeout);
    });
  }

  async evaluate(expression) {
    const result = await this.call('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed');
    return result.result.value;
  }

  async navigate(url) {
    const loaded = this.event('Page.loadEventFired');
    await this.call('Page.navigate', { url });
    await loaded;
    await delay(150);
  }

  async key(key, code, virtualKeyCode, modifiers = 0) {
    const params = { key, code, windowsVirtualKeyCode: virtualKeyCode, nativeVirtualKeyCode: virtualKeyCode, modifiers };
    await this.call('Input.dispatchKeyEvent', { type: 'keyDown', ...params });
    await this.call('Input.dispatchKeyEvent', { type: 'keyUp', ...params });
    await delay(40);
  }

  async screenshot(fileName) {
    const result = await this.call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(evidenceDir, fileName), Buffer.from(result.data, 'base64'));
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function checkLightbox(spec) {
  const trigger = await cdp.evaluate(`(() => {
    const image = document.querySelector('.gallery-spotlight img, .gallery-grid img, .gallery-section img, .series-slideshow img, .gallery-feature img, .art-archive-v2 .archive-frame > img, .graphic-archive-v2 .archive-frame > img');
    if (!image) return null;
    window.__lightboxReviewTrigger = image;
    const main = document.querySelector('main#main-content');
    const footer = document.querySelector('footer.footer');
    main.setAttribute('aria-hidden', 'false');
    footer.inert = true;
    image.focus();
    return { role: image.getAttribute('role'), hasPopup: image.getAttribute('aria-haspopup'), tabindex: image.tabIndex };
  })()`);
  assert(trigger?.role === 'button' && trigger?.hasPopup === 'dialog' && trigger?.tabindex === 0,
    `${spec.file}: gallery image is not a keyboard-operable dialog trigger: ${JSON.stringify(trigger)}`);
  await cdp.key('Enter', 'Enter', 13);
  const opened = await cdp.evaluate(`(() => {
    const dialog = document.querySelector('.lightbox');
    const main = document.querySelector('main#main-content');
    const focusables = [...dialog.querySelectorAll('button:not([disabled])')].filter((element) => getComputedStyle(element).display !== 'none' && getComputedStyle(element).visibility !== 'hidden');
    return { open: dialog.classList.contains('is-open'), active: document.activeElement?.className, overflow: document.body.style.overflow, mainInert: main.inert, mainHidden: main.getAttribute('aria-hidden'), focusables: focusables.map((element) => element.className) };
  })()`);
  assert(opened.open && opened.active.includes('lb-close') && opened.overflow === 'hidden' && opened.mainInert && opened.mainHidden === 'true',
    `${spec.file}: lightbox initial-focus/background state failed: ${JSON.stringify(opened)}`);
  assert(opened.focusables.length >= 4, `${spec.file}: lightbox controls are unexpectedly incomplete.`);
  await cdp.evaluate(`document.querySelector('.lightbox .lb-thumb:last-child').focus()`);
  await cdp.key('Tab', 'Tab', 9);
  assert(await cdp.evaluate(`document.activeElement === document.querySelector('.lightbox .lb-close')`), `${spec.file}: Tab escapes the visible lightbox controls.`);
  await cdp.key('Tab', 'Tab', 9, 8);
  assert(await cdp.evaluate(`document.activeElement === document.querySelector('.lightbox .lb-thumb:last-child')`), `${spec.file}: Shift+Tab escapes the visible lightbox controls.`);
  const countBefore = await cdp.evaluate(`document.querySelector('.lb-count').textContent`);
  await cdp.key('ArrowRight', 'ArrowRight', 39);
  const countAfterNext = await cdp.evaluate(`document.querySelector('.lb-count').textContent`);
  await cdp.key('ArrowLeft', 'ArrowLeft', 37);
  const countAfterPrev = await cdp.evaluate(`document.querySelector('.lb-count').textContent`);
  assert(countBefore !== countAfterNext && countBefore === countAfterPrev, `${spec.file}: ArrowLeft/ArrowRight navigation regressed.`);
  await cdp.key('Escape', 'Escape', 27);
  const closed = await cdp.evaluate(`(() => {
    const dialog = document.querySelector('.lightbox');
    const main = document.querySelector('main#main-content');
    const footer = document.querySelector('footer.footer');
    return { open: dialog.classList.contains('is-open'), overflow: document.body.style.overflow, mainInert: main.inert, mainHidden: main.getAttribute('aria-hidden'), footerInert: footer.inert, footerHidden: footer.getAttribute('aria-hidden'), exactTriggerFocused: document.activeElement === window.__lightboxReviewTrigger };
  })()`);
  assert(!closed.open && closed.overflow === '' && !closed.mainInert && closed.mainHidden === 'false' && closed.footerInert && closed.footerHidden === null && closed.exactTriggerFocused,
    `${spec.file}: Escape did not restore page state and the exact image trigger: ${JSON.stringify(closed)}`);

  const beforeSpace = await cdp.evaluate(`({ scrollY, exactTriggerFocused: document.activeElement === window.__lightboxReviewTrigger })`);
  assert(beforeSpace.exactTriggerFocused, `${spec.file}: exact trigger focus was lost before the Space activation check.`);
  await cdp.key(' ', 'Space', 32);
  const openedWithSpace = await cdp.evaluate(`({ open: document.querySelector('.lightbox').classList.contains('is-open'), scrollY })`);
  assert(openedWithSpace.open && openedWithSpace.scrollY === beforeSpace.scrollY,
    `${spec.file}: Space did not open the lightbox without scrolling the page: ${JSON.stringify({ beforeSpace, openedWithSpace })}`);
  await cdp.key('Escape', 'Escape', 27);
  const spaceClosed = await cdp.evaluate(`(() => {
    const main = document.querySelector('main#main-content');
    const footer = document.querySelector('footer.footer');
    const result = {
      exactTriggerFocused: document.activeElement === window.__lightboxReviewTrigger,
      mainInert: main.inert,
      mainHidden: main.getAttribute('aria-hidden'),
      footerInert: footer.inert,
      footerHidden: footer.getAttribute('aria-hidden'),
    };
    main.removeAttribute('aria-hidden');
    footer.inert = false;
    delete window.__lightboxReviewTrigger;
    return result;
  })()`);
  assert(spaceClosed.exactTriggerFocused && !spaceClosed.mainInert && spaceClosed.mainHidden === 'false' && spaceClosed.footerInert && spaceClosed.footerHidden === null,
    `${spec.file}: Space activation did not preserve and restore the exact trigger/background state: ${JSON.stringify(spaceClosed)}`);
}

async function checkLiveSlideshowFocusRestoration() {
  await cdp.call('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
  });
  await cdp.navigate(`${baseUrl}/artillustration.html`);
  const trigger = await cdp.evaluate(`(() => {
    const image = document.querySelector('[data-horned-slideshow] .series-slideshow-img.is-active');
    window.__liveSlideshowTrigger = image;
    image?.focus();
    return image ? { src: image.currentSrc || image.src, tabindex: image.tabIndex } : null;
  })()`);
  assert(trigger?.tabindex === 0, `artillustration.html: live-motion Horned Woman trigger is unavailable: ${JSON.stringify(trigger)}`);
  await cdp.key('Enter', 'Enter', 13);
  await delay(3250);
  const whileOpen = await cdp.evaluate(`(() => ({
    dialogOpen: document.querySelector('.lightbox').classList.contains('is-open'),
    sameSlideActive: window.__liveSlideshowTrigger?.classList.contains('is-active'),
    triggerHidden: window.__liveSlideshowTrigger?.getAttribute('aria-hidden'),
    triggerTabindex: window.__liveSlideshowTrigger?.tabIndex,
  }))()`);
  assert(whileOpen.dialogOpen && whileOpen.sameSlideActive && whileOpen.triggerHidden === null && whileOpen.triggerTabindex === 0,
    `artillustration.html: slideshow advanced behind the open lightbox: ${JSON.stringify(whileOpen)}`);
  await cdp.key('Escape', 'Escape', 27);
  const afterClose = await cdp.evaluate(`(() => {
    const result = {
      exactTriggerFocused: document.activeElement === window.__liveSlideshowTrigger,
      sameSlideActive: window.__liveSlideshowTrigger?.classList.contains('is-active'),
    };
    delete window.__liveSlideshowTrigger;
    return result;
  })()`);
  assert(afterClose.exactTriggerFocused && afterClose.sameSlideActive,
    `artillustration.html: live-motion lightbox did not restore the visible trigger: ${JSON.stringify(afterClose)}`);
  await cdp.call('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
}

async function checkHornedWomanCadenceAndPause() {
  await cdp.call('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
  });
  await cdp.call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await cdp.navigate(`${baseUrl}/artillustration.html`);
  await cdp.evaluate(`localStorage.setItem('lens', 'light')`);
  await cdp.navigate(`${baseUrl}/artillustration.html`);
  const before = await cdp.evaluate(`(() => {
    const stage = document.querySelector('[data-horned-slideshow] .series-slideshow-stage');
    const button = stage?.querySelector('.slideshow-pause-btn');
    const image = stage?.querySelector('.series-slideshow-img.is-active');
    const stageRect = stage?.getBoundingClientRect();
    const buttonRect = button?.getBoundingClientRect();
    stage?.scrollIntoView({ block: 'center' });
    return { interval: stage?.dataset.slideshowInterval, src: image?.getAttribute('src'), label: button?.textContent.trim(), pressed: button?.getAttribute('aria-pressed'), width: buttonRect?.width, height: buttonRect?.height, inlineInset: stageRect?.right - buttonRect?.right, blockInset: stageRect?.bottom - buttonRect?.bottom };
  })()`);
  assert(before.interval === '2000' && before.label === 'Pause' && before.pressed === 'false' && before.width >= 72 && before.height >= 44 && Math.abs(before.inlineInset - 12) <= 1 && Math.abs(before.blockInset - 12) <= 1,
    `artillustration.html: Horned Woman cadence or initial pause state failed: ${JSON.stringify(before)}`);
  await cdp.evaluate(`(() => { const button = document.querySelector('.slideshow-pause-btn'); const rect = button?.getBoundingClientRect(); if (rect) scrollTo({ top: scrollY + rect.bottom - innerHeight + 24, behavior: 'instant' }); })()`);
  await delay(100);
  await cdp.screenshot('art-390-light-motion.png');
  await delay(2150);
  const advanced = await cdp.evaluate(`document.querySelector('[data-horned-slideshow] .series-slideshow-img.is-active')?.getAttribute('src')`);
  assert(advanced && advanced !== before.src,
    `artillustration.html: Horned Woman panel did not advance on its two-second cadence: ${JSON.stringify({ before: before.src, advanced })}`);
  await cdp.evaluate(`document.querySelector('.slideshow-pause-btn').click()`);
  const paused = await cdp.evaluate(`(() => {
    const button = document.querySelector('.slideshow-pause-btn');
    const image = document.querySelector('[data-horned-slideshow] .series-slideshow-img.is-active');
    return { src: image?.getAttribute('src'), label: button?.textContent.trim(), pressed: button?.getAttribute('aria-pressed') };
  })()`);
  await delay(2150);
  const afterPause = await cdp.evaluate(`document.querySelector('[data-horned-slideshow] .series-slideshow-img.is-active')?.getAttribute('src')`);
  assert(paused.label === 'Play' && paused.pressed === 'true' && afterPause === paused.src,
    `artillustration.html: Horned Woman pause did not hold the current frame: ${JSON.stringify({ paused, afterPause })}`);
  await cdp.evaluate(`document.querySelector('.slideshow-pause-btn').focus()`);
  await cdp.key(' ', 'Space', 32);
  const resumed = await cdp.evaluate(`(() => {
    const button = document.querySelector('.slideshow-pause-btn');
    return { label: button?.textContent.trim(), pressed: button?.getAttribute('aria-pressed'), focused: document.activeElement === button };
  })()`);
  await delay(2150);
  const afterResume = await cdp.evaluate(`document.querySelector('[data-horned-slideshow] .series-slideshow-img.is-active')?.getAttribute('src')`);
  assert(resumed.label === 'Pause' && resumed.pressed === 'false' && resumed.focused && afterResume && afterResume !== afterPause,
    `artillustration.html: keyboard resume did not restart the Horned Woman cadence: ${JSON.stringify({ resumed, afterPause, afterResume })}`);
  await cdp.call('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
}

const pageSpecs = {
  art: {
    file: 'artillustration.html',
    bodyClass: 'art-archive-v2',
    archive: 'art-studio-wall',
    mainImages: 46,
  },
  graphic: {
    file: 'graphicgallery.html',
    bodyClass: 'graphic-archive-v2',
    archive: 'graphic-contact-sheet',
    mainImages: 39,
  },
};

const selectedPages = Object.entries(pageSpecs).filter(([name]) => scope === 'all' || scope === name);
let cdp;
try {
  fs.mkdirSync(evidenceDir, { recursive: true });
  const target = await waitForTarget();
  cdp = new Cdp(target.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.call('Page.enable');
  await cdp.call('Runtime.enable');
  await cdp.call('Network.enable');
  await cdp.call('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });

  let checks = 0;
  for (const [name, spec] of selectedPages) {
    for (const viewport of [
      { label: '390', width: 390, height: 844, mobile: true },
      { label: '768', width: 768, height: 900, mobile: false },
      { label: '1280', width: 1280, height: 720, mobile: false },
      { label: '1440', width: 1440, height: 900, mobile: false },
    ]) {
      await cdp.call('Emulation.setDeviceMetricsOverride', {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
        mobile: viewport.mobile,
      });

      for (const theme of ['light', 'dark']) {
        await cdp.navigate(`${baseUrl}/${spec.file}`);
        await cdp.evaluate(`localStorage.setItem('lens', ${JSON.stringify(theme)})`);
        await cdp.navigate(`${baseUrl}/${spec.file}`);

        if (viewport.mobile) {
          await cdp.evaluate(`document.querySelector('.nav-dropdown-toggle').click()`);
          await delay(80);
        }

        const state = await cdp.evaluate(`(async () => {
          const images = [...document.querySelectorAll('main img')];
          images.forEach((image) => { image.loading = 'eager'; });
          await Promise.all(images.map(async (image) => {
            try { await image.decode(); } catch {}
          }));
          const controls = [...document.querySelectorAll('.nav-logo, .nav-dropdown-toggle, .nav-links > li > a, .nav-dropdown-menu a, .nav-mobile-lens-btn, .footer-cta, .footer-social a, .footer-copy-email')]
            .filter((element) => {
              const rect = element.getBoundingClientRect();
              const style = getComputedStyle(element);
              return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
            })
            .map((element) => {
              const rect = element.getBoundingClientRect();
              return { label: element.getAttribute('aria-label') || element.textContent.trim().replace(/\\s+/g, ' ').slice(0, 60), width: rect.width, height: rect.height };
            });
          const focusTarget = document.querySelector('.gallery-spotlight img, .gallery-grid img, .gallery-section img, .series-slideshow img.is-active, .gallery-feature img, .archive-frame > img');
          focusTarget?.focus();
          const channels = (color) => (color.match(/[\\d.]+/g) || []).slice(0, 3).map(Number);
          const luminance = (color) => {
            const [r, g, b] = channels(color).map((channel) => {
              const value = channel / 255;
              return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
            });
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
          };
          const outlineLum = luminance(getComputedStyle(focusTarget).outlineColor);
          const surfaceLum = luminance(getComputedStyle(document.querySelector('.archive-primary')).backgroundColor);
          const focusContrast = (Math.max(outlineLum, surfaceLum) + 0.05) / (Math.min(outlineLum, surfaceLum) + 0.05);
          return {
            width: innerWidth,
            height: innerHeight,
            theme: document.documentElement.dataset.theme,
            storedTheme: localStorage.getItem('lens'),
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            bodyClass: document.body.className,
            archive: document.querySelector('main#main-content')?.dataset.archive,
            mainTabindex: document.querySelector('main#main-content')?.getAttribute('tabindex'),
            currentHref: document.querySelector('nav[aria-label="Primary"] [aria-current="page"]')?.getAttribute('href'),
            shellHeader: Boolean(document.querySelector('nav.nav[aria-label="Primary"]')),
            shellFooter: Boolean(document.querySelector('footer.footer')),
            projectNav: Boolean(document.querySelector('.project-nav')),
            designDna: document.body.textContent.includes('Design DNA'),
            extendedArchive: Boolean(document.querySelector('.archive-extended')),
            captions: document.querySelectorAll('main figcaption').length,
            mainImages: images.length,
            failedImages: images.filter((image) => !image.complete || image.naturalWidth <= 0).map((image) => image.getAttribute('src')),
            controls,
            focusContrast,
            artCharacters: document.querySelectorAll('.art-live-wall img').length,
            artTraditional: document.querySelectorAll('.art-restored-wall img').length,
            artHorned: document.querySelectorAll('[data-horned-slideshow] .series-slideshow-img').length,
            artHornedKeyboardTriggers: [...document.querySelectorAll('[data-horned-slideshow] .series-slideshow-img')]
              .filter((image) => image.tabIndex === 0 && image.getAttribute('role') === 'button' && image.getAttribute('aria-haspopup') === 'dialog').length,
            graphicEdc: document.querySelectorAll('.graphic-edc img').length,
            graphicSlides: document.querySelectorAll('.graphic-slides.is-compact img').length,
            graphicColumns: document.querySelector('.graphic-slides.is-compact') ? getComputedStyle(document.querySelector('.graphic-slides.is-compact')).columnCount : null,
          };
        })()`);

        assert(state.width === viewport.width && state.height === viewport.height,
          `${spec.file}: viewport drifted to ${state.width}x${state.height}`);
        const themeApplied = theme === 'dark' ? state.theme === 'dark' : !state.theme || state.theme === 'light';
        assert(themeApplied && state.storedTheme === theme,
          `${spec.file}: ${theme} mode did not synchronize and persist; state=${JSON.stringify({ theme: state.theme, storedTheme: state.storedTheme })}`);
        assert(state.overflow === 0, `${spec.file}: ${state.overflow}px root overflow at ${viewport.label}px ${theme}`);
        assert(state.bodyClass.includes(spec.bodyClass), `${spec.file}: project-native body class is missing`);
        assert(state.archive === spec.archive && state.mainTabindex === '-1', `${spec.file}: main archive/focus contract drifted`);
        assert(state.currentHref === spec.file, `${spec.file}: current-route state is wrong`);
        assert(state.shellHeader && state.shellFooter, `${spec.file}: shared shell is incomplete`);
        assert(!state.projectNav, `${spec.file}: gallery gained primary case-study previous/next navigation`);
        assert(!state.designDna, `${spec.file}: Design DNA escaped the homepage`);
        assert(!state.extendedArchive, `${spec.file}: duplicate hidden archive returned`);
        assert(state.captions === 0, `${spec.file}: expected zero primary captions; found ${state.captions}`);
        assert(state.mainImages === spec.mainImages, `${spec.file}: expected ${spec.mainImages} main images; found ${state.mainImages}`);
        assert(state.failedImages.length === 0, `${spec.file}: media failed to decode: ${JSON.stringify(state.failedImages)}`);
        assert(state.focusContrast >= 3,
          `${spec.file}: gallery focus indicator contrast is ${state.focusContrast.toFixed(2)}:1 at ${viewport.label}px ${theme}; expected at least 3:1.`);

        if (viewport.mobile) {
          const undersized = state.controls.filter((control) => control.width < 44 || control.height < 44);
          assert(!undersized.length, `${spec.file}: undersized 390px controls: ${JSON.stringify(undersized)}`);
        }
        if (name === 'art') {
          assert(state.artCharacters === 16, `artillustration.html: expected 16 Characters and worlds images; found ${state.artCharacters}`);
          assert(state.artTraditional === 5, `artillustration.html: expected 5 Traditional work images; found ${state.artTraditional}`);
          assert(state.artHorned === 7, `artillustration.html: expected 7 Horned Woman versions; found ${state.artHorned}`);
          assert(state.artHornedKeyboardTriggers === 1,
            `artillustration.html: exactly one visible Horned Woman image must be keyboard-operable; found ${state.artHornedKeyboardTriggers}`);
        } else {
          assert(state.graphicEdc === 4, `graphicgallery.html: expected 4 EDC tiles; found ${state.graphicEdc}`);
          assert(state.graphicSlides === 16, `graphicgallery.html: expected 16 presentation slides; found ${state.graphicSlides}`);
          const expectedGraphicColumns = viewport.mobile ? '2' : viewport.width === 768 ? '4' : '5';
          assert(state.graphicColumns === expectedGraphicColumns,
            `graphicgallery.html: expected ${expectedGraphicColumns} presentation columns; found ${state.graphicColumns}`);
        }

        if (theme === 'light' && !viewport.mobile) await checkLightbox(spec);

        if ((viewport.mobile && theme === 'light') || (!viewport.mobile && theme === 'dark')) {
          if (viewport.mobile) {
            await cdp.evaluate(`document.querySelector('.nav-dropdown-toggle').click()`);
            await delay(60);
          }
          await cdp.evaluate('scrollTo(0, 0)');
          await delay(60);
          await cdp.screenshot(`${name}-${viewport.label}-${theme}.png`);
        }
        checks += 1;
      }
    }
  }

  if (scope === 'all' || scope === 'art') {
    await checkHornedWomanCadenceAndPause();
    await checkLiveSlideshowFocusRestoration();
  }

  assert(cdp.exceptions.length === 0, `uncaught browser exceptions: ${cdp.exceptions.map((entry) => entry.text).join('; ')}`);
  console.log(`VISUAL ARCHIVES BROWSER CHECK: PASS scope=${scope} states=${checks} evidence=${evidenceDir}`);
} finally {
  try { cdp?.socket?.close(); } catch {}
  child.kill('SIGTERM');
  await Promise.race([new Promise((resolve) => child.once('exit', resolve)), delay(1500)]);
  if (child.exitCode === null) {
    child.kill('SIGKILL');
    await Promise.race([new Promise((resolve) => child.once('exit', resolve)), delay(1000)]);
  }
  try {
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  } catch {
    // Chrome crash-report helpers may briefly retain profile files after the test has passed.
  }
}
