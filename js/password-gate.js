(() => {
  const HASH = '577ceca1249a0d345bbc81098c47abe8825294b2cb4724735403188a01a1ade1';
  const KEY = 'vtd-unlock';
  const FORCE_LOCK = new URLSearchParams(location.search).get('lock') === '1';
  const PROTECTED_HASH_STATE = 'vtdProtectedHash';
  let backgroundInertState = [];

  const historyState = history.state && typeof history.state === 'object' ? history.state : {};
  const savedHash = typeof historyState[PROTECTED_HASH_STATE] === 'string'
    ? historyState[PROTECTED_HASH_STATE]
    : '';

  function stateWithoutProtectedHash() {
    const nextState = { ...(history.state && typeof history.state === 'object' ? history.state : {}) };
    delete nextState[PROTECTED_HASH_STATE];
    return nextState;
  }

  function restoreProtectedHash(hash, focusTarget = false) {
    if (!hash || location.hash) return false;
    const oldURL = location.href;
    history.replaceState(stateWithoutProtectedHash(), '', `${location.pathname}${location.search}${hash}`);
    window.dispatchEvent(new HashChangeEvent('hashchange', { oldURL, newURL: location.href }));
    const target = document.getElementById(hash.slice(1));
    if (focusTarget && target) {
      const positionTarget = () => {
        target.focus({ preventScroll: true });
        const navOffset = document.querySelector('.nav')?.getBoundingClientRect().height || 0;
        const targetTop = window.scrollY + target.getBoundingClientRect().top;
        window.scrollTo({ top: Math.max(0, targetTop - navOffset - 16), behavior: 'instant' });
      };
      const queuePosition = () => requestAnimationFrame(() => requestAnimationFrame(positionTarget));

      queuePosition();
      if (document.readyState === 'complete') {
        setTimeout(queuePosition, 0);
      } else {
        window.addEventListener('load', () => setTimeout(queuePosition, 0), { once: true });
        window.addEventListener('pageshow', () => setTimeout(queuePosition, 0), { once: true });
      }
    }
    return Boolean(target);
  }

  function focusMainContent() {
    const main = document.querySelector('main');
    if (!main) return;
    if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
    main.focus({ preventScroll: true });
  }

  function setBackgroundInert(overlay, inert) {
    if (inert) {
      backgroundInertState = [...document.body.children]
        .filter((element) => element !== overlay)
        .map((element) => ({ element, wasInert: element.inert }));
      backgroundInertState.forEach(({ element }) => { element.inert = true; });
      return;
    }
    backgroundInertState.forEach(({ element, wasInert }) => {
      if (element.isConnected) element.inert = wasInert;
    });
    backgroundInertState = [];
  }

  if (FORCE_LOCK) sessionStorage.removeItem(KEY);

  if (sessionStorage.getItem(KEY) === 'ok') {
    document.documentElement.classList.remove('locked');
    restoreProtectedHash(savedHash, true);
    return;
  }

  const protectedHash = location.hash || savedHash;
  if (location.hash) {
    history.replaceState(
      { ...historyState, [PROTECTED_HASH_STATE]: location.hash },
      '',
      `${location.pathname}${location.search}`
    );
  }

  async function sha256(text) {
    const buf = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function unlock() {
    sessionStorage.setItem(KEY, 'ok');
    document.documentElement.classList.remove('locked');
    if (FORCE_LOCK) {
      const url = new URL(location.href);
      url.searchParams.delete('lock');
      history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
    }
    const overlay = document.getElementById('vtd-gate');
    if (overlay) {
      overlay.classList.add('vtd-gate--out');
      setTimeout(() => {
        setBackgroundInert(overlay, false);
        overlay.remove();
        if (!restoreProtectedHash(protectedHash, true)) focusMainContent();
      }, 320);
    } else {
      if (!restoreProtectedHash(protectedHash, true)) focusMainContent();
    }
  }

  function render() {
    const overlay = document.createElement('div');
    overlay.id = 'vtd-gate';
    overlay.className = 'vtd-gate';
    overlay.innerHTML = `
      <div class="vtd-gate-card" role="dialog" aria-modal="true" aria-labelledby="vtd-gate-title" aria-describedby="vtd-gate-description">
        <p class="vtd-gate-eyebrow">Protected case study</p>
        <h1 id="vtd-gate-title" class="vtd-gate-title">This work is password-protected.</h1>
        <p id="vtd-gate-description" class="vtd-gate-body">
          Enter the password to view this project. Don't have one?
          <a href="mailto:victortran794@gmail.com">Email me</a> and I'll send it over.
        </p>
        <form class="vtd-gate-form" autocomplete="off" novalidate>
          <label for="vtd-gate-input" class="vtd-gate-label">Password</label>
          <input
            id="vtd-gate-input"
            class="vtd-gate-input"
            type="password"
            autocomplete="current-password"
            spellcheck="false"
            autocapitalize="off"
            autofocus
            required>
          <button type="submit" class="vtd-gate-submit">Unlock</button>
          <p class="vtd-gate-error" role="status" aria-live="assertive" aria-atomic="true" hidden>Incorrect password. Try again.</p>
        </form>
        <p class="vtd-gate-back">
          <a href="index.html">← Back to portfolio</a>
        </p>
      </div>
    `;
    document.body.appendChild(overlay);
    setBackgroundInert(overlay, true);

    const dialog = overlay.querySelector('[role="dialog"]');
    const form = overlay.querySelector('.vtd-gate-form');
    const input = overlay.querySelector('#vtd-gate-input');
    const error = overlay.querySelector('.vtd-gate-error');
    const focusGate = () => {
      if (!input.isConnected) return;
      window.scrollTo(0, 0);
      input.focus({ preventScroll: true });
    };

    focusGate();
    requestAnimationFrame(focusGate);
    if (document.readyState === 'complete') setTimeout(focusGate, 0);
    else window.addEventListener('load', () => requestAnimationFrame(focusGate), { once: true });

    dialog.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const focusable = [...dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled])')]
        .filter((element) => !element.hidden && element.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const value = input.value.trim();
      if (!value) return;
      const hash = await sha256(value);
      if (hash === HASH) {
        unlock();
      } else {
        error.hidden = false;
        input.value = '';
        input.focus();
      }
    });

    input.addEventListener('input', () => { error.hidden = true; });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
