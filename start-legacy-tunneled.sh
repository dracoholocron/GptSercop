#!/usr/bin/env bash
# =============================================================================
# start-legacy-tunneled.sh
# Levanta los túneles SSH al host remoto Windows y el frontend de legacy
# en modo desarrollo, con el proxy apuntando al backend compare.
#
# Uso:  bash start-legacy-tunneled.sh
# Para parar: Ctrl-C (limpia los túneles automáticamente)
# =============================================================================

set -e

REMOTE_HOST="user@192.168.100.45"
FRONTEND_DIR="$(cd "$(dirname "$0")/sercop-unified/frontend" && pwd)"

# ---- Puertos ----------------------------------------------------------------
# Túnel A: localhost:18081 → remote:18080 (globalcmx-backend-api-compare)
# Túnel B: localhost:13080 → remote:3080  (gptsercop-api, opcional)
LOCAL_BACKEND_PORT=18081
LOCAL_GPT_PORT=13080
REMOTE_BACKEND_PORT=18080
REMOTE_GPT_PORT=3080
FRONTEND_PORT=5177

# ---- Colores ----------------------------------------------------------------
G='\033[0;32m'; Y='\033[0;33m'; R='\033[0;31m'; NC='\033[0m'

cleanup() {
  echo -e "\n${Y}Parando túneles y servidor...${NC}"
  kill "$TUNNEL_PID" 2>/dev/null || true
  kill "$VITE_PID"   2>/dev/null || true
  echo -e "${G}Listo.${NC}"
  exit 0
}
trap cleanup SIGINT SIGTERM

# ---- Verificar conectividad SSH --------------------------------------------
echo -e "${G}[1/4] Verificando conectividad SSH a ${REMOTE_HOST}...${NC}"
if ! ssh -o ConnectTimeout=8 -o BatchMode=yes "$REMOTE_HOST" "exit" 2>/dev/null; then
  echo -e "${R}ERROR: No se puede conectar a ${REMOTE_HOST} por SSH.${NC}"
  echo "  Verifica que el host esté encendido y las claves SSH configuradas."
  exit 1
fi
echo -e "${G}  → SSH OK${NC}"

# ---- Iniciar backend compare en remoto (si no está corriendo) ---------------
echo -e "${G}[2/4] Verificando contenedores en remoto...${NC}"
COMPARE_STATUS=$(ssh "$REMOTE_HOST" "docker inspect --format='{{.State.Status}}' globalcmx-backend-api-compare 2>/dev/null || echo missing")

if [[ "$COMPARE_STATUS" != "running" ]]; then
  echo -e "${Y}  compare-backend no está corriendo (estado: ${COMPARE_STATUS}), intentando arrancar...${NC}"
  ssh "$REMOTE_HOST" "docker start globalcmx-zookeeper-compare globalcmx-mysql-readmodel-compare globalcmx-postgres-eventstore-compare globalcmx-chromadb-compare 2>&1 || true"
  sleep 4
  ssh "$REMOTE_HOST" "docker start globalcmx-kafka-compare 2>&1 || true"
  sleep 6
  ssh "$REMOTE_HOST" "docker start globalcmx-backend-api-compare 2>&1 || true"
  echo -e "${Y}  Esperando arranque del backend (30s)...${NC}"
  sleep 30
else
  echo -e "${G}  → compare-backend ya está corriendo${NC}"
fi

# ---- Abrir túneles SSH -------------------------------------------------------
echo -e "${G}[3/4] Abriendo túneles SSH...${NC}"
echo -e "  localhost:${LOCAL_BACKEND_PORT}  →  remote:${REMOTE_BACKEND_PORT}  (Java API)"
echo -e "  localhost:${LOCAL_GPT_PORT}      →  remote:${REMOTE_GPT_PORT}   (GPTsercop API)"

ssh -N \
  -L "${LOCAL_BACKEND_PORT}:localhost:${REMOTE_BACKEND_PORT}" \
  -L "${LOCAL_GPT_PORT}:localhost:${REMOTE_GPT_PORT}" \
  "$REMOTE_HOST" &
TUNNEL_PID=$!
sleep 3

# Verificar que el túnel responde
if curl -sf --max-time 6 "http://localhost:${LOCAL_BACKEND_PORT}/api/auth/login" -o /dev/null 2>/dev/null; then
  echo -e "${G}  → Túneles listos${NC}"
else
  echo -e "${Y}  → Backend aún iniciando, continuando de todas formas...${NC}"
fi

# ---- Arrancar frontend Vite --------------------------------------------------
echo -e "${G}[4/4] Arrancando frontend en http://localhost:${FRONTEND_PORT}${NC}"
echo -e "  Proxy Java API → http://localhost:${LOCAL_BACKEND_PORT}"
echo -e "  Proxy GPT API  → http://localhost:${LOCAL_GPT_PORT}"
echo ""
echo -e "${Y}Credenciales de prueba:${NC}"
echo -e "  Usuario:  ${G}cp.analista${NC}  |  ${G}cp.director${NC}  |  ${G}cp.supervisor${NC}"
echo -e "  Password: ${G}Demo123!${NC}"
echo ""
echo -e "${Y}Presiona Ctrl-C para parar todo.${NC}"
echo ""

cd "$FRONTEND_DIR"
VITE_DEV_PROXY_TARGET="http://localhost:${LOCAL_BACKEND_PORT}" \
VITE_GPTSERCOP_API_BASE_URL="http://localhost:${LOCAL_GPT_PORT}" \
  npm run dev -- --port "$FRONTEND_PORT" --strictPort &
VITE_PID=$!

wait "$VITE_PID"
cleanup
