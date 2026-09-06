#!/usr/bin/env python3
"""Generate Home hero portrait delivery derivatives with Pillow 12.3.0.

Run with:
  uv run --python 3.14 --with pillow==12.3.0 python3 scripts/generate-home-portrait-derivatives.py
"""
import hashlib
import json
import os
import platform
from pathlib import Path

from PIL import Image, ImageOps, __version__ as pillow_version, features

ROOT = Path(os.environ.get("HOME_PORTRAIT_ROOT", Path(__file__).resolve().parent.parent)).resolve()
OUTPUT = ROOT / "images" / "hero" / "responsive"
JOBS = {
    "images/hero/figure20.webp": [320, 640],
    "images/hero/figure19.webp": [320, 640],
}
ENCODER = {"format": "WEBP", "quality": 82, "method": 6}

OUTPUT.mkdir(parents=True, exist_ok=True)
integrity = {
    "generator": "scripts/generate-home-portrait-derivatives.py",
    "pillowVersion": pillow_version,
    "runtime": {
        "python": ".".join(platform.python_version_tuple()[:2]),
        "webp": features.version_module("webp"),
    },
    "encoder": ENCODER,
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
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened).convert("RGBA")
        for width in widths:
            height = round(image.height * width / image.width)
            resized = image.resize((width, height), Image.Resampling.LANCZOS)
            destination = OUTPUT / f"{source.stem}-{width}.webp"
            resized.save(destination, **ENCODER)
            output_bytes = destination.read_bytes()
            relative = destination.relative_to(ROOT).as_posix()
            integrity["outputs"][relative] = {
                "width": width,
                "height": height,
                "bytes": len(output_bytes),
                "sha256": hashlib.sha256(output_bytes).hexdigest(),
            }
            print(f"{relative} {width}x{height} {len(output_bytes)} bytes")

manifest = OUTPUT / "provenance.json"
manifest.write_text(json.dumps(integrity, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(f"{manifest.relative_to(ROOT).as_posix()} written with Pillow {pillow_version}")
