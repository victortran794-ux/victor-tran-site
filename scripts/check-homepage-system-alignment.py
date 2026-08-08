#!/usr/bin/env python3
from pathlib import Path
import json
import math
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
CSS = ROOT / "css" / "style.css"
JS = ROOT / "js" / "main.js"
MANIFEST = ROOT / "data" / "projects.json"
GENERATOR = ROOT / "scripts" / "generate-project-sections.mjs"

failures = []

def need(condition, message):
    if not condition:
        failures.append(message)


def relative_luminance(hex_color):
    values = [int(hex_color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    linear = [v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in values]
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]


def contrast_ratio(color_a, color_b):
    high, low = sorted((relative_luminance(color_a), relative_luminance(color_b)), reverse=True)
    return (high + 0.05) / (low + 0.05)


def css_token(css, name):
    match = re.search(rf"{re.escape(name)}\s*:\s*(#[0-9a-fA-F]{{6}})", css)
    return match.group(1).lower() if match else None


for path in (INDEX, CSS, JS, MANIFEST, GENERATOR):
    need(path.exists(), f"missing required source: {path.relative_to(ROOT)}")

if failures:
    for failure in failures:
        print(f"- {failure}")
    sys.exit(1)

index = INDEX.read_text(encoding="utf-8")
css = CSS.read_text(encoding="utf-8")
js = JS.read_text(encoding="utf-8")
generator = GENERATOR.read_text(encoding="utf-8")
manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
projects = manifest.get("projects", [])
by_slug = {project.get("slug"): project for project in projects}

# Preserve the signature hero and all existing authored content.
for token in (
    'class="hero"', 'class="hero-stage"', 'class="hero-typeblock"',
    'class="hero-portraits"', 'class="hero-portrait is-active"',
    'class="hero-portrait-lens"', 'class="hero-meta"',
    'class="hero-services"', 'class="hero-cycle"',
    'aria-label="Change color"',
):
    need(index.count(token) == 1, f"signature hero token must remain exactly once: {token}")
for authored_copy in (
    'I design cool things with sincerity.',
    'Visual designer working across brand, illustration, and product systems.',
):
    need(authored_copy in index, f"signature hero copy must remain: {authored_copy}")

need(index.count('images/hero/figure20.webp') >= 2, "portrait image and mask must remain figure20.webp")
need(index.count('images/hero/figure20-lens.webp') == 1, "hero lens mask must remain present")
need('class="hero-pointer-wash"' in index,
     "the Home hero needs the approved decorative pointer wash layer")
need(".hero-pointer-wash" in css and "radial-gradient" in css and
     "@media (min-width: 761px)" in css,
     "the pointer wash must stay feathered and limited to desktop viewports")
need("hero.querySelector('.hero-pointer-wash')" in js and
     "hero.addEventListener('pointermove'" in js and
     "event.pointerType !== 'mouse'" in js and
     "requestAnimationFrame(updatePointerWash)" in js,
     "the pointer wash must use a mouse-only, hero-scoped rAF update path")
need(index.count('class="hero-lens-portal dna-trigger') == 2,
     "each portrait lens must own a Design DNA trigger")
need(index.count('hero-lens-portal--left') == 1 and index.count('hero-lens-portal--right') == 1,
     "the left and right portrait lenses need distinct trigger geometry")
need('aria-label="Open Design DNA through the left portrait lens"' in index and
     'aria-label="Open Design DNA through the right portrait lens"' in index and
     index.count('aria-controls="dnaOverlay"') >= 2 and index.count('aria-haspopup="dialog"') >= 2,
     "both lens portals need accessible dialog relationships")
need('aria-describedby="heroLensTooltip"' not in index and 'hero-lens-tooltip' not in index and
     'See the design DNA' not in index,
     "the hidden lens interaction must not render a tooltip or visible button label")
need('data-lens="dna"' not in index and 'dna-trigger-label' not in index,
     "the homepage viewing-mode switcher must contain only Light and Dark")
need('class="marquee"' not in index, "retired homepage marquee must remain removed")
need('class="featured-tracklist"' not in index, "homepage project switcher must remain removed")
need(index.count('class="featured-heading"') == 1 and "Selected Work" in index,
     "Route 02 needs one compact Selected Work heading")

# Hero ambient cycle: known state, one render path, restrained timing, honest manual override.
need("let i = 0" in js, "hero must begin from the known Pink state")
need("12000" in js and "setInterval" in js and "clearInterval" in js,
     "hero must use a controllable twelve-second automatic interval")
need("manualPause" in js and re.search(r"manualPause\s*=\s*true", js),
     "manual color selection must pause ambient cycling for the visit")
need("visibilitychange" in js and "document.hidden" in js,
     "hero ambient cycling must pause while the document is hidden")
need("prefers-reduced-motion: reduce" in js and
     ("addEventListener('change'" in js or "addEventListener?.('change'" in js),
     "hero must respond to reduced-motion changes at runtime")
need("data-hero-status" in index and 'aria-live="polite"' in index,
     "manual hero color changes need a polite live-region announcement")
need("hero-cycle-label" in js and "heroStatus" in js,
     "hero render path must synchronize its visible label and status")
need("Change color" in index and "Color shift" not in index and "Color shift" not in js,
     "hero color control must use the neutral action label without a visible color name")
need("state.name" not in js,
     "hero color rendering must not expose palette names")
need("Vic Tran" not in index and "Victor Tran" in index,
     "homepage must use Victor Tran for the full name, never Vic Tran")
need("1800ms" in css, "hero color fields need the approved 1.8-second crossfade")
need("min-width: 44px" in css and "min-height: 44px" in css,
     "manual hero color control must keep a 44px pointer target")
need(re.search(r"\.hero-lens-portal\s*\{[^}]*min-width:\s*44px[^}]*min-height:\s*44px", css, re.S),
     "the lens portal must keep a 44 by 44 minimum target")
need(".hero-lens-portal:focus-visible" in css and
     ".hero-lens-portal:hover::before" in css and
     re.search(r"\.hero-lens-portal::before\s*\{[^}]*inset:\s*-2px[^}]*border:\s*1px\s+solid\s+transparent", css, re.S),
     "each lens portal needs a restrained two-pixel-offset hover and keyboard-focus outline")
need('.hero-lens-tooltip' not in css,
     "the retired lens tooltip must not leave styling behind")
need("querySelectorAll('.dna-trigger')" in js and "triggers.forEach" in js,
     "the Design DNA overlay must activate from either lens trigger")
need(re.search(r"@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.hero[\s\S]*?transition:\s*none", css),
     "reduced-motion CSS must remove hero color transitions")

# Canonical project facts and protection flags.
expected = {
    "wxo-canvas": ("IBM watsonX Orchestrate", "wxo-canvas.html", "An agentic workflow canvas for building, inspecting, and improving AI workflows."),
    "document-processing": ("Document Processing", "document-processing.html", "A protected platform story connecting classification, extraction, human review, and quality evaluation into one inspectable workflow."),
    "ibmcloud": ("IBM Cloud Observability", "ibmcloud.html", "IBM Cloud product and visual-systems work across complex workflows, implementation quality, portfolio reviews, and reusable methods."),
    "ibm-patterns": ("IBM Patterns: Contact Us", "ibm-patterns.html", "A six-week IBM Patterns incubator project exploring how IBM.com could guide people toward a useful route before a general contact form."),
    "pci": ("Performance Contracting, Inc.", "pci.html", "Freelance publication and environmental design extending PCI's existing brand into a 42-page employee handbook and recruitment banner concepts."),
    "abilityexperience": ("The Ability Experience", "abilityexperience.html", "Brand identity and collateral for The Ability Experience, a Pi Kappa Phi initiative supporting people with disabilities."),
    "salmagazine": ("Star & Lamp Magazine", "salmagazine.html", "Modernizing a century-old publication through five years of layout and art direction for Pi Kappa Phi."),
    "pikappapp": ("Pi Kapp App", "pikappapp.html", "A mobile app concept for undergraduate fraternity members to track milestones, stay connected with the chapter, and live the values day to day."),
    "artillustration": ("Art & Illustration", "artillustration.html", "Standalone digital and traditional work, including posters, paintings, and personal series."),
    "graphicgallery": ("Graphic Design", "graphicgallery.html", "Standalone identity, print, illustration, and event graphics."),
}
need(set(expected).issubset(by_slug), "all ten portfolio projects must remain in the manifest")
for slug, (title, url, description) in expected.items():
    project = by_slug.get(slug, {})
    need(project.get("title") == title, f"project title changed: {slug}")
    need(project.get("url") == url, f"project route changed: {slug}")
    need(project.get("description") == description, f"project description changed: {slug}")
    expected_homepage = slug != "document-processing"
    need(project.get("homepage") is expected_homepage, f"homepage visibility drifted: {slug}")
    escaped_title = title.replace("&", "&amp;")
    if expected_homepage:
        need(escaped_title in index and url in index, f"generated homepage entry missing: {slug}")
    else:
        need(f'href="{url}" class="featured-item' not in index, f"hidden homepage entry leaked: {slug}")

protected = by_slug.get("document-processing", {})
need(protected.get("protected") is True, "Document Processing must remain protected")
need(protected.get("noindex") is True, "Document Processing must remain noindex")
need(protected.get("sitemap") is False, "Document Processing must remain excluded from the sitemap")
need("IBM watsonX Orchestrate" in index and "A2UI" not in index, "homepage needs IBM watsonX Orchestrate without A2UI claims")
for private_rationale in ("Shared anatomy", "Project color is bounded", "Current behavior remains intact"):
    need(private_rationale not in index, f"private comparison rationale leaked into public copy: {private_rationale}")

# Reproducible card hierarchy and chapter markers.
expected_variants = {
    "wxo-canvas": "lead",
    "ibmcloud": "span-7",
    "ibm-patterns": "span-5",
    "pci": "span-5",
    "abilityexperience": "span-7",
    "salmagazine": "span-7",
    "pikappapp": "span-5",
    "artillustration": "span-7",
    "graphicgallery": "span-5",
}
for slug, variant in expected_variants.items():
    need(by_slug.get(slug, {}).get("homepageVariant") == variant,
         f"missing explicit homepage variant {variant}: {slug}")
need(by_slug.get("abilityexperience", {}).get("surface") == "ability",
     "Ability homepage card needs its bounded approved identity surface")
need("homepageVariant" in generator and "featured-item--" in generator,
     "generator must render explicit homepage variants")
need("chapterMarkerMarkup" not in generator,
     "homepage generator must not emit chapter controls")
need(index.count('class="featured-chapter') == 0,
     "homepage chapter markers must remain removed")
need(index.count("featured-item--overlay") == 1,
     "wxO must remain the single homepage overlay variant")
for variant in ("lead", "span-7", "span-5"):
    need(f"featured-item--{variant}" in index, f"generated cards missing variant class: {variant}")
need("grid-template-columns: repeat(12" in css,
     "homepage project layout needs a twelve-column desktop grid")
for span in ("span 12", "span 7", "span 5"):
    need(f"grid-column: {span}" in css, f"homepage project CSS missing {span}")
need(re.search(r"@media\s*\(max-width:\s*720px\)[\s\S]*?featured-item--span-7[\s\S]*?grid-column:\s*1\s*/\s*-1", css),
     "narrow homepage cards must collapse to one column")

# Ability identity colors are the approved accessible pair and must remain bounded.
ability_orange = css_token(css, "--homepage-ability-orange")
ability_blue = css_token(css, "--homepage-ability-blue")
need(ability_orange == "#efaa18", "Ability homepage orange must use the approved project color")
need(ability_blue == "#03436e", "Ability homepage blue must use the approved contrast-safe project blue")
if ability_orange and ability_blue:
    need(contrast_ratio(ability_orange, ability_blue) >= 4.5,
         "Ability homepage orange/blue text pair must meet WCAG AA")
    need(contrast_ratio(ability_orange, "#1a1a1a") >= 4.5,
         "Ability homepage body text must meet WCAG AA")
need("featured-item--surface-ability" in css,
     "Ability identity styling must remain scoped to its homepage card")

# Hero normal-text roles must pass in every ambient palette state.
hero_block = re.search(r"\.hero\s*\{([^}]*)\}", css, re.S)
hero_meta = None
if hero_block:
    token = re.search(r"--text-2\s*:\s*(#[0-9a-fA-F]{6})", hero_block.group(1))
    hero_meta = token.group(1) if token else None
need(hero_meta is not None, "hero needs an explicit normal-text color token")
if hero_meta:
    hero_state_backgrounds = {
        "Pink": "#401e2d",
        "Blue": "#1a2a3c",
        "Orange": "#332217",
        "Purple": "#261a3b",
    }
    for state, background in hero_state_backgrounds.items():
        need(contrast_ratio(hero_meta, background) >= 4.5,
             f"hero title/subtitle text must meet WCAG AA in {state}")
subtitle_block = re.search(r"\.hero-subtitle\s*\{([^}]*)\}", css, re.S)
need(not subtitle_block or not re.search(r"opacity\s*:\s*0?\.[0-9]+", subtitle_block.group(1)),
     "hero subtitle must not reduce its contrast with element opacity")

homepage_orange = css_token(css, "--orange")
if homepage_orange:
    need(contrast_ratio("#ffffff", homepage_orange) >= 4.5,
         "Star & Lamp white text must meet WCAG AA on its bounded orange surface")
need(re.search(
    r"\.featured-item--surface-orange\s+\.featured-item-desc,\s*"
    r"\.featured-item--surface-orange\s+\.view-link\s*\{[^}]*color:\s*#ffffff",
    css,
), "Star & Lamp description and link must use contrast-safe white on orange")

if failures:
    print("HOMEPAGE SYSTEM ALIGNMENT CONTRACT: FAIL")
    for failure in failures:
        print(f"- {failure}")
    sys.exit(1)

print("HOMEPAGE SYSTEM ALIGNMENT CONTRACT: PASS")
print("- signature hero, project facts, generated hierarchy, and protected boundaries pass")
print("- ambient hero motion, reduced motion, manual pause, and theme-safe identity roles pass")
