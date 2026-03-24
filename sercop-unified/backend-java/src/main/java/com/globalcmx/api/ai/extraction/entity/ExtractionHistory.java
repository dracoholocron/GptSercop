package com.globalcmx.api.ai.extraction.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entidad para historial de extracciones con IA
 */
@Entity
@Table(name = "ai_extraction_history_readmodel")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExtractionHistory {

    @Id
    @Column(length = 36)
    private String id;

    /**
     * Nombre del archivo procesado
     */
    @Column(name = "file_name", nullable = false)
    private String fileName;

    /**
     * Tipo MIME del archivo
     */
    @Column(name = "file_type")
    private String fileType;

    /**
     * Tamaño del archivo en bytes
     */
    @Column(name = "file_size")
    private Long fileSize;

    /**
     * Tipo de mensaje SWIFT (MT700, MT760, etc.)
     */
    @Column(name = "message_type", length = 10)
    private String messageType;

    /**
     * Proveedor de IA usado
     */
    @Column(name = "provider", nullable = false, length = 20)
    private String provider;

    /**
     * Modelo específico usado
     */
    @Column(name = "model", length = 50)
    private String model;

    /**
     * Número de campos extraídos
     */
    @Column(name = "fields_extracted")
    private Integer fieldsExtracted;

    /**
     * Número de campos aprobados por el usuario
     */
    @Column(name = "fields_approved")
    private Integer fieldsApproved;

    /**
     * Número de campos rechazados
     */
    @Column(name = "fields_rejected")
    private Integer fieldsRejected;

    /**
     * Número de campos editados
     */
    @Column(name = "fields_edited")
    private Integer fieldsEdited;

    /**
     * Tiempo de procesamiento en milisegundos
     */
    @Column(name = "processing_time_ms")
    private Long processingTimeMs;

    /**
     * Tokens de entrada consumidos
     */
    @Column(name = "input_tokens")
    private Integer inputTokens;

    /**
     * Tokens de salida generados
     */
    @Column(name = "output_tokens")
    private Integer outputTokens;

    /**
     * Costo estimado en USD
     */
    @Column(name = "estimated_cost", precision = 10, scale = 6)
    private BigDecimal estimatedCost;

    /**
     * Estado de la extracción
     */
    @Column(name = "status", length = 20)
    @Builder.Default
    private String status = "PENDING_REVIEW";

    /**
     * Respuesta JSON completa del modelo (para auditoría)
     */
    @Column(name = "raw_response", columnDefinition = "TEXT")
    private String rawResponse;

    /**
     * Errores ocurridos
     */
    @Column(name = "errors", columnDefinition = "TEXT")
    private String errors;

    /**
     * ID del usuario que realizó la extracción
     */
    @Column(name = "created_by", length = 100)
    private String createdBy;

    /**
     * Fecha de creación
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Fecha de última actualización
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * ID de la operación asociada (si aplica)
     */
    @Column(name = "operation_id")
    private Long operationId;

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
