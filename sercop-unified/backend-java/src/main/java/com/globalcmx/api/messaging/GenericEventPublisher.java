package com.globalcmx.api.messaging;

import com.azure.messaging.servicebus.ServiceBusMessage;
import com.azure.messaging.servicebus.ServiceBusSenderClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.spring.pubsub.core.PubSubTemplate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Publisher genérico que se adapta automáticamente al proveedor de mensajería configurado.
 * Soporta Apache Kafka, Google Cloud Pub/Sub y Azure Service Bus de forma transparente.
 *
 * @param <T> Tipo del evento a publicar
 */
@Component
@Slf4j
public class GenericEventPublisher<T> {

    private final MessagingProperties messagingProperties;
    private final ObjectMapper objectMapper;

    @Autowired(required = false)
    private KafkaTemplate<String, T> kafkaTemplate;

    @Autowired(required = false)
    private PubSubTemplate pubSubTemplate;

    @Autowired(required = false)
    private Map<String, ServiceBusSenderClient> serviceBusSenders;

    public GenericEventPublisher(MessagingProperties messagingProperties, ObjectMapper objectMapper) {
        this.messagingProperties = messagingProperties;
        this.objectMapper = objectMapper;
        log.info("GenericEventPublisher initialized with provider: {}", messagingProperties.getProvider());
    }

    /**
     * Publica un evento al sistema de mensajería configurado.
     *
     * @param topicLogicalName Nombre lógico del topic (ej: "moneda-events")
     * @param key Clave del mensaje (usado para particionamiento en Kafka)
     * @param event El evento a publicar
     */
    public void publish(String topicLogicalName, String key, T event) {
        if (!messagingProperties.isEnabled()) {
            log.debug("Messaging is disabled. Event not published: {}", event);
            return;
        }

        String topicName = messagingProperties.getTopicName(topicLogicalName);

        switch (messagingProperties.getProvider()) {
            case KAFKA:
                publishToKafka(topicName, key, event);
                break;

            case PUBSUB:
                publishToPubSub(topicName, event);
                break;

            case SERVICEBUS:
                publishToServiceBus(topicName, key, event);
                break;

            case NONE:
                log.debug("Messaging provider is NONE. Event not published: {}", event);
                break;

            default:
                String msg = "Unknown messaging provider: " + messagingProperties.getProvider();
                log.error(msg);
                throw new MessagingException(msg, topicLogicalName, messagingProperties.getProvider());
        }
    }

    /**
     * Publica un evento a Kafka
     */
    private void publishToKafka(String topicName, String key, T event) {
        if (kafkaTemplate == null) {
            String msg = "KafkaTemplate is not available. Cannot publish event to Kafka.";
            log.error(msg);
            throw new MessagingException(msg, topicName, MessagingProvider.KAFKA);
        }

        try {
            log.debug("Publishing event to Kafka topic: {} with key: {}", topicName, key);

            kafkaTemplate.send(topicName, key, event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Error publishing event to Kafka topic {}: {}", topicName, ex.getMessage(), ex);
                    } else {
                        log.info("Event published successfully to Kafka topic: {} - offset: {}",
                            topicName, result.getRecordMetadata().offset());
                    }
                });
        } catch (Exception e) {
            String msg = "Error publishing to Kafka topic " + topicName + ": " + e.getMessage();
            log.error(msg, e);
            throw new MessagingException(msg, topicName, MessagingProvider.KAFKA, e);
        }
    }

    /**
     * Publica un evento a Google Cloud Pub/Sub
     */
    private void publishToPubSub(String topicName, T event) {
        if (pubSubTemplate == null) {
            String msg = "PubSubTemplate is not available. Make sure spring-cloud-gcp-starter-pubsub dependency is added and GCP credentials are configured.";
            log.error(msg);
            throw new MessagingException(msg, topicName, MessagingProvider.PUBSUB);
        }

        try {
            log.debug("Publishing event to Pub/Sub topic: {}", topicName);

            // Convertir el evento a JSON
            String eventJson = objectMapper.writeValueAsString(event);

            // Publicar de forma asíncrona
            CompletableFuture<String> future = pubSubTemplate.publish(topicName, eventJson);

            future.whenComplete((messageId, ex) -> {
                if (ex == null) {
                    log.info("Event published successfully to Pub/Sub topic: {} with messageId: {}",
                        topicName, messageId);
                } else {
                    log.error("Error publishing event to Pub/Sub topic {}: {}", topicName, ex.getMessage(), ex);
                }
            });
        } catch (Exception e) {
            String msg = "Error publishing to Pub/Sub topic " + topicName + ": " + e.getMessage();
            log.error(msg, e);
            throw new MessagingException(msg, topicName, MessagingProvider.PUBSUB, e);
        }
    }

    /**
     * Publica un evento a Azure Service Bus
     */
    private void publishToServiceBus(String topicName, String key, T event) {
        if (serviceBusSenders == null || !serviceBusSenders.containsKey(topicName)) {
            String msg = "ServiceBusSenderClient for topic '" + topicName + "' is not available. Make sure Service Bus senders are configured.";
            log.error(msg);
            throw new MessagingException(msg, topicName, MessagingProvider.SERVICEBUS);
        }

        try {
            log.debug("Publishing event to Service Bus topic: {} with key: {}", topicName, key);

            // Convertir el evento a JSON
            String eventJson = objectMapper.writeValueAsString(event);

            // Crear mensaje de Service Bus
            ServiceBusMessage message = new ServiceBusMessage(eventJson);
            if (key != null) {
                message.setMessageId(key);
            }

            // Publicar de forma síncrona
            ServiceBusSenderClient sender = serviceBusSenders.get(topicName);
            sender.sendMessage(message);

            log.info("Event published successfully to Service Bus topic: {}", topicName);
        } catch (Exception e) {
            String msg = "Error publishing to Service Bus topic " + topicName + ": " + e.getMessage();
            log.error(msg, e);
            throw new MessagingException(msg, topicName, MessagingProvider.SERVICEBUS, e);
        }
    }

    /**
     * Retorna el tipo de proveedor configurado
     */
    public MessagingProvider getProvider() {
        return messagingProperties.getProvider();
    }

    /**
     * Verifica si el sistema de mensajería está habilitado
     */
    public boolean isEnabled() {
        return messagingProperties.isEnabled();
    }
}
