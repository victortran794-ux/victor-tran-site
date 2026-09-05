import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const failures = [];
const scope = process.argv[2] ?? 'all';
if (!['art', 'graphic', 'all'].includes(scope)) {
  console.error('Usage: node scripts/check-visual-archives-integration.mjs [art|graphic|all]');
  process.exit(2);
}
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const expect = (condition, message) => { if (!condition) failures.push(message); };
const browserVerifier = read('scripts/check-visual-archives-browser.mjs');
expect(!/(?:\/home\/|\/Users\/|\.agent-browser\/browsers\/)/.test(browserVerifier)
  && /process\.env\.CHROME_BIN/.test(browserVerifier),
  'visual-archives browser verifier must use CHROME_BIN or portable system paths without personal cache fallbacks');

function relativeLuminance(hex) {
  const channels = hex.slice(1).match(/.{2}/g).map((value) => {
    const channel = Number.parseInt(value, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground, background) {
  const values = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function mainHtml(html) {
  return html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? '';
}

function images(html) {
  return [...mainHtml(html).matchAll(/<img\b[^>]*>/gi)].map((match) => {
    const tag = match[0];
    const attr = (name) => tag.match(new RegExp(`${name}="([^"]*)"`, 'i'))?.[1] ?? '';
    return {
      tag, src: attr('src'), alt: attr('alt'), width: attr('width'), height: attr('height'),
      srcset: attr('srcset'), sizes: attr('sizes'), fullSrc: attr('data-full-src'),
      thumbSrc: attr('data-thumb-src'), deferredSrc: attr('data-deferred-src'),
      deferredSrcset: attr('data-deferred-srcset'), deferredSizes: attr('data-deferred-sizes'),
    };
  });
}

function primaryHtml(html) {
  const start = html.search(/<section class="archive-primary"/i);
  if (start < 0) return '';
  const details = html.indexOf('<details class="archive-extended">', start);
  const mainEnd = html.indexOf('</main>', start);
  const end = details >= 0 ? details : mainEnd;
  return end >= 0 ? html.slice(start, end) : '';
}

const pages = {
  art: {
    file: 'artillustration.html',
    baseline: 'archive/pages/artillustration-2026-07-31/artillustration.html',
    bodyClass: 'visual-archive-page art-archive-v2',
    marker: 'data-archive="art-studio-wall"',
    keepExtendedArchive: false,
    headings: ['An open studio wall.', 'Characters and worlds', 'Daysigns', '56th Supreme Chapter Chicago', 'Suit of Diamonds', 'Traditional work'],
    selectedAssets: [
      'images/art-archive-v2/old-one.webp',
      'images/art-archive-v2/coffee.webp',
    ],
    rejectedAssets: [
      'images/art-archive-v2/diamond-a.webp',
      'images/art-archive-v2/diamond-q.webp',
      'images/art-archive-v2/diamond-k.webp',
      'images/art-archive-v2/diamond-10.webp',
      'images/art-archive-v2/vertical-narrative.webp',
      'images/art-archive-v2/pbr.webp',
    ],
    livePrimaryMinimum: 14,
    requiredLivePrimaryAssets: [
      'images/illus-ibm-selectric-web.jpg',
      'images/illus-untitled-5.jpg',
      'images/illus-lost.jpg',
      'images/illus-sc-boat.jpg',
      'images/illus-sc-park.jpg',
      'images/illus-sc-tower.jpg',
      'images/cards/diamond-2.png',
      'images/cards/diamond-a.png',
      'images/cards/diamond-10.png',
      'images/cards/diamond-j.png',
      'images/cards/diamond-q.png',
      'images/cards/diamond-k.png',
      'images/illus-img4531.jpg',
    ],
  },
  graphic: {
    file: 'graphicgallery.html',
    baseline: 'archive/pages/graphicgallery-2026-07-31/graphicgallery.html',
    bodyClass: 'visual-archive-page graphic-archive-v2',
    marker: 'data-archive="graphic-contact-sheet"',
    keepExtendedArchive: false,
    headings: ['Graphics. Design. Print.', 'EDC / Boombox', 'Southeastern Greek Leadership Association', 'Selected slide work', 'Marks and applications', 'Campaigns and illustration systems', 'Selected illustrations', 'Wide-format information design'],
    selectedAssets: [
      'images/graphic-archive-v2/chantico.webp',
      'images/graphic-archive-v2/dog.webp',
      'images/graphic-archive-v2/abex.webp',
      'images/graphic-archive-v2/ibm-paltron-illustration-system.webp',
      'images/graphic-archive-v2/wxo-illustration-system.webp',
    ],
    rejectedAssets: [
      'images/graphic-archive-v2/taste.webp',
      'images/graphic-archive-v2/midwest.webp',
      'images/graphic-archive-v2/sam.webp',
      'images/graphic-archive-v2/imij.webp',
    ],
    livePrimaryMinimum: 18,
    requiredLivePrimaryAssets: [
      'images/gg-edc-1.jpg',
      'images/gg-edc-0.jpg',
      'images/gg-edc-2.jpg',
      'images/gg-edc-3.jpg',
      'images/logos-1.jpg',
      'images/logos-2.jpg',
      'images/logos-3.jpg',
      'images/logos-4.jpg',
      'images/gg-illus-1.jpg',
      'images/gg-illus-4.jpg',
      'images/thumb-sgla.webp',
      'images/gg-slides-3.jpg',
      'images/gg-slides-6.jpg',
      'images/gg-slides-7.jpg',
      'images/gg-slides-13.jpg',
    ],
  },
};

for (const [name, page] of Object.entries(pages).filter(([name]) => scope === 'all' || scope === name)) {
  const html = read(page.file);
  const baselineHtml = read(page.baseline);
  const currentImages = images(html);
  const baselineImages = images(baselineHtml);
  const currentSrcs = new Set(currentImages.flatMap((image) => [image.src, image.fullSrc]));
  const primary = primaryHtml(html);
  const primarySrcs = new Set(images(`<main>${primary}</main>`).flatMap((image) => [image.src, image.fullSrc]));

  expect(html.includes(`<body class="${page.bodyClass}">`), `${page.file}: add the bounded visual-archive body classes.`);
  expect(html.includes(page.marker), `${page.file}: add the project-native archive marker.`);
  expect(html.includes('id="visual-archive-v2-styles"'), `${page.file}: include scoped archive styles.`);
  expect(html.includes('class="archive-primary"'), `${page.file}: add a curated primary sequence.`);
  if (page.keepExtendedArchive) {
    expect(html.includes('class="archive-extended"'), `${page.file}: preserve live material in a secondary extended archive.`);
  } else {
    expect(!html.includes('class="archive-extended"'), `${page.file}: remove the duplicate hidden archive after promoting all original work.`);
  }

  for (const heading of page.headings) {
    expect(html.includes(heading), `${page.file}: missing required archive heading “${heading}”.`);
  }
  for (const asset of page.selectedAssets) {
    expect(currentSrcs.has(asset), `${page.file}: missing approved selected asset ${asset}.`);
    expect(fs.existsSync(path.join(root, asset)), `${page.file}: selected asset file does not exist: ${asset}.`);
  }
  for (const asset of page.rejectedAssets) {
    expect(!currentSrcs.has(asset), `${page.file}: rejected asset must not remain in the page: ${asset}.`);
  }
  for (const baseline of baselineImages) {
    expect(currentSrcs.has(baseline.src), `${page.file}: previously public image must be preserved: ${baseline.src}.`);
  }
  expect((primary.match(/data-live-primary/g) ?? []).length >= page.livePrimaryMinimum,
    `${page.file}: promote more live-page work into aligned primary stacks.`);
  for (const asset of page.requiredLivePrimaryAssets) {
    expect(primarySrcs.has(asset), `${page.file}: live-reference asset must appear in the primary archive: ${asset}.`);
  }
  expect(!/rotate\(|translateY\(/i.test(html), `${page.file}: primary archive items must stay straight and aligned.`);

  for (const image of currentImages) {
    expect(Boolean(image.src), `${page.file}: image is missing src.`);
    expect(Boolean(image.alt), `${page.file}: ${image.src || 'unknown image'} needs meaningful alt text.`);
    expect(/^\d+$/.test(image.width) && /^\d+$/.test(image.height), `${page.file}: ${image.src || 'unknown image'} needs numeric width and height.`);
  }

  expect(!/Current \+ Proposed|Current only|Proposed only|private decision|Nothing is transmitted|source-backed|already part of the live page/i.test(mainHtml(html)),
    `${page.file}: private-review or migration scaffolding must not enter the public page.`);
  expect(!/Lorem ipsum|\bXYZ\b|Misc #|Placeholder text|User input text/i.test(mainHtml(html)),
    `${page.file}: accidental filler is forbidden.`);
  expect(/<a\s+href="index\.html"\s+class="nav-logo"\s+aria-label="Victor Tran home">/.test(html),
    `${page.file}: preserve the shared navigation logo contract.`);
  expect(html.includes('<!-- generated:site-shell-header:start -->') && html.includes('<!-- generated:site-shell-header:end -->'),
    `${page.file}: preserve generator-owned shared-header fences.`);
  expect(html.includes('<!-- generated:site-shell-footer:start -->') && html.includes('<!-- generated:site-shell-footer:end -->'),
    `${page.file}: preserve generator-owned shared-footer fences.`);
  expect((html.match(/<main\b[^>]*\bid="main-content"[^>]*\btabindex="-1"[^>]*>/gi) ?? []).length === 1,
    `${page.file}: preserve the validated main focus target.`);
  expect(html.includes('generated:gallery-project-nav:start') && html.includes('generated:gallery-project-nav:end'),
    `${page.file}: include generator-owned previous/next gallery navigation before the shared footer.`);
  expect(!html.includes('Design DNA'), `${page.file}: Design DNA remains homepage-only.`);
  expect(html.includes('class="footer"'), `${page.file}: preserve the shared footer.`);
}

if (scope !== 'graphic') {
const art = read('artillustration.html');
const artLightPalette = art.match(/\.art-archive-v2 \.archive-primary \{ --paper: (#[0-9a-f]{6}); --ink: #[0-9a-f]{6}; --orange: (#[0-9a-f]{6});/i);
const artDarkPalette = art.match(/\[data-theme="dark"\] \.art-archive-v2 \.archive-primary \{ --paper: (#[0-9a-f]{6}); --ink: #[0-9a-f]{6}; --orange: (#[0-9a-f]{6});/i);
expect(Boolean(artLightPalette), 'artillustration.html: expose a parseable Light paper/orange palette.');
expect(Boolean(artDarkPalette), 'artillustration.html: expose a parseable Dark paper/orange palette.');
if (artLightPalette) {
  expect(contrastRatio(artLightPalette[2], artLightPalette[1]) >= 4.5,
    `artillustration.html: Light kicker orange must meet WCAG AA 4.5:1 contrast (found ${contrastRatio(artLightPalette[2], artLightPalette[1]).toFixed(2)}:1).`);
}
if (artDarkPalette) {
  expect(contrastRatio(artDarkPalette[2], artDarkPalette[1]) >= 4.5,
    `artillustration.html: Dark kicker orange must meet WCAG AA 4.5:1 contrast (found ${contrastRatio(artDarkPalette[2], artDarkPalette[1]).toFixed(2)}:1).`);
}
expect(!primaryHtml(art).includes('—'), 'artillustration.html: primary copy must not use em dashes.');
expect(primaryHtml(art).includes('Digital and traditional work spanning character illustration, paintings, and personal series.'),
  'artillustration.html: use Victor’s approved Art opener verbatim.');
expect(!primaryHtml(art).includes('I draw and paint: characters, strange worlds, and whatever else keeps pulling me back to the page.'),
  'artillustration.html: remove the superseded Art opener.');
expect((primaryHtml(art).match(/<img\b/gi) ?? []).length === 56,
  `artillustration.html: preserve the 46-image artwork baseline plus 10 approved Daysigns inside main; found ${(primaryHtml(art).match(/<img\b/gi) ?? []).length}.`);
expect(!/<figcaption\b/i.test(primaryHtml(art)),
  'artillustration.html: artwork-only primary viewing should not show individual labels.');
for (const restoredAsset of [
  'images/illus-untitled-6.jpg', 'images/illus-untitled-7.jpg', 'images/illus-untitled-8.jpg',
  'images/illus-untitled-9.jpg', 'images/illus-untitled-10.jpg', 'images/illus-untitled-11.jpg',
  'images/illus-large.jpg', 'images/illus-img7358.jpg', 'images/illus-img4537.jpg',
  'images/illus-img4496.jpg', 'images/illus-glow.jpg', 'images/illus-forgive-me.jpg',
  'images/illus-1-14-24.jpg', 'images/illus-night-glow.jpg', 'images/illus-sharing.jpg',
  'images/illus-shatter.jpg', 'images/illus-flesh-golem.jpg', 'images/illus-untitled-3.jpg',
]) {
  expect(primaryHtml(art).includes(`src="${restoredAsset}"`),
    `artillustration.html: restore original-page artwork to the visible primary wall: ${restoredAsset}.`);
}
expect((primaryHtml(art).match(/data-sc56-primary/g) ?? []).length === 3,
  'artillustration.html: restore the named SC56 trio as its own visible primary section.');
const restoredWall = art.match(/<div class="art-restored-wall">([\s\S]*?)<\/div>/i)?.[1] ?? '';
expect((restoredWall.match(/data-live-primary/g) ?? []).length === 5 && primaryHtml(art).includes('class="art-section-kicker">Traditional media</p>'),
  'artillustration.html: reserve Traditional work for the five physical/traditional pieces.');
for (const src of ['images/illus-large.jpg', 'images/illus-img7358.jpg', 'images/illus-img4537.jpg', 'images/illus-img4496.jpg', 'images/illus-img4531.jpg']) {
  expect(restoredWall.includes(`src="${src}"`), `artillustration.html: Traditional work is missing ${src}.`);
}
const charactersWall = art.match(/<div class="art-live-wall">([\s\S]*?)<\/div>/i)?.[1] ?? '';
for (const src of ['images/illus-glow.jpg', 'images/illus-forgive-me.jpg', 'images/illus-1-14-24.jpg', 'images/illus-night-glow.jpg', 'images/illus-sharing.jpg', 'images/illus-shatter.jpg', 'images/illus-flesh-golem.jpg', 'images/illus-untitled-3.jpg']) {
  expect(charactersWall.includes(`src="${src}"`) && !restoredWall.includes(`src="${src}"`),
    `artillustration.html: move ${src} from Traditional work into Characters and worlds.`);
}
expect(charactersWall.includes('src="images/art-archive-v2/coffee.webp"') &&
  !primaryHtml(art).includes('images/art-archive-v2/pbr.webp') &&
  !primaryHtml(art).includes('id="art-range-title"') && !primaryHtml(art).includes('aria-label="Closing artwork"'),
  'artillustration.html: move Coffee into Characters and worlds, remove the 1844/PBR piece, and fold the final traditional piece into Traditional work.');
expect(!primaryHtml(art).includes('id="art-horned-title"') && !primaryHtml(art).includes('id="art-traditional-title"'),
  'artillustration.html: return to the previous iteration’s quieter chapter structure.');
const hornedSlideshow = art.match(/<figure[^>]*data-horned-slideshow[\s\S]*?<\/figure>/i)?.[0] ?? '';
expect((hornedSlideshow.match(/series-slideshow-img/g) ?? []).length === 7 && hornedSlideshow.includes('slideshow-pause-btn'),
  'artillustration.html: restore all seven Horned Woman versions as the original auto-crossfade slideshow.');
expect(hornedSlideshow.includes('data-slideshow-interval="2000"'),
  'artillustration.html: the Horned Woman panel must advance every two seconds.');
const artImages = images(art);
const responsiveSpecs = [
  {
    full: 'images/illus-ibm-selectric-web.jpg', thumb: 'images/responsive/illus-ibm-selectric-web-480.webp',
    srcset: 'images/responsive/illus-ibm-selectric-web-480.webp 480w, images/responsive/illus-ibm-selectric-web-960.webp 960w, images/responsive/illus-ibm-selectric-web-1440.webp 1440w',
    sizes: '(max-width: 720px) calc(100vw - 40px), calc(50vw - clamp(24px, 3.333vw, 48px) - clamp(0.4rem, 1vw, 0.875rem))', eager: true,
  },
  {
    full: 'images/art-archive-v2/old-one.webp', thumb: 'images/responsive/old-one-240.webp',
    srcset: 'images/responsive/old-one-240.webp 240w, images/responsive/old-one-480.webp 480w',
    sizes: '(max-width: 720px) calc(33.333vw - 13.333px - clamp(0.533rem, 1.333vw, 1.167rem)), calc(16.667vw - clamp(8px, 1.111vw, 16px) - clamp(0.667rem, 1.667vw, 1.458rem))', eager: false,
  },
];
for (let version = 5; version <= 11; version += 1) {
  responsiveSpecs.push({
    full: `images/illus-untitled-${version}.jpg`, thumb: `images/responsive/illus-untitled-${version}-320.webp`,
    srcset: `images/responsive/illus-untitled-${version}-320.webp 320w, images/responsive/illus-untitled-${version}-640.webp 640w, images/responsive/illus-untitled-${version}-800.webp 800w`,
    sizes: '(max-width: 720px) calc(66.667vw - 26.667px - clamp(0.267rem, 0.667vw, 0.583rem)), calc(33.333vw - clamp(16px, 2.222vw, 32px) - clamp(0.533rem, 1.333vw, 1.167rem))',
    deferred: version !== 5,
  });
}
for (const spec of responsiveSpecs) {
  const image = artImages.find((candidate) => candidate.fullSrc === spec.full);
  expect(Boolean(image), `artillustration.html: ${spec.full} must remain an Art lightbox item via data-full-src.`);
  if (!image) continue;
  expect(image.thumbSrc === spec.thumb, `artillustration.html: ${spec.full} must declare its compact data-thumb-src.`);
  expect((spec.deferred ? image.deferredSrcset : image.srcset) === spec.srcset,
    `artillustration.html: ${spec.full} must declare its approved responsive srcset.`);
  expect((spec.deferred ? image.deferredSizes : image.sizes) === spec.sizes,
    `artillustration.html: ${spec.full} must declare its approved responsive sizes.`);
  if (spec.deferred) {
    expect(image.src.startsWith('data:image/'), `artillustration.html: deferred ${spec.full} must use a valid nonnetwork placeholder.`);
    expect(Boolean(image.deferredSrc), `artillustration.html: deferred ${spec.full} must retain data-deferred-src.`);
  } else {
    expect(!image.src.startsWith('data:image/') && Boolean(image.srcset), `artillustration.html: initial ${spec.full} must be live at parse.`);
  }
  if (spec.eager) expect(image.tag.includes('loading="eager"') && image.tag.includes('fetchpriority="high"'),
    `artillustration.html: IBM Selectric must remain eager and high priority.`);
  if (spec.full.includes('old-one')) expect(image.tag.includes('loading="lazy"') && !image.tag.includes('fetchpriority="high"'),
    `artillustration.html: Old One must remain lazy without high priority.`);
}
expect(artImages.filter((image) => image.fullSrc.startsWith('images/illus-untitled-')).filter((image) => !image.src.startsWith('data:image/')).length === 1,
  'artillustration.html: only the initial Horned Woman slide may use a network source at parse.');
expect(read('scripts/build-visual-archives-integration.py').includes('data-slideshow-interval="2000"'),
  'visual archive generator: own the Horned Woman two-second interval in the canonical source.');
for (const heading of ['Characters and worlds', '56th Supreme Chapter Chicago', 'Suit of Diamonds', 'Traditional work']) {
  expect(primaryHtml(art).includes(heading), `artillustration.html: use the clear Art header “${heading}”.`);
}
for (const label of ['Selected illustrations', 'Event illustration', 'Card series', 'Traditional media']) {
  expect(primaryHtml(art).includes(`class="art-section-kicker">${label}</p>`),
    `artillustration.html: use the consistent Art family label “${label}”.`);
}
expect(art.includes('class="art-section-kicker"'),
  'artillustration.html: use small source-family kickers above the expressive Art headers.');
expect(art.includes('grid-template-columns: 1fr; align-items: end; border-top: 2px solid var(--orange)') &&
  art.includes('font-size: clamp(2.35rem, 4.5vw, 4.75rem)'),
  'artillustration.html: stack labels above smaller Art chapter headers.');
expect(art.includes('grid-template-columns: repeat(20, minmax(0, 1fr))'),
  'artillustration.html: use a 20-track Diamond grid for a deliberate 4 / 5 / 4 row rhythm.');
expect(art.includes('.art-diamonds figure:nth-child(n+5):nth-child(-n+9) { grid-column: span 4; }'),
  'artillustration.html: the middle Diamond row must contain five equal cards.');
expect(/is-selectric is-large[\s\S]*is-horned is-medium[\s\S]*is-old-one is-small/i.test(primaryHtml(art)),
  'artillustration.html: Selectric must lead, Horned Woman must be medium, and Old One must be smallest.');
expect(art.includes('.art-opening-stack .is-large { grid-column: span 6; }') &&
  art.includes('.art-opening-stack .is-medium { grid-column: span 4; }') &&
  art.includes('.art-opening-stack .is-small { grid-column: span 2; }'),
  'artillustration.html: preserve the large / medium / small opening hierarchy at every viewport.');
const diamondStack = art.match(/<div class="art-diamonds">([\s\S]*?)<\/div>/i)?.[1] ?? '';
expect(Boolean(diamondStack), 'artillustration.html: preserve the Suit of Diamonds stack.');
expect(!/<figcaption\b/i.test(diamondStack), 'artillustration.html: Diamond cards must not show individual labels.');
expect(/\.art-daysigns-grid\s*\{[^}]*width:\s*100%;[^}]*margin:\s*0;/s.test(art),
  'artillustration.html: Daysigns must align to the surrounding text and divider rail.');
expect(art.includes('.art-restored-wall { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); }') &&
  art.includes('.art-restored-wall figure:first-child { grid-column: span 6; grid-row: span 2; }') &&
  art.includes('.art-restored-wall figure:not(:first-child) { grid-column: span 3; }'),
  'artillustration.html: Traditional work must use one enlarged lead with a balanced two-by-two supporting matrix.');
}

const sharedMain = read('js/main.js');
expect(sharedMain.includes('stage.dataset.slideshowInterval') && !sharedMain.includes('const INTERVAL = 3000'),
  'js/main.js: read each slideshow cadence from its canonical data attribute instead of one hardcoded interval.');
expect(sharedMain.includes("img.setAttribute('role', 'button')") && sharedMain.includes("img.setAttribute('aria-haspopup', 'dialog')") && sharedMain.includes('img.tabIndex = 0'),
  'js/main.js: gallery images must expose keyboard-operable dialog-trigger semantics.');
expect(/pageImgs\.forEach\(\(img,\s*i\)\s*=>[\s\S]*?img\.addEventListener\('keydown'/m.test(sharedMain),
  'js/main.js: gallery images must open from Enter and Space.');
expect(sharedMain.includes('setBackgroundInert(true)') && sharedMain.includes('setBackgroundInert(false)'),
  'js/main.js: the lightbox must inert and restore non-dialog page content.');
expect(sharedMain.includes('lastTrigger') && sharedMain.includes('lastTrigger.focus({ preventScroll: true })'),
  'js/main.js: the lightbox must restore focus to the exact activating image without moving the page.');
expect(sharedMain.includes("'gallery-lightbox-open'") && sharedMain.includes("'gallery-lightbox-close'") && sharedMain.includes('wasRunningBeforeLightbox'),
  'js/main.js: an activated slideshow image must remain visible until lightbox focus is restored.');
expect(sharedMain.includes('lbClose.focus({ preventScroll: true })') && sharedMain.includes("e.key === 'Tab'") && sharedMain.includes('preservedScrollY'),
  'js/main.js: the lightbox must receive initial focus, contain Tab navigation, and preserve page position.');
const sharedCss = read('css/style.css');
expect(sharedCss.includes('.gallery-spotlight img:focus-visible') && sharedCss.includes('.gallery-grid img:focus-visible'),
  'css/style.css: gallery triggers need a visible keyboard focus indicator.');
expect(sharedCss.includes('outline-color: var(--orange)') && sharedCss.includes('outline-color: var(--acid)'),
  'css/style.css: Art and Graphic gallery focus indicators need high-contrast surface-specific colors.');
expect(/\.cursor-dot,\s*\.cursor-ring\s*\{[^}]*z-index:\s*10001/s.test(sharedCss) && /\.lightbox\s*\{[^}]*z-index:\s*9000/s.test(sharedCss),
  'css/style.css: the custom cursor must stack above the script-owned lightbox.');
expect(sharedMain.includes('syncCursorOverlayHost') && sharedMain.includes("document.querySelector('dialog[open]')"),
  'js/main.js: the custom cursor must move into native top-layer archive dialogs while open.');
expect(/\.nav-logo\s*\{[^}]*gap:\s*0/s.test(sharedCss) && /\.nav-logo-tran\s*\{[^}]*margin-left:\s*-0\.16em/s.test(sharedCss),
  'css/style.css: the shared Victor Tran wordmark must use the tighter Home-aligned lockup spacing.');

const ui = read('uigallery.html');
expect(ui.includes('generated:gallery-project-nav:start') && ui.includes('generated:gallery-project-nav:end'),
  'uigallery.html: include the gallery previous/next navigation before the shared footer.');
for (const [file, previous, next] of [
  ['artillustration.html', 'uigallery.html', 'graphicgallery.html'],
  ['graphicgallery.html', 'artillustration.html', 'uigallery.html'],
  ['uigallery.html', 'graphicgallery.html', 'artillustration.html'],
]) {
  const html = read(file);
  const nav = html.match(/<!-- generated:gallery-project-nav:start -->([\s\S]*?)<!-- generated:gallery-project-nav:end -->/)?.[1] ?? '';
  expect(nav.includes(`href="${previous}"`) && nav.includes(`href="${next}"`),
    `${file}: gallery navigation must point to its intended previous and next gallery.`);
}

if (scope !== 'art') {
const graphic = read('graphicgallery.html');
const graphicPrimary = primaryHtml(graphic);
const graphicMarkdown = read('content/graphicgallery.md');
const graphicIndexEntry = JSON.parse(read('content/site-index.json')).find((entry) => entry.source === 'graphicgallery.html');
expect(graphicMarkdown.includes("- Chantico's Flame illustration: images/logos-2.jpg"),
  'content/graphicgallery.md: preserve the full Chantico opener alt text, including its apostrophe.');
expect(graphicIndexEntry?.images?.find((image) => image.src === 'images/logos-2.jpg')?.alt === "Chantico's Flame illustration",
  'content/site-index.json: preserve the full Chantico opener alt text, including its apostrophe.');
expect(graphicPrimary.includes('<h1 class="archive-title" id="graphic-archive-title">Graphics. Design. Print.</h1>'),
  'graphicgallery.html: use the approved Graphic title verbatim.');
expect(graphicPrimary.includes('<p class="archive-lede">Identity, print, presentation, illustration, and event work from side projects, explorations, and collaborations.</p>'),
  'graphicgallery.html: use the approved Graphic supporting copy verbatim.');
expect(!graphicPrimary.includes('Graphic Design in motion.') && !graphicPrimary.includes('Identity, print, presentations, and applications. Edited by format, scale, and visual energy.'),
  'graphicgallery.html: remove superseded Graphic opening copy.');
expect(/<meta property="og:image" content="https:\/\/www\.victortrandesign\.com\/images\/logos-2\.jpg">/.test(graphic) &&
  /<meta property="og:image:width" content="1600">/.test(graphic) &&
  /<meta property="og:image:height" content="960">/.test(graphic),
  'graphicgallery.html: align Open Graph image metadata with the new Chantico opener.');
const opening = graphicPrimary.match(/<header class="graphic-opening">([\s\S]*?)<\/header>/i)?.[1] ?? '';
expect(/src="images\/logos-2\.jpg" width="1600" height="960" alt="Chantico's Flame illustration"/.test(opening),
  'graphicgallery.html: open with the standalone Chantico\'s Flame illustration and truthful metadata.');
const marksStack = graphicPrimary.match(/<div class="graphic-brand-grid">([\s\S]*?)<\/div>/i)?.[1] ?? '';
expect(/(?:\s)data-deferred-src="images\/graphic-archive-v2\/chantico\.webp"/.test(marksStack) && marksStack.includes('alt="Three illustrated Chantico bottle applications"') &&
  (marksStack.match(/(?:\s)src="images\/logos-2\.jpg"/g) ?? []).length === 0 && (graphicPrimary.match(/(?:\s)src="images\/logos-2\.jpg"/g) ?? []).length === 1 &&
  (graphicPrimary.match(/(?:\s)data-deferred-src="images\/graphic-archive-v2\/chantico\.webp"/g) ?? []).length === 1,
  'graphicgallery.html: literally swap Chantico assets so each approved asset appears once in its new position.');
expect(marksStack.indexOf('data-deferred-src="images/gg-day-of-giving.png"') >= 0 && marksStack.indexOf('data-deferred-src="images/graphic-archive-v2/dog.webp"') >= 0 &&
  Math.abs(marksStack.indexOf('data-deferred-src="images/gg-day-of-giving.png"') - marksStack.indexOf('data-deferred-src="images/graphic-archive-v2/dog.webp"')) < 1300,
  'graphicgallery.html: keep the Day of Giving event graphic adjacent to its logo study in the visible marks group.');
const eventsStack = graphicPrimary.match(/<div class="graphic-events">([\s\S]*?)<\/div>/i)?.[1] ?? '';
expect(!eventsStack.includes('dog.webp') && eventsStack.includes('abex.webp'),
  'graphicgallery.html: rebalance events around AbEx after moving Day of Giving to its logo study.');
for (const eventAsset of ['ibm-paltron-illustration-system.webp', 'wxo-illustration-system.webp']) {
  expect(eventsStack.includes(eventAsset), `graphicgallery.html: Campaigns and illustration systems is missing ${eventAsset}.`);
}
expect(!graphicPrimary.includes('sc56-instagram-panel-series.webp'),
  'graphicgallery.html: remove the duplicated Chicago Instagram three-panel composite.');
expect(graphic.includes('.graphic-brand-grid .is-third { grid-column: span 4; aspect-ratio: 4 / 3; display: grid; place-items: center;') &&
  graphic.includes('.graphic-brand-grid .is-third img { width: 100%; height: 100%; object-fit: contain; }'),
  'graphicgallery.html: normalize the three-across identity row with equal contain-fit frames.');
expect(!/\.graphic-archive-v2 \.graphic-wide \{[^}]*border-bottom:\s*18px solid var\(--pink\)/i.test(graphic),
  'graphicgallery.html: remove the pink bottom stripe from the wide infographic treatment.');
expect(!primaryHtml(graphic).includes('—'), 'graphicgallery.html: primary copy must not use em dashes.');
expect(!/<figcaption\b/i.test(primaryHtml(graphic)),
  'graphicgallery.html: primary artwork should not carry small object labels.');
expect(!primaryHtml(graphic).includes('class="archive-note"'),
  'graphicgallery.html: use the same clean label/title hierarchy as Art without explanatory header notes.');
for (const [label, heading] of [
  ['Project graphics', 'EDC / Boombox'],
  ['Identity system', 'Southeastern Greek Leadership Association'],
  ['Presentation design', 'Selected slide work'],
  ['Brand applications', 'Marks and applications'],
  ['Selected visual systems', 'Campaigns and illustration systems'],
]) {
  expect(primaryHtml(graphic).includes(`class="graphic-section-kicker">${label}</p>`) && primaryHtml(graphic).includes(`>${heading}</h2>`),
    `graphicgallery.html: use the aligned text pair “${label} / ${heading}”.`);
}
for (const redundantLabel of ['Illustration', 'Information design']) {
  expect(!graphicPrimary.includes(`class="graphic-section-kicker">${redundantLabel}</p>`),
    `graphicgallery.html: remove the redundant Graphic kicker “${redundantLabel}”.`);
}
expect(graphic.includes('border-top: 2px solid var(--pink)') && graphic.includes('color: var(--acid)') &&
  graphic.includes('font-size: clamp(2.35rem, 4.5vw, 4.75rem)'),
  'graphicgallery.html: reuse the Art label/title treatment with Graphic-specific colors and type.');
const edcStack = graphic.match(/<div class="graphic-edc">([\s\S]*?)<\/div>/i)?.[1] ?? '';
expect((edcStack.match(/class="archive-frame is-half"/g) ?? []).length === 4,
  'graphicgallery.html: EDC must return to an even 2 × 2 block.');
expect(graphic.includes('.graphic-edc img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover;'),
  'graphicgallery.html: EDC tiles must share one 4:3 crop so both rows align evenly.');
const presentationStack = graphic.match(/<div class="graphic-slides is-compact">([\s\S]*?)<\/div>/i)?.[1] ?? '';
expect((presentationStack.match(/data-presentation-primary/g) ?? []).length === 16,
  'graphicgallery.html: restore all 16 presentation slides in the compact primary contact sheet.');
for (let slide = 1; slide <= 16; slide += 1) {
  expect(presentationStack.includes(`src="images/gg-slides-${slide}.jpg"`),
    `graphicgallery.html: compact presentation grid is missing gg-slides-${slide}.jpg.`);
}
const sglaStack = graphic.match(/<div class="graphic-sgla">([\s\S]*?)<\/div>/i)?.[1] ?? '';
for (const duplicateSlide of ['gg-slides-3.jpg', 'gg-slides-6.jpg', 'gg-slides-7.jpg', 'gg-slides-13.jpg']) {
  expect(!sglaStack.includes(duplicateSlide),
    `graphicgallery.html: remove duplicated presentation asset ${duplicateSlide} from the SGLA identity section.`);
}
for (const sglaAsset of [
  'images/graphic-archive-v2/sgla-2024-identity-development.webp',
  'images/graphic-archive-v2/sgla-2023-brand-guidelines.webp',
  'images/graphic-archive-v2/sgla-2024-signage-system.webp',
  'images/graphic-archive-v2/sgla-2024-ballroom-system.webp',
]) {
  expect((sglaStack.match(new RegExp(`(?:\\s)data-deferred-src="${sglaAsset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g')) ?? []).length === 1,
    `graphicgallery.html: SGLA identity section must contain ${sglaAsset} exactly once.`);
}
expect(graphic.includes('<p class="graphic-section-kicker">Identity system</p><h2 id="graphic-sgla-title">'),
  'graphicgallery.html: describe SGLA as an identity system instead of repeating presentation work.');
expect((primaryHtml(graphic).match(/data-sgla-primary/g) ?? []).length >= 5,
  'graphicgallery.html: replace the rejected logo row with a substantial SGLA grouping.');
for (const genericAlt of ['alt="Logo"', 'alt="Hero"', 'alt="Slide 3"', 'alt="Infographic"']) {
  expect(!graphic.includes(genericAlt), `graphicgallery.html: replace generic accessibility debt ${genericAlt}.`);
}
}

if (failures.length) {
  console.error(`Visual archives sprint contract failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Visual archives integration contract passed for scope=${scope}.`);
