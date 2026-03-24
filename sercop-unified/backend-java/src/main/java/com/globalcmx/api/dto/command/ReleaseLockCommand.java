package com.globalcmx.api.dto.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Command for releasing a lock on an operation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReleaseLockCommand {

    private String operationId;
    private String username;
}
