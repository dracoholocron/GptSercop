package com.globalcmx.api.dto.command;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Command for creating a new SWIFT draft.
 *
 * This is a generic command that works for all product types:
 * - LC Import (MT700)
 * - LC Export (MT710, MT720)
 * - Guarantees (MT760)
 * - Free messages (MT799)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSwiftDraftCommand {

    /**
     * SWIFT message type (MT700, MT710, MT720, MT760, MT799, etc.)
     */
    @NotBlank(message = "El tipo de mensaje SWIFT es obligatorio")
    private String messageType;

    /**
     * Product type (LC_IMPORT, LC_EXPORT, GUARANTEE, STANDBY_LC, FREE_MESSAGE, etc.)
     */
    @NotBlank(message = "El tipo de producto es obligatorio")
    private String productType;

    /**
     * Creation mode of the draft (EXPERT, CLIENT, WIZARD)
     * Allows reopening the draft in its original mode
     */
    private String mode;

    /**
     * The complete SWIFT message in text format.
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
     * User creating the draft
     */
    private String createdBy;
}
