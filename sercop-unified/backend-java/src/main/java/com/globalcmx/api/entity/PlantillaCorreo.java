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
public class PlantillaCorreo {
    private Long id;
    private String codigo;
    private String nombre;
    private String descripcion;

    // Campos específicos de email
    private String asunto; // Asunto del correo con variables (ej: "Carta de Crédito ${numeroOperacion}")
    private String cuerpoHtml; // Cuerpo HTML del correo con variables Thymeleaf
    private String plantillasAdjuntas; // JSON array de IDs de plantillas de documentos adjuntos

    private Boolean activo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}
