# GlobalCMX API - Backend Spring Boot

API REST con arquitectura CQRS y eventos Kafka para gestión de monedas.

## 🏗️ Arquitectura

### **Patrón CQRS (Command Query Responsibility Segregation)**
- **Commands**: Operaciones de escritura (Create, Update, Delete)
- **Queries**: Operaciones de lectura (Get, List, Search)

### **Event Sourcing con Kafka**
- Todos los eventos de dominio se publican en Kafka
- Consumer procesa eventos para auditoría y sincronización

### **Tech Stack**
- **Framework**: Spring Boot 3.2.1
- **Base de Datos**: MySQL 8.0
- **Message Broker**: Apache Kafka
- **ORM**: Spring Data JPA / Hibernate
- **Build Tool**: Maven
- **Java**: 17

---

## 📁 Estructura del Proyecto

```
backend/
├── src/main/java/com/globalcmx/api/
│   ├── entity/              # Entidades JPA
│   │   └── Moneda.java
│   ├── dto/
│   │   ├── command/         # DTOs para Commands (escritura)
│   │   │   ├── CreateMonedaCommand.java
│   │   │   └── UpdateMonedaCommand.java
│   │   ├── query/           # DTOs para Queries (lectura)
│   │   │   └── MonedaQueryDTO.java
│   │   └── event/           # DTOs para eventos Kafka
│   │       └── MonedaEvent.java
│   ├── repository/          # Repositorios JPA
│   │   └── MonedaRepository.java
│   ├── service/
│   │   ├── command/         # Servicios de escritura
│   │   │   └── MonedaCommandService.java
│   │   └── query/           # Servicios de lectura
│   │       └── MonedaQueryService.java
│   ├── controller/          # REST Controllers
│   │   ├── CurrencyCommandController.java
│   │   └── CurrencyQueryController.java
│   ├── kafka/
│   │   ├── producer/        # Kafka Producers
│   │   │   └── MonedaEventProducer.java
│   │   └── consumer/        # Kafka Consumers
│   │       └── MonedaEventConsumer.java
│   ├── config/              # Configuraciones
│   │   ├── CorsConfig.java
│   │   └── KafkaConfig.java
│   └── GlobalCmxApiApplication.java
└── src/main/resources/
    └── application.yml
```

---

## 🚀 Configuración y Ejecución

### **Prerequisitos**
1. **Java 17** o superior
2. **Maven 3.8+**
3. **MySQL 8.0**
4. **Apache Kafka 3.x**

### **Opción 1: Ejecución Manual**

#### 1. Iniciar MySQL
```bash
# Crear base de datos
mysql -u root -p
CREATE DATABASE globalcmx;
```

#### 2. Iniciar Kafka
```bash
# Iniciar Zookeeper
bin/zookeeper-server-start.sh config/zookeeper.properties

# Iniciar Kafka (en otra terminal)
bin/kafka-server-start.sh config/server.properties
```

#### 3. Compilar y ejecutar la aplicación
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### **Opción 2: Docker Compose (Recomendado)**

Ver archivo `docker-compose.yml` en la raíz del proyecto.

```bash
# Iniciar MySQL y Kafka con Docker
docker-compose up -d

# Compilar y ejecutar la aplicación
cd backend
mvn spring-boot:run
```

---

## 📡 Endpoints API

### **Base URL**: `http://localhost:8080/api`

### **Commands (Escritura)**

#### Crear Moneda
```http
POST /monedas/commands
Content-Type: application/json

{
  "codigo": "USD",
  "nombre": "Dólar Estadounidense",
  "simbolo": "$",
  "activo": true,
  "createdBy": "admin"
}
```

#### Actualizar Moneda
```http
PUT /monedas/commands/{id}
Content-Type: application/json

{
  "codigo": "USD",
  "nombre": "Dólar Americano",
  "simbolo": "US$",
  "activo": true,
  "updatedBy": "admin"
}
```

#### Eliminar Moneda
```http
DELETE /monedas/commands/{id}?deletedBy=admin
```

---

### **Queries (Lectura)**

#### Obtener todas las monedas
```http
GET /monedas/queries
```

#### Obtener moneda por ID
```http
GET /monedas/queries/{id}
```

#### Obtener moneda por código
```http
GET /monedas/queries/codigo/{codigo}
```

#### Obtener solo monedas activas
```http
GET /monedas/queries/active
```

#### Buscar monedas por nombre
```http
GET /monedas/queries/search?nombre=dolar
```

---

## 📊 Eventos Kafka

### **Topic**: `moneda-events`

Cada operación de escritura (Create/Update/Delete) publica un evento en Kafka.

### **Estructura del Evento**:
```json
{
  "eventType": "CREATED",
  "monedaId": 1,
  "codigo": "USD",
  "nombre": "Dólar Estadounidense",
  "simbolo": "$",
  "activo": true,
  "timestamp": "2025-10-21T12:00:00",
  "performedBy": "admin",
  "eventId": "uuid-here"
}
```

### **Tipos de Eventos**:
- `CREATED`: Moneda creada
- `UPDATED`: Moneda actualizada
- `DELETED`: Moneda eliminada

---

## 🔧 Configuración

### **application.yml**

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/globalcmx?createDatabaseIfNotExist=true
    username: root
    password: root

  kafka:
    bootstrap-servers: localhost:9092

server:
  port: 8080
  servlet:
    context-path: /api
```

---

## 🧪 Testing

### **Consumir eventos de Kafka (Consola)**
```bash
# Ver eventos en tiempo real
kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic moneda-events \
  --from-beginning
```

### **Ejemplo con curl**

```bash
# Crear moneda
curl -X POST http://localhost:8080/api/monedas/commands \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "EUR",
    "nombre": "Euro",
    "simbolo": "€",
    "activo": true,
    "createdBy": "admin"
  }'

# Listar monedas
curl http://localhost:8080/api/monedas/queries
```

---

## 🔗 Integración con React

El frontend React (puerto 5173) puede consumir estos endpoints:

```typescript
// Ejemplo en React/TypeScript
const API_BASE_URL = 'http://localhost:8080/api';

// Obtener todas las monedas
const response = await fetch(`${API_BASE_URL}/monedas/queries`);
const data = await response.json();
console.log(data.data); // Array de monedas

// Crear nueva moneda
const response = await fetch(`${API_BASE_URL}/monedas/commands`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    codigo: 'MXN',
    nombre: 'Peso Mexicano',
    simbolo: '$',
    activo: true,
    createdBy: 'user@example.com'
  })
});
```

---

## 📈 Monitoreo

### **Actuator Endpoints**
- Health: `http://localhost:8080/api/actuator/health`
- Info: `http://localhost:8080/api/actuator/info`
- Metrics: `http://localhost:8080/api/actuator/metrics`

---

## 🛠️ Troubleshooting

### **Error: No puedo conectar a MySQL**
```bash
# Verificar que MySQL esté corriendo
mysql -u root -p

# Verificar puerto 3306
lsof -i :3306
```

### **Error: No puedo conectar a Kafka**
```bash
# Verificar que Kafka esté corriendo
lsof -i :9092

# Ver logs de Kafka
tail -f logs/server.log
```

### **Error: Port 8080 already in use**
```bash
# Cambiar puerto en application.yml
server:
  port: 8081
```

---

## 📝 Notas Adicionales

- **CORS**: Configurado para permitir llamadas desde `http://localhost:5173`
- **Validación**: Los DTOs de command incluyen validaciones con Bean Validation
- **Transacciones**: Todas las operaciones de escritura son transaccionales
- **Logging**: Configurado con nivel DEBUG para desarrollo

---

## 👨‍💻 Desarrollo

### **Agregar nueva entidad con CQRS**

1. Crear entidad en `entity/`
2. Crear DTOs en `dto/command/` y `dto/query/`
3. Crear Repository en `repository/`
4. Crear CommandService y QueryService
5. Crear Controllers para commands y queries
6. Crear EventProducer y EventConsumer
7. Actualizar `application.yml` con nuevo topic

---

## 📄 License

Este proyecto es parte de GlobalCMX.
