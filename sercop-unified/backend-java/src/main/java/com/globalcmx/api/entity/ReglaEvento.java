package com.globalcmx.api.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReglaEvento {
    private Long id;
    private String codigo; // único, ej: "REGLA-LC-001"
    private String nombre;
    private String descripcion;
    private String tipoOperacion; // LC_IMPORTACION, LC_EXPORTACION, GARANTIA, COBRANZA, etc.
    private String eventoTrigger; // CREATED, UPDATED, DELETED, APPROVED, etc.
    private String condicionesDRL; // contenido del archivo DRL con las reglas Drools
    private String accionesJson; // JSON con lista de acciones a ejecutar
    private Integer prioridad; // orden de ejecución, default 100
    private Boolean activo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}
