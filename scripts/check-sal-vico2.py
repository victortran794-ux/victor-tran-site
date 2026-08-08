#!/usr/bin/env python3
from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "salmagazine.html"
CSS = ROOT / "css/style.css"
PROJECTS = ROOT / "data/projects.json"


class Audit(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.tags: list[tuple[str, dict[str, str]]] = []
        self.images: list[dict[str, str]] = []
        self.classes: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key: value or "" for key, value in attrs}
        self.tags.append((tag, values))
        self.classes.extend(values.get("class", "").split())
        if tag == "img":
            self.images.append(values)


def main() -> int:
    html = HTML.read_text(encoding="utf-8")
    css = CSS.read_text(encoding="utf-8")
    projects = PROJECTS.read_text(encoding="utf-8")
    audit = Audit()
    audit.feed(html)
    failures: list[str] = []

    def need(ok: bool, message: str) -> None:
        if not ok:
            failures.append(message)

    # Shared site and generated-content hooks.
    need(
        any(
            tag == "main"
            and attrs.get("id") == "main-content"
            and "page-content" in attrs.get("class", "").split()
            for tag, attrs in audit.tags
        ),
        "main target must remain skip-link ready",
    )
    need("page-header-title" in audit.classes, "generated-content title hook must remain")
    need("page-header-desc" in audit.classes, "generated-content description hook must remain")
    need("case-study-meta" in audit.classes, "generated metadata hook must remain")
    for class_name in ["lens-switcher", "project-nav", "footer"]:
        need(class_name in audit.classes, f"shared site class must remain: {class_name}")
    need('<script src="js/main.js"></script>' in html, "shared site behavior must remain")

    # Reusable VicO2 production structure.
    for class_name in [
        "vico2-hero",
        "vico2-meta",
        "vico2-chapter",
        "vico2-chapter-header",
        "vico2-artifact",
        "vico2-system-map",
        "vico2-media-gallery",
        "vico2-evidence",
        "vico2-archive",
    ]:
        need(class_name in audit.classes, f"missing reusable VicO2 class: {class_name}")
    need(audit.classes.count("vico2-chapter") == 4, "expected exactly four VicO2 chapters")
    for label in [
        "01 / Redrawing a legacy",
        "02 / Editorial system",
        "03 / Art direction in practice",
        "04 / Five years of issues",
    ]:
        need(label in html, f"missing chapter label: {label}")
    for component in ["artifact-reading", "technical-diagram", "media-gallery", "evidence", "archive"]:
        need(f'data-component="{component}"' in html, f"missing production component contract: {component}")
    need(
        'role="img"' in html and "Issue identity connects to feature opener, reading system, and archive" in html,
        "editorial-system diagram needs a concise text equivalent",
    )

    # Existing public narrative must not silently disappear.
    required_copy = [
        "Modernizing a century-old publication. I led the layout and art direction for the official Pi Kappa Phi magazine.",
        "A century-old fraternity magazine, redrawn into an award-winning publication. Five years of issues, art direction, and editorial design.",
        '"To Connie, the rose of Pi Kappa Phi." A tribute to the fraternity\'s First Lady, in my last issue as creative director.',
        "From rinse-and-repeat brochure to industry award winner.",
        "First published in the fall of 1909, the Star &amp; Lamp is the magazine of Pi Kappa Phi Fraternity and is produced in-house.",
        "Five years of issues, archived in full on Issuu. Click any cover to read the issue.",
        "View the complete issue archive",
        "Editorial features, chapter coverage, and visual storytelling pulled from the issues I art-directed.",
        '"A Common Bond": six brothers from across generations weigh in on the call to lead and the duty to serve.',
        '"Thirty Under 30" celebrates thirty alumni redefining what it means to lead.',
        "Documenting the men who ride, build, and serve through TAE, the philanthropic heart of Pi Kappa Phi.",
        "Four highlight spreads from my first issue as creative director.",
        '"Test on 10th" balances photography, pull quotes, and dense reporting across the spread.',
        "One cover story from each of the remaining issues, with five years of features in chronological order.",
        '"Woven into the lives of others" collects stories from the summer Ability Experience.',
        '"The Challenge We Must Face." takes a hard look at the fraternity in the wake of a brother\'s death.',
        '"Throwing Bones" follows Kenny Capps as he runs the Mountains-to-Sea Trail in the face of cancer.',
        '"Leading the Decade" marks Pi Kapp College for Emerging Leaders at ten years.',
    ]
    for copy in required_copy:
        need(copy in html, f"missing existing public narrative: {copy[:72]}")

    for award in [
        "2019 · 3rd Place Overall Magazine Excellence",
        "2018 · 3rd Place Overall Magazine Excellence",
    ]:
        need(award in html, f"missing verified award: {award}")

    # August 7 bounded revision: distinct opener, aligned metadata,
    # direct archive action, and third-person homepage voice.
    need(
        '<img src="images/thumb-sal.webp" width="1081" height="1081" alt="Star &amp; Lamp magazine covers arranged across five years" fetchpriority="high">' in html,
        "SAL hero must use the distinct five-year cover composition",
    )
    need(
        '<div class="sal-vico2-archive-cta reveal">' in html,
        "archive needs the cleaner direct-action treatment",
    )
    need(
        'class="sal-vico2-archive-link"' in html
        and "View the complete issue archive" in html,
        "archive action must clearly link readers to the complete issue archive",
    )
    need("sal-vico2-archive-note" not in html, "legacy padded archive note must be removed")
    need(
        '"description": "Modernizing a century-old publication through five years of layout and art direction for Pi Kappa Phi."' in projects,
        "homepage SAL description must use the approved third-person voice",
    )

    required_images = [
        "sal-f2020-house-home.jpg", "sal-f2020-virtually.jpg", "sal-f2020-covid-heroes.jpg",
        "sal-f2020-connie-owen.jpg", "sal-cover-2016-fall.jpg", "sal-cover-2017-summer.jpg",
        "sal-cover-2017-fall.jpg", "sal-cover-2018-spring.jpg", "sal-cover-2018-fall.jpg",
        "sal-cover-2019-spring.jpg", "sal-cover-2019-fall.jpg", "sal-cover-2020-spring.jpg",
        "sal-cover-2020-fall.jpg", "sal-common-bond-1.jpg", "sal-common-bond-2.jpg",
        "sal-common-bond-3.jpg", "sal-fall2018-spread-1.jpg", "sal-fall2018-spread-2.jpg",
        "sal-abex-challenges.jpg", "sal-sum2017-1.jpg", "sal-sum2017-2.jpg",
        "sal-sum2017-3.jpg", "sal-sum2017-4.jpg", "sal-test-on-10th.jpg",
        "sal-spr2019-spread-1.jpg", "sal-spr2019-page25.jpg", "sal-spr2019-page37.jpg",
        "sal-f2016-cover-story.jpg", "sal-f2017-cover-story.jpg", "sal-f2019-cover-story.jpg",
        "sal-s2020-cover-story.jpg",
    ]
    sources = [Path(image.get("src", "")).name for image in audit.images]
    for name in required_images:
        need(name in sources, f"missing existing SAL image: {name}")
    for image in audit.images:
        if Path(image.get("src", "")).name in required_images:
            need(bool(image.get("alt", "").strip()), f"missing alt text: {image.get('src')}")
            need(image.get("width", "").isdigit() and image.get("height", "").isdigit(), f"missing dimensions: {image.get('src')}")

    cover_links = [
        attrs for tag, attrs in audit.tags
        if tag == "a" and attrs.get("href") == "https://issuu.com/pikappaphi"
    ]
    need(len(cover_links) >= 9, "all nine Issuu cover links must remain")
    need("https://pikapp.org/about/star-lamp/" in html, "latest-issues link must remain")

    # Bounded CSS and responsive contracts.
    need("/* VICO2 CASE STUDY: START */" in css and "/* VICO2 CASE STUDY: END */" in css, "missing shared VicO2 CSS boundary")
    need("/* SAL VICO2: START */" in css and "/* SAL VICO2: END */" in css, "missing SAL VicO2 CSS boundary")
    shared_start = css.find("/* VICO2 CASE STUDY: START */")
    shared_end = css.find("/* VICO2 CASE STUDY: END */")
    sal_start = css.find("/* SAL VICO2: START */")
    sal_end = css.find("/* SAL VICO2: END */")
    shared_css = css[shared_start:shared_end] if shared_start != -1 and shared_end != -1 else ""
    sal_css = css[sal_start:sal_end] if sal_start != -1 and sal_end != -1 else ""
    for selector in [".vico2-hero", ".vico2-chapter", ".vico2-artifact", ".vico2-system-map", ".vico2-media-gallery", ".vico2-evidence"]:
        need(selector in shared_css, f"missing shared VicO2 selector: {selector}")
    need("@media (max-width: 700px)" in shared_css, "shared VicO2 layer needs narrow recomposition")
    need(".vico2-case-study img { height: auto; }" in shared_css, "responsive VicO2 images must override fixed HTML height attributes")
    need(".vico2-case-study figcaption," not in shared_css, "long figcaptions must not inherit the mono uppercase label treatment")
    need("--sal-project" in sal_css and "--sal-project-blue" in sal_css, "missing SAL project skin tokens")
    need(".sal-vico2-hero,\n.sal-vico2-case-study {" in sal_css, "SAL skin tokens must reach both hero and case-study components")
    need("@media (max-width: 700px)" in sal_css, "SAL layer needs narrow recomposition")
    need(".sal-vico2-cover-wall a:focus-visible" in sal_css,
         "issue-cover focus must be scoped so the cover and caption column are not awkwardly outlined together")
    need(".sal-vico2-cover-wall a:focus-visible img" in sal_css,
         "issue-cover keyboard focus must remain visibly attached to the cover image")
    need(
        ".sal-vico2-meta .case-study-meta > div {" in sal_css
        and "padding: var(--space-6) var(--space-5);" in sal_css,
        "SAL metadata cells need explicit valid padding instead of the undefined shared space token",
    )
    need(
        ".sal-vico2-archive-cta {" in sal_css
        and ".sal-vico2-archive-link" in sal_css,
        "SAL archive CTA needs its bounded layout and link treatment",
    )
    need("box-shadow" not in sal_css, "SAL VicO2 slice must stay shadow-free")
    need("linear-gradient" not in sal_css, "SAL VicO2 slice must stay gradient-free")

    private_terms = ["Private comparison", "VicO2 proposal", "Current page", "source-honest", "Do not import"]
    for term in private_terms:
        need(term not in html, f"private comparison language must not ship: {term}")
    need("style=" not in html, "production markup must not use inline styles")
    need(not re.search(r"(?m)^\ufeff?\d+\|", html), "line-number prefixes from tool output must not leak into production HTML")
    need("abilityexperience.html" in html, "shared previous-project navigation must remain")
    need("pikappapp.html" in html, "shared next-project navigation must remain")

    if failures:
        print("SAL VICO2 PRODUCTION CONTRACT: FAIL")
        for failure in failures:
            print(f"- {failure}")
        return 1
    print("SAL VICO2 PRODUCTION CONTRACT: PASS")
    print("- existing narrative, 31 images, nine issue links, and verified awards preserved")
    print("- four reusable VicO2 chapters and bounded SAL skin present")
    print("- shared site, accessibility, responsive, and privacy boundaries present")
    return 0


if __name__ == "__main__":
    sys.exit(main())
