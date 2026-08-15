#!/usr/bin/env python3
"""Build optimized static assets for the public UI Gallery from approved private derivatives."""

from __future__ import annotations

import argparse
import os
from pathlib import Path

EKOS_SOURCE_ENV = "EKOS_UI_GALLERY_SOURCE"
EXPANDED_SOURCE_ENV = "UI_GALLERY_EXPANDED_SOURCE"

EKOS_SOURCES = {
    "desktop": "ekos-polished-desktop-v3-3.png",
}

EXPANDED_SOURCES = {
    "magi_overview": "candidates/01-magi-dashboard-overview-public.png",
    "magi_architecture": "candidates/02-magi-architecture-public.png",
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

    outputs = {
        "magi-overview.webp": resize_to_width(expanded["magi_overview"], 1440, Image),
        "magi-architecture.webp": resize_to_width(expanded["magi_architecture"], 1440, Image),
        "ekos-desktop.webp": resize_to_width(ekos["desktop"], 1320, Image),
    }

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
