package com.globalcmx.api.alerts.dto;

import com.globalcmx.api.alerts.entity.BusinessRequestReadModel;
import com.globalcmx.api.alerts.entity.BusinessRequestReadModel.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Response DTO for business request data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessRequestResponse {

    private String requestId;
    private String requestNumber;

    // Source
    private RequestSourceType sourceType;
    private String extractionId;

    // Content
    private String title;
    private String description;
    private Map<String, Object> extractedData;

    // Client
    private String clientId;
    private String clientName;

    // Operation type
    private String operationType;

    // Status
    private RequestStatus status;
    private String rejectionReason;

    // Alerts config
    private List<AlertConfig> alertsConfig;

    // Conversion
    private String convertedToDraftId;
    private String convertedToOperationId;
    private LocalDateTime convertedAt;

    // Audit
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime approvedAt;
    private String approvedBy;
    private LocalDateTime rejectedAt;
    private String rejectedBy;

    /**
     * Create response from entity
     */
    public static BusinessRequestResponse fromEntity(BusinessRequestReadModel entity) {
        return BusinessRequestResponse.builder()
            .requestId(entity.getRequestId())
            .requestNumber(entity.getRequestNumber())
            .sourceType(entity.getSourceType())
            .extractionId(entity.getExtractionId())
            .title(entity.getTitle())
            .description(entity.getDescription())
            .extractedData(entity.getExtractedData())
            .clientId(entity.getClientId())
            .clientName(entity.getClientName())
            .operationType(entity.getOperationType())
            .status(entity.getStatus())
            .rejectionReason(entity.getRejectionReason())
            .alertsConfig(entity.getAlertsConfig())
            .convertedToDraftId(entity.getConvertedToDraftId())
            .convertedToOperationId(entity.getConvertedToOperationId())
            .convertedAt(entity.getConvertedAt())
            .createdAt(entity.getCreatedAt())
            .createdBy(entity.getCreatedBy())
            .approvedAt(entity.getApprovedAt())
            .approvedBy(entity.getApprovedBy())
            .rejectedAt(entity.getRejectedAt())
            .rejectedBy(entity.getRejectedBy())
            .build();
    }
}
