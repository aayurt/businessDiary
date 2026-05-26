# #!/usr/bin/env bash
# set -euo pipefail

# # one-command deploy script
# # Usage: ./deploy.sh [--build] [--no-cache] [--profile production]

# SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# cd "$SCRIPT_DIR"

# BUILD=""
# COMPOSE_FLAGS="-d"

# for arg in "$@"; do
#   case "$arg" in
#     --build)
#       BUILD="--build"
#       ;;
#     --no-cache)
#       BUILD="--build"
#       COMPOSE_FLAGS="--build --no-cache $COMPOSE_FLAGS"
#       ;;
#     --help)
#       echo "Usage: $0 [--build] [--no-cache]"
#       echo ""
#       echo "Deploys the entire stack (PostgreSQL + Next.js app) with one command."
#       echo ""
#       echo "Options:"
#       echo "  --build      Rebuild images before starting"
#       echo "  --no-cache   Rebuild from scratch (no layer cache)"
#       exit 0
#       ;;
#   esac
# done

# # Validate .env exists
# if [ ! -f .env ]; then
#   if [ -f .env.example ]; then
#     echo "No .env file found. Copying .env.example to .env ..."
#     cp .env.example .env
#     echo "WARNING: Edit .env with your own values before deploying!"
#     echo "  AUTH_SECRET: generate with: openssl rand -base64 32"
#     echo "  POSTGRES_PASSWORD: set a strong password"
#     exit 1
#   fi
#   echo "ERROR: No .env or .env.example found."
#   exit 1
# fi

# # Check required variables
# AUTH_SECRET_OK=$(grep -c "^AUTH_SECRET=" .env 2>/dev/null || true)
# if [ "$AUTH_SECRET_OK" -eq 0 ]; then
#   echo "ERROR: AUTH_SECRET is missing from .env."
#   echo "  Generate one: openssl rand -base64 32"
#   exit 1
# fi

# echo "==> Deploying stack:"
# echo "    docker compose up $COMPOSE_FLAGS $BUILD"
# echo ""

# export COMPOSE_PROJECT_NAME="nextjs-app"
# docker compose up $COMPOSE_FLAGS $BUILD

# echo ""
# echo "==> Stack deployed successfully!"
# echo "    App:     http://localhost:3000"
# echo "    DB:      postgresql://localhost:5432"
# echo ""
# echo "    To view logs:  docker compose logs -f"
# echo "    To stop:       docker compose down"

#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting Deployment for aayushshrestha.com..."

# 1. Pull the latest changes from GitHub
echo "📥 Pulling latest code from Git..."
git pull origin main

# 2. Install dependencies (Clean install is safer for production)
echo "📦 Installing dependencies..."
pnpm install

# 3. Build the Next.js app
echo "🏗️ Building Next.js application..."
pnpm run build

# 4. Prepare the Standalone folder
# We must manually copy public and static folders as Next.js standalone doesn't do this
echo "📂 Assembling Standalone folder..."
if [ -d "public" ]; then
    cp -r public .next/standalone/
    echo "✅ Copied public/ to standalone"
fi

if [ -d ".next/static" ]; then
    cp -r .next/static .next/standalone/.next/
    echo "✅ Copied .next/static to standalone"
fi

# 5. Reload the app with PM2
# Using 'reload' instead of 'restart' ensures zero-downtime if you use cluster mode
echo "🔄 Reloading PM2 process..."
if pm2 list | grep -q "business-diary"; then
    pm2 reload ecosystem.config.cjs --update-env
else
    pm2 start ecosystem.config.cjs
fi

# 6. Finalize
pm2 save
echo "✨ Deployment Complete! Your changes are live."