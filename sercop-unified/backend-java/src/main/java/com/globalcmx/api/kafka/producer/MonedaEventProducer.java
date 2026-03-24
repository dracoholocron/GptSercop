package com.globalcmx.api.kafka.producer;

import com.globalcmx.api.dto.event.MonedaEvent;
import com.globalcmx.api.event.publisher.EventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;
import java.util.concurrent.CompletableFuture;

/**
 * Implementación de EventPublisher usando Kafka.
 * Se activa cuando spring.kafka.enabled=true (por defecto en local/dev).
 */
@ConditionalOnProperty(name = "spring.kafka.enabled", havingValue = "true", matchIfMissing = true)
@Service
@RequiredArgsConstructor
@Slf4j
public class MonedaEventProducer implements EventPublisher<MonedaEvent> {
    private final KafkaTemplate<String, MonedaEvent> kafkaTemplate;
    @Value("${messaging.topics.moneda-events}")
    private String monedaEventsTopic;

    @Override
    public void publish(MonedaEvent event) {
        log.info("Publishing Moneda Event via Kafka: {} to topic: {}", event.getEventType(), monedaEventsTopic);
        CompletableFuture<SendResult<String, MonedaEvent>> future =
            kafkaTemplate.send(monedaEventsTopic, event.getEventId(), event);
        future.whenComplete((result, ex) -> {
            if (ex == null) {
                log.info("Event published successfully via Kafka: {} with offset: {}",
                    event.getEventType(),
                    result.getRecordMetadata().offset());
            } else {
                log.error("Failed to publish event via Kafka: {}", event.getEventType(), ex);
            }
        });
    }

    @Override
    public String getPublisherType() {
        return "Kafka";
    }
}
