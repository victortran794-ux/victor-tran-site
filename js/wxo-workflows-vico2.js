(() => {
  document.querySelectorAll('[data-doc-motion-toggle]').forEach((button) => {
    const video = document.getElementById(button.getAttribute('aria-controls'));
    if (!video) return;

    const syncMotionControl = () => {
      const paused = video.paused;
      button.textContent = paused ? 'Play animation' : 'Pause animation';
      button.setAttribute('aria-pressed', paused ? 'true' : 'false');
    };

    button.addEventListener('click', async () => {
      if (video.paused) {
        try {
          await video.play();
        } catch {
          // Keep the control in its actual paused state if playback is blocked.
        }
      } else {
        video.pause();
      }
      syncMotionControl();
    });

    video.addEventListener('play', syncMotionControl);
    video.addEventListener('pause', syncMotionControl);
    syncMotionControl();
  });
})();
