package com.globalcmx.api.compraspublicas.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Respuesta del análisis de precios de contratación pública.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CPPriceAnalysisResponse {

    private String analysisId;
    private String cpcCode;
    private BigDecimal proposedPrice;

    private HistoricalStats historicalStats;
    private Integer percentileRank;
    private BigDecimal deviationFromAverage;
    private Integer anomalyScore; // 0-100
    private String riskLevel; // LOW, MEDIUM, HIGH, CRITICAL

    private String recommendation;
    private List<String> warnings;
    private String justification;
    private PriceRange suggestedPriceRange;

    // Metadata
    private String provider;
    private String model;
    private Long processingTimeMs;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HistoricalStats {
        private BigDecimal average;
        private BigDecimal min;
        private BigDecimal max;
        private BigDecimal median;
        private Integer sampleCount;
        private BigDecimal standardDeviation;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PriceRange {
        private BigDecimal min;
        private BigDecimal max;
    }
}
