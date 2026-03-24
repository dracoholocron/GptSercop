package com.globalcmx.api.service;

import com.globalcmx.api.dto.command.ReviewApprovalCommand;
import com.globalcmx.api.dto.command.SubmitEventForApprovalCommand;
import com.globalcmx.api.dto.query.PendingApprovalDTO;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.readmodel.entity.*;
import com.globalcmx.api.readmodel.repository.*;
import com.globalcmx.api.dto.command.ExecuteEventCommand;
import com.globalcmx.api.security.config.entity.FourEyesConfig;
import com.globalcmx.api.security.config.repository.FourEyesConfigRepository;
import com.globalcmx.api.security.entity.RiskEvent;
import com.globalcmx.api.security.entity.RiskThreshold;
import com.globalcmx.api.security.service.RiskEngineService;
import com.globalcmx.api.security.service.RiskEngineService.RiskContext;
import com.globalcmx.api.security.service.RiskEngineService.RiskEvaluationResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Command service for pending approvals (CQRS Write side).
 * Handles submission and review of pending approvals.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PendingApprovalCommandService {

    private final PendingEventApprovalRepository approvalRepository;
    private final OperationReadModelRepository operationRepository;
    private final SwiftDraftReadModelRepository draftRepository;
    private final EventTypeConfigReadModelRepository eventTypeRepository;
    private final ReglaEventoReadModelRepository ruleRepository;
    private final EventStoreService eventStoreService;
    private final OperationCommandService operationCommandService;
    private final SwiftFieldConfigRepository swiftFieldConfigRepository;
    private final RiskEngineService riskEngineService;
    private final FourEyesConfigRepository fourEyesConfigRepository;
    private final com.globalcmx.api.service.query.OperationAnalyzerService operationAnalyzerService;

    /**
     * Submit an event for approval.
     * Called when an event with requiresApproval=true is executed.
     */
    @Transactional
    public PendingApprovalDTO submitForApproval(SubmitEventForApprovalCommand command) {
        log.info("Submitting event for approval: {} on operation: {}",
                 command.getEventCode(), command.getOperationId());

        // Determine approval type
        String approvalType = command.getOperationId() != null ? "OPERATION_EVENT" : "NEW_OPERATION";

        // Get context based on type
        String productType;
        String reference;
        String currency = null;
        java.math.BigDecimal amount = null;
        String applicantName = null;
        String beneficiaryName = null;
        String swiftMessage = null;
        String messageType = null;

        if ("OPERATION_EVENT".equals(approvalType)) {
            // Get operation details
            OperationReadModel operation = operationRepository.findByOperationId(command.getOperationId())
                    .orElseThrow(() -> new RuntimeException("Operation not found: " + command.getOperationId()));

            // Check if there's already a pending approval for this event
            if (approvalRepository.existsByOperationIdAndEventCodeAndStatus(
                    command.getOperationId(), command.getEventCode(), "PENDING")) {
                throw new RuntimeException("There is already a pending approval for this event");
            }

            productType = operation.getProductType();
            reference = operation.getReference();
            currency = operation.getCurrency();
            amount = operation.getAmount();
            applicantName = operation.getApplicantName();
            beneficiaryName = operation.getBeneficiaryName();
            messageType = operation.getMessageType();

            // Get event config to check for outbound message type (e.g., MT707 for amendments)
            EventTypeConfigReadModel eventConfigForMessage = eventTypeRepository
                    .findByEventCodeAndOperationTypeAndLanguage(command.getEventCode(), productType, "en")
                    .orElse(null);

            // If this is an amendment (has outbound message type like MT707) and has eventData,
            // generate the SWIFT message with the amended data
            if (eventConfigForMessage != null && eventConfigForMessage.getOutboundMessageType() != null
                    && command.getEventData() != null && !command.getEventData().isEmpty()) {
                String outboundType = eventConfigForMessage.getOutboundMessageType();
                swiftMessage = buildAmendmentSwiftContent(outboundType, command.getEventData(), operation);
                log.info("Generated amendment SWIFT message {} for approval preview", outboundType);
            } else {
                swiftMessage = operation.getSwiftMessage();
            }

        } else {
            // Get draft details
            SwiftDraftReadModel draft = draftRepository.findByDraftId(command.getDraftId())
                    .orElseThrow(() -> new RuntimeException("Draft not found: " + command.getDraftId()));

            productType = draft.getProductType();
            reference = draft.getReference();
            currency = draft.getCurrency();
            amount = draft.getAmount();
            swiftMessage = draft.getSwiftMessage();
            messageType = draft.getMessageType();
        }

        // Get event configuration for display
        EventTypeConfigReadModel eventConfig = eventTypeRepository
                .findByEventCodeAndOperationTypeAndLanguage(command.getEventCode(), productType, "es")
                .or(() -> eventTypeRepository.findByEventCodeAndOperationTypeAndLanguage(
                        command.getEventCode(), productType, "en"))
                .orElse(null);

        String eventName = eventConfig != null ? eventConfig.getEventName() : command.getEventCode();
        String eventDescription = eventConfig != null ? eventConfig.getEventDescription() : null;
        String icon = eventConfig != null ? eventConfig.getIcon() : "FiPlay";
        String color = eventConfig != null ? eventConfig.getColor() : "blue";
        String outboundMessageType = eventConfig != null ? eventConfig.getOutboundMessageType() : null;

        // Generate approval ID
        String approvalId = generateApprovalId(productType);

        // Evaluate risk for this operation
        RiskEvaluationResult riskResult = evaluateRiskForApproval(command, productType, amount);
        List<Map<String, Object>> triggeredRulesData = convertTriggeredRulesToMaps(riskResult);
        String riskLevel = calculateRiskLevel(riskResult.getTotalScore());
        String approvalInstructions = generateApprovalInstructions(riskResult, riskLevel);

        // Get required approvers from 4-eyes config
        int requiredApprovers = getRequiredApprovers(productType, command.getEventCode(), amount);

        // Create pending approval
        PendingEventApprovalReadModel approval = PendingEventApprovalReadModel.builder()
                .approvalId(approvalId)
                .approvalType(approvalType)
                .status("PENDING")
                .operationId(command.getOperationId())
                .draftId(command.getDraftId())
                .productType(productType)
                .reference(reference)
                .eventCode(command.getEventCode())
                .eventName(eventName)
                .eventDescription(eventDescription)
                .messageType(outboundMessageType != null ? outboundMessageType : messageType)
                .swiftMessage(swiftMessage)
                .eventData(command.getEventData())
                .submitterComments(command.getComments())
                .currency(currency)
                .amount(amount)
                .applicantName(applicantName)
                .beneficiaryName(beneficiaryName)
                .submittedBy(command.getSubmittedBy())
                .submittedAt(LocalDateTime.now())
                .icon(icon)
                .color(color)
                .priority(command.getPriority())
                // Risk evaluation data
                .riskScore(riskResult.getTotalScore())
                .riskLevel(riskLevel)
                .triggeredRiskRules(triggeredRulesData)
                .riskAction(riskResult.getAction() != null ? riskResult.getAction().name() : "ALLOW")
                .approvalInstructions(approvalInstructions)
                .riskTriggered(riskResult.getTotalScore() > 0)
                // Multi-approver support
                .requiredApprovers(requiredApprovers)
                .currentApprovalCount(0)
                .approvalHistory(new ArrayList<>())
                .build();

        approval = approvalRepository.save(approval);

        // Save event to event store
        Map<String, Object> eventData = new HashMap<>();
        eventData.put("approvalId", approvalId);
        eventData.put("approvalType", approvalType);
        eventData.put("operationId", command.getOperationId());
        eventData.put("draftId", command.getDraftId());
        eventData.put("eventCode", command.getEventCode());
        eventData.put("submittedBy", command.getSubmittedBy());

        eventStoreService.saveEvent(
                approvalId,
                "PENDING_APPROVAL",
                "EVENT_SUBMITTED_FOR_APPROVAL",
                eventData,
                command.getSubmittedBy()
        );

        log.info("Event submitted for approval: {}", approvalId);
        return toDTO(approval);
    }

    /**
     * Review (approve or reject) a pending approval.
     */
    @Transactional
    public PendingApprovalDTO reviewApproval(ReviewApprovalCommand command) {
        log.info("Reviewing approval: {} with action: {}", command.getApprovalId(), command.getAction());

        PendingEventApprovalReadModel approval = approvalRepository.findByApprovalId(command.getApprovalId())
                .orElseThrow(() -> new RuntimeException("Approval not found: " + command.getApprovalId()));

        if (!"PENDING".equals(approval.getStatus())) {
            throw new RuntimeException("Approval is not in PENDING status");
        }

        // Prevent self-approval
        if (approval.getSubmittedBy().equals(command.getReviewedBy())) {
            throw new RuntimeException("Cannot approve your own submission");
        }

        if ("APPROVE".equals(command.getAction())) {
            return approveEvent(approval, command);
        } else if ("REJECT".equals(command.getAction())) {
            return rejectEvent(approval, command);
        } else {
            throw new RuntimeException("Invalid action: " + command.getAction());
        }
    }

    /**
     * Approve an event. Handles multi-approver scenarios.
     */
    private PendingApprovalDTO approveEvent(PendingEventApprovalReadModel approval, ReviewApprovalCommand command) {
        log.info("Processing approval for: {} by user: {}", approval.getApprovalId(), command.getReviewedBy());

        // Check if this user has already approved
        if (hasUserAlreadyApproved(approval, command.getReviewedBy())) {
            throw new RuntimeException("You have already approved this item");
        }

        // Increment approval count
        int newCount = (approval.getCurrentApprovalCount() != null ? approval.getCurrentApprovalCount() : 0) + 1;
        approval.setCurrentApprovalCount(newCount);

        // Add to approval history
        List<Map<String, Object>> history = approval.getApprovalHistory();
        if (history == null) {
            history = new ArrayList<>();
        }
        Map<String, Object> approvalRecord = new HashMap<>();
        approvalRecord.put("user", command.getReviewedBy());
        approvalRecord.put("timestamp", LocalDateTime.now().toString());
        approvalRecord.put("comments", command.getComments());
        history.add(approvalRecord);
        approval.setApprovalHistory(history);

        int requiredApprovers = approval.getRequiredApprovers() != null ? approval.getRequiredApprovers() : 1;
        boolean isFullyApproved = newCount >= requiredApprovers;

        log.info("Approval progress: {}/{} approvers for {}", newCount, requiredApprovers, approval.getApprovalId());

        if (isFullyApproved) {
            // All required approvals received - execute the event
            log.info("All approvals received, executing event: {}", approval.getApprovalId());

            if ("OPERATION_EVENT".equals(approval.getApprovalType())) {
                // Execute event on operation
                ExecuteEventCommand executeCommand = new ExecuteEventCommand();
                executeCommand.setOperationId(approval.getOperationId());
                executeCommand.setEventCode(approval.getEventCode());
                executeCommand.setEventData(approval.getEventData());
                executeCommand.setComments(approval.getSubmitterComments());
                executeCommand.setExecutedBy(command.getReviewedBy());
                executeCommand.setSkipSwiftGeneration(true); // Post-approval rules will generate SWIFT

                operationCommandService.executeEvent(executeCommand);

            } else if ("NEW_OPERATION".equals(approval.getApprovalType())) {
                log.info("New operation approval - draft will be approved through draft service");
            }

            // Update approval status to APPROVED
            approval.setStatus("APPROVED");
            approval.setReviewedBy(command.getReviewedBy());
            approval.setReviewedAt(LocalDateTime.now());
            approval.setReviewComments(command.getComments());

        } else {
            // Still waiting for more approvals - keep as PENDING
            log.info("Waiting for more approvals: {}/{} for {}", newCount, requiredApprovers, approval.getApprovalId());
            // Status remains PENDING, but we store partial approval info
        }

        approval = approvalRepository.save(approval);

        // Save event to event store
        Map<String, Object> eventData = new HashMap<>();
        eventData.put("approvalId", approval.getApprovalId());
        eventData.put("action", isFullyApproved ? "APPROVED" : "PARTIAL_APPROVAL");
        eventData.put("reviewedBy", command.getReviewedBy());
        eventData.put("comments", command.getComments());
        eventData.put("currentCount", newCount);
        eventData.put("requiredCount", requiredApprovers);

        eventStoreService.saveEvent(
                approval.getApprovalId(),
                "PENDING_APPROVAL",
                isFullyApproved ? "APPROVAL_APPROVED" : "APPROVAL_PARTIAL",
                eventData,
                command.getReviewedBy()
        );

        if (isFullyApproved) {
            log.info("Event fully approved: {}", approval.getApprovalId());

            // Resync: re-extraer parties del SWIFT al readmodel (contingencia)
            try {
                operationAnalyzerService.resyncOperationFromSwift(approval.getOperationId());
            } catch (Exception e) {
                log.warn("Error during resync after approval for {}: {}", approval.getOperationId(), e.getMessage());
            }
        } else {
            log.info("Partial approval recorded: {}/{} for {}", newCount, requiredApprovers, approval.getApprovalId());
        }

        // Build response with post-approval actions info
        PendingApprovalDTO dto = toDTO(approval);

        // Check for post-approval actions
        String triggerEvent = approval.getEventCode() + "_APPROVED";
        List<ReglaEventoReadModel> rules = ruleRepository
                .findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                        approval.getProductType(), triggerEvent, true);

        if (!rules.isEmpty()) {
            int actionCount = 0;
            for (ReglaEventoReadModel rule : rules) {
                try {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    List<?> actions = mapper.readValue(rule.getAccionesJson(), List.class);
                    actionCount += actions.size();
                } catch (Exception e) {
                    log.warn("Error parsing actions for rule {}: {}", rule.getCodigo(), e.getMessage());
                }
            }
            dto.setHasPostApprovalActions(true);
            dto.setPostApprovalActionCount(actionCount);
            dto.setPostApprovalTriggerEvent(triggerEvent);
        }

        return dto;
    }

    /**
     * Reject an event.
     */
    private PendingApprovalDTO rejectEvent(PendingEventApprovalReadModel approval, ReviewApprovalCommand command) {
        log.info("Rejecting event: {}", approval.getApprovalId());

        if (command.getRejectionReason() == null || command.getRejectionReason().isBlank()) {
            throw new RuntimeException("Rejection reason is required");
        }

        // Update approval status
        approval.setStatus("REJECTED");
        approval.setReviewedBy(command.getReviewedBy());
        approval.setReviewedAt(LocalDateTime.now());
        approval.setReviewComments(command.getComments());
        approval.setRejectionReason(command.getRejectionReason());

        // Enrich and save per-field comments with metadata
        if (command.getFieldComments() != null && !command.getFieldComments().isEmpty()) {
            Map<String, Object> enrichedComments = new HashMap<>();
            String now = LocalDateTime.now().toString();
            for (Map.Entry<String, Object> entry : command.getFieldComments().entrySet()) {
                Map<String, Object> commentData = new HashMap<>();
                if (entry.getValue() instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> original = (Map<String, Object>) entry.getValue();
                    commentData.put("comment", original.getOrDefault("comment", ""));
                } else {
                    commentData.put("comment", String.valueOf(entry.getValue()));
                }
                commentData.put("commentedAt", now);
                commentData.put("commentedBy", command.getReviewedBy());
                enrichedComments.put(entry.getKey(), commentData);
            }
            approval.setFieldComments(enrichedComments);
        }

        approval = approvalRepository.save(approval);

        // Save event to event store
        Map<String, Object> eventData = new HashMap<>();
        eventData.put("approvalId", approval.getApprovalId());
        eventData.put("action", "REJECTED");
        eventData.put("reviewedBy", command.getReviewedBy());
        eventData.put("rejectionReason", command.getRejectionReason());
        if (approval.getFieldComments() != null) {
            eventData.put("fieldComments", approval.getFieldComments());
        }

        eventStoreService.saveEvent(
                approval.getApprovalId(),
                "PENDING_APPROVAL",
                "APPROVAL_REJECTED",
                eventData,
                command.getReviewedBy()
        );

        log.info("Event rejected: {}", approval.getApprovalId());
        return toDTO(approval);
    }

    private String generateApprovalId(String productType) {
        String prefix = "PEA";
        String product = productType.substring(0, Math.min(3, productType.length()));
        long timestamp = System.currentTimeMillis();
        return String.format("%s-%s-%d", prefix, product, timestamp);
    }

    private PendingApprovalDTO toDTO(PendingEventApprovalReadModel entity) {
        return PendingApprovalDTO.builder()
                .id(entity.getId())
                .approvalId(entity.getApprovalId())
                .approvalType(entity.getApprovalType())
                .status(entity.getStatus())
                .operationId(entity.getOperationId())
                .draftId(entity.getDraftId())
                .productType(entity.getProductType())
                .reference(entity.getReference())
                .eventCode(entity.getEventCode())
                .eventName(entity.getEventName())
                .eventDescription(entity.getEventDescription())
                .messageType(entity.getMessageType())
                .swiftMessage(entity.getSwiftMessage())
                .eventData(entity.getEventData())
                .submitterComments(entity.getSubmitterComments())
                .currency(entity.getCurrency())
                .amount(entity.getAmount())
                .applicantName(entity.getApplicantName())
                .beneficiaryName(entity.getBeneficiaryName())
                .submittedBy(entity.getSubmittedBy())
                .submittedAt(entity.getSubmittedAt())
                .reviewedBy(entity.getReviewedBy())
                .reviewedAt(entity.getReviewedAt())
                .reviewComments(entity.getReviewComments())
                .rejectionReason(entity.getRejectionReason())
                .fieldComments(entity.getFieldComments())
                .icon(entity.getIcon())
                .color(entity.getColor())
                .priority(entity.getPriority())
                // Risk evaluation data
                .riskScore(entity.getRiskScore())
                .riskLevel(entity.getRiskLevel())
                .triggeredRiskRules(entity.getTriggeredRiskRules())
                .riskAction(entity.getRiskAction())
                .approvalInstructions(entity.getApprovalInstructions())
                .riskTriggered(entity.getRiskTriggered())
                // Multi-approver support
                .requiredApprovers(entity.getRequiredApprovers())
                .currentApprovalCount(entity.getCurrentApprovalCount())
                .approvalHistory(entity.getApprovalHistory())
                .build();
    }

    /**
     * Builds SWIFT message content for amendment from eventData.
     * Creates a proper MT7xx format reading all configuration from database.
     * No hardcoded fields - everything comes from swift_field_config_readmodel.
     */
    private String buildAmendmentSwiftContent(String messageType,
                                               Map<String, Object> eventData,
                                               OperationReadModel operation) {
        StringBuilder swift = new StringBuilder();

        // SWIFT header blocks - sender BIC from operation
        String senderBic = operation.getIssuingBankBic() != null ? operation.getIssuingBankBic() : "XXXXXXXXX";

        swift.append("{1:F01").append(senderBic).append("AXXX0000000000}");
        swift.append("{2:O").append(messageType.replace("MT", "")).append("}")
             .append("{4:\n");

        // Get all field configurations for this message type, ordered by display_order
        List<SwiftFieldConfig> fieldConfigs = swiftFieldConfigRepository
                .findActiveByMessageTypeOrdered(messageType);

        // If no config for this message type, try with operation's message type
        if (fieldConfigs.isEmpty()) {
            fieldConfigs = swiftFieldConfigRepository
                    .findActiveByMessageTypeOrdered(operation.getMessageType());
        }

        // Build reverse mapping: draftFieldMapping -> fieldCode
        Map<String, String> fieldToSwiftCode = new HashMap<>();
        for (SwiftFieldConfig config : fieldConfigs) {
            if (config.getDraftFieldMapping() != null) {
                String[] mappings = config.getDraftFieldMapping().split(",");
                for (String mapping : mappings) {
                    fieldToSwiftCode.put(mapping.trim().toLowerCase(), config.getFieldCode());
                }
            }
        }

        // Track which fields have been added to avoid duplicates
        java.util.Set<String> addedFields = new java.util.HashSet<>();

        // First: Add COMPUTED fields (those with compute: prefix in draft_field_mapping)
        // These are mandatory per SWIFT spec but auto-generated (hidden from user form)
        for (SwiftFieldConfig config : fieldConfigs) {
            String mapping = config.getDraftFieldMapping();
            if (mapping != null && mapping.startsWith("compute:")) {
                String fieldCode = config.getFieldCode();
                String cleanCode = fieldCode.replace(":", "");

                if (addedFields.contains(cleanCode)) continue;

                String value = getFieldValue(mapping, eventData, operation);
                if (value != null && !value.isEmpty()) {
                    String formattedValue = formatSwiftValue(cleanCode, value);
                    swift.append(fieldCode).append(formattedValue).append("\n");
                    addedFields.add(cleanCode);
                    log.debug("Added computed field {} with value {}", fieldCode, formattedValue);
                }
            }
        }

        // Second: Add MODIFIED fields from eventData (non-mandatory)
        for (Map.Entry<String, Object> entry : eventData.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();

            if (value == null || value.toString().isEmpty()) continue;

            String swiftCode = null;
            String cleanKey = key.replace(":", "");

            // Check if key is already a SWIFT code format
            if (cleanKey.matches("\\d{2}[A-Za-z]?")) {
                swiftCode = cleanKey.toUpperCase();
            } else {
                // Look up in configuration mapping
                String mapped = fieldToSwiftCode.get(key.toLowerCase());
                if (mapped != null) {
                    swiftCode = mapped.replace(":", "");
                }
            }

            // Skip if already added or no valid code
            if (swiftCode == null || addedFields.contains(swiftCode)) continue;

            // Check if this field actually changed from original operation value
            if (isFieldModified(swiftCode, value, operation)) {
                String formattedValue = formatSwiftValue(swiftCode, value);
                swift.append(":").append(swiftCode).append(":").append(formattedValue).append("\n");
                addedFields.add(swiftCode);
            }
        }

        swift.append("-}");
        return swift.toString();
    }

    /**
     * Gets field value from eventData or operation based on draft_field_mapping.
     * Supports computed fields with "compute:" prefix from configuration.
     */
    private String getFieldValue(String draftFieldMapping, Map<String, Object> eventData, OperationReadModel operation) {
        if (draftFieldMapping == null) return null;

        // Handle computed fields (prefix: "compute:")
        if (draftFieldMapping.startsWith("compute:")) {
            return computeFieldValue(draftFieldMapping.substring(8), operation);
        }

        // Try to get from eventData first (by SWIFT code or field name)
        for (Map.Entry<String, Object> entry : eventData.entrySet()) {
            String key = entry.getKey().replace(":", "").toLowerCase();
            String mappingLower = draftFieldMapping.toLowerCase();

            // Match by key or if mapping contains this key
            if (key.equals(mappingLower) || mappingLower.contains(key) ||
                draftFieldMapping.split(",")[0].trim().equalsIgnoreCase(key)) {
                Object value = entry.getValue();
                return value != null ? value.toString() : null;
            }
        }

        // Fallback to operation field via reflection
        return getOperationFieldValue(operation, draftFieldMapping.split(",")[0].trim());
    }

    /**
     * Computes dynamic field values based on compute type from configuration.
     * Uses reflection to get values from operation - no hardcoded field names.
     *
     * Special computed values (configurable via swift_field_config_readmodel):
     * - Fields containing "Trn": generates unique transaction reference (original ref + suffix)
     * - Fields containing "Date": uses current date (YYYYMMDD)
     * - Fields containing "Number" or "Count": increments by 1 and formats as 2 digits
     * - All other fields: uses reflection to get value from operation
     */
    private String computeFieldValue(String computeType, OperationReadModel operation) {
        String typeLower = computeType.toLowerCase();

        // For TRN (Transaction Reference Number) - generate unique amendment reference
        if (typeLower.contains("trn")) {
            String baseRef = operation.getReference();
            // Count existing amendments from pending approvals + 1
            long amendCount = approvalRepository.countByOperationIdAndEventCodeContaining(
                    operation.getOperationId(), "AMENDMENT");
            return baseRef + "-A" + String.format("%02d", amendCount + 1);
        }

        // Try to get value from operation via reflection first
        String value = getOperationFieldValue(operation, computeType);

        // If value found, return it (possibly formatted)
        if (value != null && !value.isEmpty()) {
            // Format numbers with leading zeros if it's a count/number field
            if (typeLower.contains("number") || typeLower.contains("count")) {
                try {
                    int num = Integer.parseInt(value);
                    return String.format("%02d", num + 1); // Increment for amendment number
                } catch (NumberFormatException e) {
                    return value;
                }
            }
            return value;
        }

        // For date fields with no value, use current date
        if (typeLower.contains("date")) {
            return java.time.LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        }

        // For number/count fields with no value, start at 01
        if (typeLower.contains("number") || typeLower.contains("count")) {
            return "01";
        }

        return null;
    }

    /**
     * Gets a field value from operation using reflection.
     */
    private String getOperationFieldValue(OperationReadModel operation, String fieldName) {
        try {
            org.springframework.beans.BeanWrapper wrapper = new org.springframework.beans.BeanWrapperImpl(operation);
            if (wrapper.isReadableProperty(fieldName)) {
                Object value = wrapper.getPropertyValue(fieldName);
                return value != null ? value.toString() : null;
            }
        } catch (Exception e) {
            log.debug("Could not read field {} from operation: {}", fieldName, e.getMessage());
        }
        return null;
    }

    /**
     * Checks if a field value in eventData is different from the operation's current value.
     * Returns true only if the field was actually modified by the user.
     */
    private boolean isFieldModified(String swiftCode, Object newValue, OperationReadModel operation) {
        if (newValue == null) return false;

        // Get the field mapping for this SWIFT code from the ORIGINAL message type (e.g., MT700)
        List<SwiftFieldConfig> configs = swiftFieldConfigRepository
                .findFieldsWithDraftMapping(operation.getMessageType());

        String fieldMapping = null;
        for (SwiftFieldConfig config : configs) {
            if (config.getFieldCode().replace(":", "").equals(swiftCode)) {
                fieldMapping = config.getDraftFieldMapping();
                break;
            }
        }

        // If no mapping found, skip this field (don't include non-mapped fields)
        if (fieldMapping == null || fieldMapping.isEmpty()) {
            log.debug("No field mapping found for SWIFT code {}, skipping", swiftCode);
            return false;
        }

        // Skip computed fields - they are handled separately
        if (fieldMapping.startsWith("compute:")) {
            return false;
        }

        String currentValue = getOperationFieldValue(operation, fieldMapping.split(",")[0].trim());

        // Compare values (normalize for comparison)
        String newStr = newValue.toString().trim();
        String currentStr = currentValue != null ? currentValue.trim() : "";

        // For dates, normalize format (both to YYYYMMDD)
        if (swiftCode.matches("31[A-Z]?|30|29[A-Z]?|44[A-Z]?")) {
            newStr = formatDateForSwift(newStr);
            currentStr = formatDateForSwift(currentStr);
        }

        boolean modified = !newStr.equals(currentStr);
        if (modified) {
            log.debug("Field {} modified: '{}' -> '{}'", swiftCode, currentStr, newStr);
        }

        return modified;
    }

    /**
     * Builds a mapping from operation field names to SWIFT codes using swift_field_config_readmodel.
     */
    private Map<String, String> buildFieldMappingFromConfig(String eventMessageType, String operationMessageType) {
        Map<String, String> mapping = new HashMap<>();

        // Try to get field configs for the event message type (e.g., MT707)
        List<SwiftFieldConfig> configs = swiftFieldConfigRepository.findFieldsWithDraftMapping(eventMessageType);

        // If no configs found, try with operation message type (e.g., MT700)
        if (configs.isEmpty() && operationMessageType != null && !operationMessageType.equals(eventMessageType)) {
            configs = swiftFieldConfigRepository.findFieldsWithDraftMapping(operationMessageType);
        }

        // Build the reverse mapping: draftFieldMapping -> fieldCode (without colons)
        for (SwiftFieldConfig config : configs) {
            String draftField = config.getDraftFieldMapping();
            String fieldCode = config.getFieldCode();

            if (draftField != null && fieldCode != null) {
                // Remove colons from field code (e.g., ":31D:" -> "31D")
                String cleanCode = fieldCode.replace(":", "");

                // Handle multiple fields (e.g., "currency,amount" for :32B:)
                String[] fields = draftField.split(",");
                for (String field : fields) {
                    mapping.put(field.trim().toLowerCase(), cleanCode);
                }
            }
        }

        return mapping;
    }

    /**
     * Formats a value for SWIFT message based on field code.
     * Handles date formatting (YYYYMMDD), amount formatting, etc.
     */
    private String formatSwiftValue(String fieldCode, Object value) {
        if (value == null) return "";

        String strValue = value.toString().trim();

        // Date fields (31C, 31D, 44C, etc.) - format as YYYYMMDD
        if (fieldCode.matches("31[A-Z]?|44[A-Z]?|29[A-Z]?")) {
            return formatDateForSwift(strValue);
        }

        // Amount fields (32B, 33B) - keep as is, typically already formatted
        if (fieldCode.matches("32[A-Z]?|33[A-Z]?")) {
            return strValue;
        }

        return strValue;
    }

    /**
     * Formats a date string to SWIFT format YYYYMMDD.
     * Accepts ISO format (YYYY-MM-DD) or already SWIFT format.
     */
    private String formatDateForSwift(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) return "";

        // Already in SWIFT format (6 or 8 digits)
        if (dateStr.matches("\\d{6,8}")) {
            return dateStr;
        }

        // ISO format YYYY-MM-DD
        if (dateStr.matches("\\d{4}-\\d{2}-\\d{2}")) {
            try {
                java.time.LocalDate date = java.time.LocalDate.parse(dateStr);
                return date.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            } catch (Exception e) {
                log.warn("Could not parse date: {}", dateStr);
                return dateStr.replace("-", "");
            }
        }

        return dateStr;
    }

    // ========== Risk Evaluation Helper Methods ==========

    /**
     * Evaluates risk for the approval submission.
     * Creates a RiskContext and calls the RiskEngine.
     */
    private RiskEvaluationResult evaluateRiskForApproval(SubmitEventForApprovalCommand command,
                                                          String productType,
                                                          java.math.BigDecimal amount) {
        try {
            // Get current user info from security context
            String username = getCurrentUsername();

            RiskContext context = RiskContext.builder()
                    .username(username)
                    .eventType(RiskEvent.EventType.OPERATION)
                    .operationType(productType + "_" + command.getEventCode())
                    .operationAmount(amount)
                    .build();

            // Add IP and other context if available from command
            if (command.getAdditionalContext() != null) {
                context.setAdditionalContext(command.getAdditionalContext());
                if (command.getAdditionalContext().containsKey("ipAddress")) {
                    context.setIpAddress((String) command.getAdditionalContext().get("ipAddress"));
                }
                if (command.getAdditionalContext().containsKey("userAgent")) {
                    context.setUserAgent((String) command.getAdditionalContext().get("userAgent"));
                }
            }

            return riskEngineService.evaluateRisk(context);

        } catch (Exception e) {
            log.warn("Failed to evaluate risk for approval: {}", e.getMessage());
            // Return a default "low risk" result if evaluation fails
            return RiskEvaluationResult.builder()
                    .totalScore(0)
                    .triggeredRules(new ArrayList<>())
                    .action(RiskThreshold.RiskAction.ALLOW)
                    .allowed(true)
                    .requiresMfa(false)
                    .blocked(false)
                    .build();
        }
    }

    /**
     * Converts triggered rules to a list of maps for JSON storage.
     */
    private List<Map<String, Object>> convertTriggeredRulesToMaps(RiskEvaluationResult result) {
        if (result.getTriggeredRules() == null || result.getTriggeredRules().isEmpty()) {
            return new ArrayList<>();
        }

        List<Map<String, Object>> rules = new ArrayList<>();
        for (RiskEvent.TriggeredRule rule : result.getTriggeredRules()) {
            Map<String, Object> ruleMap = new HashMap<>();
            ruleMap.put("code", rule.getRuleCode());
            ruleMap.put("name", rule.getRuleName());
            ruleMap.put("points", rule.getPoints());
            ruleMap.put("reason", rule.getReason());
            rules.add(ruleMap);
        }
        return rules;
    }

    /**
     * Calculates the risk level based on score.
     */
    private String calculateRiskLevel(Integer score) {
        if (score == null || score == 0) return "LOW";
        if (score <= 30) return "LOW";
        if (score <= 60) return "MEDIUM";
        if (score <= 80) return "HIGH";
        return "CRITICAL";
    }

    /**
     * Generates approval instructions based on risk evaluation.
     * These instructions guide the approver on how to handle the request.
     */
    private String generateApprovalInstructions(RiskEvaluationResult result, String riskLevel) {
        StringBuilder instructions = new StringBuilder();

        // Add risk summary
        instructions.append("**Evaluación de Riesgo**: Puntaje ")
                .append(result.getTotalScore())
                .append(" (").append(riskLevel).append(")\n\n");

        // Add triggered rules with explanations
        if (result.getTriggeredRules() != null && !result.getTriggeredRules().isEmpty()) {
            instructions.append("**Reglas de Riesgo Activadas:**\n");
            for (RiskEvent.TriggeredRule rule : result.getTriggeredRules()) {
                instructions.append("• **").append(rule.getRuleName()).append("** (+")
                        .append(rule.getPoints()).append(" pts): ")
                        .append(rule.getReason()).append("\n");
            }
            instructions.append("\n");
        }

        // Add specific guidance based on risk level
        instructions.append("**Instrucciones para el Aprobador:**\n");

        switch (riskLevel) {
            case "LOW" -> instructions.append(
                    "• Riesgo bajo. Proceda con la aprobación normal.\n" +
                    "• Verifique los datos de la operación.\n");

            case "MEDIUM" -> instructions.append(
                    "• Riesgo medio. Se requiere revisión cuidadosa.\n" +
                    "• Verifique la identidad del solicitante.\n" +
                    "• Confirme los montos y beneficiarios.\n" +
                    "• Contacte al solicitante si hay dudas.\n");

            case "HIGH" -> instructions.append(
                    "• **RIESGO ALTO**. Requiere verificación adicional.\n" +
                    "• Contacte al solicitante por un canal alterno.\n" +
                    "• Verifique con el supervisor antes de aprobar.\n" +
                    "• Documente cualquier verificación adicional realizada.\n");

            case "CRITICAL" -> instructions.append(
                    "• **¡RIESGO CRÍTICO!** NO apruebe sin verificación exhaustiva.\n" +
                    "• Requiere aprobación de un nivel superior.\n" +
                    "• Contacte al solicitante y verifique identidad.\n" +
                    "• Notifique al equipo de seguridad.\n" +
                    "• Considere rechazar si no puede verificar.\n");

            default -> instructions.append("• Proceda según los procedimientos estándar.\n");
        }

        // Add action recommendation
        if (result.getAction() != null) {
            instructions.append("\n**Acción Recomendada por el Sistema:** ");
            switch (result.getAction()) {
                case ALLOW -> instructions.append("Permitir");
                case NOTIFY_ADMIN -> instructions.append("Permitir y notificar a administrador");
                case MFA_REQUIRED -> instructions.append("Solicitar verificación MFA adicional");
                case STEP_UP_AUTH -> instructions.append("Requiere autenticación adicional");
                case BLOCK -> instructions.append("**BLOQUEAR** - No aprobar sin autorización superior");
            }
        }

        return instructions.toString();
    }

    private String getCurrentUsername() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "unknown";
        }
    }

    // ========== Multi-Approver Helper Methods ==========

    /**
     * Gets the required number of approvers from 4-Eyes config.
     * Checks amount threshold - if amount is below threshold, returns 1 (single approver).
     */
    private int getRequiredApprovers(String entityType, String eventCode, java.math.BigDecimal amount) {
        // Map event codes to action types
        String actionType = mapEventCodeToActionType(eventCode);

        return fourEyesConfigRepository.findActiveConfig(entityType, actionType)
                .map(config -> {
                    // If there's an amount threshold and amount is below it, use 1 approver
                    if (config.getAmountThreshold() != null && amount != null) {
                        if (amount.compareTo(config.getAmountThreshold()) < 0) {
                            log.debug("Amount {} below threshold {}, using 1 approver",
                                    amount, config.getAmountThreshold());
                            return 1;
                        }
                    }
                    return config.getMinApprovers() != null ? config.getMinApprovers() : 1;
                })
                .orElse(1);
    }

    /**
     * Maps event codes to 4-eyes action types.
     */
    private String mapEventCodeToActionType(String eventCode) {
        if (eventCode == null) return "APPROVE";

        String upper = eventCode.toUpperCase();
        if (upper.contains("AMEND")) return "AMEND";
        if (upper.contains("CANCEL")) return "CANCEL";
        if (upper.contains("RELEASE")) return "RELEASE";
        if (upper.contains("CREATE")) return "CREATE";
        if (upper.contains("DELETE")) return "DELETE";
        return "APPROVE";
    }

    /**
     * Checks if a user has already approved this item.
     */
    private boolean hasUserAlreadyApproved(PendingEventApprovalReadModel approval, String username) {
        List<Map<String, Object>> history = approval.getApprovalHistory();
        if (history == null || history.isEmpty()) {
            return false;
        }

        return history.stream()
                .anyMatch(record -> username.equalsIgnoreCase((String) record.get("user")));
    }
}
