package com.globalcmx.api.dto.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Command for force-releasing a lock by an admin.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForceReleaseLockCommand {

    private String operationId;
    private String adminUsername;
    private String reason;
}
