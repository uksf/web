#!/usr/bin/env bash
# Rebuild UKSF-patched OCAP static UI from an upstream web tag.
# Usage: ./rebuild.sh v2.1.1
set -euo pipefail
TAG="${1:?usage: ./rebuild.sh <ocap-web-tag>}"
ROOT="$(cd "$(dirname "$0")" && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "Fetching OCAP2/web@$TAG ..."
curl -sL "https://github.com/OCAP2/web/archive/refs/tags/${TAG}.tar.gz" | tar -xz -C "$WORK"
SRC="$(find "$WORK" -maxdepth 1 -type d -name 'web-*' | head -1)"
test -d "$SRC/ui"

echo "Applying UKSF patches ..."
cp -f "$ROOT/patches/ui/src/hooks/useAuth.tsx" "$SRC/ui/src/hooks/useAuth.tsx"
cp -f "$ROOT/patches/ui/src/components/AuthBadge.tsx" "$SRC/ui/src/components/AuthBadge.tsx"

echo "Building ..."
(cd "$SRC/ui" && npm ci && npm run build)

OUT="$ROOT/dist"
rm -rf "$OUT"
mkdir -p "$OUT"
cp -R "$SRC/internal/frontend/dist/." "$OUT/"
echo "Built $OUT — copy to C:/Server/OCAP/static-ui/ on uksf-server and Restart-Service OCAP"
