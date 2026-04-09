#!/usr/bin/env bash
# =============================================================================
# start-dev.sh — SERCOP Unified Frontend · Modo Desarrollo Local
#
# Levanta el frontend Vite con hot-reload apuntando al backend Sercop
# (gptsercop-api) via túnel SSH al servidor remoto Windows.
#
# Uso:
#   bash start-dev.sh              # Inicia desarrollo local (puerto 5177)
#   bash start-dev.sh --docker     # Muestra estado del despliegue Docker
#   bash start-dev.sh --rebuild    # Rebuild imagen Docker y reinicia contenedor
#   bash start-dev.sh --stop       # Para los túneles y el servidor Vite
#
# Para parar en modo normal: Ctrl-C
# =============================================================================

set -e

REMOTE_HOST="user@192.168.100.42"
FRONTEND_DIR="$(cd "$(dirname "$0")/sercop-unified/frontend" && pwd)"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── Puertos ──────────────────────────────────────────────────────────────────
LOCAL_SERCOP_PORT=13080   # localhost:13080 → remote:3080  (gptsercop-api Fastify)
REMOTE_SERCOP_PORT=3080
FRONTEND_DEV_PORT=5177    # Puerto Vite dev server

# ── Colores ──────────────────────────────────────────────────────────────────
G='\033[0;32m'; Y='\033[0;33m'; R='\033[0;31m'; B='\033[0;34m'; NC='\033[0m'
BOLD='\033[1m'

log()  { echo -e "${G}▶${NC} $*"; }
warn() { echo -e "${Y}⚠${NC}  $*"; }
err()  { echo -e "${R}✗${NC}  $*"; }
info() { echo -e "${B}ℹ${NC}  $*"; }

# ── PIDs para cleanup ─────────────────────────────────────────────────────────
TUNNEL_PID=""
VITE_PID=""

cleanup() {
  echo ""
  warn "Parando procesos..."
  [ -n "$TUNNEL_PID" ] && kill "$TUNNEL_PID" 2>/dev/null && log "Túnel SSH cerrado"
  [ -n "$VITE_PID"   ] && kill "$VITE_PID"   2>/dev/null && log "Vite detenido"
  echo -e "${G}✓ Listo.${NC}"
  exit 0
}
trap cleanup SIGINT SIGTERM

# ════════════════════════════════════════════
# MODO --docker  (solo informativo)
# ════════════════════════════════════════════
if [[ "$1" == "--docker" ]]; then
  echo -e "\n${BOLD}Estado del despliegue Docker (servidor remoto)${NC}\n"
  ssh "$REMOTE_HOST" "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep gptsercop" 2>&1 || true
  echo ""
  info "Frontend Docker: http://192.168.100.42:${FRONTEND_DEV_PORT}"
  info "Para acceder via túnel: ssh -L ${FRONTEND_DEV_PORT}:localhost:${FRONTEND_DEV_PORT} ${REMOTE_HOST}"
  echo ""
  exit 0
fi

# ════════════════════════════════════════════
# MODO --rebuild  (rebuild Docker image y restart)
# ════════════════════════════════════════════
if [[ "$1" == "--rebuild" ]]; then
  echo -e "\n${BOLD}Rebuild + restart del frontend Docker${NC}\n"
  log "Construyendo imagen (esto tarda ~2 min)..."
  docker --context win-docker compose build frontend
  log "Reiniciando contenedor..."
  docker --context win-docker compose up -d frontend
  echo ""
  log "Frontend Docker actualizado en http://192.168.100.42:${FRONTEND_DEV_PORT}"
  info "Para abrir tunnel: ssh -L ${FRONTEND_DEV_PORT}:localhost:${FRONTEND_DEV_PORT} ${REMOTE_HOST} -N &"
  echo ""
  exit 0
fi

# ════════════════════════════════════════════
# MODO NORMAL — desarrollo local con Vite
# ════════════════════════════════════════════
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   SERCOP Analytics · Modo Desarrollo    ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════╝${NC}"
echo ""

# [1/4] Verificar SSH
log "[1/4] Verificando conectividad SSH a ${REMOTE_HOST}..."
if ! ssh -o ConnectTimeout=8 -o BatchMode=yes "$REMOTE_HOST" "exit" 2>/dev/null; then
  err "No se puede conectar a ${REMOTE_HOST} por SSH."
  echo "  Verifica que el host esté encendido y las claves SSH configuradas."
  exit 1
fi
echo -e "     ${G}✓ SSH OK${NC}"

# [2/4] Verificar que el backend Sercop esté corriendo en remoto
log "[2/4] Verificando backend Sercop en servidor remoto..."
API_STATUS=$(ssh "$REMOTE_HOST" "docker inspect --format='{{.State.Status}}' gptsercop-api-1 2>/dev/null || echo missing")
if [[ "$API_STATUS" != "running" ]]; then
  warn "gptsercop-api no está corriendo (estado: ${API_STATUS}), levantando..."
  docker --context win-docker compose up -d api postgres redis minio
  log "Esperando que el backend esté listo (15s)..."
  sleep 15
else
  echo -e "     ${G}✓ gptsercop-api corriendo${NC}"
fi

# [3/4] Abrir túnel SSH
log "[3/4] Abriendo túnel SSH..."
echo -e "     localhost:${LOCAL_SERCOP_PORT} → remote:${REMOTE_SERCOP_PORT} (Sercop API)"

ssh -N \
  -L "${LOCAL_SERCOP_PORT}:localhost:${REMOTE_SERCOP_PORT}" \
  "$REMOTE_HOST" &
TUNNEL_PID=$!
sleep 2

# Verificar que el túnel responde
if curl -sf --max-time 5 "http://localhost:${LOCAL_SERCOP_PORT}/health" -o /dev/null 2>/dev/null; then
  echo -e "     ${G}✓ Túnel listo — API responde en localhost:${LOCAL_SERCOP_PORT}${NC}"
else
  warn "API aún iniciando, continuando de todas formas..."
fi

# [4/4] Arrancar Vite
log "[4/4] Arrancando Vite dev server en http://localhost:${FRONTEND_DEV_PORT}"
echo ""
echo -e "${BOLD}  ┌─────────────────────────────────────────────┐${NC}"
echo -e "${BOLD}  │  🚀  http://localhost:${FRONTEND_DEV_PORT}                 │${NC}"
echo -e "${BOLD}  │                                             │${NC}"
echo -e "${BOLD}  │  API proxy → http://localhost:${LOCAL_SERCOP_PORT}       │${NC}"
echo -e "${BOLD}  └─────────────────────────────────────────────┘${NC}"
echo ""
echo -e "${Y}  Credenciales:${NC}"
echo -e "  Usuario:  ${G}cp.analista${NC} · ${G}cp.director${NC} · ${G}cp.supervisor${NC}"
echo -e "  Password: ${G}Demo123!${NC}"
echo ""
echo -e "${Y}  Modo Docker (siempre disponible):${NC}"
echo -e "  bash start-dev.sh --docker    # ver estado"
echo -e "  bash start-dev.sh --rebuild   # actualizar imagen"
echo ""
echo -e "  Presiona ${R}Ctrl-C${NC} para parar.\n"

cd "$FRONTEND_DIR"
VITE_DEV_PROXY_TARGET="http://localhost:${LOCAL_SERCOP_PORT}" \
VITE_GPTSERCOP_API_BASE_URL="http://localhost:${LOCAL_SERCOP_PORT}" \
VITE_ENABLE_CMX_CHAT=false \
  npm run dev -- --port "$FRONTEND_DEV_PORT" --strictPort &
VITE_PID=$!

wait "$VITE_PID"
cleanup
