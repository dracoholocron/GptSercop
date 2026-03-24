package com.globalcmx.api.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.ApiResponse;
import com.globalcmx.api.readmodel.entity.ActionTypeConfig;
import com.globalcmx.api.readmodel.entity.EventActionExecutionLog;
import com.globalcmx.api.readmodel.entity.EventActionExecutionLog.ExecutionStatus;
import com.globalcmx.api.readmodel.entity.ReglaEventoReadModel;
import com.globalcmx.api.readmodel.repository.ActionTypeConfigRepository;
import com.globalcmx.api.readmodel.repository.EventActionExecutionLogRepository;
import com.globalcmx.api.readmodel.repository.ReglaEventoReadModelRepository;
import com.globalcmx.api.service.EventActionExecutorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * REST Controller for managing automatic event actions.
 * Provides endpoints to preview, execute, retry, and skip actions.
 */
@RestController
@RequestMapping("/v1/event-actions")
@RequiredArgsConstructor
@Slf4j
public class EventActionController {

    private final ReglaEventoReadModelRepository ruleRepository;
    private final EventActionExecutionLogRepository executionLogRepository;
    private final ActionTypeConfigRepository actionTypeConfigRepository;
    private final EventActionExecutorService actionExecutorService;
    private final ObjectMapper objectMapper;

    /**
     * Preview actions that will be executed for an event.
     * Returns the list of actions without executing them.
     */
    @GetMapping("/preview")
    public ResponseEntity<ApiResponse<PreviewResponse>> previewActions(
            @RequestParam String operationType,
            @RequestParam String triggerEvent,
            @RequestParam(required = false) String operationId) {

        log.info("Previewing actions for operationType={}, triggerEvent={}", operationType, triggerEvent);

        List<ReglaEventoReadModel> rules = ruleRepository
                .findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                        operationType, triggerEvent, true);

        log.info("Found {} rules for operationType={}, triggerEvent={}", rules.size(), operationType, triggerEvent);
        rules.forEach(r -> log.info("  Rule: {} ({})", r.getCodigo(), r.getNombre()));

        List<ActionPreview> actions = new ArrayList<>();
        int order = 1;

        for (ReglaEventoReadModel rule : rules) {
            try {
                List<Map<String, Object>> ruleActions = objectMapper.readValue(
                        rule.getAccionesJson(),
                        new TypeReference<List<Map<String, Object>>>() {}
                );

                for (Map<String, Object> action : ruleActions) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> config = (Map<String, Object>) action.get("config");

                    actions.add(ActionPreview.builder()
                            .order(order++)
                            .ruleCode(rule.getCodigo())
                            .ruleName(rule.getNombre())
                            .actionType((String) action.get("tipo"))
                            .description(config != null ? (String) config.get("description") : null)
                            .async((Boolean) action.getOrDefault("async", false))
                            .continueOnError((Boolean) action.getOrDefault("continueOnError", true))
                            .config(config)
                            .build());
                }
            } catch (Exception e) {
                log.error("Error parsing rule {}: {}", rule.getCodigo(), e.getMessage());
            }
        }

        PreviewResponse response = PreviewResponse.builder()
                .operationType(operationType)
                .triggerEvent(triggerEvent)
                .operationId(operationId)
                .totalActions(actions.size())
                .actions(actions)
                .build();

        return ResponseEntity.ok(ApiResponse.success("OK", response));
    }

    /**
     * Execute all actions for an event.
     */
    @PostMapping("/execute")
    public ResponseEntity<ApiResponse<ExecutionResponse>> executeActions(
            @RequestBody ExecuteActionsRequest request) {

        log.info("Executing actions for operationType={}, triggerEvent={}, operationId={}",
                request.getOperationType(), request.getTriggerEvent(), request.getOperationId());

        String executionId = actionExecutorService.executeRulesForEvent(
                request.getOperationType(),
                request.getTriggerEvent(),
                request.getOperationId(),
                request.getDraftId(),
                request.getExecutedBy()
        );

        List<EventActionExecutionLog> logs = executionId != null
                ? executionLogRepository.findByExecutionIdOrderByActionOrder(executionId)
                : List.of();

        ExecutionResponse response = ExecutionResponse.builder()
                .executionId(executionId)
                .totalActions(logs.size())
                .successCount((int) logs.stream().filter(l -> l.getStatus() == ExecutionStatus.SUCCESS).count())
                .failedCount((int) logs.stream().filter(l -> l.getStatus() == ExecutionStatus.FAILED).count())
                .actions(logs.stream().map(this::toActionStatus).toList())
                .build();

        return ResponseEntity.ok(ApiResponse.success("OK", response));
    }

    /**
     * Execute a single action (for step-by-step execution).
     */
    @PostMapping("/execute-single/{logId}")
    public ResponseEntity<ApiResponse<ActionStatus>> executeSingleAction(
            @PathVariable Long logId,
            @RequestParam String executedBy) {

        log.info("Executing single action logId={}", logId);

        EventActionExecutionLog logEntry = executionLogRepository.findById(logId)
                .orElseThrow(() -> new RuntimeException("Action log not found: " + logId));

        if (logEntry.getStatus() != ExecutionStatus.PENDING &&
            logEntry.getStatus() != ExecutionStatus.FAILED) {
            throw new RuntimeException("Action cannot be executed. Current status: " + logEntry.getStatus());
        }

        // Execute the action
        // Note: This would need additional context from operation/draft
        // For now, return current status
        return ResponseEntity.ok(ApiResponse.success("OK", toActionStatus(logEntry)));
    }

    /**
     * Retry a failed action.
     */
    @PostMapping("/retry/{logId}")
    public ResponseEntity<ApiResponse<ActionStatus>> retryAction(
            @PathVariable Long logId,
            @RequestParam String executedBy) {

        log.info("Retrying action logId={} by {}", logId, executedBy);

        EventActionExecutionLog logEntry = executionLogRepository.findById(logId)
                .orElseThrow(() -> new RuntimeException("Action log not found: " + logId));

        if (logEntry.getStatus() != ExecutionStatus.FAILED) {
            throw new RuntimeException("Only failed actions can be retried. Current status: " + logEntry.getStatus());
        }

        if (logEntry.getRetryCount() >= logEntry.getMaxRetries()) {
            throw new RuntimeException("Maximum retry attempts reached: " + logEntry.getMaxRetries());
        }

        // Increment retry count
        logEntry.setRetryCount(logEntry.getRetryCount() + 1);
        logEntry.setStatus(ExecutionStatus.PENDING);
        logEntry.setErrorMessage(null);
        logEntry = executionLogRepository.save(logEntry);

        // TODO: Re-execute the action with original context
        // For now, the status is reset to PENDING for re-execution

        return ResponseEntity.ok(ApiResponse.success("OK", toActionStatus(logEntry)));
    }

    /**
     * Skip an action (with audit trail).
     */
    @PostMapping("/skip/{logId}")
    public ResponseEntity<ApiResponse<ActionStatus>> skipAction(
            @PathVariable Long logId,
            @RequestParam String executedBy,
            @RequestParam(required = false) String reason) {

        log.info("Skipping action logId={} by {} - Reason: {}", logId, executedBy, reason);

        EventActionExecutionLog logEntry = executionLogRepository.findById(logId)
                .orElseThrow(() -> new RuntimeException("Action log not found: " + logId));

        if (logEntry.getStatus() == ExecutionStatus.SUCCESS) {
            throw new RuntimeException("Cannot skip a successful action");
        }

        // Update status to SKIPPED
        logEntry.setStatus(ExecutionStatus.SKIPPED);
        logEntry.setCompletedAt(LocalDateTime.now());
        logEntry.setResultData(objectMapper.createObjectNode()
                .put("skippedBy", executedBy)
                .put("reason", reason != null ? reason : "User skipped action")
                .put("skippedAt", LocalDateTime.now().toString())
                .toString());

        logEntry = executionLogRepository.save(logEntry);

        log.warn("Action {} skipped by {} - Reason: {}", logId, executedBy, reason);

        return ResponseEntity.ok(ApiResponse.success("OK", toActionStatus(logEntry)));
    }

    /**
     * Get execution status for an operation.
     */
    @GetMapping("/status/{operationId}")
    public ResponseEntity<ApiResponse<List<ActionStatus>>> getExecutionStatus(
            @PathVariable String operationId) {

        List<EventActionExecutionLog> logs = executionLogRepository
                .findByOperationIdOrderByCreatedAtDesc(operationId);

        return ResponseEntity.ok(ApiResponse.success("OK",
                logs.stream().map(this::toActionStatus).toList()));
    }

    /**
     * Get execution logs by execution ID.
     */
    @GetMapping("/execution/{executionId}")
    public ResponseEntity<ApiResponse<ExecutionResponse>> getExecutionById(
            @PathVariable String executionId) {

        List<EventActionExecutionLog> logs = executionLogRepository
                .findByExecutionIdOrderByActionOrder(executionId);

        ExecutionResponse response = ExecutionResponse.builder()
                .executionId(executionId)
                .totalActions(logs.size())
                .successCount((int) logs.stream().filter(l -> l.getStatus() == ExecutionStatus.SUCCESS).count())
                .failedCount((int) logs.stream().filter(l -> l.getStatus() == ExecutionStatus.FAILED).count())
                .actions(logs.stream().map(this::toActionStatus).toList())
                .build();

        return ResponseEntity.ok(ApiResponse.success("OK", response));
    }

    /**
     * Get action type configurations for a language.
     */
    @GetMapping("/action-types")
    public ResponseEntity<ApiResponse<List<ActionTypeConfigDTO>>> getActionTypeConfigs(
            @RequestParam(defaultValue = "es") String language) {

        List<ActionTypeConfig> configs = actionTypeConfigRepository
                .findByLanguageAndIsActiveTrueOrderByDisplayOrder(language);

        List<ActionTypeConfigDTO> dtos = configs.stream()
                .map(c -> ActionTypeConfigDTO.builder()
                        .actionType(c.getActionType())
                        .displayName(c.getDisplayName())
                        .description(c.getDescription())
                        .helpText(c.getHelpText())
                        .icon(c.getIcon())
                        .color(c.getColor())
                        .successMessage(c.getSuccessMessage())
                        .errorMessage(c.getErrorMessage())
                        .build())
                .toList();

        return ResponseEntity.ok(ApiResponse.success("OK", dtos));
    }

    // ==================== DTOs ====================

    private ActionStatus toActionStatus(EventActionExecutionLog log) {
        return ActionStatus.builder()
                .id(log.getId())
                .executionId(log.getExecutionId())
                .ruleCode(log.getRuleCode())
                .actionType(log.getActionType())
                .actionOrder(log.getActionOrder())
                .status(log.getStatus().name())
                .startedAt(log.getStartedAt())
                .completedAt(log.getCompletedAt())
                .durationMs(log.getDurationMs())
                .errorMessage(log.getErrorMessage())
                .resultData(log.getResultData())
                .retryCount(log.getRetryCount())
                .maxRetries(log.getMaxRetries())
                .canRetry(log.getStatus() == ExecutionStatus.FAILED &&
                          log.getRetryCount() < log.getMaxRetries())
                .canSkip(log.getStatus() != ExecutionStatus.SUCCESS)
                .build();
    }

    @lombok.Data
    @lombok.Builder
    public static class PreviewResponse {
        private String operationType;
        private String triggerEvent;
        private String operationId;
        private int totalActions;
        private List<ActionPreview> actions;
    }

    @lombok.Data
    @lombok.Builder
    public static class ActionPreview {
        private int order;
        private String ruleCode;
        private String ruleName;
        private String actionType;
        private String description;
        private boolean async;
        private boolean continueOnError;
        private Map<String, Object> config;
    }

    @lombok.Data
    public static class ExecuteActionsRequest {
        private String operationType;
        private String triggerEvent;
        private String operationId;
        private String draftId;
        private String executedBy;
    }

    @lombok.Data
    @lombok.Builder
    public static class ExecutionResponse {
        private String executionId;
        private int totalActions;
        private int successCount;
        private int failedCount;
        private List<ActionStatus> actions;
    }

    @lombok.Data
    @lombok.Builder
    public static class ActionStatus {
        private Long id;
        private String executionId;
        private String ruleCode;
        private String actionType;
        private int actionOrder;
        private String status;
        private LocalDateTime startedAt;
        private LocalDateTime completedAt;
        private Integer durationMs;
        private String errorMessage;
        private String resultData;
        private int retryCount;
        private int maxRetries;
        private boolean canRetry;
        private boolean canSkip;
    }

    @lombok.Data
    @lombok.Builder
    public static class ActionTypeConfigDTO {
        private String actionType;
        private String displayName;
        private String description;
        private String helpText;
        private String icon;
        private String color;
        private String successMessage;
        private String errorMessage;
    }
}
