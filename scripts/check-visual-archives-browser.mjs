#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';

const root = process.cwd();
const scope = process.argv[2] ?? 'all';
if (!['art', 'graphic', 'ui', 'all'].includes(scope)) {
  throw new Error('Usage: node scripts/check-visual-archives-browser.mjs [art|graphic|ui|all]');
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
    this.requests = [];
    this.networkErrors = [];
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
      if (message.method === 'Network.requestWillBeSent') this.requests.push(message.params.request.url);
      if (message.method === 'Network.loadingFailed') this.networkErrors.push(`${message.params.errorText} ${message.params.blockedReason || ''}`.trim());
      if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) this.networkErrors.push(`${message.params.response.status} ${message.params.response.url}`);
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

function hornedRequestsSince(mark) {
  return cdp.requests.slice(mark).map((url) => {
    const match = new URL(url).pathname.match(/\/images\/(?:responsive\/)?illus-untitled-(\d+)(?:-(320|640|800)\.webp|(\.jpg))$/);
    return match && Number(match[1]) >= 5 && { url, version: Number(match[1]), width: match[2] ? Number(match[2]) : null, original: Boolean(match[3]) };
  }).filter(Boolean);
}

function assertHornedRequests(mark, allowedVersions, label, { requireOriginal = false, thumbsOnly = false } = {}) {
  const requests = hornedRequestsSince(mark);
  const unexpected = requests.filter((request) => !allowedVersions.includes(request.version));
  assert(unexpected.length === 0,
    `artillustration.html: network ${label} requested a farther Horned Woman family: ${JSON.stringify(unexpected)}`);
  if (requireOriginal) {
    assert(requests.some((request) => request.original),
      `artillustration.html: network ${label} did not request the active Horned Woman full original: ${JSON.stringify(requests)}`);
  } else {
    assert(requests.every((request) => !request.original),
      `artillustration.html: network ${label} requested a Horned Woman original before lightbox: ${JSON.stringify(requests)}`);
  }
  if (thumbsOnly) {
    assert(requests.filter((request) => !request.original).every((request) => request.width === 320),
      `artillustration.html: network ${label} used a non-320 Horned Woman thumbnail derivative: ${JSON.stringify(requests)}`);
  }
  return requests;
}

async function waitForScrollSettle() {
  let last = await cdp.evaluate('scrollY');
  let stableFrames = 0;
  for (let attempt = 0; attempt < 24; attempt += 1) {
    await delay(50);
    const current = await cdp.evaluate('scrollY');
    stableFrames = Math.abs(current - last) <= 0.5 ? stableFrames + 1 : 0;
    if (stableFrames >= 3) return current;
    last = current;
  }
  return last;
}

async function checkLightbox(spec) {
  const initiallyClosed = await cdp.evaluate(`(() => {
    const dialog = document.querySelector('.lightbox');
    const closeButton = dialog?.querySelector('.lb-close');
    closeButton?.focus();
    return dialog ? {
      open: dialog.classList.contains('is-open'),
      inert: dialog.inert,
      ariaHidden: dialog.getAttribute('aria-hidden'),
      activeInside: dialog.contains(document.activeElement),
    } : null;
  })()`);
  assert(initiallyClosed && !initiallyClosed.open && initiallyClosed.inert && initiallyClosed.ariaHidden === 'true' && !initiallyClosed.activeInside,
    `${spec.file}: closed lightbox remains exposed to accessibility or keyboard focus: ${JSON.stringify(initiallyClosed)}`);

  const trigger = await cdp.evaluate(`(() => {
    const image = document.querySelector('.gallery-spotlight img, .gallery-grid img, .gallery-section img, .series-slideshow img, .gallery-feature img, .art-archive-v2 .archive-frame > img, .graphic-archive-v2 .archive-frame > img, .ui-gallery-page .archive-frame > img:not([data-ui-scroll-image])');
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
    return { open: dialog.classList.contains('is-open'), inert: dialog.inert, ariaHidden: dialog.getAttribute('aria-hidden'), active: document.activeElement?.className, overflow: document.body.style.overflow, mainInert: main.inert, mainHidden: main.getAttribute('aria-hidden'), focusables: focusables.map((element) => element.className) };
  })()`);
  assert(opened.open && !opened.inert && opened.ariaHidden === 'false' && opened.active.includes('lb-close') && opened.overflow === 'hidden' && opened.mainInert && opened.mainHidden === 'true',
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
    return { open: dialog.classList.contains('is-open'), inert: dialog.inert, ariaHidden: dialog.getAttribute('aria-hidden'), overflow: document.body.style.overflow, mainInert: main.inert, mainHidden: main.getAttribute('aria-hidden'), footerInert: footer.inert, footerHidden: footer.getAttribute('aria-hidden'), exactTriggerFocused: document.activeElement === window.__lightboxReviewTrigger, activeInside: dialog.contains(document.activeElement) };
  })()`);
  assert(!closed.open && closed.inert && closed.ariaHidden === 'true' && !closed.activeInside && closed.overflow === '' && !closed.mainInert && closed.mainHidden === 'false' && closed.footerInert && closed.footerHidden === null && closed.exactTriggerFocused,
    `${spec.file}: Escape did not restore page state and the exact image trigger: ${JSON.stringify(closed)}`);

  // Let the site's smooth focus-restoration scroll settle before measuring Space activation.
  await waitForScrollSettle();
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

async function checkArtResponsiveMedia() {
  await cdp.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await cdp.call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  const noIntersectionObserver = process.env.VISUAL_ARCHIVES_DISABLE_IO === '1';
  const navigationMark = cdp.requests.length;
  await cdp.navigate(`${baseUrl}/artillustration.html`);
  const initial = await cdp.evaluate(`(() => {
    const slides = [...document.querySelectorAll('[data-horned-slideshow] .series-slideshow-img')];
    return {
      slides: slides.map((slide) => ({ src: slide.getAttribute('src'), deferred: slide.hasAttribute('data-deferred-src'), full: slide.dataset.fullSrc, thumb: slide.dataset.thumbSrc })),
      fullSourceRequests: performance.getEntriesByType('resource').map((entry) => entry.name).filter((name) => [5, 6, 7, 8, 9, 10, 11].some((version) => name.includes('/images/illus-untitled-' + version + '.jpg'))),
    };
  })()`);
  assert(initial.slides.length === 7 && initial.slides.every((slide) => slide.full && slide.thumb),
    `artillustration.html: responsive Horned Woman source metadata is incomplete: ${JSON.stringify(initial)}`);
  const expectedInitialLive = noIntersectionObserver ? 2 : 1;
  const expectedInitialPlaceholders = noIntersectionObserver ? 5 : 6;
  assert(initial.slides.filter((slide) => !slide.deferred).length === expectedInitialLive &&
    initial.slides.slice(0, expectedInitialLive).every((slide) => !slide.src.startsWith('data:image/')) &&
    initial.slides.slice(expectedInitialLive).every((slide) => slide.deferred && slide.src.startsWith('data:image/')) &&
    initial.slides.filter((slide) => slide.src.startsWith('data:image/')).length === expectedInitialPlaceholders,
    `artillustration.html: initial Horned Woman ${noIntersectionObserver ? 'no-observer fallback' : 'parse'} state is invalid: ${JSON.stringify(initial.slides)}`);
  assert(initial.fullSourceRequests.length === 0,
    `artillustration.html: full Horned Woman sources loaded before lightbox: ${JSON.stringify(initial.fullSourceRequests)}`);
  if (process.env.VISUAL_ARCHIVES_NETWORK_MUTATION === 'future-horned-responsive-request') {
    await cdp.evaluate(`(async () => { const url = new URL('images/responsive/illus-untitled-11-640.webp', location.href); url.searchParams.set('network-mutation', String(Date.now())); await fetch(url.href, { cache: 'no-store' }); })()`);
  }
  assertHornedRequests(navigationMark, noIntersectionObserver ? [5, 6] : [5], 'before deferred-stage intersection');

  const intersectionMark = cdp.requests.length;
  await cdp.evaluate(`document.querySelector('[data-horned-slideshow] .series-slideshow-stage').scrollIntoView({ block: 'center' })`);
  await delay(260);
  const hydrated = await cdp.evaluate(`(() => {
    const slides = [...document.querySelectorAll('[data-horned-slideshow] .series-slideshow-img')];
    return slides.map((slide) => ({ src: slide.getAttribute('src'), deferred: slide.hasAttribute('data-deferred-src') }));
  })()`);
  assert(hydrated.filter((slide) => !slide.src.startsWith('data:image/')).length === 2 && hydrated.slice(0, 2).every((slide) => !slide.deferred) && hydrated.slice(2).every((slide) => slide.deferred),
    `artillustration.html: intersection hydration must load active and next Horned Woman derivatives only: ${JSON.stringify(hydrated)}`);
  assertHornedRequests(intersectionMark, [5, 6], 'after deferred-stage intersection');

  const lightboxMark = cdp.requests.length;
  await cdp.evaluate(`document.querySelector('[data-horned-slideshow] .series-slideshow-img.is-active').focus()`);
  await cdp.key('Enter', 'Enter', 13);
  await delay(240);
  const lightbox = await cdp.evaluate(`(() => ({
    full: document.querySelector('.lightbox .lb-img')?.getAttribute('src'),
    thumbs: [...document.querySelectorAll('.lightbox .lb-thumb img')].map((image) => image.getAttribute('src')),
  }))()`);
  assert(lightbox.full === 'images/illus-untitled-5.jpg' && lightbox.thumbs.slice(1, 8).every((src, index) => src === `images/responsive/illus-untitled-${index + 5}-320.webp`),
    `artillustration.html: lightbox must use full source and compact thumbnail derivatives: ${JSON.stringify(lightbox)}`);
  const lightboxRequests = assertHornedRequests(lightboxMark, [5, 6, 7, 8, 9, 10, 11], 'on lightbox open', { requireOriginal: true });
  assert(lightboxRequests.filter((request) => request.original).every((request) => request.version === 5),
    `artillustration.html: lightbox requested a non-active Horned Woman full original: ${JSON.stringify(lightboxRequests)}`);
  assertHornedRequests(lightboxMark, [5, 6, 7, 8, 9, 10, 11], 'on lightbox thumbnail load', { requireOriginal: true, thumbsOnly: true });
  await cdp.key('Escape', 'Escape', 27);
  await delay(2050);
  const laterActivationRequests = hornedRequestsSince(intersectionMark);
  const laterSlideshowRequests = laterActivationRequests.filter((request) => request.original || request.width !== 320);
  assert(laterSlideshowRequests.every((request) => request.version <= 7),
    `artillustration.html: network before later slideshow activation requested a farther non-thumbnail Horned Woman family: ${JSON.stringify(laterSlideshowRequests)}`);
  assert(laterSlideshowRequests.filter((request) => request.original).every((request) => request.version === 5),
    `artillustration.html: network before later slideshow activation requested a non-active full original: ${JSON.stringify(laterSlideshowRequests)}`);
  await cdp.evaluate(`document.querySelector('.slideshow-pause-btn').click()`);
  await cdp.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
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

async function checkHomepageGalleryChapter() {
  await cdp.call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await cdp.navigate(`${baseUrl}/index.html`);
  const mobile = await cdp.evaluate(`(() => {
    document.querySelectorAll('.reveal').forEach((element) => element.classList.add('visible'));
    const cards = [...document.querySelectorAll('#galleries .featured-item--gallery')].map((card) => {
      const rect = card.getBoundingClientRect();
      return { left: Math.round(rect.left), width: Math.round(rect.width) };
    });
    return { title: document.querySelector('.featured-galleries-title')?.textContent.trim(), cards, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  })()`);
  assert(mobile.title === 'And some galleries.' && mobile.cards.length === 3 && mobile.overflow === 0,
    `index.html: mobile three-gallery chapter contract drifted: ${JSON.stringify(mobile)}`);
  assert(mobile.cards.every((card) => card.width >= 340) && mobile.cards.every((card) => Math.abs(card.left - mobile.cards[0].left) <= 1),
    `index.html: mobile gallery cards must share one full-width column: ${JSON.stringify(mobile.cards)}`);

  await cdp.call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp.navigate(`${baseUrl}/index.html`);
  const desktop = await cdp.evaluate(`(() => {
    const cards = [...document.querySelectorAll('#galleries .featured-item--gallery')].map((card) => Math.round(card.getBoundingClientRect().width));
    return { cards, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  })()`);
  assert(desktop.cards.length === 3 && desktop.overflow === 0 && Math.abs(desktop.cards[0] - desktop.cards[1]) <= 1 && desktop.cards[2] > desktop.cards[0],
    `index.html: desktop gallery hierarchy drifted: ${JSON.stringify(desktop)}`);
}

function graphicRequestsSince(mark) {
  return cdp.requests.slice(mark).filter((url) => new URL(url).pathname.includes('/images/'));
}

async function checkGraphicResponsiveMedia() {
  const noIntersectionObserver = process.env.VISUAL_ARCHIVES_DISABLE_IO === '1';
  const representatives = [
    'images/logos-2.jpg', 'images/gg-edc-1.jpg', 'images/thumb-sgla.webp',
    'images/graphic-archive-v2/sgla-2024-identity-development.webp', 'images/logos-1.jpg',
    'images/gg-slides-1.jpg', 'images/graphic-archive-v2/abex.webp',
    'images/graphic-archive-v2/sc56-instagram-panel-series.webp', 'images/gg-illus-1.jpg',
  ];
  for (const viewport of [
    { label: '390', width: 390, height: 844, mobile: true },
    { label: '1600', width: 1600, height: 900, mobile: false },
  ]) {
    await cdp.navigate('data:text/html,<meta charset="utf-8"><title>Graphic responsive reset</title>');
    await cdp.call('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor: 1 });
    const navigationMark = cdp.requests.length;
    await cdp.navigate(`${baseUrl}/graphicgallery.html?responsive-network=${viewport.label}-${Date.now()}`);
    await delay(300);
    if (process.env.VISUAL_ARCHIVES_NETWORK_MUTATION === 'future-graphic-responsive-request') {
      await cdp.evaluate(`(async () => { const url = new URL('images/responsive/graphic/gg-slides-16-w640.webp', location.href); url.searchParams.set('network-mutation', String(Date.now())); await fetch(url.href, { cache: 'no-store' }); })()`);
    }
    const eager = graphicRequestsSince(navigationMark).filter((url) => /\/images\/(?:responsive\/graphic\/(?:logos-2|gg-edc-1)-w\d+\.webp|(?:logos-2|gg-edc-1)\.jpg)$/.test(new URL(url).pathname));
    const graphic = graphicRequestsSince(navigationMark).filter((url) => new URL(url).pathname.includes('/images/responsive/graphic/') || /\/images\/(?:logos-2|gg-edc-1)\.jpg$/.test(new URL(url).pathname));
    if (noIntersectionObserver) {
      const fallback = await cdp.evaluate(`(() => ({
        pending: document.querySelectorAll('main img[data-deferred-src]').length,
        responsive: document.querySelectorAll('main img[data-full-src]').length,
      }))()`);
      assert(fallback.pending === 0 && fallback.responsive === 41,
        `graphicgallery.html: no-observer fallback did not synchronously hydrate all eligible media: ${JSON.stringify(fallback)}`);
    } else {
      assert(graphic.length === eager.length && eager.length === 2,
        `graphicgallery.html: fresh ${viewport.label}px navigation requested lazy or original Graphic media instead of only the two eager responsive candidates: ${JSON.stringify(graphic)}`);
    }

    for (const source of representatives) {
      const result = await cdp.evaluate(`(async () => {
        const source = ${JSON.stringify(source)};
        const image = [...document.querySelectorAll('main img[data-full-src]')].find((element) => element.dataset.fullSrc === source);
        if (!image) return null;
        image.scrollIntoView({ block: 'center' });
        try { await image.decode(); } catch {}
        await new Promise((resolve) => setTimeout(resolve, 120));
        const rect = image.getBoundingClientRect();
        return { source, currentSrc: image.currentSrc, srcset: image.getAttribute('srcset'), width: rect.width, full: image.dataset.fullSrc, thumb: image.dataset.thumbSrc, role: image.getAttribute('role'), popup: image.getAttribute('aria-haspopup'), tabindex: image.tabIndex };
      })()`);
      assert(result, `graphicgallery.html: missing responsive representative ${source}`);
      if (!result) continue;
      const candidates = result.srcset.split(',').map((entry) => entry.trim().split(/\s+/)).map(([url, descriptor]) => ({ url: new URL(url, baseUrl).href, width: Number(descriptor.replace('w', '')) }));
      const selected = candidates.find((candidate) => candidate.url === result.currentSrc);
      const maxCandidateWidth = Math.max(...candidates.map((candidate) => candidate.width));
      const requiredWidth = Math.min(Math.ceil(result.width), maxCandidateWidth);
      const approvedSource = selected && (selected.url.includes('/images/responsive/graphic/') || selected.url === new URL(source, baseUrl).href);
      assert(approvedSource && selected.width >= requiredWidth,
        `graphicgallery.html: ${viewport.label}px ${source} currentSrc is not an adequate approved candidate within source bounds: ${JSON.stringify({ result, selected, requiredWidth, maxCandidateWidth })}`);
      assert(result.full === source && result.thumb && result.thumb.includes('images/responsive/graphic/') && result.role === 'button' && result.popup === 'dialog' && result.tabindex === 0,
        `graphicgallery.html: ${source} lightbox source/thumbnail/keyboard contract drifted: ${JSON.stringify(result)}`);
      const paths = graphicRequestsSince(navigationMark).map((url) => new URL(url).pathname);
      const stem = path.basename(source, path.extname(source));
      const original = paths.some((pathname) => pathname.endsWith(`/${stem}${path.extname(source)}`));
      const derivative = paths.some((pathname) => pathname.includes(`/images/responsive/graphic/${stem}-w`));
      assert(!(original && derivative), `graphicgallery.html: ${source} loaded original and derivative simultaneously: ${JSON.stringify(paths.filter((pathname) => pathname.includes(stem)))}`);
    }
    const mendenhall = await cdp.evaluate(`(() => { const image = document.querySelector('.mendenhall-archive-trigger > img'); return image && { src: image.getAttribute('src'), srcset: image.getAttribute('srcset'), sizes: image.getAttribute('sizes'), full: image.dataset.fullSrc, thumb: image.dataset.thumbSrc }; })()`);
    assert(mendenhall && mendenhall.src === 'images/gg-illus-4.jpg' && !mendenhall.srcset && !mendenhall.sizes && !mendenhall.full && !mendenhall.thumb,
      `graphicgallery.html: Mendenhall must remain outside the responsive-image/lightbox route: ${JSON.stringify(mendenhall)}`);
  }
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
    mainImages: 42,
  },
  ui: {
    file: 'uigallery.html',
    bodyClass: 'ui-gallery-page',
    archive: 'ui-gallery',
    mainImages: 8,
    captions: 6,
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
  if (process.env.VISUAL_ARCHIVES_DISABLE_IO === '1') {
    await cdp.call('Page.addScriptToEvaluateOnNewDocument', { source: 'delete window.IntersectionObserver;' });
  }
  await cdp.call('Runtime.enable');
  await cdp.call('Network.enable');
  await cdp.call('Network.setCacheDisabled', { cacheDisabled: true });
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
          const images = [...document.querySelectorAll('main img:not(dialog img)')];
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
          const focusSurface = focusTarget?.closest('.ui-study') || document.querySelector('.archive-primary');
          const surfaceLum = luminance(getComputedStyle(focusSurface).backgroundColor);
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
            mendenhallButtons: document.querySelectorAll('[data-mendenhall-picker] button').length,
            mendenhallPoster: document.querySelectorAll('.mendenhall-archive-trigger > img').length,
            mendenhallViews: document.querySelectorAll('[data-mendenhall-view]').length,
            mendenhallFit: document.querySelector('.mendenhall-archive-trigger > img') ? getComputedStyle(document.querySelector('.mendenhall-archive-trigger > img')).objectFit : null,
            uiViews: document.querySelectorAll('[data-ui-study-view]').length,
            uiBackground: getComputedStyle(document.body).backgroundColor,
            uiMagiBackground: document.querySelector('.ui-study--magi') ? getComputedStyle(document.querySelector('.ui-study--magi')).backgroundColor : null,
            uiViewNames: [...document.querySelectorAll('[data-ui-study-view]')].map((view) => view.dataset.uiStudyView),
            uiImageSources: [...document.querySelectorAll('[data-ui-study-image]')].map((image) => image.getAttribute('src')),
            uiImageDimensions: [...document.querySelectorAll('[data-ui-study-image]')].map((image) => ({
              src: image.getAttribute('src'),
              naturalWidth: image.naturalWidth,
              naturalHeight: image.naturalHeight,
              declaredWidth: Number(image.getAttribute('width')),
              declaredHeight: Number(image.getAttribute('height')),
            })),
            uiImageLayout: [...document.querySelectorAll('[data-ui-study-image]')].map((image) => {
              const rect = image.getBoundingClientRect();
              return { width: Math.round(rect.width), height: Math.round(rect.height) };
            }),
            uiCursor: (() => {
              const dot = document.querySelector('.cursor-dot');
              const ring = document.querySelector('.cursor-ring');
              if (!dot || !ring) return null;
              const dotStyle = getComputedStyle(dot);
              const ringStyle = getComputedStyle(ring);
              return {
                dotBackground: dotStyle.backgroundColor,
                dotShadow: dotStyle.boxShadow,
                ringBorder: ringStyle.borderColor,
                ringShadow: ringStyle.boxShadow,
                ringOpacity: ringStyle.opacity,
              };
            })(),
            uiMagiEdges: [...document.querySelectorAll('.ui-study-grid--magi .ui-study-view > img')]
              .map((image) => getComputedStyle(image).boxShadow),
            uiScrollScreens: [...document.querySelectorAll('[data-ui-scroll-screen]')].map((screen) => {
              const rect = screen.getBoundingClientRect();
              return {
                role: screen.dataset.uiScrollScreen,
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                clientHeight: screen.clientHeight,
                scrollHeight: screen.scrollHeight,
                overflowY: getComputedStyle(screen).overflowY,
                tabindex: screen.tabIndex,
              };
            }),
            uiLayout: [...document.querySelectorAll('[data-ui-study-view]')].map((view) => {
              const rect = view.getBoundingClientRect();
              return { left: Math.round(rect.left), top: Math.round(rect.top), width: Math.round(rect.width) };
            }),
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
        assert(state.captions === (spec.captions ?? 0), `${spec.file}: expected ${spec.captions ?? 0} primary captions; found ${state.captions}`);
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
        } else if (name === 'graphic') {
          assert(state.graphicEdc === 4, `graphicgallery.html: expected 4 EDC tiles; found ${state.graphicEdc}`);
          assert(state.graphicSlides === 16, `graphicgallery.html: expected 16 presentation slides; found ${state.graphicSlides}`);
          const expectedGraphicColumns = viewport.mobile ? '2' : viewport.width === 768 ? '4' : '5';
          assert(state.graphicColumns === expectedGraphicColumns,
            `graphicgallery.html: expected ${expectedGraphicColumns} presentation columns; found ${state.graphicColumns}`);
          assert(state.mendenhallButtons === 0 && state.mendenhallPoster === 1 && state.mendenhallViews === 4 && state.mendenhallFit === 'contain',
            `graphicgallery.html: Mendenhall gallery/archive contract drifted: ${JSON.stringify({ buttons: state.mendenhallButtons, poster: state.mendenhallPoster, views: state.mendenhallViews, fit: state.mendenhallFit })}`);
          if (theme === 'light' && (viewport.mobile || viewport.width === 1440)) {
            const mendenhall = await cdp.evaluate(`(async () => {
              const trigger = document.querySelector('.mendenhall-archive-trigger');
              trigger.click();
              await new Promise((resolve) => setTimeout(resolve, 240));
              const dialog = document.querySelector('[data-mendenhall-dialog]');
              const buttons = [...dialog.querySelectorAll('[data-mendenhall-view]')];
              const picks = [];
              for (const button of buttons) {
                button.click();
                await new Promise((resolve) => setTimeout(resolve, 240));
                const image = dialog.querySelector('[data-mendenhall-master]:not([hidden])');
                try { await image.decode(); } catch {}
                const stage = dialog.querySelector('.mendenhall-archive-stage').getBoundingClientRect();
                const rect = image.getBoundingClientRect();
                picks.push({ src: image.getAttribute('src'), loaded: image.complete && image.naturalWidth > 0, fit: getComputedStyle(image).objectFit, contained: rect.left >= stage.left - 1 && rect.right <= stage.right + 1 && rect.top >= stage.top - 1 && rect.bottom <= stage.bottom + 1 });
              }
              const posterButton = dialog.querySelector('[data-mendenhall-view="poster"]');
              posterButton.click();
              await new Promise((resolve) => setTimeout(resolve, 180));
              const posterImage = dialog.querySelector('[data-mendenhall-master="poster"]');
              try { await posterImage.decode(); } catch {}
              return { open: dialog.open, title: dialog.querySelector('h2').textContent, focus: document.activeElement?.className || '', bodyLocked: document.body.classList.contains('mendenhall-archive-open'), views: buttons.length, selected: posterButton.getAttribute('aria-pressed'), posterVisible: !posterImage.hidden, picks };
            })()`);
            assert(mendenhall.open && mendenhall.title === 'Mendenhall' && mendenhall.bodyLocked && mendenhall.views === 4 && mendenhall.selected === 'true' && mendenhall.posterVisible && mendenhall.picks.every((pick) => pick.loaded && pick.fit === 'contain' && pick.contained),
              `graphicgallery.html: expanded Mendenhall archive failed: ${JSON.stringify(mendenhall)}`);
            await cdp.screenshot(`graphic-mendenhall-archive-${viewport.label}-${theme}.png`);
            await cdp.key('Escape', 'Escape', 27);
            const restored = await cdp.evaluate(`({ open: document.querySelector('[data-mendenhall-dialog]').open, locked: document.body.classList.contains('mendenhall-archive-open'), focus: document.activeElement?.className || '' })`);
            assert(!restored.open && !restored.locked && restored.focus.includes('mendenhall-archive-trigger'), `graphicgallery.html: archive close/focus restoration failed: ${JSON.stringify(restored)}`);
          }
        } else if (name === 'ui') {
          const expectedUiBackground = theme === 'dark' ? 'rgb(12, 17, 22)' : 'rgb(238, 241, 239)';
          assert(state.uiBackground === expectedUiBackground,
            `uigallery.html: ${theme} palette did not apply; expected ${expectedUiBackground}, found ${state.uiBackground}`);
          assert(state.uiViews === 8 && state.uiLayout.length === 8,
            `uigallery.html: expected two complete Ekos frames and six curated Magi study views; found ${state.uiViews}`);
          assert(JSON.stringify(state.uiViewNames) === JSON.stringify([
            'ekos-desktop', 'ekos-mobile', 'magi-overview', 'magi-architecture',
            'magi-overlays', 'magi-color-type', 'magi-components', 'magi-node-states',
          ]), `uigallery.html: gallery study roles drifted: ${JSON.stringify(state.uiViewNames)}`);
          assert(JSON.stringify(state.uiImageSources) === JSON.stringify([
            'images/ui-gallery/ekos-desktop.webp',
            'images/ui-gallery/ekos-mobile.webp',
            'images/ui-gallery/magi-overview.webp',
            'images/ui-gallery/magi-architecture.webp',
            'images/ui-gallery/magi-overlays.webp',
            'images/ui-gallery/magi-color-type.webp',
            'images/ui-gallery/magi-components.webp',
            'images/ui-gallery/magi-node-states.webp',
          ]), `uigallery.html: gallery sequence drifted: ${JSON.stringify(state.uiImageSources)}`);
          assert(state.uiImageDimensions.every((image) => image.naturalWidth === image.declaredWidth && image.naturalHeight === image.declaredHeight),
            `uigallery.html: declared dimensions do not match decoded media: ${JSON.stringify(state.uiImageDimensions)}`);
          assert(state.uiImageLayout.slice(2).every((image, index) => {
            const declared = state.uiImageDimensions[index + 2];
            const expectedHeight = Math.round(image.width * declared.declaredHeight / declared.declaredWidth);
            return Math.abs(image.height - expectedHeight) <= 1;
          }), `uigallery.html: a Magi frame is cropped or distorted: ${JSON.stringify(state.uiImageLayout)}`);
          assert(state.uiMagiBackground === 'rgb(7, 16, 15)',
            `uigallery.html: Magi dark-canvas presentation drifted: ${state.uiMagiBackground}`);
          assert(state.uiCursor && state.uiCursor.dotBackground === 'rgb(186, 255, 80)' &&
            state.uiCursor.dotShadow !== 'none' && state.uiCursor.ringBorder === 'rgb(186, 255, 80)' &&
            state.uiCursor.ringShadow !== 'none' && Number(state.uiCursor.ringOpacity) >= 0.8,
            `uigallery.html: custom cursor can lose contrast over mixed artwork: ${JSON.stringify(state.uiCursor)}`);
          assert(state.uiMagiEdges.length === 6 && state.uiMagiEdges.every((shadow) => shadow === 'none'),
            `uigallery.html: Magi frames must remain borderless on the dark canvas: ${JSON.stringify(state.uiMagiEdges)}`);
          const expectedScrollRatios = viewport.mobile ? { desktop: 4 / 5, mobile: 9 / 16 } : { desktop: 1.6, mobile: 9 / 16 };
          assert(state.uiScrollScreens.length === 2 && state.uiScrollScreens.every((screen) =>
            Math.abs((screen.width / screen.height) - expectedScrollRatios[screen.role]) <= 0.03 &&
            screen.scrollHeight > screen.clientHeight && screen.overflowY === 'auto' && screen.tabindex === 0),
            `uigallery.html: Ekos frames are not keyboard-focusable, scrollable responsive viewports: ${JSON.stringify(state.uiScrollScreens)}`);
          const scrolledEkos = await cdp.evaluate(`(() => {
            return [...document.querySelectorAll('[data-ui-scroll-screen]')].map((screen) => {
              screen.scrollTop = screen.scrollHeight;
              const moved = screen.scrollTop;
              screen.scrollTop = 0;
              return moved;
            });
          })()`);
          assert(scrolledEkos.length === 2 && scrolledEkos.every((distance) => distance > 0), `uigallery.html: both Ekos frames must scroll through their complete pages.`);
          const [ekosDesktop, ekosMobile, magiOverview, magiArchitecture, magiOverlays, magiColorType, magiComponents, magiNodeStates] = state.uiLayout;
          if (viewport.mobile) {
            assert(state.uiLayout.every((view) => Math.abs(ekosDesktop.left - view.left) <= 1) &&
              state.uiLayout.every((view, index, views) => index === 0 || views[index - 1].top < view.top),
              `uigallery.html: mobile studies do not stack in authored order: ${JSON.stringify(state.uiLayout)}`);
          } else {
            assert(ekosDesktop.top < ekosMobile.top && ekosDesktop.width > ekosMobile.width && ekosMobile.left > ekosDesktop.left,
              `uigallery.html: Ekos desktop/mobile hierarchy drifted: ${JSON.stringify(state.uiLayout)}`);
            assert(magiOverview.top < magiArchitecture.top && magiOverview.width > magiArchitecture.width &&
              magiArchitecture.top === magiOverlays.top && magiArchitecture.width > magiOverlays.width,
              `uigallery.html: Magi lead and structural pair hierarchy drifted: ${JSON.stringify(state.uiLayout)}`);
            assert(magiColorType.top === magiComponents.top && magiColorType.width < magiComponents.width &&
              magiNodeStates.top > magiComponents.top && magiNodeStates.width === magiOverview.width,
              `uigallery.html: Magi system pair and closing state strip drifted: ${JSON.stringify(state.uiLayout)}`);
            assert(ekosDesktop.width >= magiOverview.width,
              `uigallery.html: Ekos must remain at least as wide as the Magi dashboard lead: ${JSON.stringify(state.uiLayout)}`);
          }
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
    await checkArtResponsiveMedia();
    await checkHornedWomanCadenceAndPause();
    await checkLiveSlideshowFocusRestoration();
  }
  if (scope === 'all' || scope === 'graphic') {
    await checkGraphicResponsiveMedia();
  }
  if (scope === 'all' || scope === 'ui') {
    await checkHomepageGalleryChapter();
  }

  assert(cdp.exceptions.length === 0, `uncaught browser exceptions: ${cdp.exceptions.map((entry) => entry.text).join('; ')}`);
  const actionableNetworkErrors = cdp.networkErrors.filter((error) => !/vercel.*analytics|_vercel\/(?:speed-)?insights|^net::ERR_ABORTED$/i.test(error));
  assert(actionableNetworkErrors.length === 0, `browser network errors: ${actionableNetworkErrors.join(' | ')}`);
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
