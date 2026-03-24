#!/bin/bash

# Script para actualizar servicios de Kafka específico a GenericEventPublisher
# Este script automatiza el reemplazo en múltiples archivos de CommandService

services=(
    "FinanciamientoCxCommandService:FinanciamientoCxEventProducer:FinanciamientoCxEvent:financiamiento-cx-events"
    "LineaCreditoCommandService:LineaCreditoEventProducer:LineaCreditoEvent:linea-credito-events"
    "PlantillaCommandService:PlantillaEventProducer:PlantillaEvent:plantilla-events"
    "PlantillaCorreoCommandService:PlantillaCorreoEventProducer:PlantillaCorreoEvent:plantilla-correo-events"
    "ReglaEventoCommandService:ReglaEventoEventProducer:ReglaEventoEvent:regla-evento-events"
)

BASE_DIR="src/main/java/com/globalcmx/api/service/command"

for service_info in "${services[@]}"; do
    IFS=':' read -r service_name producer_name event_name topic_name <<< "$service_info"
    file_path="$BASE_DIR/${service_name}.java"

    echo "========================================="
    echo "Procesando: $service_name"
    echo "========================================="

    if [ ! -f "$file_path" ]; then
        echo "ERROR: Archivo no encontrado: $file_path"
        continue
    fi

    # 1. Cambiar el import
    sed -i.bak "s/import com.globalcmx.api.kafka.producer.${producer_name};/import com.globalcmx.api.messaging.GenericEventPublisher;/" "$file_path"

    # 2. Reemplazar la declaración del producer
    sed -i.bak "s/@Autowired(required = false)[[:space:]]*private ${producer_name} eventProducer;/\/\/ Inyección del GenericEventPublisher que se adapta a Kafka, Pub\/Sub o Service Bus\n    @Autowired(required = false)\n    private GenericEventPublisher<${event_name}> eventPublisher;/" "$file_path"

    # 3. Cambiar las llamadas al método
    sed -i.bak "s/publishDomainEventToKafka/publishDomainEvent/g" "$file_path"

    # 4. Reemplazar convertDomainEventToKafkaEvent
    sed -i.bak "s/convertDomainEventToKafkaEvent/convertDomainEventToEvent/g" "$file_path"

    # 5. Reemplazar el método publishDomainEventToKafka (más complejo, se hace manualmente después)
    echo "✓ Import actualizado"
    echo "✓ Field actualizado"
    echo "✓ Llamadas a métodos actualizadas"
    echo "✓ Método convertDomainEvent renombrado"
    echo "⚠️  NOTA: Debes actualizar manualmente el método publishDomainEvent para usar:"
    echo "   eventPublisher.publish(\"$topic_name\", id.toString(), event);"
    echo ""
done

echo "========================================="
echo "Script completado"
echo "Recuerda compilar para verificar: mvn compile -DskipTests"
echo "========================================="
