#!/usr/bin/env bash
# Builds the production package in deploy/build/megainfomatix (used by scripts/deploy.sh).
#
#   deploy/build/megainfomatix/
#   ├── client/dist      React build (calls the API on its own domain: /api)
#   ├── server           Node.js API + node_modules (pure JS, built on this Mac)
#   └── python           Python sources + requirements (venv is created on the server)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/deploy"
PKG="$OUT/build/megainfomatix"
ENV_FILE="$OUT/production.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing deploy/production.env — copy deploy/production.env.example and fill it in." >&2
  exit 1
fi
if grep -q "FILL_IN" "$ENV_FILE"; then
  echo "deploy/production.env still contains FILL_IN values." >&2
  exit 1
fi

rm -rf "$OUT/build"
mkdir -p "$PKG/server" "$PKG/client" "$PKG/python"

echo "1/3 Building the React client (pre-rendered pages, sitemap, robots.txt)…"
(cd "$ROOT/client" && VITE_API_URL=/api npm run build --silent >/dev/null)
cp -R "$ROOT/client/dist" "$PKG/client/dist"

echo "2/3 Copying the server and installing production libraries…"
cp -R "$ROOT/server/src" "$PKG/server/src"
cp "$ROOT/server/package.json" "$ROOT/server/package-lock.json" "$ROOT/server/knexfile.js" "$PKG/server/"
# --ignore-scripts: skips native builds (better-sqlite3 is only used locally; production uses MySQL)
(cd "$PKG/server" && npm ci --omit=dev --ignore-scripts --no-audit --no-fund --loglevel=error)
cp "$ENV_FILE" "$PKG/server/.env"

echo "3/3 Copying the Python layer…"
cp -R "$ROOT/python/src" "$PKG/python/src"
cp "$ROOT/python/requirements.txt" "$PKG/python/"
cp "$ENV_FILE" "$PKG/python/.env"
find "$PKG/python" -name "__pycache__" -type d -prune -exec rm -rf {} +

echo "Package ready: $PKG"
