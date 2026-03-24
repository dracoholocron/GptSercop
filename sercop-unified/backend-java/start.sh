#!/bin/bash

echo "=================================================="
echo "   GlobalCMX Backend - Inicio Rápido"
echo "=================================================="
echo ""

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi

# Verificar Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado."
    exit 1
fi

# Verificar Maven
if ! command -v mvn &> /dev/null; then
    echo "❌ Maven no está instalado. Por favor instala Maven primero."
    exit 1
fi

# Verificar y configurar Java 21
if ! command -v java &> /dev/null; then
    echo "❌ Java no está instalado. Por favor instala Java 21."
    exit 1
fi

# Configurar JAVA_HOME para Java 21
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    if /usr/libexec/java_home -v 21 &> /dev/null; then
        export JAVA_HOME=$(/usr/libexec/java_home -v 21)
        echo "✅ Configurado Java 21: $JAVA_HOME"
    else
        echo "⚠️  Java 21 no encontrado. Intenta: brew install openjdk@21"
        echo "Usando versión de Java actual:"
        java -version
    fi
else
    echo "⚠️  Sistema no macOS. Asegúrate de usar Java 21"
fi

echo "✅ Todos los prerequisitos están instalados"
echo ""

# Iniciar servicios Docker
echo "🐳 Iniciando MySQL y Kafka con Docker Compose..."
docker-compose up -d

echo ""
echo "⏳ Esperando a que MySQL y Kafka estén listos..."
sleep 15

echo ""
echo "📊 Estado de los servicios:"
docker-compose ps

echo ""
echo "🔨 Compilando la aplicación Spring Boot..."
mvn clean install -DskipTests

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Compilación exitosa"
    echo ""
    echo "🚀 Iniciando la aplicación Spring Boot..."
    echo ""
    mvn spring-boot:run
else
    echo ""
    echo "❌ Error en la compilación"
    exit 1
fi
