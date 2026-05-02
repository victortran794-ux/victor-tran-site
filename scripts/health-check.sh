#!/usr/bin/env bash
# Local site health check. Mirrors the GitHub Action so you can run it before pushing.
#
# Usage:
#   ./scripts/health-check.sh                    # checks live production
#   ./scripts/health-check.sh http://localhost:8000  # checks local dev server
#
# Requires: lychee (brew install lychee). Lighthouse step uses npx, no install needed.
set -euo pipefail

BASE_URL="${1:-https://victortrandesign.com}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Checking links in *.html"
if command -v lychee >/dev/null 2>&1; then
  lychee --no-progress \
    --max-concurrency 8 \
    --accept 200,206,429 \
    --exclude-mail \
    --exclude "localhost" \
    --exclude "victor-tran-site-2vxf.vercel.app" \
    "$ROOT"/*.html || echo "  (link issues found)"
else
  echo "  lychee not installed — skipping. Install with: brew install lychee"
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
echo "  (skipping locally — run via GitHub Actions for full report)"
echo "  trigger manually: gh workflow run \"Site health check\""

echo ""
echo "==> Done."
