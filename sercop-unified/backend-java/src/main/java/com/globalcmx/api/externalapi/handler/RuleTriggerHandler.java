package com.globalcmx.api.externalapi.handler;

import com.globalcmx.api.externalapi.dto.ExternalApiCallContext;
import com.globalcmx.api.externalapi.dto.ListenerExecutionResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Handler for TRIGGER_RULE listener action.
 * Triggers an event rule with context from the API response.
 *
 * Config example:
 * {
 *     "ruleCode": "EXCHANGE_RATE_UPDATED",
 *     "additionalContext": {
 *         "newRate": "#response.rate",
 *         "currency": "#response.currencyCode"
 *     }
 * }
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RuleTriggerHandler {

    // Note: This would typically depend on your event rule system
    // private final EventRuleService eventRuleService;

    private final ExpressionParser spelParser = new SpelExpressionParser();

    public ListenerExecutionResult execute(
            Map<String, Object> config,
            ExternalApiCallContext context,
            Map<String, Object> responseData) {

        String ruleCode = (String) config.get("ruleCode");
        @SuppressWarnings("unchecked")
        Map<String, String> additionalContext = (Map<String, String>) config.get("additionalContext");

        if (ruleCode == null || ruleCode.isBlank()) {
            return ListenerExecutionResult.failed(null, "ruleCode is required");
        }

        try {
            // Build context for the rule
            Map<String, Object> ruleContext = new HashMap<>();

            // Add resolved additional context
            if (additionalContext != null) {
                for (Map.Entry<String, String> entry : additionalContext.entrySet()) {
                    Object value = resolveExpression(entry.getValue(), context, responseData);
                    ruleContext.put(entry.getKey(), value);
                }
            }

            // Add standard context
            if (context.getOperation() != null) {
                ruleContext.put("operationId", context.getOperation().getOperationId());
                ruleContext.put("operationType", context.getOperation().getProductType());
            }
            ruleContext.put("apiConfigCode", context.getApiConfig() != null ?
                    context.getApiConfig().getCode() : null);
            ruleContext.put("triggeredBy", "API_LISTENER");

            log.info("Triggering rule {} with context: {}", ruleCode, ruleContext.keySet());

            // TODO: Implement actual rule triggering
            // eventRuleService.triggerRule(ruleCode, ruleContext);

            // For now, just log and return success
            log.warn("Rule triggering not implemented yet. Would trigger rule: {}", ruleCode);

            return ListenerExecutionResult.success(null, Map.of(
                    "ruleCode", ruleCode,
                    "context", ruleContext,
                    "status", "PENDING_IMPLEMENTATION"
            ));
        } catch (Exception e) {
            log.error("Error triggering rule {}: {}", ruleCode, e.getMessage());
            return ListenerExecutionResult.failed(null,
                    "Error triggering rule: " + e.getMessage());
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
