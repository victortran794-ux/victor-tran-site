#!/usr/bin/env python3
"""Build optimized static assets for the public UI Gallery from approved private derivatives."""

from __future__ import annotations

import argparse
import hashlib
import os
from pathlib import Path
from typing import Any

EKOS_SOURCE_ENV = "EKOS_UI_GALLERY_SOURCE"
EXPANDED_SOURCE_ENV = "UI_GALLERY_EXPANDED_SOURCE"

EKOS_SOURCES = {
    "desktop": "ekos-polished-desktop-v3-3.png",
}

EXPANDED_SOURCES = {
    "magi_color_type": "Magi — Color & Type System.png",
}

EXPANDED_SOURCE_SPECS = {
    "magi_color_type": ((1600, 1200), "12ed1011380ca151296a1140351a986b99439e8f020bb3abe288c4567a923bb9"),
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
        help=f"Approved Ekos V3.3 preview directory. Defaults to ${EKOS_SOURCE_ENV}.",
    )
    parser.add_argument(
        "--expanded-source",
        type=Path,
        default=Path(expanded_source) if expanded_source else None,
        help=f"Audited UI Gallery expanded-study kit. Defaults to ${EXPANDED_SOURCE_ENV}.",
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
            raise FileNotFoundError(f"Missing approved preview: {source}")
        images[name] = image_module.open(source)
    return images


def verify_expanded_sources(root: Path, images: dict[str, Any]) -> None:
    for name, (expected_size, expected_hash) in EXPANDED_SOURCE_SPECS.items():
        source = root / EXPANDED_SOURCES[name]
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
            "Pillow is required to build UI Gallery assets. Run with: "
            "uv run --isolated --with-requirements scripts/requirements-ui-gallery-assets.txt "
            "scripts/build-ui-gallery-assets.py --ekos-source <approved-ekos-directory> "
            "--expanded-source <audited-expanded-study-kit>"
        ) from exc

    args.output.mkdir(parents=True, exist_ok=True)
    ekos = load_images(args.ekos_source, EKOS_SOURCES, Image)
    expanded = load_images(args.expanded_source, EXPANDED_SOURCES, Image)
    verify_expanded_sources(args.expanded_source, expanded)

    outputs = {
        "magi-color-type.webp": resize_to_width(expanded["magi_color_type"], 800, Image),
        "ekos-desktop.webp": resize_to_width(ekos["desktop"], 1320, Image),
    }

    # The previously approved dashboard and architecture derivatives remain
    # hash-locked in the repository. New dashboard, architecture, inspector,
    # component, overlay, and node-state exports are excluded because their
    # pixels contain current-looking, operational, metric, or topology content.

    cover_source = ekos["desktop"]
    cover_height = min(cover_source.height, round(cover_source.width * 11 / 16))
    cover = cover_source.crop((0, 0, cover_source.width, cover_height))
    outputs["ekos-cover.webp"] = resize_to_width(cover, 1440, Image)

    for filename, image in outputs.items():
        destination = args.output / filename
        save_webp(image, destination, args.quality)
        print(f"{destination.relative_to(args.output.parent.parent)} {image.width}x{image.height} {destination.stat().st_size} bytes")


if __name__ == "__main__":
    main()
