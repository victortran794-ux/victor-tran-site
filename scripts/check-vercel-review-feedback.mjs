import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const html = {
  home: read('index.html'),
  about: read('about.html'),
  wxo: read('wxo-canvas.html'),
  doc: read('document-processing.html'),
  patterns: read('ibm-patterns.html'),
  pikapp: read('pikappapp.html'),
  ui: read('uigallery.html'),
  pci: read('pci.html'),
};
const css = {
  shared: read('css/style.css'),
  wxo: read('css/wxo-public-candidate.css'),
  pikapp: read('css/pikappapp.css'),
  ui: read('css/ui-gallery.css'),
  pci: read('css/pci-vico2.css'),
};
const main = read('js/main.js');
const projects = JSON.parse(read('data/projects.json'));
const generator = read('scripts/generate-project-sections.mjs');
const failures = [];
const need = (condition, message) => { if (!condition) failures.push(message); };
const has = (source, token, message = token) => need(source.includes(token), message);
const lacks = (source, token, message = token) => need(!source.includes(token), message);

// Home: varied gallery color, legible DNA, elastic arrival, and one public wxO link.
const bySlug = new Map(projects.projects.map((project) => [project.slug, project]));
need(bySlug.get('artillustration')?.surface === 'orange', 'Art gallery card must keep orange surface.');
need(bySlug.get('graphicgallery')?.surface === 'purple', 'Graphic gallery card must keep purple surface.');
need(bySlug.get('uigallery')?.surface === 'teal', 'Interface Studies gallery card must use teal surface.');
need(bySlug.get('wxo-canvas')?.homepageBonus === 'There’s a bonus one here', 'wxO manifest must own the non-link bonus note.');
has(generator, 'homepageBonus', 'Homepage generator must own optional bonus notes.');
has(html.home, 'class="featured-item-bonus"', 'Generated wxO card must expose the non-link bonus note.');
has(main, 'initWorkArrival', 'Home runtime must own a bounded work-arrival interaction.');
has(css.shared, '@keyframes work-arrival-bounce', 'Home work target must have a spring arrival keyframe.');
has(css.shared, '.featured.is-work-arriving', 'Home work section must expose the arrival state.');
need(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?is-work-arriving/.test(css.shared), 'Work arrival must have a reduced-motion fallback.');
need(/\.home-page--engraved-dna \.hero-dna-label\s*\{[^}]*font-size:\s*0\.72rem/i.test(css.shared), 'Desktop DNA labels must use readable 0.72rem type.');
need(/\.home-page--engraved-dna \.hero-dna-swatch-name,[\s\S]*?font-size:\s*0\.64rem/i.test(css.shared), 'Desktop DNA token text must use readable 0.64rem type.');
has(css.shared, '.featured-item--surface-teal .featured-item-content', 'Homepage gallery must support teal card bodies.');
need(/\.featured-item--surface-teal \.featured-item-desc\s*\{\s*color:\s*#ffffff;/is.test(css.shared), 'Teal gallery description text must use full white for WCAG AA contrast.');

// wxO / Document Processing: honest theme-aware evidence, space, and a prominent return.
for (const file of [
  '15-node-key-states-dark.png',
  '16-node-size-variants-dark.png',
  '17-flow-control-elements-dark.png',
  '18-flow-control-containers-dark.png',
  '19-application-example-dark.png',
  '21-workflow-anchors-dark.png',
]) {
  has(html.wxo, file, `wxO must render ${file}.`);
}
lacks(html.wxo, 'pilot-main-illustration', 'wxO must not repeat the Home illustration.');
lacks(html.wxo, 'pilot-vignettes', 'wxO must retire illustrative vignettes.');
has(html.home, 'wxo-home-thumbnail-dark.png', 'Home must retain the authored Dark thumbnail.');
has(html.wxo, 'pilot-exploration-grid pilot-exploration-grid--node', 'wxO node library must use the paired exploration-panel grid.');
has(html.wxo, '15-node-key-states-light.png', 'wxO node library must retain the owner-supplied Light exploration.');
has(html.wxo, '15-node-key-states-dark.png', 'wxO node library must pair the owner-supplied Dark exploration.');
has(css.wxo, '.pilot-canvas-media-stack', 'Historical Canvas must share the Canvas opening media stack.');
need(/\.wxo-public-pilot \.pilot-history-canvas\s*\{[^}]*padding:[^}]*border-radius:/is.test(css.wxo), 'Historical Canvas must retain a padded bounded media wrapper.');
has(html.wxo, 'data-title="Historical Canvas"', 'wxO must describe Historical Canvas without an unsupported release claim.');
has(html.wxo, '<strong>Historical Canvas</strong><span>Authored Light and Dark views follow the selected theme.</span>', 'wxO historical Canvas caption must stay theme- and provenance-bounded.');
need(!/(?:data-title|data-caption|alt|figcaption)[^>]*(?:Released Canvas|released product|preserved as released|release view)/i.test(html.wxo), 'wxO visitor-facing media labels must not imply independently unverified release status.');
has(css.wxo, '.doc-motion-section', 'Accuracy Evaluation motion block must own top spacing.');
need(/\.wxo-public-pilot \.doc-motion-section\s*\{[^}]*padding-top:/is.test(css.wxo), 'Accuracy Evaluation must have explicit top breathing room.');
has(html.doc, 'class="workflow-return-link workflow-return-link--prominent"', 'Document Processing must end with a prominent Canvas return.');
has(css.wxo, '.workflow-return-link--prominent', 'Prominent Canvas return must have a dedicated treatment.');
need(/\.wxo-public-pilot \.doc-current-stage-head\s*\{[^}]*gap:\s*clamp\(10px/is.test(css.wxo), 'Document Processing stage number must sit closer to its heading.');
// IBM Patterns: simpler, subtler close without the rejected caveat sentences.
lacks(html.patterns, 'The IBM Patterns prototype did not become the production page.', 'Remove rejected prototype sentence.');
lacks(html.patterns, 'The future-state concept did not become the production page.', 'Remove the rephrased production-page disclaimer too.');
lacks(html.patterns, 'What I remember carrying forward', 'Remove rejected recollection phrasing.');
has(html.patterns, 'The useful idea was simple:', 'IBM Patterns close must use the approved simpler reflection.');

// Pi Kapp: four chapter starts, no Mark & pattern card, complete uncropped screens, calmer grid.
need((html.pikapp.match(/<li><a href="#chapter-/g) || []).length === 4, 'Pi Kapp chapter index must contain four starts.');
need((html.pikapp.match(/data-chapter/g) || []).length === 4, 'Pi Kapp must render four chapter sections.');
lacks(html.pikapp, 'id="chapter-5"', 'Pi Kapp must not retain a fifth chapter.');
lacks(html.pikapp, 'Mark &amp; pattern', 'Pi Kapp must remove the Mark & pattern section.');
lacks(html.pikapp, 'identity-board__card--pattern', 'Pi Kapp must remove the Mark & pattern card.');
has(html.pikapp, 'id="chapter-4" data-chapter aria-labelledby="coda-title"', 'Final remaster must become chapter 04.');
lacks(html.pikapp, 'identity-board', 'Retired identity board must not return.');
has(html.pikapp, 'class="v2-change-ledger"', 'V2 must retain concise alterations beside its screens.');
need(/\.pikapp-page \.coda__triptych\s*\{[^}]*grid-template-columns:\s*repeat\(3,/is.test(css.pikapp), 'Final remaster desktop must use two three-up rows.');
need(/\.pikapp-page \.coda__frame\s*\{[^}]*overflow:\s*visible[^}]*border-radius:\s*0/is.test(css.pikapp), 'Final remaster must remove the extra rounded crop shell.');
need(/\.pikapp-page \.coda__image\s*\{[^}]*object-fit:\s*contain[^}]*border-radius:\s*0/is.test(css.pikapp), 'Final remaster screens must remain complete and uncropped.');

// Shared shell/About: compact wordmark, right-aligned controls, hover polish, one outline-shape family.
need(/\.nav-logo\s*\{[^}]*gap:\s*0(?:px)?\s*;/is.test(css.shared), 'Shared Victor Tran wordmark must use the approved tight zero-gap lockup.');
need(/\.nav-inner\s*\{[^}]*justify-content:\s*space-between/is.test(css.shared), 'Shared header controls must align to the right edge.');
has(css.shared, '.lens-switcher-btn:hover', 'Header theme controls must retain a visible hover state.');
has(html.about, 'class="about-bio-lead"', 'About opening paragraph must have a distinct intermediate lead role.');
need(/\.about-bio-lead\s*\{[^}]*font-size:\s*clamp\(1\.35rem,/is.test(css.shared), 'About opening must use an intermediate header scale.');
has(css.shared, '--shape-cue-size:', 'Shared shell must define one outline-shape cue token.');
lacks(html.home, 'shape-cue', 'Home must not restore the rejected diamond.');
lacks(generator, 'shape-cue', 'Home generator must not regenerate the rejected diamond.');
lacks(html.home, 'featured-item-shell', 'Home must not restore the competing related-link shell.');
lacks(html.home, 'featured-item-related', 'Home must retain one wxO action, not a second Document Processing link.');
has(html.home, 'featured-practice', 'Current practice must remain integrated into the wxO card.');
has(html.home, '<em>There’s a bonus one here</em>', 'The bonus note must remain subdued supporting copy.');
need(/@media\s*\(max-width:\s*720px\)[\s\S]*?\.featured-list,[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\);/i.test(css.shared), 'Home mobile project grid must use a zero-minimum single track.');

// Interface Studies: Ekos desktop/mobile share one contained pair.
has(html.ui, 'ui-study-grid--ekos-paired', 'Ekos desktop and mobile must use the paired container layout.');
need(/\.ui-study-grid--ekos-paired\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1\.65fr\)\s+minmax\(220px,\s*\.75fr\)/is.test(css.ui), 'Ekos desktop/mobile must sit side by side with deliberate hierarchy.');
need(/\.ui-study-grid--ekos-paired\s*>\s*\.ui-study-view\s*\{[^}]*border-radius:/is.test(css.ui), 'Both Ekos views must receive one container treatment.');

// PCI: larger full-page evidence, fewer wonky crop captions, portrait application leads its row.
has(html.pci, 'pci-artifact-quartet pci-artifact-quartet--editorial', 'PCI interior examples must use the refined editorial grid.');
need((html.pci.match(/<figcaption class="pci-caption">/g) || []).length <= 6, 'PCI must reduce redundant artifact captions.');
has(css.pci, '.pci-artifact-quartet--editorial', 'PCI must own a larger editorial evidence composition.');
need(/\.pci-artifact--portrait\s*\{[^}]*grid-column:\s*span\s*2/is.test(css.pci), 'PCI portrait application board must receive larger full-page emphasis.');

if (failures.length) {
  console.error('VERCEL REVIEW FEEDBACK CONTRACT: FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('VERCEL REVIEW FEEDBACK CONTRACT: PASS');
