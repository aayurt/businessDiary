#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

SERVER="root@82.165.181.153"
REMOTE_PATH="/var/www/business-diary"

echo "🚀 Starting deploy..."

# ── 1. Build locally (standalone) ──
echo "📦 Installing dependencies..."
pnpm ci

echo "🏗️  Building Next.js (standalone)..."
pnpm run build

echo "🔧 Generating Prisma client..."
pnpx prisma generate

# ── 2. Prepare deploy bundle (mirrors Dockerfile structure) ──
echo "📂 Preparing deploy bundle..."
DEPLOY_DIR=$(mktemp -d)
trap 'rm -rf "$DEPLOY_DIR"' EXIT

# Flatten .next/standalone/* → root (same as Docker COPY)
cp -r .next/standalone/* "$DEPLOY_DIR/"
cp -r .next/static "$DEPLOY_DIR/.next/static"
cp -r public "$DEPLOY_DIR/public"
cp -r prisma "$DEPLOY_DIR/prisma"
cp -r scripts "$DEPLOY_DIR/scripts"
cp ecosystem.config.js "$DEPLOY_DIR/"
cp package.json "$DEPLOY_DIR/"

if [ -d node_modules/.prisma ]; then
  mkdir -p "$DEPLOY_DIR/node_modules"
  cp -r node_modules/.prisma "$DEPLOY_DIR/node_modules/.prisma"
fi

# ── 3. Rsync to server ──
echo "📤 Uploading to $SERVER..."
rsync -az --delete --no-o --no-g "$DEPLOY_DIR/" "$SERVER:$REMOTE_PATH/"

# ── 4. Remote commands ──
echo "🔄 Running remote commands..."
ssh "$SERVER" bash -s <<EOF
  set -e
  cd "$REMOTE_PATH"

  echo "  → Running database migrations..."
  npx prisma migrate deploy --skip-generate

  echo "  → Restarting PM2..."
  pm2 delete ecosystem.config.js 2>/dev/null || true
  pm2 start ecosystem.config.js --update-env
  pm2 save

  echo "  → Health check..."
  sleep 3
  if curl -sf http://localhost:3000 > /dev/null 2>&1; then
    echo "  ✅ App is responding on port 3000"
  else
    echo "  ⚠️  Health check failed — check 'pm2 logs'"
  fi
EOF

echo ""
echo "🎉 Deploy complete!"
