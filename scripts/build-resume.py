#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import html
import json
from datetime import datetime, timezone
from pathlib import Path

import pymupdf
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import HRFlowable, KeepTogether, Paragraph, SimpleDocTemplate, Spacer

ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = ROOT / "data" / "resume.json"
OUTPUT_PATH = ROOT / "documents" / "Victor-Tran-Resume.pdf"
MANIFEST_PATH = ROOT / "data" / "resume-artifact.json"
FONT_DIR = ROOT / "assets" / "resume-fonts"
FIXED_DATE = datetime(2026, 9, 3, tzinfo=timezone.utc)

INK = colors.HexColor("#1A1A1A")
MUTED = colors.HexColor("#6E6E6E")
BLUE = colors.HexColor("#55A2F7")
BLUE_TEXT = colors.HexColor("#2468A9")
BORDER = colors.HexColor("#E5E5E3")


class DeterministicCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        kwargs["invariant"] = 1
        kwargs["pageCompression"] = 1
        super().__init__(*args, **kwargs)
        self.setAuthor("Victor Tran")
        self.setCreator("Victor Tran portfolio résumé builder")
        self.setTitle("Victor Tran Résumé")


def register_fonts() -> None:
    fonts = {
        "Barlow": FONT_DIR / "barlow" / "Barlow-Regular.ttf",
        "Barlow-SemiBold": FONT_DIR / "barlow" / "Barlow-SemiBold.ttf",
        "DMSerifDisplay": FONT_DIR / "dm-serif-display" / "DMSerifDisplay-Regular.ttf",
        "SourceCodePro": FONT_DIR / "source-code-pro" / "SourceCodePro-Regular.ttf",
        "SourceCodePro-Semibold": FONT_DIR / "source-code-pro" / "SourceCodePro-Semibold.ttf",
    }
    for name, path in fonts.items():
        if not path.exists():
            raise FileNotFoundError(path)
        if name not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(TTFont(name, str(path)))


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def linked(label: str, href: str, color: str = "#2468A9") -> str:
    return f'<link href="{esc(href)}" color="{color}">{esc(label)}</link>'


def styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "name": ParagraphStyle("resume-name", parent=base["Normal"], fontName="DMSerifDisplay", fontSize=24, leading=25, textColor=INK, alignment=TA_LEFT, spaceAfter=5),
        "contact": ParagraphStyle("resume-contact", parent=base["Normal"], fontName="Barlow", fontSize=9, leading=11.2, textColor=MUTED, alignment=TA_LEFT, spaceAfter=3),
        "headline": ParagraphStyle("resume-headline", parent=base["Normal"], fontName="SourceCodePro-Semibold", fontSize=8.8, leading=11.2, textColor=BLUE_TEXT, alignment=TA_LEFT, spaceBefore=7, spaceAfter=4),
        "body": ParagraphStyle("resume-body", parent=base["Normal"], fontName="Barlow", fontSize=10.2, leading=13.8, textColor=INK, alignment=TA_LEFT, spaceAfter=8),
        "expertise": ParagraphStyle("resume-expertise", parent=base["Normal"], fontName="Barlow-SemiBold", fontSize=9.1, leading=11.8, textColor=BLUE_TEXT, alignment=TA_LEFT, spaceAfter=6),
        "section": ParagraphStyle("resume-section", parent=base["Normal"], fontName="SourceCodePro-Semibold", fontSize=8.6, leading=10.8, textColor=BLUE_TEXT, alignment=TA_LEFT, spaceBefore=14, spaceAfter=2),
        "company": ParagraphStyle("resume-company", parent=base["Normal"], fontName="Barlow-SemiBold", fontSize=10.1, leading=12.2, textColor=BLUE_TEXT, alignment=TA_LEFT, spaceBefore=7, spaceAfter=0.8),
        "role": ParagraphStyle("resume-role", parent=base["Normal"], fontName="Barlow-SemiBold", fontSize=9.3, leading=11.6, textColor=INK, alignment=TA_LEFT, spaceAfter=2.5),
        "bullet": ParagraphStyle("resume-bullet", parent=base["Normal"], fontName="Barlow", fontSize=9.5, leading=12.6, textColor=INK, alignment=TA_LEFT, leftIndent=11, firstLineIndent=-8, spaceAfter=4),
        "small": ParagraphStyle("resume-small", parent=base["Normal"], fontName="Barlow", fontSize=9.4, leading=11.8, textColor=INK, alignment=TA_LEFT, spaceAfter=2),
    }


def section(label: str, style: ParagraphStyle):
    return [
        Paragraph(esc(label.upper()), style),
        HRFlowable(width="100%", thickness=0.6, color=BORDER, spaceBefore=0, spaceAfter=1.5),
    ]


def build() -> None:
    register_fonts()
    data = json.loads(SOURCE_PATH.read_text(encoding="utf-8"))
    candidate = data["candidate"]
    resume = data["resume"]
    s = styles()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    document = SimpleDocTemplate(
        str(OUTPUT_PATH),
        pagesize=letter,
        leftMargin=0.55 * inch,
        rightMargin=0.55 * inch,
        topMargin=0.70 * inch,
        bottomMargin=0.45 * inch,
        title="Victor Tran Résumé",
        author="Victor Tran",
        creator="Victor Tran portfolio résumé builder",
    )

    contact = (
        f'{esc(candidate["location"])} | {esc(candidate["phone"])} | '
        f'{linked(candidate["email"], "mailto:" + candidate["email"], "#6E6E6E")}'
    )
    profiles = (
        f'{linked(candidate["portfolio"], "https://" + candidate["portfolio"])} | '
        f'{linked(candidate["linkedin"], "https://" + candidate["linkedin"])}'
    )
    story = [
        Paragraph(esc(candidate["name"]), s["name"]),
        Paragraph(contact, s["contact"]),
        Paragraph(profiles, s["contact"]),
        Paragraph(esc(resume["headline"].upper()), s["headline"]),
        HRFlowable(width="100%", thickness=1.15, color=BLUE, spaceBefore=0, spaceAfter=4),
        Paragraph(esc(resume["summary"]), s["body"]),
        Paragraph(esc(resume["expertise"]), s["expertise"]),
    ]
    story.extend(section("Professional Experience", s["section"]))

    for item in resume["experience"]:
        block = [
            Paragraph(f'{esc(item["company"])} <font name="Barlow" color="#6E6E6E">| {esc(item["location"])}</font>', s["company"]),
        ]
        if "role" in item:
            block.append(Paragraph(f'{esc(item["role"])} <font name="SourceCodePro" size="8.5" color="#6E6E6E">| {esc(item["dates"])}</font>', s["role"]))
        else:
            for role in item["roles"]:
                block.append(Paragraph(esc(role), s["role"]))
        block.extend(Paragraph(f'• {esc(bullet)}', s["bullet"]) for bullet in item["bullets"])
        story.append(KeepTogether(block))

    story.extend(section("Education", s["section"]))
    story.append(Paragraph(esc(resume["education"]), s["small"]))
    story.extend(section("Design & Tools", s["section"]))
    story.append(Paragraph(esc(resume["tools"]), s["small"]))
    story.append(Spacer(1, 1))

    document.build(story, canvasmaker=DeterministicCanvas)

    pdf_bytes = OUTPUT_PATH.read_bytes()
    source_bytes = SOURCE_PATH.read_bytes()
    with pymupdf.open(OUTPUT_PATH) as pdf:
        if pdf.page_count != 1:
            raise RuntimeError(f"expected one page, found {pdf.page_count}")
        extracted = "\n".join(page.get_text("text") for page in pdf)
        if "�" in extracted or "\x00" in extracted:
            raise RuntimeError("invalid Unicode extraction")
        page_width, page_height = pdf[0].rect.width, pdf[0].rect.height

    manifest = {
        "artifact": str(OUTPUT_PATH.relative_to(ROOT)).replace("\\", "/"),
        "source": str(SOURCE_PATH.relative_to(ROOT)).replace("\\", "/"),
        "sha256": hashlib.sha256(pdf_bytes).hexdigest(),
        "sourceSha256": hashlib.sha256(source_bytes).hexdigest(),
        "pages": 1,
        "pageSizePoints": [page_width, page_height],
        "fixedBuildDate": FIXED_DATE.isoformat(),
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Built {manifest['artifact']} pages=1 sha256={manifest['sha256']}")


if __name__ == "__main__":
    build()
