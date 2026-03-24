package com.globalcmx.api.externalapi.handler;

import com.globalcmx.api.email.service.EmailService;
import com.globalcmx.api.externalapi.dto.ExternalApiCallContext;
import com.globalcmx.api.externalapi.dto.ListenerExecutionResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Handler for SEND_NOTIFICATION listener action.
 * Sends notifications (email, push, etc.) based on API response data.
 *
 * Config example:
 * {
 *     "notificationType": "EMAIL",
 *     "templateCode": "EXCHANGE_RATE_UPDATED",
 *     "recipients": ["treasury@bank.com"],
 *     "variables": {
 *         "apiName": "#context.apiConfig.name",
 *         "rate": "#response.rate"
 *     }
 * }
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationHandler {

    private final EmailService emailService;
    private final ExpressionParser spelParser = new SpelExpressionParser();

    public ListenerExecutionResult execute(
            Map<String, Object> config,
            ExternalApiCallContext context,
            Map<String, Object> responseData) {

        String notificationType = (String) config.get("notificationType");
        String templateCode = (String) config.get("templateCode");
        @SuppressWarnings("unchecked")
        List<String> recipients = (List<String>) config.get("recipients");
        @SuppressWarnings("unchecked")
        Map<String, String> variables = (Map<String, String>) config.get("variables");

        if (templateCode == null || templateCode.isBlank()) {
            return ListenerExecutionResult.failed(null, "templateCode is required");
        }

        if (recipients == null || recipients.isEmpty()) {
            return ListenerExecutionResult.failed(null, "recipients are required");
        }

        try {
            // Resolve variable values
            Map<String, Object> resolvedVariables = new HashMap<>();
            if (variables != null) {
                for (Map.Entry<String, String> entry : variables.entrySet()) {
                    Object value = resolveExpression(entry.getValue(), context, responseData);
                    resolvedVariables.put(entry.getKey(), value);
                }
            }

            // Add standard variables
            if (context.getOperation() != null) {
                resolvedVariables.put("operationId", context.getOperation().getOperationId());
                resolvedVariables.put("operationReference", context.getOperation().getReference());
            }
            if (context.getApiConfig() != null) {
                resolvedVariables.put("apiCode", context.getApiConfig().getCode());
                resolvedVariables.put("apiName", context.getApiConfig().getName());
            }

            // Determine notification type
            String type = notificationType != null ? notificationType.toUpperCase() : "EMAIL";

            if ("EMAIL".equals(type)) {
                return sendEmail(templateCode, recipients, resolvedVariables, context);
            } else {
                return ListenerExecutionResult.failed(null,
                        "Unsupported notification type: " + notificationType);
            }
        } catch (Exception e) {
            log.error("Error sending notification: {}", e.getMessage());
            return ListenerExecutionResult.failed(null,
                    "Error sending notification: " + e.getMessage());
        }
    }

    private ListenerExecutionResult sendEmail(
            String templateCode,
            List<String> recipients,
            Map<String, Object> variables,
            ExternalApiCallContext context) {

        try {
            // Queue email using the email service
            com.globalcmx.api.email.dto.SendEmailRequest request =
                    com.globalcmx.api.email.dto.SendEmailRequest.builder()
                            .to(recipients)
                            .templateCode(templateCode)
                            .templateVariables(variables)
                            .referenceType("EXTERNAL_API_LISTENER")
                            .referenceId(context.getCallId())
                            .priority("NORMAL")
                            .build();

            String createdBy = context.getExecutingUser() != null ?
                    context.getExecutingUser() : "system";

            emailService.queueEmail(request, createdBy);

            log.info("Queued email notifications to {} recipients using template {}",
                    recipients.size(), templateCode);

            return ListenerExecutionResult.success(null, Map.of(
                    "notificationType", "EMAIL",
                    "templateCode", templateCode,
                    "recipientCount", recipients.size(),
                    "recipients", recipients
            ));
        } catch (Exception e) {
            log.error("Error queuing email: {}", e.getMessage());
            return ListenerExecutionResult.failed(null,
                    "Error queuing email: " + e.getMessage());
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
                evalContext.setVariable("apiConfig", context.getApiConfig());

                return spelParser.parseExpression(expression).getValue(evalContext);
            } catch (Exception e) {
                log.warn("Error resolving expression '{}': {}", expression, e.getMessage());
                return expression;
            }
        }

        return expression;
    }
}
