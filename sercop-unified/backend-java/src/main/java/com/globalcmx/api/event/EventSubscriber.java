package com.globalcmx.api.event;

/**
 * Abstracción para suscribirse a eventos de un sistema de mensajería.
 * Permite implementaciones para Kafka, Pub/Sub, u otros sistemas.
 */
public interface EventSubscriber {

    /**
     * Registra un listener para un topic específico
     * @param topic Topic/Canal del cual escuchar eventos
     * @param eventType Tipo de clase del evento
     * @param listener Listener que procesará los eventos
     */
    <T> void subscribe(String topic, Class<T> eventType, EventListener<T> listener);

    /**
     * Inicia la escucha de eventos
     */
    void start();

    /**
     * Detiene la escucha de eventos
     */
    void stop();
}
