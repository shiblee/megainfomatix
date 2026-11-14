#!/usr/bin/env bash
# Builds MegaInfomatix and puts it live on https://megainfomatix.com (GoDaddy cPanel) over SSH.
# Usage: ./scripts/deploy.sh
#
# Server layout (see DEPLOYMENT.md):
#   ~/megainfomatix/{server,client,python}       the app, outside public_html so .env can't be downloaded
#   ~/megainfomatix/python/venv                  Python 3.11 virtualenv (created on first deploy)
#   ~/nodejs/bin/node                            Node.js 22 (shared with the other apps on this account)
#   ~/public_html/megainfomatix.com/.htaccess    tells Passenger to run the app for megainfomatix.com
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${DEPLOY_HOST:-mjgykn3s9utp@184.168.114.12}"
DOMAIN="${DOMAIN:-megainfomatix.com}"
PYTHON="${REMOTE_PYTHON:-/opt/alt/python311/bin/python3}"
PKG="$ROOT/deploy/build/megainfomatix"
SSH=(ssh -o BatchMode=yes "$HOST")

"$ROOT/scripts/build-deploy.sh"

echo "Uploading to ${HOST}…"
rsync -rlt --delete \
  --exclude 'python/venv/' --exclude 'python/output/' --exclude 'server/tmp/' --exclude 'logs/' \
  -e "ssh -o BatchMode=yes" "$PKG/" "$HOST:megainfomatix/"

echo "Preparing Python and restarting…"
"${SSH[@]}" "PYTHON='$PYTHON' bash -s" <<'REMOTE' 2>&1 | grep -v tput || true
set -e
export TERM=dumb
cd ~/megainfomatix
chmod -R u+rwX,go+rX . && chmod 600 server/.env python/.env
mkdir -p server/tmp python/output logs

# Python virtualenv: create once, reinstall only when requirements.txt changes
if [ ! -x python/venv/bin/python ]; then
  echo "  creating Python virtualenv"
  "$PYTHON" -m venv python/venv
  python/venv/bin/pip install -q --upgrade pip
fi
REQ_HASH="$(sha256sum python/requirements.txt | cut -d' ' -f1)"
if [ "$(cat python/venv/.requirements.sha256 2>/dev/null)" != "$REQ_HASH" ]; then
  echo "  installing Python requirements"
  python/venv/bin/pip install -q -r python/requirements.txt
  echo "$REQ_HASH" > python/venv/.requirements.sha256
fi

touch server/tmp/restart.txt
REMOTE

code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 90 "https://$DOMAIN/api/health" || true)"
echo "Done: https://$DOMAIN/api/health answered ${code:-no response}"
