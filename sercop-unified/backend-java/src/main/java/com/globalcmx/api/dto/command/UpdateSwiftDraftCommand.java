package com.globalcmx.api.dto.command;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Command for updating an existing SWIFT draft.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSwiftDraftCommand {

    /**
     * The updated SWIFT message in text format.
     * This is the source of truth.
     */
    @NotBlank(message = "El mensaje SWIFT no puede estar vacío. Complete los campos obligatorios del formulario")
    private String swiftMessage;

    // ========================================
    // OPTIONAL METADATA (extracted from message for easier queries)
    // ========================================

    /**
     * Reference from :20: field
     */
    private String reference;

    /**
     * Currency from :32B: field
     */
    private String currency;

    /**
     * Amount from :32B: field
     */
    private BigDecimal amount;

    /**
     * Issue date from :31C: field
     */
    private LocalDate issueDate;

    /**
     * Expiry date from :31D: field
     */
    private LocalDate expiryDate;

    /**
     * Applicant ID (participant from :50: field)
     */
    private Long applicantId;

    /**
     * Beneficiary ID (participant from :59: field)
     */
    private Long beneficiaryId;

    /**
     * Issuing bank ID (from :52A: field)
     */
    private Long issuingBankId;

    /**
     * Issuing bank BIC (from :52A: field or looked up from institution catalog)
     */
    private String issuingBankBic;

    /**
     * Advising bank ID (from :57A: field)
     */
    private Long advisingBankId;

    /**
     * Advising bank BIC (from :57A: field or looked up from institution catalog)
     */
    private String advisingBankBic;

    /**
     * Custom fields data in JSON format.
     * Stores repeatable section data and additional custom fields.
     */
    private String customData;

    /**
     * User modifying the draft
     */
    private String modifiedBy;
}
