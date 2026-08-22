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
run_required "Path-aware health-check scope fixture" npm run test:health-check-scope

run_required "Accessibility quick-win regression check" node scripts/check-accessibility-quick-wins.mjs
run_required "About semantic-heading contract" node scripts/check-about-semantics.mjs
run_required "Public IBM Cloud hiring-cut contract" node scripts/check-ibmcloud-hiring-cut.mjs
run_required "Public archive-route contract" npm run check:public-archive-routes
run_required "Production-host regression check" node scripts/check-production-host.mjs
run_required "Production artifact containment contract" npm run check:artifact-containment
run_required "PCI claims and publication contract" npm run check:pci-claims-protection
run_required "Star & Lamp bounded revision contract" npm run check:sal-vico2
run_required "Ability Experience bounded sequence contract" npm run check:ability-vico2
run_required "Responsive-image regression check" node scripts/check-responsive-images.mjs
run_required "Gallery media regression check" node scripts/check-gallery-media.mjs
run_required "Lighthouse coverage regression check" node scripts/check-lighthouse-coverage.mjs
run_required "Install pinned website build tools" npm ci --ignore-scripts
run_required "Pi Kapp demo reproducible build check" npm run verify:pikapp-demo
run_required "Pi Kapp approved page integration contract" npm run check:pikapp-page
run_required "IBM Patterns approved page integration contract" npm run check:ibm-patterns
run_required "Gallery motion system contract" npm run check:gallery-motion-system
run_required "wxO Canvas and Document Processing integration contract" npm run check:wxo-document-processing
run_required "Route 02 homepage integration contract" npm run check:route02-homepage
run_required "Content export generator policy fixture" node scripts/test-html-to-md.mjs
run_required "Final site reconciliation contract" npm run check:final-site-reconciliation
run_required "Shared site shell generator fixture" node scripts/test-site-shell.mjs

section "Generating project sections"
if [ -f "scripts/generate-project-sections.mjs" ]; then
  if node scripts/generate-project-sections.mjs; then
    echo "  ok"
  else
    STATUS=1
    echo "  failed"
  fi
else
  echo "  skipped — scripts/generate-project-sections.mjs not found"
fi

section "Generating visual archives"
if [ -f "scripts/build-visual-archives-integration.py" ]; then
  if PYTHONDONTWRITEBYTECODE=1 python3 scripts/build-visual-archives-integration.py all; then
    echo "  ok"
  else
    STATUS=1
    echo "  failed"
  fi
else
  STATUS=1
  echo "  failed: scripts/build-visual-archives-integration.py not found"
fi

section "Generating shared site shell"
if [ -f "scripts/generate-site-shell.mjs" ]; then
  if node scripts/generate-site-shell.mjs; then
    echo "  ok"
  else
    STATUS=1
    echo "  failed"
  fi
else
  STATUS=1
  echo "  failed: scripts/generate-site-shell.mjs not found"
fi

run_required "Home/global completion contract" npm run check:home-global-completion
run_required "Design DNA and live-component system contract" npm run check:design-dna-system
run_required "Theme Continuity proof contract" npm run check:theme-continuity-proof
run_required "Global theme-control contract" npm run check:global-theme-control
run_required "Shared site shell contract" node scripts/check-shared-shell.mjs
run_required "UI Gallery integration contract" npm run check:ui-gallery
run_required "Home lens portal browser contract" npm run check:home-lens-portal-browser
run_required "About voice-calibration browser contract" npm run check:about-browser
run_required "Visual archives integration contract" node scripts/check-visual-archives-integration.mjs all

run_visual_archives_browser_contract() {
  local port
  port="$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1]); s.close()')"
  local site_url="http://127.0.0.1:${port}"
  local server_log="${TMPDIR:-/tmp}/visual-archives-server-preflight.log"
  local server_pid
  local ready=0
  local status=0

  python3 -m http.server "$port" --bind 127.0.0.1 >"$server_log" 2>&1 &
  server_pid=$!
  for _attempt in {1..20}; do
    if curl --fail --silent "$site_url/artillustration.html" >/dev/null; then
      ready=1
      break
    fi
    sleep 0.25
  done

  if [ "$ready" -eq 1 ]; then
    SITE_URL="$site_url" VISUAL_ARCHIVES_EVIDENCE_DIR="$(mktemp -d)" npm run check:visual-archives-lightbox-browser || status=$?
  else
    echo "  local visual-archives browser-contract server did not become ready"
    status=1
  fi

  kill "$server_pid" 2>/dev/null || true
  wait "$server_pid" 2>/dev/null || true
  return "$status"
}

run_required "Visual archives browser contract" run_visual_archives_browser_contract

run_wxo_browser_contract() {
  local site_url="http://127.0.0.1:8898"
  local server_log="${TMPDIR:-/tmp}/wxo-document-server-preflight.log"
  local server_pid
  local ready=0
  local status=0

  python3 -m http.server 8898 --bind 127.0.0.1 >"$server_log" 2>&1 &
  server_pid=$!

  for _attempt in {1..20}; do
    if curl --fail --silent "$site_url/wxo-canvas.html" >/dev/null; then
      ready=1
      break
    fi
    sleep 0.25
  done

  if [ "$ready" -eq 1 ]; then
    SITE_URL="$site_url" npm run check:wxo-document-processing-browser || status=$?
  else
    echo "  local wxO browser-contract server did not become ready"
    status=1
  fi

  kill "$server_pid" 2>/dev/null || true
  wait "$server_pid" 2>/dev/null || true
  return "$status"
}

run_required "wxO Canvas and Document Processing browser contract" run_wxo_browser_contract

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

section "Protected public content export validation"
if [ -f "scripts/check-protected-content-exports.mjs" ]; then
  if node scripts/check-protected-content-exports.mjs; then
    echo "  ok"
  else
    STATUS=1
    echo "  failed"
  fi
else
  STATUS=1
  echo "  failed — scripts/check-protected-content-exports.mjs not found"
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
