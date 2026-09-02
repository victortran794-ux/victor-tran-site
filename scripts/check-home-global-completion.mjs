#!/usr/bin/env node
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];
const need = (condition, message) => {
  if (!condition) failures.push(message);
};
const count = (text, needle) => text.split(needle).length - 1;

const index = read('index.html');
const about = read('about.html');
const css = read('css/style.css');
const js = read('js/main.js');
const manifest = JSON.parse(read('data/projects.json'));
const shell = JSON.parse(read('data/site-shell.json'));
const shellGenerator = read('scripts/generate-site-shell.mjs');
const projectGenerator = read('scripts/generate-project-sections.mjs');
const manifestValidator = read('scripts/validate-project-manifest.mjs');
const patternsContract = read('scripts/check-ibm-patterns-integration.mjs');
const healthWorkflow = read('.github/workflows/health-check.yml');
const pages = shell.pages.map(read);
const bySlug = new Map(manifest.projects.map((project) => [project.slug, project]));

need(index.includes('id="featuredHeading">Other cool things to check out</h2>'),
  'Home work heading must use Victor’s approved casual phrase.');
need(!index.includes('>Selected Work</h2>'), 'Retired Selected Work heading remains visible.');

need(!index.includes('class="hero-cycle"') && !index.includes('class="hero-cycle-label"'),
  'Retired independent hero color controls must remain absent.');
need(!js.includes("querySelector('.hero-cycle-label')") && !js.includes('heroLabel.textContent'),
  'Hero runtime must not restore retired color-control label behavior.');
need(/class="hero-dna-trigger"[^>]*aria-expanded="false"[^>]*aria-controls="heroDnaPanel"/.test(index),
  'Portrait trigger must expose the accepted inline Design DNA relationship.');

need(!shellGenerator.includes('class="lens-switcher-label"'),
  'Generated desktop Light/Dark controls must be icon-only.');
need(shellGenerator.includes('data-mobile-lens="light"') && shellGenerator.includes('>Light</button>') &&
  shellGenerator.includes('data-mobile-lens="dark"') && shellGenerator.includes('>Dark</button>'),
  'Generated mobile Light/Dark controls must retain readable labels.');
need(css.includes('.nav-inner > .lens-switcher .lens-switcher-btn:hover .control-tooltip'),
  'Desktop Light/Dark controls need hover and keyboard-focus tooltips.');
need(shellGenerator.includes('class="control-tooltip" aria-hidden="true">Light mode</span>') &&
  shellGenerator.includes('class="control-tooltip" aria-hidden="true">Dark mode</span>'),
  'Desktop viewing tooltips must not duplicate the controls’ accessible names.');

const cloud = bySlug.get('ibmcloud');
need(cloud?.surface === 'ibm-inverse', 'IBM Cloud must opt into the bounded inverse homepage surface.');
need(cloud?.images?.length === 1 && cloud.images[0].src === 'images/ibm-thumb-dark.png',
  'IBM Cloud inverse card must use the existing dark-theme thumbnail exactly once.');
need(css.includes('.featured-item--surface-ibm-inverse .featured-item-content'),
  'IBM Cloud inverse surface styling is missing.');
need(css.includes('.featured-list .featured-item--span-5 .featured-item-content'),
  'Narrow homepage cards need a deliberate compact content rhythm.');

const art = bySlug.get('artillustration');
const graphic = bySlug.get('graphicgallery');
const uiGallery = bySlug.get('uigallery');
need(art?.homepageLabel === false && graphic?.homepageLabel === false && uiGallery?.homepageLabel === false,
  'The Art, Graphic Design, and UI Gallery covers must rely on their titles without repetitive category labels.');
need(projectGenerator.includes("project.homepageLabel === false"),
  'Homepage generator must reproduce optional bounded label suppression.');
need(manifestValidator.includes("expected.homepageLabel === false ? ''"),
  'Manifest parity validator must accept intentional homepage label suppression.');
need(!patternsContract.includes("'pikappapp.html':") && !patternsContract.includes("'js/main.js':"),
  'IBM Patterns route contract must not freeze independently owned peer or shared-global files.');
need(healthWorkflow.includes("needs.changes.outputs.home == 'true'"),
  'Health workflow must scope Homepage contracts through classifier ownership.');
need(healthWorkflow.includes("needs.changes.outputs.shared == 'true'"),
  'Health workflow must preserve full shared-shell blast-radius coverage.');
need(count(healthWorkflow, 'run: npm run check:home-global-completion') === 1,
  'Health workflow must execute the Home/global completion contract exactly once.');
need(!index.includes('class="featured-galleries-intro"') &&
  index.includes('<h3 class="featured-galleries-title">And some galleries.</h3>') &&
  index.includes('id="galleries" role="group" aria-label="Art, graphic design, and interface studies"'),
  'Homepage gallery ending must use the approved casual chapter name and preserve an explicit accessible name.');

need(shell.footerSubtitle === '', 'Footer must retire the repeated subtitle invitation.');
need(shell.footerCta === "Let's chat.", 'Footer must use the approved casual invitation.');
need(!shellGenerator.includes('data-copy-email='), 'Generated footer must retire copy-email behavior.');
need(!shellGenerator.includes('data-copy-email-status'), 'Generated footer must retire the dead copy status region.');
need(shellGenerator.includes('class="footer-email"'), 'Generated footer needs one direct email action.');
need(shellGenerator.includes('<svg viewBox="0 0 24 24"'), 'Direct footer email action needs a mail icon.');
need(shellGenerator.includes('<span>Email</span>') &&
  !shellGenerator.includes('<span>${escapeHtml(config.contactEmail)}</span>'),
  'Generated footer must show the concise Email label instead of writing out the address.');
need(about.includes(`<a href="mailto:${shell.contactEmail}">${shell.contactEmail}</a>`),
  'About page must retain one visible written-out email address.');
need(!js.includes('[data-copy-email]') && !js.includes('navigator.clipboard') && !js.includes("execCommand('copy')"),
  'Retired copy-email JavaScript remains.');
for (const [page, html] of shell.pages.map((page, index) => [page, pages[index]])) {
  need(!html.includes('See you soon.'), `${page} still contains retired footer subtitle copy.`);
  need(!html.includes("Let's build something together."), `${page} still contains the repeated footer invitation.`);
  need(!html.includes('>Copy email<'), `${page} still shows Copy email.`);
  need(!html.includes('data-copy-email='), `${page} still emits copy-email behavior.`);
  need(html.includes('class="footer-email"'), `${page} is missing the generated direct email action.`);
  need(html.includes('<span>Email</span>'), `${page} footer must show Email instead of the written-out address.`);
}

if (failures.length) {
  console.error('HOME GLOBAL COMPLETION CONTRACT: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`HOME GLOBAL COMPLETION CONTRACT: PASS pages=${shell.pages.length}`);
console.log('- quiet accessible controls, casual archive heading, bounded card rhythm, and direct contact pass');
