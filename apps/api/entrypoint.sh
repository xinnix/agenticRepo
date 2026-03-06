#!/bin/sh
set -e

echo "🚀 Starting API Deployment..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set!"
  exit 1
fi

# Extract database host from DATABASE_URL (format: postgresql://user:pass@host:port/db)
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

# Use defaults if parsing failed
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

# Wait for database to be ready
echo "⏳ Waiting for database to be ready at $DB_HOST:$DB_PORT..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
  if pg_isready -h "$DB_HOST" -p "$DB_PORT" -q 2>/dev/null; then
    echo "✅ Database is ready!"
    break
  fi

  attempt=$((attempt + 1))
  echo "Database is unavailable - attempt $attempt/$max_attempts"
  sleep 2
done

if [ $attempt -eq $max_attempts ]; then
  echo "❌ ERROR: Database failed to become ready after $max_attempts attempts!"
  exit 1
fi

# Run Prisma migrations
echo "📡 Running Prisma Migrations..."
cd /app
if pnpm -C infra/database prisma migrate deploy; then
  echo "✅ Migrations completed successfully!"
else
  echo "❌ ERROR: Migration failed!"
  exit 1
fi

# Start the application
echo "🌟 Starting API Server..."
exec node apps/api/dist/main.js

