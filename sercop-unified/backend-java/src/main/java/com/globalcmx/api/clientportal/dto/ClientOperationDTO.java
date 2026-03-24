package com.globalcmx.api.clientportal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO for client portal operations view.
 * Contains a subset of operation data relevant to clients.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientOperationDTO {

    private String operationId;
    private String reference;
    private String productType;
    private String stage;
    private String status;
    private String currency;
    private BigDecimal amount;
    private LocalDate issueDate;
    private LocalDate expiryDate;
    private String beneficiaryName;
    private String issuingBankBic;
    private String advisingBankBic;
    private LocalDateTime createdAt;

    // Applicant info (for corporation users viewing multiple companies)
    private Long applicantId;
    private String applicantName;

    // Computed/display fields
    private String productTypeLabel;
    private String stageLabel;
    private String statusLabel;
}
