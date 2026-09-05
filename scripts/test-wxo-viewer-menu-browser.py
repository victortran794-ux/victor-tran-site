#!/usr/bin/env python3
"""Focused browser contract for Work-menu pointer and wxO viewer inspection."""
import argparse
import http.cookiejar
import json
import os
import pathlib
import sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
CHROME = "/home/victortran794/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome"


def load_cookies(context, cookie_jar):
    if not cookie_jar:
        return
    jar = http.cookiejar.MozillaCookieJar(cookie_jar)
    jar.load(ignore_discard=True, ignore_expires=True)
    context.add_cookies([
        {"name": cookie.name, "value": cookie.value, "domain": cookie.domain,
         "path": cookie.path, "secure": cookie.secure}
        for cookie in jar
    ])


def state(page):
    return page.evaluate("""() => {
      const dialog = document.querySelector('[data-wxo-gallery]');
      const status = dialog?.querySelector('[data-wxo-gallery-status]');
      const topbar = dialog?.querySelector('.pilot-gallery-topbar')?.getBoundingClientRect();
      const controls = [...(dialog?.querySelectorAll('button') || [])].map(button => {
        const rect = button.getBoundingClientRect();
        return {name: button.getAttribute('aria-label') || button.textContent.trim(),
                left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom};
      });
      const statusStyle = status && getComputedStyle(status);
      const stage = dialog?.querySelector('.pilot-gallery-stage');
      return {open: Boolean(dialog?.open), zoom: dialog?.dataset.wxoGalleryZoom || 'fit',
        stage: stage ? {scrollWidth: stage.scrollWidth, clientWidth: stage.clientWidth,
          scrollHeight: stage.scrollHeight, clientHeight: stage.clientHeight} : null,
        live: status?.getAttribute('aria-live'),
        status: status ? {position: statusStyle.position, width: status.getBoundingClientRect().width,
          height: status.getBoundingClientRect().height, text: status.textContent.trim()} : null,
        topbar, controls, overflow: document.documentElement.scrollWidth - innerWidth};
    }""")


def assert_viewer(page, route, theme, width, height, evidence_dir=None):
    page.set_viewport_size({"width": width, "height": height})
    page.goto(f"{BASE}/{route}.html", wait_until="networkidle")
    page.evaluate("""theme => { localStorage.setItem('lens', theme); location.reload(); }""", theme)
    page.wait_for_load_state("networkidle")
    trigger = page.locator('[data-wxo-evidence]').first
    trigger.focus()
    page.keyboard.press("Enter")
    opened = state(page)
    assert opened["open"], f"{route} {theme} {width}: keyboard open failed"
    assert opened["live"] == "polite", f"{route} {theme} {width}: missing polite live status"
    assert opened["status"] and opened["status"]["position"] == "absolute" and opened["status"]["width"] <= 1 and opened["status"]["height"] <= 1, f"{route} {theme} {width}: status must be visually hidden: {opened['status']}"
    assert page.locator('[data-wxo-gallery-fullscreen]').count() == 1, f"{route} {theme} {width}: missing explicit Full size control"
    page.locator('[data-wxo-gallery-fullscreen]').focus()
    page.keyboard.press("Space")
    full = state(page)
    assert full["zoom"] == "full", f"{route} {theme} {width}: Full size control did not switch viewer: {full['zoom']}"
    assert page.locator('[data-wxo-gallery-fullscreen]').get_attribute("aria-pressed") == "true", f"{route} {theme} {width}: Full size state was not exposed"
    assert full["stage"] and (full["stage"]["scrollWidth"] > full["stage"]["clientWidth"] or full["stage"]["scrollHeight"] > full["stage"]["clientHeight"]), f"{route} {theme} {width}: Full size did not preserve a pannable or scrollable image: {full['stage']}"
    assert full["topbar"]["top"] >= 0 and full["topbar"]["bottom"] <= height, f"{route} {theme} {width}: header clipped: {full['topbar']}"
    assert all(c["left"] >= 0 and c["right"] <= width and c["top"] >= 0 and c["bottom"] <= height for c in full["controls"]), f"{route} {theme} {width}: viewer control unreachable: {full['controls']}"
    assert full["overflow"] == 0, f"{route} {theme} {width}: overflow {full['overflow']}"
    if evidence_dir:
        page.screenshot(path=str(evidence_dir / f"{route}-viewer-full-{theme}-{width}x{height}.png"))
    page.keyboard.press("Escape")
    assert page.locator('[data-wxo-gallery]').evaluate("dialog => !dialog.open"), f"{route} {theme} {width}: Escape did not close"
    assert page.evaluate("""() => document.activeElement === document.querySelector('[data-wxo-evidence]')"""), f"{route} {theme} {width}: focus did not restore"


def assert_work_pointer(page):
    page.set_viewport_size({"width": 1440, "height": 900})
    page.goto(f"{BASE}/", wait_until="networkidle")
    work = page.locator('.nav-dropdown-toggle').filter(has_text="Work")
    work.hover()
    assert work.get_attribute("aria-expanded") == "true", "desktop hover should open Work"
    work.click()
    assert work.get_attribute("aria-expanded") == "true", "first real pointer click after hover must keep Work open"
    work.click()
    assert work.get_attribute("aria-expanded") == "false", "second pointer click must close Work"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--cookie-jar")
    parser.add_argument("--report")
    parser.add_argument("--evidence-dir")
    args = parser.parse_args()
    global BASE
    BASE = args.base_url.rstrip("/")
    evidence_dir = pathlib.Path(args.evidence_dir) if args.evidence_dir else None
    if evidence_dir:
        evidence_dir.mkdir(parents=True, exist_ok=True)
    results = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=CHROME, headless=True, args=["--no-sandbox"])
        context = browser.new_context()
        load_cookies(context, args.cookie_jar)
        page = context.new_page()
        try:
            assert_work_pointer(page)
            results.append("work-pointer")
            for route in ("wxo-canvas", "document-processing"):
                for theme in ("light", "dark"):
                    for width, height in ((1440, 900), (390, 844)):
                        assert_viewer(page, route, theme, width, height, evidence_dir)
                        results.append(f"{route}:{theme}:{width}x{height}")
        finally:
            browser.close()
    report = {"baseUrl": BASE, "passed": results, "count": len(results)}
    if args.report:
        pathlib.Path(args.report).write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"FAIL: {error}", file=sys.stderr)
        sys.exit(1)
