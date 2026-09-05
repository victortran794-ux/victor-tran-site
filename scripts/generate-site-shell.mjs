#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

function fail(message) {
  throw new Error(message);
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseArgs(argv) {
  let root = process.cwd();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg !== '--root') fail(`unknown argument: ${arg}`);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) fail('--root requires a directory value');
    root = path.resolve(value);
    index += 1;
  }
  return { root };
}

function readJson(root, relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) fail(`missing ${relativePath}`);
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
}

function assertSafePage(rootReal, page) {
  if (path.basename(page) !== page || !page.endsWith('.html')) {
    fail(`unsafe site-shell page entry: ${page}`);
  }
  const absolutePath = path.join(rootReal, page);
  if (!fs.existsSync(absolutePath)) fail(`missing site-shell page: ${page}`);
  const realPath = fs.realpathSync(absolutePath);
  if (path.dirname(realPath) !== rootReal) fail(`site-shell page escapes root: ${page}`);
  return realPath;
}

function navItem(project, currentPage) {
  const active = project.url === currentPage;
  const attributes = [`href="${escapeHtml(project.entryUrl || project.url)}"`];
  if (active) attributes.push('class="active"', 'aria-current="page"');
  return `            <li><a ${attributes.join(' ')}>${escapeHtml(project.title)}</a></li>`;
}

function buildNavProjects(projects, currentPage) {
  const primary = projects.filter((project) => project.nav && project.type === 'primary');
  const galleries = projects.filter((project) => project.nav && project.type === 'gallery');
  const lines = primary.map((project) => navItem(project, currentPage));
  if (primary.length && galleries.length) {
    lines.push('            <li class="nav-dropdown-separator" aria-hidden="true"></li>');
  }
  lines.push(...galleries.map((project) => navItem(project, currentPage)));
  return lines.join('\n');
}

function buildHeader({ config, projects, currentPage, protectedPage }) {
  const isHome = currentPage === 'index.html';
  const isAbout = currentPage === 'about.html';
  const isProject = projects.some((project) => project.nav && project.url === currentPage);
  const workAttributes = [
    'type="button"',
    'class="nav-dropdown-toggle"',
    'aria-expanded="false"',
    'aria-controls="work-menu"',
  ];
  const aboutAttributes = ['href="about.html"'];
  if (isAbout) aboutAttributes.push('class="active"', 'aria-current="page"');
  const workClass = isHome || isProject ? 'nav-dropdown is-active' : 'nav-dropdown';
  const logoMarkup = `        <span class="nav-logo-victor">Victor</span>\n        <span class="nav-logo-tran">Tran</span>`;
  const status = protectedPage
    ? `\n  <p class="site-route-status"><span>${escapeHtml(config.protectedLabel)}</span><small>${escapeHtml(config.protectedDetail)}</small></p>`
    : '';

  return `  <!-- generated:site-shell-header:start -->
  <a class="skip-link" href="#main-content">${escapeHtml(config.skipLabel)}</a>
  <nav class="nav" aria-label="Primary">
    <div class="nav-inner">
      <a href="index.html" class="nav-logo" aria-label="Victor Tran home">
${logoMarkup}
      </a>
      <ul class="nav-links">
        <li class="${workClass}">
          <button ${workAttributes.join(' ')}>Work</button>
          <ul id="work-menu" class="nav-dropdown-menu">
            <!-- generated:projects-nav:start -->
${buildNavProjects(projects, currentPage)}
            <!-- generated:projects-nav:end -->
            <li class="nav-mobile-theme">
              <span class="nav-mobile-theme-label">Theme</span>
              <div class="nav-mobile-theme-controls" role="group" aria-label="Mobile viewing mode">
                <button class="lens-switcher-btn nav-mobile-lens-btn" data-lens="light" data-mobile-lens="light" aria-pressed="true" aria-label="Light mode">Light</button>
                <button class="lens-switcher-btn nav-mobile-lens-btn" data-lens="dark" data-mobile-lens="dark" aria-pressed="false" aria-label="Dark mode">Dark</button>
              </div>
            </li>
          </ul>
        </li>
        <li><a ${aboutAttributes.join(' ')}>About</a></li>
        <li><a href="mailto:${escapeHtml(config.contactEmail)}" class="nav-contact">Contact</a></li>
      </ul>
      <div class="lens-switcher" data-icon-treatment="filled" role="group" aria-label="Viewing mode">
        <span class="lens-switcher-rail" aria-hidden="true"></span>
        <button class="lens-switcher-btn" data-lens="light" aria-pressed="true" aria-label="Light mode">
          <span class="lens-switcher-icon" aria-hidden="true"><svg class="lens-switcher-filled-icon" viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="12" r="4.25"></circle><path d="M12 1.5l1.4 4h-2.8L12 1.5Zm0 21-1.4-4h2.8L12 22.5ZM1.5 12l4-1.4v2.8L1.5 12Zm21 0-4 1.4v-2.8L22.5 12ZM4.6 4.6l3.8 1.8-2 2-1.8-3.8Zm14.8 14.8-3.8-1.8 2-2 1.8 3.8ZM19.4 4.6l-1.8 3.8-2-2 3.8-1.8ZM4.6 19.4l1.8-3.8 2 2-3.8 1.8Z"></path></svg></span>
          <span class="control-tooltip" aria-hidden="true">Light mode</span>
        </button>
        <button class="lens-switcher-btn" data-lens="dark" aria-pressed="false" aria-label="Dark mode">
          <span class="lens-switcher-icon" aria-hidden="true"><svg class="lens-switcher-filled-icon" viewBox="0 0 24 24" focusable="false"><path d="M19.6 15.1A8.2 8.2 0 0 1 8.9 4.4a8.6 8.6 0 1 0 10.7 10.7Z"></path></svg></span>
          <span class="control-tooltip" aria-hidden="true">Dark mode</span>
        </button>
      </div>
    </div>
  </nav>${status}
  <!-- generated:site-shell-header:end -->`;
}

function buildProjectNav(projects, currentPage) {
  const primary = projects.filter((project) => project.nav && project.type === 'primary');
  const currentIndex = primary.findIndex((project) => project.url === currentPage);
  if (currentIndex === -1) return '';
  const current = primary[currentIndex];
  const previous = primary[(currentIndex - 1 + primary.length) % primary.length];
  const configuredNext = current.projectNavNext
    ? projects.find((project) => project.nav && project.slug === current.projectNavNext)
    : null;
  if (current.projectNavNext && !configuredNext) {
    fail(`${current.slug} projectNavNext does not resolve to a navigable project: ${current.projectNavNext}`);
  }
  const next = configuredNext || primary[(currentIndex + 1) % primary.length];
  const gallerySequence = next.type === 'gallery'
    ? projects.filter((project) => project.nav && project.type === 'gallery')
    : [];
  const galleryDescription = (gallery) => gallery.projectNavDescription || gallery.description || '';
  const nextMarkup = gallerySequence.length
    ? `    <section class="project-nav-gallery-panel" aria-label="Next galleries">
      <span class="project-nav-label">Next <span aria-hidden="true">&#x2192;</span></span>
      <a href="${escapeHtml(next.entryUrl || next.url)}" class="project-nav-gallery-primary" aria-label="Next gallery: ${escapeHtml(next.title)}"><span class="project-nav-title">${escapeHtml(next.title)}</span><small>${escapeHtml(galleryDescription(next))}</small></a>
      <div class="project-nav-gallery-links" aria-label="Gallery destinations">
${gallerySequence.filter((gallery) => gallery.slug !== next.slug).map((gallery, index) => `        <a href="${escapeHtml(gallery.entryUrl || gallery.url)}" class="project-nav-gallery-link" aria-label="Gallery ${index + 2}: ${escapeHtml(gallery.title)}"><span>${String(index + 2).padStart(2, '0')}</span><strong>${escapeHtml(gallery.title)}</strong><small>${escapeHtml(galleryDescription(gallery))}</small></a>`).join('\n')}
      </div>
    </section>`
    : `    <a href="${escapeHtml(next.entryUrl || next.url)}" class="project-nav-item project-nav-item--next" aria-label="Next project: ${escapeHtml(next.title)}">
      <span class="project-nav-label">Next <span aria-hidden="true">&#x2192;</span></span>
      <span class="project-nav-title">${escapeHtml(next.title)}</span>
    </a>`;
  return `  <!-- generated:project-nav:start -->
  <nav class="project-nav" aria-label="Project navigation">
    <a href="${escapeHtml(previous.entryUrl || previous.url)}" class="project-nav-item project-nav-item--prev" aria-label="Previous project: ${escapeHtml(previous.title)}">
      <span class="project-nav-label"><span aria-hidden="true">&#x2190;</span> Previous</span>
      <span class="project-nav-title">${escapeHtml(previous.title)}</span>
    </a>
${nextMarkup}
  </nav>
  <!-- generated:project-nav:end -->`;
}

function buildFooter(config, currentPage) {
  const footerClass = currentPage === 'index.html' ? 'footer reveal' : 'footer';
  const subtitle = config.footerSubtitle
    ? `\n      <p class="footer-subtitle">${escapeHtml(config.footerSubtitle)}</p>`
    : '';
  return `  <!-- generated:site-shell-footer:start -->
  <footer class="${footerClass}">
    <div class="footer-inner">
      <h2 class="footer-tagline">${escapeHtml(config.footerTagline)}</h2>${subtitle}
      <a href="mailto:${escapeHtml(config.contactEmail)}" class="footer-cta">${escapeHtml(config.footerCta)}</a>
      <div class="footer-bottom">
        <span class="footer-copyright">${escapeHtml(config.copyright)}</span>
        <nav class="footer-social" aria-label="Contact options">
          <ul>
            <li><a href="mailto:${escapeHtml(config.contactEmail)}" class="footer-email" aria-label="Email Victor Tran at ${escapeHtml(config.contactEmail)}"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 5h18v14H3z"></path><path d="m3 6 9 7 9-7"></path></svg><span>Email</span></a></li>
            <li><a href="${escapeHtml(config.resumeUrl)}" target="_blank" rel="noopener">Résumé</a></li>
            <li><a href="${escapeHtml(config.linkedInUrl)}" target="_blank" rel="noopener">LinkedIn</a></li>
          </ul>
        </nav>
      </div>
    </div>
  </footer>
  <!-- generated:site-shell-footer:end -->`;
}

function replaceOwnedBlock(html, name, block, page) {
  const startMarker = `<!-- generated:${name}:start -->`;
  const endMarker = `<!-- generated:${name}:end -->`;
  if (html.split(startMarker).length - 1 !== 1 || html.split(endMarker).length - 1 !== 1) {
    fail(`${page} needs exactly one fenced ${name} block`);
  }
  const markerPattern = new RegExp(
    `  <!-- generated:${name}:start -->[\\s\\S]*?  <!-- generated:${name}:end -->`,
  );
  if (!markerPattern.test(html)) fail(`${page} has malformed ${name} fences`);
  return html.replace(markerPattern, block);
}

function validateMainTarget(html, page) {
  const mainTags = [...html.matchAll(/<main\b[^>]*>/gi)].map((match) => match[0]);
  if (mainTags.length !== 1) fail(`${page} must have exactly one root main element`);
  const [tag] = mainTags;
  const id = (tag.match(/\bid="([^"]+)"/i) || [])[1];
  const tabindex = (tag.match(/\btabindex="([^"]+)"/i) || [])[1];
  if (id !== 'main-content' || tabindex !== '-1') {
    fail(`${page} main must already have id="main-content" and tabindex="-1"`);
  }
}

export function generateSiteShell(rootInput) {
  const rootReal = fs.realpathSync(rootInput);
  const config = readJson(rootReal, path.join('data', 'site-shell.json'));
  const manifest = readJson(rootReal, path.join('data', 'projects.json'));
  const policy = readJson(rootReal, path.join('data', 'content-export-policy.json'));
  if (config.version !== 1) fail('unsupported data/site-shell.json version');
  const pages = config.pages || [];
  if (!Array.isArray(pages) || !pages.length || new Set(pages).size !== pages.length) {
    fail('data/site-shell.json pages must be a non-empty unique list');
  }
  const projects = manifest.projects || [];
  const activeProtected = new Set(
    (policy.protectedPages || [])
      .filter((entry) => !entry.provisional)
      .map((entry) => entry.source),
  );
  let changed = 0;

  for (const page of pages) {
    const pagePath = assertSafePage(rootReal, page);
    const before = fs.readFileSync(pagePath, 'utf8');
    let output = replaceOwnedBlock(
      before,
      'site-shell-header',
      buildHeader({ config, projects, currentPage: page, protectedPage: activeProtected.has(page) }),
      page,
    );
    validateMainTarget(output, page);
    const projectNav = buildProjectNav(projects, page);
    if (projectNav) {
      output = replaceOwnedBlock(
        output,
        'project-nav',
        projectNav,
        page,
      );
    } else if (output.includes('generated:project-nav:')) {
      fail(`${page} must not contain generated project navigation`);
    }
    output = replaceOwnedBlock(
      output,
      'site-shell-footer',
      buildFooter(config, page),
      page,
    );
    if (output !== before) {
      fs.writeFileSync(pagePath, output);
      changed += 1;
    }
  }
  return { pages: pages.length, protected: activeProtected.size, changed };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    const { root } = parseArgs(process.argv.slice(2));
    const result = generateSiteShell(root);
    console.log(`Generated shared site shell for ${result.pages} pages; changed=${result.changed}; protected=${result.protected}.`);
  } catch (error) {
    console.error(`Shared site shell generation failed: ${error.message}`);
    process.exit(1);
  }
}
