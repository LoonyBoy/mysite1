#!/usr/bin/env bash
set -euo pipefail

# Simple deployment helper
# Usage (local machine):
#   ssh appuser@SERVER "bash -lc '~/app/deploy/deploy.sh'"

APP_DIR=/home/appuser/app
BRANCH=${BRANCH:-main}
INSTALL_PROD=${INSTALL_PROD:-1}
SERVICE_NAME=${SERVICE_NAME:-portfolio}

echo "[deploy] Dir: $APP_DIR branch: $BRANCH"
cd "$APP_DIR"

if [ ! -d .git ]; then
  echo "[deploy] ERROR: .git not found. Clone repository first." >&2
  exit 1
fi

git fetch --all --prune
CURRENT=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT" != "$BRANCH" ]; then
  echo "[deploy] Switching to $BRANCH"
  git checkout "$BRANCH"
fi
git pull --rebase --autostash origin "$BRANCH"

echo "[deploy] Installing dependencies"
if [ "$INSTALL_PROD" = "1" ]; then
  npm ci --omit=dev
else
  npm ci
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
