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
  'IBM watsonx Orchestrate must remain the first public homepage project.');
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

// Preserve the accepted Engraved Design DNA signature hero and Route 02 content.
for (const token of [
  'class="hero"',
  'class="hero-typeblock"',
  'class="hero-identity"',
  'class="hero-intro-row"',
  'class="hero-dna-trigger"',
  'id="heroDnaPanel"',
  'class="hero-meta"',
  'class="hero-services"',
  '>Victor</span>',
  '>Tran</span>',
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
forbid(index, /class="hero-cycle"|class="hero-cycle-label"|>Change color<\/span>/,
  'Retired independent color-cycle controls must not return.');
requireCondition(/class="hero-dna-trigger"[^>]*aria-expanded="false"[^>]*aria-controls="heroDnaPanel"/.test(index),
  'Portrait Design DNA trigger must expose the accepted inline-disclosure relationship.');

// Remove low-value homepage navigation mechanics and let the card grid carry the page.
forbid(index, /class="marquee"/, 'The low-value marquee must remain removed.');
forbid(index, /featured-tracklist|now-playing-chip|data-now-playing-/,
  'Homepage chapter tracklist and now-playing controls must be removed.');
forbid(index, /class="featured-chapter/, 'Large chapter headers must not interrupt the flush card grid.');
requireCondition((index.match(/class="featured-heading"/g) ?? []).length === 1,
  'Homepage needs exactly one compact archive heading.');
requireText(index, 'id="featuredHeading">Other cool things to check out</h2>',
  'Compact homepage heading must preserve Victor’s approved casual phrase.');
requireCondition(/\.home-page--engraved-dna\s+\.featured-heading h2\s*\{[^}]*font-size:\s*clamp\(1\.35rem,\s*2vw,\s*1\.65rem\)/is.test(css),
  'Other cool things heading type must be approximately double its former 0.78rem size.');
forbid(index, /Product Systems · Protected/, 'Homepage must not label IBM watsonx Orchestrate as Protected.');
forbid(index, /View Protected Case Study/, 'Homepage CTA must not repeat the protected state.');
requireText(css, '.featured-item .section-label::before {', 'All homepage project labels need one consistent square marker.');
requireText(index, 'id="galleries" role="group" aria-label="Art, graphic design, and interface studies"',
  'Final gallery chapter needs an explicit accessible group name.');
requireText(index, '<h3 class="featured-galleries-title">And some galleries.</h3>',
  'Final gallery chapter needs Victor’s approved casual heading.');
forbid(index, /class="featured-galleries-intro"/,
  'Final gallery pair must not repeat Art and Graphic Design in a visible subgroup header and intro.');
forbid(css, /\.featured-galleries-intro/,
  'Removed gallery intro markup must not leave stale responsive CSS behind.');
requireCondition((index.match(/class="featured-item-lock"/g) ?? []).length === 0,
  'Public wxO homepage card must not retain a lock treatment.');
forbid(index, /aria-label="Password required"/, 'Public wxO homepage card must not retain a password-required label.');
forbid(index, /Visual archive/, 'Visual archive framing must be replaced.');
forbid(index, />Creative work<\/p>/i, 'Gallery pair must not carry a redundant eyebrow label.');
requireText(css, '.featured-galleries .featured-item--gallery {', 'Final gallery links need a distinct cover treatment.');
requireText(css, 'grid-column: span 4;', 'The three gallery covers need equal desktop weight.');
requireCondition((index.match(/featured-item--gallery featured-item--span-4/g) ?? []).length === 3,
  'Art, Graphic Design, and Interface Studies must render as three equal-width gallery cards.');
forbid(index, /uigallery\.html" class="[^"]*featured-item--span-12/,
  'Interface Studies must not retain the exceptional full-width treatment.');
forbid(css, /\.featured-galleries \.featured-item--gallery\.featured-item--span-12/,
  'Retired full-width gallery-card CSS must not remain.');

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

// wxO remains the single lead card, with integrated practice and bonus copy.
const wxoProject = bySlug.get('wxo-canvas');
requireCondition(Boolean(wxoProject), 'wxO Canvas must exist in the project manifest.');
if (wxoProject) {
  for (const [key, value] of Object.entries({
    title: 'IBM watsonx Orchestrate',
    url: 'wxo-canvas.html',
    category: 'Product Systems',
    cta: 'View Case Study',
    nav: true,
    homepage: true,
    wide: true,
    protected: false,
    noindex: false,
    sitemap: true,
    homepageVariant: 'lead',
    homepageOverlay: true,
  })) requireCondition(wxoProject[key] === value, `wxO Canvas manifest ${key} must equal ${String(value)}.`);
  requireCondition(wxoProject.entryUrl === undefined, 'Public wxO manifest must not retain a lock entry URL.');
  requireCondition(wxoProject.homepageLock === undefined, 'Public wxO manifest must not retain a homepage lock flag.');
  requireCondition(wxoProject.images?.length === 1, 'wxO homepage entry must use one thumbnail asset.');
  requireCondition(wxoProject.images?.[0]?.src === 'images/wxo-canvas/wxo-home-thumbnail.png',
    'IBM watsonx Orchestrate must use the approved Agentic workflow canvas thumbnail.');
}
const documentProject = bySlug.get('document-processing');
requireCondition(documentProject?.homepage === false && documentProject?.nav === false,
  'Document Processing must be hidden from homepage and primary navigation.');
requireCondition(documentProject?.protected === false && documentProject?.noindex === false && documentProject?.sitemap === true,
 'Document Processing must be public and indexable without a competing Home card.');
requireCondition((index.match(/class="[^"]*featured-item-shell[^"]*"/g) ?? []).length === 0,
  'Homepage must not retain the retired wxO overlay shell.');
requireCondition((index.match(/<a href="wxo-canvas\.html" class="[^"]*featured-item--lead[^"]*"/g) ?? []).length === 1,
  'Homepage must contain one public wxO lead-card link.');
requireText(index, '<p class="featured-practice"><span>Current practice</span><strong>Visual Designer</strong><span>Enterprise AI · Product systems · Visual craft</span><span>Austin, Texas</span></p>',
  'Public wxO lead card must integrate the approved current-practice detail.');
requireText(index, '<em>There’s a bonus one here</em>', 'Public wxO lead card must retain the approved italic bonus.');
requireText(generator, "if (project.homepageOverlay) classes.push('featured-item--overlay');",
  'Manifest generator must reproduce the wxO overlay class.');
requireCondition(!generator.includes('chapterMarkerMarkup'),
  'Homepage generator must not regenerate chapter headers.');
requireText(css, '.featured-item--overlay {', 'Overlay card CSS is missing.');
requireText(css, '.featured-item--overlay .featured-item-content {', 'Overlay tile CSS is missing.');
requireText(index, '<body class="home-page home-page--engraved-dna">',
  'Route 02 homepage needs the canonical Engraved DNA scope token.');
requireText(css, '--route02-x: clamp(48px, 5vw, 76.8px);', 'Route 02 desktop inset must cap at 76.8px.');
requireText(css, '--route02-x: 22px;', 'Route 02 exact-390 inset must resolve to 22px.');
for (const selector of ['.hero-identity', '.hero-meta', '.hero-services', '.featured-heading']) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  requireCondition(new RegExp(`${escaped}\\s*\\{[^}]*var\\(--route02-x\\)`, 's').test(css),
    `${selector} must use the shared Route 02 inset.`);
}

// Homepage cards are links, never miniature applications.
for (const card of index.matchAll(/<a\s+([^>]*)>([\s\S]*?)<\/a>/g)) {
  const classes = card[1].match(/class="([^"]*)"/)?.[1].split(/\s+/) ?? [];
  if (!classes.includes('featured-item')) continue;
  forbid(card[0], /<button|role="tab"|role="tablist"|data-story|chapter-nav/i,
    'Homepage project cards must not contain buttons, tabs, switchers, or chapter controls.');
  requireCondition((card[0].match(/class="featured-item-img/g) ?? []).length === 1,
    'Each homepage card needs one dominant media region.');
  requireCondition((card[0].match(/class="featured-item-content/g) ?? []).length === 1,
    'Each homepage card needs one compact text region.');
}
forbid(index, /document-processing-(storyboard|review|evaluation)|future-(inventory|builder|debug)/i,
  'Homepage must not expose Document Processing or future-state wxO media.');

// The public wxO route keeps the primary canvas story and links to the locked deep dive.
requireText(wxo, '<meta name="robots" content="index,follow">', 'Public wxO must use index,follow metadata.');
forbid(wxo, /site-route-status|wxo-access\.html|password-gate/i, 'Public wxO must not retain protected route shell or gate markup.');
requireText(wxo, 'class="pilot-chapter-index"', 'Public wxO page needs a visible story index.');
requireText(wxo, 'href="#canvas-system"', 'Public wxO page needs a Canvas-system chapter link.');
requireText(wxo, 'href="document-processing.html"', 'Public wxO page needs a visible standalone Document Processing link.');
requireText(wxo, 'id="canvas-system"', 'Canvas system must remain the primary public story.');
requireText(wxo, 'class="pilot-side-quest-bridge"', 'Document Processing must remain discoverable as a feature deep-dive bridge.');
forbid(wxo, /class="pilot-section pilot-side-quest"|id="document-processing"|data-wxo-chapter-panel/i,
  'The wxO umbrella must not embed or hide the retired inline Document Processing chapter.');
forbid(wxo, /Canvas Future|future-(inventory|builder|debug)-sanitized/i,
  'Future-state wxO material must remain withheld from the ordinary protected path.');

if (failures.length) {
  console.error('ROUTE 02 HOMEPAGE INTEGRATION CONTRACT: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('ROUTE 02 HOMEPAGE INTEGRATION CONTRACT: PASS');
console.log('- live staggered cards preserved; wxO owns the single public lead link');
console.log('- homepage controls removed; public wxO owns chapter navigation');
