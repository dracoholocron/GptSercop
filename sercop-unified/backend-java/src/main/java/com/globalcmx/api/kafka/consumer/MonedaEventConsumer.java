package com.globalcmx.api.kafka.consumer;

import com.globalcmx.api.dto.event.MonedaEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class MonedaEventConsumer {

    @KafkaListener(
        topics = "${messaging.topics.moneda-events}",
        groupId = "${spring.kafka.consumer.group-id}"
    )
    public void consumeMonedaEvent(MonedaEvent event) {
        log.info("===== KAFKA EVENT RECEIVED =====");
        log.info("Event Type: {}", event.getEventType());
        log.info("Event ID: {}", event.getEventId());
        log.info("Moneda ID: {}", event.getMonedaId());
        log.info("Código: {}", event.getCodigo());
        log.info("Nombre: {}", event.getNombre());
        log.info("Símbolo: {}", event.getSimbolo());
        log.info("Activo: {}", event.getActivo());
        log.info("Timestamp: {}", event.getTimestamp());
        log.info("Performed By: {}", event.getPerformedBy());
        log.info("================================");

        // Aquí puedes agregar lógica adicional como:
        // - Actualizar vistas materializadas
        // - Sincronizar con otros sistemas
        // - Enviar notificaciones
        // - Mantener auditoría
        // - Actualizar caché

        switch (event.getEventType()) {
            case CREATED:
                log.info("Processing CREATED event for Moneda: {}", event.getCodigo());
                // Lógica específica para creación
                break;
            case UPDATED:
                log.info("Processing UPDATED event for Moneda: {}", event.getCodigo());
                // Lógica específica para actualización
                break;
            case DELETED:
                log.info("Processing DELETED event for Moneda: {}", event.getCodigo());
                // Lógica específica para eliminación
                break;
            default:
                log.warn("Unknown event type: {}", event.getEventType());
        }
    }
}
