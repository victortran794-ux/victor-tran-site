import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const html = read('index.html');
const css = read('css/style.css');
const js = read('js/main.js');
const browserVerifier = read('scripts/check-engraved-dna-hero-browser.mjs');
const packageJson = JSON.parse(read('package.json'));
const preflight = read('scripts/preflight.sh');
const workflow = read('.github/workflows/health-check.yml');

const failures = [];
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

expect(!/<meta\s+name="robots"\s+content="noindex,nofollow"/i.test(html),
  'public canonical homepage must not retain the private pilot noindex directive');
expect(/<body[^>]*class="[^"]*home-page--engraved-dna/i.test(html),
  'canonical homepage must own the Engraved DNA scope');

expect(/_vercel\/insights\/script\.js/.test(html) && /_vercel\/speed-insights\/script\.js/.test(html),
  'canonical homepage must preserve the established Vercel telemetry includes');
expect(!/ambient-tuner/.test(html)
  && !fs.existsSync(path.join(root, 'css/ambient-tuner.css'))
  && !fs.existsSync(path.join(root, 'js/ambient-tuner.js'))
  && !/__ambientFieldTunerApi|ambient-field-tuner-ready|resetConfig|updateSelectedAnchor/.test(js),
  'canonical homepage must not ship the private Ambient Field Tuner UI, API, or readiness event');
expect(!/(?:\/home\/|\/Users\/|\.agent-browser\/browsers\/)/.test(browserVerifier)
  && /process\.env\.CHROME_BIN/.test(browserVerifier),
  'browser verifier must use CHROME_BIN or portable system paths without personal cache fallbacks');
expect(packageJson.scripts?.['check:engraved-dna-hero'] === 'node scripts/check-engraved-dna-hero.mjs'
  && packageJson.scripts?.['check:engraved-dna-hero-browser'] === 'node scripts/check-engraved-dna-hero-browser.mjs'
  && packageJson.scripts?.['check:ambient-field-selection'] === 'node scripts/check-ambient-field-selection.mjs',
  'package scripts must expose the canonical Engraved DNA, ambient-baseline, and browser contracts');
expect(preflight.includes('run_required "Engraved Design DNA hero contract" npm run check:engraved-dna-hero')
  && preflight.includes('run_required "Selected ambient field baseline contract" npm run check:ambient-field-selection')
  && preflight.includes('run_required "Engraved Design DNA hero browser contract" npm run check:engraved-dna-hero-browser'),
  'preflight must run the canonical Engraved DNA, ambient-baseline, and browser contracts');
expect(workflow.includes('npm run check:engraved-dna-hero')
  && workflow.includes('npm run check:ambient-field-selection')
  && workflow.includes('npm run check:engraved-dna-hero-browser'),
  'home-scoped CI must run the canonical Engraved DNA, ambient-baseline, and browser contracts');
const heroBrowserWorkflow = workflow.match(/- name: Engraved Design DNA hero browser contract([\s\S]*?)(?=\n\s{6}- name:|\n\s{4}[a-zA-Z_-]+:|$)/)?.[1] || '';
expect(/python3 -m http\.server/.test(heroBrowserWorkflow)
  && /trap 'kill "\$SERVER_PID"/.test(heroBrowserWorkflow)
  && /curl --fail --silent/.test(heroBrowserWorkflow)
  && /SITE_URL="?http:\/\/127\.0\.0\.1:\$\{?HERO_PORT\}?"? npm run check:engraved-dna-hero-browser/.test(heroBrowserWorkflow),
  'home-scoped CI must start an owned server, prove readiness, and pass its URL to the Engraved DNA browser contract');
expect(/const saved = localStorage\.getItem\(['"]lens['"]\) \|\|\s*['"]light['"]/.test(js)
  && !/prefers-color-scheme:\s*dark/.test(js.slice(js.indexOf('// ── Lens Switcher'), js.indexOf('// ── Marquee clone'))),
  'first visit must default to Light while preserving an explicitly saved lens');
expect(!/hero-availability/.test(html),
  'canonical homepage must remove the Available for work tag');
expect(!/hero-dna-trigger-label/.test(html),
  'portrait trigger must not show a Design DNA label');
expect(/class="nav-logo-victor">Victor<\/span>\s*<span class="nav-logo-tran">Tran<\/span>/.test(html),
  'header wordmark must use italic title-case Victor Tran');
expect(/class="hero-bigtype hero-bigtype--victor">Victor<\/span><span class="hero-bigtype hero-bigtype--tran">Tran<\/span>/.test(html),
  'hero name must use title-case Victor Tran on one line');
expect(/class="hero-intro-row"[\s\S]*class="hero-dna-trigger"[\s\S]*class="hero-copy"/.test(html),
  'portrait must share a row with the copy running from I design through See the work');
expect(!/class="hero-cursor-wash"/.test(html) && !/\.hero-cursor-wash/.test(css),
  'hero must remove the cursor glow rather than adding a separate pointer halo');
expect((html.match(/class="hero-ambient-orb\s+hero-ambient-orb--/g) || []).length === 6,
  'hero must include six separated single orbital circles');
expect((html.match(/hero-ambient-orb--node/g) || []).length === 3,
  'exactly three separated circles must carry a continuously rotating node');
expect(/\.home-page--engraved-dna\s+\.hero-ambient-orb\s*\{[^}]*border:\s*1px\s+solid[^}]*filter:\s*none/is.test(css),
  'satellites must borrow the thin unblurred orbital-ring language from the wxO entry');
expect([42, 68, 96, 132, 176, 224].every(size => css.includes(`--orb-size: ${size}px`)),
  'separated orbital circles must vary substantially in size');
expect(/\.hero-ambient-orb--e\s*\{[^}]*--orb-color:\s*color-mix\(in oklab,\s*#55a2f7\s+76%,\s*#7928d2\)/i.test(css),
  'one larger moving orbital circle must carry a stronger blue tint');
expect((html.match(/class="hero-ambient-companion\s+hero-ambient-companion--/g) || []).length === 3
  && [12, 20, 32].every(size => css.includes(`--companion-size: ${size}px`))
  && html.indexOf('hero-ambient-companion') > html.lastIndexOf('hero-ambient-orb hero-ambient-orb--')
  && /\.hero-ambient-companion\s*\{[^}]*z-index:\s*3[^}]*border:\s*1px\s+solid\s+var\(--hero-bg\)[^}]*background:\s*transparent/is.test(css),
  'three theme-background companion circles must be independent top-layer stroked circles at or below the smallest ring size');
expect(!/\.hero-ambient-orb::before/.test(css) && /\.hero-ambient-orb--node::after/.test(css),
  'each satellite must be one circle, with orbit nodes only on selected rings');

expect(/data-theme-portrait="light"[^>]*>[\s\S]*?figure20\.webp/.test(html),
  'Light theme must use authentic figure20 portrait');
expect(/data-theme-portrait="dark"[^>]*>[\s\S]*?figure19\.webp/.test(html),
  'Dark theme must use authentic clear-glasses figure19 portrait');
expect((html.match(/class="hero-ambient-blob/g) || []).length === 2,
  'hero must contain exactly two ambient blob elements');
expect(/\.home-page--engraved-dna\s+\.hero-ambient-blob--b\s*\{[^}]*--blob-size-scale:\s*0\.72/i.test(css),
  'one of the two large background orbs must be reduced by 28 percent');
expect(!/class="hero-cycle"/.test(html),
  'independent four-color hero cycle must be removed');
expect(!/data-color="\d"/.test(html),
  'hero must not retain independent numeric color-cycle state');

expect(/class="hero-dna-trigger[^>]*aria-expanded="false"[^>]*aria-controls="heroDnaPanel"/.test(html),
  'inline DNA trigger must expose aria-expanded and aria-controls');
expect(/id="heroDnaPanel"[^>]*hidden/.test(html),
  'inline DNA panel must begin hidden');
expect(!/id="dnaOverlay"/.test(html),
  'canonical homepage must not retain the modal Design DNA overlay');
expect(!/aria-modal="true"/.test(html),
  'inline DNA reveal must not claim modal semantics');
expect(/class="hero-dna-close"[^>]*data-dna-close>Close panel<\/button>/i.test(html),
  'inline DNA close control must use the plain label Close panel');
expect((html.match(/class="hero-dna-group\s+/g) || []).length === 4
  && /class="hero-dna-label">Shape<\/p>/.test(html)
  && !/Shared structure/.test(html),
  'inline DNA must retain Shape while removing the unneeded Shared structure group');
expect((html.match(/class="hero-dna-swatch"/g) || []).length === 9
  && /data-dna-token="--bg"/.test(html)
  && /data-dna-token="--bg-2"/.test(html)
  && /data-dna-token="--text"/.test(html)
  && /data-dna-token="--text-2"/.test(html)
  && /data-dna-token="--border"/.test(html)
  && /class="hero-dna-swatch-value"/.test(html),
  'inline Palette must restore named live background, text, border, and accent values');
expect(/class="hero-dna-tint"/.test(html)
  && /\.home-page--engraved-dna\s+\.hero-dna-tint\s*\{[^}]*inset:\s*0/i.test(css)
  && /applyHeroTint/.test(js)
  && /pointerenter/.test(js) && /focus/.test(js),
  'palette interaction must be able to tint the whole hero from hover, focus, or selection');
expect(/DM Serif Display/.test(html) && /Barlow/.test(html) && /Source Code Pro/.test(html)
  && /class="hero-dna-type-playground"/.test(html)
  && /contenteditable="true"/.test(html),
  'inline Typography must restore real face labels and the editable larger specimen');
expect(/class="hero-dna-space-token"/.test(html) && /class="hero-dna-space-value"/.test(html)
  && /class="hero-dna-radius-token"/.test(html) && /class="hero-dna-radius-value"/.test(html),
  'Spacing and Shape must restore their token names and values');

expect(/\.home-page--engraved-dna\s+\.nav\s*\{[^}]*background:\s*transparent/i.test(css),
  'Home navigation must float without a visible bar');
expect(/\.home-page--engraved-dna\s+\.nav-logo\s*\{[^}]*align-items:\s*center/i.test(css),
  'header VictorTran lockup must center vertically with the other menu controls');
expect(/\.home-page--engraved-dna\s+\.hero-identity\s*\{[^}]*left:\s*var\(--route02-x\)/i.test(css)
  && /\.home-page--engraved-dna\s+\.hero-services\s*\{[^}]*left:\s*var\(--route02-x\)[^}]*right:\s*var\(--route02-x\)/is.test(css),
  'hero identity and service text must share the page text rail');
expect(/\.home-page--engraved-dna\s+\.featured-heading\s*\{[^}]*min-height:\s*clamp\([^}]*display:\s*flex[^}]*align-items:\s*flex-end/is.test(css),
  'Other cool things heading row must be enlarged with its label in the lower third');
expect(/\.home-page--engraved-dna\s+\.hero-typeblock\s+h1\s*\{[^}]*flex-direction:\s*row[^}]*align-items:\s*baseline/i.test(css),
  'canonical homepage must restore the original horizontal Victor TRAN text arrangement');
const pilotTranRule = css.match(/\.home-page--engraved-dna\s+\.hero-bigtype--tran\s*\{([^}]*)\}/i)?.[1] || '';
expect(/font-size:\s*var\(--hero-name-size\)/i.test(pilotTranRule)
  && /margin-left:\s*-0\.1em/i.test(pilotTranRule)
  && /font-style:\s*italic/i.test(pilotTranRule)
  && !/font-family:\s*['"]?Barlow/i.test(pilotTranRule),
  'Victor and Tran must be equal-size, tightly joined, serif, and italic');
expect(/--name-overhang:\s*72px/i.test(css),
  'desktop VictorTran lockup must target a 72px overhang beyond the content row');
expect(/\.home-page--engraved-dna\s+\.hero-bigtype\s*\{[^}]*font-style:\s*italic/i.test(css),
  'both hero name parts must be italic');
expect(/\.nav-logo-victor,\s*\.nav-logo-tran\s*\{[^}]*font-family:\s*['"]DM Serif Display['"][^}]*font-style:\s*italic/i.test(css)
  && /\.nav-logo-victor\s*\{\s*color:\s*#1667b9/i.test(css)
  && /\.home-page--engraved-dna\s+\.nav-logo-tran\s*\{[^}]*color:\s*#1a1a1a/i.test(css),
  'Light header wordmark must preserve italic Victor and black Tran while using an accessible blue on white');
expect(/html\[data-theme="dark"\][^}]*\.hero-bigtype--victor\s*\{[^}]*color:\s*#ea3b99/i.test(css)
  && /html\[data-theme="dark"\][^}]*\.hero-bigtype--tran\s*\{[^}]*color:\s*#f7f6f3/i.test(css),
  'Dark hero name must use pink Victor and white Tran');
expect(/\.home-page--engraved-dna\s+\.hero-intro-row\s*\{[^}]*align-items:\s*stretch/i.test(css)
  && /\.home-page--engraved-dna\s+\.hero-portrait-frame\s*\{[^}]*height:\s*100%[^}]*aspect-ratio:\s*1/i.test(css),
  'desktop portrait must be square and span the I design through See the work copy row');
expect(/\.home-page--engraved-dna\s+\.hero-copy\s*\{[^}]*height:\s*var\(--portrait-span\)[^}]*justify-content:\s*space-between/i.test(css),
  'portrait and responsive copy must share one deterministic square span');
expect(/\.home-page--engraved-dna\s+\.hero-dna-panel\.is-active\s+\.hero-dna-group\s*\{[^}]*opacity:\s*1/i.test(css),
  'expanded DNA content must render at normal opacity');
expect(/@media\s*\(min-width:\s*761px\)[\s\S]*?\.home-page--engraved-dna\s+\.hero-dna-label\s*\{[^}]*font-size:\s*0\.62rem/i.test(css)
  && /@media\s*\(min-width:\s*761px\)[\s\S]*?\.home-page--engraved-dna\s+\.hero-dna-swatch-dot\s*\{[^}]*width:\s*32px[^}]*height:\s*32px/i.test(css)
  && /@media\s*\(min-width:\s*761px\)[\s\S]*?\.home-page--engraved-dna\s+\.hero-dna-type-sample\s*\{[^}]*font-size:\s*3\.4rem/i.test(css),
  'desktop DNA specimens and labels must be enlarged for easier reading');
expect(/grid-template-areas:\s*'palette spacing'\s*'palette shape'\s*'type type'\s*'close close'/i.test(css)
  && /@media\s*\(min-width:\s*761px\)[\s\S]*?\.home-page--engraved-dna\s+\.hero-dna-type\s*\{[^}]*display:\s*grid[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(0,\s*1fr\)/i.test(css)
  && /\.home-page--engraved-dna\s+\.hero-dna-type\s*>\s*\.hero-dna-label\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/i.test(css),
  'desktop DNA must group Shape with Spacing and place the type playground beside the type samples');
expect(/@media\s*\(max-width:\s*760px\)[\s\S]*?\.home-page--engraved-dna\s+\.hero-dna-panel\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/i.test(css),
  'mobile DNA must preserve the compact two-column information layout');
expect(/--hero-blob-a:\s*#ea3b99/i.test(css) && /--hero-blob-b:\s*#b06020/i.test(css),
  'Light theme must bind pink and orange ambient roles');
expect(/html\[data-theme="dark"\]\s+\.home-page--engraved-dna[\s\S]*--hero-blob-a:\s*#7ab8ff/i.test(css)
  && /html\[data-theme="dark"\]\s+\.home-page--engraved-dna[\s\S]*--hero-blob-b:\s*#7928d2/i.test(css),
  'Dark theme must bind blue and purple ambient roles');
expect(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*\.hero-ambient-blob[\s\S]*animation:\s*none/i.test(css),
  'reduced motion must freeze ambient blobs');
expect(/@keyframes\s+heroBlobLava/i.test(css),
  'ambient blobs must use an organic lava-lamp morph animation');
expect(/@keyframes\s+heroOrbNodeSpin/i.test(css),
  'dot-bearing orbital circles must rotate continuously');
expect(/if\s*\(satellites\[index\]\.classList\.contains\(['"]hero-ambient-orb--node['"]\)\)\s*return;/i.test(js),
  'dot-bearing orbital circles must stay positionally stationary while their dots rotate');
expect(/animation:\s*heroBlobLava\s+10s/i.test(css)
  && /filter:\s*blur\(var\(--blob-blur\)\)\s+saturate\(1\.28\)\s+opacity\(var\(--blob-visibility\)\)/i.test(css),
  'lava field must retain its faster saturated treatment through tunable blur and visibility variables');
expect(/\.hero-dna-trigger:hover\s+\.hero-portrait-frame::after[\s\S]*opacity:/i.test(css),
  'portrait hover must visibly lighten the image');

expect(/@media\s*\(max-width:\s*760px\)[\s\S]*\.home-page--engraved-dna\s+\.hero-services\s*\{[^}]*top:\s*auto/i.test(css),
  'mobile practice labels must clear inherited top positioning');
expect(/\.home-page--engraved-dna\s+\.hero\.is-dna-expanded\s+\.hero-services\s*\{[^}]*opacity:\s*0/i.test(css),
  'expanded mobile DNA must suppress overlapping practice labels');

expect(/function\s+setDnaExpanded\s*\(/.test(js),
  'canonical homepage must implement one semantic inline DNA state setter');
expect(/document\.hidden/.test(js) && /hero-ambient-paused/.test(js),
  'ambient movement must pause while the document is hidden');
expect(!/dataset\.pointerWash/.test(js) && !/--wash-[xy]/.test(js),
  'pointer interaction must not retain the removed cursor glow state');
expect(/hero-ambient-orb/.test(js) && /--orb-x/.test(js) && /--orb-y/.test(js),
  'small satellite orbs must respond to the live hero pointer field');
expect(/companionCurrent/.test(js) && /--companion-shift-x/.test(js) && /--companion-shift-y/.test(js),
  'small theme circles must fluidly follow pointer movement with bounded independent shifts');
expect(/speed:\s*0\.00028/.test(js) && /speed:\s*0\.00044/.test(js) && /speed:\s*0\.00036/.test(js),
  'separated circles must use buoyant paths with greater travel and pace');
expect(!/hero\.dataset\.color/.test(js),
  'pilot JavaScript must not retain independent color cycling');

if (failures.length) {
  console.error('ENGRAVED DNA HERO CONTRACT: FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('ENGRAVED DNA HERO CONTRACT: PASS');
console.log('- authentic theme portraits, floating shell, two-blob field, inline DNA semantics, reduced-motion and visibility contracts pass');
