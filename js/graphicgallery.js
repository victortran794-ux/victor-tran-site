(() => {
  const picker = document.querySelector('[data-mendenhall-picker]');
  if (!picker) return;

  const buttons = [...picker.querySelectorAll('[data-mendenhall-target]')];
  const views = [...document.querySelectorAll('[data-mendenhall-view]')];

  const show = (name) => {
    buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.mendenhallTarget === name)));
    views.forEach((view) => {
      const active = view.dataset.mendenhallView === name;
      view.hidden = !active;
      view.classList.toggle('is-active', active);
    });
  };

  picker.addEventListener('click', (event) => {
    const button = event.target.closest('[data-mendenhall-target]');
    if (button) show(button.dataset.mendenhallTarget);
  });
})();
