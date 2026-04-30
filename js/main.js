/* ================================================
   Victor Tran Design — Interactions
   ================================================ */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Custom Cursor ──────────────────────────────────
const dot  = document.querySelector('.cursor-dot');
const ring = document.querySelector('.cursor-ring');

let mouseX = 0, mouseY = 0;
let ringX  = 0, ringY  = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  // dot updates inside the same rAF as the ring for batched layout writes
});

// Single rAF loop drives both dot (1:1) and ring (lagged)
(function animateCursor() {
  ringX += (mouseX - ringX) * 0.18;
  ringY += (mouseY - ringY) * 0.18;
  dot.style.transform  = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
  ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
  requestAnimationFrame(animateCursor);
})();

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
  return { group, toggle };
}).filter(d => d.toggle);

const setDropdownOpen = (toggle, open) => {
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
};

const closeOtherDropdowns = (except) => {
  navDropdowns.forEach(({ toggle }) => {
    if (toggle !== except) setDropdownOpen(toggle, false);
  });
};

navDropdowns.forEach(({ group, toggle }) => {
  toggle.addEventListener('click', () => {
    const willOpen = toggle.getAttribute('aria-expanded') !== 'true';
    closeOtherDropdowns(toggle);
    setDropdownOpen(toggle, willOpen);
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
      setDropdownOpen(toggle, false);
      toggle.focus();
    }
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


// ── Dark Mode Toggle ───────────────────────────────
const themeToggle = document.querySelector('.theme-toggle:not(.dna-trigger)');
const saved = localStorage.getItem('theme') || 'light';
if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');

themeToggle?.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const next = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});


// ── Marquee clone for seamless loop ───────────────
document.querySelectorAll('.marquee-track').forEach(track => {
  track.innerHTML += track.innerHTML; // double the content for seamless loop
});


// ── Hero: cursor-reactive color wash ──────────────
const hero = document.querySelector('.hero');
if (hero && !prefersReducedMotion) {
  const heroWash = hero.querySelector('.hero-wash');
  if (heroWash) {
    // Throttle wash updates to ~30fps. A radial-gradient repaint across the
    // hero is the expensive bit; the human eye can't tell the glow is updating
    // every other frame, and this keeps the main thread free for scrolling.
    const UPDATE_MS = 33;
    let lastUpdate = 0;
    let scheduled = false;
    let lastX = 0, lastY = 0;

    const updateHero = () => {
      scheduled = false;
      lastUpdate = performance.now();
      const rect = hero.getBoundingClientRect();
      const px = ((lastX - rect.left) / rect.width)  * 100;
      const py = ((lastY - rect.top)  / rect.height) * 100;
      // Cursor X drives a 0→1 progress that sweeps the wash through the
      // design-system palette (purple → pink → blue) via color-mix in CSS.
      const p = Math.max(0, Math.min(1, px / 100));
      heroWash.style.setProperty('--mx', `${px}%`);
      heroWash.style.setProperty('--my', `${py}%`);
      heroWash.style.setProperty('--p',  p.toFixed(3));
    };

    document.addEventListener('mousemove', e => {
      lastX = e.clientX;
      lastY = e.clientY;
      if (scheduled) return;
      const wait = Math.max(0, UPDATE_MS - (performance.now() - lastUpdate));
      scheduled = true;
      if (wait === 0) requestAnimationFrame(updateHero);
      else setTimeout(() => requestAnimationFrame(updateHero), wait);
    });

    if ('ontouchstart' in window) {
      window.addEventListener('scroll', () => {
        const p = (window.scrollY % 400) / 400;
        heroWash.style.setProperty('--p', p.toFixed(3));
      }, { passive: true });
    }
  }
}


// ── Gallery Lightbox ──────────────────────────────
(function () {
  const pageImgs = Array.from(document.querySelectorAll(
    '.gallery-spotlight img, .gallery-grid img, .gallery-section img, .series-slideshow img, .gallery-feature img'
  ));
  if (!pageImgs.length) return;

  let current = 0;
  const pageTitle = (document.querySelector('.page-header-title')?.textContent || 'Gallery').trim();

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

  // Build thumbnails
  pageImgs.forEach((img, i) => {
    const btn = document.createElement('button');
    btn.className = 'lb-thumb';
    btn.setAttribute('aria-label', `Go to image ${i + 1}`);
    const ti = document.createElement('img');
    ti.src = img.src;
    ti.alt = img.alt;
    ti.loading = 'lazy';
    btn.appendChild(ti);
    btn.addEventListener('click', () => goTo(i));
    lbStrip.appendChild(btn);
  });

  const thumbEls = Array.from(lbStrip.querySelectorAll('.lb-thumb'));

  function goTo(idx) {
    current = (idx + pageImgs.length) % pageImgs.length;
    const src = pageImgs[current].src;
    const alt = pageImgs[current].alt;

    lbImg.classList.add('is-fading');
    setTimeout(() => {
      lbImg.src = src;
      lbImg.alt = alt;
      lbImg.classList.remove('is-fading');
    }, 180);

    lbCount.textContent = `${current + 1} / ${pageImgs.length}`;
    thumbEls.forEach((t, i) => t.classList.toggle('is-active', i === current));
    thumbEls[current].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  function open(idx) {
    goTo(idx);
    lb.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  // Wire gallery images
  pageImgs.forEach((img, i) => {
    img.addEventListener('click', () => open(i));
  });

  lbClose.addEventListener('click', close);
  lbPrev.addEventListener('click', () => goTo(current - 1));
  lbNext.addEventListener('click', () => goTo(current + 1));

  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape')     close();
    if (e.key === 'ArrowLeft')  goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  });

  // Expand cursor ring on lightbox buttons
  lb.querySelectorAll('.lb-btn, .lb-arrow, .lb-thumb').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('cursor-ring--hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('cursor-ring--hover'));
  });
})();


// ── Series Slideshow (auto-crossfade) ────────────
(function () {
  const stages = Array.from(document.querySelectorAll('.series-slideshow-stage'));
  if (!stages.length) return;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const INTERVAL = 3000;
  const slideshows = stages.map(stage => {
    const slides = Array.from(stage.querySelectorAll('.series-slideshow-img'));
    if (slides.length < 2) return null;

    let i = slides.findIndex(slide => slide.classList.contains('is-active'));
    if (i < 0) i = 0;
    slides.forEach((slide, idx) => slide.classList.toggle('is-active', idx === i));

    let timer = null;

    function advance() {
      slides[i].classList.remove('is-active');
      i = (i + 1) % slides.length;
      slides[i].classList.add('is-active');
    }
    function start() {
      if (reduceMotion || timer) return;
      timer = setInterval(advance, INTERVAL);
    }
    function stop() {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    }

    stage.addEventListener('mouseenter', stop);
    stage.addEventListener('mouseleave', start);

    return { start, stop };
  }).filter(Boolean);

  slideshows.forEach(slideshow => slideshow.start());

  // Pause when tab is hidden so it doesn't drift while away
  document.addEventListener('visibilitychange', () => {
    slideshows.forEach(slideshow => {
      if (document.hidden) slideshow.stop();
      else slideshow.start();
    });
  });
})();


// ── Split text reveal on hero ─────────────────────
const heroTitle = document.querySelector('.hero-title');
if (heroTitle) {
  const text = heroTitle.textContent;
  heroTitle.innerHTML = text
    .split('')
    .map((ch, i) => `<span class="char" style="--i:${i}">${ch === ' ' ? '&nbsp;' : ch}</span>`)
    .join('');
  // Force the browser to commit the chars' initial styles before flipping the
  // class, otherwise the transition can be skipped entirely (no "from" value to
  // animate). Reading offsetWidth flushes style/layout synchronously.
  void heroTitle.offsetWidth;
  setTimeout(() => heroTitle.classList.add('chars-revealed'), 60);
}


// ── Design DNA overlay ─────────────────────────────
(function initDesignDNA() {
  const overlay  = document.getElementById('dnaOverlay');
  const trigger  = document.querySelector('.dna-trigger');
  if (!overlay || !trigger) return;

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

  // Build swatches
  const swatchKeys = [
    { key: '--blue',   label: 'Blue'   },
    { key: '--pink',   label: 'Pink'   },
    { key: '--purple', label: 'Purple' },
    { key: '--orange', label: 'Orange' },
    { key: '--bg',     label: 'BG'     },
    { key: '--bg-2',   label: 'BG2'    },
    { key: '--text',   label: 'Text'   },
    { key: '--text-2', label: 'Text2'  },
    { key: '--border', label: 'Border' },
  ];

  const swatchRoot = document.getElementById('dnaSwatches');
  const preview    = document.getElementById('dnaColorPreview');
  const previewLbl = preview.querySelector('.dna-color-preview-label');

  const renderSwatches = () => {
    swatchRoot.innerHTML = '';
    swatchKeys.forEach(({ key, label }) => {
      const value = readVar(key);
      if (!value) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dna-swatch';
      btn.style.setProperty('--swatch', value);
      btn.setAttribute('data-light', isLightHex(value));
      btn.setAttribute('aria-label', `${label} ${value}`);
      btn.innerHTML = `
        <span class="dna-swatch-meta">
          <span class="dna-swatch-name">${label}</span>
          <span class="dna-swatch-hex">${value}</span>
        </span>
      `;
      btn.addEventListener('mouseenter', () => {
        preview.style.setProperty('--tint', value);
        preview.classList.add('is-tinted');
        previewLbl.textContent = `${label} · ${value}`;
      });
      btn.addEventListener('focus', () => {
        preview.style.setProperty('--tint', value);
        preview.classList.add('is-tinted');
        previewLbl.textContent = `${label} · ${value}`;
      });
      btn.addEventListener('mouseleave', () => {
        preview.classList.remove('is-tinted');
        previewLbl.textContent = 'Hover a swatch';
      });
      swatchRoot.appendChild(btn);
    });
  };
  renderSwatches();

  // Build spacing scale
  const scaleKeys = [1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 20];
  const scaleRoot = document.getElementById('dnaScale');
  const scaleValues = scaleKeys.map((n) => parseInt(readVar(`--space-${n}`), 10) || 0);
  const scaleMax = Math.max(...scaleValues) || 1;
  scaleRoot.innerHTML = scaleKeys.map((n, i) => {
    const px = scaleValues[i];
    const widthPct = Math.max(4, (px / scaleMax) * 100);
    return `
      <li class="dna-scale-row">
        <span>--${n}</span>
        <span class="dna-scale-bar" style="width:${widthPct}%"></span>
        <span class="dna-scale-px">${px}px</span>
      </li>
    `;
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
  const open = () => {
    lastFocus = document.activeElement;
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
    overlay.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    preview.classList.remove('is-tinted');
    previewLbl.textContent = 'Hover a swatch';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };

  trigger.addEventListener('click', open);
  overlay.querySelectorAll('[data-dna-close]').forEach((el) => el.addEventListener('click', close));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
  });

  // Re-render swatches on theme change so live values reflect the active theme
  const themeBtn = document.querySelector('.theme-toggle:not(.dna-trigger)');
  if (themeBtn) themeBtn.addEventListener('click', () => setTimeout(renderSwatches, 50));
})();
