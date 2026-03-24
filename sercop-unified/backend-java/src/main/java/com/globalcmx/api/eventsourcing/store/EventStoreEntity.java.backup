package com.globalcmx.api.eventsourcing.store;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Event Store - Almacena todos los eventos del sistema
 * Esta es la fuente de verdad (Source of Truth) en Event Sourcing
 */
@Entity
@Table(name = "event_store", indexes = {
    @Index(name = "idx_aggregate_id", columnList = "aggregateId"),
    @Index(name = "idx_aggregate_type", columnList = "aggregateType"),
    @Index(name = "idx_event_type", columnList = "eventType"),
    @Index(name = "idx_timestamp", columnList = "timestamp")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventStoreEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ID único del evento (UUID)
     */
    @Column(nullable = false, unique = true, length = 36)
    private String eventId;

    /**
     * ID del agregado al que pertenece el evento
     * Ej: "moneda-1", "moneda-2"
     */
    @Column(nullable = false, length = 100)
    private String aggregateId;

    /**
     * Tipo de agregado: "Moneda", "Cotizacion", etc.
     */
    @Column(nullable = false, length = 50)
    private String aggregateType;

    /**
     * Versión del agregado (sequence number)
     * Permite reconstruir el estado del agregado evento por evento
     */
    @Column(nullable = false)
    private Long version;

    /**
     * Tipo de evento: "MonedaCreated", "MonedaUpdated", "MonedaDeleted"
     */
    @Column(nullable = false, length = 100)
    private String eventType;

    /**
     * Payload del evento en formato JSON
     * Contiene todos los datos del evento
     */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String eventData;

    /**
     * Metadatos adicionales (usuario que realizó la acción, IP, etc.)
     */
    @Column(columnDefinition = "TEXT")
    private String metadata;

    /**
     * Usuario que causó el evento
     */
    @Column(length = 100)
    private String performedBy;

    /**
     * Timestamp del evento
     */
    @Column(nullable = false)
    private LocalDateTime timestamp;

    /**
     * Indica si el evento ha sido procesado por todas las proyecciones
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean processed = false;

    /**
     * Timestamp de creación del registro
     */
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }
}
