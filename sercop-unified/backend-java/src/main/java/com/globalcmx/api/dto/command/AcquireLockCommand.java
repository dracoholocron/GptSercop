package com.globalcmx.api.dto.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Command for acquiring a lock on an operation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AcquireLockCommand {

    private String operationId;
    private String username;
    private String userFullName;
    private Integer durationSeconds;
    private String operationReference;
    private String productType;
}
