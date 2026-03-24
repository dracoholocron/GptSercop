package com.globalcmx.api.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * Volume by Product for stacked area chart
 * Supports dynamic product types from product_type_config
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VolumeByProductDTO {
    private String period;
    private String periodLabel;

    // Legacy fields for backwards compatibility
    private BigDecimal lcImport;
    private BigDecimal lcExport;
    private BigDecimal guarantee;
    private BigDecimal collection;
    private BigDecimal total;
    private Integer lcImportCount;
    private Integer lcExportCount;
    private Integer guaranteeCount;
    private Integer collectionCount;

    // Dynamic product volumes - key is productType (e.g., "LC_IMPORT", "GUARANTEE_ISSUED")
    @Builder.Default
    private Map<String, BigDecimal> productVolumes = new HashMap<>();

    // Dynamic product counts - key is productType
    @Builder.Default
    private Map<String, Integer> productCounts = new HashMap<>();
}
