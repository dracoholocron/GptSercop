#!/bin/bash
# ─── Agent SOCE Remote Deploy Script ─────────────────────────────────────────
# Syncs the agent-soce-server package to the remote Windows server
# and triggers the full deploy pipeline.
#
# Usage:
#   REMOTE_HOST=192.168.1.100 REMOTE_USER=Administrator bash scripts/deploy-remote.sh
#
# Or with SSH alias:
#   REMOTE_HOST=windows-server REMOTE_USER=dherrera bash scripts/deploy-remote.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

REMOTE_HOST="${REMOTE_HOST:?Set REMOTE_HOST=<ip or hostname>}"
REMOTE_USER="${REMOTE_USER:-Administrator}"
REMOTE_DIR="${REMOTE_DIR:-/opt/agent-soce}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(dirname "$SCRIPT_DIR")"

echo "=============================================="
echo "  Agent SOCE — Remote Deploy"
echo "  Target: ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}"
echo "=============================================="

# 1. Port conflict check (on remote)
echo ""
echo "1. Checking ports on remote server..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" "
  for PORT in 3090 5433 6381 11434; do
    if netstat -an 2>/dev/null | grep -q \":\$PORT \"; then
      echo \"  ⚠  Port \$PORT is in use on remote\"
    else
      echo \"  ✓ Port \$PORT is free on remote\"
    fi
  done
" || echo "  ℹ Port check skipped (netstat unavailable on remote)"

# 2. Sync source files
echo ""
echo "2. Syncing source files to remote..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" "mkdir -p ${REMOTE_DIR}"

# rsync excludes: node_modules, .env (keep secrets local), generated prisma binaries
rsync -avz --progress \
  --exclude='node_modules/' \
  --exclude='.env' \
  --exclude='src/generated/client/*.node' \
  --exclude='test-results/' \
  "${PACKAGE_DIR}/" \
  "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"

echo "  ✓ Files synced"

# 3. Copy env file if it exists
if [ -f "${PACKAGE_DIR}/.env" ]; then
  echo ""
  echo "3. Copying .env file..."
  scp "${PACKAGE_DIR}/.env" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/.env"
  echo "  ✓ .env copied"
else
  echo ""
  echo "3. ⚠  No .env found locally — make sure ${REMOTE_DIR}/.env exists on server"
fi

# 4. Run deploy on remote
echo ""
echo "4. Running deploy on remote server..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" "
  set -e
  cd ${REMOTE_DIR}
  echo 'Installing dependencies...'
  npm install --omit=dev
  echo 'Generating Prisma client...'
  npx prisma generate --schema=src/db/schema.prisma
  echo 'Running docker compose...'
  docker compose up -d --build
  echo 'Waiting for DB...'
  sleep 15
  echo 'Running migrations...'
  docker compose exec -T agent-soce-api sh -c 'npx prisma db push --schema=src/db/schema.prisma --skip-generate'
  echo 'Seeding database...'
  docker compose exec -T agent-soce-api sh -c 'node --loader tsx src/db/seed.ts' || echo 'Seed skipped (already seeded)'
  echo 'Pulling Ollama models...'
  docker compose exec -T ollama ollama pull llama3.2:3b || echo 'llama3.2 pull failed (non-fatal)'
  docker compose exec -T ollama ollama pull nomic-embed-text || echo 'nomic-embed-text pull failed (non-fatal)'
  echo 'Verifying health...'
  sleep 5
  curl -sf http://localhost:3090/health && echo ' ✓ API healthy' || echo ' ✗ Health check failed'
"

echo ""
echo "=============================================="
echo "  Deploy complete!"
echo ""
echo "  SSH tunnel to access from dev machine:"
echo "    ssh -L 3090:localhost:3090 ${REMOTE_USER}@${REMOTE_HOST}"
echo ""
echo "  Then open: http://localhost:3090/health"
echo "  Admin UI:  http://localhost:3004/agent-soce/admin"
echo "=============================================="
