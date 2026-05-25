#!/usr/bin/env bash
set -euo pipefail

# one-command deploy script
# Usage: ./deploy.sh [--build] [--no-cache] [--profile production]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

BUILD=""
COMPOSE_FLAGS="-d"

for arg in "$@"; do
  case "$arg" in
    --build)
      BUILD="--build"
      ;;
    --no-cache)
      BUILD="--build"
      COMPOSE_FLAGS="--build --no-cache $COMPOSE_FLAGS"
      ;;
    --help)
      echo "Usage: $0 [--build] [--no-cache]"
      echo ""
      echo "Deploys the entire stack (PostgreSQL + Next.js app) with one command."
      echo ""
      echo "Options:"
      echo "  --build      Rebuild images before starting"
      echo "  --no-cache   Rebuild from scratch (no layer cache)"
      exit 0
      ;;
  esac
done

# Validate .env exists
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    echo "No .env file found. Copying .env.example to .env ..."
    cp .env.example .env
    echo "WARNING: Edit .env with your own values before deploying!"
    echo "  AUTH_SECRET: generate with: openssl rand -base64 32"
    echo "  POSTGRES_PASSWORD: set a strong password"
    exit 1
  fi
  echo "ERROR: No .env or .env.example found."
  exit 1
fi

# Check required variables
AUTH_SECRET_OK=$(grep -c "^AUTH_SECRET=" .env 2>/dev/null || true)
if [ "$AUTH_SECRET_OK" -eq 0 ]; then
  echo "ERROR: AUTH_SECRET is missing from .env."
  echo "  Generate one: openssl rand -base64 32"
  exit 1
fi

echo "==> Deploying stack:"
echo "    docker compose up $COMPOSE_FLAGS $BUILD"
echo ""

export COMPOSE_PROJECT_NAME="nextjs-app"
docker compose up $COMPOSE_FLAGS $BUILD

echo ""
echo "==> Stack deployed successfully!"
echo "    App:     http://localhost:3000"
echo "    DB:      postgresql://localhost:5432"
echo ""
echo "    To view logs:  docker compose logs -f"
echo "    To stop:       docker compose down"
