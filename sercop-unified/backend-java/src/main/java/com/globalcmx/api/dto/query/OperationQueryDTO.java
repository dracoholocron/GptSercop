package com.globalcmx.api.dto.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO for operation queries (CQRS read side).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperationQueryDTO {

    private Long id;
    private String operationId;
    private String originalDraftId;
    private String productType;
    private String messageType;
    private String reference;
    private String stage;
    private String status;
    private String creationMode;
    private String swiftMessage;

    // Metadata
    private String currency;
    private BigDecimal amount;
    private LocalDate issueDate;
    private LocalDate expiryDate;

    // Parties
    private Long applicantId;
    private String applicantName;
    private Long beneficiaryId;
    private String beneficiaryName;
    private Long issuingBankId;
    private String issuingBankBic;
    private Long advisingBankId;
    private String advisingBankBic;

    // Counters
    private Integer amendmentCount;
    private Integer messageCount;

    // Alert info
    private Boolean hasAlerts;
    private Integer alertCount;

    // Response tracking
    private Boolean awaitingResponse;
    private String awaitingMessageType;
    private LocalDate responseDueDate;

    // Source client request (for operations created from client portal)
    private String sourceClientRequestId;

    // Audit
    private String createdBy;
    private LocalDateTime createdAt;
    private String approvedBy;
    private LocalDateTime approvedAt;
    private String modifiedBy;
    private LocalDateTime modifiedAt;
    private Integer version;
}
