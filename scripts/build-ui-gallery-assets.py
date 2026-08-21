#!/usr/bin/env python3
"""Build optimized static assets for Interface Studies from approved authored exports."""

from __future__ import annotations

import argparse
import hashlib
import os
from pathlib import Path
from typing import Any

EKOS_SOURCE_ENV = "EKOS_UI_GALLERY_SOURCE"
EXPANDED_SOURCE_ENV = "UI_GALLERY_EXPANDED_SOURCE"

EKOS_SOURCES = {
    "desktop": "ekos-con-landing-page.png",
    "mobile": "ekos-con-mobile.png",
}

EKOS_SOURCE_SPECS = {
    "desktop": ((2880, 6138), "cf8c380e47faa51e02ebcf9d6f8faa7c736f23b794ca3c5f3e0930b1841e8f49"),
    "mobile": ((780, 7022), "5c13977bcd8e59f209fa0137ba11013f45cac2e9bd9b9ed179ecf949e92ee028"),
}

EXPANDED_SOURCES = {
    "magi_overview": "Magi — Dashboard Overview.png",
    "magi_architecture": "Magi — Architecture Canvas.png",
    "magi_overlays": "Magi — Overlay Patterns.png",
    "magi_color_type": "Magi — Color & Type System.png",
    "magi_components": "Magi — Component Studies.png",
    "magi_node_states": "Magi — Node State Specimens.png",
}

EXPANDED_SOURCE_SPECS = {
    "magi_overview": ((2880, 2048), "90744f173d4c1e296f31c1946a440339797e0839dd23f21490d6a7bf29115f4b"),
    "magi_architecture": ((2400, 1600), "e960484e4a26b011b99b6129ba8b1b9c9fde8730976cf9c88a5b0baad1e727ac"),
    "magi_overlays": ((1800, 1280), "39807707b5fe53dc635cedfeb7401cefeae1d9604bfd97f17fbd7bcd5301b463"),
    "magi_color_type": ((1600, 1200), "12ed1011380ca151296a1140351a986b99439e8f020bb3abe288c4567a923bb9"),
    "magi_components": ((2400, 1800), "ce7a3f843018c1687a11f42500d44d5dc27144d476404e09fe82c2eae2b09a38"),
    "magi_node_states": ((2800, 400), "4ea5f9db09800f40bb08eba3d779c96f3012abd8938c3731387cf5b14e5010a1"),
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    ekos_source = os.environ.get(EKOS_SOURCE_ENV)
    expanded_source = os.environ.get(EXPANDED_SOURCE_ENV)
    parser.add_argument(
        "--ekos-source",
        "--source",
        dest="ekos_source",
        type=Path,
        default=Path(ekos_source) if ekos_source else None,
        help=f"Approved Ekos export directory. Defaults to ${EKOS_SOURCE_ENV}.",
    )
    parser.add_argument(
        "--expanded-source",
        type=Path,
        default=Path(expanded_source) if expanded_source else None,
        help=f"Approved Interface Studies source directory. Defaults to ${EXPANDED_SOURCE_ENV}.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "images" / "ui-gallery",
    )
    parser.add_argument("--quality", type=int, default=84)
    args = parser.parse_args()
    if args.ekos_source is None:
        parser.error(f"provide --ekos-source or set {EKOS_SOURCE_ENV}")
    if args.expanded_source is None:
        parser.error(f"provide --expanded-source or set {EXPANDED_SOURCE_ENV}")
    return args


def resize_to_width(image, width: int, image_module):
    if image.width <= width:
        return image.copy()
    height = round(image.height * width / image.width)
    return image.resize((width, height), image_module.Resampling.LANCZOS)


def load_images(root: Path, sources: dict[str, str], image_module):
    images = {}
    for name, filename in sources.items():
        source = root / filename
        if not source.is_file():
            raise FileNotFoundError(f"Missing approved export: {source}")
        images[name] = image_module.open(source)
    return images


def verify_sources(
    root: Path,
    sources: dict[str, str],
    specs: dict[str, tuple[tuple[int, int], str]],
    images: dict[str, Any],
) -> None:
    for name, (expected_size, expected_hash) in specs.items():
        source = root / sources[name]
        actual_hash = hashlib.sha256(source.read_bytes()).hexdigest()
        if images[name].size != expected_size:
            raise ValueError(
                f"Unexpected dimensions for {source}: {images[name].size}, expected {expected_size}"
            )
        if actual_hash != expected_hash:
            raise ValueError(
                f"Unexpected source hash for {source}: {actual_hash}, expected {expected_hash}"
            )


def save_webp(image, destination: Path, quality: int) -> None:
    image.convert("RGB").save(destination, "WEBP", quality=quality, method=6)


def main() -> None:
    args = parse_args()
    try:
        from PIL import Image
    except ModuleNotFoundError as exc:
        raise SystemExit(
            "Pillow is required to build Interface Studies assets. Run with: "
            "uv run --isolated --with-requirements scripts/requirements-ui-gallery-assets.txt "
            "scripts/build-ui-gallery-assets.py --ekos-source <approved-ekos-directory> "
            "--expanded-source <approved-interface-study-directory>"
        ) from exc

    args.output.mkdir(parents=True, exist_ok=True)
    ekos = load_images(args.ekos_source, EKOS_SOURCES, Image)
    expanded = load_images(args.expanded_source, EXPANDED_SOURCES, Image)
    verify_sources(args.ekos_source, EKOS_SOURCES, EKOS_SOURCE_SPECS, ekos)
    verify_sources(args.expanded_source, EXPANDED_SOURCES, EXPANDED_SOURCE_SPECS, expanded)

    outputs = {
        "magi-overview.webp": resize_to_width(expanded["magi_overview"], 1440, Image),
        "magi-architecture.webp": resize_to_width(expanded["magi_architecture"], 1440, Image),
        "magi-overlays.webp": resize_to_width(expanded["magi_overlays"], 900, Image),
        "magi-color-type.webp": resize_to_width(expanded["magi_color_type"], 800, Image),
        "magi-components.webp": resize_to_width(expanded["magi_components"], 1200, Image),
        "magi-node-states.webp": resize_to_width(expanded["magi_node_states"], 1400, Image),
        "ekos-desktop.webp": resize_to_width(ekos["desktop"], 1440, Image),
        "ekos-mobile.webp": ekos["mobile"].copy(),
    }

    # Inspector & Metrics is intentionally omitted because its large empty canvas
    # duplicates dashboard and component evidence without strengthening the edit.
    cover_source = ekos["desktop"]
    cover_height = min(cover_source.height, round(cover_source.width * 11 / 16))
    cover = cover_source.crop((0, 0, cover_source.width, cover_height))
    outputs["ekos-cover.webp"] = resize_to_width(cover, 1366, Image)

    for filename, image in outputs.items():
        destination = args.output / filename
        save_webp(image, destination, args.quality)
        print(
            f"{destination.relative_to(args.output.parent.parent)} "
            f"{image.width}x{image.height} {destination.stat().st_size} bytes"
        )


if __name__ == "__main__":
    main()
