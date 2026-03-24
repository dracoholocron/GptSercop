package com.globalcmx.api.dto.event;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CatalogoPersonalizadoEvent {
    private Long catalogoPersonalizadoId;
    private String codigo;
    private String nombre;
    private String descripcion;
    private Integer nivel;
    private Long catalogoPadreId;
    private String codigoCatalogoPadre;
    private String nombreCatalogoPadre;
    private Boolean activo;
    private Integer orden;
    private EventType eventType;
    private String performedBy;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;

    public enum EventType {
        CREATED,
        UPDATED,
        DELETED
    }
}
