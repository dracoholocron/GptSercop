package com.globalcmx.api.compraspublicas.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Respuesta del análisis de riesgos de contratación pública.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CPRiskAnalysisResponse {

    private String assessmentId;
    private String processCode;
    private Integer overallRiskScore; // 0-100
    private String riskLevel; // LOW, MEDIUM, HIGH, CRITICAL

    private List<DetectedIndicator> detectedIndicators;
    private List<Pattern> patterns;
    private List<Recommendation> recommendations;
    private String summary;

    // Metadata
    private String provider;
    private String model;
    private Long processingTimeMs;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetectedIndicator {
        private String code;
        private String name;
        private Boolean detected;
        private Integer score;
        private String evidence;
        private String severity; // LOW, MEDIUM, HIGH, CRITICAL
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Pattern {
        private String type;
        private String description;
        private List<String> entities;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Recommendation {
        private String priority; // HIGH, MEDIUM, LOW
        private String action;
        private String responsible;
    }
}
