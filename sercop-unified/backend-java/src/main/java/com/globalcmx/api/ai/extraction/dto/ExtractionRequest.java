package com.globalcmx.api.ai.extraction.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;

/**
 * DTO para solicitar extracción de documento con IA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExtractionRequest {

    /**
     * Proveedor de IA a usar (claude, openai, local)
     */
    @NotBlank(message = "El proveedor es obligatorio")
    private String provider;

    /**
     * Modelo específico a usar
     */
    private String model;

    /**
     * Información del archivo
     */
    @NotNull(message = "El archivo es obligatorio")
    private FileInfo file;

    /**
     * Prompt para la extracción
     */
    @NotBlank(message = "El prompt es obligatorio")
    private String prompt;

    /**
     * Tipo de mensaje esperado (MT700, MT760, etc.)
     */
    private String messageType;

    /**
     * Idioma del documento
     */
    @Builder.Default
    private String language = "es";

    /**
     * Contexto adicional para mejorar extracción
     */
    private ExtractionContext context;

    /**
     * Campos específicos a extraer (opcional)
     */
    private List<String> targetFields;

    /**
     * Información del archivo
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FileInfo {
        /**
         * Contenido del archivo (base64 o URL)
         */
        @NotBlank(message = "El contenido del archivo es obligatorio")
        private String content;

        /**
         * Tipo de contenido (base64 o url)
         */
        @NotBlank(message = "El tipo de contenido es obligatorio")
        private String type;

        /**
         * Tipo MIME del archivo
         */
        @NotBlank(message = "El tipo MIME es obligatorio")
        private String mimeType;

        /**
         * Nombre del archivo
         */
        @NotBlank(message = "El nombre del archivo es obligatorio")
        private String fileName;
    }

    /**
     * Contexto adicional para la extracción
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExtractionContext {
        private String applicantCountry;
        private String beneficiaryCountry;
        private String currency;
        private Map<String, Object> additionalData;
    }
}
