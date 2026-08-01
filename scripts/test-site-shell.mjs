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
  footerTagline: 'Do more good things.',
  footerSubtitle: 'See you soon.',
  footerCta: "Let's build something together.",
  copyright: '© Victor Tran 2026 All Rights Reserved',
};
const projects = {
  projects: [
    { slug: 'public', title: 'Public project', url: 'public.html', type: 'primary', nav: true },
    { slug: 'protected', title: 'Protected project', url: 'protected.html', type: 'primary', nav: true },
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
    assert.equal(count(html, 'dna-trigger'), page === 'index.html' ? 3 : 0);
    assert.match(html, /aria-controls="work-menu"/);
    assert.match(html, /id="work-menu" class="nav-dropdown-menu"/);
    assert.doesNotMatch(html, /role="menu(?:item)?"/);
    assert.equal(count(html, 'data-mobile-lens='), 2);
    assert.match(html, /<h2 class="footer-tagline">/);
    assert.match(html, /<nav class="footer-social" aria-label="Contact options">/);
    if (['public.html', 'protected.html'].includes(page)) {
      assert.match(html, /<!-- generated:project-nav:start -->/);
      assert.match(html, /aria-label="Previous project:/);
      assert.match(html, /aria-label="Next project:/);
    }
  }

  const home = fs.readFileSync(path.join(tempRoot, 'index.html'), 'utf8');
  assert.doesNotMatch(home, /aria-current="page"/);
  const publicPage = fs.readFileSync(path.join(tempRoot, 'public.html'), 'utf8');
  assert.match(publicPage, /href="public\.html" class="active" aria-current="page"/);
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
