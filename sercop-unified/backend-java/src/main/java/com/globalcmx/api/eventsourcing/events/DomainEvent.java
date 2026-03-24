package com.globalcmx.api.eventsourcing.events;

import java.time.LocalDateTime;

/**
 * Interface base para todos los eventos de dominio
 */
public interface DomainEvent {

    /**
     * ID único del evento
     */
    String getEventId();

    /**
     * ID del agregado al que pertenece el evento
     */
    String getAggregateId();

    /**
     * Timestamp del evento
     */
    LocalDateTime getTimestamp();

    /**
     * Tipo de evento (para serialización)
     */
    String getEventType();
}
