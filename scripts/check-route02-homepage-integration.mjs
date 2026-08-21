#!/usr/bin/env node
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const failures = [];
const requireCondition = (condition, message) => {
  if (!condition) failures.push(message);
};
const requireText = (text, value, message) => requireCondition(text.includes(value), message);
const forbid = (text, pattern, message) => requireCondition(!pattern.test(text), message);

const index = read('index.html');
const css = read('css/style.css');
const generator = read('scripts/generate-project-sections.mjs');
const wxo = read('wxo-canvas.html');
const manifest = JSON.parse(read('data/projects.json'));
const projects = manifest.projects ?? [];
const bySlug = new Map(projects.map(project => [project.slug, project]));

const homepageProjects = projects.filter(project => project.homepage);
requireCondition(homepageProjects[0]?.slug === 'wxo-canvas',
  'IBM watsonx Orchestrate must remain the first homepage project while it stays protected.');
const approvedRecruiterCopy = new Map([
  ['ibmcloud', 'Research, product workflows, and reusable visual methods for IBM Cloud Observability.'],
  ['abilityexperience', 'A brand identity and practical toolkit for a Pi Kappa Phi initiative supporting people with disabilities.'],
  ['pikappapp', "A member-facing app concept connecting milestones, chapter activity, and Pi Kappa Phi's visual identity."],
]);
for (const [slug, description] of approvedRecruiterCopy) {
  requireCondition(bySlug.get(slug)?.description === description,
    `${slug} manifest description must use the approved recruiter-scan copy.`);
  requireText(index, description,
    `${slug} homepage card must render the approved recruiter-scan copy.`);
}

// Preserve the selected signature hero while applying the approved Route 02 refinements.
for (const token of [
  'class="hero"',
  'class="hero-typeblock"',
  'class="hero-portraits"',
  'class="hero-meta"',
  'class="hero-services"',
  'class="hero-cycle"',
  '>Victor</span>',
  '>TRAN</span>',
  'I design cool things with sincerity.',
]) requireText(index, token, `Route 02 must preserve the signature hero token: ${token}`);

// Keep the homepage's social preview on a dedicated LinkedIn/Open Graph crop rather than
// asking crawlers to resize and crop the taller on-page hero asset.
const socialCardPath = 'images/victor-tran-social-card.jpg';
for (const token of [
  '<meta property="og:image" content="https://www.victortrandesign.com/images/victor-tran-social-card.jpg">',
  '<meta property="og:image:width" content="1200">',
  '<meta property="og:image:height" content="627">',
  '<meta property="og:image:type" content="image/jpeg">',
  '<meta name="twitter:image" content="https://www.victortrandesign.com/images/victor-tran-social-card.jpg">',
]) requireText(index, token, `Homepage social-preview metadata is missing: ${token}`);
requireCondition(fs.existsSync(socialCardPath), 'Homepage social-preview image must exist.');
if (fs.existsSync(socialCardPath)) {
  requireCondition(fs.statSync(socialCardPath).size > 100_000, 'Homepage social-preview image is unexpectedly small and may be blurry.');
}

requireText(css, '.hero-typeblock {', 'Route 02 hero type block CSS is missing.');
requireCondition(/\.hero-typeblock\s*\{[^}]*left:\s*var\(--route02-x\);[^}]*transform:\s*translateY\(-50%\)/.test(css),
  'Victor TRAN must use the same left grid token as the hero copy.');
requireText(css, '--hero-name-size: clamp(7rem, 14.5vw, 13.5rem);',
  'Desktop Victor needs the approved name-first scale.');
requireText(css, 'font-size: calc(var(--hero-name-size) * 0.76);',
  'Desktop TRAN needs the approved reduced scale.');
requireCondition(/@media\s*\(max-width:\s*600px\)[\s\S]*?\.hero-typeblock\s*\{[^}]*left:\s*var\(--route02-x\)/.test(css),
  'Mobile Victor TRAN must remain on the shared grid token.');
requireText(css, 'max-width: 280px;', 'Top-left hero content needs the approved compact width.');
requireText(css, '.hero-cycle .control-tooltip {', 'Hero color control tooltip must remain available.');
requireText(index, '<span class="control-tooltip" aria-hidden="true">Change color</span>',
  'Hero tooltip must avoid duplicating the button accessible name.');
requireText(css, 'min-width: 44px;', 'Hero color control must preserve its 44px target.');
requireText(css, 'padding: 0 12px;', 'Hero color control needs the approved smaller visual shell.');

// Remove low-value homepage navigation mechanics and let the card grid carry the page.
forbid(index, /class="marquee"/, 'The low-value marquee must remain removed.');
forbid(index, /featured-tracklist|now-playing-chip|data-now-playing-/,
  'Homepage chapter tracklist and now-playing controls must be removed.');
forbid(index, /class="featured-chapter/, 'Large chapter headers must not interrupt the flush card grid.');
requireCondition((index.match(/class="featured-heading"/g) ?? []).length === 1,
  'Homepage needs exactly one compact archive heading.');
requireText(index, 'id="featuredHeading">Other cool things to check out</h2>',
  'Compact homepage heading must preserve Victor’s approved casual phrase.');
forbid(index, /Product Systems · Protected/, 'Homepage must not label IBM watsonx Orchestrate as Protected.');
forbid(index, /View Protected Case Study/, 'Homepage CTA must not repeat the protected state.');
requireText(css, '.featured-item .section-label::before {', 'All homepage project labels need one consistent square marker.');
requireText(index, 'id="galleries" role="group" aria-label="Art, graphic design, and UI galleries"',
  'Final gallery chapter needs an explicit accessible group name.');
requireText(index, '<h3 class="featured-galleries-title">And some galleries.</h3>',
  'Final gallery chapter needs Victor’s approved casual heading.');
forbid(index, /class="featured-galleries-intro"/,
  'Final gallery pair must not repeat Art and Graphic Design in a visible subgroup header and intro.');
forbid(css, /\.featured-galleries-intro/,
  'Removed gallery intro markup must not leave stale responsive CSS behind.');
requireCondition((index.match(/class="featured-item-lock"/g) ?? []).length === 1,
  'Homepage needs exactly one lock on the IBM watsonx Orchestrate card.');
requireText(index, 'aria-label="Password required"', 'Homepage lock needs an accessible password-required label.');
requireText(css, '.featured-item-lock {', 'Homepage lock styling is missing.');
forbid(index, /Visual archive/, 'Visual archive framing must be replaced.');
forbid(index, />Creative work<\/p>/i, 'Gallery pair must not carry a redundant eyebrow label.');
requireText(css, '.featured-galleries .featured-item--gallery {', 'Final gallery links need a distinct cover treatment.');
requireText(css, 'grid-column: span 6;', 'The first two gallery covers need equal desktop weight.');
requireText(css, '.featured-galleries .featured-item--gallery.featured-item--span-12 {',
  'The third UI Gallery cover needs a deliberate full-width desktop treatment.');

// Preserve the live Ability and Star & Lamp card anatomy.
requireCondition(/abilityexperience\.html" class="[^"]*featured-item--span-7[^"]*featured-item--surface-ability/.test(index),
  'The Ability Experience must preserve its live span-7 identity card.');
requireCondition(/salmagazine\.html" class="[^"]*featured-item--span-7[^"]*featured-item--surface-orange/.test(index),
  'Star & Lamp must preserve its live span-7 orange card.');
for (const title of ['The Ability Experience', 'Star &amp; Lamp Magazine']) {
  requireText(index, title, `Existing card title must remain: ${title}`);
}
requireText(css, 'grid-template-columns: repeat(12, minmax(0, 1fr));',
  'Homepage cards must preserve the live twelve-column grid.');
requireText(css, '.featured-item--span-7 { grid-column: span 7; }',
  'Live span-7 card variant must remain.');
requireText(css, '.featured-item--span-5 { grid-column: span 5; }',
  'Live span-5 card variant must remain.');

// Add exactly one overlay variant, owned by wxO Canvas.
const wxoProject = bySlug.get('wxo-canvas');
requireCondition(Boolean(wxoProject), 'wxO Canvas must exist in the project manifest.');
if (wxoProject) {
  for (const [key, value] of Object.entries({
    title: 'IBM watsonx Orchestrate',
    url: 'wxo-canvas.html',
    entryUrl: 'wxo-canvas.html?lock=1',
    category: 'Product Systems',
    cta: 'View Case Study',
    nav: true,
    homepage: true,
    wide: true,
    protected: true,
    noindex: true,
    sitemap: false,
    homepageVariant: 'lead',
    homepageOverlay: true,
    homepageLock: true,
  })) requireCondition(wxoProject[key] === value, `wxO Canvas manifest ${key} must equal ${String(value)}.`);
  requireCondition(wxoProject.images?.length === 1, 'wxO homepage entry must use one thumbnail asset.');
  requireCondition(wxoProject.images?.[0]?.src === 'images/wxo-canvas/wxo-home-thumbnail.png',
    'IBM watsonx Orchestrate must use the approved Agentic workflow canvas thumbnail.');
}
const documentProject = bySlug.get('document-processing');
requireCondition(documentProject?.homepage === false && documentProject?.nav === false,
  'Document Processing must be hidden from homepage and primary navigation.');
requireCondition(documentProject?.protected === true && documentProject?.noindex === true && documentProject?.sitemap === false,
  'Document Processing privacy flags must remain protected.');
requireCondition((index.match(/featured-item--overlay/g) ?? []).length === 1,
  'Homepage must contain exactly one overlaid card variant.');
requireCondition(/wxo-canvas\.html\?lock=1" class="[^"]*featured-item--lead[^"]*featured-item--overlay/.test(index),
  'wxO must own the full-width overlay card.');
requireText(generator, "if (project.homepageOverlay) classes.push('featured-item--overlay');",
  'Manifest generator must reproduce the wxO overlay class.');
requireCondition(!generator.includes('chapterMarkerMarkup'),
  'Homepage generator must not regenerate chapter headers.');
requireText(css, '.featured-item--overlay {', 'Overlay card CSS is missing.');
requireText(css, '.featured-item--overlay .featured-item-content {', 'Overlay tile CSS is missing.');
requireText(index, '<body class="home-page">', 'Route 02 homepage needs a locally scoped layout token.');
requireText(css, '--route02-x: clamp(48px, 5vw, 76.8px);', 'Route 02 desktop inset must cap at 76.8px.');
requireText(css, '--route02-x: 22px;', 'Route 02 exact-390 inset must resolve to 22px.');
for (const selector of ['.hero-typeblock', '.hero-meta', '.hero-services', '.featured-heading']) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  requireCondition(new RegExp(`${escaped}\\s*\\{[^}]*var\\(--route02-x\\)`, 's').test(css),
    `${selector} must use the shared Route 02 inset.`);
}

// Homepage cards are links, never miniature applications.
for (const card of index.matchAll(/<a\s+[^>]*class="[^"]*featured-item[^"]*"[\s\S]*?<\/a>/g)) {
  forbid(card[0], /<button|role="tab"|role="tablist"|data-story|chapter-nav/i,
    'Homepage project cards must not contain buttons, tabs, switchers, or chapter controls.');
  requireCondition((card[0].match(/class="featured-item-img/g) ?? []).length === 1,
    'Each homepage card needs one dominant media region.');
  requireCondition((card[0].match(/class="featured-item-content/g) ?? []).length === 1,
    'Each homepage card needs one compact text region.');
}
forbid(index, /document-processing-(storyboard|review|evaluation)|future-(inventory|builder|debug)/i,
  'Homepage must not expose Document Processing or future-state wxO media.');

// Chapter switching belongs only on the protected wxO route.
requireText(wxo, 'href="#canvas"', 'Protected wxO page needs a Canvas chapter control.');
requireText(wxo, 'href="#document-processing"', 'Protected wxO page needs a Document Processing chapter control.');
requireText(wxo, 'id="canvas"', 'Canvas must be the default protected chapter.');
requireText(wxo, 'id="document-processing"', 'Document Processing must be the second protected chapter.');
forbid(wxo, /Canvas Future|future-(inventory|builder|debug)-sanitized/i,
  'Future-state wxO material must remain withheld from the ordinary protected path.');

if (failures.length) {
  console.error('ROUTE 02 HOMEPAGE INTEGRATION CONTRACT: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('ROUTE 02 HOMEPAGE INTEGRATION CONTRACT: PASS');
console.log('- live staggered cards preserved; wxO owns the single overlay variant');
console.log('- homepage controls removed; protected wxO owns chapter navigation');
