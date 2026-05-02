(() => {
  const HASH = '577ceca1249a0d345bbc81098c47abe8825294b2cb4724735403188a01a1ade1';
  const KEY = 'vtd-unlock';

  if (sessionStorage.getItem(KEY) === 'ok') {
    document.documentElement.classList.remove('locked');
    return;
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
    const overlay = document.getElementById('vtd-gate');
    if (overlay) {
      overlay.classList.add('vtd-gate--out');
      setTimeout(() => overlay.remove(), 320);
    }
  }

  function render() {
    const overlay = document.createElement('div');
    overlay.id = 'vtd-gate';
    overlay.className = 'vtd-gate';
    overlay.innerHTML = `
      <div class="vtd-gate-card" role="dialog" aria-modal="true" aria-labelledby="vtd-gate-title">
        <p class="vtd-gate-eyebrow">Protected case study</p>
        <h1 id="vtd-gate-title" class="vtd-gate-title">This work is password-protected.</h1>
        <p class="vtd-gate-body">
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
          <p class="vtd-gate-error" hidden>Incorrect password. Try again.</p>
        </form>
        <p class="vtd-gate-back">
          <a href="index.html">← Back to portfolio</a>
        </p>
      </div>
    `;
    document.body.appendChild(overlay);

    const form = overlay.querySelector('.vtd-gate-form');
    const input = overlay.querySelector('#vtd-gate-input');
    const error = overlay.querySelector('.vtd-gate-error');

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
