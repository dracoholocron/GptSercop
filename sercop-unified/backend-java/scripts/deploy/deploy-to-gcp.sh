#!/bin/bash

# Script completo para desplegar GlobalCMX Backend en GCP
# Este script automatiza todo el proceso de despliegue

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables de configuración
PROJECT_ID="globalcmx-prod"
REGION="us-central1"
ZONE="us-central1-a"
CLUSTER_NAME="globalcmx-cluster"
IMAGE_VERSION="v1.0.0"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   Despliegue de GlobalCMX en GCP${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Función para verificar el estado de un comando
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ Error: $1${NC}"
        exit 1
    fi
}

# 1. Verificar autenticación
echo -e "${YELLOW}[1/10] Verificando autenticación...${NC}"
gcloud auth list
check_status "Autenticación verificada"

# 2. Configurar proyecto
echo -e "\n${YELLOW}[2/10] Configurando proyecto...${NC}"
gcloud config set project ${PROJECT_ID}
check_status "Proyecto configurado: ${PROJECT_ID}"

# 3. Verificar que la imagen Docker existe
echo -e "\n${YELLOW}[3/10] Verificando imagen Docker...${NC}"
if docker images gcr.io/${PROJECT_ID}/globalcmx-backend:${IMAGE_VERSION} | grep -q ${IMAGE_VERSION}; then
    echo -e "${GREEN}✓ Imagen Docker encontrada${NC}"
else
    echo -e "${YELLOW}La imagen no existe localmente. Construyéndola...${NC}"
    docker build -t gcr.io/${PROJECT_ID}/globalcmx-backend:${IMAGE_VERSION} .
    check_status "Imagen Docker construida"
fi

# 4. Push de la imagen a GCR
echo -e "\n${YELLOW}[4/10] Subiendo imagen a GCR...${NC}"
gcloud auth configure-docker gcr.io --quiet
docker push gcr.io/${PROJECT_ID}/globalcmx-backend:${IMAGE_VERSION}
docker push gcr.io/${PROJECT_ID}/globalcmx-backend:latest
check_status "Imagen subida a GCR"

# 5. Crear cluster GKE (si no existe)
echo -e "\n${YELLOW}[5/10] Verificando cluster GKE...${NC}"
if gcloud container clusters describe ${CLUSTER_NAME} --region=${REGION} >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Cluster ya existe${NC}"
else
    echo -e "${YELLOW}Creando cluster GKE...${NC}"
    gcloud container clusters create ${CLUSTER_NAME} \
        --region=${REGION} \
        --num-nodes=1 \
        --machine-type=e2-medium \
        --enable-autoscaling \
        --min-nodes=1 \
        --max-nodes=5 \
        --enable-autorepair \
        --enable-autoupgrade \
        --project=${PROJECT_ID}
    check_status "Cluster GKE creado"
fi

# 6. Obtener credenciales del cluster
echo -e "\n${YELLOW}[6/10] Obteniendo credenciales de GKE...${NC}"
gcloud container clusters get-credentials ${CLUSTER_NAME} --region=${REGION} --project=${PROJECT_ID}
check_status "Credenciales obtenidas"

# 7. Aplicar secretos
echo -e "\n${YELLOW}[7/10] Aplicando secretos de Kubernetes...${NC}"
kubectl apply -f k8s/backend-secrets.yaml
check_status "Secretos aplicados"

# 8. Desplegar backend
echo -e "\n${YELLOW}[8/10] Desplegando backend en GKE...${NC}"
kubectl apply -f k8s/backend-deployment.yaml
check_status "Backend desplegado"

# 9. Esperar a que los pods estén listos
echo -e "\n${YELLOW}[9/10] Esperando a que los pods estén listos...${NC}"
kubectl wait --for=condition=ready pod -l app=globalcmx-backend --timeout=300s
check_status "Pods listos"

# 10. Obtener IP del servicio
echo -e "\n${YELLOW}[10/10] Obteniendo información del servicio...${NC}"
echo "Esperando a que se asigne la IP externa..."
for i in {1..30}; do
    EXTERNAL_IP=$(kubectl get service globalcmx-backend-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    if [ ! -z "$EXTERNAL_IP" ]; then
        break
    fi
    echo -n "."
    sleep 10
done
echo ""

if [ -z "$EXTERNAL_IP" ]; then
    echo -e "${YELLOW}⚠ La IP externa aún no está asignada. Ejecuta:${NC}"
    echo "kubectl get service globalcmx-backend-service"
else
    echo -e "${GREEN}✓ IP Externa asignada: ${EXTERNAL_IP}${NC}"
fi

# Mostrar estado del despliegue
echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   Despliegue completado${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo "Estado de los pods:"
kubectl get pods -l app=globalcmx-backend
echo ""
echo "Estado del servicio:"
kubectl get service globalcmx-backend-service
echo ""
echo "Estado del HPA:"
kubectl get hpa globalcmx-backend-hpa
echo ""

if [ ! -z "$EXTERNAL_IP" ]; then
    echo -e "${GREEN}URLs de acceso:${NC}"
    echo "  - Backend:     http://${EXTERNAL_IP}/api/actuator/health"
    echo "  - Metrics:     http://${EXTERNAL_IP}/api/actuator/metrics"
    echo "  - Prometheus:  http://${EXTERNAL_IP}/api/actuator/prometheus"
    echo ""
    echo "Prueba el backend:"
    echo "  curl http://${EXTERNAL_IP}/api/actuator/health"
fi

echo ""
echo -e "${BLUE}Comandos útiles:${NC}"
echo "  # Ver logs"
echo "  kubectl logs -f deployment/globalcmx-backend"
echo ""
echo "  # Ver pods"
echo "  kubectl get pods"
echo ""
echo "  # Escalar manualmente"
echo "  kubectl scale deployment globalcmx-backend --replicas=3"
echo ""
echo "  # Actualizar imagen"
echo "  kubectl set image deployment/globalcmx-backend backend=gcr.io/${PROJECT_ID}/globalcmx-backend:NEW_VERSION"
echo ""
echo -e "${GREEN}¡Despliegue exitoso!${NC}"
