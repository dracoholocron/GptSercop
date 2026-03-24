package com.globalcmx.api.event;

import java.util.concurrent.CompletableFuture;

/**
 * Abstracción para publicar eventos a un sistema de mensajería.
 * Permite implementaciones para Kafka, Pub/Sub, u otros sistemas.
 */
public interface EventPublisher {

    /**
     * Publica un evento de forma asíncrona
     * @param topic Topic/Canal donde publicar el evento
     * @param key Clave del evento (para particionamiento)
     * @param event Payload del evento
     * @return CompletableFuture que se completa cuando el evento es publicado
     */
    <T> CompletableFuture<Void> publish(String topic, String key, T event);

    /**
     * Publica un evento de forma asíncrona sin clave
     * @param topic Topic/Canal donde publicar el evento
     * @param event Payload del evento
     * @return CompletableFuture que se completa cuando el evento es publicado
     */
    default <T> CompletableFuture<Void> publish(String topic, T event) {
        return publish(topic, null, event);
    }
}
