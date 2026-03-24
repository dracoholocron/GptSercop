package com.globalcmx.api.compraspublicas.ai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Historial de análisis de IA para Compras Públicas.
 */
@Entity
@Table(name = "cp_ai_analysis_history", indexes = {
    @Index(name = "idx_analysis_type", columnList = "analysis_type"),
    @Index(name = "idx_process", columnList = "process_id"),
    @Index(name = "idx_entity", columnList = "entity_ruc"),
    @Index(name = "idx_created_at", columnList = "created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CPAIAnalysisHistory {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "analysis_type", nullable = false, length = 50)
    private String analysisType; // PRICE, RISK, LEGAL, EXTRACTION, GENERATION

    @Column(name = "prompt_key", nullable = false, length = 100)
    private String promptKey;

    @Column(name = "process_id", length = 36)
    private String processId;

    @Column(name = "process_code", length = 50)
    private String processCode;

    @Column(name = "entity_ruc", length = 13)
    private String entityRuc;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "input_data", columnDefinition = "JSON", nullable = false)
    private String inputData;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "output_data", columnDefinition = "JSON")
    private String outputData;

    @Column(name = "provider", nullable = false, length = 20)
    private String provider;

    @Column(name = "model", length = 50)
    private String model;

    @Column(name = "input_tokens")
    private Integer inputTokens;

    @Column(name = "output_tokens")
    private Integer outputTokens;

    @Column(name = "processing_time_ms")
    private Long processingTimeMs;

    @Column(name = "estimated_cost", precision = 10, scale = 6)
    private BigDecimal estimatedCost;

    @Column(name = "status", length = 20)
    @Builder.Default
    private String status = "COMPLETED";

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
