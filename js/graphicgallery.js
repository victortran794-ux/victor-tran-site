(() => {
  const dialog = document.querySelector('[data-mendenhall-dialog]');
  if (!dialog) return;

  const trigger = document.querySelector(`[aria-controls="${dialog.id}"]`);
  const closeButton = dialog.querySelector('.mendenhall-archive-close');
  const layout = dialog.querySelector('.mendenhall-archive-layout');
  const stage = dialog.querySelector('.mendenhall-archive-stage');
  const details = dialog.querySelector('.mendenhall-archive-details');
  const masters = [...dialog.querySelectorAll('[data-mendenhall-master]')];
  const viewButtons = [...dialog.querySelectorAll('[data-mendenhall-view]')];
  const deferredImages = [...dialog.querySelectorAll('img[data-src]')];
  const status = dialog.querySelector('.mendenhall-archive-status');
  const labels = {
    poster: 'Complete poster',
    sentence: 'Sentence specimen',
    alphabet: 'Alphabet specimen',
    sketches: 'Sketches and studies',
  };
  let returnFocus = null;

  if (!trigger || !closeButton || !layout || !stage || !details || masters.length !== 4 || viewButtons.length !== 4 || !status) return;

  function selectView(name, announce = true) {
    masters.forEach((image) => {
      const active = image.dataset.mendenhallMaster === name;
      image.hidden = !active;
      if (active && !image.src && image.dataset.src) image.src = image.dataset.src;
    });
    viewButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.mendenhallView === name));
    });
    if (announce) status.textContent = `${labels[name]} view selected.`;
  }

  trigger.addEventListener('click', (event) => {
    event.stopPropagation();
    returnFocus = trigger;
    deferredImages.forEach((image) => {
      if (!image.hasAttribute('src') && image.dataset.src) image.src = image.dataset.src;
    });
    selectView('poster');
    document.body.style.setProperty('--mendenhall-scrollbar', `${Math.max(0, window.innerWidth - document.documentElement.clientWidth)}px`);
    document.body.classList.add('mendenhall-archive-open');
    dialog.showModal();
    layout.scrollTop = 0;
    stage.scrollTop = 0;
    details.scrollTop = 0;
    closeButton.focus();
  });

  viewButtons.forEach((button) => {
    button.addEventListener('click', () => selectView(button.dataset.mendenhallView));
  });

  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const controls = [...dialog.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')]
      .filter((control) => !control.hidden && control.getClientRects().length);
    if (!controls.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('mendenhall-archive-open');
    document.body.style.removeProperty('--mendenhall-scrollbar');
    if (returnFocus?.isConnected) returnFocus.focus();
  });
})();
