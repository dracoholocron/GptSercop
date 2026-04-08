#!/bin/bash
# Agent SOCE Chat 2.0 — Remote Deployment Script
# Run via SSH tunnel to the Windows server:
#   ssh user@windows-server "bash -s" < scripts/deploy.sh
#
# Or run locally with SSH forwarding set up.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/../docker-compose.yml"

echo "=========================================="
echo "  Agent SOCE Chat 2.0 — Deployment"
echo "=========================================="

# 1. Check required ports are free
echo ""
echo "1. Checking port availability..."
PORTS=(3090 5433 6381 11434)
for PORT in "${PORTS[@]}"; do
  if command -v netstat &>/dev/null; then
    if netstat -an 2>/dev/null | grep -q ":$PORT "; then
      echo "  ⚠  Port $PORT is in use — check for conflicts"
    else
      echo "  ✓ Port $PORT is free"
    fi
  else
    echo "  ℹ Port $PORT check skipped (netstat not available)"
  fi
done

# 2. Pull latest images
echo ""
echo "2. Pulling Docker images..."
docker pull pgvector/pgvector:pg16
docker pull redis:7-alpine
docker pull ollama/ollama:latest

# 3. Build the API image
echo ""
echo "3. Building Agent SOCE API image..."
docker compose -f "$COMPOSE_FILE" build agent-soce-api

# 4. Start infrastructure services first
echo ""
echo "4. Starting infrastructure (DB, Redis, Ollama)..."
docker compose -f "$COMPOSE_FILE" up -d agent-soce-db agent-soce-redis ollama

echo "   Waiting for database to be healthy..."
sleep 10

# 5. Run DB migrations
echo ""
echo "5. Running database migrations..."
docker compose -f "$COMPOSE_FILE" run --rm agent-soce-api sh -c "
  npx prisma db push --schema=src/db/schema.prisma --skip-generate
"

# 6. Seed the database
echo ""
echo "6. Seeding database..."
docker compose -f "$COMPOSE_FILE" run --rm agent-soce-api sh -c "
  node --loader tsx src/db/seed.ts
"

# 7. Pull Ollama models
echo ""
echo "7. Pulling Ollama models (this may take a while)..."
docker compose -f "$COMPOSE_FILE" exec ollama ollama pull llama3.2:3b || echo "  ⚠ llama3.2:3b pull failed (non-fatal, can retry)"
docker compose -f "$COMPOSE_FILE" exec ollama ollama pull nomic-embed-text || echo "  ⚠ nomic-embed-text pull failed (non-fatal, can retry)"

# 8. Start the API
echo ""
echo "8. Starting Agent SOCE API..."
docker compose -f "$COMPOSE_FILE" up -d agent-soce-api

# 9. Verify health
echo ""
echo "9. Verifying health..."
sleep 5
if curl -sf http://localhost:3090/health > /dev/null; then
  echo "  ✓ Agent SOCE API is healthy at http://localhost:3090"
else
  echo "  ✗ Agent SOCE API health check failed"
  echo "  Logs:"
  docker compose -f "$COMPOSE_FILE" logs --tail=30 agent-soce-api
fi

echo ""
echo "=========================================="
echo "  Deployment complete!"
echo ""
echo "  Services:"
echo "    API:      http://localhost:3090"
echo "    Health:   http://localhost:3090/health"
echo "    DB:       localhost:5433"
echo "    Redis:    localhost:6381"
echo "    Ollama:   http://localhost:11434"
echo ""
echo "  Via SSH tunnel (from dev machine):"
echo "    ssh -L 3090:localhost:3090 user@windows-server"
echo "=========================================="
