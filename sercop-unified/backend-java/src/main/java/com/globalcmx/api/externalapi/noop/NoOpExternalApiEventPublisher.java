package com.globalcmx.api.externalapi.noop;

import com.globalcmx.api.externalapi.event.ExternalApiCallEvent;
import com.globalcmx.api.externalapi.event.ExternalApiEventPublisher;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * No-op implementation of ExternalApiEventPublisher.
 * Used when Kafka is disabled (e.g., in Azure profile with Service Bus).
 * Events are logged but not published to any messaging system.
 */
@ConditionalOnProperty(name = "spring.kafka.enabled", havingValue = "false")
@Service
@Slf4j
public class NoOpExternalApiEventPublisher implements ExternalApiEventPublisher {

    @Override
    public void publish(ExternalApiCallEvent event) {
        log.debug("NoOp: External API Call Event received but not published (Kafka disabled): {} for API {}",
                event.getEventType(), event.getApiConfigCode());
    }

    @Override
    public String getTopicName() {
        return "external-api-call-events-noop";
    }
}
