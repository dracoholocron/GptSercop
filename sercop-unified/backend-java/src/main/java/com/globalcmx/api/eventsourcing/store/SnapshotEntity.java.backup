package com.globalcmx.api.eventsourcing.store;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Snapshot - Instantánea del estado de un agregado
 * Optimiza la reconstrucción del estado evitando reproducir todos los eventos
 */
@Entity
@Table(name = "snapshots", indexes = {
    @Index(name = "idx_snapshot_aggregate", columnList = "aggregateId,aggregateType"),
    @Index(name = "idx_snapshot_version", columnList = "version")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SnapshotEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ID del agregado
     */
    @Column(nullable = false, length = 100)
    private String aggregateId;

    /**
     * Tipo de agregado
     */
    @Column(nullable = false, length = 50)
    private String aggregateType;

    /**
     * Versión del agregado en el momento del snapshot
     */
    @Column(nullable = false)
    private Long version;

    /**
     * Estado completo del agregado en formato JSON
     */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String aggregateState;

    /**
     * Timestamp de creación del snapshot
     */
    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
