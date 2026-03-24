package com.globalcmx.api.event;

/**
 * Interfaz funcional para escuchar eventos
 */
@FunctionalInterface
public interface EventListener<T> {

    /**
     * Procesa un evento recibido
     * @param event El evento a procesar
     */
    void onEvent(T event);
}
