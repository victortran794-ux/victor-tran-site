#!/usr/bin/env python3
"""Build the approved ten-piece Daysigns gallery derivative set."""

from __future__ import annotations

import argparse
import hashlib
import os
from pathlib import Path

SOURCE_ENV = "DAYSIGNS_GALLERY_SOURCE"
SOURCES = {
    3: ("3-private-preview.png", (817, 817), "7d118aa1fd65a56393e0e77a37f80f9afec5504215ae22391882077a5cdfabc1"),
    4: ("4-private-preview.png", (1109, 1109), "02f791ca24f459a1638f27eb8807a6abdef362c7267ffb1c89189851d0ebef0a"),
    5: ("5-private-preview.png", (1109, 1109), "03b9d113e2da396f9dbfbf4063776e556f0b9e1d567a65407ce508572b9c0f6e"),
    6: ("6-private-preview.png", (951, 951), "f540987f6859b80501b1a5b721eb708b114bbbcafeb633be8700195d2b8a9557"),
    7: ("7-private-preview.png", (951, 951), "f83254d9516d2f45fa0cc5c80b8aac830406b6b9cc1d4670684453d4254e4f8d"),
    8: ("8-private-preview.png", (951, 951), "42f3b31e0da01d53b2fd0530d38759bd3b21e375141026dc11a0b7aacc1e4ff4"),
    10: ("10-private-preview.png", (951, 951), "77c6029a3b53e9278010a62e8a678724d25dd1878dbcbd42ae5ddaf4f2a15fee"),
    11: ("11-private-preview.png", (951, 951), "67b1ecd40342615b69529c67bbae7aea7cfe2eaa30ea77c9cdb9ec76bd071aee"),
    12: ("12-private-preview.png", (951, 951), "4d8ea5553e239a9d1be1b72b2332efddaee27f237855a7f157282c92863cb2fe"),
    13: ("13-private-preview.png", (2816, 2253), "29289ccf70d5519ff0d4e552939842bdee3c4d4e77a07789d602643dc59aaf5f"),
}
OUTPUTS = {
    3: "daysign-03.webp",
    4: "daysign-04.webp",
    5: "daysign-05.webp",
    6: "daysign-06.webp",
    7: "daysign-07.webp",
    8: "daysign-08.webp",
    10: "daysign-10.webp",
    11: "daysign-11.webp",
    12: "daysign-12.webp",
    13: "daysign-13.webp",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    source = os.environ.get(SOURCE_ENV)
    parser.add_argument(
        "--source",
        type=Path,
        default=Path(source) if source else None,
        help=f"Verified Daysigns preview directory. Defaults to ${SOURCE_ENV}.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "images" / "daysigns",
    )
    parser.add_argument("--quality", type=int, default=88)
    args = parser.parse_args()
    if args.source is None:
        parser.error(f"provide --source or set {SOURCE_ENV}")
    return args


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    args = parse_args()
    try:
        from PIL import Image
    except ModuleNotFoundError as exc:
        raise SystemExit(
            "Pillow is required. Run with: uv run --isolated --with-requirements "
            "scripts/requirements-daysigns-assets.txt scripts/build-daysigns-gallery-assets.py "
            "--source <verified-daysigns-preview-directory>"
        ) from exc

    args.output.mkdir(parents=True, exist_ok=True)
    expected_outputs = set(OUTPUTS.values())

    for number, (source_name, expected_size, expected_hash) in SOURCES.items():
        source = args.source / source_name
        if not source.is_file():
            raise FileNotFoundError(f"Missing verified Daysigns source: {source}")
        if sha256(source) != expected_hash:
            raise ValueError(f"Unexpected source hash: {source}")
        with Image.open(source) as image:
            if image.size != expected_size:
                raise ValueError(f"Unexpected dimensions for {source}: {image.size}, expected {expected_size}")
            working = image.convert("RGB")
            if number != 13:
                square_size = min(working.size)
                left = (working.width - square_size) // 2
                top = (working.height - square_size) // 2
                working = working.crop((left, top, left + square_size, top + square_size))
            if working.width > 1200:
                height = round(working.height * 1200 / working.width)
                working = working.resize((1200, height), Image.Resampling.LANCZOS)
            destination = args.output / OUTPUTS[number]
            working.save(destination, "WEBP", quality=args.quality, method=6)
            print(f"{destination.name} {working.width}x{working.height} {destination.stat().st_size} bytes")

    for stale in args.output.glob("*.webp"):
        if stale.name not in expected_outputs:
            stale.unlink()
            print(f"removed stale managed output {stale.name}")


if __name__ == "__main__":
    main()
