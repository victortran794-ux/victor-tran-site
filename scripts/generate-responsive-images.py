#!/usr/bin/env python3
"""Generate the bounded responsive-image spike derivatives.

Run with:
  uv run --python 3.14 --with pillow==12.3.0 python3 scripts/generate-responsive-images.py
"""
import hashlib
import json
import os
import platform
from pathlib import Path
from PIL import Image, ImageOps, __version__ as pillow_version, features

ROOT = Path(os.environ.get("RESPONSIVE_IMAGES_ROOT", Path(__file__).resolve().parent.parent)).resolve()
OUTPUT = ROOT / "images" / "responsive"
JOBS = {
    "images/about-vic-japan.jpg": [480, 800, 1200],
    "images/patterns-hero.webp": [640, 1200],
    "images/pci-handbook-1-cover.webp": [640, 1200],
    "images/dna-preview.jpg": [640, 1200],
    "images/thumb-sal.webp": [540],
    "images/illus-ibm-selectric-web.jpg": [480, 960, 1440],
    "images/art-archive-v2/old-one.webp": [240, 480],
    **{f"images/illus-untitled-{version}.jpg": [320, 640, 800] for version in range(5, 12)},
}

def expected_outputs():
    return {
        f"images/responsive/{Path(source_name).stem}-{width}.webp"
        for source_name, widths in JOBS.items()
        for width in widths
    }


GRAPHIC_JOBS = {
    'images/logos-2.jpg': [480, 768, 1200], 'images/gg-edc-1.jpg': [320, 480],
    'images/gg-edc-0.jpg': [480, 768, 1280], 'images/gg-edc-2.jpg': [480, 768, 1280], 'images/gg-edc-3.jpg': [480, 768, 1280],
    'images/thumb-sgla.webp': [320, 480, 768], 'images/graphic-archive-v2/sgla-2024-identity-development.webp': [480, 768, 1200],
    'images/graphic-archive-v2/sgla-2023-brand-guidelines.webp': [480, 768, 1280], 'images/graphic-archive-v2/sgla-2024-ballroom-system.webp': [480, 768, 1280], 'images/graphic-archive-v2/sgla-2024-signage-system.webp': [768, 1280, 2048],
    **{f'images/gg-slides-{number}.jpg': [320, 480, 640] for number in range(1, 17)},
    'images/gg-day-of-giving.png': [480, 768, 1024], 'images/graphic-archive-v2/dog.webp': [480, 768, 1024], 'images/gg-ibm-fan.jpg': [480, 1024, 1600], 'images/logos-1.jpg': [768, 1280, 2048], 'images/graphic-archive-v2/chantico.webp': [480, 768, 1024], 'images/logos-3.jpg': [480, 768, 1024], 'images/logos-4.jpg': [480, 768, 1024], 'images/graphic-archive-v2/abex.webp': [480, 768, 1200], 'images/graphic-archive-v2/ibm-paltron-illustration-system.webp': [480, 768, 1200], 'images/graphic-archive-v2/wxo-illustration-system.webp': [480, 768, 1280], 'images/gg-illus-1.jpg': [320, 480, 768], 'images/gg-illus-2.jpg': [320, 480, 768], 'images/gg-illus-3.jpg': [320, 480, 768], 'images/gg-infographic.jpg': [768, 1280, 2048],
}
EXPECTED_OUTPUTS = expected_outputs()
GRAPHIC_OUTPUT = OUTPUT / 'graphic'
EXPECTED_GRAPHIC_OUTPUTS = {f'images/responsive/graphic/{Path(source).stem}-w{width}.webp' for source, widths in GRAPHIC_JOBS.items() for width in widths}
OUTPUT.mkdir(parents=True, exist_ok=True)
GRAPHIC_OUTPUT.mkdir(parents=True, exist_ok=True)
# `images/responsive` is the generator's canonical WebP output directory. Reconcile
# only its WebPs; unrelated files (for example notes) remain untouched.
for candidate in OUTPUT.glob("*.webp"):
    if candidate.relative_to(ROOT).as_posix() not in EXPECTED_OUTPUTS:
        candidate.unlink()
# Graphic has an explicitly owned route. Reconcile only direct WebP children;
# never recurse into sibling routes or remove non-WebP files.
for candidate in GRAPHIC_OUTPUT.glob("*.webp"):
    if candidate.relative_to(ROOT).as_posix() not in EXPECTED_GRAPHIC_OUTPUTS:
        candidate.unlink()
integrity = {
    "pillowVersion": pillow_version,
    "runtime": {
        "python": ".".join(platform.python_version_tuple()[:2]),
        "webp": features.version_module("webp"),
    },
    "encoder": {"format": "WEBP", "quality": 82, "method": 6},
    "sources": {},
    "outputs": {},
}
for source_name, widths in JOBS.items():
    source = ROOT / source_name
    source_bytes = source.read_bytes()
    integrity["sources"][source_name] = {
        "bytes": len(source_bytes),
        "sha256": hashlib.sha256(source_bytes).hexdigest(),
    }
    stem = source.stem
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened).convert("RGB")
        for width in widths:
            height = round(image.height * width / image.width)
            resized = image.resize((width, height), Image.Resampling.LANCZOS)
            destination = OUTPUT / f"{stem}-{width}.webp"
            resized.save(destination, "WEBP", quality=82, method=6)
            relative = destination.relative_to(ROOT).as_posix()
            output_bytes = destination.read_bytes()
            integrity["outputs"][relative] = {
                "width": width,
                "height": height,
                "bytes": len(output_bytes),
                "sha256": hashlib.sha256(output_bytes).hexdigest(),
            }
            print(f"{relative} {width}x{height} {len(output_bytes)} bytes")

for source_name, widths in GRAPHIC_JOBS.items():
    source = ROOT / source_name
    source_bytes = source.read_bytes()
    integrity["sources"][source_name] = {
        "bytes": len(source_bytes),
        "sha256": hashlib.sha256(source_bytes).hexdigest(),
    }
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened).convert("RGB")
        for width in widths:
            height = round(image.height * width / image.width)
            resized = image.resize((width, height), Image.Resampling.LANCZOS)
            destination = GRAPHIC_OUTPUT / f"{source.stem}-w{width}.webp"
            resized.save(destination, "WEBP", quality=82, method=6)
            relative = destination.relative_to(ROOT).as_posix()
            output_bytes = destination.read_bytes()
            integrity["outputs"][relative] = {
                "width": width, "height": height, "bytes": len(output_bytes),
                "sha256": hashlib.sha256(output_bytes).hexdigest(),
            }
            print(f"{relative} {width}x{height} {len(output_bytes)} bytes")

manifest = OUTPUT / "manifest.json"
manifest.write_text(json.dumps(integrity, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(f"{manifest.relative_to(ROOT).as_posix()} written with Pillow {pillow_version}")
