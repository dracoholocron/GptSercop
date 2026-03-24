package com.globalcmx.api.externalapi.dto;

import com.globalcmx.api.externalapi.entity.ExternalApiConfigReadModel;
import com.globalcmx.api.readmodel.entity.OperationReadModel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

/**
 * Context for an external API call.
 * Contains all information needed to execute and process the API call.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExternalApiCallContext {

    /**
     * Unique identifier for this API call
     */
    private String callId;

    /**
     * The API configuration
     */
    private ExternalApiConfigReadModel apiConfig;

    /**
     * The associated operation (if any)
     */
    private OperationReadModel operation;

    /**
     * User executing the API call
     */
    private String executingUser;

    /**
     * Email of the executing user
     */
    private String executingUserEmail;

    /**
     * Full name of the executing user
     */
    private String executingUserFullName;

    /**
     * What triggered this API call (RULE, SCHEDULED_JOB, MANUAL, SYSTEM)
     */
    private String triggerSource;

    /**
     * Code of the trigger (rule code, job code, etc.)
     */
    private String triggerCode;

    /**
     * Additional context variables for variable resolution
     */
    @Builder.Default
    private Map<String, Object> additionalContext = new HashMap<>();

    /**
     * Correlation ID for tracing
     */
    private String correlationId;

    /**
     * Event type that triggered this call
     */
    private String eventType;

    /**
     * Add additional context variable
     */
    public void addContextVariable(String key, Object value) {
        if (additionalContext == null) {
            additionalContext = new HashMap<>();
        }
        additionalContext.put(key, value);
    }

    /**
     * Get context variable
     */
    public Object getContextVariable(String key) {
        return additionalContext != null ? additionalContext.get(key) : null;
    }
}
