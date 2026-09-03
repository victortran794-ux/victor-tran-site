#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "resume.json"
MANIFEST = ROOT / "data" / "resume-artifact.json"
PDF = ROOT / "documents" / "Victor-Tran-Resume.pdf"
SHELL = ROOT / "data" / "site-shell.json"

failures: list[str] = []

def need(condition: bool, message: str) -> None:
    if not condition:
        failures.append(message)

def read_json(path: Path) -> dict:
    if not path.exists():
        failures.append(f"missing {path.relative_to(ROOT)}")
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as error:
        failures.append(f"invalid JSON in {path.relative_to(ROOT)}: {error}")
        return {}

source = read_json(SOURCE)
manifest = read_json(MANIFEST)
shell = read_json(SHELL)

expected_url = "documents/Victor-Tran-Resume.pdf"
need(shell.get("resumeUrl") == expected_url, "site shell must own the canonical résumé URL")

for required in [
    "Visual Designer at IBM | Enterprise AI & Automation, Product Design & Design Systems",
    "Visual Designer, IBM watsonx Orchestrate | AI & Automation",
    "January 2024–Present",
    "Visual Designer, IBM Cloud | Observability",
    "January 2021–December 2023",
    "Assistant Executive Director of Communications",
    "Graphic Designer",
    "Western Michigan University",
    "BFA, Graphic Design",
]:
    need(required in json.dumps(source, ensure_ascii=False), f"résumé source missing required content: {required}")

source_text = json.dumps(source, ensure_ascii=False)
for banned in [
    "DRAFT",
    "January 2021–January 2024",
    "3.83 GPA",
    "Charles Schwab",
    "Stripe",
    "Vercel",
    "27/20/8",
    "81,000",
    "one-month acceleration",
    "—",
]:
    need(banned not in source_text, f"résumé source contains banned or non-general content: {banned}")

if PDF.exists():
    pdf_bytes = PDF.read_bytes()
    need(pdf_bytes.startswith(b"%PDF-"), "résumé artifact is not a PDF")
    actual_hash = hashlib.sha256(pdf_bytes).hexdigest()
    need(manifest.get("sha256") == actual_hash, "résumé PDF hash does not match its manifest")
    try:
        doc = pymupdf.open(PDF)
        need(doc.page_count == 1, f"résumé must be exactly one page; found {doc.page_count}")
        extracted = "\n".join(page.get_text("text") for page in doc)
        normalized = re.sub(r"\s+", " ", extracted).strip()
        need("�" not in extracted and "\x00" not in extracted, "résumé extraction contains invalid Unicode replacement or NUL characters")
        for required in [
            "Victor Tran",
            "IBM watsonx Orchestrate",
            "January 2024–Present",
            "January 2021–December 2023",
            "Western Michigan University",
        ]:
            need(required in normalized, f"PDF extraction missing required content: {required}")
        for banned in ["DRAFT", "January 2021–January 2024", "3.83 GPA", "—"]:
            need(banned not in normalized, f"PDF extraction contains banned content: {banned}")
        font_names = {font[3] for page in doc for font in page.get_fonts(full=True)}
        for family in ["Barlow", "DMSerifDisplay", "SourceCodePro"]:
            need(any(family.lower() in name.lower().replace("-", "") for name in font_names), f"PDF is missing embedded {family} font resources")
        page = doc[0]
        text_blocks = [block for block in page.get_text("blocks") if block[4].strip()]
        content_bottom = max((block[3] for block in text_blocks), default=0)
        need(650 <= content_bottom <= 760, f"résumé page utilization must be balanced; final text bottom is {content_bottom:.1f}pt")
        text_sizes = [
            span["size"]
            for block in page.get_text("dict")["blocks"] if "lines" in block
            for line in block["lines"]
            for span in line["spans"] if span["text"].strip()
        ]
        need(bool(text_sizes) and min(text_sizes) >= 8.5, f"résumé text is too small; minimum rendered size is {min(text_sizes, default=0):.1f}pt")
        links = [link.get("uri", "") for page in doc for link in page.get_links()]
        for uri in ["mailto:victortran794@gmail.com", "https://www.victortrandesign.com", "https://www.linkedin.com/in/victortrandesign/"]:
            need(uri in links, f"PDF missing clickable link: {uri}")
        doc.close()
    except Exception as error:
        failures.append(f"unable to inspect résumé PDF: {error}")
else:
    failures.append("missing documents/Victor-Tran-Resume.pdf")

pages = shell.get("pages", [])
for page in pages:
    page_path = ROOT / page
    if not page_path.exists():
        failures.append(f"missing shell page {page}")
        continue
    html = page_path.read_text(encoding="utf-8")
    link = f'<a href="{expected_url}" target="_blank" rel="noopener">Résumé</a>'
    need(link in html, f"{page} footer is missing the canonical résumé link")

if failures:
    print("RÉSUMÉ ARTIFACT CONTRACT: FAIL")
    for failure in failures:
        print(f"- {failure}")
    sys.exit(1)

print(f"RÉSUMÉ ARTIFACT CONTRACT: PASS pages={len(pages)} pdf_pages=1 sha256={manifest['sha256']}")
