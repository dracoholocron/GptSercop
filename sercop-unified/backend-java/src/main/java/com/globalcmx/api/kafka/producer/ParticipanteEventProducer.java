package com.globalcmx.api.kafka.producer;

import com.globalcmx.api.dto.event.ParticipanteEvent;
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
public class ParticipanteEventProducer {
    private final KafkaTemplate<String, ParticipanteEvent> kafkaTemplate;
    @Value("${messaging.topics.participante-events}")
    private String participanteTopic;
    public void publishParticipanteEvent(ParticipanteEvent event) {
        try {
            log.info("Publicando evento de participante: {} para participanteId: {}",
                    event.getEventType(), event.getParticipanteId());
            kafkaTemplate.send(participanteTopic, event.getParticipanteId().toString(), event)
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            log.error("Error al publicar evento de participante: {}", ex.getMessage(), ex);
                        } else {
                            log.info("Evento de participante publicado exitosamente: {} - offset: {}",
                                    event.getEventType(),
                                    result.getRecordMetadata().offset());
                        }
                    });
        } catch (Exception e) {
            log.error("Error al enviar evento de participante a Kafka (sin detener transacción): {}", e.getMessage());
            // No lanzar excepción para permitir que la transacción continúe sin Kafka
        }
    }
}
