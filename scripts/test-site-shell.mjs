#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { generateSiteShell } from './generate-site-shell.mjs';

const scriptPath = fileURLToPath(new URL('./generate-site-shell.mjs', import.meta.url));
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'vtd-site-shell-'));
const dataDir = path.join(tempRoot, 'data');
fs.mkdirSync(dataDir, { recursive: true });

const pages = ['index.html', 'public.html', 'protected.html', 'about.html'];
const shellConfig = {
  version: 1,
  pages,
  skipLabel: 'Skip to content',
  protectedLabel: 'Private case study',
  protectedDetail: 'Access required',
  contactEmail: 'victortran794@gmail.com',
  linkedInUrl: 'https://www.linkedin.com/in/victortrandesign/',
  resumeUrl: 'documents/Victor-Tran-Resume.pdf',
  footerTagline: 'Do more good things.',
  footerSubtitle: '',
  footerCta: "Let's chat.",
  copyright: '© Victor Tran 2026 All Rights Reserved',
};
const projects = {
  projects: [
    { slug: 'public', title: 'Public project', url: 'public.html', type: 'primary', nav: true, projectNavNext: 'gallery' },
    { slug: 'protected', title: 'Protected project', url: 'protected.html', type: 'primary', nav: true },
    { slug: 'gallery', title: 'Gallery project', url: 'gallery.html', type: 'gallery', nav: true, projectNavDescription: 'First gallery description' },
    { slug: 'gallery-two', title: 'Second gallery', url: 'gallery-two.html', type: 'gallery', nav: true, projectNavDescription: 'Second gallery description' },
    { slug: 'gallery-three', title: 'Third gallery', url: 'gallery-three.html', type: 'gallery', nav: true, projectNavDescription: 'Third gallery description' },
  ],
};
const policy = {
  version: 1,
  protectedPages: [
    { source: 'protected.html', slug: 'protected' },
    { source: 'future.html', slug: 'future', provisional: true },
  ],
};

function writeJson(name, value) {
  fs.writeFileSync(path.join(dataDir, name), `${JSON.stringify(value, null, 2)}\n`);
}

function template(page) {
  const protectedHead = page === 'protected.html'
    ? '  <meta name="robots" content="noindex,nofollow">\n  <script src="js/password-gate.js" defer></script>\n'
    : '';
  const projectNav = ['public.html', 'protected.html'].includes(page)
    ? '  <!-- generated:project-nav:start -->\n  <nav class="project-nav" aria-label="Project navigation"><a href="public.html">Previous</a><a href="protected.html">Next</a></nav>\n  <!-- generated:project-nav:end -->\n'
    : '';
  return `<!doctype html>
<html lang="en">
<head>
${protectedHead}</head>
<body>
  <div class="cursor-dot" aria-hidden="true"></div>
  <!-- generated:site-shell-header:start -->
  <nav class="nav"><div class="nav-inner">legacy nav</div></nav>
  <!-- generated:site-shell-header:end -->
  <main class="page-content" id="main-content" tabindex="-1"><p data-fixture-body="${page}">Body remains exact.</p></main>
${projectNav}
  <!-- generated:site-shell-footer:start -->
  <footer class="footer"><p>Legacy footer</p></footer>
  <!-- generated:site-shell-footer:end -->
  <script src="js/main.js"></script>
</body>
</html>
`;
}

function treeDigest() {
  const hash = crypto.createHash('sha256');
  for (const page of pages) hash.update(page).update(fs.readFileSync(path.join(tempRoot, page)));
  return hash.digest('hex');
}

function count(text, needle) {
  return text.split(needle).length - 1;
}

try {
  writeJson('site-shell.json', shellConfig);
  writeJson('projects.json', projects);
  writeJson('content-export-policy.json', policy);
  for (const page of pages) fs.writeFileSync(path.join(tempRoot, page), template(page));

  const first = generateSiteShell(tempRoot);
  assert.deepEqual(first, { pages: 4, protected: 1, changed: 4 });
  const firstDigest = treeDigest();
  const second = generateSiteShell(tempRoot);
  assert.deepEqual(second, { pages: 4, protected: 1, changed: 0 });
  assert.equal(treeDigest(), firstDigest, 'second generation must be byte-identical');

  for (const page of pages) {
    const html = fs.readFileSync(path.join(tempRoot, page), 'utf8');
    assert.match(html, /<!-- generated:site-shell-header:start -->/);
    assert.match(html, /<!-- generated:site-shell-footer:start -->/);
    assert.match(html, /<a class="skip-link" href="#main-content">Skip to content<\/a>/);
    assert.match(html, /<main class="page-content" id="main-content" tabindex="-1">/);
    assert.match(html, new RegExp(`data-fixture-body="${page}"`));
    assert.equal(count(html, 'class="site-route-status"'), page === 'protected.html' ? 1 : 0);
    assert.equal(count(html, 'data-lens="dna"'), 0, 'the shared viewing-mode switcher must contain only Light and Dark');
    assert.match(html, /aria-controls="work-menu"/);
    assert.match(html, /id="work-menu" class="nav-dropdown-menu"/);
    assert.doesNotMatch(html, /role="menu(?:item)?"/);
    assert.equal(count(html, 'data-mobile-lens='), 2);
    assert.doesNotMatch(html, /class="lens-switcher-label"/, 'desktop viewing controls must be icon-only');
    assert.equal(count(html, 'data-icon-treatment="filled"'), 1, 'desktop viewing control must declare the filled icon treatment');
    assert.equal(count(html, 'class="lens-switcher-filled-icon"'), 2, 'desktop viewing control must render two filled SVG icons');
    assert.equal(count(html, 'class="lens-switcher-rail"'), 1, 'desktop viewing control must render one visual rail');
    assert.doesNotMatch(html, /&#x25D0;|&#x25CB;/, 'retired outlined theme glyphs must not regenerate');
    assert.match(html, /<h2 class="footer-tagline">/);
    assert.match(html, /class="footer-cta">Let&#39;s chat\.<\/a>/);
    assert.match(html, /class="footer-email"[^>]*><svg viewBox="0 0 24 24"/);
    assert.doesNotMatch(html, /data-copy-email|data-copy-email-status|>Copy email</);
    assert.match(html, /<nav class="footer-social" aria-label="Contact options">/);
    assert.match(html, /href="documents\/Victor-Tran-Resume\.pdf" target="_blank" rel="noopener">Résumé<\/a>/);
    if (['public.html', 'protected.html'].includes(page)) {
      assert.match(html, /<!-- generated:project-nav:start -->/);
      assert.match(html, /aria-label="Previous project:/);
      if (page === 'public.html') assert.match(html, /class="project-nav-gallery-panel"/);
      else assert.match(html, /aria-label="Next project:/);
    }
  }

  const home = fs.readFileSync(path.join(tempRoot, 'index.html'), 'utf8');
  assert.doesNotMatch(home, /aria-current="page"/);
  assert.match(home, /<span class="nav-logo-victor">Victor<\/span>\s*<span class="nav-logo-tran">Tran<\/span>/,
    'home shell must preserve the Engraved DNA split wordmark');
  assert.doesNotMatch(home, /images\/nav-logo\.webp/,
    'home shell must not overwrite the Engraved DNA wordmark with the project-page logo');
  const publicPage = fs.readFileSync(path.join(tempRoot, 'public.html'), 'utf8');
  assert.match(publicPage, /<span class="nav-logo-victor">Victor<\/span>\s*<span class="nav-logo-tran">Tran<\/span>/,
    'non-home pages must use the approved split Victor / Tran wordmark');
  assert.doesNotMatch(publicPage, /images\/nav-logo\.webp|class="nav-logo-name"/,
    'non-home pages must not retain the older image-and-name lockup');
  assert.match(publicPage, /href="public\.html" class="active" aria-current="page"/);
  const publicNav = publicPage.match(/<!-- generated:project-nav:start -->([\s\S]*?)<!-- generated:project-nav:end -->/)?.[1] ?? '';
  assert.match(publicNav, /class="project-nav-gallery-panel" aria-label="Next galleries"/,
    'a primary route entering a gallery sequence must consolidate the sequence into its Next panel');
  assert.match(publicNav, /href="gallery\.html" class="project-nav-gallery-primary"[^>]*>[^]*?First gallery description/,
    'the named next gallery must remain the primary linked destination with its short description');
  assert.match(publicNav, /href="gallery-two\.html"[^>]*>[^]*?Second gallery description/,
    'secondary gallery links must retain their short descriptions');
  assert.deepEqual([...publicNav.matchAll(/href="([^"]+)"/g)].map((match) => match[1]),
    ['protected.html', 'gallery.html', 'gallery-two.html', 'gallery-three.html']);
  assert.equal((publicNav.match(/class="project-nav-gallery-primary"/g) || []).length, 1,
    'the first gallery must not be repeated as a non-link panel title');
  assert.doesNotMatch(publicNav, /<a\b[^>]*>(?:(?!<\/a>)[\s\S])*<a\b/,
    'the consolidated gallery panel must not nest destination links');
  projects.projects[0].projectNavNext = 'gallery-two';
  writeJson('projects.json', projects);
  generateSiteShell(tempRoot);
  const reorderedNav = fs.readFileSync(path.join(tempRoot, 'public.html'), 'utf8').match(/<!-- generated:project-nav:start -->([\s\S]*?)<!-- generated:project-nav:end -->/)[1];
  assert.deepEqual([...reorderedNav.matchAll(/href="([^"]+)"/g)].map(match => match[1]),
    ['protected.html', 'gallery-two.html', 'gallery.html', 'gallery-three.html'], 'configured gallery destination must not be duplicated or drop another gallery');
  projects.projects[0].projectNavNext = 'gallery';
  writeJson('projects.json', projects);
  generateSiteShell(tempRoot);
  const about = fs.readFileSync(path.join(tempRoot, 'about.html'), 'utf8');
  assert.match(about, /href="about\.html" class="active" aria-current="page"/);
  const protectedPage = fs.readFileSync(path.join(tempRoot, 'protected.html'), 'utf8');
  assert.match(protectedPage, /<p class="site-route-status"><span>Private case study<\/span><small>Access required<\/small><\/p>/);
  assert.match(protectedPage, /src="js\/password-gate\.js"/);
  assert.match(protectedPage, /noindex,nofollow/);

  const publicPath = path.join(tempRoot, 'public.html');
  const publicWithFences = fs.readFileSync(publicPath, 'utf8');
  fs.writeFileSync(publicPath, publicWithFences.replace('<!-- generated:site-shell-footer:start -->', '<!-- missing footer fence -->'));
  assert.throws(() => generateSiteShell(tempRoot), /exactly one fenced site-shell-footer block/);
  assert.match(fs.readFileSync(publicPath, 'utf8'), /data-fixture-body="public\.html">Body remains exact/);
  fs.writeFileSync(publicPath, publicWithFences);

  fs.writeFileSync(publicPath, publicWithFences.replace(' id="main-content" tabindex="-1"', ''));
  assert.throws(() => generateSiteShell(tempRoot), /main must already have id="main-content" and tabindex="-1"/);
  assert.doesNotMatch(fs.readFileSync(publicPath, 'utf8'), /<main[^>]*id="main-content"/);
  fs.writeFileSync(publicPath, publicWithFences);

  const beforeMalformed = treeDigest();
  for (const args of [['--root'], ['--root', '--mode'], ['--mode']]) {
    const result = spawnSync(process.execPath, [scriptPath, ...args], { encoding: 'utf8' });
    assert.notEqual(result.status, 0, `malformed arguments must fail: ${args.join(' ')}`);
    assert.equal(treeDigest(), beforeMalformed, 'malformed arguments must not mutate fixture output');
  }

  const validCli = spawnSync(process.execPath, [scriptPath, '--root', tempRoot], { encoding: 'utf8' });
  assert.equal(validCli.status, 0, validCli.stderr);
  assert.match(validCli.stdout, /changed=0/);

  const outside = path.join(path.dirname(tempRoot), `${path.basename(tempRoot)}-outside.html`);
  fs.writeFileSync(outside, 'outside sentinel');
  writeJson('site-shell.json', { ...shellConfig, pages: ['../escape.html'] });
  assert.throws(() => generateSiteShell(tempRoot), /unsafe site-shell page entry/);
  assert.equal(fs.readFileSync(outside, 'utf8'), 'outside sentinel');
  fs.rmSync(outside);

  console.log('Shared site shell fixture passed for public, protected, home, and about routes.');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
