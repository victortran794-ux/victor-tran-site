#!/usr/bin/env python3
"""Generate the bounded responsive-image spike derivatives.

Run with:
  uv run --python 3.14 --with pillow==12.3.0 python3 scripts/generate-responsive-images.py
"""
import hashlib
import json
import platform
from pathlib import Path
from PIL import Image, ImageOps, __version__ as pillow_version, features

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "images" / "responsive"
JOBS = {
    "images/about-vic-japan.jpg": [480, 800, 1200],
    "images/patterns-hero.webp": [640, 1200],
    "images/pci-handbook-1-cover.webp": [640, 1200],
    "images/dna-preview.jpg": [640, 1200],
    "images/thumb-sal.webp": [540],
}

OUTPUT.mkdir(parents=True, exist_ok=True)
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

manifest = OUTPUT / "manifest.json"
manifest.write_text(json.dumps(integrity, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(f"{manifest.relative_to(ROOT).as_posix()} written with Pillow {pillow_version}")
