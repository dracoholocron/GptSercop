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
public class Plantilla {
    private Long id;
    private String codigo;
    private String nombre;
    private String descripcion;
    private String tipoDocumento; // ODT, DOCX, PDF, etc.
    private String nombreArchivo;
    private String rutaArchivo; // Ruta donde se almacena el archivo
    private Long tamanioArchivo; // Tamaño en bytes
    private Boolean activo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}
