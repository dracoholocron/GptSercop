package com.globalcmx.api.dto.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Command for extending a lock on an operation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExtendLockCommand {

    private String operationId;
    private String username;
    private Integer additionalSeconds;
}
