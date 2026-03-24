package com.globalcmx.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Result of testing accounting rules
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountingRuleTestResult {

    private boolean success;
    private String message;
    private List<AccountingEntry> entries;
    private List<String> rulesFired;
    private int totalRulesFired;
    private List<LedgerLine> ledgerTable;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AccountingEntry {
        private String ruleName;
        private String product;
        private String event;
        private String debitAccount;
        private String creditAccount;
        private BigDecimal amount;
        private String amountType;
        private String lineNumber;
        private String movementType;
        private String fixedAmount;
        private Boolean taxable;
        private String rate;
        private BigDecimal calculatedAmount;
    }

    /**
     * Represents a line in the accounting ledger table
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LedgerLine {
        private String accountNumber;
        private String accountDescription;
        private BigDecimal debitAmount;
        private BigDecimal creditAmount;
    }
}
