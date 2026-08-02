(() => {
  const figure = document.querySelector('.patterns-hero-visual');
  const button = document.getElementById('patterns-motion-toggle');
  if (!figure || !button) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let manuallyPaused = false;

  const render = () => {
    const paused = manuallyPaused || reducedMotion.matches || document.hidden;
    figure.classList.toggle('is-paused', paused);
    button.setAttribute('aria-pressed', String(manuallyPaused));
    button.setAttribute('aria-label', manuallyPaused ? 'Resume historical deliverable presentation motion' : 'Pause historical deliverable presentation motion');
    button.textContent = manuallyPaused ? 'Play' : 'Pause';
  };

  button.addEventListener('click', () => {
    manuallyPaused = !manuallyPaused;
    render();
  });
  document.addEventListener('visibilitychange', render);
  reducedMotion.addEventListener?.('change', render);
  render();
})();
