#!/usr/bin/env bash
# Wrapper to deploy when running as root (uses appuser for build)
set -euo pipefail
APP_DIR=/home/appuser/app
SERVICE=portfolio
if [ ! -d "$APP_DIR/.git" ]; then
  echo "[root-deploy] ERROR: repository not found at $APP_DIR" >&2
  exit 1
fi
# Ensure ownership (in case files were created by root earlier)
chown -R appuser:appuser "$APP_DIR"

sudo -u appuser -H bash -lc "cd $APP_DIR && echo '[root-deploy] Updating repo' && git fetch --all --prune && git reset --hard origin/main && echo '[root-deploy] Installing deps' && npm ci --omit=dev && echo '[root-deploy] Building' && npm run build"

echo "[root-deploy] Restarting service $SERVICE"
if systemctl list-units --type=service | grep -q "${SERVICE}.service"; then
  systemctl restart "$SERVICE"
else
  echo "[root-deploy] WARNING: systemd service not found; starting foreground (CTRL+C to stop)" >&2
  sudo -u appuser -H bash -lc "cd $APP_DIR && npm run start" &
  sleep 3
fi

# Health check
set +e
curl -fsS http://127.0.0.1:4000/api/health >/dev/null
HC=$?
set -e
if [ $HC -ne 0 ]; then
  echo "[root-deploy] Health check FAILED" >&2
  journalctl -u "$SERVICE" -n 50 --no-pager || true
  exit 1
fi

echo "[root-deploy] SUCCESS: Health OK"
