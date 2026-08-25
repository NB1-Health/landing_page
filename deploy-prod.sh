#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/landing_page"
APP_NAME="landing_prod"

# ── Single deploy at a time ───────────────────────────────────────────────────
# Backstop for the GitHub Actions `concurrency` guard: two deploys running
# `rm -rf node_modules && npm install` on the same tree at once race each other and
# flood the log with `npm warn tar TAR_ENTRY_ERROR ENOENT`. Take an exclusive lock;
# a second deploy WAITS up to 15 min for the first to finish, then aborts rather than
# corrupting node_modules. The lock auto-releases when this script exits (fd 9 closes).
LOCK_FILE="/tmp/${APP_NAME}-deploy.lock"
exec 9>"$LOCK_FILE"
if ! flock -w 900 9; then
  echo ">>> Another deploy is still running after 15 min — aborting." >&2
  exit 1
fi
echo ">>> Acquired deploy lock ($LOCK_FILE)"

export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
fi

echo ">>> Deploy START ($(date))"

cd "$APP_DIR"

echo ">>> Use .env.prod"
# Source env vars so DATABASE_URL_DIRECT is available for migrations
set -o allexport
source .env.prod
set +o allexport

node scripts/check-deployment-environment.mjs production

cp .env.prod .env

echo ">>> Install deps (clean install to ensure patches apply correctly)"
rm -rf node_modules
npm install --legacy-peer-deps

echo ">>> Stop PM2 first — frees the old app's DB connections so migrations get a"
echo "    clean connection (a saturated old process can make the migration connect"
echo "    time out on a connection-constrained DB)"
pm2 stop "$APP_NAME" 2>/dev/null || true

# Give Postgres a moment to reclaim the connections the stopped app held.
sleep 5

echo ">>> Run DB migrations (using direct connection to bypass PgBouncer)"
DATABASE_URL="${DATABASE_URL_DIRECT:-$DATABASE_URL}" npm run migrate

echo ">>> Build Next.js from a clean output directory"
rm -rf -- "$APP_DIR/.next"
npm run build

echo ">>> Start/Restart PM2"
if pm2 list | grep -q "$APP_NAME"; then
  pm2 restart "$APP_NAME" --update-env
else
  pm2 start npm --name "$APP_NAME" -- start
fi

pm2 save

echo ">>> Deploy DONE ($(date))"
