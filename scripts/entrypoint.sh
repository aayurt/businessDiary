#!/bin/sh
set -e

# Validate required environment variables
if [ -z "$AUTH_SECRET" ]; then
  echo "ERROR: AUTH_SECRET is not set. Use 'openssl rand -base64 32' to generate one."
  exit 1
fi

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set."
  exit 1
fi

echo "Running database migrations..."
npx prisma migrate deploy --skip-generate

echo "Starting application..."
exec "$@"
