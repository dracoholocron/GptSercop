# Dockerfile para GlobalCMX Backend
# Multi-stage build para optimizar el tamaño de la imagen final

# ============================================
# STAGE 1: Build
# ============================================
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

# Copiar solo pom.xml primero para aprovechar el cache de Docker
COPY pom.xml .

# Descargar dependencias (esto se cachea si pom.xml no cambia)
RUN mvn dependency:go-offline -B

# Copiar el código fuente
COPY src ./src

# Compilar la aplicación (sin ejecutar tests para acelerar el build)
RUN mvn clean package -DskipTests -B

# ============================================
# STAGE 2: Runtime
# ============================================
FROM eclipse-temurin:21-jre-alpine

# Instalar herramientas útiles para debugging
RUN apk add --no-cache curl bash

# Crear usuario no-root para seguridad
RUN addgroup -S spring && adduser -S spring -G spring

WORKDIR /app

# Crear directorio de logs con permisos adecuados ANTES de cambiar de usuario
RUN mkdir -p /app/logs && chown -R spring:spring /app && chmod -R 755 /app/logs

USER spring:spring

# Copiar el JAR compilado desde el stage anterior
COPY --from=build /app/target/globalcmx-api-*.jar app.jar

# Variables de entorno por defecto
ENV SPRING_PROFILES_ACTIVE=local
ENV JAVA_OPTS="-Xms512m -Xmx2048m -XX:+UseG1GC -XX:MaxGCPauseMillis=200"

# Puerto expuesto
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=5 \
  CMD curl -f http://localhost:8081/internal/actuator/health || exit 1

# Comando de inicio
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Djava.security.egd=file:/dev/./urandom -jar app.jar"]
