package com.globalcmx.api.pubsub.producer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.event.MonedaEvent;
import com.globalcmx.api.event.publisher.EventPublisher;
import com.google.cloud.spring.pubsub.core.PubSubTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

/**
 * Implementación de EventPublisher usando Google Cloud Pub/Sub.
 * Se activa cuando spring.kafka.enabled=false y spring.cloud.gcp.pubsub.enabled=true.
 */
@ConditionalOnProperty(name = "spring.cloud.gcp.pubsub.enabled", havingValue = "true")
@Service
@RequiredArgsConstructor
@Slf4j
public class MonedaEventPubSubProducer implements EventPublisher<MonedaEvent> {

    private final PubSubTemplate pubSubTemplate;
    private final ObjectMapper objectMapper;

    @Value("${pubsub.topics.moneda-events:moneda-events}")
    private String monedaEventsTopic;

    @Override
    public void publish(MonedaEvent event) {
        try {
            log.info("Publishing Moneda Event via Pub/Sub: {} to topic: {}",
                event.getEventType(), monedaEventsTopic);

            // Convertir el evento a JSON
            String eventJson = objectMapper.writeValueAsString(event);

            // Publicar a Pub/Sub de forma asíncrona
            CompletableFuture<String> future = pubSubTemplate.publish(monedaEventsTopic, eventJson);

            // Manejar el resultado
            future.whenComplete((messageId, ex) -> {
                if (ex == null) {
                    log.info("Event published successfully via Pub/Sub: {} with messageId: {}",
                        event.getEventType(), messageId);
                } else {
                    log.error("Failed to publish event via Pub/Sub: {}",
                        event.getEventType(), ex);
                }
            });

        } catch (Exception e) {
            log.error("Error serializing or publishing Moneda event via Pub/Sub: {}",
                event, e);
            throw new RuntimeException("Failed to publish event via Pub/Sub", e);
        }
    }

    @Override
    public String getPublisherType() {
        return "Pub/Sub";
    }
}
