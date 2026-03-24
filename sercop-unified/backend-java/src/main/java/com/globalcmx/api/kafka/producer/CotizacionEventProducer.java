package com.globalcmx.api.kafka.producer;

import com.globalcmx.api.dto.event.CotizacionEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;
import java.util.concurrent.CompletableFuture;
@Profile("!gcp & !azure")
@Service
@RequiredArgsConstructor
@Slf4j
public class CotizacionEventProducer {
    private final KafkaTemplate<String, CotizacionEvent> kafkaTemplate;
    @Value("${messaging.topics.cotizacion-events}")
    private String cotizacionEventsTopic;
    public void sendCotizacionEvent(CotizacionEvent event) {
        log.info("Sending Cotizacion Event: {} to topic: {}", event, cotizacionEventsTopic);
        CompletableFuture<SendResult<String, CotizacionEvent>> future =
            kafkaTemplate.send(cotizacionEventsTopic, event.getEventId(), event);
        future.whenComplete((result, ex) -> {
            if (ex == null) {
                log.info("Event sent successfully: {} with offset: {}",
                    event.getEventType(),
                    result.getRecordMetadata().offset());
            } else {
                log.error("Failed to send event: {}", event.getEventType(), ex);
            }
        });
    }
}
