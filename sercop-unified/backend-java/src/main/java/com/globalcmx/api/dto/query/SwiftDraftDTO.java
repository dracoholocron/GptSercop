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
 * DTO for SWIFT draft queries.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SwiftDraftDTO {

    private Long id;
    private String draftId;
    private String messageType;
    private String productType;
    private String reference;
    private String status;

    /**
     * Creation mode of the draft (EXPERT, CLIENT, WIZARD)
     * Allows reopening the draft in its original mode
     */
    private String mode;

    /**
     * The complete SWIFT message in text format.
     */
    private String swiftMessage;

    // Metadata
    private String currency;
    private BigDecimal amount;
    private LocalDate issueDate;
    private LocalDate expiryDate;
    private Long applicantId;
    private Long beneficiaryId;
    private Long issuingBankId;
    private String issuingBankBic;
    private Long advisingBankId;
    private String advisingBankBic;

    /**
     * Custom fields data in JSON format.
     * Stores repeatable section data and additional custom fields.
     */
    private String customData;

    private String rejectionReason;
    private Map<String, Object> fieldComments;

    // Audit
    private String createdBy;
    private LocalDateTime creationDate;
    private String modifiedBy;
    private LocalDateTime modificationDate;
    private Long version;
}
