package com.globalcmx.api.dto.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Command to submit an event for approval (CQRS Write side).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitEventForApprovalCommand {

    /**
     * Operation ID (for OPERATION_EVENT)
     */
    private String operationId;

    /**
     * Draft ID (for NEW_OPERATION)
     */
    private String draftId;

    /**
     * Event code being requested
     */
    private String eventCode;

    /**
     * Event data (form data)
     */
    private Map<String, Object> eventData;

    /**
     * Comments from the submitter
     */
    private String comments;

    /**
     * User submitting the event
     */
    private String submittedBy;

    /**
     * Priority (1=low, 2=medium, 3=high)
     */
    @Builder.Default
    private Integer priority = 2;

    /**
     * Additional context for risk evaluation (IP, user agent, etc.)
     */
    private Map<String, Object> additionalContext;
}
