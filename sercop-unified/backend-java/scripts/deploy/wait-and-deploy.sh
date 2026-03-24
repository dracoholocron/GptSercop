#!/bin/bash

# Script para esperar a que el Docker build termine y luego desplegar

set -e

PROJECT_ID="globalcmx-prod"
IMAGE_NAME="gcr.io/${PROJECT_ID}/globalcmx-backend:v1.0.0"

echo "🔍 Esperando a que la imagen Docker esté lista..."
echo ""

# Esperar hasta que la imagen exista
MAX_ATTEMPTS=60
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if docker images ${IMAGE_NAME} | grep -q "v1.0.0"; then
        echo "✅ Imagen Docker lista!"
        break
    fi

    echo "⏳ Intento $((ATTEMPT+1))/$MAX_ATTEMPTS - Esperando..."
    sleep 10
    ATTEMPT=$((ATTEMPT+1))
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo "❌ Timeout esperando la imagen Docker"
    exit 1
fi

echo ""
echo "🚀 Iniciando despliegue automatizado..."
echo ""

# Ejecutar el script de despliegue
./deploy-to-gcp.sh
