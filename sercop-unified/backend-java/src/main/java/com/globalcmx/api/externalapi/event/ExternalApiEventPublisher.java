package com.globalcmx.api.externalapi.event;

/**
 * Interface for publishing external API call events.
 * Implementations can use Kafka, Service Bus, or other messaging systems.
 */
public interface ExternalApiEventPublisher {

    /**
     * Publishes an external API call event.
     *
     * @param event The event to publish
     */
    void publish(ExternalApiCallEvent event);

    /**
     * Gets the topic/queue name for external API call events.
     */
    String getTopicName();
}
