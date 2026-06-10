#!/usr/bin/env bash
# Portfolio preflight check.
#
# Run before committing/pushing meaningful site changes:
#   ./scripts/preflight.sh
#
# This is manual by default. It is not a Git hook and does not push/deploy anything.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

STATUS=0

section() {
  echo ""
  echo "==> $1"
}

run_required() {
  local label="$1"
  shift
  section "$label"
  if "$@"; then
    echo "  ok"
  else
    STATUS=1
    echo "  failed"
  fi
}

section "Repository"
echo "  Root: $ROOT"
echo "  Branch: $(git branch --show-current 2>/dev/null || echo 'unknown')"
echo "  Changed files:"
if git status --short | grep -q .; then
  git status --short | sed 's/^/    /'
else
  echo "    none"
fi

run_required "Whitespace/conflict marker check" git diff --check

section "Regenerating Markdown content exports"
if [ -f "scripts/html-to-md.mjs" ]; then
  if node scripts/html-to-md.mjs; then
    echo "  ok"
  else
    STATUS=1
    echo "  failed"
  fi
else
  echo "  skipped — scripts/html-to-md.mjs not found"
fi

section "Project manifest/order validation"
if [ -f "scripts/validate-project-manifest.mjs" ]; then
  if node scripts/validate-project-manifest.mjs; then
    echo "  ok"
  else
    STATUS=1
    echo "  failed"
  fi
else
  echo "  skipped — scripts/validate-project-manifest.mjs not found"
fi

section "Oversized image scan (>1MB)"
OVERSIZED=$(find images -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) -size +1024k 2>/dev/null || true)
if [ -n "$OVERSIZED" ]; then
  echo "$OVERSIZED" | while read -r f; do
    SIZE=$(du -h "$f" | cut -f1)
    echo "  warning: $f ($SIZE)"
  done
  echo "  warnings only — not failing preflight"
else
  echo "  ok — all scanned images under 1MB"
fi

section "Local health check"
if [ -x "scripts/health-check.sh" ]; then
  if ./scripts/health-check.sh; then
    echo "  ok"
  else
    echo "  warnings/issues reported by health-check.sh"
    echo "  not failing preflight because local link tooling may be optional"
  fi
else
  echo "  skipped — scripts/health-check.sh not executable or missing"
fi

section "Post-check changed files"
if git status --short | grep -q .; then
  git status --short | sed 's/^/  /'
else
  echo "  none"
fi

if [ "$STATUS" -eq 0 ]; then
  echo ""
  echo "Preflight passed."
else
  echo ""
  echo "Preflight failed. Fix required checks above before pushing."
fi

exit "$STATUS"
