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
public class CatalogoPersonalizadoQueryDTO {
    private Long id;
    private String codigo;
    private String nombre;
    private String descripcion;
    private Integer nivel;
    private Long catalogoPadreId;
    private String codigoCatalogoPadre;
    private String nombreCatalogoPadre;
    private Boolean activo;
    private Boolean isSystem;
    private Integer orden;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}
