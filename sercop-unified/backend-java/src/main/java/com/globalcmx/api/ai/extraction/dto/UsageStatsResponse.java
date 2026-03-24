package com.globalcmx.api.ai.extraction.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO para estadísticas de uso del servicio de extracción IA
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsageStatsResponse {

    /**
     * Estadísticas del período actual (mes)
     */
    private PeriodStats currentMonth;

    /**
     * Estadísticas del período anterior (mes pasado)
     */
    private PeriodStats previousMonth;

    /**
     * Historial de extracciones recientes
     */
    private List<ExtractionSummary> recentExtractions;

    /**
     * Límites del plan del usuario
     */
    private UsageLimits limits;

    /**
     * Porcentaje de uso del límite mensual
     */
    private Double usagePercentage;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PeriodStats {
        private LocalDateTime periodStart;
        private LocalDateTime periodEnd;
        private Long totalExtractions;
        private Long totalFiles;
        private Long totalBytes;
        private Long totalInputTokens;
        private Long totalOutputTokens;
        private Long totalFieldsExtracted;
        private Double avgProcessingTimeMs;
        private BigDecimal totalCostUsd;

        /**
         * Desglose por proveedor
         */
        private List<ProviderBreakdown> byProvider;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProviderBreakdown {
        private String provider;
        private Long count;
        private BigDecimal cost;
        private Long tokens;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExtractionSummary {
        private String id;
        private String fileName;
        private String messageType;
        private String provider;
        private Integer fieldsExtracted;
        private Long processingTimeMs;
        private BigDecimal estimatedCost;
        private String status;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UsageLimits {
        /**
         * Máximo de extracciones por mes
         */
        private Long maxExtractionsPerMonth;

        /**
         * Máximo de archivos por extracción
         */
        private Integer maxFilesPerExtraction;

        /**
         * Tamaño máximo de archivo en bytes
         */
        private Long maxFileSizeBytes;

        /**
         * Presupuesto mensual en USD (si aplica)
         */
        private BigDecimal monthlyBudgetUsd;

        /**
         * Proveedores disponibles
         */
        private List<String> availableProviders;
    }
}
