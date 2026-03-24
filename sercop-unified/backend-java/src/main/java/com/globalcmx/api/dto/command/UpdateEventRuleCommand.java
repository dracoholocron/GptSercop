package com.globalcmx.api.dto.command;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEventRuleCommand {
    @NotBlank(message = "El código es requerido")
    private String codigo;

    @NotBlank(message = "El nombre es requerido")
    private String nombre;

    private String descripcion;

    @NotBlank(message = "El tipo de operación es requerido")
    private String tipoOperacion; // LC_IMPORTACION, LC_EXPORTACION, GARANTIA, COBRANZA, etc.

    @NotBlank(message = "El evento trigger es requerido")
    private String eventoTrigger; // CREATED, UPDATED, DELETED, APPROVED, etc.

    @NotBlank(message = "Las condiciones DRL son requeridas")
    private String condicionesDRL; // contenido del archivo DRL con las reglas Drools

    @NotBlank(message = "Las acciones JSON son requeridas")
    private String accionesJson; // JSON con lista de acciones a ejecutar

    @NotNull(message = "La prioridad es requerida")
    private Integer prioridad; // orden de ejecución, default 100

    @NotNull(message = "El estado activo es requerido")
    private Boolean activo;

    private String updatedBy;
}
