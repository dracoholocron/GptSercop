package com.globalcmx.api.clientportal.service;

import com.globalcmx.api.clientportal.dto.RetryPreviewResponse;
import com.globalcmx.api.clientportal.entity.ClientRequestReadModel;
import com.globalcmx.api.clientportal.entity.StageApprovalChain;
import com.globalcmx.api.clientportal.entity.StageApprovalChain.ApprovalStatus;
import com.globalcmx.api.clientportal.entity.StageRoleAssignment;
import com.globalcmx.api.clientportal.repository.ClientRequestReadModelRepository;
import com.globalcmx.api.clientportal.repository.StageApprovalChainRepository;
import com.globalcmx.api.clientportal.repository.StageRoleAssignmentRepository;
import com.globalcmx.api.dto.drools.RuleContext;
import com.globalcmx.api.dto.actions.ActionExecutionResult;
import com.globalcmx.api.externalapi.entity.ExternalApiCallLog;
import com.globalcmx.api.externalapi.repository.ExternalApiCallLogRepository;
import com.globalcmx.api.externalapi.repository.ExternalApiConfigRepository;
import com.globalcmx.api.externalapi.service.ExternalApiExecutorService;
import com.globalcmx.api.readmodel.entity.ReglaEventoReadModel;
import com.globalcmx.api.readmodel.repository.ReglaEventoReadModelRepository;
import com.globalcmx.api.service.EventActionExecutorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for managing stage permissions and multi-level approval chains.
 * All configuration is database-driven (CQRS pattern) - no hardcoded rules.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StageApprovalService {

    private final StageRoleAssignmentRepository roleAssignmentRepository;
    private final StageApprovalChainRepository approvalChainRepository;
    private final ClientRequestReadModelRepository requestRepository;
    private final ExternalApiCallLogRepository apiCallLogRepository;
    private final ExternalApiConfigRepository apiConfigRepository;
    private final ReglaEventoReadModelRepository ruleRepository;
    private final EventActionExecutorService eventActionExecutor;
    private final ExternalApiExecutorService externalApiExecutorService;

    // ==================== Permission Checking Methods ====================

    /**
     * Check if a user with given roles can view requests in a specific stage.
     */
    public boolean canUserViewStage(String stageCode, List<String> userRoles) {
        if (userRoles == null || userRoles.isEmpty()) {
            return false;
        }
        return userRoles.stream()
                .anyMatch(role -> roleAssignmentRepository.canRoleViewStage(stageCode, role));
    }

    /**
     * Check if a user with given roles can execute/process in a specific stage.
     */
    public boolean canUserExecuteInStage(String stageCode, List<String> userRoles) {
        if (userRoles == null || userRoles.isEmpty()) {
            return false;
        }
        return userRoles.stream()
                .anyMatch(role -> roleAssignmentRepository.canRoleExecuteInStage(stageCode, role));
    }

    /**
     * Check if a user with given roles can approve in a specific stage.
     */
    public boolean canUserApproveInStage(String stageCode, List<String> userRoles) {
        if (userRoles == null || userRoles.isEmpty()) {
            return false;
        }
        return userRoles.stream()
                .anyMatch(role -> roleAssignmentRepository.canRoleApproveInStage(stageCode, role));
    }

    /**
     * Check if a user with given roles can reject in a specific stage.
     */
    public boolean canUserRejectInStage(String stageCode, List<String> userRoles) {
        if (userRoles == null || userRoles.isEmpty()) {
            return false;
        }
        return userRoles.stream()
                .anyMatch(role -> roleAssignmentRepository.canRoleRejectInStage(stageCode, role));
    }

    /**
     * Check if a user with given roles can return a request to client in a specific stage.
     */
    public boolean canUserReturnInStage(String stageCode, List<String> userRoles) {
        if (userRoles == null || userRoles.isEmpty()) {
            return false;
        }
        return userRoles.stream()
                .anyMatch(role -> roleAssignmentRepository.canRoleReturnInStage(stageCode, role));
    }

    /**
     * Get all permissions for a user in a specific stage.
     */
    public Map<String, Boolean> getUserPermissionsForStage(String stageCode, List<String> userRoles) {
        Map<String, Boolean> permissions = new HashMap<>();
        permissions.put("canView", canUserViewStage(stageCode, userRoles));
        permissions.put("canExecute", canUserExecuteInStage(stageCode, userRoles));
        permissions.put("canApprove", canUserApproveInStage(stageCode, userRoles));
        permissions.put("canReject", canUserRejectInStage(stageCode, userRoles));
        permissions.put("canReturn", canUserReturnInStage(stageCode, userRoles));
        return permissions;
    }

    /**
     * Get all role assignments for a stage.
     */
    @Transactional(readOnly = true)
    public List<StageRoleAssignment> getStageRoleAssignments(String stageCode) {
        return roleAssignmentRepository.findByStageCodeAndIsActiveTrueOrderByApprovalLevelAsc(stageCode);
    }

    // ==================== Approval Chain Management ====================

    /**
     * Check if a stage requires multi-level approval.
     */
    public boolean stageRequiresApproval(String stageCode) {
        return roleAssignmentRepository.stageRequiresApproval(stageCode);
    }

    /**
     * Initialize approval chain for a request when entering APROBACION stage.
     * Creates pending approval entries for each required level.
     */
    @Transactional
    public void initializeApprovalChain(String requestId, String stageCode) {
        log.info("Initializing approval chain for request {} at stage {}", requestId, stageCode);

        // Delete any existing chain for this request/stage
        approvalChainRepository.deleteByRequestIdAndStageCode(requestId, stageCode);

        // Get approval levels for this stage
        List<StageRoleAssignment> approvers = roleAssignmentRepository.findApproversByStage(stageCode);

        if (approvers.isEmpty()) {
            log.info("No approval levels configured for stage {}", stageCode);
            return;
        }

        // Group by approval level and create chain entries
        Map<Integer, List<StageRoleAssignment>> byLevel = approvers.stream()
                .filter(a -> a.getApprovalLevel() != null)
                .collect(Collectors.groupingBy(StageRoleAssignment::getApprovalLevel));

        for (Map.Entry<Integer, List<StageRoleAssignment>> entry : byLevel.entrySet()) {
            Integer level = entry.getKey();
            // For each level, we can have multiple roles that can approve
            // We'll use the first role as the required role (any of them can approve)
            String requiredRole = entry.getValue().get(0).getRoleName();

            StageApprovalChain chainEntry = StageApprovalChain.builder()
                    .requestId(requestId)
                    .stageCode(stageCode)
                    .approvalLevel(level)
                    .requiredRole(requiredRole)
                    .status(ApprovalStatus.PENDING)
                    .build();

            approvalChainRepository.save(chainEntry);
            log.info("Created approval chain entry: level {} requires role {}", level, requiredRole);
        }
    }

    /**
     * Process approval from a user.
     * Returns true if all approvals are complete, false if more approvals are needed.
     */
    @Transactional
    public ApprovalResult processApproval(String requestId, String stageCode,
                                          String userId, String userName,
                                          List<String> userRoles, String comments) {
        log.info("Processing approval for request {} by user {} with roles {}", requestId, userId, userRoles);

        // Check if user can approve at current level
        Optional<StageApprovalChain> pendingApproval =
                approvalChainRepository.findNextPendingApprovalForUser(requestId, stageCode, userRoles);

        if (pendingApproval.isEmpty()) {
            return ApprovalResult.error("No pending approval available for your role at this time");
        }

        StageApprovalChain approval = pendingApproval.get();

        // Check amount limits if request has an amount
        ClientRequestReadModel request = requestRepository.findById(requestId).orElse(null);
        if (request != null && request.getAmount() != null) {
            boolean canApproveAmount = userRoles.stream().anyMatch(role -> {
                Optional<StageRoleAssignment> assignment =
                        roleAssignmentRepository.findApproverWithAmountCheck(stageCode, role, request.getAmount());
                return assignment.isPresent();
            });

            if (!canApproveAmount) {
                return ApprovalResult.error("Your approval limit does not cover this amount");
            }
        }

        // Mark as approved
        approval.approve(userId, userName, comments);
        approvalChainRepository.save(approval);

        log.info("Approval recorded: level {} approved by {}", approval.getApprovalLevel(), userName);

        // Check if all approvals are complete
        boolean allComplete = approvalChainRepository.areAllApprovalsComplete(requestId, stageCode);

        if (allComplete) {
            log.info("All approval levels complete for request {}", requestId);
            return ApprovalResult.allComplete("All approvals complete");
        }

        // Get next pending level
        Integer nextLevel = approvalChainRepository.getCurrentPendingLevel(requestId, stageCode);
        return ApprovalResult.needsMore("Approval recorded. Pending level: " + nextLevel, nextLevel);
    }

    /**
     * Process rejection from a user.
     */
    @Transactional
    public ApprovalResult processRejection(String requestId, String stageCode,
                                           String userId, String userName,
                                           List<String> userRoles, String comments) {
        log.info("Processing rejection for request {} by user {} with roles {}", requestId, userId, userRoles);

        // Check if user can reject
        boolean canReject = canUserRejectInStage(stageCode, userRoles);
        if (!canReject) {
            return ApprovalResult.error("You do not have permission to reject at this stage");
        }

        // Find and mark current pending approval as rejected
        Optional<StageApprovalChain> pendingApproval =
                approvalChainRepository.findFirstByRequestIdAndStageCodeAndStatusOrderByApprovalLevelAsc(
                        requestId, stageCode, ApprovalStatus.PENDING);

        if (pendingApproval.isPresent()) {
            StageApprovalChain approval = pendingApproval.get();
            approval.reject(userId, userName, comments);
            approvalChainRepository.save(approval);
        }

        log.info("Request {} rejected by {}", requestId, userName);
        return ApprovalResult.rejected("Request rejected");
    }

    /**
     * Get approval chain status for a request.
     */
    @Transactional(readOnly = true)
    public ApprovalChainStatus getApprovalChainStatus(String requestId, String stageCode) {
        List<StageApprovalChain> chain =
                approvalChainRepository.findByRequestIdAndStageCodeOrderByApprovalLevelAsc(requestId, stageCode);

        if (chain.isEmpty()) {
            return new ApprovalChainStatus(requestId, stageCode, Collections.emptyList(),
                    true, false, null);
        }

        boolean hasRejection = chain.stream().anyMatch(StageApprovalChain::isRejected);
        boolean allComplete = chain.stream().noneMatch(StageApprovalChain::isPending);
        Integer currentLevel = chain.stream()
                .filter(StageApprovalChain::isPending)
                .map(StageApprovalChain::getApprovalLevel)
                .min(Integer::compareTo)
                .orElse(null);

        return new ApprovalChainStatus(requestId, stageCode, chain, allComplete, hasRejection, currentLevel);
    }

    /**
     * Get pending approvals for a user based on their roles.
     */
    @Transactional(readOnly = true)
    public List<StageApprovalChain> getPendingApprovalsForUser(List<String> userRoles) {
        if (userRoles == null || userRoles.isEmpty()) {
            return Collections.emptyList();
        }
        return approvalChainRepository.findPendingByRoles(userRoles);
    }

    // ==================== Validation & Compliance Results ====================

    /**
     * Get validation results from external API call log for a request.
     * Filters by api_config_code prefix (CORE_BANKING_*).
     */
    @Transactional(readOnly = true)
    public List<ValidationResult> getValidationResults(String requestId) {
        List<ExternalApiCallLog> logs = apiCallLogRepository.findByOperationId(requestId);

        return logs.stream()
                .filter(log -> log.getApiConfigCode() != null &&
                              log.getApiConfigCode().startsWith("CORE_BANKING_"))
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::mapToValidationResult)
                .collect(Collectors.toList());
    }

    /**
     * Get configured validations for a specific stage, merged with execution results.
     * This shows what validations ARE EXPECTED and their current status (pending, passed, failed).
     */
    @Transactional(readOnly = true)
    public List<ValidationResult> getConfiguredValidationsWithResults(String requestId, String eventCode) {
        // Get configured rules for this event
        List<ReglaEventoReadModel> rules = ruleRepository
                .findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                        "CLIENT_REQUEST", eventCode, true);

        // Get executed results
        List<ExternalApiCallLog> executedLogs = apiCallLogRepository.findByOperationId(requestId);
        Map<String, ExternalApiCallLog> executedByApiCode = executedLogs.stream()
                .filter(l -> l.getApiConfigCode() != null)
                .collect(Collectors.toMap(
                        ExternalApiCallLog::getApiConfigCode,
                        l -> l,
                        (l1, l2) -> l1.getCreatedAt().isAfter(l2.getCreatedAt()) ? l1 : l2 // Keep latest
                ));

        List<ValidationResult> results = new ArrayList<>();

        // Parse actions from rules
        for (ReglaEventoReadModel rule : rules) {
            try {
                List<Map<String, Object>> actions = new com.fasterxml.jackson.databind.ObjectMapper().readValue(
                        rule.getAccionesJson(),
                        new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {});

                for (Map<String, Object> action : actions) {
                    String tipo = (String) action.get("tipo");
                    if (!"API_CALL".equals(tipo)) continue;

                    @SuppressWarnings("unchecked")
                    Map<String, Object> config = (Map<String, Object>) action.get("config");
                    if (config == null) continue;

                    String apiConfigCode = (String) config.get("apiConfigCode");
                    String description = (String) config.get("description");
                    if (apiConfigCode == null) continue;

                    // Check if this API was executed
                    ExternalApiCallLog executedLog = executedByApiCode.get(apiConfigCode);

                    ValidationResult result;
                    if (executedLog != null) {
                        result = mapToValidationResult(executedLog);
                    } else {
                        // Not executed yet - pending
                        result = ValidationResult.builder()
                                .checkCode(apiConfigCode)
                                .checkName(description != null ? description : getCheckNameFromCode(apiConfigCode))
                                .passed(false)
                                .message("Pendiente de ejecución")
                                .status("PENDING")
                                .executedAt(null)
                                .executionTimeMs(null)
                                .responseData(null)
                                .build();
                    }
                    results.add(result);
                }
            } catch (Exception e) {
                log.error("Error parsing rule actions: {}", e.getMessage());
            }
        }

        return results;
    }

    /**
     * Get configured compliance checks for a specific stage, merged with execution results.
     */
    @Transactional(readOnly = true)
    public List<ComplianceResult> getConfiguredComplianceWithResults(String requestId, String eventCode) {
        // Get configured rules for this event
        List<ReglaEventoReadModel> rules = ruleRepository
                .findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                        "CLIENT_REQUEST", eventCode, true);

        // Get executed results
        List<ExternalApiCallLog> executedLogs = apiCallLogRepository.findByOperationId(requestId);
        Map<String, ExternalApiCallLog> executedByApiCode = executedLogs.stream()
                .filter(l -> l.getApiConfigCode() != null)
                .collect(Collectors.toMap(
                        ExternalApiCallLog::getApiConfigCode,
                        l -> l,
                        (l1, l2) -> l1.getCreatedAt().isAfter(l2.getCreatedAt()) ? l1 : l2
                ));

        List<ComplianceResult> results = new ArrayList<>();

        for (ReglaEventoReadModel rule : rules) {
            try {
                List<Map<String, Object>> actions = new com.fasterxml.jackson.databind.ObjectMapper().readValue(
                        rule.getAccionesJson(),
                        new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {});

                for (Map<String, Object> action : actions) {
                    String tipo = (String) action.get("tipo");
                    if (!"API_CALL".equals(tipo)) continue;

                    @SuppressWarnings("unchecked")
                    Map<String, Object> config = (Map<String, Object>) action.get("config");
                    if (config == null) continue;

                    String apiConfigCode = (String) config.get("apiConfigCode");
                    String description = (String) config.get("description");
                    if (apiConfigCode == null) continue;

                    ExternalApiCallLog executedLog = executedByApiCode.get(apiConfigCode);

                    ComplianceResult result;
                    if (executedLog != null) {
                        result = mapToComplianceResult(executedLog);
                    } else {
                        result = ComplianceResult.builder()
                                .screeningCode(apiConfigCode)
                                .screeningName(description != null ? description : getScreeningNameFromCode(apiConfigCode))
                                .completed(false)
                                .hasMatch(false)
                                .riskLevel("UNKNOWN")
                                .status("PENDING")
                                .matchDetails(null)
                                .executedAt(null)
                                .executionTimeMs(null)
                                .responseData(null)
                                .build();
                    }
                    results.add(result);
                }
            } catch (Exception e) {
                log.error("Error parsing rule actions: {}", e.getMessage());
            }
        }

        return results;
    }

    /**
     * Get compliance/screening results from external API call log for a request.
     * Filters by api_config_code prefix (SCREENING_*).
     */
    @Transactional(readOnly = true)
    public List<ComplianceResult> getComplianceResults(String requestId) {
        List<ExternalApiCallLog> logs = apiCallLogRepository.findByOperationId(requestId);

        return logs.stream()
                .filter(log -> log.getApiConfigCode() != null &&
                              log.getApiConfigCode().startsWith("SCREENING_"))
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::mapToComplianceResult)
                .collect(Collectors.toList());
    }

    /**
     * Get all API call results for a request.
     */
    @Transactional(readOnly = true)
    public List<ExternalApiCallLog> getApiCallLogs(String requestId) {
        List<ExternalApiCallLog> logs = apiCallLogRepository.findByOperationId(requestId);
        logs.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        return logs;
    }

    // ==================== Event Rules Execution ====================

    /**
     * Execute event rules when transitioning to a new stage.
     * This triggers validation APIs, compliance checks, notifications, etc.
     */
    @Transactional
    public String executeStageTransitionRules(ClientRequestReadModel request, String eventCode, String userId) {
        log.info("Executing rules for stage transition: {} on request {}", eventCode, request.getId());

        // Build context for rule execution
        RuleContext context = buildRuleContext(request, userId);

        // Execute rules for CLIENT_REQUEST operation type
        return eventActionExecutor.executeRulesForEvent(
                "CLIENT_REQUEST",
                eventCode,
                request.getId(),
                request.getDraftId(),
                userId
        );
    }

    /**
     * Check if there are rules configured for a specific event.
     */
    public boolean hasRulesForEvent(String operationType, String eventCode) {
        List<ReglaEventoReadModel> rules = ruleRepository
                .findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                        operationType, eventCode, true);
        return !rules.isEmpty();
    }

    // ==================== Helper Methods ====================

    private RuleContext buildRuleContext(ClientRequestReadModel request, String userId) {
        RuleContext context = new RuleContext();
        context.setOperationId(request.getId() != null ? Long.parseLong(request.getId().hashCode() + "") : 0L);
        context.setOperationType(request.getProductType());
        context.setOperationAmount(request.getAmount() != null ? request.getAmount() : BigDecimal.ZERO);
        context.setCurrency(request.getCurrency());
        context.setOperationStatus(request.getStatus());
        context.setEventType(request.getInternalProcessingStage());
        context.setEventDateTime(LocalDateTime.now());
        context.setUserCode(userId);

        // Add additional data for template resolution
        Map<String, Object> additionalData = new HashMap<>();
        additionalData.put("requestId", request.getId());
        additionalData.put("requestNumber", request.getRequestNumber());
        additionalData.put("clientId", request.getClientId());
        additionalData.put("clientName", request.getClientName());
        additionalData.put("productType", request.getProductType());
        additionalData.put("amount", request.getAmount());
        additionalData.put("currency", request.getCurrency());
        context.setAdditionalData(additionalData);

        return context;
    }

    private ValidationResult mapToValidationResult(ExternalApiCallLog log) {
        return ValidationResult.builder()
                .checkCode(log.getApiConfigCode())
                .checkName(getCheckNameFromCode(log.getApiConfigCode()))
                .passed(log.getSuccess())
                .message(log.getSuccess() ? "Verificación exitosa" : log.getErrorMessage())
                .status(log.getSuccess() ? "PASSED" : "FAILED")
                .executedAt(log.getCreatedAt())
                .executionTimeMs(log.getExecutionTimeMs())
                .responseData(log.getResponseBody())
                .build();
    }

    private ComplianceResult mapToComplianceResult(ExternalApiCallLog log) {
        boolean hasMatch = false;
        String riskLevel = "LOW";
        String matchDetails = null;
        String status = log.getSuccess() ? "CLEAR" : "ERROR";

        // Parse response to check for matches
        if (log.getResponseBody() != null) {
            String response = log.getResponseBody().toLowerCase();
            if (response.contains("\"matchfound\":true") || response.contains("\"match_found\":true")) {
                hasMatch = true;
                riskLevel = "HIGH";
                status = "MATCH";
            }
            if (response.contains("\"risklevel\":\"high\"") || response.contains("\"risk_level\":\"high\"")) {
                riskLevel = "HIGH";
            } else if (response.contains("\"risklevel\":\"medium\"") || response.contains("\"risk_level\":\"medium\"")) {
                riskLevel = "MEDIUM";
            }
        }

        return ComplianceResult.builder()
                .screeningCode(log.getApiConfigCode())
                .screeningName(getScreeningNameFromCode(log.getApiConfigCode()))
                .completed(log.getSuccess())
                .hasMatch(hasMatch)
                .riskLevel(riskLevel)
                .status(status)
                .matchDetails(matchDetails)
                .executedAt(log.getCreatedAt())
                .executionTimeMs(log.getExecutionTimeMs())
                .responseData(log.getResponseBody())
                .build();
    }

    private String getCheckNameFromCode(String code) {
        if (code == null) return "Unknown";
        return switch (code) {
            case "CORE_BANKING_CLIENT_CHECK" -> "Cliente en Core Bancario";
            case "CORE_BANKING_CREDIT_LINE" -> "Línea de Crédito";
            case "CORE_BANKING_LIMIT_CHECK" -> "Verificación de Límites";
            case "CORE_BANKING_BLOCKS_CHECK" -> "Bloqueos Operativos";
            case "CORE_BANKING_ACCOUNT_CHECK" -> "Cuenta Destino";
            default -> code.replace("CORE_BANKING_", "").replace("_", " ");
        };
    }

    private String getScreeningNameFromCode(String code) {
        if (code == null) return "Unknown";
        return switch (code) {
            case "SCREENING_OFAC_SDN" -> "OFAC - Lista SDN";
            case "SCREENING_UN_CONSOLIDATED" -> "ONU - Lista Consolidada";
            case "SCREENING_UAFE_NACIONAL" -> "UAFE - Lista Nacional";
            case "SCREENING_INTERNAL_LIST" -> "Lista Interna Banco";
            case "SCREENING_PEPS" -> "Personas Expuestas Políticamente (PEPs)";
            case "SCREENING_ADVERSE_MEDIA" -> "Medios Adversos";
            default -> code.replace("SCREENING_", "").replace("_", " ");
        };
    }

    // ==================== Retry / Skip / History ====================

    /**
     * Retry a specific validation check by re-executing the external API.
     */
    @Transactional
    public ValidationResult retryValidation(String requestId, String apiConfigCode, String userId) {
        log.info("Retrying validation {} for request {} by {}", apiConfigCode, requestId, userId);

        ClientRequestReadModel request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        RuleContext context = buildRuleContext(request, userId);
        ActionExecutionResult apiResult = externalApiExecutorService.executeWithOperationId(
                apiConfigCode, context, requestId);

        // Fetch the latest log entry created by the execution
        List<ExternalApiCallLog> logs = apiCallLogRepository.findByOperationId(requestId);
        ExternalApiCallLog latestLog = logs.stream()
                .filter(l -> apiConfigCode.equals(l.getApiConfigCode()))
                .max(Comparator.comparing(ExternalApiCallLog::getCreatedAt))
                .orElse(null);

        if (latestLog != null) {
            return mapToValidationResult(latestLog);
        }

        boolean ok = Boolean.TRUE.equals(apiResult.getSuccess());
        return ValidationResult.builder()
                .checkCode(apiConfigCode)
                .checkName(getCheckNameFromCode(apiConfigCode))
                .passed(ok)
                .message(ok ? "Verificación exitosa" : apiResult.getErrorMessage())
                .status(ok ? "PASSED" : "FAILED")
                .executedAt(LocalDateTime.now())
                .executionTimeMs(null)
                .build();
    }

    /**
     * Skip a validation check and document the reason.
     * Creates a log entry marked as success with skip metadata.
     */
    @Transactional
    public void skipValidation(String requestId, String apiConfigCode, String reason, String userId, String userName) {
        log.info("Skipping validation {} for request {} by {} with reason: {}", apiConfigCode, requestId, userName, reason);

        Long configId = apiConfigRepository.findIdByCode(apiConfigCode).orElse(0L);

        ExternalApiCallLog skipLog = ExternalApiCallLog.builder()
                .apiConfigId(configId)
                .apiConfigCode(apiConfigCode)
                .requestUrl("SKIPPED")
                .requestMethod("SKIP")
                .responseStatusCode(200)
                .responseBody(String.format("{\"skipped\":true,\"reason\":\"%s\",\"skippedBy\":\"%s\",\"skippedByName\":\"%s\"}",
                        reason.replace("\"", "\\\""), userId, userName != null ? userName.replace("\"", "\\\"") : ""))
                .executionTimeMs(0L)
                .attemptNumber(0)
                .success(true)
                .errorMessage(null)
                .correlationId(UUID.randomUUID().toString())
                .operationId(requestId)
                .operationType("CLIENT_REQUEST")
                .eventType("SKIP_VALIDATION")
                .triggeredBy(userId)
                .build();

        apiCallLogRepository.save(skipLog);
    }

    /**
     * Retry a specific compliance screening by re-executing the external API.
     */
    @Transactional
    public ComplianceResult retryCompliance(String requestId, String apiConfigCode, String userId) {
        log.info("Retrying compliance {} for request {} by {}", apiConfigCode, requestId, userId);

        ClientRequestReadModel request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        RuleContext context = buildRuleContext(request, userId);
        ActionExecutionResult apiResult = externalApiExecutorService.executeWithOperationId(
                apiConfigCode, context, requestId);

        List<ExternalApiCallLog> logs = apiCallLogRepository.findByOperationId(requestId);
        ExternalApiCallLog latestLog = logs.stream()
                .filter(l -> apiConfigCode.equals(l.getApiConfigCode()))
                .max(Comparator.comparing(ExternalApiCallLog::getCreatedAt))
                .orElse(null);

        if (latestLog != null) {
            return mapToComplianceResult(latestLog);
        }

        boolean ok = Boolean.TRUE.equals(apiResult.getSuccess());
        return ComplianceResult.builder()
                .screeningCode(apiConfigCode)
                .screeningName(getScreeningNameFromCode(apiConfigCode))
                .completed(ok)
                .hasMatch(false)
                .riskLevel("UNKNOWN")
                .status(ok ? "CLEAR" : "ERROR")
                .executedAt(LocalDateTime.now())
                .executionTimeMs(null)
                .build();
    }

    /**
     * Skip a compliance screening and document the reason.
     */
    @Transactional
    public void skipCompliance(String requestId, String apiConfigCode, String reason, String userId, String userName) {
        log.info("Skipping compliance {} for request {} by {} with reason: {}", apiConfigCode, requestId, userName, reason);

        Long configId = apiConfigRepository.findIdByCode(apiConfigCode).orElse(0L);

        ExternalApiCallLog skipLog = ExternalApiCallLog.builder()
                .apiConfigId(configId)
                .apiConfigCode(apiConfigCode)
                .requestUrl("SKIPPED")
                .requestMethod("SKIP")
                .responseStatusCode(200)
                .responseBody(String.format("{\"skipped\":true,\"reason\":\"%s\",\"skippedBy\":\"%s\",\"skippedByName\":\"%s\"}",
                        reason.replace("\"", "\\\""), userId, userName != null ? userName.replace("\"", "\\\"") : ""))
                .executionTimeMs(0L)
                .attemptNumber(0)
                .success(true)
                .errorMessage(null)
                .correlationId(UUID.randomUUID().toString())
                .operationId(requestId)
                .operationType("CLIENT_REQUEST")
                .eventType("SKIP_COMPLIANCE")
                .triggeredBy(userId)
                .build();

        apiCallLogRepository.save(skipLog);
    }

    /**
     * Get the complete API call log history for a specific check on a request.
     * Returns all attempts (including retries and skips) sorted by date descending.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getApiCallHistory(String requestId, String apiConfigCode) {
        List<ExternalApiCallLog> logs = apiCallLogRepository.findByOperationId(requestId);

        return logs.stream()
                .filter(l -> apiConfigCode.equals(l.getApiConfigCode()))
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(logEntry -> {
                    Map<String, Object> entry = new HashMap<>();
                    entry.put("id", logEntry.getId());
                    entry.put("apiConfigCode", logEntry.getApiConfigCode());
                    entry.put("requestMethod", logEntry.getRequestMethod());
                    entry.put("requestUrl", logEntry.getRequestUrl());
                    entry.put("responseStatusCode", logEntry.getResponseStatusCode());
                    entry.put("executionTimeMs", logEntry.getExecutionTimeMs());
                    entry.put("attemptNumber", logEntry.getAttemptNumber());
                    entry.put("success", logEntry.getSuccess());
                    entry.put("errorMessage", logEntry.getErrorMessage());
                    entry.put("correlationId", logEntry.getCorrelationId());
                    entry.put("eventType", logEntry.getEventType());
                    entry.put("triggeredBy", logEntry.getTriggeredBy());
                    entry.put("createdAt", logEntry.getCreatedAt());
                    entry.put("responseBody", logEntry.getResponseBody());

                    // Parse skip info if it was a skip
                    if ("SKIP".equals(logEntry.getRequestMethod())) {
                        entry.put("skipped", true);
                        try {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> responseData = new com.fasterxml.jackson.databind.ObjectMapper()
                                    .readValue(logEntry.getResponseBody(), Map.class);
                            entry.put("skipReason", responseData.get("reason"));
                            entry.put("skippedByName", responseData.get("skippedByName"));
                        } catch (Exception e) {
                            // Ignore parse errors
                        }
                    } else {
                        entry.put("skipped", false);
                    }

                    return entry;
                })
                .collect(Collectors.toList());
    }

    // ==================== Retry Preview & Override Methods ====================

    /**
     * Build a preview of the data that will be sent to the external API on retry.
     * Returns editable context data so the user can modify values before re-executing.
     */
    @Transactional(readOnly = true)
    public RetryPreviewResponse getRetryPreview(String requestId, String apiConfigCode, String userId) {
        log.info("Building retry preview for {} on request {} by {}", apiConfigCode, requestId, userId);

        ClientRequestReadModel request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        // Use JPQL scalar projections to avoid OneToOne proxy issues with responseConfig
        List<Object[]> basicResults = apiConfigRepository.findBasicFieldsByCode(apiConfigCode);
        if (basicResults.isEmpty()) {
            throw new IllegalArgumentException("API config not found: " + apiConfigCode);
        }
        Object[] basicFields = basicResults.get(0);

        String apiName = (String) basicFields[0];
        String httpMethod = String.valueOf(basicFields[1]); // enum → String
        String baseUrl = (String) basicFields[2];
        String path = (String) basicFields[3];

        // Load body template separately via JPQL (no entity loading)
        List<String> bodyTemplates = apiConfigRepository.findBodyTemplatesByApiCode(apiConfigCode);
        String bodyTemplate = bodyTemplates.isEmpty() ? null : bodyTemplates.get(0);

        // Build context data (LinkedHashMap preserves insertion order)
        Map<String, Object> contextData = new LinkedHashMap<>();
        contextData.put("requestId", request.getId());
        contextData.put("requestNumber", request.getRequestNumber());
        contextData.put("clientId", request.getClientId());
        contextData.put("clientName", request.getClientName());
        contextData.put("productType", request.getProductType());
        contextData.put("amount", request.getAmount());
        contextData.put("currency", request.getCurrency());

        // Build field labels
        Map<String, String> fieldLabels = new LinkedHashMap<>();
        fieldLabels.put("requestId", "ID Solicitud");
        fieldLabels.put("requestNumber", "Número Solicitud");
        fieldLabels.put("clientId", "ID Cliente");
        fieldLabels.put("clientName", "Nombre Cliente");
        fieldLabels.put("productType", "Tipo Producto");
        fieldLabels.put("amount", "Monto");
        fieldLabels.put("currency", "Moneda");

        // Resolve URL
        String resolvedUrl = baseUrl;
        if (path != null) {
            resolvedUrl += path;
        }

        return RetryPreviewResponse.builder()
                .apiConfigCode(apiConfigCode)
                .apiName(apiName)
                .httpMethod(httpMethod)
                .resolvedUrl(resolvedUrl)
                .bodyTemplate(bodyTemplate)
                .contextData(contextData)
                .fieldLabels(fieldLabels)
                .build();
    }

    /**
     * Retry a validation check with optional context overrides.
     * Overrides allow the user to modify field values before re-executing.
     */
    @Transactional
    public ValidationResult retryValidation(String requestId, String apiConfigCode, String userId,
                                            Map<String, Object> contextOverrides) {
        log.info("Retrying validation {} for request {} by {} with overrides: {}",
                apiConfigCode, requestId, userId, contextOverrides != null ? contextOverrides.keySet() : "none");

        ClientRequestReadModel request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        RuleContext context = buildRuleContext(request, userId);

        // Merge overrides into context
        if (contextOverrides != null && !contextOverrides.isEmpty()) {
            Map<String, Object> additionalData = context.getAdditionalData();
            if (additionalData == null) {
                additionalData = new HashMap<>();
                context.setAdditionalData(additionalData);
            }
            additionalData.putAll(contextOverrides);

            // Update top-level context fields if overridden
            if (contextOverrides.containsKey("currency")) {
                context.setCurrency(String.valueOf(contextOverrides.get("currency")));
            }
            if (contextOverrides.containsKey("amount")) {
                try {
                    context.setOperationAmount(new java.math.BigDecimal(String.valueOf(contextOverrides.get("amount"))));
                } catch (Exception e) {
                    log.warn("Could not parse overridden amount: {}", contextOverrides.get("amount"));
                }
            }
        }

        externalApiExecutorService.executeWithOperationId(apiConfigCode, context, requestId);

        // Fetch the latest log entry created by the execution
        List<ExternalApiCallLog> logs = apiCallLogRepository.findByOperationId(requestId);
        ExternalApiCallLog latestLog = logs.stream()
                .filter(l -> apiConfigCode.equals(l.getApiConfigCode()))
                .max(Comparator.comparing(ExternalApiCallLog::getCreatedAt))
                .orElse(null);

        if (latestLog != null) {
            return mapToValidationResult(latestLog);
        }

        return ValidationResult.builder()
                .checkCode(apiConfigCode)
                .checkName(getCheckNameFromCode(apiConfigCode))
                .passed(false)
                .message("Execution completed but no log entry found")
                .status("FAILED")
                .executedAt(LocalDateTime.now())
                .build();
    }

    /**
     * Retry a compliance screening with optional context overrides.
     */
    @Transactional
    public ComplianceResult retryCompliance(String requestId, String apiConfigCode, String userId,
                                            Map<String, Object> contextOverrides) {
        log.info("Retrying compliance {} for request {} by {} with overrides: {}",
                apiConfigCode, requestId, userId, contextOverrides != null ? contextOverrides.keySet() : "none");

        ClientRequestReadModel request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        RuleContext context = buildRuleContext(request, userId);

        // Merge overrides into context
        if (contextOverrides != null && !contextOverrides.isEmpty()) {
            Map<String, Object> additionalData = context.getAdditionalData();
            if (additionalData == null) {
                additionalData = new HashMap<>();
                context.setAdditionalData(additionalData);
            }
            additionalData.putAll(contextOverrides);

            if (contextOverrides.containsKey("currency")) {
                context.setCurrency(String.valueOf(contextOverrides.get("currency")));
            }
            if (contextOverrides.containsKey("amount")) {
                try {
                    context.setOperationAmount(new java.math.BigDecimal(String.valueOf(contextOverrides.get("amount"))));
                } catch (Exception e) {
                    log.warn("Could not parse overridden amount: {}", contextOverrides.get("amount"));
                }
            }
        }

        externalApiExecutorService.executeWithOperationId(apiConfigCode, context, requestId);

        List<ExternalApiCallLog> logs = apiCallLogRepository.findByOperationId(requestId);
        ExternalApiCallLog latestLog = logs.stream()
                .filter(l -> apiConfigCode.equals(l.getApiConfigCode()))
                .max(Comparator.comparing(ExternalApiCallLog::getCreatedAt))
                .orElse(null);

        if (latestLog != null) {
            return mapToComplianceResult(latestLog);
        }

        return ComplianceResult.builder()
                .screeningCode(apiConfigCode)
                .screeningName(getScreeningNameFromCode(apiConfigCode))
                .completed(false)
                .hasMatch(false)
                .riskLevel("UNKNOWN")
                .status("ERROR")
                .executedAt(LocalDateTime.now())
                .build();
    }

    // ==================== Result Classes ====================

    /**
     * Result of an approval/rejection operation.
     */
    @lombok.Data
    @lombok.AllArgsConstructor
    public static class ApprovalResult {
        private final boolean success;
        private final boolean allComplete;
        private final boolean rejected;
        private final String message;
        private final Integer nextPendingLevel;

        public static ApprovalResult allComplete(String message) {
            return new ApprovalResult(true, true, false, message, null);
        }

        public static ApprovalResult needsMore(String message, Integer nextLevel) {
            return new ApprovalResult(true, false, false, message, nextLevel);
        }

        public static ApprovalResult rejected(String message) {
            return new ApprovalResult(true, false, true, message, null);
        }

        public static ApprovalResult error(String message) {
            return new ApprovalResult(false, false, false, message, null);
        }
    }

    /**
     * Status of an approval chain.
     */
    @lombok.Data
    @lombok.AllArgsConstructor
    public static class ApprovalChainStatus {
        private final String requestId;
        private final String stageCode;
        private final List<StageApprovalChain> approvals;
        private final boolean allComplete;
        private final boolean hasRejection;
        private final Integer currentPendingLevel;
    }

    /**
     * Result of a validation check.
     */
    @lombok.Data
    @lombok.Builder
    public static class ValidationResult {
        private String checkCode;
        private String checkName;
        private boolean passed;
        private String message;
        private String status; // PENDING, PASSED, FAILED
        private LocalDateTime executedAt;
        private Long executionTimeMs;
        private String responseData;
    }

    /**
     * Result of a compliance/screening check.
     */
    @lombok.Data
    @lombok.Builder
    public static class ComplianceResult {
        private String screeningCode;
        private String screeningName;
        private boolean completed;
        private boolean hasMatch;
        private String riskLevel;
        private String status; // PENDING, CLEAR, MATCH, ERROR
        private String matchDetails;
        private LocalDateTime executedAt;
        private Long executionTimeMs;
        private String responseData;
    }
}
