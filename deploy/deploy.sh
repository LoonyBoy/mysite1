#!/usr/bin/env bash
set -euo pipefail

# Simple deployment helper
# Usage (local machine):
#   ssh appuser@SERVER "bash -lc '~/app/deploy/deploy.sh'"

APP_DIR=${APP_DIR:-/home/appuser/app}
BRANCH=${BRANCH:-main}
INSTALL_PROD=${INSTALL_PROD:-1}
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
