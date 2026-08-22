(() => {
  const params = new URLSearchParams(location.search);
  const input = document.getElementById('vtd-gate-input');
  const dialog = document.querySelector('[role="dialog"]');
  const nextInput = document.querySelector('input[name="next"]');
  const error = document.querySelector('.vtd-gate-error');

  const requestedNext = params.get('next') || '';
  if (/^\/wxo-canvas(?:\.html)?(?:[?#][^\r\n]*)?$/u.test(requestedNext)) {
    nextInput.value = requestedNext;
  } else if (/^\/document-processing(?:\.html)?(?:[?#][^\r\n]*)?$/u.test(requestedNext)) {
    nextInput.value = '/wxo-canvas#document-processing';
  }

  if (params.get('error') === '1') error.hidden = false;

  try {
    if (localStorage.getItem('lens') === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  } catch {
    // Storage can be unavailable in privacy-focused browsing modes.
  }

  const focusInput = () => {
    window.scrollTo(0, 0);
    input.focus({ preventScroll: true });
  };
  focusInput();
  requestAnimationFrame(focusInput);
  window.addEventListener('pageshow', focusInput, { once: true });

  input.addEventListener('input', () => { error.hidden = true; });
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"])')]
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
})();
