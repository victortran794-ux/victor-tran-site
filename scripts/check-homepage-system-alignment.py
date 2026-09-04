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

# Preserve the approved Engraved Design DNA hero and authored content.
for token in (
    'class="hero"', 'class="hero-identity"', 'class="hero-typeblock"',
    'class="hero-intro-row"', 'class="hero-dna-trigger"',
    'class="hero-dna-panel"', 'class="hero-meta"', 'class="hero-services"',
):
    need(index.count(token) == 1, f"Engraved DNA hero token must remain exactly once: {token}")
for authored_copy in (
    'I design cool things with sincerity.',
    'Visual designer building clear, expressive systems across enterprise products, brands, and stories.',
):
    need(authored_copy in index, f"signature hero copy must remain: {authored_copy}")

need(index.count('images/hero/figure20.webp') >= 2 and
     index.count('images/hero/figure19.webp') >= 2,
     "Light and Dark must each retain one authentic theme portrait plus preload")
need('data-theme-portrait="light"' in index and 'data-theme-portrait="dark"' in index,
     "theme portraits must remain explicitly mapped")
need('aria-expanded="false"' in index and 'aria-controls="heroDnaPanel"' in index and
     'id="heroDnaPanel"' in index and 'data-dna-close' in index,
     "the inline Design DNA disclosure must retain accessible open and close relationships")
need('aria-modal="true"' not in index and 'id="dnaOverlay"' not in index,
     "the inline Design DNA disclosure must not regress to modal semantics")
need('Shared structure' not in index,
     "the removed Shared structure group must stay absent")
need('class="hero-cycle"' not in index and 'data-color=' not in index,
     "the retired independent hero color cycle must stay absent")
need('hero-pointer-wash' not in index and
     not re.search(r"\.home-page--engraved-dna\s+\.hero-(?:pointer|cursor)-wash", css),
     "the approved Engraved DNA hero must not reintroduce a cursor glow")
need('class="marquee"' not in index, "retired homepage marquee must remain removed")
need('class="featured-tracklist"' not in index, "homepage project switcher must remain removed")
need(index.count('class="featured-heading"') == 1 and "Other cool things to check out" in index,
     "the homepage needs one approved archive heading")
need("localStorage.getItem('lens') || 'light'" in js,
     "first visit must default to Light while preserving an explicitly saved lens")
need("visibilitychange" in js and "document.hidden" in js,
     "hero ambient movement must pause while the document is hidden")
need(re.search(r"@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.hero-ambient-blob[\s\S]*?animation:\s*none", css),
     "reduced-motion CSS must freeze the ambient field")
need("Vic Tran" not in index and "Victor Tran" in index,
     "homepage must use Victor Tran for the full name, never Vic Tran")
need("min-width: 44px" in css and "min-height: 44px" in css,
     "homepage controls must retain 44px pointer targets")

# Canonical project facts and protection flags.
expected = {
    "wxo-canvas": ("IBM watsonx Orchestrate", "wxo-canvas.html", "An agentic workflow canvas for building, inspecting, and improving AI workflows."),
    "document-processing": ("Document Processing", "document-processing.html", "A protected platform story connecting classification, extraction, human review, and quality evaluation into one inspectable workflow."),
    "ibmcloud": ("IBM Cloud Observability", "ibmcloud.html", "Research, product workflows, and reusable visual methods for IBM Cloud Observability."),
    "ibm-patterns": ("IBM Patterns: Contact Us", "ibm-patterns.html", "A six-week IBM Patterns incubator project exploring how IBM.com could guide people toward a useful route before a general contact form."),
    "pci": ("Performance Contracting, Inc.", "pci.html", "Freelance publication and environmental design extending PCI's existing brand into a 42-page employee handbook and recruitment banner concepts."),
    "abilityexperience": ("The Ability Experience", "abilityexperience.html", "A brand identity and practical toolkit for a Pi Kappa Phi initiative supporting people with disabilities."),
    "salmagazine": ("Star & Lamp Magazine", "salmagazine.html", "Modernizing a century-old publication through five years of layout and art direction for Pi Kappa Phi."),
    "pikappapp": ("Pi Kapp App", "pikappapp.html", "A member-facing app concept connecting milestones, chapter activity, and Pi Kappa Phi's visual identity."),
    "artillustration": ("Art & Illustration", "artillustration.html", "Standalone digital and traditional work, including posters, paintings, and personal series."),
    "graphicgallery": ("Graphic Design", "graphicgallery.html", "Standalone identity, print, illustration, and event graphics."),
    "uigallery": ("Interface Studies", "uigallery.html", "Static screen studies focused on interface craft and visual refinement."),
}
need(set(expected).issubset(by_slug), "all eleven portfolio projects must remain in the manifest")
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
need("IBM watsonx Orchestrate" in index and "A2UI" not in index, "homepage needs IBM watsonx Orchestrate without A2UI claims")
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
    "artillustration": "span-4",
    "graphicgallery": "span-4",
    "uigallery": "span-4",
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
for variant in ("lead", "span-7", "span-5", "span-4"):
    need(f"featured-item--{variant}" in index, f"generated cards missing variant class: {variant}")
need("grid-template-columns: repeat(12" in css,
     "homepage project layout needs a twelve-column desktop grid")
for span in ("span 12", "span 7", "span 5", "span 4"):
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

# Hero normal-text roles must pass in both supported themes.
hero_light_block = re.search(r"\.home-page--engraved-dna\s*\{([^}]*)\}", css, re.S)
hero_dark_block = re.search(r"html\[data-theme=\"dark\"\]\s+\.home-page--engraved-dna\s*\{([^}]*)\}", css, re.S)
need(hero_light_block is not None and hero_dark_block is not None,
     "Engraved DNA hero needs explicit Light and Dark theme token blocks")
if hero_light_block:
    light_bg = css_token(hero_light_block.group(1), "--hero-bg")
    light_text = css_token(hero_light_block.group(1), "--hero-text")
    light_muted = css_token(hero_light_block.group(1), "--hero-muted")
    need(all((light_bg, light_text, light_muted)),
         "Light hero must expose background, text, and muted text tokens")
    if light_bg and light_text and light_muted:
        need(contrast_ratio(light_text, light_bg) >= 4.5,
             "Light hero primary text must meet WCAG AA")
        need(contrast_ratio(light_muted, light_bg) >= 4.5,
             "Light hero muted text must meet WCAG AA")
if hero_dark_block:
    dark_bg = css_token(hero_dark_block.group(1), "--hero-bg")
    dark_text = css_token(hero_dark_block.group(1), "--hero-text")
    need(dark_bg is not None and dark_text is not None,
         "Dark hero must expose background and text tokens")
    if dark_bg and dark_text:
        need(contrast_ratio(dark_text, dark_bg) >= 4.5,
             "Dark hero primary text must meet WCAG AA")
    need("--hero-muted: rgba(255, 255, 255, 0.62)" in hero_dark_block.group(1),
         "Dark hero muted text must retain its contrast-safe white treatment")

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
print("- Engraved DNA hero, project facts, generated hierarchy, and protected boundaries pass")
print("- Light-first theme, reduced motion, no-glow, and theme-safe identity roles pass")
