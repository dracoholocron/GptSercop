package com.globalcmx.api.ai.extraction.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO para respuesta de extracción con IA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExtractionResponse {

    /**
     * ID único de la extracción
     */
    private String id;

    /**
     * Contenido extraído (JSON del modelo IA)
     */
    private String content;

    /**
     * Tipo de mensaje detectado
     */
    private String messageType;

    /**
     * Proveedor usado
     */
    private String provider;

    /**
     * Modelo usado
     */
    private String model;

    /**
     * Tiempo de procesamiento en milisegundos
     */
    private Long processingTimeMs;

    /**
     * Tokens de entrada usados
     */
    private Integer inputTokens;

    /**
     * Tokens de salida usados
     */
    private Integer outputTokens;

    /**
     * Costo estimado (USD)
     */
    private BigDecimal estimatedCost;

    /**
     * Timestamp de creación
     */
    private LocalDateTime createdAt;

    /**
     * Errores durante la extracción
     */
    private List<String> errors;

    /**
     * Advertencias
     */
    private List<String> warnings;
}
