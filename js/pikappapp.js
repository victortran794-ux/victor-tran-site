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

  function setPhone(index) {
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
      phoneTimer = window.setInterval(() => setPhone(phoneIndex + 1), interval);
    }
  }

  previousButton.addEventListener('click', () => {
    setPhone(phoneIndex - 1);
    restartPhoneAuto();
  });
  nextButton.addEventListener('click', () => {
    setPhone(phoneIndex + 1);
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

  setPhone(0);
  restartPhoneAuto();
})();
