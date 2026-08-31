#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const failures = [];
const expectedPages = [
  '404.html',
  'abilityexperience.html',
  'about.html',
  'artillustration.html',
  'document-processing.html',
  'graphicgallery.html',
  'ibm-patterns.html',
  'ibmcloud.html',
  'index.html',
  'pci.html',
  'pikappapp.html',
  'salmagazine.html',
  'uigallery.html',
  'wxo-canvas.html',
];
const expectedRootPages = [...expectedPages, 'wxo-access.html'].sort();
const projectNavigationSnapshot = {
  'wxo-canvas.html': ['pikappapp.html', 'ibmcloud.html'],
  'abilityexperience.html': ['pci.html', 'salmagazine.html'],
  'ibm-patterns.html': ['ibmcloud.html', 'pci.html'],
  'ibmcloud.html': ['wxo-canvas.html?lock=1', 'ibm-patterns.html'],
  'pci.html': ['ibm-patterns.html', 'abilityexperience.html'],
  'pikappapp.html': ['salmagazine.html', 'artillustration.html'],
  'salmagazine.html': ['abilityexperience.html', 'pikappapp.html'],
};

function fail(message) {
  failures.push(message);
}

function readJson(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`missing ${relativePath}`);
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    fail(`${relativePath} is not valid JSON: ${error.message}`);
    return {};
  }
}

function extractBlock(html, startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker);
  if (start === -1 || end === -1 || end < start) return '';
  return html.slice(start, end + endMarker.length);
}

function extractTag(html, pattern) {
  return (html.match(pattern) || [])[0] || '';
}

function count(haystack, needle) {
  return haystack.split(needle).length - 1;
}

const generatorPath = path.join(root, 'scripts', 'generate-site-shell.mjs');
const fixturePath = path.join(root, 'scripts', 'test-site-shell.mjs');
const config = readJson('data/site-shell.json');
const manifest = readJson('data/projects.json');
const policy = readJson('data/content-export-policy.json');
const sharedCssPath = path.join(root, 'css', 'style.css');

if (!fs.existsSync(generatorPath)) fail('missing scripts/generate-site-shell.mjs');
if (!fs.existsSync(fixturePath)) fail('missing scripts/test-site-shell.mjs');
if (!fs.existsSync(sharedCssPath)) {
  fail('missing css/style.css');
} else {
  const css = fs.readFileSync(sharedCssPath, 'utf8');
  const accessibilityBlock = extractBlock(
    css,
    '/* shared-shell:a11y:start */',
    '/* shared-shell:a11y:end */',
  );
  if (!accessibilityBlock) fail('css/style.css missing shared-shell accessibility markers');
  for (const required of [
    '.skip-link',
    '.skip-link:focus-visible',
    '.site-route-status',
    'main#main-content',
    '.nav-mobile-theme',
    '@media (max-width: 600px)',
    'min-height: 44px;',
  ]) {
    if (!accessibilityBlock.includes(required)) fail(`shared shell CSS contract missing ${required}`);
  }
  if (!css.includes('.footer-social ul')) fail('shared shell CSS needs semantic footer-list layout');
  if (/\.nav-links\s*>\s*li:nth-child\(3\)\s*\{[^}]*display:\s*none;/s.test(css)) {
    fail('mobile shared shell must keep the direct Contact navigation item visible');
  }
}

const actualPages = fs.readdirSync(root)
  .filter((name) => name.endsWith('.html'))
  .sort();
if (JSON.stringify(actualPages) !== JSON.stringify(expectedRootPages)) {
  fail(`root route set changed: expected ${expectedRootPages.join(', ')}, received ${actualPages.join(', ')}`);
}

const navProjects = (manifest.projects || []).filter((project) => project.nav);
const expectedNavUrls = navProjects.map((project) => project.entryUrl || project.url);
const policyEntries = policy.protectedPages || [];
const activeProtected = new Set(
  policyEntries.filter((entry) => !entry.provisional).map((entry) => entry.source),
);
const expectedProtected = new Set([
  'document-processing.html',
  'wxo-canvas.html',
]);
if (JSON.stringify([...activeProtected].sort()) !== JSON.stringify([...expectedProtected].sort())) {
  fail('active protected shell policy drifted from the two approved routes');
}

const expectedConfig = {
  version: 1,
  skipLabel: 'Skip to content',
  protectedLabel: 'Private case study',
  protectedDetail: 'Access required',
  contactEmail: 'victortran794@gmail.com',
  linkedInUrl: 'https://www.linkedin.com/in/victortrandesign/',
  footerTagline: 'Do more good things.',
  footerSubtitle: '',
  footerCta: "Let's chat.",
};
for (const [key, value] of Object.entries(expectedConfig)) {
  if (config[key] !== value) fail(`data/site-shell.json must set ${key} to ${JSON.stringify(value)}`);
}

for (const page of expectedPages) {
  const absolutePath = path.join(root, page);
  if (!fs.existsSync(absolutePath)) {
    fail(`missing root page ${page}`);
    continue;
  }
  const html = fs.readFileSync(absolutePath, 'utf8');
  const headerBlock = extractBlock(
    html,
    '<!-- generated:site-shell-header:start -->',
    '<!-- generated:site-shell-header:end -->',
  );
  const footerBlock = extractBlock(
    html,
    '<!-- generated:site-shell-footer:start -->',
    '<!-- generated:site-shell-footer:end -->',
  );

  if (!headerBlock) fail(`${page} missing exact generated site-shell header markers`);
  if (!footerBlock) fail(`${page} missing exact generated site-shell footer markers`);
  if (count(html, 'class="skip-link"') !== 1) fail(`${page} must contain exactly one skip link`);
  if (!html.includes('<a class="skip-link" href="#main-content">Skip to content</a>')) {
    fail(`${page} skip link must target #main-content with the fixed label`);
  }

  const mainTag = extractTag(html, /<main\b[^>]*>/i);
  if (!mainTag || !/\bid="main-content"/.test(mainTag) || !/\btabindex="-1"/.test(mainTag)) {
    fail(`${page} root main must have id="main-content" and tabindex="-1"`);
  }

  const nav = extractTag(html, /<nav class="nav"[\s\S]*?<\/nav>/i);
  if (!nav.includes('aria-label="Primary"')) fail(`${page} primary nav needs an accessible label`);
  if (!nav.includes('aria-controls="work-menu"')) fail(`${page} Work disclosure must control #work-menu`);
  if (nav.includes('role="menu"') || nav.includes('role="menuitem"')) {
    fail(`${page} Work disclosure must use native navigation-list semantics`);
  }
  if (!nav.includes('class="nav-mobile-theme"') || count(nav, 'data-mobile-lens=') !== 2) {
    fail(`${page} Work disclosure must preserve mobile Light and Dark controls`);
  }
  if (!nav.includes(`href="mailto:${config.contactEmail}" class="nav-contact">Contact</a>`)) {
    fail(`${page} primary navigation must preserve direct Contact access`);
  }
  const dropdown = extractTag(nav, /<ul id="work-menu" class="nav-dropdown-menu"[\s\S]*?<\/ul>/i);
  const actualNavUrls = [...dropdown.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map((match) => match[1]);
  if (JSON.stringify(actualNavUrls) !== JSON.stringify(expectedNavUrls)) {
    fail(`${page} Work menu membership or order drifted from data/projects.json`);
  }

  const project = navProjects.find((item) => item.url === page);
  if (project) {
    const escapedUrl = (project.entryUrl || project.url).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const activePattern = new RegExp(`<a\\b(?=[^>]*href="${escapedUrl}")(?=[^>]*aria-current="page")[^>]*>`);
    if (!activePattern.test(nav)) fail(`${page} current Work link needs aria-current="page"`);
  } else if (page === 'about.html') {
    if (!/<a\b(?=[^>]*href="about\.html")(?=[^>]*aria-current="page")[^>]*>/.test(nav)) {
      fail('about.html current link needs aria-current="page"');
    }
  } else if (page === 'index.html') {
    if (nav.includes('aria-current="page"')) fail('index.html must not claim a Work route as the current page');
  } else if (nav.includes('aria-current="page"')) {
    fail(`${page} must not claim an unrelated current navigation item`);
  }

  if (nav.includes('data-lens="dna"') || nav.includes('dna-trigger')) {
    fail(`${page} shared viewing-mode switcher must contain only Light and Dark`);
  }
  if (count(nav, 'data-icon-treatment="filled"') !== 1) fail(`${page} desktop switcher must declare one filled icon treatment`);
  if (count(nav, 'class="lens-switcher-filled-icon"') !== 2) fail(`${page} desktop switcher must contain two filled SVG icons`);
  if (count(nav, 'class="lens-switcher-rail"') !== 1) fail(`${page} desktop switcher must contain one refined visual rail`);
  if (/&#x25D0;|&#x25CB;/.test(nav)) fail(`${page} retained retired outlined theme glyphs`);

  const protectedStatus = '<p class="site-route-status"><span>Private case study</span><small>Access required</small></p>';
  if (activeProtected.has(page)) {
    if (!headerBlock.includes(protectedStatus)) fail(`${page} missing fixed protected route status`);
    if (html.includes('src="js/password-gate.js"') || html.includes("sessionStorage.getItem('vtd-unlock')")) {
      fail(`${page} retained retired client-side authorization logic`);
    }
    if (!/<meta\s+name="robots"\s+content="noindex,nofollow(?:,[^"]*)?">/i.test(html)) {
      fail(`${page} lost noindex,nofollow`);
    }
  } else if (headerBlock.includes('site-route-status')) {
    fail(`${page} must not receive a protected route status`);
  }

  if (!footerBlock.includes('class="footer-cta">Let&#39;s chat.</a>')) fail(`${page} footer lost the casual primary invitation`);
  if (!footerBlock.includes('<h2 class="footer-tagline">')) fail(`${page} footer needs a local heading`);
  if (!footerBlock.includes('<nav class="footer-social" aria-label="Contact options">')) {
    fail(`${page} footer contact actions need semantic navigation`);
  }
  if (!footerBlock.includes('class="footer-email"') || !footerBlock.includes('<svg viewBox="0 0 24 24"')) {
    fail(`${page} footer lost its direct icon-supported email action`);
  }
  if (footerBlock.includes('data-copy-email') || footerBlock.includes('data-copy-email-status') || footerBlock.includes('>Copy email<')) {
    fail(`${page} footer must not regenerate retired copy-email behavior`);
  }
  if (!footerBlock.includes('href="https://www.linkedin.com/in/victortrandesign/"')) fail(`${page} footer lost LinkedIn action`);

  if (projectNavigationSnapshot[page]) {
    const projectNav = extractTag(html, /<nav class="project-nav"[\s\S]*?<\/nav>/i);
    if (!html.includes('<!-- generated:project-nav:start -->') || !html.includes('<!-- generated:project-nav:end -->')) {
      fail(`${page} project navigation must be generator-owned`);
    }
    if (!projectNav.includes('aria-label="Previous project:') || !projectNav.includes('aria-label="Next project:')) {
      fail(`${page} project navigation links need directional accessible names`);
    }
    const actualProjectLinks = [...projectNav.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
    if (JSON.stringify(actualProjectLinks) !== JSON.stringify(projectNavigationSnapshot[page])) {
      fail(`${page} project navigation destinations changed during the shell-only gate`);
    }
  } else if (html.includes('generated:project-nav:') || /<nav class="project-nav"/.test(html)) {
    fail(`${page} must not receive primary project navigation`);
  }
}

const mainJs = fs.readFileSync(path.join(root, 'js', 'main.js'), 'utf8');
for (const marker of ['ArrowDown', 'ArrowUp', "case 'Home'", "case 'End'"]) {
  if (!mainJs.includes(marker)) fail(`Work disclosure keyboard behavior missing marker: ${marker}`);
}

if (failures.length) {
  console.error('SHARED SITE SHELL CONTRACT: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`SHARED SITE SHELL CONTRACT: PASS pages=${expectedPages.length} protected=${activeProtected.size}`);
