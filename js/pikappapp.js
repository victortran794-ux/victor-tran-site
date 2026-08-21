(() => {
  const phoneStory = document.querySelector('[data-phone-story]');
  if (!phoneStory) return;

  const phoneSlides = [...phoneStory.querySelectorAll('.phone-slide')];
  const phoneTitle = document.getElementById('phone-story-title');
  const phoneDescription = document.getElementById('phone-story-description');
  const phoneCount = document.getElementById('phone-story-count');
  const previousButton = document.getElementById('phone-prev');
  const nextButton = document.getElementById('phone-next');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const interval = 5200;
  let phoneIndex = 0;
  let phoneTimer = 0;

  function setPhone(index, direction = 1, animate = true) {
    phoneIndex = (index + phoneSlides.length) % phoneSlides.length;
    phoneSlides.forEach((slide, slideIndex) => {
      const active = slideIndex === phoneIndex;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
    });

    const current = phoneSlides[phoneIndex];
    phoneTitle.textContent = current.dataset.title;
    phoneDescription.textContent = current.dataset.description;
    phoneCount.textContent = `${phoneIndex + 1} / ${phoneSlides.length}`;

    phoneStory.dataset.direction = direction < 0 ? 'previous' : 'next';
    phoneStory.classList.remove('is-advancing');
    if (animate && !reducedMotion.matches) {
      void phoneStory.offsetWidth;
      phoneStory.classList.add('is-advancing');
    }
  }

  function stopPhoneAuto() {
    if (!phoneTimer) return;
    clearInterval(phoneTimer);
    phoneTimer = 0;
  }

  function restartPhoneAuto() {
    stopPhoneAuto();
    const interacting = phoneStory.matches(':hover') || phoneStory.contains(document.activeElement);
    if (!reducedMotion.matches && !document.hidden && !interacting) {
      phoneTimer = window.setInterval(() => setPhone(phoneIndex + 1, 1), interval);
    }
  }

  previousButton.addEventListener('click', () => {
    setPhone(phoneIndex - 1, -1);
    restartPhoneAuto();
  });
  nextButton.addEventListener('click', () => {
    setPhone(phoneIndex + 1, 1);
    restartPhoneAuto();
  });
  phoneStory.addEventListener('mouseenter', stopPhoneAuto);
  phoneStory.addEventListener('mouseleave', restartPhoneAuto);
  phoneStory.addEventListener('focusin', stopPhoneAuto);
  phoneStory.addEventListener('focusout', (event) => {
    if (!phoneStory.contains(event.relatedTarget)) restartPhoneAuto();
  });
  reducedMotion.addEventListener('change', restartPhoneAuto);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopPhoneAuto();
    else restartPhoneAuto();
  });

  setPhone(0, 1, false);
  restartPhoneAuto();
})();

(() => {
  const dialog = document.querySelector('[data-archive-dialog]');
  if (!dialog) return;

  const trigger = document.querySelector(`[aria-controls="${dialog.id}"]`);
  const closeButton = dialog.querySelector('.archive-close');
  const layout = dialog.querySelector('.archive-layout');
  const stage = dialog.querySelector('.archive-stage');
  const masters = [...dialog.querySelectorAll('[data-archive-master]')];
  const viewButtons = [...dialog.querySelectorAll('[data-archive-view]')];
  const thumbnails = [...dialog.querySelectorAll('.archive-view img[data-src]')];
  const status = dialog.querySelector('.archive-status');
  const labels = {
    cover: 'Cover',
    creighton: 'Creighton opener',
    timeline: 'Expansion timeline',
    support: 'Post-expansion support',
    statistics: 'National statistics',
    map: 'Regional map',
    event: 'Event application',
    context: 'Context',
  };
  let returnFocus = null;

  if (!trigger || !closeButton || !layout || !stage || !masters.length || !viewButtons.length || !status) return;

  function selectView(name, announce = true) {
    masters.forEach((image) => {
      const active = image.dataset.archiveMaster === name;
      image.hidden = !active;
      if (active && !image.src && image.dataset.src) image.src = image.dataset.src;
    });
    viewButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.archiveView === name));
    });
    if (announce) status.textContent = `${labels[name]} view selected.`;
  }

  trigger.addEventListener('click', () => {
    returnFocus = trigger;
    thumbnails.forEach((thumbnail) => {
      if (!thumbnail.hasAttribute('src') && thumbnail.dataset.src) thumbnail.src = thumbnail.dataset.src;
    });
    selectView('cover');
    const scrollbar = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    document.body.style.setProperty('--archive-scrollbar', `${scrollbar}px`);
    document.body.classList.add('archive-open');
    dialog.showModal();
    layout.scrollTop = 0;
    stage.scrollTop = 0;
    dialog.querySelector('.archive-details').scrollTop = 0;
    closeButton.focus();
  });

  viewButtons.forEach((button) => {
    button.addEventListener('click', () => selectView(button.dataset.archiveView));
  });

  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const controls = [...dialog.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
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

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && dialog.open) dialog.close();
  });

  dialog.addEventListener('close', () => {
    document.body.classList.remove('archive-open');
    document.body.style.removeProperty('--archive-scrollbar');
    if (returnFocus?.isConnected) returnFocus.focus();
  });
})();

(() => {
  const dialog = document.querySelector('[data-prototype-dialog]');
  const trigger = document.querySelector('[data-prototype-open]');
  if (!dialog || !trigger) return;

  const closeButton = dialog.querySelector('.prototype-dialog__close');
  const frame = dialog.querySelector('[data-prototype-dialog-frame]');
  let returnFocus = null;
  if (!closeButton || !frame) return;

  function closeDialog() {
    if (dialog.open) dialog.close();
  }

  trigger.addEventListener('click', () => {
    returnFocus = trigger;
    if (!frame.src && frame.dataset.src) frame.src = frame.dataset.src;
    const scrollbar = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    document.body.style.setProperty('--prototype-scrollbar', `${scrollbar}px`);
    document.body.classList.add('prototype-open');
    dialog.showModal();
    closeButton.focus();
  });

  closeButton.addEventListener('click', closeDialog);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeDialog();
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const controls = [...dialog.querySelectorAll('button:not([disabled]), [href], iframe, [tabindex]:not([tabindex="-1"])')]
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
  dialog.addEventListener('close', () => {
    document.body.classList.remove('prototype-open');
    document.body.style.removeProperty('--prototype-scrollbar');
    if (returnFocus?.isConnected) returnFocus.focus();
  });
})();
