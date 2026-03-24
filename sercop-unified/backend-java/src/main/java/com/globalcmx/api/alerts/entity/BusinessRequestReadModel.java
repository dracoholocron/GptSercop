package com.globalcmx.api.alerts.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Read model for business requests from AI extraction and other sources.
 * These requests can be approved to create operations/drafts and associated alerts.
 */
@Entity
@Table(name = "business_request_readmodel",
    indexes = {
        @Index(name = "idx_business_request_status", columnList = "status"),
        @Index(name = "idx_business_request_created", columnList = "created_by, status"),
        @Index(name = "idx_business_request_client", columnList = "client_id"),
        @Index(name = "idx_business_request_extraction", columnList = "extraction_id")
    })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessRequestReadModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_id", length = 36, unique = true, nullable = false)
    private String requestId;

    @Column(name = "request_number", length = 50, unique = true, nullable = false)
    private String requestNumber;

    // Source
    @Column(name = "source_type", length = 50, nullable = false)
    @Enumerated(EnumType.STRING)
    private RequestSourceType sourceType;

    @Column(name = "extraction_id", length = 36)
    private String extractionId;

    // Content
    @Column(name = "title", length = 300, nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    // Extracted data from AI (JSON structure)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "extracted_data", columnDefinition = "JSON")
    private Map<String, Object> extractedData;

    // Client info
    @Column(name = "client_id", length = 100)
    private String clientId;

    @Column(name = "client_name", length = 200)
    private String clientName;

    // Operation type to create
    @Column(name = "operation_type", length = 50)
    private String operationType;

    // Status
    @Column(name = "status", length = 30, nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private RequestStatus status = RequestStatus.PENDING;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    // Alerts configuration (JSON array of alerts to create on approval)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "alerts_config", columnDefinition = "JSON")
    private List<AlertConfig> alertsConfig;

    // Conversion tracking
    @Column(name = "converted_to_draft_id", length = 100)
    private String convertedToDraftId;

    @Column(name = "converted_to_operation_id", length = 100)
    private String convertedToOperationId;

    @Column(name = "converted_at")
    private LocalDateTime convertedAt;

    // Audit
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "approved_by", length = 100)
    private String approvedBy;

    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;

    @Column(name = "rejected_by", length = 100)
    private String rejectedBy;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Request source types
     */
    public enum RequestSourceType {
        AI_EXTRACTION,
        MANUAL,
        CLIENT_PORTAL,
        EMAIL_PARSER
    }

    /**
     * Request status
     */
    public enum RequestStatus {
        PENDING,
        APPROVED,
        REJECTED,
        CONVERTED,
        CANCELLED
    }

    /**
     * Alert configuration to create on approval
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AlertConfig {
        private String alertType;
        private String title;
        private String description;
        private String priority;
        private String assignToUserId;
        private Integer daysFromNow;
        private String scheduledTime;
    }
}
