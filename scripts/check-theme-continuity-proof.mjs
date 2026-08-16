import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const css = read('css/style.css');
const interactions = read('js/main.js');
const pages = ['index.html', 'ibmcloud.html', 'about.html'];

const requiredSurfaceTokens = [
  '--surface-canvas:',
  '--surface-section:',
  '--surface-media:',
  '--surface-floating:',
];

for (const token of requiredSurfaceTokens) {
  if (!css.includes(token)) {
    throw new Error(`Missing semantic surface token: ${token}`);
  }
}

const darkBlock = css.match(/\[data-theme="dark"\]\s*\{([\s\S]*?)\}/)?.[1] || '';
for (const token of requiredSurfaceTokens) {
  if (!darkBlock.includes(token)) {
    throw new Error(`Dark theme does not rebind semantic surface token: ${token}`);
  }
}

for (const page of pages) {
  const html = read(page);
  if (!/<html\b[^>]*data-finish-proof/.test(html)) {
    throw new Error(`${page} is not explicitly scoped to the finish proof`);
  }
}

const home = read('index.html');
if (!/<aside\b[^>]*class="home-practice-proof"[^>]*aria-label="Current practice"/.test(home)) {
  throw new Error('Home is missing the current-practice proof line');
}
if (!home.includes('Visual Designer at IBM watsonx Orchestrate')) {
  throw new Error('Home current-practice line must use the verified current role');
}

const ibmCloud = read('ibmcloud.html');
if (!/<nav\b[^>]*class="page-context"[^>]*aria-label="Project context"/.test(ibmCloud)) {
  throw new Error('IBM Cloud is missing lightweight project context');
}
if (!/href="index\.html#work"[^>]*>Work<\/a>/.test(ibmCloud) || !/aria-current="page"[^>]*>IBM Cloud<\/span>/.test(ibmCloud)) {
  throw new Error('IBM Cloud project context must link back to Work and identify the current project');
}

const about = read('about.html');
if (!/<nav\b[^>]*class="about-jump-nav"[^>]*aria-label="About sections"/.test(about)) {
  throw new Error('About is missing the bounded jump navigation');
}
for (const id of ['about-current', 'about-practice', 'about-now', 'about-play']) {
  if (!about.includes(`href="#${id}"`) || !about.includes(`id="${id}"`)) {
    throw new Error(`About jump navigation is missing a real target: ${id}`);
  }
}

for (const selector of [
  'html[data-finish-proof] .home-practice-proof',
  'html[data-finish-proof] .page-context',
  'html[data-finish-proof] .about-jump-nav',
]) {
  const ruleStart = css.indexOf(`${selector} {`);
  const ruleEnd = ruleStart === -1 ? -1 : css.indexOf('}', ruleStart);
  const rule = ruleStart === -1 || ruleEnd === -1 ? '' : css.slice(ruleStart, ruleEnd);
  if (!rule.includes('var(--surface-')) {
    throw new Error(`${selector} does not consume a semantic surface role`);
  }
}

if (!css.includes('.lens-switcher-btn[aria-pressed="true"]')) {
  throw new Error('Selected theme treatment is not explicitly tied to aria-pressed');
}
if (!css.includes('[data-lens="light"] .lens-switcher-icon::before') ||
    !css.includes('[data-lens="dark"] .lens-switcher-icon::before')) {
  throw new Error('The shared shell does not expose distinct sun and moon symbols');
}
if (!css.includes('html[data-finish-proof] #about-current') || !css.includes('scroll-margin-top:')) {
  throw new Error('About jump targets do not account for the persistent navigation');
}
if (!interactions.includes('stabilizeFinishProofHashTarget') ||
    !interactions.includes("document.documentElement.hasAttribute('data-finish-proof')") ||
    !interactions.includes("window.addEventListener('load', stabilizeFinishProofHashTarget")) {
  throw new Error('Fresh finish-proof hash URLs are not stabilized after page load');
}
if (!/@media\s*\(max-width:\s*600px\)[\s\S]*?html\[data-finish-proof\] \.home-practice-proof/.test(css)) {
  throw new Error('Home current-practice proof does not define a mobile treatment');
}
if (!/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.lens-switcher-btn/.test(css)) {
  throw new Error('Shared theme controls do not define reduced-motion behavior');
}

console.log('THEME CONTINUITY PROOF CONTRACT: PASS semantic surfaces + orientation + mode clarity');
