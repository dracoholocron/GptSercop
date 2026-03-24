package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Read model for operation event history.
 * Tracks all events that occur on operations for audit and display.
 */
@Entity
@Table(name = "operation_event_log_readmodel")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperationEventLogReadModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", length = 50, unique = true, nullable = false)
    private String eventId;

    @Column(name = "operation_id", length = 50, nullable = false)
    private String operationId;

    @Column(name = "operation_type", length = 50, nullable = false)
    private String operationType;

    @Column(name = "event_code", length = 50, nullable = false)
    private String eventCode;

    @Column(name = "event_sequence", nullable = false)
    private Integer eventSequence;

    // SWIFT message link
    @Column(name = "swift_message_id", length = 50)
    private String swiftMessageId;

    @Column(name = "swift_message_type", length = 10)
    private String swiftMessageType;

    @Column(name = "message_direction", length = 10)
    private String messageDirection;

    // State transition
    @Column(name = "previous_stage", length = 50)
    private String previousStage;

    @Column(name = "new_stage", length = 50)
    private String newStage;

    @Column(name = "previous_status", length = 50)
    private String previousStatus;

    @Column(name = "new_status", length = 50)
    private String newStatus;

    // Event data (JSON)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "event_data", columnDefinition = "JSON")
    private Map<String, Object> eventData;

    // Comments
    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    // Operation snapshot - captures key operation fields at event time (JSON)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "operation_snapshot", columnDefinition = "JSON")
    private Map<String, Object> operationSnapshot;

    // Operation snapshot - individual columns for key operation fields at event time
    @Column(name = "reference", length = 50)
    private String reference;

    @Column(name = "swift_message", columnDefinition = "TEXT")
    private String swiftMessage;

    @Column(name = "currency", length = 3)
    private String currency;

    @Column(name = "amount", precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "issue_date")
    private LocalDate issueDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "applicant_id")
    private Integer applicantId;

    @Column(name = "applicant_name", length = 255)
    private String applicantName;

    @Column(name = "beneficiary_id")
    private Integer beneficiaryId;

    @Column(name = "beneficiary_name", length = 255)
    private String beneficiaryName;

    @Column(name = "issuing_bank_id")
    private Integer issuingBankId;

    @Column(name = "issuing_bank_bic", length = 11)
    private String issuingBankBic;

    @Column(name = "advising_bank_id")
    private Integer advisingBankId;

    @Column(name = "advising_bank_bic", length = 11)
    private String advisingBankBic;

    @Column(name = "amendment_count")
    private Integer amendmentCount;

    // Audit
    @Column(name = "executed_by", length = 100)
    private String executedBy;

    @Column(name = "executed_at")
    private LocalDateTime executedAt;

    @PrePersist
    protected void onCreate() {
        if (executedAt == null) {
            executedAt = LocalDateTime.now();
        }
    }
}
