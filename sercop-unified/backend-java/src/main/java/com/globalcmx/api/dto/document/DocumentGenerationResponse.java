package com.globalcmx.api.dto.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO para respuesta de generación de documentos
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentGenerationResponse {

    /**
     * Indica si la generación fue exitosa
     */
    private boolean success;

    /**
     * Mensaje de respuesta
     */
    private String message;

    /**
     * Nombre del archivo generado
     */
    private String fileName;

    /**
     * Ruta relativa del archivo generado
     */
    private String filePath;

    /**
     * URL de descarga del documento
     */
    private String downloadUrl;

    /**
     * Tamaño del archivo en bytes
     */
    private Long fileSizeBytes;

    /**
     * Formato de salida del documento
     */
    private OutputFormat outputFormat;

    /**
     * Fecha y hora de generación
     */
    private LocalDateTime generatedAt;

    /**
     * Tiempo de procesamiento en milisegundos
     */
    private Long processingTimeMs;

    /**
     * Plantilla utilizada
     */
    private String templateUsed;
}
