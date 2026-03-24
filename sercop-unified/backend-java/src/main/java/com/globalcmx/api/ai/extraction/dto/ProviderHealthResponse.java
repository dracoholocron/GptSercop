package com.globalcmx.api.ai.extraction.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * DTO para respuesta de health check de proveedor IA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderHealthResponse {

    /**
     * Si el proveedor está disponible
     */
    private boolean available;

    /**
     * Nombre del proveedor
     */
    private String provider;

    /**
     * Modelos disponibles
     */
    private List<String> availableModels;

    /**
     * Modelo por defecto
     */
    private String defaultModel;

    /**
     * Capacidades del proveedor
     */
    private ProviderCapabilities capabilities;

    /**
     * Mensaje de error si no está disponible
     */
    private String errorMessage;

    /**
     * Latencia del último health check (ms)
     */
    private Long latencyMs;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProviderCapabilities {
        private boolean supportsImages;
        private boolean supportsPDF;
        private boolean supportsStreaming;
        private Long maxImageSizeBytes;
        private Integer maxPDFPages;
        private Integer maxTokens;
    }
}
