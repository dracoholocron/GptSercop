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
public class PlantillaQueryDTO {
    private Long id;
    private String codigo;
    private String nombre;
    private String descripcion;
    private String tipoDocumento;
    private String nombreArchivo;
    private String rutaArchivo;
    private Long tamanioArchivo;
    private Boolean activo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}
