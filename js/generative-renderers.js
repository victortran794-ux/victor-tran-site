/*
Generative UI renderer.
Do not render raw HTML from model output.
Only render known component types defined in a2ui/catalog.json.
*/

(function () {
  const ALLOWED_TYPES = new Set([
    'PortfolioIntro',
    'ProjectCardGrid',
    'CaseStudyTimeline',
    'ProjectComparison',
    'ImageGallery',
    'RecommendedPath',
    'ContactCTA',
  ]);

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function appendText(parent, tag, className, text) {
    if (!text) return null;
    const node = el(tag, className, text);
    parent.appendChild(node);
    return node;
  }

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function normalizeHref(href) {
    if (!href) return '#';
    const value = String(href).trim();
    if (
      value.startsWith('/') ||
      value.startsWith('#') ||
      value.startsWith('mailto:') ||
      value.startsWith('https://www.linkedin.com/')
    ) {
      return value;
    }
    return '#';
  }

  function link(label, href, className) {
    const node = el('a', className || 'gui-link', label || 'View');
    node.href = normalizeHref(href);
    if (node.href.startsWith('https://')) {
      node.target = '_blank';
      node.rel = 'noopener';
    }
    return node;
  }

  function renderPortfolioIntro(component) {
    const section = el('section', 'gui-block gui-intro');
    appendText(section, 'p', 'gui-kicker', 'Portfolio');
    appendText(section, 'h2', 'gui-title', component.headline);
    appendText(section, 'p', 'gui-copy', component.body);

    const links = safeArray(component.links);
    if (links.length) {
      const actions = el('div', 'gui-actions');
      links.slice(0, 3).forEach(item => actions.appendChild(link(item.label, item.href, 'gui-button')));
      section.appendChild(actions);
    }

    return section;
  }

  function renderProjectCardGrid(component) {
    const section = el('section', 'gui-block');
    appendText(section, 'h2', 'gui-title', component.title);

    const grid = el('div', 'gui-project-grid');
    safeArray(component.items).slice(0, 6).forEach(item => {
      const card = link('', item.url, `gui-project-card${item.highlight ? ' is-highlighted' : ''}`);

      if (item.image) {
        const image = el('img', 'gui-project-img');
        image.src = item.image;
        image.alt = item.title || '';
        image.loading = 'lazy';
        card.appendChild(image);
      }

      const body = el('div', 'gui-project-body');
      appendText(body, 'p', 'gui-kicker', item.category);
      appendText(body, 'h3', 'gui-card-title', item.title);
      appendText(body, 'p', 'gui-card-copy', item.description);
      appendText(body, 'span', 'gui-card-link', 'Explore');
      card.appendChild(body);
      grid.appendChild(card);
    });

    section.appendChild(grid);
    return section;
  }

  function renderCaseStudyTimeline(component) {
    const section = el('section', 'gui-block');
    appendText(section, 'h2', 'gui-title', component.title);

    const list = el('ol', 'gui-timeline');
    safeArray(component.items).slice(0, 7).forEach(item => {
      const row = el('li', 'gui-timeline-item');
      appendText(row, 'span', 'gui-kicker', item.label);
      appendText(row, 'h3', 'gui-card-title', item.title);
      appendText(row, 'p', 'gui-card-copy', item.body);
      if (item.url) row.appendChild(link('View project', item.url, 'gui-text-link'));
      list.appendChild(row);
    });

    section.appendChild(list);
    return section;
  }

  function renderProjectComparison(component) {
    const section = el('section', 'gui-block');
    appendText(section, 'h2', 'gui-title', component.title);

    const grid = el('div', 'gui-comparison');
    safeArray(component.columns).slice(0, 3).forEach(item => {
      const card = el('article', 'gui-comparison-card');
      appendText(card, 'p', 'gui-kicker', item.category);
      appendText(card, 'h3', 'gui-card-title', item.title);
      appendText(card, 'p', 'gui-card-copy', item.summary);

      const strengths = safeArray(item.strengths);
      if (strengths.length) {
        const list = el('ul', 'gui-list');
        strengths.slice(0, 4).forEach(strength => list.appendChild(el('li', '', strength)));
        card.appendChild(list);
      }

      card.appendChild(link('View project', item.url, 'gui-text-link'));
      grid.appendChild(card);
    });

    section.appendChild(grid);
    return section;
  }

  function renderImageGallery(component) {
    const section = el('section', 'gui-block');
    appendText(section, 'h2', 'gui-title', component.title);

    const grid = el('div', 'gui-image-grid');
    safeArray(component.items).slice(0, 9).forEach(item => {
      const figure = el('figure', 'gui-image-figure');
      const image = el('img', 'gui-gallery-img');
      image.src = item.src;
      image.alt = item.alt || '';
      image.loading = 'lazy';
      figure.appendChild(image);
      appendText(figure, 'figcaption', 'gui-caption', item.caption || item.alt);
      grid.appendChild(figure);
    });

    section.appendChild(grid);
    return section;
  }

  function renderRecommendedPath(component) {
    const section = el('section', 'gui-block');
    appendText(section, 'h2', 'gui-title', component.title);

    const list = el('ol', 'gui-path');
    safeArray(component.steps).slice(0, 5).forEach((item, index) => {
      const row = el('li', 'gui-path-step');
      appendText(row, 'span', 'gui-step-num', String(index + 1).padStart(2, '0'));
      const body = el('div', 'gui-path-body');
      appendText(body, 'h3', 'gui-card-title', item.title);
      appendText(body, 'p', 'gui-card-copy', item.reason);
      body.appendChild(link('Open', item.url, 'gui-text-link'));
      row.appendChild(body);
      list.appendChild(row);
    });

    section.appendChild(list);
    return section;
  }

  function renderContactCTA(component) {
    const section = el('section', 'gui-block gui-cta');
    appendText(section, 'h2', 'gui-title', component.headline);
    appendText(section, 'p', 'gui-copy', component.body);
    section.appendChild(link(component.label, component.href, 'gui-button'));
    return section;
  }

  const RENDERERS = {
    PortfolioIntro: renderPortfolioIntro,
    ProjectCardGrid: renderProjectCardGrid,
    CaseStudyTimeline: renderCaseStudyTimeline,
    ProjectComparison: renderProjectComparison,
    ImageGallery: renderImageGallery,
    RecommendedPath: renderRecommendedPath,
    ContactCTA: renderContactCTA,
  };

  function renderGenerativeUI(response, mount) {
    if (!mount) return;
    mount.replaceChildren();

    if (!response || response.version !== '0.1' || !Array.isArray(response.components)) {
      mount.appendChild(el('p', 'gui-error', 'This response could not be rendered.'));
      return;
    }

    const shell = el('div', 'gui-shell');
    appendText(shell, 'p', 'gui-kicker', 'Generated UI preview');
    appendText(shell, 'h1', 'gui-page-title', response.title);
    appendText(shell, 'p', 'gui-page-intro', response.intro);

    response.components.slice(0, 4).forEach(component => {
      if (!component || !ALLOWED_TYPES.has(component.type)) return;
      const renderer = RENDERERS[component.type];
      shell.appendChild(renderer(component));
    });

    mount.appendChild(shell);
  }

  window.GenerativeUI = {
    render: renderGenerativeUI,
  };
})();
