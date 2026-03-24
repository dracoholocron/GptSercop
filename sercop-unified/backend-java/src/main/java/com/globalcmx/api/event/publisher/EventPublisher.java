package com.globalcmx.api.event.publisher;

/**
 * Interfaz genérica para publicar eventos.
 * Permite abstraer el mecanismo de publicación (Kafka, Pub/Sub, etc.)
 * permitiendo cambiar entre ellos mediante configuración.
 *
 * @param <T> El tipo de evento a publicar
 */
public interface EventPublisher<T> {

    /**
     * Publica un evento al sistema de mensajería configurado.
     *
     * @param event El evento a publicar
     */
    void publish(T event);

    /**
     * Retorna el nombre del mecanismo de publicación (para logging/debugging).
     *
     * @return Nombre del publisher (ej: "Kafka", "PubSub")
     */
    default String getPublisherType() {
        return this.getClass().getSimpleName();
    }
}
