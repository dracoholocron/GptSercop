package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "event_rules_read_model")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReglaEventoReadModel {
    @Id
    private Long id;

    @Column(name = "code", unique = true, nullable = false)
    private String codigo;

    @Column(name = "name", nullable = false)
    private String nombre;

    @Column(name = "description", length = 1000)
    private String descripcion;

    @Column(name = "operation_type", nullable = false, length = 100)
    private String tipoOperacion; // LC_IMPORTACION, LC_EXPORTACION, GARANTIA, COBRANZA, etc.

    @Column(name = "trigger_event", nullable = false, length = 100)
    private String eventoTrigger; // CREATED, UPDATED, DELETED, APPROVED, etc.

    @Column(name = "conditions_drl", columnDefinition = "TEXT")
    private String condicionesDRL; // contenido del archivo DRL con las reglas Drools

    @Column(name = "actions_json", columnDefinition = "TEXT")
    private String accionesJson; // JSON con lista de acciones a ejecutar

    @Column(name = "priority")
    private Integer prioridad; // orden de ejecución, default 100

    @Column(name = "active", nullable = false)
    private Boolean activo = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_by")
    private String updatedBy;

    @Column(name = "aggregate_id")
    private String aggregateId;

    @Version
    private Long version;
}
