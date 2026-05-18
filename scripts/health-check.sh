#!/usr/bin/env bash
# Local site health check. Mirrors the GitHub Action so you can run it before pushing.
#
# Usage:
#   ./scripts/health-check.sh                    # checks live production
#   ./scripts/health-check.sh http://localhost:8000  # checks local dev server
#
# Requires: lychee. On Windows, run: powershell -ExecutionPolicy Bypass -File scripts/install-lychee.ps1
# Lighthouse step uses npx, no install needed.
set -euo pipefail

BASE_URL="${1:-https://victortrandesign.com}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Checking links in *.html"
LYCHEE_BIN=""
if command -v lychee >/dev/null 2>&1; then
  LYCHEE_BIN="lychee"
elif [ -x "$ROOT/.tools/lychee/lychee.exe" ]; then
  LYCHEE_BIN="$ROOT/.tools/lychee/lychee.exe"
fi

if [ -n "$LYCHEE_BIN" ]; then
  # Protected pages, including Document Processing, are expected to stay live,
  # password-gated, noindex, and omitted from sitemap/indexing checks. Document
  # Processing is currently linked from the Work dropdown; do not treat that as
  # direct-link only unless the navigation links are intentionally removed.
  LYCHEE_ROOT="$ROOT"
  LYCHEE_INPUTS=("$ROOT"/*.html)

  if [[ "$LYCHEE_BIN" == *.exe ]] && command -v wslpath >/dev/null 2>&1; then
    LYCHEE_ROOT="$(wslpath -w "$ROOT")"
    LYCHEE_INPUTS=()
    for html in "$ROOT"/*.html; do
      LYCHEE_INPUTS+=("$(wslpath -w "$html")")
    done
  fi

  "$LYCHEE_BIN" --no-progress \
    --max-concurrency 8 \
    --accept 200,206,429,999 \
    --root-dir "$LYCHEE_ROOT" \
    --exclude "localhost" \
    --exclude "victor-tran-site-2vxf.vercel.app" \
    --exclude "linkedin.com" \
    --exclude "pikappapp/demo" \
    "${LYCHEE_INPUTS[@]}"
else
  echo "  lychee not installed - skipping."
  echo "  Windows install: powershell -ExecutionPolicy Bypass -File scripts/install-lychee.ps1"
  echo "  macOS install: brew install lychee"
fi

echo ""
echo "==> Scanning for oversized images (>1MB)"
OVERSIZED=$(find "$ROOT/images" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) -size +1024k 2>/dev/null || true)
if [ -n "$OVERSIZED" ]; then
  echo "$OVERSIZED" | while read -r f; do
    SIZE=$(du -h "$f" | cut -f1)
    echo "  $f ($SIZE)"
  done
else
  echo "  All images under 1MB."
fi

echo ""
echo "==> Lighthouse audit on $BASE_URL"
echo "  (skipping locally - run via GitHub Actions for full report)"
echo "  trigger manually: gh workflow run \"Site health check\""

echo ""
echo "==> Done."
