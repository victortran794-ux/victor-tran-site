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
const interactiveEls = 'a, button, .project-card, .featured-item, .explore-btn';
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


// ── Magnetic Cards (rAF-batched) ───────────────────
if (!prefersReducedMotion) {
  document.querySelectorAll('.project-card, .featured-item').forEach(card => {
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
const themeToggle = document.querySelector('.theme-toggle');
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
  let rafPending = false;
  let lastX = 0, lastY = 0;

  const updateHero = () => {
    rafPending = false;
    const rect = hero.getBoundingClientRect();
    const px = ((lastX - rect.left) / rect.width)  * 100;
    const py = ((lastY - rect.top)  / rect.height) * 100;
    // Hue shifts with horizontal position (260° → 360°, magenta → pink sweep)
    const hue = 260 + (px / 100) * 100;
    hero.style.setProperty('--mx',  `${px}%`);
    hero.style.setProperty('--my',  `${py}%`);
    hero.style.setProperty('--hue', hue);
  };

  document.addEventListener('mousemove', e => {
    lastX = e.clientX;
    lastY = e.clientY;
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(updateHero);
    }
  });

  // Touch devices: sweep subtly based on scroll instead
  if ('ontouchstart' in window) {
    let touchHue = 300;
    window.addEventListener('scroll', () => {
      touchHue = 260 + ((window.scrollY % 400) / 400) * 100;
      hero.style.setProperty('--hue', touchHue);
    }, { passive: true });
  }
}


// ── Split text reveal on hero ─────────────────────
const heroTitle = document.querySelector('.hero-title');
if (heroTitle) {
  const text = heroTitle.textContent;
  heroTitle.innerHTML = text
    .split('')
    .map((ch, i) => `<span class="char" style="--i:${i}">${ch === ' ' ? '&nbsp;' : ch}</span>`)
    .join('');
  // Trigger after a brief delay
  requestAnimationFrame(() => {
    setTimeout(() => heroTitle.classList.add('chars-revealed'), 80);
  });
}
