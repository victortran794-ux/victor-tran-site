/*
Ask Vic chat shell.
Static preview mode only: this file loads local example JSON and renders it.
Future AI calls should go through a server-side endpoint, never browser JS.
*/

(function () {
  const EXAMPLES = {
    default: 'a2ui/examples/start-here.json',
    start: 'a2ui/examples/start-here.json',
    projects: 'a2ui/examples/recruiter.json',
    product: 'a2ui/examples/recruiter.json',
    ux: 'a2ui/examples/recruiter.json',
    ibm: 'a2ui/examples/recruiter.json',
    brand: 'a2ui/examples/brand-print.json',
    print: 'a2ui/examples/brand-print.json',
    visual: 'a2ui/examples/brand-print.json',
    art: 'a2ui/examples/illustration.json',
    illustration: 'a2ui/examples/illustration.json',
    gallery: 'a2ui/examples/illustration.json',
    about: 'a2ui/examples/about-vic.json',
    bio: 'a2ui/examples/about-vic.json',
    background: 'a2ui/examples/about-vic.json',
  };

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function ensureStylesheet(href) {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function pickExample(prompt) {
    const normalized = prompt.toLowerCase();
    if (normalized.includes('about') || normalized.includes('who') || normalized.includes('bio') || normalized.includes('background')) {
      return EXAMPLES.about;
    }
    if (normalized.includes('art') || normalized.includes('illustration') || normalized.includes('gallery')) {
      return EXAMPLES.illustration;
    }
    if (normalized.includes('brand') || normalized.includes('print') || normalized.includes('logo') || normalized.includes('visual')) {
      return EXAMPLES.brand;
    }
    if (normalized.includes('product') || normalized.includes('ux') || normalized.includes('ibm') || normalized.includes('app')) {
      return EXAMPLES.product;
    }
    return EXAMPLES.default;
  }

  function message(text, isUser) {
    const wrap = el('div', `ask-vic-message${isUser ? ' is-user' : ''}`);
    wrap.appendChild(el('p', 'ask-vic-bubble', text));
    return wrap;
  }

  function loadingMessage() {
    const wrap = el('div', 'ask-vic-message');
    const bubble = el('div', 'ask-vic-bubble ask-vic-loading');
    bubble.appendChild(el('span', '', 'Pulling up a route'));
    const dots = el('span', 'ask-vic-loading-dots');
    dots.append(el('span'), el('span'), el('span'));
    bubble.appendChild(dots);
    wrap.appendChild(bubble);
    return wrap;
  }

  function suggestion(label, prompt) {
    const button = el('button', 'ask-vic-chip', label);
    button.type = 'button';
    button.dataset.prompt = prompt;
    return button;
  }

  async function loadResponse(url, resultMount) {
    resultMount.replaceChildren(loadingMessage());

    try {
      const response = await fetch(url);
      const data = await response.json();
      resultMount.replaceChildren();
      window.GenerativeUI.render(data, resultMount);
      wireCursorHover(resultMount);
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      resultMount.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
    } catch {
      resultMount.replaceChildren(message('I could not load that view yet. Try one of the prompt chips for now.', false));
    }
  }

  function wireCursorHover(root) {
    const ring = document.querySelector('.cursor-ring');
    if (!ring) return;

    root.querySelectorAll('a, button, input').forEach(node => {
      node.addEventListener('mouseenter', () => ring.classList.add('cursor-ring--hover'));
      node.addEventListener('mouseleave', () => ring.classList.remove('cursor-ring--hover'));
    });
  }

  function initAskVic() {
    if (document.querySelector('.ask-vic-launcher')) return;
    if (!window.GenerativeUI) return;

    ensureStylesheet('css/generative-ui.css');
    ensureStylesheet('css/ask-vic.css');

    const launcher = el('button', 'ask-vic-launcher');
    launcher.type = 'button';
    launcher.setAttribute('aria-haspopup', 'dialog');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.innerHTML = '<span class="ask-vic-launcher-dot" aria-hidden="true"></span><span>Ask Vic</span>';

    const panel = el('section', 'ask-vic-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-label', 'Chat with Vic');
    panel.setAttribute('aria-hidden', 'true');

    const head = el('header', 'ask-vic-head');
    const titleGroup = el('div');
    titleGroup.appendChild(el('p', 'ask-vic-kicker', 'Curated portfolio guide'));
    titleGroup.appendChild(el('h2', 'ask-vic-title', 'Ask Vic'));
    const close = el('button', 'ask-vic-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close chat');
    head.append(titleGroup, close);

    const body = el('div', 'ask-vic-body');
    body.appendChild(message('Pick a thread or type a topic. I’ll pull up a curated route through the portfolio.', false));

    const suggestions = el('div', 'ask-vic-suggestions');
    suggestions.append(
      suggestion('Product work', 'Show me Victor’s product design work'),
      suggestion('Brand & print', 'Show me Victor’s brand and print work'),
      suggestion('Art route', 'Show me Victor’s art and illustration'),
      suggestion('About Vic', 'Who is Victor?')
    );
    body.appendChild(suggestions);

    const result = el('div', 'ask-vic-result');
    body.appendChild(result);

    const form = el('form', 'ask-vic-form');
    const input = el('input', 'ask-vic-input');
    input.type = 'text';
    input.name = 'prompt';
    input.placeholder = 'Try product, brand, art, or about';
    input.autocomplete = 'off';
    const submit = el('button', 'ask-vic-submit', 'Ask');
    submit.type = 'submit';
    form.append(input, submit);

    panel.append(head, body, form);
    document.body.append(launcher, panel);
    wireCursorHover(document.body);

    function openPanel() {
      panel.classList.add('is-open');
      panel.setAttribute('aria-hidden', 'false');
      launcher.setAttribute('aria-expanded', 'true');
      window.setTimeout(() => input.focus(), 50);
    }

    function closePanel() {
      panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true');
      launcher.setAttribute('aria-expanded', 'false');
      launcher.focus();
    }

    function submitPrompt(prompt) {
      const trimmed = prompt.trim();
      if (!trimmed) return;
      body.insertBefore(message(trimmed, true), result);
      input.value = '';
      loadResponse(pickExample(trimmed), result);
    }

    launcher.addEventListener('click', () => {
      if (panel.classList.contains('is-open')) closePanel();
      else openPanel();
    });

    close.addEventListener('click', closePanel);

    form.addEventListener('submit', event => {
      event.preventDefault();
      submitPrompt(input.value);
    });

    suggestions.addEventListener('click', event => {
      const button = event.target.closest('[data-prompt]');
      if (!button) return;
      submitPrompt(button.dataset.prompt);
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && panel.classList.contains('is-open')) closePanel();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAskVic);
  } else {
    initAskVic();
  }
})();
