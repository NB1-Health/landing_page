#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/landing_page"
BRANCH="main"
APP_NAME="landing_stg"
PORT="3000"

echo "TEST"
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
fi

echo ">>> Deploy START ($(date))"

cd "$APP_DIR"

echo ">>> Install deps (clean install to ensure patches apply correctly)"
rm -rf node_modules
npm install --legacy-peer-deps

echo ">>> Use .env.stg"
cp .env.stg .env
# Source env vars so DATABASE_URL_DIRECT is available for migrations
set -o allexport
source .env.stg
set +o allexport

echo ">>> Stop PM2 first — frees the old app's DB connections so migrations get a"
echo "    clean connection (critical on the small 1 vCPU DB: a saturated old"
echo "    process makes the migration connect time out)"
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
