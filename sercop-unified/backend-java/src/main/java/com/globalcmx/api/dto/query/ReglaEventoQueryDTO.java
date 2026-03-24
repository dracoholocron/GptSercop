package com.globalcmx.api.dto.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReglaEventoQueryDTO {
    private Long id;
    private String codigo;
    private String nombre;
    private String descripcion;
    private String tipoOperacion;
    private String eventoTrigger;
    private String condicionesDRL;
    private String accionesJson;
    private Integer prioridad;
    private Boolean activo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}
