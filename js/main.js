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

  // Native modal dialogs live in the browser top layer, above ordinary body
  // stacking. Move the decorative cursor into an open dialog so it remains
  // visible over archive tearsheets, then restore it when the dialog closes.
  const cursorHome = document.body;
  function syncCursorOverlayHost() {
    const dialog = document.querySelector('dialog[open]');
    (dialog || cursorHome).append(dot, ring);
  }
  new MutationObserver(syncCursorOverlayHost).observe(document.body, {
    subtree: true,
    attributes: true,
    attributeFilter: ['open'],
  });
  document.addEventListener('close', syncCursorOverlayHost, true);
  syncCursorOverlayHost();
}


// ── Scroll Reveal ──────────────────────────────────
const revealEls = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -10% 0px' });

  revealEls.forEach(el => revealObserver.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('revealed'));
}


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
  let openedByHover = false;

  toggle.addEventListener('click', () => {
    // Pointer entry opens the menu before its click fires. Keep that first
    // click open; a subsequent click still provides the intentional close.
    if (openedByHover && toggle.getAttribute('aria-expanded') === 'true') {
      openedByHover = false;
      return;
    }
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
      openedByHover = true;
    });
    group.addEventListener('mouseleave', () => {
      hoverTimer = setTimeout(() => {
        setDropdownOpen(toggle, false);
        openedByHover = false;
      }, 120);
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


// ── Finish-proof hash target stabilization ─────────
// A fresh URL fragment can be resolved before the external stylesheet applies
// scroll-margin-top. Re-anchor after load so the fixed nav never obscures the
// bounded About jump targets. Other routes remain untouched.
const stabilizeFinishProofHashTarget = () => {
  if (!document.documentElement.hasAttribute('data-finish-proof') || !window.location.hash) return;

  let targetId;
  try {
    targetId = decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return;
  }

  const target = document.getElementById(targetId);
  if (!target) return;

  requestAnimationFrame(() => requestAnimationFrame(() => {
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    target.scrollIntoView({ block: 'start' });
    root.style.scrollBehavior = previousScrollBehavior;
  }));
};

window.addEventListener('load', stabilizeFinishProofHashTarget, { once: true });
window.addEventListener('hashchange', stabilizeFinishProofHashTarget);

// ── Home: bounded work arrival ──────────────────────
function initWorkArrival() {
  const work = document.querySelector('.featured#work');
  if (!work) return;

  let clearTimer = 0;
  const arrive = () => {
    work.classList.remove('is-work-arriving');
    void work.offsetWidth;
    work.classList.add('is-work-arriving');
    window.clearTimeout(clearTimer);
    clearTimer = window.setTimeout(() => work.classList.remove('is-work-arriving'), prefersReducedMotion ? 0 : 800);
  };

  document.querySelectorAll('a[href="#work"]').forEach(link => {
    link.addEventListener('click', arrive);
  });
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#work') arrive();
  });
  if (window.location.hash === '#work') arrive();
}

initWorkArrival();


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

  const saved = localStorage.getItem('lens') || 'light';

  function syncHomeThemeImages(lens) {
    document.querySelectorAll('[data-home-theme-image]').forEach(image => {
      const nextSource = lens === 'dark' ? image.dataset.themeDarkSrc : image.dataset.themeLightSrc;
      if (nextSource && image.getAttribute('src') !== nextSource) image.setAttribute('src', nextSource);
    });
  }

  function applyLens(lens) {
    if (lens === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    syncHomeThemeImages(lens);
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

  if (!('IntersectionObserver' in window)) {
    setActiveChapter(cards[0].dataset.chapter, cards[0].dataset.chapterTitle);
    return;
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


// ── Hero: theme-bound ambient field ────────────────
(function initHeroAmbientField() {
  const hero = document.querySelector('.home-page--engraved-dna .hero');
  const blobs = hero ? [...hero.querySelectorAll('.hero-ambient-blob')] : [];
  const satellites = hero ? [...hero.querySelectorAll('.hero-ambient-orb')] : [];
  const companions = hero ? [...hero.querySelectorAll('.hero-ambient-companion')] : [];
  if (!hero || blobs.length !== 2 || satellites.length !== 6 || companions.length !== 3) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const centers = [
    { x: 0.32, y: 0.42, phase: 0, speed: 0.00055, ax: 0.16, ay: 0.13 },
    { x: 0.7, y: 0.58, phase: Math.PI, speed: 0.00043, ax: 0.14, ay: 0.17 },
  ];
  const current = centers.map(({ x, y }) => ({ x, y }));
  const satellitePaths = [
    { x: 0.22, y: 0.28, phase: 0.2, speed: 0.00028, radiusX: 0.11, radiusY: 0.09, pointerPull: 0.05 },
    { x: 0.42, y: 0.18, phase: 1.4, speed: 0.00044, radiusX: 0.14, radiusY: 0.1, pointerPull: -0.04 },
    { x: 0.7, y: 0.34, phase: 2.6, speed: 0.00036, radiusX: 0.12, radiusY: 0.14, pointerPull: 0.06 },
    { x: 0.78, y: 0.68, phase: 3.7, speed: 0.00032, radiusX: 0.15, radiusY: 0.11, pointerPull: -0.05 },
    { x: 0.48, y: 0.78, phase: 4.8, speed: 0.0004, radiusX: 0.1, radiusY: 0.15, pointerPull: 0.045 },
    { x: 0.28, y: 0.62, phase: 5.5, speed: 0.00024, radiusX: 0.16, radiusY: 0.12, pointerPull: 0.055 },
  ];
  const satelliteCurrent = satellitePaths.map((path) => ({
    x: path.x + Math.sin(path.phase) * path.radiusX,
    y: path.y + Math.cos(path.phase) * path.radiusY,
  }));
  const companionRanges = [14, 11, 8];
  const companionResponse = [0.16, 0.13, 0.1];
  const companionSatelliteIndexes = [0, 2, 4];
  const companionCurrent = companions.map(() => ({ x: 0, y: 0 }));
  const blobGradients = {
    warm: 'radial-gradient(circle at 58% 42%, #ff6847 0 18%, var(--hero-blob-a) 42%, transparent 74%)',
    cool: 'radial-gradient(circle at 42% 58%, #7928d2 0 20%, var(--hero-blob-b) 46%, #55a2f7 62%, transparent 76%)',
    'coral-pink': 'radial-gradient(circle at 54% 44%, #ff6847 0 18%, #ea3b99 46%, transparent 76%)',
    'pink-purple': 'radial-gradient(circle at 48% 44%, #ea3b99 0 18%, #7928d2 50%, transparent 76%)',
    'blue-purple': 'radial-gradient(circle at 46% 42%, #55a2f7 0 18%, #7928d2 52%, transparent 76%)',
  };
  const blobMeta = [
    { id: 'blob-a', size: 100, opacity: 1, blur: 44, layer: 1, gradient: 'warm', pointerPull: 42, hidden: false },
    { id: 'blob-b', size: 72, opacity: 1, blur: 44, layer: 1, gradient: 'cool', pointerPull: -6, hidden: false },
  ];
  let motionScale = 1;
  let cursorScale = 1;
  let ambientPaused = false;
  let pointer = null;
  let frame = 0;
  let previous = 0;

  const render = (time) => {
    if (document.hidden || reducedMotion.matches) {
      frame = 0;
      return;
    }
    if (time - previous >= 32) {
      previous = time;
      centers.forEach((orbit, index) => {
        const idleX = orbit.x + Math.sin(time * orbit.speed * motionScale + orbit.phase) * orbit.ax * motionScale;
        const idleY = orbit.y + Math.cos(time * orbit.speed * motionScale * 0.83 + orbit.phase) * orbit.ay * motionScale;
        let targetX = idleX;
        let targetY = idleY;
        if (pointer) {
          const pull = blobMeta[index].pointerPull / 100;
          if (pull >= 0) {
            const blend = Math.min(0.8, pull * cursorScale);
            targetX = idleX * (1 - blend) + pointer.x * blend;
            targetY = idleY * (1 - blend) + pointer.y * blend;
          } else {
            const dx = idleX - pointer.x;
            const dy = idleY - pointer.y;
            const distance = Math.max(0.08, Math.hypot(dx, dy));
            targetX = idleX + (dx / distance) * Math.abs(pull) * cursorScale;
            targetY = idleY + (dy / distance) * Math.abs(pull) * cursorScale;
          }
        }
        current[index].x += (targetX - current[index].x) * 0.1;
        current[index].y += (targetY - current[index].y) * 0.1;
        blobs[index].style.setProperty('--blob-x', `${(current[index].x * 100).toFixed(2)}%`);
        blobs[index].style.setProperty('--blob-y', `${(current[index].y * 100).toFixed(2)}%`);
      });
      satellitePaths.forEach((path, index) => {
        if (satellites[index].classList.contains('hero-ambient-orb--node')) return;
        let targetX = path.x + Math.sin(time * path.speed * motionScale + path.phase) * path.radiusX * motionScale;
        let targetY = path.y + Math.cos(time * path.speed * motionScale * 0.91 + path.phase) * path.radiusY * motionScale;
        if (pointer) {
          targetX += (pointer.x - targetX) * path.pointerPull * cursorScale;
          targetY += (pointer.y - targetY) * path.pointerPull * cursorScale;
        }
        satelliteCurrent[index].x += (targetX - satelliteCurrent[index].x) * 0.09;
        satelliteCurrent[index].y += (targetY - satelliteCurrent[index].y) * 0.09;
        satellites[index].style.setProperty('--orb-x', `${(satelliteCurrent[index].x * 100).toFixed(2)}%`);
        satellites[index].style.setProperty('--orb-y', `${(satelliteCurrent[index].y * 100).toFixed(2)}%`);
      });
      companions.forEach((companion, index) => {
        const anchor = satelliteCurrent[companionSatelliteIndexes[index]];
        const range = companionRanges[index];
        const targetX = pointer ? (pointer.x - 0.5) * range * 2 * cursorScale : 0;
        const targetY = pointer ? (pointer.y - 0.5) * range * 2 * cursorScale : 0;
        companionCurrent[index].x += (targetX - companionCurrent[index].x) * companionResponse[index];
        companionCurrent[index].y += (targetY - companionCurrent[index].y) * companionResponse[index];
        companion.style.setProperty('--companion-field-x', `${(anchor.x * 100).toFixed(2)}%`);
        companion.style.setProperty('--companion-field-y', `${(anchor.y * 100).toFixed(2)}%`);
        companion.style.setProperty('--companion-shift-x', `${companionCurrent[index].x.toFixed(2)}px`);
        companion.style.setProperty('--companion-shift-y', `${companionCurrent[index].y.toFixed(2)}px`);
      });
    }
    frame = requestAnimationFrame(render);
  };

  const start = () => {
    if (ambientPaused) return;
    hero.classList.remove('hero-ambient-paused');
    if (!frame && !document.hidden && !reducedMotion.matches) frame = requestAnimationFrame(render);
  };
  const stop = () => {
    hero.classList.add('hero-ambient-paused');
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (reducedMotion.matches) {
      pointer = null;
      companions.forEach((companion, index) => {
        companionCurrent[index].x = 0;
        companionCurrent[index].y = 0;
        companion.style.setProperty('--companion-shift-x', '0px');
        companion.style.setProperty('--companion-shift-y', '0px');
      });
    }
  };

  const colorValues = {
    blue: '#55a2f7', pink: '#ea3b99', purple: '#7928d2', orange: '#ff6847',
    'theme-a': 'var(--hero-blob-a)', 'theme-b': 'var(--hero-blob-b)',
    background: 'var(--hero-bg)', 'blue-purple': 'color-mix(in oklab, #55a2f7 76%, #7928d2)',
  };
  const ringColorKeys = ['orange', 'theme-a', 'blue', 'theme-b', 'blue-purple', 'theme-a'];
  const ringSizes = [42, 68, 96, 132, 176, 224];
  const ringMeta = satellites.map((element, index) => ({
    id: `ring-${String.fromCharCode(97 + index)}`,
    size: ringSizes[index], opacity: 0.34, stroke: 1, layer: 1,
    color: ringColorKeys[index], node: element.classList.contains('hero-ambient-orb--node'), hidden: false,
  }));
  const smallMeta = companions.map((element, index) => ({
    id: `small-${['a', 'c', 'e'][index]}`,
    size: [12, 20, 32][index], opacity: 1, stroke: 1, layer: 3,
    color: 'background', offsetX: [37, -63, 109][index], offsetY: [-12, 21, -56][index], hidden: false,
  }));
  const ambient = hero.querySelector('.hero-ambient');
  let generatedId = 0;
  const number = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

  const applyBlobStyle = index => {
    const element = blobs[index];
    const meta = blobMeta[index];
    if (!element || !meta) return;
    element.dataset.ambientId = meta.id;
    element.style.setProperty('--blob-size-scale', meta.size / 100);
    element.style.setProperty('--blob-blur', `${meta.blur}px`);
    element.style.setProperty('--blob-visibility', meta.opacity);
    element.style.background = blobGradients[meta.gradient] || blobGradients.warm;
    element.style.zIndex = meta.layer;
    element.hidden = Boolean(meta.hidden);
  };

  const applyRingStyle = (index, resetPosition = true) => {
    const element = satellites[index];
    const meta = ringMeta[index];
    const path = satellitePaths[index];
    if (!element || !meta || !path) return;
    element.dataset.ambientId = meta.id;
    element.classList.toggle('hero-ambient-orb--node', meta.node);
    element.style.setProperty('--orb-size', `${meta.size}px`);
    element.style.setProperty('--orb-color', colorValues[meta.color] || meta.color);
    if (resetPosition) {
      element.style.setProperty('--orb-x', `${path.x * 100}%`);
      element.style.setProperty('--orb-y', `${path.y * 100}%`);
    }
    element.style.opacity = meta.opacity;
    element.style.borderWidth = `${meta.stroke}px`;
    element.style.zIndex = meta.layer;
    element.hidden = Boolean(meta.hidden);
  };
  const applySmallStyle = index => {
    const element = companions[index];
    const meta = smallMeta[index];
    if (!element || !meta) return;
    element.dataset.ambientId = meta.id;
    element.style.setProperty('--companion-size', `${meta.size}px`);
    element.style.setProperty('--orb-color', colorValues[meta.color] || meta.color);
    element.style.setProperty('--companion-offset-x', `${meta.offsetX}px`);
    element.style.setProperty('--companion-offset-y', `${meta.offsetY}px`);
    element.style.opacity = meta.opacity;
    element.style.borderWidth = `${meta.stroke}px`;
    element.style.borderColor = colorValues[meta.color] || meta.color;
    element.style.zIndex = meta.layer;
    element.hidden = Boolean(meta.hidden);
  };
  blobMeta.forEach((_, index) => applyBlobStyle(index));
  ringMeta.forEach((_, index) => applyRingStyle(index, false));
  smallMeta.forEach((_, index) => applySmallStyle(index));

  const update = (id, patch = {}) => {
    let index = blobMeta.findIndex(meta => meta.id === id);
    if (index >= 0) {
      const meta = blobMeta[index];
      const path = centers[index];
      if ('size' in patch) meta.size = clamp(number(patch.size, meta.size), 30, 160);
      if ('opacity' in patch) meta.opacity = clamp(number(patch.opacity, meta.opacity), 0.05, 1);
      if ('blur' in patch) meta.blur = clamp(number(patch.blur, meta.blur), 0, 100);
      if ('layer' in patch) meta.layer = clamp(number(patch.layer, meta.layer), 0, 1);
      if ('gradient' in patch && blobGradients[patch.gradient]) meta.gradient = patch.gradient;
      if ('hidden' in patch) meta.hidden = Boolean(patch.hidden);
      if ('anchorX' in patch) path.x = clamp(number(patch.anchorX, path.x * 100) / 100, -0.2, 1.2);
      if ('anchorY' in patch) path.y = clamp(number(patch.anchorY, path.y * 100) / 100, -0.2, 1.2);
      if ('travelX' in patch) path.ax = clamp(number(patch.travelX, path.ax * 100) / 100, 0, 0.35);
      if ('travelY' in patch) path.ay = clamp(number(patch.travelY, path.ay * 100) / 100, 0, 0.35);
      if ('speed' in patch) path.speed = clamp(number(patch.speed, path.speed * 1000), 0.05, 1.2) / 1000;
      if ('pointerPull' in patch) meta.pointerPull = clamp(number(patch.pointerPull, meta.pointerPull), -20, 80);
      current[index].x = path.x;
      current[index].y = path.y;
      applyBlobStyle(index);
      return true;
    }
    index = ringMeta.findIndex(meta => meta.id === id);
    if (index >= 0) {
      const meta = ringMeta[index];
      const path = satellitePaths[index];
      if ('size' in patch) meta.size = clamp(number(patch.size, meta.size), 12, 360);
      if ('opacity' in patch) meta.opacity = clamp(number(patch.opacity, meta.opacity), 0.05, 1);
      if ('stroke' in patch) meta.stroke = clamp(number(patch.stroke, meta.stroke), 0.5, 5);
      if ('layer' in patch) meta.layer = clamp(number(patch.layer, meta.layer), 1, 5);
      if ('color' in patch && colorValues[patch.color]) meta.color = patch.color;
      if ('node' in patch) meta.node = Boolean(patch.node);
      if ('hidden' in patch) meta.hidden = Boolean(patch.hidden);
      if ('anchorX' in patch) path.x = clamp(number(patch.anchorX, path.x * 100) / 100, -0.1, 1.1);
      if ('anchorY' in patch) path.y = clamp(number(patch.anchorY, path.y * 100) / 100, -0.1, 1.1);
      if ('travelX' in patch) path.radiusX = clamp(number(patch.travelX, path.radiusX * 100) / 100, 0, 0.35);
      if ('travelY' in patch) path.radiusY = clamp(number(patch.travelY, path.radiusY * 100) / 100, 0, 0.35);
      if ('speed' in patch) path.speed = clamp(number(patch.speed, path.speed * 1000), 0.05, 1.2) / 1000;
      if ('pointerPull' in patch) path.pointerPull = clamp(number(patch.pointerPull, path.pointerPull * 100), -20, 20) / 100;
      satelliteCurrent[index].x = path.x;
      satelliteCurrent[index].y = path.y;
      applyRingStyle(index);
      return true;
    }

    index = smallMeta.findIndex(meta => meta.id === id);
    if (index < 0) return null;
    const meta = smallMeta[index];
    if ('size' in patch) meta.size = clamp(number(patch.size, meta.size), 6, 42);
    if ('opacity' in patch) meta.opacity = clamp(number(patch.opacity, meta.opacity), 0.05, 1);
    if ('stroke' in patch) meta.stroke = clamp(number(patch.stroke, meta.stroke), 0.5, 5);
    if ('layer' in patch) meta.layer = clamp(number(patch.layer, meta.layer), 2, 5);
    if ('color' in patch && colorValues[patch.color]) meta.color = patch.color;
    if ('hidden' in patch) meta.hidden = Boolean(patch.hidden);
    if ('anchorX' in patch) meta.offsetX = clamp(number(patch.anchorX, meta.offsetX), -180, 180);
    if ('anchorY' in patch) meta.offsetY = clamp(number(patch.anchorY, meta.offsetY), -180, 180);
    if ('speed' in patch) companionResponse[index] = clamp(number(patch.speed, companionResponse[index] * 10), 0.2, 3) / 10;
    if ('pointerPull' in patch) companionRanges[index] = clamp(number(patch.pointerPull, companionRanges[index]), 0, 30);
    if ('linkedRingId' in patch) {
      const linked = ringMeta.findIndex(ring => ring.id === patch.linkedRingId);
      if (linked >= 0) companionSatelliteIndexes[index] = linked;
    }
    applySmallStyle(index);
    return true;
  };

  const addRing = (seed = {}) => {
    const element = document.createElement('span');
    element.className = 'hero-ambient-orb';
    ambient.insertBefore(element, companions[0] || null);
    const id = seed.id || `ring-new-${++generatedId}`;
    satellites.push(element);
    satellitePaths.push({
      x: number(seed.anchorX, 52) / 100, y: number(seed.anchorY, 48) / 100,
      phase: number(seed.phase, generatedId * 0.9), speed: number(seed.speed, 0.32) / 1000,
      radiusX: number(seed.travelX, 10) / 100, radiusY: number(seed.travelY, 9) / 100,
      pointerPull: number(seed.pointerPull, 5) / 100,
    });
    satelliteCurrent.push({ x: number(seed.anchorX, 52) / 100, y: number(seed.anchorY, 48) / 100 });
    ringMeta.push({
      id, size: number(seed.size, 84), opacity: number(seed.opacity, 0.34),
      stroke: number(seed.stroke, 1), layer: number(seed.layer, 1),
      color: seed.color || 'blue', node: Boolean(seed.node), hidden: Boolean(seed.hidden),
    });
    applyRingStyle(satellites.length - 1);
    return id;
  };

  const addSmall = (seed = {}) => {
    const element = document.createElement('span');
    element.className = 'hero-ambient-companion';
    ambient.append(element);
    const id = seed.id || `small-new-${++generatedId}`;
    let linkedIndex = ringMeta.findIndex(meta => meta.id === seed.linkedRingId);
    if (linkedIndex < 0) linkedIndex = satellites.findIndex(element => !element.classList.contains('hero-ambient-orb--node'));
    companions.push(element);
    companionSatelliteIndexes.push(Math.max(0, linkedIndex));
    companionRanges.push(number(seed.pointerPull, 10));
    companionResponse.push(number(seed.speed, 1.2) / 10);
    companionCurrent.push({ x: 0, y: 0 });
    smallMeta.push({
      id, size: number(seed.size, 18), opacity: number(seed.opacity, 1),
      stroke: number(seed.stroke, 1), layer: number(seed.layer, 3),
      color: seed.color || 'background', offsetX: number(seed.anchorX, 24), offsetY: number(seed.anchorY, -18), hidden: Boolean(seed.hidden),
    });
    applySmallStyle(companions.length - 1);
    return id;
  };

  const setPaused = paused => {
    ambientPaused = Boolean(paused);
    if (ambientPaused) stop();
    else start();
    return ambientPaused;
  };
  const setGlobals = values => {
    if ('motionScale' in values) motionScale = clamp(number(values.motionScale, motionScale), 0, 2);
    if ('cursorScale' in values) cursorScale = clamp(number(values.cursorScale, cursorScale), 0, 2);
    if ('paused' in values) setPaused(values.paused);
    return { motionScale, cursorScale, paused: ambientPaused };
  };
  const clearCircles = () => {
    [...satellites, ...companions].forEach(element => element.remove());
    satellites.splice(0); satellitePaths.splice(0); satelliteCurrent.splice(0); ringMeta.splice(0);
    companions.splice(0); companionSatelliteIndexes.splice(0); companionRanges.splice(0);
    companionResponse.splice(0); companionCurrent.splice(0); smallMeta.splice(0);
  };
  const applyConfig = config => {
    if (!config || !Array.isArray(config.circles)) throw new Error('Ambient configuration must include a circles array.');
    if (Array.isArray(config.blobs)) {
      config.blobs.forEach(blob => update(blob.id, blob));
    }
    clearCircles();
    config.circles.filter(circle => circle.kind === 'ring').forEach(addRing);
    config.circles.filter(circle => circle.kind === 'small').forEach(addSmall);
    if (!satellites.length) addRing();
    const suffixes = config.circles.map(circle => Number(circle.id?.match(/-(?:new-)?(\d+)$/)?.[1] || 0));
    generatedId = Math.max(generatedId, ...suffixes);
    setGlobals(config.globals || {});
    return true;
  };
  if (window.__ambientFieldBaseline) applyConfig(window.__ambientFieldBaseline);

  hero.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse' || reducedMotion.matches) return;
    const rect = hero.getBoundingClientRect();
    pointer = {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    };
  }, { passive: true });
  hero.addEventListener('pointerleave', () => {
    pointer = null;
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });
  reducedMotion.addEventListener?.('change', () => {
    if (reducedMotion.matches) stop();
    else start();
  });
  start();
})();

// ── Deferred responsive gallery images ────────────────
(function initDeferredResponsiveImages() {
  const images = Array.from(document.querySelectorAll('.graphic-archive-v2 img[data-deferred-src]'));
  if (!images.length) return;

  function hydrate(image) {
    if (!image?.dataset.deferredSrc) return;
    image.sizes = image.dataset.deferredSizes;
    image.srcset = image.dataset.deferredSrcset;
    image.src = image.dataset.deferredSrc;
    delete image.dataset.deferredSrc;
    delete image.dataset.deferredSrcset;
    delete image.dataset.deferredSizes;
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        hydrate(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px' });
    images.forEach((image) => observer.observe(image));
  } else {
    images.forEach(hydrate);
  }
})();

// ── Gallery Lightbox ──────────────────────────────
(function () {
  const pageImgs = Array.from(document.querySelectorAll(
    '.gallery-spotlight img, .gallery-grid img, .gallery-section img, .series-slideshow img, .gallery-feature img, .art-archive-v2 .archive-frame > img, .graphic-archive-v2 .archive-frame > img, .ui-gallery-page .archive-frame > img, .coda__image, .ibm-flow-image, .ibm-evidence-artifact img, .pci-artifact img, .ability-case-study img, .sal-vico2-feature img, .sal-vico2-tribute img, .sal-vico2-page-pair img, .sal-vico2-case-study figure img'
  )).filter((img) => !img.closest('[aria-controls="mendenhall-archive-dialog"]') && !img.hasAttribute('data-ui-scroll-image') && !img.closest('a, button'));
  if (!pageImgs.length) return;

  let current = 0;
  const pageTitle = (document.querySelector('.page-header-title')?.textContent || 'Gallery').trim();
  const fullSource = (img) => img.dataset.fullSrc || img.currentSrc || img.src;
  const thumbSource = (img) => img.dataset.thumbSrc || img.currentSrc || img.src;
  const defaultItems = pageImgs.map((img) => ({ src: fullSource(img), thumb: thumbSource(img), alt: img.alt }));
  let activeItems = defaultItems;

  // Build DOM
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Image viewer');
  lb.setAttribute('aria-hidden', 'true');
  lb.inert = true;
  lb.innerHTML = `
    <header class="lb-header">
      <div>
        <p class="lb-title"></p>
        <p class="lb-count"></p>
      </div>
      <div class="lb-header-actions">
        <button class="lb-btn lb-size" aria-pressed="false">View actual size</button>
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
    <p class="lb-caption" aria-live="polite"></p>
    <div class="lb-strip"></div>
  `;
  document.body.appendChild(lb);

  lb.querySelector('.lb-title').textContent = pageTitle;

  const lbImg   = lb.querySelector('.lb-img');
  const lbCount = lb.querySelector('.lb-count');
  const lbStrip = lb.querySelector('.lb-strip');
  const lbClose = lb.querySelector('.lb-close');
  const lbSize = lb.querySelector('.lb-size');
  const lbWrap = lb.querySelector('.lb-img-wrap');
  lbWrap.tabIndex = 0;
  lbWrap.setAttribute('role', 'region');
  lbWrap.setAttribute('aria-label', 'Image detail. Scroll to explore at actual size.');
  lbSize.addEventListener('click', () => {
    const actual = lb.classList.toggle('is-actual-size');
    lbSize.setAttribute('aria-pressed', String(actual));
    lbSize.textContent = actual ? 'Fit image' : 'View actual size';
    lbWrap.scrollTo(0, 0);
  });
  const lbPrev  = lb.querySelector('.lb-arrow--prev');
  const lbNext  = lb.querySelector('.lb-arrow--next');

  let thumbEls = [];
  let lastTrigger = null;
  let previousBodyOverflow = '';
  let preservedScrollX = 0;
  let preservedScrollY = 0;
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
    return Array.from(lb.querySelectorAll('button:not([disabled]), [tabindex="0"]')).filter((element) => {
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
      ti.src = item.thumb || item.src;
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
    lb.classList.remove('is-actual-size');
    lbSize.setAttribute('aria-pressed', 'false');
    lbSize.textContent = 'View actual size';
    lbWrap.scrollTo(0, 0);
    lb.querySelector('.lb-caption').textContent = alt;

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
      activeItems = [{ src: fullSource(trigger), thumb: thumbSource(trigger), alt: trigger.alt }, ...picks.map((pick) => ({ src: pick.src, alt: pick.alt }))];
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
    preservedScrollX = window.scrollX;
    preservedScrollY = window.scrollY;
    previousBodyOverflow = document.body.style.overflow;
    lb.inert = false;
    lb.setAttribute('aria-hidden', 'false');
    lb.classList.add('is-open');
    setBackgroundInert(true);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      lbClose.focus({ preventScroll: true });
      window.scrollTo({ left: preservedScrollX, top: preservedScrollY, behavior: 'instant' });
    });
  }

  function close() {
    if (!lb.classList.contains('is-open')) return;
    lb.classList.remove('is-open');
    lb.inert = true;
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = previousBodyOverflow;
    setBackgroundInert(false);
    if (lastTrigger instanceof HTMLElement && document.contains(lastTrigger)) {
      lastTrigger.dispatchEvent(new Event('gallery-lightbox-close', { bubbles: true }));
      lastTrigger.focus({ preventScroll: true });
    }
    window.scrollTo({ left: preservedScrollX, top: preservedScrollY, behavior: 'instant' });
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
    if (e.key === 'ArrowLeft' && e.target !== lbWrap) {
      e.preventDefault();
      goTo(current - 1);
    }
    if (e.key === 'ArrowRight' && e.target !== lbWrap) {
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
    const hasDeferredSlides = slides.some((slide) => slide.dataset.deferredSrc);
    let activated = !hasDeferredSlides;
    function hydrate(slide) {
      if (!slide?.dataset.deferredSrc) return;
      slide.src = slide.dataset.deferredSrc;
      slide.srcset = slide.dataset.deferredSrcset;
      slide.sizes = slide.dataset.deferredSizes;
      delete slide.dataset.deferredSrc;
      delete slide.dataset.deferredSrcset;
      delete slide.dataset.deferredSizes;
    }
    function hydrateNext() {
      hydrate(slides[(i + 1) % slides.length]);
    }
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
      const next = (i + 1) % slides.length;
      hydrate(slides[next]);
      i = next;
      hydrateNext();
      syncSlideTriggers();
    }
    function start() {
      if (!activated || userPaused || lightboxOpen || timer) return;
      timer = setInterval(advance, intervalMs);
    }
    function activate() {
      if (activated) return;
      activated = true;
      hydrateNext();
      start();
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

    return { stage, start, stop, activate, hasDeferredSlides, setUserPaused, get userPaused() { return userPaused; } };
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

  if ('IntersectionObserver' in window) {
    const deferredStageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const slideshow = slideshows.find((candidate) => candidate.stage === entry.target);
        slideshow?.activate();
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px' });
    slideshows.forEach((slideshow) => {
      if (slideshow.hasDeferredSlides) deferredStageObserver.observe(slideshow.stage);
      else slideshow.start();
    });
  } else {
    slideshows.forEach((slideshow) => {
      if (slideshow.hasDeferredSlides) slideshow.activate();
      else slideshow.start();
    });
  }

  // Pause when tab is hidden so it doesn't drift while away
  document.addEventListener('visibilitychange', () => {
    slideshows.forEach(slideshow => {
      if (document.hidden) slideshow.stop();
      else slideshow.start();
    });
  });
})();




// ── Inline Design DNA reveal ───────────────────────
(function initInlineDesignDNA() {
  const trigger = document.querySelector('.hero-dna-trigger');
  const panel = document.getElementById('heroDnaPanel');
  const closeButton = panel?.querySelector('[data-dna-close]');
  const hero = trigger?.closest('.hero');
  if (!trigger || !panel || !hero) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const tintLayer = hero.querySelector('.hero-dna-tint');
  const tintStatus = panel.querySelector('.hero-dna-tint-status');
  const swatches = [...panel.querySelectorAll('.hero-dna-swatch')];
  const playText = panel.querySelector('.hero-dna-play-text');
  const fontChips = [...panel.querySelectorAll('[data-dna-font]')];
  const italicChip = panel.querySelector('[data-dna-italic]');
  const italicState = panel.querySelector('[data-dna-italic-state]');
  let selectedTint = null;
  let hideTimer = 0;

  const readToken = token => getComputedStyle(hero).getPropertyValue(token).trim()
    || getComputedStyle(document.documentElement).getPropertyValue(token).trim();

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = colorCanvas.height = 1;
  const colorContext = colorCanvas.getContext('2d', { willReadFrequently: true });
  function readableColor(value) {
    if (!colorContext) return value;
    colorContext.clearRect(0, 0, 1, 1);
    colorContext.fillStyle = value;
    colorContext.fillRect(0, 0, 1, 1);
    const channels = [...colorContext.getImageData(0, 0, 1, 1).data];
    return `#${channels.slice(0, channels[3] === 255 ? 3 : 4).map(n => n.toString(16).padStart(2, '0')).join('')}`;
  }

  function applyHeroTint(swatch = selectedTint) {
    const value = swatch ? readToken(swatch.dataset.dnaToken) : '';
    tintLayer?.style.setProperty('--dna-tint', value || 'transparent');
    tintLayer?.classList.toggle('is-active', Boolean(value));
    if (tintStatus) tintStatus.textContent = value
      ? `Hero wash · ${swatch.querySelector('.hero-dna-swatch-name').textContent} · ${readableColor(value)}`
      : 'No hero tint selected';
  }

  function syncDnaTokens() {
    swatches.forEach((swatch) => {
      const value = readToken(swatch.dataset.dnaToken);
      swatch.style.setProperty('--dna-color', value);
      swatch.querySelector('.hero-dna-swatch-value').textContent = readableColor(value);
      swatch.setAttribute('aria-label', `${swatch.querySelector('.hero-dna-swatch-name').textContent} ${readableColor(value)}; preview as hero wash`);
    });
    applyHeroTint();
  }

  swatches.forEach((swatch) => {
    swatch.addEventListener('pointerenter', () => applyHeroTint(swatch));
    swatch.addEventListener('pointerleave', () => applyHeroTint());
    swatch.addEventListener('focus', () => applyHeroTint(swatch));
    swatch.addEventListener('blur', () => applyHeroTint());
    swatch.addEventListener('click', () => {
      selectedTint = selectedTint === swatch ? null : swatch;
      swatches.forEach(item => {
        const selected = item === selectedTint;
        item.classList.toggle('is-selected', selected);
        item.setAttribute('aria-pressed', String(selected));
      });
      applyHeroTint();
    });
  });

  fontChips.forEach((chip) => chip.addEventListener('click', () => {
    fontChips.forEach(item => item.classList.toggle('is-active', item === chip));
    if (playText) playText.style.fontFamily = chip.dataset.dnaFont;
  }));
  italicChip?.addEventListener('click', () => {
    const active = italicChip.classList.toggle('is-active');
    italicChip.setAttribute('aria-pressed', String(active));
    if (italicState) italicState.textContent = active ? 'On' : 'Off';
    playText?.classList.toggle('is-italic', active);
  });

  new MutationObserver(syncDnaTokens).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  syncDnaTokens();

  function setDnaExpanded(expanded, { restoreFocus = false } = {}) {
    window.clearTimeout(hideTimer);
    trigger.setAttribute('aria-expanded', String(expanded));
    hero.classList.toggle('is-dna-expanded', expanded);

    if (expanded) {
      syncDnaTokens();
      panel.hidden = false;
      requestAnimationFrame(() => panel.classList.add('is-active'));
      return;
    }

    panel.classList.remove('is-active');
    selectedTint = null;
    swatches.forEach(swatch => {
      swatch.classList.remove('is-selected');
      swatch.setAttribute('aria-pressed', 'false');
    });
    applyHeroTint();
    const finish = () => {
      panel.hidden = true;
      if (restoreFocus) trigger.focus();
    };
    if (reducedMotion.matches) finish();
    else hideTimer = window.setTimeout(finish, 420);
  }

  trigger.addEventListener('click', () => {
    setDnaExpanded(trigger.getAttribute('aria-expanded') !== 'true');
  });
  closeButton?.addEventListener('click', () => setDnaExpanded(false, { restoreFocus: true }));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && trigger.getAttribute('aria-expanded') === 'true') {
      setDnaExpanded(false, { restoreFocus: true });
    }
  });
})();
