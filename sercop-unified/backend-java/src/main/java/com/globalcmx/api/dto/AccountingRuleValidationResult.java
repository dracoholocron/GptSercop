package com.globalcmx.api.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Result of accounting rules validation
 */
@Data
@Builder
public class AccountingRuleValidationResult {
    private boolean valid;
    private int totalRules;
    private int activeRules;
    private int inactiveRules;
    private int compositeEntries;
    private List<String> errors;
    private List<String> warnings;
    private List<RuleSummary> rules;
    private String drlContent;
    private long fileSizeBytes;
    private String fileName;

    @Data
    @Builder
    public static class RuleSummary {
        private String ruleName;
        private String product;
        private String event;
        private String lineNumber;
        private String amountType;
        private String movementType;
        private String debitAccount;
        private String creditAccount;
        private Boolean active;
        private String fixedAmount;
        private String rate;
        private Boolean taxable;
    }
}
