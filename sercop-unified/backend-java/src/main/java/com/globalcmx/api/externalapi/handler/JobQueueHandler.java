package com.globalcmx.api.externalapi.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.externalapi.dto.ExternalApiCallContext;
import com.globalcmx.api.externalapi.dto.ListenerExecutionResult;
import com.globalcmx.api.scheduler.dto.query.JobExecutionResultDTO;
import com.globalcmx.api.scheduler.service.ScheduledJobExecutorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Handler for QUEUE_JOB listener action.
 * Queues a scheduled job for execution.
 *
 * Config example:
 * {
 *     "jobCode": "PROCESS_EXCHANGE_RATES",
 *     "parameters": {
 *         "currency": "#response.currencyCode",
 *         "rate": "#response.rate"
 *     },
 *     "async": true
 * }
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JobQueueHandler {

    private final ScheduledJobExecutorService jobExecutorService;
    private final ObjectMapper objectMapper;
    private final ExpressionParser spelParser = new SpelExpressionParser();

    public ListenerExecutionResult execute(
            Map<String, Object> config,
            ExternalApiCallContext context,
            Map<String, Object> responseData) {

        String jobCode = (String) config.get("jobCode");
        @SuppressWarnings("unchecked")
        Map<String, String> parameters = (Map<String, String>) config.get("parameters");
        Boolean async = (Boolean) config.getOrDefault("async", true);

        if (jobCode == null || jobCode.isBlank()) {
            return ListenerExecutionResult.failed(null, "jobCode is required");
        }

        try {
            // Resolve parameter values
            Map<String, Object> resolvedParams = new HashMap<>();
            if (parameters != null) {
                for (Map.Entry<String, String> entry : parameters.entrySet()) {
                    Object value = resolveExpression(entry.getValue(), context, responseData);
                    resolvedParams.put(entry.getKey(), value);
                }
            }

            // Add standard context
            if (context.getOperation() != null) {
                resolvedParams.put("operationId", context.getOperation().getOperationId());
            }
            resolvedParams.put("triggeredBy", "API_LISTENER");
            resolvedParams.put("apiCallId", context.getCallId());

            log.info("Triggering job {} with parameters: {}", jobCode, resolvedParams.keySet());

            // Convert parameters to JSON string
            String overrideParameters = objectMapper.writeValueAsString(resolvedParams);

            // Trigger the job
            String triggeredBy = context.getExecutingUser() != null ?
                    context.getExecutingUser() : "system";

            JobExecutionResultDTO result = jobExecutorService.triggerManually(
                    jobCode,
                    triggeredBy,
                    overrideParameters,
                    Boolean.TRUE.equals(async)
            );

            log.info("Job {} triggered successfully with execution ID: {}", jobCode, result.getExecutionId());

            return ListenerExecutionResult.success(null, Map.of(
                    "jobCode", jobCode,
                    "executionId", result.getExecutionId(),
                    "status", result.getStatus().name(),
                    "parameters", resolvedParams
            ));
        } catch (Exception e) {
            log.error("Error triggering job {}: {}", jobCode, e.getMessage());
            return ListenerExecutionResult.failed(null,
                    "Error triggering job: " + e.getMessage());
        }
    }

    private Object resolveExpression(String expression, ExternalApiCallContext context,
                                      Map<String, Object> responseData) {
        if (expression == null) return null;

        if (expression.startsWith("#")) {
            try {
                StandardEvaluationContext evalContext = new StandardEvaluationContext();
                evalContext.setVariable("response", responseData);
                evalContext.setVariable("context", context);
                evalContext.setVariable("operation", context.getOperation());

                return spelParser.parseExpression(expression).getValue(evalContext);
            } catch (Exception e) {
                log.warn("Error resolving expression '{}': {}", expression, e.getMessage());
                return expression;
            }
        }

        return expression;
    }
}
