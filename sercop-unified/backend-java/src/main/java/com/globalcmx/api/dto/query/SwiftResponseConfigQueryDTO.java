package com.globalcmx.api.dto.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for SWIFT response configuration queries (CQRS read side).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SwiftResponseConfigQueryDTO {

    private Long id;
    private String sentMessageType;
    private String operationType;
    private String expectedResponseType;
    private String responseEventCode;
    private Integer expectedResponseDays;
    private Integer alertAfterDays;
    private Integer escalateAfterDays;
    private String language;
    private String responseDescription;
    private String timeoutMessage;
    private Boolean isActive;
}
