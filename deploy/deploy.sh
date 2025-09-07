#!/usr/bin/env bash
# Enable strict mode; fall back gracefully if pipefail unsupported (e.g. minimal shells)
set -eu
if (set -o 2>/dev/null | grep -q pipefail) 2>/dev/null; then
  set -o pipefail 2>/dev/null || true
fi

# Simple deployment helper
# Usage (local machine):
#   ssh appuser@SERVER "bash -lc '~/app/deploy/deploy.sh'"

APP_DIR=${APP_DIR:-/home/appuser/app}
BRANCH=${BRANCH:-main}
# INSTALL_PROD left for compatibility but defaults to 0 (always install dev deps for build tools like Vite)
INSTALL_PROD=${INSTALL_PROD:-0}
SERVICE_NAME=${SERVICE_NAME:-portfolio}
REPO_URL=${REPO_URL:-https://github.com/LoonyBoy/mysite1.git}

# If executed as root, re-exec as appuser preserving env vars
if [ "$(id -u)" = "0" ] && [ "${RUN_AS_APPUSER:-1}" = "1" ]; then
  if id appuser >/dev/null 2>&1; then
    echo "[deploy] Re-executing as appuser"
    exec sudo -u appuser -H bash -lc "RUN_AS_APPUSER=0 APP_DIR=$APP_DIR BRANCH=$BRANCH INSTALL_PROD=$INSTALL_PROD SERVICE_NAME=$SERVICE_NAME REPO_URL=$REPO_URL $0"
  else
    echo "[deploy] WARNING: appuser not found; continuing as root" >&2
  fi
fi

echo "[deploy] Dir: $APP_DIR branch: $BRANCH"

if [ ! -d "$APP_DIR/.git" ]; then
  echo "[deploy] Cloning repository: $REPO_URL"
  mkdir -p "$(dirname "$APP_DIR")"
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

git fetch --all --prune
CURRENT=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT" != "$BRANCH" ]; then
  echo "[deploy] Switching to $BRANCH"
  git checkout "$BRANCH"
fi
git pull --rebase --autostash origin "$BRANCH"

echo "[deploy] Installing dependencies (full set, dev included)"
echo "[deploy] node $(node -v) npm $(npm -v)"
# Force disable production pruning just in case systemd exported NODE_ENV=production into environment
export NODE_ENV=development
export npm_config_production=false
echo "[deploy] Running: npm ci --include=dev"
if ! npm ci --include=dev; then
  echo "[deploy] npm ci failed, attempting fallback npm install --include=dev" >&2
  npm install --include=dev
fi

# Sanity check for vite binary
if [ ! -f node_modules/.bin/vite ]; then
  echo "[deploy] WARNING: vite binary still missing after install. Forcing explicit dev install of vite." >&2
  npm install --save-dev vite
fi

if [ ! -f node_modules/.bin/vite ]; then
  echo "[deploy] ERROR: vite still missing. Listing node_modules/.bin for debugging:" >&2
  ls -l node_modules/.bin || true
fi

echo "[deploy] Building frontend"
npm run build

echo "[deploy] Restarting service $SERVICE_NAME"
if systemctl list-units --type=service | grep -q "${SERVICE_NAME}.service"; then
  sudo systemctl restart "$SERVICE_NAME"
else
  echo "[deploy] Service not found, starting directly (foreground)"
  npm run start
fi

echo "[deploy] Done"
