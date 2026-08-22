#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const fail = (message) => failures.push(message);
const read = (relativePath) => {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`missing ${relativePath}`);
    return '';
  }
  return fs.readFileSync(absolutePath);
};
const text = (relativePath) => read(relativePath).toString('utf8');
const sha256 = (relativePath) => crypto.createHash('sha256').update(read(relativePath)).digest('hex');
const count = (value, needle) => value.split(needle).length - 1;
const size = (relativePath) => read(relativePath).length;

const assetHashes = {
  'images/pikapp-case-study/belltower-expansion.jpg': 'b977af8df532d2562ceeb0d9db85e7e985ceaa9e583b4940f37b71dac4f5c77f',
  'images/pikapp-case-study/expansion-cover-detail.jpg': '9c6ac629bfc4df01f25ebd75985f32b515f08469bbaeeb27c94b4bdf22650b01',
  'images/pikapp-case-study/expansion-cover-preview.jpg': 'b82b43c973cc021dcca187e66033b36acae9d1b144fb89b85f3590973dd1970c',
  'images/pikapp-case-study/expansion-creighton-opener.webp': '835620694f771fa103669f58d52a7c16fee953b42972878d21a7d5103d7a396a',
  'images/pikapp-case-study/expansion-timeline.webp': 'ec3907db025d5dbb22eba9e89ca8d087c50487fc307a155b24213c79fd97b698',
  'images/pikapp-case-study/expansion-post-support.webp': '84eb60197c45566d90fd4c0f2764a911425d6ec2a2e7b985aea62316ea40722c',
  'images/pikapp-case-study/expansion-national-statistics.webp': '248151860ee631ff259cb0ac017fa8b23161267e9123ac4cab00eafa45169091',
  'images/pikapp-case-study/expansion-regional-map.webp': 'ab1b853edb00ce39dec87934a291f22a4b93126a407c6b0ab13ad28f8c49f868',
  'images/pikapp-case-study/expansion-event-application.webp': '1c138124a858d2e42104bb36c2836d88b6e15bb47120dffabf5d1bb183a44064',
  'images/pikapp-case-study/wireframes.png': 'bb4375af22d4bace1a26023b9b03b220ee2b3843a18f663357c62f5fec360f60',
  'images/pikapp-case-study/sitemap.png': 'd2661fc1909dbcab8d08d7e3868006fa67777e705b0d95ed4c93ea93e43ee90e',
  'images/pikapp-case-study/app-star-shield.svg': '930b649f60d4d2446ec3078106b70811588bee5fbcd74135b09fd4df465049e6',
  'images/pikapp-case-study/login-screen.png': '685e3d451f70bf0c19902bb5a112998b77e82228584ed346064cfc5b528cab62',
  'images/pikapp-case-study/member.png': 'd48a66dabd278383eec5d12ec667027292c3ce0b9f5ed38a6be9052ab9b3402d',
  'images/pikapp-case-study/task-expand.png': '502d9f981ae9c1dc97b114a9ea8273e0d4d59796b7db604d231a77b9ce693ec7',
  'images/pikapp-case-study/v2-today-light.png': '209e14acf78cd9e6007f9814a4f432872d60e1f830646f3f9411e33aba482e29',
  'images/pikapp-case-study/v2-responsibility-detail-dark.png': 'a9b8821fc372c7f4185a97e2cddd9cc7b41de429f6e7361fca94c8cf0a78db14',
  'images/pikapp-case-study/v2-chapter-light.png': '96140e5afee9030d2fb09e6aacca5ac82bf7d59debbf1b686a296366c5551b65',
  'images/pikapp-case-study/v2-today-light-square.png': '1c5661d087f392cf23dd2ac18ca1687726c7fd94c7a22fd593a5bf376eb578fe',
  'images/pikapp-case-study/v2-responsibility-detail-dark-square.png': '749d9a49ca30ec3ab9b8f233799ddb192374f192d53f3cc774e9cf654474243f',
  'images/pikapp-case-study/v2-chapter-light-square.png': '8cd9cd9bbeb7285c470a1d6631ba79c6a8474d287a1d2df9719cc0bb13eeacb9',
  'images/pikapp-case-study/v2-update-review-dark.png': '1b02cc1541f071866b69183540cf57d4eb76a3cd218a9df59a1c47ee612fdb96',
  'images/pikapp-case-study/v2-update-review-dark-square.png': '06fd46b0a1764b723a02a194d2b6e933370d85cebeec960d5b207db6ea6c8057',
  'images/pikapp-case-study/v2-correction-requested-dark.png': 'bb8b7105a0ba965b6677646dd425146a22cd6766bca7c860c12fa94e3067c3cc',
  'images/pikapp-case-study/v2-correction-requested-dark-square.png': '8e2edfb389395ac7806faaeedbe0341cb5cc277ea31a7014179e05a5a13967b0',
  'images/pikapp-case-study/v2-all-caught-up-dark.png': '9cb3faeda869b9a9f49b960d5ff35e4b350c75832927c9a8249cba5bbcc626d4',
  'images/pikapp-case-study/v2-all-caught-up-dark-square.png': 'e20fc532e3c7b9fdf2ebc898866bc57ce98301746bdf604b837cf1545cc72dde',
  'images/pikapp-case-study/v2-all-caught-up-light.png': 'a4d0575ea8ead529fa70a2e912cdfed75c0ecea3f7b47e1250b37b6443da9090',
  'images/pikapp-case-study/v2-all-caught-up-light-square.png': '16447d5ff96e106654de1670f444c833184369aa5abffc995634388eeb5b2c6f',
  'images/pikapp-case-study/v2-today-light-clean.png': '1ddbc06bb9d4ff1ff542e6f71698bf400d9c0cc6ba8a6f66a441e97a59790103',
  'images/pikapp-case-study/v2-responsibility-detail-dark-clean.png': '945577aa42d95cfe14d0c258028488f96d01b069b7973b903c2a07b3e9c7372c',
  'images/pikapp-case-study/v2-update-review-dark-clean.png': '997b246e8ce2252f3dccf9459b0acbb57702c839a879ff41def74c5a1dbf3c0d',
  'images/pikapp-case-study/v2-correction-requested-dark-clean.png': 'f65eba0f9bf4ec7d58b102016a0cc8a4613f3d1d994cdc82aa31e3f53e63d157',
  'images/pikapp-case-study/v2-all-caught-up-dark-clean.png': 'fee611f2495f7b16411372839a3cc99a0936bc89b2cfe8076a02d7c85711db6c',
  'images/pikapp-case-study/v2-all-caught-up-light-clean.png': '8f5aa2ee9586ab354823d9af8282684d3a3a0eba4a9585584fd409fcfa4c2482',
  'images/pikapp-case-study/v2-chapter-light-clean.png': 'ee4b7c9daaa2afbd808b1c97ddd11f0aaebe4378bbdd0bca6c2d4c3bb93b945f',
  'images/pikapp-case-study/pattern-dark-blue.svg': 'c351c176e21cba2ec26506c444018502b9214ddd49036b1f2d07f6a5c7bb5436',

  'images/pikapp-case-study/exploration-today.png': '15e02cd8d713d7e7493e4379242197c6223b7e40a007c36e32f84b7965e73833',
  'images/pikapp-case-study/exploration-responsibility.png': 'd7bef54769184e601108a887a36bf0c87940626d0ca3ffb7db8b60322d233280',
  'images/pikapp-case-study/exploration-chapter.png': '98120ec9787d223ede0d64cc2dbb650f0ff20fe483d765d398c5ffc8153b782b',
  'images/pikapp-case-study/exploration-support.png': 'c5830030087b853e168c83f60999e85bfd4bafa45cdb65bd8b5e6bb711cd67a2',
  'images/pikapp-case-study/exploration-profile.png': 'b54b3a0a950f2c9c912051ebb28a4db34042401b5f1cc0bf31f61a986de1c518',
  'images/pikapp-case-study/pattern-dark-blue-display.svg': '3050763379deb29578f865c3b8d4a4df164591654a842cce1c732656082cc509',
  'images/pikapp-case-study/remaster-login.png': '47cd04deeb73a1ba707a002102b436cb995d3a6fc2531c501de7e640c74c3bf3',
  'images/pikapp-case-study/remaster-dashboard.png': '01cf2880f8f1fd85e2a36d0c692cb0ba1a25916edffdac56b0e8379c6ed70e2f',
  'images/pikapp-case-study/remaster-milestones.png': 'e5ff72d4ef7e1ce7d48b82f9a4b75b5cef6e5f670b773cbda92caa6f92c95a43',
};
for (const [relativePath, expected] of Object.entries(assetHashes)) {
  const actual = sha256(relativePath);
  if (actual !== expected) fail(`${relativePath} does not match the approved evidence checksum`);
}
if (fs.existsSync(path.join(root, 'images/pikapp-case-study/expansion-cover.png'))) {
  fail('unused 3.3 MB expansion-cover.png source master must stay outside the deployable repository');
}

const html = text('pikappapp.html');
const css = text('css/pikappapp.css');
const remasterRenderer = text('scripts/render-pikapp-remaster.mjs');
if (!remasterRenderer.includes('process.env.CHROME_BIN')) {
  fail('remaster renderer must support an explicit portable CHROME_BIN');
}
if (/\/(?:home|Users)\/[A-Za-z0-9._-]+\//.test(remasterRenderer)) {
  fail('remaster renderer must not track a user-specific home or cache path');
}
const closeSection = html.match(/<section class="close">([\s\S]*?)<\/section>/)?.[1] || '';
if (count(closeSection, '<p>') !== 2) fail('Pi Kapp closing reflection must stay concise at exactly two paragraphs');
for (const required of [
  'It was an early attempt to make HQ feel closer to day-to-day chapter life through one member-facing app.',
  'The concept still needed usability testing and a clearer integration model.',
  'start with the systems people already use, then make the member-facing experience easier to understand.',
]) {
  if (!closeSection.includes(required)) fail(`Pi Kapp closing reflection is missing approved concise copy: ${required}`);
}
for (const retired of ['the feedback was positive', 'The concept still needed more definition.', 'The next step would have been usability testing']) {
  if (closeSection.includes(retired)) fail(`Pi Kapp closing reflection still contains retired repeated copy: ${retired}`);
}
for (const persona of ['Associate member', 'Chapter secretary', 'Graduating senior']) {
  if (!html.includes(`<h3>${persona}</h3>`)) fail(`Pi Kapp member journey is missing its role-based persona label: ${persona}`);
}
if (html.includes('Sample member')) fail('Pi Kapp member journey must not retain generic Sample member labels');
const signatureMarkRule = css.match(/\.pikapp-page \.identity-board__signature img\{([^}]*)\}/)?.[1] || '';
for (const required of ['background:#006f9e', 'padding:8px', 'border-radius:14px', 'box-sizing:border-box']) {
  if (!signatureMarkRule.includes(required)) fail(`Pi Kapp signature mark is missing its accessible cyan field treatment: ${required}`);
}
if (!text('images/pikapp-case-study/app-star-shield.svg').includes('.st1{fill:#FFFFFF;}')) fail('source Star Shield must preserve its authentic white silhouette');

const explorationDisplayAssets = [
  'exploration-today.png', 'exploration-responsibility.png', 'exploration-chapter.png',
  'exploration-support.png', 'exploration-profile.png',
];
const remasterDisplayAssets = ['remaster-login.png', 'remaster-dashboard.png', 'remaster-milestones.png'];
for (const filename of explorationDisplayAssets) {
  if (html.includes(`images/pikapp-case-study/${filename}`)) {
    fail(`pikappapp.html must not reference removed AI-assisted flow asset: ${filename}`);
  }
}
for (const filename of remasterDisplayAssets) {
  if (!html.includes(`images/pikapp-case-study/${filename}`)) {
    fail(`pikappapp.html must use the approved public derivative: ${filename}`);
  }
}
const js = text('js/pikappapp.js');
const workflow = text('.github/workflows/health-check.yml');

for (const required of [
  '<link rel="canonical" href="https://www.victortrandesign.com/pikappapp">',
  '<link rel="stylesheet" href="css/pikappapp.css">',
  '<main class="page-content pikapp-page" id="main-content" tabindex="-1">',
  '<!-- generated:site-shell-header:start -->',
  '<!-- generated:site-shell-header:end -->',
  '<!-- generated:project-nav:start -->',
  '<!-- generated:project-nav:end -->',
  '<!-- generated:site-shell-footer:start -->',
  '<!-- generated:site-shell-footer:end -->',
  '<p class="section-label sr-only">Design</p>',
  '<span class="concept-flag">Concept</span>',
  'A mobile concept for helping fraternity members keep track of milestones and stay connected to the organization.',
  'From expansion work to one member view.',
  'Every year looked a little different. The same stuff still had to get done.',
  'There was already a system. It was just spread everywhere.',
  'It still needed to look like Pi Kappa Phi.',
  'images/pikapp-case-study/app-star-shield.svg',
  'Five chapters',
  '<span>05</span>Final remaster',
  'System for the final remaster',
  'Mark &amp; pattern',
  'Form controls',
  'Member progress card',
  'Bulletin row',
  'Milestone states',
  'Bottom navigation',
  'Components',
  'identity-board',
  'identity-board__header',
  'Source vocabulary',
  'identity-board__section identity-board__section--color',
  'identity-board__section identity-board__section--type',
  'identity-board__section identity-board__section--mark',
  'identity-board__section identity-board__section--components',
  'identity-board__card',
  'The final remaster draws from the original app files, the archived Pi Kappa Phi identity, and the strongest interface decisions across the concept.',
  'Brand foundation and interface layers',
  '>Brand blue</h4>',
  '>Brand gold</h4>',
  '>App cyan</h4>',
  '>App navy</h4>',
  '>White</h4>',
  'Brand, interface, and status roles',
  'Original vector mark on its intended field',
  'Only the pieces used by the final remaster',
  'identity-palette',
  'Original app Star Shield on the cyan hex field',
  'Original vector mark, kept small and crisp inside its intended app layer.',
  'role="group" aria-label="Source palette color roles"',
  'role="group" aria-label="Member, Chapter, National HQ, and Settings interface icons"',
  'role="group" aria-label="Display, interface, and status type roles"',
  'V1 established the structure. V2 clarified the loop.',
  'Supporting chronology',
  'These materials show two stages of the concept: original V1 screens and selected static states from the earlier V2 direction.',
  '<span>04</span>V1 + static V2',
  'A formative project that changed how I approached product design.',
  'Chapter 05',
  'Final design | Source-faithful remaster',
  'The final remaster brings the app back to its source.',
  'The final direction returns to the original cyan field, Star Shield, hex texture, and member flow, then rebuilds the interface for current screens. It keeps the authored identity recognizable while tightening type, spacing, controls, contrast, and accessibility.',
  '01 Welcome',
  'A cleaner login keeps the original composition, mark, and color field.',
  '02 Member view',
  'The dashboard keeps progress and milestones visible without crowding the next action.',
  '03 Milestone detail',
  'Expanded tasks preserve context while making completion state easier to scan.',
  'Source-faithful remaster. Illustrative concept screens.',
  'Earlier static V2 states',
  'The prototype clarified the attention-to-completion loop.',
  'Earlier V2 direction. Illustrative concept screens.',
  'images/pikapp-case-study/v2-today-light-clean.png',
  'images/pikapp-case-study/v2-responsibility-detail-dark-clean.png',
  'images/pikapp-case-study/v2-all-caught-up-light-clean.png',
  '<script src="js/pikappapp.js"></script>',
]) {
  if (!html.includes(required)) fail(`pikappapp.html missing required integration marker: ${required}`);
}

if (count(html, '<main') !== 1) fail('pikappapp.html must contain exactly one root main');
if (count(html, '<h1') !== 1) fail('pikappapp.html must contain exactly one h1');
if (count(html, 'class="exploration-study"') !== 0) fail('redundant broad exploration studies must be removed from the public page');
if (count(html, 'class="exploration-screen"') !== 0) fail('AI-assisted exploration screens must be removed from the public case-study sequence');
for (const removedExplorationCopy of ['AI-assisted flow studies', 'AI-assisted studies.', 'later AI-assisted visual studies', 'Other explorations.']) {
  if (html.includes(removedExplorationCopy)) fail(`public Pi Kapp page retained removed exploration copy: ${removedExplorationCopy}`);
}
if (count(html, 'class="coda__screen"') !== 3) fail('Pi Kapp coda must contain exactly three source-faithful remaster screens');
if (count(html, 'class="v2-history__screen"') !== 3) fail('Earlier V2 history must contain exactly three static screens');
if (count(html, 'class="coda__step"') !== 3) fail('Pi Kapp coda must expose the explicit 01, 02, 03 story order');
if (count(html, 'class="identity-palette__item') !== 5) fail('consolidated source palette must preserve exactly five color roles');
if (count(html, 'identity-board__card--pattern') !== 1) fail('mark and pattern must resolve into one composed source lockup');
if (html.includes('identity-board__card--mark') || html.includes('identity-handoff')) fail('superseded duplicate mark and system-handoff structures must remain removed');
for (const repeatedNarrative of ['From system to screen', 'A smorgasbord of directions, not one shipped system.', 'Five visual directions.', 'Five equal mobile studies', 'It is illustrative and not shipped.', 'Concept · not shipped', 'Not researched or shipped.', 'illustrative and unshipped']) {
  if (html.includes(repeatedNarrative)) fail(`consolidated page still contains repeated narrative: ${repeatedNarrative}`);
}
const publicExport = text('content/pikappapp.md');
for (const requiredExport of [
  'Brand blue: Identity and recognition',
  'Brand gold: Actions and progress',
  'App cyan: Entry and member view',
  'App navy: Structure and detail',
  'White: Fields and reading',
  'Supporting chronology: These materials show two stages of the concept: original V1 screens and selected static states from the earlier V2 direction.',
]) {
  if (!publicExport.includes(requiredExport)) fail(`public Pi Kapp export missing consolidated semantic content: ${requiredExport}`);
}
for (const removedExplorationCopy of ['AI-assisted flow studies', 'AI-assisted studies.', 'later AI-assisted visual studies', 'Other explorations.']) {
  if (publicExport.includes(removedExplorationCopy)) fail(`public Pi Kapp export retained removed exploration copy: ${removedExplorationCopy}`);
}
if (html.includes('class="future-principle"') || html.includes('class="coda__state-pair')) fail('obsolete seven-screen V2 support structures must not remain in the concise remaster coda');
const renderedV2Assets = [...html.matchAll(/src="images\/pikapp-case-study\/(v2-[^"]+\.png)"/g)].map((match) => match[1]);
if (JSON.stringify(renderedV2Assets) !== JSON.stringify(['v2-today-light-clean.png','v2-responsibility-detail-dark-clean.png','v2-all-caught-up-light-clean.png'])) fail(`Pi Kapp must render only the approved static V2 sequence: ${JSON.stringify(renderedV2Assets)}`);
if (count(html, 'class="phone-slide') !== 3) fail('Earlier-concept viewer must contain exactly three historical screens');
for (const obsoleteAsset of ['exploration-placeholder.webp', 'exploration-design-system.webp', 'app-crest.png', 'app-icon.png']) {
  if (html.includes(obsoleteAsset)) fail(`Pi Kapp page still references superseded public asset: ${obsoleteAsset}`);
}
if (count(html, 'class="member-card__avatar" aria-hidden="true"') !== 3) fail('Pi Kapp member cards must contain exactly three decorative user icons');
if (!html.includes('loading="lazy" decoding="async"')) fail('Pi Kapp evidence media must use lazy asynchronous decoding');
if (/<meta\s+name="robots"\s+content="noindex/i.test(html)) fail('public Pi Kapp route must remain indexable');
if (!text('sitemap.xml').includes('/pikappapp')) fail('public Pi Kapp route must remain in sitemap.xml');
if (/Disallow:\s*\/pikappapp/i.test(text('robots.txt'))) fail('robots.txt must not disallow the public Pi Kapp route');

const archiveViews = [
  ['cover', 'View portfolio cover', 'expansion-cover-detail.jpg'],
  ['creighton', 'View Creighton opener', 'expansion-creighton-opener.webp'],
  ['timeline', 'View expansion timeline', 'expansion-timeline.webp'],
  ['support', 'View post-expansion support', 'expansion-post-support.webp'],
  ['statistics', 'View national statistics', 'expansion-national-statistics.webp'],
  ['map', 'View regional map', 'expansion-regional-map.webp'],
  ['event', 'View event application', 'expansion-event-application.webp'],
  ['context', 'View environmental context', 'belltower-expansion.jpg'],
];

for (const required of [
  'expansion-archive-trigger',
  'aria-haspopup="dialog"',
  'aria-controls="expansion-archive-dialog"',
  'aria-label="Open archive: Expansion Portfolio"',
  '<span class="expansion-archive-cue" aria-hidden="true"></span>',
  '<dialog class="archive-dialog" id="expansion-archive-dialog"',
  'aria-labelledby="expansion-archive-title"',
  'aria-live="polite"',
  'images/pikapp-case-study/expansion-cover-preview.jpg',
]) {
  if (!html.includes(required)) fail(`Pi Kapp archival view missing: ${required}`);
}
for (const [key, label, filename] of archiveViews) {
  if (!html.includes(`data-archive-master="${key}"`)) fail(`Pi Kapp archive missing master: ${key}`);
  if (!html.includes(`data-archive-view="${key}" aria-pressed="${key === 'cover'}" aria-label="${label}"`)) fail(`Pi Kapp archive missing view control: ${key}`);
  if (!html.includes(`data-src="images/pikapp-case-study/${filename}"`)) fail(`Pi Kapp archive missing deferred asset: ${filename}`);
}
if (count(html, 'data-archive-master=') !== 8) fail('Expansion archive must contain exactly eight complete authored views');
if (count(html, 'data-archive-view=') !== 8) fail('Expansion archive must contain exactly eight view controls');
if (!/\.pikapp-page \.archive-view img\{[^}]*object-fit:contain/.test(css)) fail('Expansion archive thumbnails must preserve complete authored pages without cropping');
for (const filename of archiveViews.slice(1, -1).map(([, , filename]) => filename)) {
  const relativePath = `images/pikapp-case-study/${filename}`;
  if (size(relativePath) > 900_000) fail(`${filename} exceeds 900 KB`);
}
if (html.includes('<strong>Expansion context</strong>')) fail('expansion photo repeats the section label');
if (html.includes('<strong>Expansion packet cover</strong>')) fail('expansion artifact repeats its caption hierarchy');
if (/src="images\/pikapp-case-study\/expansion-cover\.png"/.test(html)) fail('3.3 MB source cover must not load in the initial page');
if (/<button[^>]+data-archive-view[^>]*>[\s\S]*?<img[^>]+\ssrc=/i.test(html)) fail('archive view thumbnails must defer their image sources until the dialog opens');
if (/<span>Open archive<\/span>|<span>Cover<\/span>|<span>Context<\/span>/i.test(html)) fail('archive controls must use icon or image cues without visible action/page labels');
if (size('images/pikapp-case-study/expansion-cover-preview.jpg') > 350_000) fail('expansion cover preview exceeds 350 KB');
if (size('images/pikapp-case-study/expansion-cover-detail.jpg') > 900_000) fail('expansion cover detail exceeds 900 KB');

for (const forbidden of [
  'Private page review',
  'Private integrated review',
  'Private comparison',
  'KEEP / ADJUST / REJECT',
  'Requested decision',
  'data-view-button',
  'data-theme-button',
  'motion-button',
  'Try the prototype',
  'same flow, ranked',
  'ranked percent',
  'current rank against',
  'browser-side Babel',
  'Milestone Unlocked',
  '4-Week Streak',
  '+100 XP',
]) {
  if (html.toLowerCase().includes(forbidden.toLowerCase())) fail(`pikappapp.html retained forbidden review/legacy copy: ${forbidden}`);
}
for (const obsolete of ['remaster-attention.png', 'remaster-trust.png', 'remaster-chapter-context.png', '01 Attention', '02 Trust', '03 Chapter context']) {
  if (html.includes(obsolete)) fail(`obsolete final-remaster framing remains: ${obsolete}`);
}
if (/src="assets\//.test(html) || /url\(["']?assets\//.test(css)) fail('Pi Kapp integration must use repository-owned public asset paths');

const patternCardRule = css.match(/\.pikapp-page \.identity-board__card--pattern\{([^}]*)\}/)?.[1] || '';
if (!patternCardRule.includes("url('../images/pikapp-case-study/pattern-dark-blue-display.svg')")) {
  fail('Mark & pattern card must use the edge-clean display derivative');
}
if (patternCardRule.includes("url('../images/pikapp-case-study/pattern-dark-blue.svg')")) {
  fail('Mark & pattern card must not repeat the raw SVG with malformed edge slivers');
}
if (css.includes('pattern-dark-blue.svg')) {
  fail('Public Pi Kapp CSS must use the edge-clean pattern derivative consistently');
}

for (const required of [
  '.pikapp-page',
  'html[data-theme="dark"] .pikapp-page',
  '@media (prefers-reduced-motion: reduce)',
  '@media (max-width: 800px)',
  '@media (max-width: 430px)',
  'min-height: 44px',
  'images/pikapp-case-study/pattern-dark-blue-display.svg',
  'scroll-margin-top:',
  '.archive-dialog',
  '.archive-trigger',
  '.archive-master',
  'object-fit:contain',
  '.pikapp-page .expansion-artifact__sheet{transition:none}',
  '.member-card__avatar',
  '.v2-history',
  '.v2-history__grid',
  '.v2-history__frame',
  '.coda__triptych',
  'grid-template-columns:repeat(3,minmax(0,1fr))',
  'aspect-ratio:390/844',
  '@media (max-width: 700px)',
  'font-style:italic',
  '.pikapp-page .identity-board',
  '.pikapp-page .identity-board__section',
  '.pikapp-page .identity-board__card',
  '.pikapp-page .identity-handoff',
  '@keyframes phone-enter-next',
  '@keyframes phone-enter-previous',
  '@keyframes phone-copy-rise',
]) {
  if (!css.includes(required)) fail(`css/pikappapp.css missing required contract: ${required}`);
}
for (const forbidden of ['.reviewbar', '.boundary__inner', '.decision', '.explorations', '.exploration-row', '.exploration-flow', '.exploration-screen', '.exploration-boundary']) {
  if (css.includes(forbidden)) fail(`css/pikappapp.css retained private-review selector: ${forbidden}`);
}
const screenRadiusRules = [
  ['V1 phone screen', css.match(/\.pikapp-page \.phone-slide\{([^}]*)\}/)?.[1] || '', 'border-radius:26px'],
  ['V2 history screens', css.match(/\.pikapp-page \.v2-history__frame\{([^}]*)\}/)?.[1] || '', 'border-radius:24px'],
  ['remaster screens', css.match(/\.pikapp-page \.coda__frame\{([^}]*)\}/)?.[1] || '', 'border-radius:24px'],
];
for (const [label, rule, expected] of screenRadiusRules) {
  if (!rule.includes(expected)) fail(`${label} must preserve its approved rounded-corner treatment: ${expected}`);
}
for (const [label, rule] of [
  ['V2 history screens', screenRadiusRules[1][1]],
  ['remaster screens', screenRadiusRules[2][1]],
]) {
  if (!rule.includes('overflow:hidden')) fail(`${label} must keep overflow hidden on its rounded clipping owner`);
}
if (!css.includes('.pikapp-page .coda__image{display:block;width:100%;height:auto;aspect-ratio:390/844;object-fit:contain;max-width:390px;border-radius:0;box-shadow:none}')) {
  fail('remaster image pixels must remain complete and shadow-free inside the rounded outer screen frame');
}
if (/\.pikapp-page \.coda__image\{[^}]*box-shadow:(?!none)/.test(css)) {
  fail('future-state screenshots must not restore a fuzzy box shadow');
}

for (const required of [
  "document.querySelector('[data-phone-story]')",
  "document.getElementById('phone-prev')",
  "document.getElementById('phone-next')",
  "matchMedia('(prefers-reduced-motion: reduce)')",
  "document.addEventListener('visibilitychange'",
  "phoneStory.dataset.direction = direction < 0 ? 'previous' : 'next'",
  "phoneStory.classList.add('is-advancing')",
  "document.querySelector('[data-archive-dialog]')",
  'showModal()',
  'returnFocus.focus()',
  "document.body.classList.add('archive-open')",
  "document.body.classList.remove('archive-open')",
]) {
  if (!js.includes(required)) fail(`js/pikappapp.js missing required viewer behavior: ${required}`);
}
if (js.includes('innerHTML') || js.includes('eval(') || js.includes('fetch(')) fail('Pi Kapp viewer script must not inject HTML or call external services');
if (!workflow.includes('npm run check:pikapp-page')) fail('health-check workflow must run the Pi Kapp page contract');
if (!workflow.includes('npm run check:pikapp-page-browser')) fail('health-check workflow must run the Pi Kapp browser contract');
if (!workflow.includes("needs.changes.outputs.pikapp == 'true'")) fail('health-check workflow must scope Pi Kapp contracts through classifier ownership');

const manifest = JSON.parse(text('data/projects.json'));
const project = manifest.projects.find((entry) => entry.slug === 'pikappapp');
const expectedProject = {
  title: 'Pi Kapp App',
  url: 'pikappapp.html',
  type: 'primary',
  nav: true,
  homepage: true,
  protected: false,
  noindex: false,
  sitemap: true,
};
for (const [key, value] of Object.entries(expectedProject)) {
  if (project?.[key] !== value) fail(`data/projects.json Pi Kapp ${key} drifted`);
}
if (project?.projectNavNext !== 'artillustration') fail('Pi Kapp project navigation must continue to Art & Illustration');
if (!html.includes('href="artillustration.html" class="project-nav-item project-nav-item--next" aria-label="Next project: Art &amp; Illustration"')) fail('Pi Kapp generated next link must point to Art & Illustration');
if (!html.includes('<p class="coda__boundary">Source-faithful remaster. Illustrative concept screens.</p>')) fail('Pi Kapp remaster boundary must be a restrained caption');

if (failures.length) {
  console.error('PI KAPP PAGE INTEGRATION CONTRACT: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('PI KAPP PAGE INTEGRATION CONTRACT: PASS assets=43 remaster=3 v2=static-history');
