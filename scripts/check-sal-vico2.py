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

    # Approved public narrative must not silently disappear or regress to the
    # earlier over-direct ownership framing.
    need('class="sal-vico2-hero-note"' not in html, "removed repetitive hero note must not return")
    need('The Final Issue' not in html, "caption must not imply that the magazine ended")
    required_copy = [
        "Over five years, I helped shape the layout and art direction of Pi Kappa Phi’s official magazine, stepping into the creative director role in 2018.",
        '“To Connie, the rose of Pi Kappa Phi.” A tribute to the fraternity’s First Lady, from my final issue as art director.',
        "My role grew from layout design into creative direction, and I continued designing each issue.",
        "First published in fall 1909, Star &amp; Lamp is Pi Kappa Phi’s official magazine. Across five years of issues, the publication developed a more flexible editorial system.",
        "Select a cover to read that issue on Issuu.",
        "View the complete issue archive",
        "Editorial features and chapter stories from issues I art directed.",
        '"A Common Bond": six brothers from across generations weigh in on the call to lead and the duty to serve.',
        '"Thirty Under 30" celebrates thirty alumni redefining what it means to lead.',
        "Stories of the men who ride, build, and serve through The Ability Experience.",
        "Four favorite spreads from the Summer 2017 issue.",
        '"Test on 10th" balances photography, pull quotes, and dense reporting across the spread.',
        "Four more cover stories from the archive, presented chronologically.",
        '"Woven into the lives of others" collects stories from the summer Ability Experience.',
        '“The Challenge We Must Face” takes a hard look at the fraternity in the wake of a brother’s death.',
        '"Throwing Bones" follows Kenny Capps as he runs the Mountains-to-Sea Trail in the face of cancer.',
        '“Leading the Decade” marks ten years of Pi Kapp College for Emerging Leaders.',
    ]
    for copy in required_copy:
        need(copy in html, f"missing existing public narrative: {copy[:72]}")
    for retired_copy in [
        "I led layout and art direction for Pi Kappa Phi’s official magazine from 2016 to 2020.",
        "in my last issue as creative director",
        "My role grew from primary designer to creative director while I continued designing.",
        "Four highlight spreads from my first issue as creative director.",
    ]:
        need(retired_copy not in html, f"retired ownership framing returned: {retired_copy[:72]}")

    # Source-backed recognition: the unchanged 2019 line remains held, while
    # the 2018 FCA result names the official category and recipient.
    # Primary records: https://fraternitycommunications.com/2018-fca-award-winners
    # and https://issuu.com/pikappaphi/docs/s_l_spr2018 (published Summer 2018).
    need(
        "2019 · 3rd Place Overall Magazine Excellence" in html,
        "2019 recognition must remain unchanged pending its primary record",
    )
    award_2018 = "2018 · Third Place · Fred F. Yoder Award for Overall Excellence · Pi Kappa Phi, for Star &amp; Lamp"
    need(award_2018 in html, f"missing source-backed 2018 recognition: {award_2018}")
    need(
        "2018 · 3rd Place Overall Magazine Excellence" not in html,
        "superseded generic 2018 recognition must not remain",
    )

    # Each Summer 2017 image is a distinct spread and needs its own concise,
    # image-backed alternative text.
    summer_2017_alts = {
        "sal-sum2017-1.jpg": "Summer 2017 Our Chapters group photo and chapter scorecards",
        "sal-sum2017-2.jpg": "Summer 2017 At 40 anniversary illustration",
        "sal-sum2017-3.jpg": "Summer 2017 Chapter Snapshot and Pi Kappa Phi Journey infographics",
        "sal-sum2017-4.jpg": "Summer 2017 2016 Financials tables and charts",
    }
    for source, alt in summer_2017_alts.items():
        need(
            bool(re.search(rf'<img[^>]*src="images/{re.escape(source)}"[^>]*alt="{re.escape(alt)}"', html)),
            f"Summer 2017 spread needs its source-backed alt text: {source}",
        )
    need(
        html.count('alt="Summer 2017 spread"') == 0,
        "generic duplicate Summer 2017 alternatives must not remain",
    )

    common_bond_caption = "Summer 2018 · Cover Feature"
    need(common_bond_caption in html, "A Common Bond caption must use the Summer 2018 issue label")
    need("Spring 2018 · Cover Feature" not in html, "A Common Bond caption must not use the Issuu slug season")

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
        '"description": "Five years of editorial design and art direction for Pi Kappa Phi’s century-old magazine."' in projects,
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

    issue_cards = [
        ("Fall 2016", "starandlamp_fall16_issuu"),
        ("Summer 2017", "star_lamp_sum2017_online"),
        ("Winter 2017", "starandlamp_fall17_issuu"),
        ("Summer 2018", "s_l_spr2018"),
        ("Fall 2018", "s_l_fal2018_issuu"),
        ("Summer 2019", "issuu_s_l_spr2019"),
        ("Fall 2019", "s_l_fal2019_issuu"),
        ("Summer 2020", "s_l_spr2020_digital__4_"),
        ("Fall 2020", "s_l_fall2020_final_proof"),
    ]
    issue_hrefs = [
        f"https://issuu.com/pikappaphi/docs/{slug}"
        for _, slug in issue_cards
    ]
    linked_issues = [
        attrs.get("href") for tag, attrs in audit.tags
        if tag == "a" and attrs.get("href", "").startswith("https://issuu.com/pikappaphi/docs/")
    ]
    need(linked_issues == issue_hrefs, "all nine issue cards must use the exact official Issuu document URLs")
    for label, slug in issue_cards:
        href = f"https://issuu.com/pikappaphi/docs/{slug}"
        need(
            bool(re.search(
                rf'<a href="{re.escape(href)}"[^>]*><img[^>]*alt="{re.escape(label)} cover"[^>]*><span>{re.escape(label)}</span></a>',
                html,
            )),
            f"issue card must preserve its exact accessible cover title and visible label: {label}",
        )
    need(
        bool(re.search(
            r'<a class="sal-vico2-archive-link" href="https://issuu\.com/pikappaphi"[^>]*>View the complete issue archive',
            html,
        )),
        "separate generic all-issues archive CTA must remain",
    )
    need("https://pikapp.org/about/star-lamp/" in html, "latest-issues link must remain")
    need(
        bool(re.search(
            r'<img[^>]*src="images/sal-f2017-cover-story\.jpg"[^>]*alt="Winter 2017 cover story spread"[^>]*><figcaption><span class="section-label">Winter 2017 · Cover Story</span>',
            html,
        )),
        "Winter 2017 cover-story image and section label must use the official issue date",
    )

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
    for undefined_token in ["--space-7", "--tracking-label", "--text-small", "--dur-med"]:
        need(
            f"var({undefined_token})" not in shared_css + sal_css,
            f"VicO2 CSS must not reference undefined token: {undefined_token}",
        )
    need(
        "padding: var(--space-6) var(--space-5) var(--space-6) 0" in shared_css,
        "shared VicO2 metadata must use the existing 24px spacing token",
    )
    need(
        "letter-spacing: 0.08em" in shared_css and "letter-spacing: 0.08em" in sal_css,
        "VicO2 labels must use the established uppercase tracking",
    )
    need(
        "font-size: var(--text-label)" in sal_css,
        "SAL archive labels must use the existing 13px label token",
    )
    need(
        "transition: transform var(--duration-base) var(--ease-out)" in sal_css,
        "SAL cover motion must use the existing base duration token",
    )
    need(".sal-vico2-hero,\n.sal-vico2-case-study {" in sal_css, "SAL skin tokens must reach both hero and case-study components")
    need("@media (max-width: 700px)" in sal_css, "SAL layer needs narrow recomposition")
    need(
        ".sal-vico2-evidence > div + div" not in sal_css,
        "recognition evidence must not draw an internal divider through long award headings",
    )
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
