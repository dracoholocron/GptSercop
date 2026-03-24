package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Read model for active/approved operations.
 * Contains operations that have been approved and are in execution.
 */
@Entity
@Table(name = "operation_readmodel")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperationReadModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "operation_id", length = 50, unique = true, nullable = false)
    private String operationId;

    @Column(name = "original_draft_id", length = 100)
    private String originalDraftId;

    @Column(name = "product_type", length = 50, nullable = false)
    private String productType;

    @Column(name = "message_type", length = 10, nullable = false)
    private String messageType;

    @Column(name = "reference", length = 100, nullable = false)
    private String reference;

    @Column(name = "stage", length = 50, nullable = false)
    private String stage;

    @Column(name = "status", length = 30, nullable = false)
    private String status;

    @Column(name = "creation_mode", length = 20)
    private String creationMode;

    @Column(name = "swift_message", columnDefinition = "TEXT", nullable = false)
    private String swiftMessage;

    // Metadata
    @Column(name = "currency", length = 3)
    private String currency;

    @Column(name = "amount", precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "issue_date")
    private LocalDate issueDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    // Parties
    @Column(name = "applicant_id")
    private Long applicantId;

    @Column(name = "applicant_name", length = 200)
    private String applicantName;

    @Column(name = "beneficiary_id")
    private Long beneficiaryId;

    @Column(name = "beneficiary_name", length = 200)
    private String beneficiaryName;

    @Column(name = "issuing_bank_id")
    private Long issuingBankId;

    @Column(name = "issuing_bank_bic", length = 100)
    private String issuingBankBic;

    @Column(name = "advising_bank_id")
    private Long advisingBankId;

    @Column(name = "advising_bank_bic", length = 100)
    private String advisingBankBic;

    // Counters
    @Column(name = "amendment_count")
    @Builder.Default
    private Integer amendmentCount = 0;

    @Column(name = "message_count")
    @Builder.Default
    private Integer messageCount = 0;

    // Response tracking
    @Column(name = "awaiting_response")
    @Builder.Default
    private Boolean awaitingResponse = false;

    @Column(name = "awaiting_message_type", length = 10)
    private String awaitingMessageType;

    // Source client request (for operations created from client portal)
    @Column(name = "source_client_request_id", length = 36)
    private String sourceClientRequestId;

    @Column(name = "response_due_date")
    private LocalDate responseDueDate;

    // Audit
    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "approved_by", length = 100)
    private String approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "modified_by", length = 100)
    private String modifiedBy;

    @Column(name = "modified_at")
    private LocalDateTime modifiedAt;

    @Version
    @Column(name = "version")
    @Builder.Default
    private Integer version = 1;

    // Summary (JSON stored as String)
    @Column(name = "summary", columnDefinition = "JSON")
    private String summary;

    @Column(name = "has_alerts")
    @Builder.Default
    private Boolean hasAlerts = false;

    @Column(name = "alert_count")
    @Builder.Default
    private Integer alertCount = 0;

    // Pending balance calculated from SWIFT analysis (original - amendments - utilizations)
    // Fallback: enrichment service may override with GLE value if available
    @Column(name = "pending_balance", precision = 18, scale = 2)
    private BigDecimal pendingBalance;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        modifiedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        modifiedAt = LocalDateTime.now();
    }
}
