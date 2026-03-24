package com.globalcmx.api.domain.contabilidad;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Domain model for accounting configuration
 * Used by Drools rules to determine accounting entries
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountingConfiguration {

    // Input fields (conditions)
    private String product;           // e.g., "MT700", "MT710"
    private String event;             // e.g., "EMISSION_LC_IMPORT", "AMENDMENT"
    private BigDecimal amount;        // Transaction amount

    // Output fields (actions - set by rules)
    private String cuentaDebito;      // Debit account
    private String cuentaCredito;     // Credit account
    private Boolean active;           // Whether rule is active
    private String lineNumber;        // For composite entries
    private String amountType;        // e.g., "PRINCIPAL", "COMMISSION", "VAT"
    private String movementType;      // Type of movement
    private String fixedAmount;       // Fixed amount if applicable
    private String rate;              // Rate for calculations (e.g., VAT rate)
    private Boolean taxable;          // Whether amount is taxable

    // Calculated fields
    private BigDecimal calculatedAmount;  // Amount after applying rate/formula
    private String ruleName;          // Name of the rule that fired

    public void setDebitAccount(String account) {
        this.cuentaDebito = account;
    }

    public void setCreditAccount(String account) {
        this.cuentaCredito = account;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
