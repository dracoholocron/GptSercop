package com.globalcmx.api.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.command.SendSwiftMessageCommand;
import com.globalcmx.api.readmodel.entity.EventActionExecutionLog;
import com.globalcmx.api.readmodel.entity.EventActionExecutionLog.ExecutionStatus;
import com.globalcmx.api.readmodel.entity.OperationReadModel;
import com.globalcmx.api.readmodel.entity.ReglaEventoReadModel;
import com.globalcmx.api.readmodel.entity.SwiftDraftReadModel;
import com.globalcmx.api.readmodel.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Service for executing automatic actions triggered by events.
 * Supports multiple action types: SWIFT_MESSAGE, API_CALL, EMAIL, AUDITORIA, etc.
 * All executions are logged for tracking and debugging.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EventActionExecutorService {

    private final ReglaEventoReadModelRepository ruleRepository;
    private final EventActionExecutionLogRepository executionLogRepository;
    private final OperationReadModelRepository operationRepository;
    private final SwiftDraftReadModelRepository draftRepository;
    private final SwiftMessageReadModelRepository swiftMessageRepository;
    private final SwiftMessageCommandService swiftMessageCommandService;
    private final PendingEventApprovalRepository pendingApprovalRepository;
    private final TemplateVariableResolverService templateVariableResolver;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final com.globalcmx.api.externalapi.service.ExternalApiExecutorService externalApiExecutorService;

    /**
     * Executes all rules matching the given trigger event for an operation.
     * @param operationType Type of operation (LC_IMPORT, GUARANTEE, etc.)
     * @param triggerEvent The event that triggered this execution (e.g., ISSUE_APPROVED)
     * @param operationId The operation ID
     * @param draftId Optional draft ID (for new operations)
     * @param executedBy User who triggered the action
     * @return Execution ID for tracking
     */
    @Transactional
    public String executeRulesForEvent(String operationType, String triggerEvent,
                                        String operationId, String draftId, String executedBy) {
        log.info("Executing rules for event: {} on operation type: {}, operationId: {}",
                triggerEvent, operationType, operationId);

        // Find matching rules
        List<ReglaEventoReadModel> rules = ruleRepository
                .findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                        operationType, triggerEvent, true);

        if (rules.isEmpty()) {
            log.debug("No rules found for event: {} on operation type: {}", triggerEvent, operationType);
            return null;
        }

        String executionId = generateExecutionId();
        log.info("Found {} rules to execute. Execution ID: {}", rules.size(), executionId);

        // Get operation context
        OperationReadModel operation = null;
        SwiftDraftReadModel draft = null;

        if (operationId != null) {
            // Try to find by operationId first, then by reference
            operation = operationRepository.findByOperationId(operationId)
                    .or(() -> operationRepository.findByReference(operationId))
                    .orElse(null);
            log.info("Operation lookup for '{}': {}", operationId,
                    operation != null ? "found " + operation.getOperationId() : "not found");
        }
        if (draftId != null) {
            draft = draftRepository.findByDraftId(draftId).orElse(null);
        }

        // Execute each rule - pass original operationId for logging when operation is null
        String operationIdForLogging = operation != null ? operation.getOperationId() : operationId;
        for (ReglaEventoReadModel rule : rules) {
            executeRule(rule, executionId, operation, draft, executedBy, operationIdForLogging);
        }

        return executionId;
    }

    /**
     * Executes a single rule with all its actions.
     * @param operationIdForLogging The original operation/request ID for API call logging
     */
    private void executeRule(ReglaEventoReadModel rule, String executionId,
                             OperationReadModel operation, SwiftDraftReadModel draft, String executedBy,
                             String operationIdForLogging) {
        log.info("Executing rule: {} ({}) with operationId: {}", rule.getNombre(), rule.getCodigo(), operationIdForLogging);

        try {
            // Parse actions from JSON
            List<Map<String, Object>> actions = objectMapper.readValue(
                    rule.getAccionesJson(),
                    new TypeReference<List<Map<String, Object>>>() {}
            );

            // Execute each action in order - pass operationIdForLogging for API call logging
            for (Map<String, Object> action : actions) {
                executeAction(action, rule, executionId, operation, draft, executedBy, operationIdForLogging);
            }

        } catch (Exception e) {
            log.error("Error executing rule {}: {}", rule.getCodigo(), e.getMessage(), e);
        }
    }

    /**
     * Executes a single action and logs the result.
     * @param operationIdForLogging The original operation/request ID for API call logging
     */
    private void executeAction(Map<String, Object> action, ReglaEventoReadModel rule,
                               String executionId, OperationReadModel operation,
                               SwiftDraftReadModel draft, String executedBy, String operationIdForLogging) {
        String actionType = (String) action.get("tipo");
        Integer actionOrder = (Integer) action.getOrDefault("orden", 0);
        Boolean async = (Boolean) action.getOrDefault("async", false);
        Boolean continueOnError = (Boolean) action.getOrDefault("continueOnError", true);
        @SuppressWarnings("unchecked")
        Map<String, Object> config = (Map<String, Object>) action.get("config");

        // Add triggerEvent to config for duplicate prevention in SWIFT messages
        if (config == null) {
            config = new java.util.HashMap<>();
        } else {
            config = new java.util.HashMap<>(config); // Make mutable copy
        }
        // Add operationIdForLogging for API_CALL actions (CLIENT_REQUEST support)
        config.put("operationIdOverride", operationIdForLogging);
        config.put("triggerEvent", rule.getEventoTrigger());

        // Create execution log entry
        EventActionExecutionLog logEntry = EventActionExecutionLog.builder()
                .executionId(executionId)
                .ruleCode(rule.getCodigo())
                .operationId(operation != null ? operation.getOperationId() : null)
                .triggerEvent(rule.getEventoTrigger())
                .actionType(actionType)
                .actionOrder(actionOrder)
                .actionConfig(toJson(config))
                .status(ExecutionStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .createdBy(executedBy)
                .build();

        logEntry = executionLogRepository.save(logEntry);

        // Execute based on action type
        if (async) {
            executeActionAsync(logEntry, actionType, config, operation, draft, executedBy);
        } else {
            executeActionSync(logEntry, actionType, config, operation, draft, executedBy, continueOnError);
        }
    }

    /**
     * Synchronous action execution.
     */
    private void executeActionSync(EventActionExecutionLog logEntry, String actionType,
                                    Map<String, Object> config, OperationReadModel operation,
                                    SwiftDraftReadModel draft, String executedBy, boolean continueOnError) {
        LocalDateTime startTime = LocalDateTime.now();
        logEntry.setStatus(ExecutionStatus.RUNNING);
        logEntry.setStartedAt(startTime);
        logEntry = executionLogRepository.save(logEntry);

        try {
            Map<String, Object> result = switch (actionType) {
                case "SWIFT_MESSAGE" -> executeSwiftMessageAction(config, operation, draft, executedBy);
                case "API_CALL" -> executeApiCallAction(config, operation, draft, executedBy);
                case "EMAIL" -> executeEmailAction(config, operation, draft, executedBy);
                case "AUDITORIA" -> executeAuditAction(config, operation, draft, executedBy);
                default -> {
                    log.warn("Unknown action type: {}", actionType);
                    yield Map.of("warning", "Unknown action type: " + actionType);
                }
            };

            // Success
            LocalDateTime endTime = LocalDateTime.now();
            logEntry.setStatus(ExecutionStatus.SUCCESS);
            logEntry.setCompletedAt(endTime);
            logEntry.setDurationMs((int) ChronoUnit.MILLIS.between(startTime, endTime));
            logEntry.setResultData(toJson(result));
            executionLogRepository.save(logEntry);

            log.info("Action {} executed successfully for rule {}", actionType, logEntry.getRuleCode());

        } catch (Exception e) {
            // Failure
            LocalDateTime endTime = LocalDateTime.now();
            logEntry.setStatus(ExecutionStatus.FAILED);
            logEntry.setCompletedAt(endTime);
            logEntry.setDurationMs((int) ChronoUnit.MILLIS.between(startTime, endTime));
            logEntry.setErrorMessage(e.getMessage());
            executionLogRepository.save(logEntry);

            log.error("Action {} failed for rule {}: {}", actionType, logEntry.getRuleCode(), e.getMessage());

            if (!continueOnError) {
                throw new RuntimeException("Action failed and continueOnError=false", e);
            }
        }
    }

    /**
     * Asynchronous action execution.
     */
    @Async
    public void executeActionAsync(EventActionExecutionLog logEntry, String actionType,
                                    Map<String, Object> config, OperationReadModel operation,
                                    SwiftDraftReadModel draft, String executedBy) {
        executeActionSync(logEntry, actionType, config, operation, draft, executedBy, true);
    }

    /**
     * Executes SWIFT_MESSAGE action - generates and registers a SWIFT message.
     * For amendment messages (MT707, MT767), uses the pre-generated content from pending approval.
     */
    private Map<String, Object> executeSwiftMessageAction(Map<String, Object> config,
                                                           OperationReadModel operation,
                                                           SwiftDraftReadModel draft,
                                                           String executedBy) {
        if (operation == null) {
            throw new RuntimeException("Operation is required for SWIFT_MESSAGE action");
        }

        // Reload operation to get fresh state (avoid optimistic locking issues)
        OperationReadModel freshOperation = operationRepository.findByOperationId(operation.getOperationId())
                .orElseThrow(() -> new RuntimeException("Operation not found: " + operation.getOperationId()));

        String messageType = (String) config.get("messageType");
        String direction = (String) config.getOrDefault("direction", "OUTBOUND");

        log.info("Generating SWIFT message {} for operation {}", messageType, freshOperation.getOperationId());

        // Validate required fields
        if (freshOperation.getIssuingBankBic() == null || freshOperation.getIssuingBankBic().isEmpty()) {
            throw new RuntimeException("Missing Issuing Bank BIC (field :52A:)");
        }
        if (freshOperation.getAdvisingBankBic() == null || freshOperation.getAdvisingBankBic().isEmpty()) {
            throw new RuntimeException("Missing Advising Bank BIC (field :57A:)");
        }

        // Build SWIFT content - for amendments use pre-generated content from pending approval
        String swiftContent;
        if (isAmendmentMessage(messageType)) {
            swiftContent = getAmendmentSwiftContentFromApproval(freshOperation.getOperationId(), messageType);
            if (swiftContent == null || swiftContent.isEmpty()) {
                log.warn("No pre-generated SWIFT content found for amendment, falling back to operation data");
                swiftContent = buildSwiftContent(messageType, freshOperation);
            }
        } else {
            swiftContent = buildSwiftContent(messageType, freshOperation);
        }

        // Create message command
        SendSwiftMessageCommand command = SendSwiftMessageCommand.builder()
                .messageType(messageType)
                .operationId(freshOperation.getOperationId())
                .senderBic(freshOperation.getIssuingBankBic())
                .receiverBic(freshOperation.getAdvisingBankBic())
                .swiftContent(swiftContent)
                .field20Reference(freshOperation.getReference())
                .currency(freshOperation.getCurrency())
                .amount(freshOperation.getAmount())
                .triggeredByEvent("AUTO_" + config.getOrDefault("triggerEvent", "APPROVED"))
                .createdBy(executedBy)
                .build();

        // Send message
        var result = swiftMessageCommandService.sendMessage(command);

        return Map.of(
                "messageId", result.getMessageId(),
                "messageType", messageType,
                "status", result.getStatus(),
                "senderBic", result.getSenderBic(),
                "receiverBic", result.getReceiverBic()
        );
    }

    /**
     * Checks if the message type is an amendment message.
     */
    private boolean isAmendmentMessage(String messageType) {
        return messageType != null && (
            messageType.equals("MT707") ||  // LC Amendment
            messageType.equals("MT767") ||  // Guarantee Amendment
            messageType.equals("MT747")     // Amendment to Authorization
        );
    }

    /**
     * Gets the pre-generated SWIFT content from the most recent approved pending approval.
     */
    private String getAmendmentSwiftContentFromApproval(String operationId, String messageType) {
        // Find the most recently approved amendment for this operation
        var approvals = pendingApprovalRepository
                .findByOperationIdAndStatusOrderBySubmittedAtDesc(operationId, "APPROVED");

        for (var approval : approvals) {
            // Check if this approval has SWIFT message content and matches the message type
            if (approval.getSwiftMessage() != null && !approval.getSwiftMessage().isEmpty()) {
                String content = approval.getSwiftMessage();
                // Verify it's the right message type
                if (content.contains("{2:O" + messageType.replace("MT", "")) ||
                    content.contains("{2:I" + messageType.replace("MT", ""))) {
                    log.info("Using pre-generated SWIFT content from approval: {}", approval.getApprovalId());
                    return content;
                }
            }
        }

        return null;
    }

    /**
     * Executes API_CALL action - calls an external API.
     * If apiConfigCode is provided, uses ExternalApiExecutorService for proper logging.
     * Otherwise, uses direct REST call with #{variable} placeholder support.
     */
    private Map<String, Object> executeApiCallAction(Map<String, Object> config,
                                                      OperationReadModel operation,
                                                      SwiftDraftReadModel draft,
                                                      String executedBy) {
        // Check if we should use ExternalApiExecutorService (for configured APIs with logging)
        String apiConfigCode = (String) config.get("apiConfigCode");
        String operationIdForLog = (String) config.get("operationIdOverride"); // For CLIENT_REQUEST

        if (apiConfigCode != null && !apiConfigCode.isEmpty()) {
            log.info("Executing configured API: {} with operationId: {}", apiConfigCode, operationIdForLog);

            try {
                // Build context for the API call
                var context = new com.globalcmx.api.dto.drools.RuleContext();

                // Use operation data if available, otherwise use operationIdOverride
                if (operation != null) {
                    context.setOperationId(Long.parseLong(operation.getOperationId().hashCode() + ""));
                    context.setOperationType(operation.getProductType());
                    context.setOperationAmount(operation.getAmount());
                    context.setCurrency(operation.getCurrency());

                    // Add operation data for variable resolution
                    Map<String, Object> additionalData = new HashMap<>();
                    additionalData.put("clientId", operation.getApplicantId());
                    additionalData.put("clientName", operation.getApplicantName());
                    additionalData.put("productType", operation.getProductType());
                    additionalData.put("amount", operation.getAmount());
                    additionalData.put("currency", operation.getCurrency());
                    context.setAdditionalData(additionalData);
                }

                // Execute through ExternalApiExecutorService which logs to external_api_call_log
                var result = externalApiExecutorService.executeWithOperationId(apiConfigCode, context, operationIdForLog);

                Map<String, Object> resultMap = new HashMap<>();
                resultMap.put("apiConfigCode", apiConfigCode);
                resultMap.put("success", result.getSuccess());
                resultMap.put("executionTimeMs", result.getExecutionTimeMs());

                // Extract data from outputData if available
                if (result.getOutputData() != null) {
                    resultMap.put("statusCode", result.getOutputData().get("statusCode"));
                    resultMap.put("response", result.getOutputData().getOrDefault("responseBody", ""));
                }

                return resultMap;
            } catch (Exception e) {
                log.error("Error executing configured API {}: {}", apiConfigCode, e.getMessage(), e);
                return Map.of(
                        "apiConfigCode", apiConfigCode,
                        "success", false,
                        "error", e.getMessage()
                );
            }
        }

        // Fallback to direct REST call (legacy behavior)
        String url = (String) config.get("url");
        String method = (String) config.getOrDefault("method", "POST");
        @SuppressWarnings("unchecked")
        Map<String, String> headers = (Map<String, String>) config.getOrDefault("headers", Map.of());
        Object body = config.get("requestBody");
        if (body == null) {
            body = config.get("body"); // Fallback to "body" key
        }

        log.info("Calling external API: {} {}", method, url);

        // Build headers
        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setContentType(MediaType.APPLICATION_JSON);
        headers.forEach(httpHeaders::set);

        // Resolve #{variable} placeholders in URL and body
        if (operation != null) {
            url = templateVariableResolver.resolveVariables(url, operation, executedBy);
        }

        String bodyJson = toJson(body);
        if (operation != null) {
            bodyJson = templateVariableResolver.resolveVariables(bodyJson, operation, executedBy);
        }

        log.debug("Resolved API body: {}", bodyJson);

        // Make the call
        HttpEntity<String> entity = new HttpEntity<>(bodyJson, httpHeaders);
        ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.valueOf(method), entity, String.class);

        return Map.of(
                "statusCode", response.getStatusCode().value(),
                "response", response.getBody() != null ? response.getBody() : ""
        );
    }

    /**
     * Executes EMAIL action - sends an email notification.
     * Supports #{variable} placeholders in subject, body, and recipients.
     */
    private Map<String, Object> executeEmailAction(Map<String, Object> config,
                                                    OperationReadModel operation,
                                                    SwiftDraftReadModel draft,
                                                    String executedBy) {
        log.info("Email action triggered with config: {}", config);

        // Extract email configuration
        String subject = (String) config.getOrDefault("subject", "");
        String body = (String) config.getOrDefault("html", "");
        Object recipients = config.get("recipients");

        // Resolve #{variable} placeholders
        if (operation != null) {
            subject = templateVariableResolver.resolveVariables(subject, operation, executedBy);
            body = templateVariableResolver.resolveVariables(body, operation, executedBy);

            // Resolve variables in recipients if it's a string
            if (recipients instanceof String) {
                recipients = templateVariableResolver.resolveVariables((String) recipients, operation, executedBy);
            }
        }

        log.info("Resolved email - Subject: {}, Recipients: {}", subject, recipients);

        // TODO: Implement actual email sending via EmailService
        return Map.of(
                "status", "EMAIL_QUEUED",
                "subject", subject,
                "recipients", recipients != null ? recipients.toString() : "",
                "message", "Email queued for delivery"
        );
    }

    /**
     * Executes AUDITORIA action - logs an audit entry.
     */
    private Map<String, Object> executeAuditAction(Map<String, Object> config,
                                                    OperationReadModel operation,
                                                    SwiftDraftReadModel draft,
                                                    String executedBy) {
        String categoria = (String) config.get("categoria");
        String severidad = (String) config.getOrDefault("severidad", "INFO");
        String mensaje = (String) config.get("mensaje");

        log.info("AUDIT [{}] [{}]: {} - Operation: {}, User: {}",
                severidad, categoria, mensaje,
                operation != null ? operation.getOperationId() : "N/A",
                executedBy);

        return Map.of(
                "categoria", categoria,
                "severidad", severidad,
                "mensaje", mensaje,
                "timestamp", LocalDateTime.now().toString()
        );
    }

    /**
     * Builds SWIFT message content from operation data.
     */
    private String buildSwiftContent(String messageType, OperationReadModel operation) {
        StringBuilder swift = new StringBuilder();

        // Basic header
        swift.append("{1:F01").append(operation.getIssuingBankBic()).append("AXXX0000000000}")
             .append("{2:I").append(messageType).append(operation.getAdvisingBankBic()).append("XXXXN}")
             .append("{4:\n");

        // Add standard fields
        swift.append(":20:").append(operation.getReference()).append("\n");
        swift.append(":31C:").append(formatSwiftDate(operation.getCreatedAt())).append("\n");

        if (operation.getCurrency() != null && operation.getAmount() != null) {
            swift.append(":32B:").append(operation.getCurrency())
                 .append(formatSwiftAmount(operation.getAmount())).append("\n");
        }

        if (operation.getApplicantName() != null) {
            swift.append(":50:").append(operation.getApplicantName()).append("\n");
        }

        if (operation.getBeneficiaryName() != null) {
            swift.append(":59:").append(operation.getBeneficiaryName()).append("\n");
        }

        // Use stored SWIFT message if available
        if (operation.getSwiftMessage() != null && !operation.getSwiftMessage().isEmpty()) {
            swift.append(operation.getSwiftMessage());
        }

        swift.append("-}");

        return swift.toString();
    }

    private String formatSwiftDate(LocalDateTime date) {
        if (date == null) return "";
        return String.format("%02d%02d%02d",
                date.getYear() % 100, date.getMonthValue(), date.getDayOfMonth());
    }

    private String formatSwiftAmount(BigDecimal amount) {
        if (amount == null) return "0,";
        return amount.toPlainString().replace(".", ",");
    }

    private String generateExecutionId() {
        return "EXE-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "{}";
        }
    }

    /**
     * Gets execution logs for an operation (for tracking/monitoring).
     */
    public List<EventActionExecutionLog> getExecutionLogsForOperation(String operationId) {
        return executionLogRepository.findByOperationIdOrderByCreatedAtDesc(operationId);
    }

    /**
     * Gets execution logs by execution ID.
     */
    public List<EventActionExecutionLog> getExecutionLogsByExecutionId(String executionId) {
        return executionLogRepository.findByExecutionIdOrderByActionOrder(executionId);
    }
}
