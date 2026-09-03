#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v uv >/dev/null 2>&1; then
  echo "Résumé reproducibility check requires uv." >&2
  exit 1
fi

build() {
  uv run --with-requirements scripts/requirements-resume.txt python3 scripts/build-resume.py
}

build
first_pdf="$(sha256sum documents/Victor-Tran-Resume.pdf | cut -d' ' -f1)"
first_manifest="$(sha256sum data/resume-artifact.json | cut -d' ' -f1)"

build
second_pdf="$(sha256sum documents/Victor-Tran-Resume.pdf | cut -d' ' -f1)"
second_manifest="$(sha256sum data/resume-artifact.json | cut -d' ' -f1)"

if [[ "$first_pdf" != "$second_pdf" || "$first_manifest" != "$second_manifest" ]]; then
  echo "Résumé build is not deterministic." >&2
  exit 1
fi

bash scripts/check-resume-artifact.sh
printf 'RÉSUMÉ REPRODUCIBILITY: PASS pdf_sha256=%s manifest_sha256=%s\n' "$second_pdf" "$second_manifest"
