package com.globalcmx.api.kafka.producer;

import com.globalcmx.api.dto.event.CatalogoPersonalizadoEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
@Profile("!gcp & !azure")
@Service
@RequiredArgsConstructor
@Slf4j
public class CatalogoPersonalizadoEventProducer {
    private final KafkaTemplate<String, CatalogoPersonalizadoEvent> kafkaTemplate;
    @Value("${messaging.topics.catalogo-personalizado-events}")
    private String catalogoPersonalizadoTopic;
    public void publishCatalogoPersonalizadoEvent(CatalogoPersonalizadoEvent event) {
        try {
            log.info("Publicando evento de catálogo personalizado: {} para catalogoPersonalizadoId: {}",
                    event.getEventType(), event.getCatalogoPersonalizadoId());
            kafkaTemplate.send(catalogoPersonalizadoTopic, event.getCatalogoPersonalizadoId().toString(), event)
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            log.error("Error al publicar evento de catálogo personalizado: {}", ex.getMessage(), ex);
                        } else {
                            log.info("Evento de catálogo personalizado publicado exitosamente: {} - offset: {}",
                                    event.getEventType(),
                                    result.getRecordMetadata().offset());
                        }
                    });
        } catch (Exception e) {
            log.error("Error al enviar evento de catálogo personalizado a Kafka (sin detener transacción): {}", e.getMessage());
            // No lanzar excepción para permitir que la transacción continúe sin Kafka
        }
    }
}
