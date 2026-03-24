package com.globalcmx.api.clientportal.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Entity for client event requests (post-issuance events).
 * Stores requests for amendments, renewals, cancellations, payments, etc.
 */
@Entity
@Table(name = "client_event_request")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientEventRequest {

    @Id
    @Column(name = "request_id", length = 36)
    private String requestId;

    @Column(name = "operation_id", nullable = false, length = 36)
    private String operationId;

    @Column(name = "operation_reference", length = 50)
    private String operationReference;

    @Column(name = "event_code", nullable = false, length = 50)
    private String eventCode;

    @Column(name = "event_category", length = 50)
    private String eventCategory;

    @Column(name = "client_id", nullable = false)
    private Long clientId;

    @Column(name = "client_name", length = 200)
    private String clientName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private RequestStatus status;

    @Column(name = "justification", columnDefinition = "TEXT")
    private String justification;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "requested_changes", columnDefinition = "JSON")
    private Map<String, Object> requestedChanges;

    // Amendment fields
    @Column(name = "current_amount", precision = 18, scale = 2)
    private BigDecimal currentAmount;

    @Column(name = "new_amount", precision = 18, scale = 2)
    private BigDecimal newAmount;

    @Column(name = "current_expiry_date")
    private LocalDate currentExpiryDate;

    @Column(name = "new_expiry_date")
    private LocalDate newExpiryDate;

    // Cancellation fields
    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    // Payment fields
    @Column(name = "payment_amount", precision = 18, scale = 2)
    private BigDecimal paymentAmount;

    @Column(name = "debit_account_number", length = 50)
    private String debitAccountNumber;

    // Approval workflow
    @Column(name = "requires_approval")
    private Boolean requiresApproval;

    @Column(name = "approval_levels")
    private Integer approvalLevels;

    @Column(name = "current_approval_level")
    private Integer currentApprovalLevel;

    // Audit fields
    @Column(name = "requested_by", length = 100)
    private String requestedBy;

    @Column(name = "requested_by_name", length = 200)
    private String requestedByName;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Column(name = "processed_by", length = 100)
    private String processedBy;

    @Column(name = "processed_by_name", length = 200)
    private String processedByName;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (requestId == null) {
            requestId = UUID.randomUUID().toString();
        }
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (requestedAt == null) {
            requestedAt = LocalDateTime.now();
        }
        if (status == null) {
            status = RequestStatus.PENDING;
        }
        if (currentApprovalLevel == null) {
            currentApprovalLevel = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Status of the event request
     */
    public enum RequestStatus {
        PENDING,           // Waiting for approval
        APPROVED,          // Approved, ready for processing
        REJECTED,          // Rejected by approver
        PROCESSING,        // Being processed
        COMPLETED,         // Successfully completed
        FAILED,            // Processing failed
        CANCELLED          // Cancelled by requester
    }
}
