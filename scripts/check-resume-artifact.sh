#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if python3 -c 'import pymupdf' >/dev/null 2>&1; then
  exec python3 scripts/check-resume-artifact.py
fi

if command -v uv >/dev/null 2>&1; then
  exec uv run --with 'pymupdf==1.28.2' python3 scripts/check-resume-artifact.py
fi

echo "Résumé artifact check requires PyMuPDF 1.28.2 or uv." >&2
exit 1
