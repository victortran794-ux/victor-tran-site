(() => {
  const supportedTargets = new Set(['canvas-system', 'document-processing']);

  const resolveTarget = () => {
    if (!window.location.hash) return null;

    let id;
    try {
      id = decodeURIComponent(window.location.hash.slice(1));
    } catch {
      return null;
    }

    if (!supportedTargets.has(id)) return null;
    const target = document.getElementById(id);
    if (!target && id === 'document-processing' && /\/wxo-canvas(?:\.html)?$/i.test(window.location.pathname)) {
      window.location.replace('document-processing.html');
      return null;
    }
    return target;
  };

  const alignTarget = () => {
    const target = resolveTarget();
    if (!target) return;
    target.scrollIntoView({ block: 'start', behavior: 'instant' });
  };

  requestAnimationFrame(alignTarget);
  window.addEventListener('hashchange', alignTarget);

  const images = [...document.querySelectorAll('.pilot-main img')];
  Promise.allSettled(images.map((image) => image.decode())).then(alignTarget);
})();

(() => {
  const images = [...document.querySelectorAll('[data-wxo-theme-image]')];
  if (!images.length) return;

  const syncThemeImages = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    images.forEach((image) => {
      const nextSource = isDark ? image.dataset.themeDarkSrc : image.dataset.themeLightSrc;
      if (!nextSource || image.dataset.wxoThemeSource === nextSource) return;
      image.src = nextSource;
      image.dataset.wxoThemeSource = nextSource;
    });
  };

  syncThemeImages();
  new MutationObserver(syncThemeImages).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();

(() => {
  const dialog = document.querySelector('[data-wxo-gallery]');
  const triggers = [...document.querySelectorAll('[data-wxo-evidence]')];
  if (!dialog || !triggers.length) return;

  const image = dialog.querySelector('[data-wxo-gallery-image]');
  const title = dialog.querySelector('[data-wxo-gallery-title]');
  const caption = dialog.querySelector('[data-wxo-gallery-caption]');
  const count = dialog.querySelector('[data-wxo-gallery-count]');
  const status = dialog.querySelector('[data-wxo-gallery-status]');
  const closeButton = dialog.querySelector('.pilot-gallery-close');
  const fullSizeButton = dialog.querySelector('[data-wxo-gallery-fullscreen]');
  const previousButton = dialog.querySelector('[data-wxo-gallery-prev]');
  const nextButton = dialog.querySelector('[data-wxo-gallery-next]');
  let activeIndex = 0;
  let returnFocus = null;

  const itemAt = (index) => {
    const trigger = triggers[(index + triggers.length) % triggers.length];
    const source = trigger.querySelector('img');
    return {
      trigger,
      source,
      title: trigger.dataset.title || source.alt,
      caption: trigger.dataset.caption || '',
    };
  };

  const render = (index, announce = true) => {
    activeIndex = (index + triggers.length) % triggers.length;
    const item = itemAt(activeIndex);
    image.src = item.source.currentSrc || item.source.src;
    image.alt = item.source.alt;
    image.width = item.source.naturalWidth || Number(item.source.width);
    image.height = item.source.naturalHeight || Number(item.source.height);
    title.textContent = item.title;
    caption.textContent = item.caption;
    count.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(triggers.length).padStart(2, '0')}`;
    if (announce) status.textContent = `${item.title}, image ${activeIndex + 1} of ${triggers.length}.`;
  };

  const open = (index) => {
    activeIndex = index;
    returnFocus = triggers[index];
    render(index, false);
    const scrollbar = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    document.body.style.setProperty('--wxo-gallery-scrollbar', `${scrollbar}px`);
    document.body.classList.add('wxo-gallery-open');
    dialog.showModal();
    dialog.dataset.wxoGalleryZoom = 'fit';
    fullSizeButton.setAttribute('aria-pressed', 'false');
    fullSizeButton.textContent = 'Full size';
    closeButton.focus();
  };

  triggers.forEach((trigger, index) => {
    const source = trigger.querySelector('img');
    if (!trigger.hasAttribute('aria-label')) trigger.setAttribute('aria-label', `Open ${trigger.dataset.title || source.alt} in image viewer`);
    trigger.addEventListener('click', () => open(index));
  });

  previousButton.addEventListener('click', () => render(activeIndex - 1));
  nextButton.addEventListener('click', () => render(activeIndex + 1));
  fullSizeButton.addEventListener('click', () => {
    const fullSize = dialog.dataset.wxoGalleryZoom !== 'full';
    dialog.dataset.wxoGalleryZoom = fullSize ? 'full' : 'fit';
    fullSizeButton.setAttribute('aria-pressed', String(fullSize));
    fullSizeButton.textContent = fullSize ? 'Fit image' : 'Full size';
    status.textContent = fullSize ? 'Full-size inspection enabled.' : 'Image fitted to the viewer.';
  });
  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      render(activeIndex - 1);
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      render(activeIndex + 1);
      return;
    }
    if (event.key !== 'Tab') return;

    const controls = [...dialog.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')]
      .filter((control) => control.getClientRects().length);
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
    document.body.classList.remove('wxo-gallery-open');
    document.body.style.removeProperty('--wxo-gallery-scrollbar');
    image.removeAttribute('src');
    delete dialog.dataset.wxoGalleryZoom;
    if (returnFocus?.isConnected) returnFocus.focus();
  });
})();
