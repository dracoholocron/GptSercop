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
public class CatalogoPersonalizado {
    private Long id;
    private String codigo;
    private String nombre;
    private String descripcion;
    private Integer nivel; // 1 = Catálogo (padre), 2 = Registro (hijo)
    private Long catalogoPadreId; // null para nivel 1, ID del catálogo padre para nivel 2
    private String codigoCatalogoPadre; // Código del catálogo padre (para nivel 2)
    private String nombreCatalogoPadre; // Nombre del catálogo padre (para nivel 2)
    private Boolean activo;
    private Integer orden; // Para ordenar los registros
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}
