package com.globalcmx.api.dto.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Command for executing an event on an operation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecuteEventCommand {

    private String operationId;
    private String eventCode;
    private String executedBy;
    private Map<String, Object> eventData;
    private String swiftMessage;
    private String comments;

    /**
     * When true, skip SWIFT message generation in executeEvent().
     * Used when the event comes from the approval flow, because
     * post-approval rules will handle SWIFT message generation.
     */
    @Builder.Default
    private boolean skipSwiftGeneration = false;
}
