package com.globalcmx.api.externalapi.kafka;

import com.globalcmx.api.externalapi.event.ExternalApiCallEvent;
import com.globalcmx.api.externalapi.event.ExternalApiEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

/**
 * Kafka producer for external API call events.
 * Publishes events for CQRS/Event Sourcing pattern.
 */
@ConditionalOnProperty(name = "spring.kafka.enabled", havingValue = "true", matchIfMissing = true)
@Service
@RequiredArgsConstructor
@Slf4j
public class ExternalApiCallEventProducer implements ExternalApiEventPublisher {

    private final KafkaTemplate<String, ExternalApiCallEvent> kafkaTemplate;

    @Value("${messaging.topics.external-api-call-events:external-api-call-events}")
    private String externalApiCallEventsTopic;

    /**
     * Publishes an external API call event to Kafka.
     *
     * @param event The event to publish
     */
    @Override
    public void publish(ExternalApiCallEvent event) {
        log.info("Publishing External API Call Event via Kafka: {} for API {} to topic: {}",
                event.getEventType(), event.getApiConfigCode(), externalApiCallEventsTopic);

        CompletableFuture<SendResult<String, ExternalApiCallEvent>> future =
                kafkaTemplate.send(externalApiCallEventsTopic, event.getAggregateId(), event);

        future.whenComplete((result, ex) -> {
            if (ex == null) {
                log.info("External API Call Event published successfully via Kafka: {} with offset: {}",
                        event.getEventType(),
                        result.getRecordMetadata().offset());
            } else {
                log.error("Failed to publish External API Call Event via Kafka: {} - {}",
                        event.getEventType(), ex.getMessage(), ex);
            }
        });
    }

    /**
     * Publishes an external API call event synchronously.
     *
     * @param event The event to publish
     * @return The send result
     */
    public SendResult<String, ExternalApiCallEvent> publishSync(ExternalApiCallEvent event) {
        log.info("Publishing External API Call Event synchronously via Kafka: {} for API {}",
                event.getEventType(), event.getApiConfigCode());

        try {
            SendResult<String, ExternalApiCallEvent> result =
                    kafkaTemplate.send(externalApiCallEventsTopic, event.getAggregateId(), event).get();

            log.info("External API Call Event published successfully: {} with offset: {}",
                    event.getEventType(),
                    result.getRecordMetadata().offset());

            return result;
        } catch (Exception e) {
            log.error("Failed to publish External API Call Event: {} - {}",
                    event.getEventType(), e.getMessage(), e);
            throw new RuntimeException("Failed to publish event", e);
        }
    }

    /**
     * Gets the topic name for external API call events.
     */
    @Override
    public String getTopicName() {
        return externalApiCallEventsTopic;
    }
}
