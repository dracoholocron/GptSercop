#!/bin/bash

# Script para construir y probar la imagen Docker del backend
# Uso: ./build-docker.sh [opciones]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
PROJECT_ID="${GCP_PROJECT_ID:-globalcmx-prod}"
IMAGE_NAME="globalcmx-backend"
VERSION="${VERSION:-v1.0.0}"
REGISTRY="${REGISTRY:-gcr.io}"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   GlobalCMX Backend - Docker Build${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Función para mostrar ayuda
show_help() {
    echo "Uso: ./build-docker.sh [opciones]"
    echo ""
    echo "Opciones:"
    echo "  -p, --project     ID del proyecto GCP (default: globalcmx-prod)"
    echo "  -v, --version     Versión de la imagen (default: v1.0.0)"
    echo "  -r, --registry    Registry a usar (default: gcr.io)"
    echo "  -t, --test        Solo construir y probar localmente"
    echo "  -h, --help        Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  ./build-docker.sh                           # Build y push con valores default"
    echo "  ./build-docker.sh -t                        # Solo build y test local"
    echo "  ./build-docker.sh -p mi-proyecto -v v2.0.0  # Build con proyecto y versión específicos"
}

# Parse argumentos
TEST_ONLY=false
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--project)
            PROJECT_ID="$2"
            shift 2
            ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -r|--registry)
            REGISTRY="$2"
            shift 2
            ;;
        -t|--test)
            TEST_ONLY=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Error: Opción desconocida $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

FULL_IMAGE_NAME="${REGISTRY}/${PROJECT_ID}/${IMAGE_NAME}:${VERSION}"

echo -e "${GREEN}✓ Configuración:${NC}"
echo "  Project ID: ${PROJECT_ID}"
echo "  Image Name: ${IMAGE_NAME}"
echo "  Version: ${VERSION}"
echo "  Full Image: ${FULL_IMAGE_NAME}"
echo ""

# Verificar que Docker está corriendo
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker no está corriendo${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker está corriendo${NC}"

# Paso 1: Limpiar builds anteriores
echo ""
echo -e "${YELLOW}[1/5] Limpiando builds anteriores...${NC}"
rm -rf target/
echo -e "${GREEN}✓ Limpieza completada${NC}"

# Paso 2: Construir imagen Docker
echo ""
echo -e "${YELLOW}[2/5] Construyendo imagen Docker...${NC}"
docker build -t ${IMAGE_NAME}:${VERSION} -t ${IMAGE_NAME}:latest .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Imagen construida exitosamente${NC}"
else
    echo -e "${RED}❌ Error al construir la imagen${NC}"
    exit 1
fi

# Paso 3: Inspeccionar la imagen
echo ""
echo -e "${YELLOW}[3/5] Información de la imagen:${NC}"
docker images ${IMAGE_NAME}:${VERSION}
echo ""
echo "Tamaño de las capas:"
docker history ${IMAGE_NAME}:${VERSION} --human=true --format "table {{.Size}}\t{{.CreatedBy}}" | head -10

# Paso 4: Test local (opcional)
if [ "$TEST_ONLY" = true ]; then
    echo ""
    echo -e "${YELLOW}[4/5] Probando imagen localmente...${NC}"
    echo "Iniciando contenedor de prueba..."

    # Detener contenedor si existe
    docker stop globalcmx-backend-test 2>/dev/null || true
    docker rm globalcmx-backend-test 2>/dev/null || true

    # Iniciar contenedor
    docker run -d \
        --name globalcmx-backend-test \
        -p 8081:8080 \
        -e SPRING_PROFILES_ACTIVE=local \
        ${IMAGE_NAME}:${VERSION}

    echo "Esperando a que la aplicación inicie (60 segundos)..."
    sleep 60

    # Verificar health
    echo "Verificando health endpoint..."
    if curl -f http://localhost:8081/api/actuator/health 2>/dev/null; then
        echo -e "${GREEN}✓ Health check exitoso${NC}"
    else
        echo -e "${RED}❌ Health check falló${NC}"
        echo "Logs del contenedor:"
        docker logs globalcmx-backend-test
        docker stop globalcmx-backend-test
        docker rm globalcmx-backend-test
        exit 1
    fi

    echo ""
    echo -e "${GREEN}✓ Test local exitoso${NC}"
    echo ""
    echo "Para ver los logs: docker logs -f globalcmx-backend-test"
    echo "Para detener: docker stop globalcmx-backend-test && docker rm globalcmx-backend-test"
    echo "URL local: http://localhost:8081/api/actuator/health"

    exit 0
fi

# Paso 5: Tag y Push a GCR (si no es test)
echo ""
echo -e "${YELLOW}[5/5] Preparando para push a ${REGISTRY}...${NC}"

# Tag para GCR
docker tag ${IMAGE_NAME}:${VERSION} ${FULL_IMAGE_NAME}
docker tag ${IMAGE_NAME}:${VERSION} ${REGISTRY}/${PROJECT_ID}/${IMAGE_NAME}:latest

echo -e "${GREEN}✓ Imagen tagged para GCR${NC}"
echo ""
echo -e "${BLUE}Para hacer push a GCR, ejecuta:${NC}"
echo ""
echo "  # 1. Configurar autenticación"
echo "  gcloud auth configure-docker"
echo ""
echo "  # 2. Push de la imagen"
echo "  docker push ${FULL_IMAGE_NAME}"
echo "  docker push ${REGISTRY}/${PROJECT_ID}/${IMAGE_NAME}:latest"
echo ""
echo -e "${BLUE}O usa este comando para hacer todo:${NC}"
echo ""
echo "  gcloud auth configure-docker && docker push ${FULL_IMAGE_NAME} && docker push ${REGISTRY}/${PROJECT_ID}/${IMAGE_NAME}:latest"
echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}   Build completado exitosamente${NC}"
echo -e "${GREEN}================================================${NC}"
