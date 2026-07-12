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


// ── Hero: fixed portrait + color switcher ─────────
(function () {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const dots = Array.from(hero.querySelectorAll('.hero-cycle-dot'));
  const cycleBtn = hero.querySelector('.hero-cycle');
  const palette = ['--pink', '--blue', '--orange', '--purple'];

  let i = Math.floor(Math.random() * palette.length);

  function setHeroColor(next) {
    i = (next + palette.length) % palette.length;
    const sessionToken = palette[i];
    const accentToken = palette[(i + 1) % palette.length];

    hero.style.setProperty('--bg-tint', `var(${sessionToken})`);
    hero.style.setProperty('--lens-color', `var(${sessionToken})`);
    hero.style.setProperty('--accent-2', `var(${accentToken})`);
    hero.dataset.color = String(i);

    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle('is-active', dotIndex === i);
    });
  }

  setHeroColor(i);

  hero.addEventListener('click', e => {
    if (e.target.closest('a, .hero-meta')) return;
    setHeroColor(i + 1);
  });

  cycleBtn?.addEventListener('click', e => {
    e.stopPropagation();
    setHeroColor(i + 1);
  });
})();

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
    thumbEls[current].scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'center'
    });
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
  if (canUseCustomCursor) {
    lb.querySelectorAll('.lb-btn, .lb-arrow, .lb-thumb').forEach(el => {
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
  const INTERVAL = 3000;
  const slideshows = stages.map(stage => {
    const slides = Array.from(stage.querySelectorAll('.series-slideshow-img'));
    if (slides.length < 2) return null;

    let i = slides.findIndex(slide => slide.classList.contains('is-active'));
    if (i < 0) i = 0;
    slides.forEach((slide, idx) => slide.classList.toggle('is-active', idx === i));

    let timer = null;
    let userPaused = reduceMotion;

    function advance() {
      slides[i].classList.remove('is-active');
      i = (i + 1) % slides.length;
      slides[i].classList.add('is-active');
    }
    function start() {
      if (userPaused || timer) return;
      timer = setInterval(advance, INTERVAL);
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

  // Re-render swatches when lens mode changes so colors reflect the active theme
  document.querySelectorAll('.lens-switcher-btn:not([data-lens="dna"])').forEach(btn => {
    btn.addEventListener('click', () => setTimeout(renderSwatches, 50));
  });
})();


// ── Copy email fallback ─────────────────────────────
document.querySelectorAll('[data-copy-email]').forEach((button) => {
  const email = button.dataset.copyEmail;
  const status = button.parentElement.querySelector('[data-copy-email-status]');
  const defaultLabel = button.textContent;

  const copyWithFallback = () => {
    const field = document.createElement('textarea');
    field.value = email;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand('copy');
    field.remove();
    if (!copied) throw new Error('Copy command failed');
  };

  button.addEventListener('click', async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(email);
      } else {
        copyWithFallback();
      }
      button.textContent = 'Copied';
      button.dataset.copyState = 'copied';
      if (status) status.textContent = `Copied ${email} to clipboard.`;
      window.setTimeout(() => {
        button.textContent = defaultLabel;
        delete button.dataset.copyState;
      }, 2000);
    } catch (error) {
      if (status) status.textContent = `Could not copy automatically. Email ${email}.`;
      window.location.href = `mailto:${email}`;
    }
  });
});
