package com.globalcmx.api.clientportal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * DTO for client event requests (post-issuance events).
 * Used for amendments, renewals, cancellations, payments, etc.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientEventRequestDTO {

    // Request identification
    private String requestId;
    private String operationId;
    private String operationReference;
    private String eventCode;

    // Request status
    private String status;
    private String statusLabel;

    // Request details
    private String justification;
    private Map<String, Object> requestedChanges;

    // Amendment specific
    private BigDecimal newAmount;
    private LocalDate newExpiryDate;

    // Cancellation specific
    private String cancellationReason;

    // Payment specific
    private BigDecimal paymentAmount;
    private String debitAccountNumber;

    // Document attachments
    private List<String> attachmentIds;

    // Audit fields
    private String requestedBy;
    private String requestedByName;
    private LocalDateTime requestedAt;
    private String processedBy;
    private String processedByName;
    private LocalDateTime processedAt;
    private String rejectionReason;

    // Event configuration info (for display)
    private String eventName;
    private String eventDescription;
    private String eventIcon;
    private String eventColor;
    private boolean requiresApproval;
    private int approvalLevels;
    private int currentApprovalLevel;

    /**
     * DTO for creating a new event request
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private String operationId;
        private String eventCode;
        private String justification;
        private Map<String, Object> requestedChanges;
        private BigDecimal newAmount;
        private LocalDate newExpiryDate;
        private String cancellationReason;
        private BigDecimal paymentAmount;
        private String debitAccountNumber;
        private List<String> attachmentIds;
    }

    /**
     * DTO for the response after creating a request
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateResponse {
        private String requestId;
        private String operationId;
        private String eventCode;
        private String status;
        private LocalDateTime createdAt;
        private String message;
    }
}
