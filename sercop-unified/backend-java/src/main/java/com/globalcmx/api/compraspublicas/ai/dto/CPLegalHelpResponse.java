package com.globalcmx.api.compraspublicas.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Respuesta del asistente legal de compras públicas.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CPLegalHelpResponse {

    private String title;
    private String content;
    private List<LegalReference> legalReferences;
    private List<String> requirements;
    private List<String> commonErrors;
    private List<String> tips;
    private List<String> examples;
    private List<String> sercopResolutions;
    private String severity; // INFO, WARNING, REQUIRED

    // Metadata del análisis
    private String provider;
    private String model;
    private Long processingTimeMs;
    private Double confidence;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LegalReference {
        private String law;      // LOSNCP, RGLOSNCP, SERCOP
        private String article;  // Art. 44
        private String summary;  // Resumen del artículo
    }
}
