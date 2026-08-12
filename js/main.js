/* ================================================
   Victor Tran Design — Interactions
   ================================================ */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Custom Cursor ──────────────────────────────────
const dot  = document.querySelector('.cursor-dot');
const ring = document.querySelector('.cursor-ring');
const canUseCustomCursor = dot && ring && !prefersReducedMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

if (canUseCustomCursor) {
  let mouseX = 0, mouseY = 0;
  let ringX  = 0, ringY  = 0;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    // dot updates inside the same rAF as the ring for batched layout writes
  }, { passive: true });

  // Single rAF loop drives both dot (1:1) and ring (lagged)
  if (!prefersReducedMotion) {
    (function animateCursor() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      dot.style.transform  = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      requestAnimationFrame(animateCursor);
    })();
  }

  // Expand ring on interactive elements
  const interactiveEls = 'a, button, .featured-item';
  document.querySelectorAll(interactiveEls).forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('cursor-ring--hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('cursor-ring--hover'));
  });

  // Hide cursor when leaving window
  document.addEventListener('mouseleave', () => {
    dot.style.opacity  = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    dot.style.opacity  = '1';
    ring.style.opacity = '1';
  });
}


// ── Scroll Reveal ──────────────────────────────────
const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.05, rootMargin: '0px 0px -10% 0px' });

revealEls.forEach(el => revealObserver.observe(el));


// ── Nav: compact on scroll (rAF-throttled) ─────────
const nav = document.querySelector('.nav');
let navTickPending = false;
window.addEventListener('scroll', () => {
  if (navTickPending) return;
  navTickPending = true;
  requestAnimationFrame(() => {
    nav.classList.toggle('nav--scrolled', window.scrollY > 60);
    navTickPending = false;
  });
}, { passive: true });


// ── Nav dropdowns (Work, Galleries) ───────────────
const navDropdowns = [...document.querySelectorAll('.nav-dropdown')].map(group => {
  const toggle = group.querySelector('.nav-dropdown-toggle');
  const links = [...group.querySelectorAll('.nav-dropdown-menu a[href]')];
  return { group, toggle, links };
}).filter(d => d.toggle);

const setDropdownOpen = (toggle, open) => {
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
};

const closeOtherDropdowns = (except) => {
  navDropdowns.forEach(({ toggle }) => {
    if (toggle !== except) setDropdownOpen(toggle, false);
  });
};

navDropdowns.forEach(({ group, toggle, links }) => {
  toggle.addEventListener('click', () => {
    const willOpen = toggle.getAttribute('aria-expanded') !== 'true';
    closeOtherDropdowns(toggle);
    setDropdownOpen(toggle, willOpen);
  });

  toggle.addEventListener('keydown', (e) => {
    if (!links.length || !['ArrowDown', 'ArrowUp'].includes(e.key)) return;
    e.preventDefault();
    closeOtherDropdowns(toggle);
    setDropdownOpen(toggle, true);
    links[e.key === 'ArrowDown' ? 0 : links.length - 1].focus();
  });

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let hoverTimer;
    group.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimer);
      closeOtherDropdowns(toggle);
      setDropdownOpen(toggle, true);
    });
    group.addEventListener('mouseleave', () => {
      hoverTimer = setTimeout(() => setDropdownOpen(toggle, false), 120);
    });
  }

  group.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setDropdownOpen(toggle, false);
      toggle.focus();
      return;
    }
    if (e.target === toggle) return;
    const currentIndex = links.indexOf(document.activeElement);
    if (currentIndex === -1) return;
    let nextIndex;
    switch (e.key) {
      case 'ArrowDown': nextIndex = (currentIndex + 1) % links.length; break;
      case 'ArrowUp': nextIndex = (currentIndex - 1 + links.length) % links.length; break;
      case 'Home': nextIndex = 0; break;
      case 'End': nextIndex = links.length - 1; break;
      default: return;
    }
    e.preventDefault();
    links[nextIndex].focus();
  });
});

document.addEventListener('click', (e) => {
  navDropdowns.forEach(({ group, toggle }) => {
    if (!group.contains(e.target)) setDropdownOpen(toggle, false);
  });
});


// ── Magnetic Cards (rAF-batched) ───────────────────
if (!prefersReducedMotion) {
  document.querySelectorAll('.featured-item').forEach(card => {
    let pendingX = 0, pendingY = 0;
    let frame = 0;

    const apply = () => {
      frame = 0;
      card.style.transform = `perspective(800px) rotateY(${pendingX * 6}deg) rotateX(${-pendingY * 4}deg) scale(1.01)`;
    };

    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      pendingX = (e.clientX - rect.left - rect.width  / 2) / rect.width;
      pendingY = (e.clientY - rect.top  - rect.height / 2) / rect.height;
      if (!frame) frame = requestAnimationFrame(apply);
    });

    card.addEventListener('mouseleave', () => {
      if (frame) { cancelAnimationFrame(frame); frame = 0; }
      card.style.transform = '';
    });
  });
}


// ── Lens Switcher (Light / Dark / DNA) ────────────
(function () {
  const lensBtns = document.querySelectorAll('.lens-switcher-btn');
  if (!lensBtns.length) return;

  const saved = localStorage.getItem('lens') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  function applyLens(lens) {
    if (lens === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    lensBtns.forEach(btn => {
      const active = btn.dataset.lens === lens && lens !== 'dna';
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    if (lens !== 'dna') localStorage.setItem('lens', lens);
  }

  applyLens(saved);

  lensBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.lens !== 'dna') applyLens(btn.dataset.lens);
    });
  });
})();


// ── Marquee clone for seamless loop ───────────────
document.querySelectorAll('.marquee-track').forEach(track => {
  const originalItems = Array.from(track.children);
  if (!originalItems.length) return;

  const fillTrack = () => {
    const originalMarkup = originalItems.map(item => item.outerHTML).join('');
    track.innerHTML = originalMarkup;

    while (track.scrollWidth < window.innerWidth * 1.5) {
      track.insertAdjacentHTML('beforeend', originalMarkup);
    }

    track.innerHTML += track.innerHTML;
  };

  fillTrack();
  window.addEventListener('resize', fillTrack);
});


// ── Homepage chapter progress ─────────────────────
(function () {
  const featured = document.querySelector('.featured');
  if (!featured) return;

  const cards = Array.from(featured.querySelectorAll('.featured-item[data-chapter]'));
  const titleNode = featured.querySelector('[data-now-playing-title]');
  const countNode = featured.querySelector('[data-now-playing-count]');
  const trackRows = Array.from(featured.querySelectorAll('.featured-tracklist [data-chapter]'));
  if (!cards.length || !titleNode || !countNode || !trackRows.length) return;

  function setActiveChapter(chapter, title) {
    if (!chapter || !title) return;

    titleNode.textContent = title;
    countNode.textContent = `${chapter}/03`;

    trackRows.forEach(row => {
      const active = row.dataset.chapter === chapter;
      row.classList.toggle('is-active', active);
      if (active) {
        row.setAttribute('aria-current', 'true');
      } else {
        row.removeAttribute('aria-current');
      }
    });
  }

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    const card = visible.target;
    setActiveChapter(card.dataset.chapter, card.dataset.chapterTitle);
  }, {
    threshold: [0.35, 0.55],
    rootMargin: '-20% 0px -35% 0px'
  });

  cards.forEach(card => observer.observe(card));
})();


// ── Hero: fixed portrait + ambient color switcher ─────
(function () {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const dots = Array.from(hero.querySelectorAll('.hero-cycle-dot'));
  const cycleBtn = hero.querySelector('.hero-cycle');
  const heroStatus = hero.querySelector('[data-hero-status]');
  const pointerWash = hero.querySelector('.hero-pointer-wash');
  const heroReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const palette = [
    { session: '--pink', accent: '--blue' },
    { session: '--blue', accent: '--pink' },
    { session: '--orange', accent: '--blue' },
    { session: '--purple', accent: '--pink' },
  ];

  let i = 0;
  let heroTimer = null;
  let manualPause = false;

  if (pointerWash && !heroReducedMotion.matches) {
    let pointerFrame = 0;
    let pointerX = 0;
    let pointerY = 0;

    function updatePointerWash() {
      pointerFrame = 0;
      const rect = hero.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((pointerX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((pointerY - rect.top) / rect.height) * 100));
      pointerWash.style.setProperty('--wash-x', `${x.toFixed(2)}%`);
      pointerWash.style.setProperty('--wash-y', `${y.toFixed(2)}%`);
    }

    hero.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse') return;
      hero.dataset.pointerWash = 'active';
    });
    hero.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse') return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!pointerFrame) pointerFrame = requestAnimationFrame(updatePointerWash);
    }, { passive: true });
    hero.addEventListener('pointerleave', () => {
      delete hero.dataset.pointerWash;
    });
  }

  function setHeroColor(next, announce = false) {
    i = (next + palette.length) % palette.length;
    const state = palette[i];

    hero.style.setProperty('--bg-tint', `var(${state.session})`);
    hero.style.setProperty('--lens-color', `var(${state.session})`);
    hero.style.setProperty('--accent-2', `var(${state.accent})`);
    hero.dataset.color = String(i);

    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle('is-active', dotIndex === i);
    });
    if (announce && heroStatus) {
      heroStatus.textContent = 'Hero color changed. Ambient cycling paused for this visit.';
    }
  }

  function stopHeroCycle() {
    if (!heroTimer) return;
    window.clearInterval(heroTimer);
    heroTimer = null;
  }

  function startHeroCycle() {
    if (manualPause || heroReducedMotion.matches || document.hidden || heroTimer) return;
    heroTimer = window.setInterval(() => setHeroColor(i + 1), 12000);
  }

  function chooseNextColor() {
    manualPause = true;
    stopHeroCycle();
    setHeroColor(i + 1, true);
  }

  setHeroColor(0);
  startHeroCycle();

  hero.addEventListener('click', event => {
    if (event.target.closest('a, button, .hero-meta')) return;
    chooseNextColor();
  });

  cycleBtn?.addEventListener('click', event => {
    event.stopPropagation();
    chooseNextColor();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopHeroCycle();
    else startHeroCycle();
  });

  heroReducedMotion.addEventListener?.('change', () => {
    if (heroReducedMotion.matches) stopHeroCycle();
    else startHeroCycle();
  });
})();

// ── Gallery Lightbox ──────────────────────────────
(function () {
  const pageImgs = Array.from(document.querySelectorAll(
    '.gallery-spotlight img, .gallery-grid img, .gallery-section img, .series-slideshow img, .gallery-feature img, .art-archive-v2 .archive-frame > img, .graphic-archive-v2 .archive-frame > img'
  )).filter((img) => !img.closest('[aria-controls="mendenhall-archive-dialog"]'));
  if (!pageImgs.length) return;

  let current = 0;
  const pageTitle = (document.querySelector('.page-header-title')?.textContent || 'Gallery').trim();
  const defaultItems = pageImgs.map((img) => ({ src: img.src, alt: img.alt }));
  let activeItems = defaultItems;

  // Build DOM
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Image viewer');
  lb.innerHTML = `
    <header class="lb-header">
      <div>
        <p class="lb-title"></p>
        <p class="lb-count"></p>
      </div>
      <div class="lb-header-actions">
        <button class="lb-btn lb-close" aria-label="Close lightbox">✕</button>
      </div>
    </header>
    <div class="lb-stage">
      <button class="lb-arrow lb-arrow--prev" aria-label="Previous image">&#8249;</button>
      <div class="lb-img-wrap">
        <img class="lb-img" src="" alt="">
      </div>
      <button class="lb-arrow lb-arrow--next" aria-label="Next image">&#8250;</button>
    </div>
    <div class="lb-strip"></div>
  `;
  document.body.appendChild(lb);

  lb.querySelector('.lb-title').textContent = pageTitle;

  const lbImg   = lb.querySelector('.lb-img');
  const lbCount = lb.querySelector('.lb-count');
  const lbStrip = lb.querySelector('.lb-strip');
  const lbClose = lb.querySelector('.lb-close');
  const lbPrev  = lb.querySelector('.lb-arrow--prev');
  const lbNext  = lb.querySelector('.lb-arrow--next');

  let thumbEls = [];
  let lastTrigger = null;
  let previousBodyOverflow = '';
  const backgroundStates = new Map();

  function setBackgroundInert(inert) {
    const background = Array.from(document.body.children).filter((element) => element !== lb && element.tagName !== 'SCRIPT');
    if (inert) {
      background.forEach((element) => {
        backgroundStates.set(element, { inert: element.inert, ariaHidden: element.getAttribute('aria-hidden') });
        element.inert = true;
        element.setAttribute('aria-hidden', 'true');
      });
      return;
    }
    backgroundStates.forEach((state, element) => {
      element.inert = state.inert;
      if (state.ariaHidden === null) element.removeAttribute('aria-hidden');
      else element.setAttribute('aria-hidden', state.ariaHidden);
    });
    backgroundStates.clear();
  }

  function lightboxControls() {
    return Array.from(lb.querySelectorAll('button:not([disabled])')).filter((element) => {
      const style = getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  }

  function buildThumbnails() {
    lbStrip.replaceChildren();
    activeItems.forEach((item, i) => {
      const btn = document.createElement('button');
      btn.className = 'lb-thumb';
      btn.setAttribute('aria-label', `Go to image ${i + 1}`);
      const ti = document.createElement('img');
      ti.src = item.src;
      ti.alt = item.alt;
      ti.loading = 'lazy';
      btn.appendChild(ti);
      btn.addEventListener('click', () => goTo(i));
      if (canUseCustomCursor) {
        btn.addEventListener('mouseenter', () => ring.classList.add('cursor-ring--hover'));
        btn.addEventListener('mouseleave', () => ring.classList.remove('cursor-ring--hover'));
      }
      lbStrip.appendChild(btn);
    });

    thumbEls = Array.from(lbStrip.querySelectorAll('.lb-thumb'));
  }

  function goTo(idx) {
    current = (idx + activeItems.length) % activeItems.length;
    const src = activeItems[current].src;
    const alt = activeItems[current].alt;

    lbImg.classList.add('is-fading');
    setTimeout(() => {
      lbImg.src = src;
      lbImg.alt = alt;
      lbImg.classList.remove('is-fading');
    }, 180);

    lbCount.textContent = `${current + 1} / ${activeItems.length}`;
    thumbEls.forEach((t, i) => t.classList.toggle('is-active', i === current));
    thumbEls[current].scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'center'
    });
  }

  function open(idx, trigger) {
    const viewer = trigger?.closest('[data-viewer-title]');
    const supplemental = viewer?.querySelector('template[data-viewer-picks]');
    if (supplemental) {
      const picks = Array.from(supplemental.content.querySelectorAll('[data-viewer-pick]'));
      activeItems = [{ src: trigger.src, alt: trigger.alt }, ...picks.map((pick) => ({ src: pick.src, alt: pick.alt }))];
      idx = 0;
      lb.querySelector('.lb-title').textContent = viewer.dataset.viewerTitle || pageTitle;
    } else {
      activeItems = defaultItems;
      lb.querySelector('.lb-title').textContent = pageTitle;
    }
    buildThumbnails();
    goTo(idx);
    lastTrigger = trigger || document.activeElement;
    lastTrigger?.dispatchEvent(new Event('gallery-lightbox-open', { bubbles: true }));
    previousBodyOverflow = document.body.style.overflow;
    lb.classList.add('is-open');
    setBackgroundInert(true);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => lbClose.focus());
  }

  function close() {
    if (!lb.classList.contains('is-open')) return;
    lb.classList.remove('is-open');
    document.body.style.overflow = previousBodyOverflow;
    setBackgroundInert(false);
    if (lastTrigger instanceof HTMLElement && document.contains(lastTrigger)) {
      lastTrigger.dispatchEvent(new Event('gallery-lightbox-close', { bubbles: true }));
      lastTrigger.focus();
    }
  }

  // Wire gallery images
  pageImgs.forEach((img, i) => {
    const isInactiveSlideshowImage = img.classList.contains('series-slideshow-img') && !img.classList.contains('is-active');
    if (!isInactiveSlideshowImage) {
      img.setAttribute('role', 'button');
      img.setAttribute('aria-haspopup', 'dialog');
      img.tabIndex = 0;
    } else {
      img.tabIndex = -1;
      img.setAttribute('aria-hidden', 'true');
    }
    img.addEventListener('click', () => open(i, img));
    img.addEventListener('keydown', (event) => {
      if (img.tabIndex < 0) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      open(i, img);
    });
  });

  lbClose.addEventListener('click', close);
  lbPrev.addEventListener('click', () => goTo(current - 1));
  lbNext.addEventListener('click', () => goTo(current + 1));

  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goTo(current - 1);
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      goTo(current + 1);
    }
    if (e.key === 'Tab') {
      const controls = lightboxControls();
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // Expand cursor ring on lightbox buttons
  if (canUseCustomCursor) {
    lb.querySelectorAll('.lb-btn, .lb-arrow').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('cursor-ring--hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('cursor-ring--hover'));
    });
  }
})();


// ── Series Slideshow (auto-crossfade) ────────────
(function () {
  const stages = Array.from(document.querySelectorAll('.series-slideshow-stage'));
  if (!stages.length) return;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const slideshows = stages.map(stage => {
    const slides = Array.from(stage.querySelectorAll('.series-slideshow-img'));
    if (slides.length < 2) return null;
    const configuredInterval = Number.parseInt(stage.dataset.slideshowInterval ?? '', 10);
    const intervalMs = Number.isFinite(configuredInterval) && configuredInterval >= 1000 ? configuredInterval : 3000;

    let i = slides.findIndex(slide => slide.classList.contains('is-active'));
    if (i < 0) i = 0;
    function syncSlideTriggers() {
      slides.forEach((slide, idx) => {
        const isActive = idx === i;
        slide.classList.toggle('is-active', isActive);
        slide.tabIndex = isActive ? 0 : -1;
        if (isActive) {
          slide.setAttribute('role', 'button');
          slide.setAttribute('aria-haspopup', 'dialog');
          slide.removeAttribute('aria-hidden');
        } else {
          slide.removeAttribute('role');
          slide.removeAttribute('aria-haspopup');
          slide.setAttribute('aria-hidden', 'true');
        }
      });
    }
    syncSlideTriggers();

    let timer = null;
    let userPaused = reduceMotion;
    let lightboxOpen = false;
    let wasRunningBeforeLightbox = false;

    function advance() {
      i = (i + 1) % slides.length;
      syncSlideTriggers();
    }
    function start() {
      if (userPaused || lightboxOpen || timer) return;
      timer = setInterval(advance, intervalMs);
    }
    function stop() {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    }
    function setUserPaused(paused) {
      userPaused = paused;
      if (paused) stop();
      else start();
    }

    stage.addEventListener('mouseenter', stop);
    stage.addEventListener('mouseleave', start);
    stage.addEventListener('gallery-lightbox-open', () => {
      wasRunningBeforeLightbox = Boolean(timer);
      lightboxOpen = true;
      stop();
    });
    stage.addEventListener('gallery-lightbox-close', () => {
      lightboxOpen = false;
      if (wasRunningBeforeLightbox) start();
      wasRunningBeforeLightbox = false;
    });

    return { stage, start, stop, setUserPaused, get userPaused() { return userPaused; } };
  }).filter(Boolean);

  // Wire pause/play button per slideshow
  slideshows.forEach(slideshow => {
    const btn = slideshow.stage.querySelector('.slideshow-pause-btn');
    if (!btn) return;
    function syncBtn() {
      const paused = slideshow.userPaused;
      btn.setAttribute('aria-pressed', String(paused));
      btn.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
      btn.textContent = paused ? 'Play' : 'Pause';
    }
    syncBtn();
    btn.addEventListener('click', () => {
      slideshow.setUserPaused(!slideshow.userPaused);
      syncBtn();
    });
  });

  slideshows.forEach(slideshow => slideshow.start());

  // Pause when tab is hidden so it doesn't drift while away
  document.addEventListener('visibilitychange', () => {
    slideshows.forEach(slideshow => {
      if (document.hidden) slideshow.stop();
      else slideshow.start();
    });
  });
})();




// ── Design DNA overlay ─────────────────────────────
(function initDesignDNA() {
  const overlay  = document.getElementById('dnaOverlay');
  const triggers = document.querySelectorAll('.dna-trigger');
  if (!overlay || !triggers.length) return;

  // Read live values from CSS custom properties so this stays truthful as tokens evolve
  const rootStyles = getComputedStyle(document.documentElement);
  const readVar = (name) => rootStyles.getPropertyValue(name).trim();

  // Light-or-dark decision for overlay text on swatches
  const isLightHex = (hex) => {
    const m = hex.replace('#', '');
    if (m.length !== 6) return false;
    const r = parseInt(m.slice(0, 2), 16);
    const g = parseInt(m.slice(2, 4), 16);
    const b = parseInt(m.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 170;
  };

  // Build swatches from active computed theme values
  const swatchKeys = [
    '--blue',
    '--pink',
    '--purple',
    '--orange',
    '--bg',
    '--bg-2',
    '--text',
    '--text-2',
    '--border',
  ];

  const swatchRoot = document.getElementById('dnaSwatches');
  const preview    = document.getElementById('dnaColorPreview');
  const previewLbl = preview.querySelector('.dna-color-preview-label');

  const renderSwatches = () => {
    swatchRoot.innerHTML = '';
    swatchKeys.forEach((key) => {
      const value = readVar(key);
      if (!value) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dna-swatch';
      btn.style.setProperty('--swatch', value);
      btn.setAttribute('data-light', isLightHex(value));
      btn.setAttribute('aria-label', `${key} ${value}`);
      const name = document.createElement('span');
      name.className = 'dna-swatch-name';
      name.textContent = key;
      const hex = document.createElement('span');
      hex.className = 'dna-swatch-hex';
      hex.textContent = value;
      const meta = document.createElement('span');
      meta.className = 'dna-swatch-meta';
      meta.append(name, hex);
      btn.append(meta);
      const showTint = () => {
        preview.style.setProperty('--tint', value);
        preview.classList.add('is-tinted');
        previewLbl.textContent = `${key} · ${value}`;
      };
      const clearTint = () => {
        preview.classList.remove('is-tinted');
        previewLbl.textContent = 'Focus or hover a swatch';
      };
      btn.addEventListener('mouseenter', showTint);
      btn.addEventListener('focus', showTint);
      btn.addEventListener('mouseleave', clearTint);
      btn.addEventListener('blur', clearTint);
      swatchRoot.appendChild(btn);
    });
  };
  renderSwatches();

  // Build spacing scale and semantic aliases from live values
  const scaleKeys = [1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 20];
  const scaleRoot = document.getElementById('dnaScale');
  const scaleValues = scaleKeys.map((n) => parseInt(readVar(`--space-${n}`), 10) || 0);
  const scaleMax = Math.max(...scaleValues) || 1;
  scaleRoot.innerHTML = scaleKeys.map((n, i) => {
    const px = scaleValues[i];
    const widthPct = Math.max(4, (px / scaleMax) * 100);
    return `
      <li class="dna-scale-row">
        <span>--space-${n}</span>
        <span class="dna-scale-bar" style="width:${widthPct}%"></span>
        <span class="dna-scale-px">${px}px</span>
      </li>
    `;
  }).join('');

  const semanticKeys = ['--page-x', '--section-y', '--gallery-x'];
  const semanticRoot = document.getElementById('dnaSemanticSpacing');
  semanticRoot.innerHTML = semanticKeys.map((key) => `
    <div><dt>${key}</dt><dd>${readVar(key)}</dd></div>
  `).join('');

  const radiusKeys = ['0', 'sm', 'md', 'lg', 'xl', 'pill'];
  const radiiRoot = document.getElementById('dnaRadii');
  radiiRoot.innerHTML = radiusKeys.map((key) => {
    const token = `--radius-${key}`;
    const value = readVar(token);
    return `<div class="dna-radius" style="--r:${value}"><span>${token}<br>${value}</span></div>`;
  }).join('');

  // Type playground
  const playText = document.getElementById('dnaPlayText');
  const chips    = document.querySelectorAll('.dna-chip');
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      if (chip.hasAttribute('data-italic')) {
        playText.classList.toggle('is-italic');
        chip.classList.toggle('is-active');
        return;
      }
      chips.forEach((c) => { if (!c.hasAttribute('data-italic')) c.classList.remove('is-active'); });
      chip.classList.add('is-active');
      playText.style.fontFamily = chip.getAttribute('data-font');
    });
  });

  // Open / close overlay
  let lastFocus = null;
  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[contenteditable="true"]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');
  const getFocusable = () => [...overlay.querySelectorAll(focusableSelector)]
    .filter((element) => !element.hidden && element.getClientRects().length > 0);
  const backgroundRegions = [...document.querySelectorAll('body > .skip-link, body > .nav, body > main, body > footer')];
  const isolateBackground = (isolated) => {
    backgroundRegions.forEach((element) => {
      element.inert = isolated;
      if (isolated) element.setAttribute('aria-hidden', 'true');
      else element.removeAttribute('aria-hidden');
    });
  };

  const open = (event) => {
    lastFocus = event?.currentTarget || document.activeElement;
    isolateBackground(true);
    overlay.inert = false;
    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    // Re-read tokens in case theme toggled while overlay was closed
    renderSwatches();
    setTimeout(() => {
      const firstClose = overlay.querySelector('.dna-close');
      if (firstClose) firstClose.focus();
    }, 50);
  };
  const close = () => {
    overlay.inert = true;
    overlay.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('is-open');
    isolateBackground(false);
    document.body.style.overflow = '';
    preview.classList.remove('is-tinted');
    previewLbl.textContent = 'Focus or hover a swatch';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };

  triggers.forEach((trigger) => trigger.addEventListener('click', open));
  overlay.querySelectorAll('[data-dna-close]').forEach((el) => el.addEventListener('click', close));
  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      close();
      return;
    }
    if (e.key === 'Tab') {
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!overlay.contains(document.activeElement)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
        return;
      }
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // Re-render swatches when lens mode changes so colors reflect the active theme
  document.querySelectorAll('.lens-switcher-btn:not([data-lens="dna"])').forEach(btn => {
    btn.addEventListener('click', () => setTimeout(renderSwatches, 50));
  });
})();
