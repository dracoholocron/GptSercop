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
public class PlantillaCorreoQueryDTO {
    private Long id;
    private String codigo;
    private String nombre;
    private String descripcion;
    private String asunto;
    private String cuerpoHtml;
    private String plantillasAdjuntas;
    private Boolean activo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}
