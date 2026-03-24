package com.globalcmx.api.dto.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * DTO for operation event log queries (CQRS read side).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperationEventLogQueryDTO {

    private Long id;
    private String eventId;
    private String operationId;
    private String operationType;
    private String eventCode;
    private Integer eventSequence;

    // SWIFT message link
    private String swiftMessageId;
    private String swiftMessageType;
    private String messageDirection;

    // State transition
    private String previousStage;
    private String newStage;
    private String previousStatus;
    private String newStatus;

    // Event data
    private Map<String, Object> eventData;

    // User comments
    private String comments;

    // Operation snapshot - key operation fields at event time (JSON)
    private Map<String, Object> operationSnapshot;

    // Operation snapshot - individual columns
    private String reference;
    private String swiftMessage;
    private String currency;
    private BigDecimal amount;
    private LocalDate issueDate;
    private LocalDate expiryDate;
    private Integer applicantId;
    private String applicantName;
    private Integer beneficiaryId;
    private String beneficiaryName;
    private Integer issuingBankId;
    private String issuingBankBic;
    private Integer advisingBankId;
    private String advisingBankBic;
    private Integer amendmentCount;

    // Audit
    private String executedBy;
    private LocalDateTime executedAt;

    // Enriched fields from event config (for display)
    private String eventName;
    private String eventDescription;
    private String icon;
    private String color;
}
