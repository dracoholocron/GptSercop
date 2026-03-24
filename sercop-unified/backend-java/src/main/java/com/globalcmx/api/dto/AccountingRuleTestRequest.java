package com.globalcmx.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request DTO for testing accounting rules
 * Note: drlContent is now read from server storage and should not be sent in the request
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountingRuleTestRequest {

    private String product;      // e.g., "MT700"
    private String event;        // e.g., "EMISSION_LC_IMPORT"
    private BigDecimal amount;   // Test amount

    // Deprecated: DRL content is now read from server storage
    @Deprecated
    private String drlContent;   // No longer used - kept for API compatibility
}
