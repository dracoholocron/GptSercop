package com.globalcmx.api.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.customfields.service.OperationCustomDataService;
import com.globalcmx.api.dto.command.ApproveOperationCommand;
import com.globalcmx.api.dto.command.ExecuteEventCommand;
import com.globalcmx.api.dto.query.OperationQueryDTO;
import com.globalcmx.api.eventsourcing.event.OperationEventExecutedEvent;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.exception.OperationLockedException;
import com.globalcmx.api.readmodel.entity.*;
import com.globalcmx.api.readmodel.repository.*;
import com.globalcmx.api.readmodel.entity.ParticipanteReadModel;
import com.globalcmx.api.readmodel.entity.FinancialInstitutionReadModel;
import com.globalcmx.api.alerts.service.OperationAlertService;
import com.globalcmx.api.service.command.OperationLockCommandService;
import com.globalcmx.api.service.query.OperationAnalyzerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanWrapper;
import org.springframework.beans.BeanWrapperImpl;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Command service for operations (CQRS write side).
 * Handles approval, event execution, and state transitions.
 */
@Service
@Slf4j
public class OperationCommandService {

    private final OperationReadModelRepository operationRepository;
    private final SwiftDraftReadModelRepository draftRepository;
    private final OperationEventLogReadModelRepository eventLogRepository;
    private final EventTypeConfigReadModelRepository eventTypeRepository;
    private final SwiftResponseConfigReadModelRepository responseConfigRepository;
    private final EventSnapshotFieldConfigRepository snapshotFieldConfigRepository;
    private final SwiftFieldConfigRepository swiftFieldConfigRepository;
    private final SwiftMessageReadModelRepository swiftMessageRepository;
    private final EventStoreService eventStoreService;
    private final ParticipanteReadModelRepository participanteRepository;
    private final FinancialInstitutionReadModelRepository financialInstitutionRepository;
    private final OperationAnalyzerService operationAnalyzerService;
    private final OperationLockCommandService operationLockService;
    private final ProductTypeConfigRepository productTypeConfigRepository;
    private final OperationCustomDataService operationCustomDataService;
    private final OperationAlertService operationAlertService;
    private final ObjectMapper objectMapper;

    // Constructor con @Lazy para evitar dependencia circular
    public OperationCommandService(
            OperationReadModelRepository operationRepository,
            SwiftDraftReadModelRepository draftRepository,
            OperationEventLogReadModelRepository eventLogRepository,
            EventTypeConfigReadModelRepository eventTypeRepository,
            SwiftResponseConfigReadModelRepository responseConfigRepository,
            EventSnapshotFieldConfigRepository snapshotFieldConfigRepository,
            SwiftFieldConfigRepository swiftFieldConfigRepository,
            SwiftMessageReadModelRepository swiftMessageRepository,
            EventStoreService eventStoreService,
            ParticipanteReadModelRepository participanteRepository,
            FinancialInstitutionReadModelRepository financialInstitutionRepository,
            @Lazy OperationAnalyzerService operationAnalyzerService,
            @Lazy OperationLockCommandService operationLockService,
            ProductTypeConfigRepository productTypeConfigRepository,
            OperationCustomDataService operationCustomDataService,
            @Lazy OperationAlertService operationAlertService,
            ObjectMapper objectMapper) {
        this.operationRepository = operationRepository;
        this.draftRepository = draftRepository;
        this.eventLogRepository = eventLogRepository;
        this.eventTypeRepository = eventTypeRepository;
        this.responseConfigRepository = responseConfigRepository;
        this.snapshotFieldConfigRepository = snapshotFieldConfigRepository;
        this.swiftFieldConfigRepository = swiftFieldConfigRepository;
        this.swiftMessageRepository = swiftMessageRepository;
        this.eventStoreService = eventStoreService;
        this.participanteRepository = participanteRepository;
        this.financialInstitutionRepository = financialInstitutionRepository;
        this.operationAnalyzerService = operationAnalyzerService;
        this.operationLockService = operationLockService;
        this.productTypeConfigRepository = productTypeConfigRepository;
        this.operationCustomDataService = operationCustomDataService;
        this.operationAlertService = operationAlertService;
        this.objectMapper = objectMapper;
    }

    /**
     * Approves a draft and creates an operation.
     */
    @Transactional
    public OperationQueryDTO approveDraft(ApproveOperationCommand command) {
        log.info("Approving draft: {}", command.getDraftId());

        // Get the draft
        SwiftDraftReadModel draft = draftRepository.findByDraftId(command.getDraftId())
                .orElseThrow(() -> new RuntimeException("Draft not found: " + command.getDraftId()));

        // Validate draft status
        if (!"SUBMITTED".equals(draft.getStatus())) {
            throw new RuntimeException("Draft must be in SUBMITTED status to approve");
        }

        // Generate operation ID
        String operationId = generateOperationId(draft.getProductType());

        // Lookup party details
        String applicantName = null;
        String beneficiaryName = null;
        String issuingBankBic = null;
        String advisingBankBic = null;

        // Lookup applicant name
        if (draft.getApplicantId() != null) {
            participanteRepository.findById(draft.getApplicantId())
                    .ifPresent(p -> log.debug("Found applicant: {} {}", p.getNombres(), p.getApellidos()));
            applicantName = participanteRepository.findById(draft.getApplicantId())
                    .map(p -> (p.getNombres() + " " + p.getApellidos()).trim())
                    .orElse(null);
        }

        // Lookup beneficiary name
        if (draft.getBeneficiaryId() != null) {
            beneficiaryName = participanteRepository.findById(draft.getBeneficiaryId())
                    .map(p -> (p.getNombres() + " " + p.getApellidos()).trim())
                    .orElse(null);
        }

        // Lookup issuing bank details - first by ID, then by BIC from SWIFT message
        Long issuingBankId = draft.getIssuingBankId();
        if (issuingBankId != null) {
            var issuingBank = financialInstitutionRepository.findById(issuingBankId);
            if (issuingBank.isPresent()) {
                issuingBankBic = issuingBank.get().getSwiftCode();
            }
        } else if (draft.getIssuingBankBic() != null) {
            // No ID but have BIC from SWIFT message - lookup by BIC in catalog
            var issuingBank = financialInstitutionRepository.findBySwiftCode(draft.getIssuingBankBic());
            if (issuingBank.isPresent()) {
                issuingBankId = issuingBank.get().getId();
                issuingBankBic = issuingBank.get().getSwiftCode();
                log.info("Found issuing bank by BIC: {} -> ID {}", draft.getIssuingBankBic(), issuingBankId);
            } else {
                // BIC not found in catalog, just use the BIC
                issuingBankBic = draft.getIssuingBankBic();
                log.warn("Issuing bank BIC {} not found in catalog", draft.getIssuingBankBic());
            }
        }

        // Lookup advising bank details - first by ID, then by BIC from SWIFT message
        Long advisingBankId = draft.getAdvisingBankId();
        if (advisingBankId != null) {
            var advisingBank = financialInstitutionRepository.findById(advisingBankId);
            if (advisingBank.isPresent()) {
                advisingBankBic = advisingBank.get().getSwiftCode();
            }
        } else if (draft.getAdvisingBankBic() != null) {
            // No ID but have BIC from SWIFT message - lookup by BIC in catalog
            var advisingBank = financialInstitutionRepository.findBySwiftCode(draft.getAdvisingBankBic());
            if (advisingBank.isPresent()) {
                advisingBankId = advisingBank.get().getId();
                advisingBankBic = advisingBank.get().getSwiftCode();
                log.info("Found advising bank by BIC: {} -> ID {}", draft.getAdvisingBankBic(), advisingBankId);
            } else {
                // BIC not found in catalog, just use the BIC
                advisingBankBic = draft.getAdvisingBankBic();
                log.warn("Advising bank BIC {} not found in catalog", draft.getAdvisingBankBic());
            }
        }

        // Create operation with enriched party data
        OperationReadModel operation = OperationReadModel.builder()
                .operationId(operationId)
                .originalDraftId(draft.getDraftId())
                .productType(draft.getProductType())
                .messageType(draft.getMessageType())
                .reference(draft.getReference())
                .stage("ISSUED")
                .status("ACTIVE")
                .creationMode(draft.getMode())
                .swiftMessage(draft.getSwiftMessage())
                .currency(draft.getCurrency())
                .amount(draft.getAmount())
                .issueDate(draft.getIssueDate())
                .expiryDate(draft.getExpiryDate())
                .applicantId(draft.getApplicantId())
                .applicantName(applicantName)
                .beneficiaryId(draft.getBeneficiaryId())
                .beneficiaryName(beneficiaryName)
                .issuingBankId(issuingBankId)
                .issuingBankBic(issuingBankBic)
                .advisingBankId(advisingBankId)
                .advisingBankBic(advisingBankBic)
                .createdBy(draft.getCreatedBy())
                .createdAt(draft.getCreationDate())
                .approvedBy(command.getApprovedBy())
                .approvedAt(LocalDateTime.now())
                .build();

        operation = operationRepository.save(operation);

        // Copy custom fields from draft to operation_custom_data_readmodel
        if (draft.getCustomData() != null && !draft.getCustomData().isBlank()) {
            try {
                Map<String, Object> customData = objectMapper.readValue(
                        draft.getCustomData(), new TypeReference<Map<String, Object>>() {});
                if (!customData.isEmpty()) {
                    operationCustomDataService.saveCustomData(
                            operationId, draft.getProductType(), customData, command.getApprovedBy());
                    log.info("Copied custom data from draft {} to operation {}", draft.getDraftId(), operationId);
                }
            } catch (Exception e) {
                log.warn("Error copying custom data from draft {} to operation {}: {}",
                        draft.getDraftId(), operationId, e.getMessage());
            }
        }

        // Update draft status
        // Note: SwiftDraftReadModel doesn't have setOperationId() or setModifiedAt() methods
        // The modificationDate is managed by @PreUpdate callback
        draft.setStatus("APPROVED");
        draft.setModifiedBy(command.getApprovedBy());
        draftRepository.save(draft);

        // Log the approval event
        logEvent(operation, "APPROVED", null, null, command.getApprovedBy(),
                "DRAFT", "ISSUED", "SUBMITTED", "ACTIVE", null);

        // Actualizar summary de la operación
        try {
            operationAnalyzerService.updateAndPersistSummary(operationId);
        } catch (Exception e) {
            log.warn("Error updating summary for new operation {}: {}", operationId, e.getMessage());
        }

        // Create alerts from templates selected in the draft
        try {
            List<Long> selectedAlertIds = extractSelectedAlertIds(draft);
            if (!selectedAlertIds.isEmpty()) {
                operationAlertService.createAlertsFromApproval(
                        operation, selectedAlertIds, command.getApprovedBy());
            }
        } catch (Exception e) {
            log.warn("Error creating alerts for operation {}: {}", operationId, e.getMessage());
        }

        log.info("Operation created successfully: {}", operationId);
        return toDTO(operation);
    }

    /**
     * Executes an event on an operation.
     */
    @Transactional
    public OperationQueryDTO executeEvent(ExecuteEventCommand command) {
        log.info("Executing event: {} on operation: {}", command.getEventCode(), command.getOperationId());

        // Verify lock - user must have the lock to execute actions
        String currentUser = command.getExecutedBy();
        if (currentUser != null && !operationLockService.canUserOperate(command.getOperationId(), currentUser)) {
            var lockStatus = operationLockService.getLockStatus(command.getOperationId(), currentUser);
            log.warn("User {} cannot execute event on operation {} - locked by {}",
                    currentUser, command.getOperationId(), lockStatus.getLockedBy());
            throw new OperationLockedException(
                    "Operation is locked by " + lockStatus.getLockedByFullName() + ". Please acquire the lock first.",
                    lockStatus);
        }

        // Get the operation
        OperationReadModel operation = operationRepository.findByOperationId(command.getOperationId())
                .orElseThrow(() -> new RuntimeException("Operation not found: " + command.getOperationId()));

        // Get the event configuration
        EventTypeConfigReadModel eventConfig = eventTypeRepository
                .findByEventCodeAndOperationTypeAndLanguage(
                        command.getEventCode(), operation.getProductType(), "en")
                .orElseThrow(() -> new RuntimeException("Event not found: " + command.getEventCode()));

        // Validate event can be executed from current stage
        if (eventConfig.getValidFromStages() != null &&
                !eventConfig.getValidFromStages().contains(operation.getStage())) {
            throw new RuntimeException("Event " + command.getEventCode() +
                    " cannot be executed from stage: " + operation.getStage());
        }

        // Store previous state
        String previousStage = operation.getStage();
        String previousStatus = operation.getStatus();

        // Update operation state
        if (eventConfig.getResultingStage() != null) {
            operation.setStage(eventConfig.getResultingStage());
        }
        if (eventConfig.getResultingStatus() != null) {
            operation.setStatus(eventConfig.getResultingStatus());
        }
        operation.setModifiedBy(command.getExecutedBy());
        operation.setModifiedAt(LocalDateTime.now());

        // Check if this event triggers a response expectation
        if (eventConfig.getOutboundMessageType() != null) {
            var responseConfigOpt = responseConfigRepository.findBySentMessageTypeAndOperationTypeAndLanguageAndIsActiveTrue(
                    eventConfig.getOutboundMessageType(), operation.getProductType(), "en");
            if (responseConfigOpt.isPresent()) {
                var responseConfig = responseConfigOpt.get();
                operation.setAwaitingResponse(true);
                operation.setAwaitingMessageType(responseConfig.getExpectedResponseType());
                operation.setResponseDueDate(
                        java.time.LocalDate.now().plusDays(responseConfig.getExpectedResponseDays()));
            }
            operation.setMessageCount(operation.getMessageCount() + 1);
        }

        // Handle amendment count
        if (command.getEventCode().contains("AMEND")) {
            operation.setAmendmentCount(operation.getAmendmentCount() + 1);
        }

        // Update operation fields from eventData using configuration (no hardcode)
        // Use the event's outbound message type (e.g., MT767) for field mapping
        if (command.getEventData() != null && !command.getEventData().isEmpty()) {
            String eventMessageType = eventConfig.getOutboundMessageType();
            updateOperationFieldsFromEventData(operation, command.getEventData(), eventMessageType);
        }

        operation = operationRepository.save(operation);

        // Register SWIFT message if event generates one
        // Skip if coming from approval flow (post-approval rules will handle SWIFT generation)
        if (eventConfig.getOutboundMessageType() != null && command.getEventData() != null
                && !command.isSkipSwiftGeneration()) {
            registerSwiftMessage(operation, eventConfig, command);
        }

        // Log the event with eventData and comments
        logEvent(operation, command.getEventCode(), command.getEventData(),
                command.getComments(), command.getExecutedBy(), previousStage,
                operation.getStage(), previousStatus, operation.getStatus(),
                eventConfig.getOutboundMessageType());

        // Actualizar summary de la operación
        try {
            operationAnalyzerService.updateAndPersistSummary(command.getOperationId());
        } catch (Exception e) {
            log.warn("Error updating summary after event {} on {}: {}",
                    command.getEventCode(), command.getOperationId(), e.getMessage());
        }

        // Auto-create alerts from event templates
        try {
            operationAlertService.createAlertsFromEventExecution(
                    operation, command.getEventCode(), command.getExecutedBy());
        } catch (Exception e) {
            log.warn("Error auto-creating alerts for event {} on {}: {}",
                    command.getEventCode(), command.getOperationId(), e.getMessage());
        }

        // Recalculate alert dates if operation dates changed
        try {
            operationAlertService.recalculateAlertDates(command.getOperationId(), operation);
        } catch (Exception e) {
            log.warn("Error recalculating alerts for operation {}: {}",
                    command.getOperationId(), e.getMessage());
        }

        log.info("Event executed successfully: {} on operation: {}",
                command.getEventCode(), command.getOperationId());
        return toDTO(operation);
    }

    /**
     * Updates operation when a response is received.
     */
    @Transactional
    public void markResponseReceived(String operationId, String responseMessageType) {
        log.info("Marking response received for operation: {}", operationId);

        OperationReadModel operation = operationRepository.findByOperationId(operationId)
                .orElseThrow(() -> new RuntimeException("Operation not found: " + operationId));

        if (operation.getAwaitingResponse() &&
                responseMessageType.equals(operation.getAwaitingMessageType())) {
            operation.setAwaitingResponse(false);
            operation.setAwaitingMessageType(null);
            operation.setResponseDueDate(null);
            operation.setModifiedAt(LocalDateTime.now());
            operationRepository.save(operation);

            // Actualizar summary de la operación
            try {
                operationAnalyzerService.updateAndPersistSummary(operationId);
            } catch (Exception e) {
                log.warn("Error updating summary after response received for {}: {}",
                        operationId, e.getMessage());
            }
        }
    }

    /**
     * Parse date from various formats (SWIFT YYMMDD, ISO YYYY-MM-DD, etc.)
     */
    private java.time.LocalDate parseDate(Object dateValue) {
        if (dateValue == null) return null;

        if (dateValue instanceof java.time.LocalDate) {
            return (java.time.LocalDate) dateValue;
        }

        String dateStr = dateValue.toString().trim();
        if (dateStr.isEmpty()) return null;

        try {
            // Try ISO format first (YYYY-MM-DD)
            if (dateStr.matches("\\d{4}-\\d{2}-\\d{2}")) {
                return java.time.LocalDate.parse(dateStr);
            }

            // SWIFT format YYMMDD (6 digits)
            if (dateStr.matches("\\d{6}")) {
                int year = Integer.parseInt(dateStr.substring(0, 2));
                int month = Integer.parseInt(dateStr.substring(2, 4));
                int day = Integer.parseInt(dateStr.substring(4, 6));
                // Assume 2000s for years < 50, 1900s otherwise
                year = year < 50 ? 2000 + year : 1900 + year;
                return java.time.LocalDate.of(year, month, day);
            }

            // SWIFT format YYYYMMDD (8 digits)
            if (dateStr.matches("\\d{8}")) {
                int year = Integer.parseInt(dateStr.substring(0, 4));
                int month = Integer.parseInt(dateStr.substring(4, 6));
                int day = Integer.parseInt(dateStr.substring(6, 8));
                return java.time.LocalDate.of(year, month, day);
            }

            log.warn("Unknown date format: {}", dateStr);
            return null;
        } catch (Exception e) {
            log.warn("Error parsing date '{}': {}", dateStr, e.getMessage());
            return null;
        }
    }

    /**
     * Updates operation fields from eventData using configuration tables (no hardcode).
     *
     * Uses two configuration sources:
     * 1. swift_field_config_readmodel: Maps SWIFT field codes (e.g., ":31D:") to operation fields
     *    via draft_field_mapping column
     * 2. event_snapshot_field_config: Defines field types for proper parsing
     *
     * The field_type determines how to parse the value:
     * - DATE: Parse as LocalDate
     * - DECIMAL: Parse as BigDecimal
     * - NUMBER: Parse as Long/Integer
     * - STRING: Use as-is
     */
    private void updateOperationFieldsFromEventData(OperationReadModel operation, Map<String, Object> eventData, String eventMessageType) {
        // Build a map of operation field -> value from eventData
        // Uses swift_field_config to map SWIFT codes to operation fields
        // First try with the event message type (e.g., MT767), then fallback to operation message type (e.g., MT760)
        String messageType = eventMessageType != null ? eventMessageType : operation.getMessageType();
        Map<String, Object> fieldValues = buildFieldValuesMap(messageType, eventData);

        // If no mappings found with event message type, try with operation message type
        if (fieldValues.isEmpty() && eventMessageType != null && !eventMessageType.equals(operation.getMessageType())) {
            fieldValues = buildFieldValuesMap(operation.getMessageType(), eventData);
        }

        if (fieldValues.isEmpty()) {
            log.debug("No mapped field values found in eventData for operation: {}", operation.getOperationId());
            return;
        }

        // Load field type configuration from event_snapshot_field_config
        List<EventSnapshotFieldConfig> fieldConfigs = snapshotFieldConfigRepository
                .findActiveFieldsForOperationType(operation.getProductType());

        // Build a map of fieldName -> fieldType for quick lookup
        Map<String, String> fieldTypeMap = new HashMap<>();
        for (EventSnapshotFieldConfig config : fieldConfigs) {
            fieldTypeMap.put(config.getFieldName(), config.getFieldType());
        }

        BeanWrapper wrapper = new BeanWrapperImpl(operation);

        for (Map.Entry<String, Object> entry : fieldValues.entrySet()) {
            String fieldName = entry.getKey();
            Object value = entry.getValue();

            if (value == null) continue;

            // Get field type from config, default to STRING if not found
            String fieldType = fieldTypeMap.getOrDefault(fieldName, "STRING");

            try {
                Object parsedValue = parseValueByType(value, fieldType);

                if (parsedValue != null && wrapper.isWritableProperty(fieldName)) {
                    wrapper.setPropertyValue(fieldName, parsedValue);
                    log.info("Updated operation field '{}' to: {}", fieldName, parsedValue);
                }
            } catch (Exception e) {
                log.warn("Could not update field '{}' from eventData: {}", fieldName, e.getMessage());
            }
        }
    }

    /**
     * Builds a map of operation field names to values from eventData.
     * Uses swift_field_config to map SWIFT codes (e.g., ":31D:") to operation fields (e.g., "expiryDate").
     */
    private Map<String, Object> buildFieldValuesMap(String messageType, Map<String, Object> eventData) {
        Map<String, Object> result = new HashMap<>();

        // Load SWIFT field configurations that have draft_field_mapping
        List<SwiftFieldConfig> swiftConfigs = swiftFieldConfigRepository.findFieldsWithDraftMapping(messageType);

        // Build a map of SWIFT code -> operation field(s)
        Map<String, String> swiftToFieldMap = new HashMap<>();
        for (SwiftFieldConfig config : swiftConfigs) {
            if (config.getDraftFieldMapping() != null && !config.getDraftFieldMapping().isEmpty()) {
                swiftToFieldMap.put(config.getFieldCode(), config.getDraftFieldMapping());
            }
        }

        // Process each key in eventData
        for (Map.Entry<String, Object> entry : eventData.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();

            if (value == null) continue;

            // Check if key is a SWIFT code (e.g., ":31D:")
            if (swiftToFieldMap.containsKey(key)) {
                String mapping = swiftToFieldMap.get(key);
                // Handle multiple field mappings (e.g., "currency,amount")
                String[] fields = mapping.split(",");
                if (fields.length == 1) {
                    result.put(fields[0].trim(), value);
                } else {
                    // For composite fields like ":32B:" -> "currency,amount"
                    // The value might be "EUR200000,00" - need to parse
                    parseCompositeValue(fields, value, result);
                }
            }
            // Also check direct field name patterns (e.g., "newExpiryDate" -> "expiryDate")
            else if (key.startsWith("new") && key.length() > 3) {
                String fieldName = key.substring(3, 4).toLowerCase() + key.substring(4);
                result.put(fieldName, value);
            }
            // Direct field names
            else if (!key.startsWith(":")) {
                result.put(key, value);
            }
        }

        return result;
    }

    /**
     * Parses composite SWIFT values like ":32B:" which contains currency and amount.
     * Example: "EUR200000,00" -> currency="EUR", amount="200000.00"
     */
    private void parseCompositeValue(String[] fields, Object value, Map<String, Object> result) {
        String strValue = value.toString();

        // Common pattern: currency + amount (e.g., "EUR200000,00")
        if (fields.length == 2 && containsIgnoreCase(fields, "currency") && containsIgnoreCase(fields, "amount")) {
            // Extract currency (first 3 letters)
            if (strValue.length() >= 3) {
                String currency = strValue.substring(0, 3);
                String amountStr = strValue.substring(3).replace(",", ".");

                for (String field : fields) {
                    if (field.trim().equalsIgnoreCase("currency")) {
                        result.put(field.trim(), currency);
                    } else if (field.trim().equalsIgnoreCase("amount")) {
                        result.put(field.trim(), amountStr);
                    }
                }
            }
        }
    }

    private boolean containsIgnoreCase(String[] array, String target) {
        for (String s : array) {
            if (s.trim().equalsIgnoreCase(target)) return true;
        }
        return false;
    }

    /**
     * Parses a value to the appropriate Java type based on field_type configuration.
     */
    private Object parseValueByType(Object value, String fieldType) {
        if (value == null) return null;

        switch (fieldType.toUpperCase()) {
            case "DATE":
                return parseDate(value);

            case "DECIMAL":
                if (value instanceof Number) {
                    return java.math.BigDecimal.valueOf(((Number) value).doubleValue());
                } else if (value instanceof String) {
                    String strVal = ((String) value).trim();
                    if (!strVal.isEmpty()) {
                        return new java.math.BigDecimal(strVal);
                    }
                }
                return null;

            case "NUMBER":
                if (value instanceof Number) {
                    return ((Number) value).longValue();
                } else if (value instanceof String) {
                    String strVal = ((String) value).trim();
                    if (!strVal.isEmpty()) {
                        return Long.parseLong(strVal);
                    }
                }
                return null;

            case "STRING":
            default:
                return value.toString();
        }
    }

    /**
     * Extracts selected alert template IDs from the draft's custom data.
     * The frontend stores them as _selectedAlertTemplateIds in the custom data JSON.
     */
    @SuppressWarnings("unchecked")
    private List<Long> extractSelectedAlertIds(SwiftDraftReadModel draft) {
        if (draft.getCustomData() == null || draft.getCustomData().isBlank()) {
            return List.of();
        }
        try {
            Map<String, Object> customData = objectMapper.readValue(
                    draft.getCustomData(), new TypeReference<Map<String, Object>>() {});
            Object alertIds = customData.get("_selectedAlertTemplateIds");
            if (alertIds instanceof List) {
                return ((List<Object>) alertIds).stream()
                        .map(id -> {
                            if (id instanceof Number) return ((Number) id).longValue();
                            return Long.parseLong(id.toString());
                        })
                        .toList();
            }
        } catch (Exception e) {
            log.warn("Error extracting alert IDs from draft {}: {}", draft.getDraftId(), e.getMessage());
        }
        return List.of();
    }

    private String generateOperationId(String productType) {
        String prefix = productTypeConfigRepository
                .findByProductType(productType)
                .map(com.globalcmx.api.readmodel.entity.ProductTypeConfigReadModel::getIdPrefix)
                .orElse("OP");
        if (prefix == null || prefix.isBlank()) {
            prefix = "OP";
        }

        String year = String.valueOf(java.time.Year.now().getValue());
        long count = operationRepository.countByProductType(productType) + 1;
        return String.format("%s-%s-%06d", prefix, year, count);
    }

    /**
     * Registers a SWIFT message when an event generates one.
     * This creates a record in swift_message_readmodel for tracking and analysis.
     * @throws RuntimeException if required bank BICs are missing
     */
    private void registerSwiftMessage(OperationReadModel operation,
                                       EventTypeConfigReadModel eventConfig,
                                       ExecuteEventCommand command) {
        String messageType = eventConfig.getOutboundMessageType();

        // Validate required bank BICs before attempting to create message
        if (operation.getIssuingBankBic() == null || operation.getIssuingBankBic().isEmpty()) {
            throw new RuntimeException("No se puede transmitir: falta el banco emisor (Issuing Bank BIC). " +
                    "Configure el campo :52A: en la operación.");
        }
        if (operation.getAdvisingBankBic() == null || operation.getAdvisingBankBic().isEmpty()) {
            throw new RuntimeException("No se puede transmitir: falta el banco avisador (Advising Bank BIC). " +
                    "Configure el campo :57A: en la operación.");
        }

        String messageId = "MSG-" + messageType + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // Build SWIFT content from eventData
        String swiftContent = buildSwiftContentFromEventData(messageType, command.getEventData(), operation);

        // Extract key fields from eventData
        String currency = command.getEventData().get("currency") != null
                ? command.getEventData().get("currency").toString() : operation.getCurrency();
        java.math.BigDecimal amount = null;
        if (command.getEventData().get("amount") != null) {
            try {
                amount = new java.math.BigDecimal(command.getEventData().get("amount").toString());
            } catch (NumberFormatException e) {
                amount = operation.getAmount();
            }
        } else {
            amount = operation.getAmount();
        }

        SwiftMessageReadModel message = SwiftMessageReadModel.builder()
                .messageId(messageId)
                .messageType(messageType)
                .direction("OUTBOUND")
                .operationId(operation.getOperationId())
                .operationType(operation.getProductType())
                .senderBic(operation.getIssuingBankBic())
                .receiverBic(operation.getAdvisingBankBic())
                .swiftContent(swiftContent)
                .field20Reference(operation.getReference())
                .currency(currency)
                .amount(amount)
                .status("SENT")
                .triggeredByEvent(command.getEventCode())
                .createdBy(command.getExecutedBy())
                .createdAt(LocalDateTime.now())
                .sentAt(LocalDateTime.now())
                .build();

        // Check if response is expected
        var responseConfigOpt = responseConfigRepository.findBySentMessageTypeAndOperationTypeAndLanguageAndIsActiveTrue(
                messageType, operation.getProductType(), "en");
        if (responseConfigOpt.isPresent()) {
            var config = responseConfigOpt.get();
            message.setExpectsResponse(true);
            message.setExpectedResponseType(config.getExpectedResponseType());
            message.setResponseDueDate(LocalDate.now().plusDays(config.getExpectedResponseDays()));
        }

        swiftMessageRepository.save(message);
        log.info("Registered SWIFT message {} for operation {}", messageId, operation.getOperationId());
    }

    /**
     * Builds SWIFT content from eventData for storage.
     * Creates a simplified SWIFT-like format from the event data fields.
     * Uses swift_field_config_readmodel for field mappings (no hardcode).
     */
    private String buildSwiftContentFromEventData(String messageType,
                                                   Map<String, Object> eventData,
                                                   OperationReadModel operation) {
        StringBuilder swift = new StringBuilder();
        swift.append("{1:F01").append(operation.getIssuingBankBic() != null ? operation.getIssuingBankBic() : "BANKXXXX")
             .append("AXXX0000000000}");
        swift.append("{2:O").append(messageType.replace("MT", "")).append("}")
             .append("{4:\n");

        // Add reference
        swift.append(":20:").append(operation.getReference()).append("\n");
        swift.append(":21:").append(operation.getReference()).append("\n");

        // Build field mapping from configuration (draftFieldMapping -> fieldCode)
        Map<String, String> fieldToSwiftCode = buildFieldMappingFromConfig(messageType, operation.getMessageType());

        // Add fields from eventData using configuration
        for (Map.Entry<String, Object> entry : eventData.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();
            if (value != null && !value.toString().isEmpty()) {
                // First try direct key (might already be SWIFT code like "31D")
                String swiftCode = null;

                // Check if key is already a SWIFT code format
                if (key.matches("\\d{2}[A-Za-z]?")) {
                    swiftCode = key.toUpperCase();
                } else {
                    // Look up in configuration mapping
                    swiftCode = fieldToSwiftCode.get(key.toLowerCase());
                }

                if (swiftCode != null) {
                    swift.append(":").append(swiftCode).append(":").append(value).append("\n");
                }
            }
        }

        swift.append("-}");
        return swift.toString();
    }

    /**
     * Builds a mapping from operation field names to SWIFT codes using swift_field_config_readmodel.
     * Tries the event message type first, then falls back to operation message type.
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
     * Logs an event using the full event sourcing pattern:
     * 1. Creates a domain event
     * 2. Saves to event store (source of truth)
     * 3. Projects to read model for queries
     */
    private void logEvent(OperationReadModel operation, String eventCode,
                          java.util.Map<String, Object> eventData, String comments,
                          String executedBy, String previousStage, String newStage,
                          String previousStatus, String newStatus, String swiftMessageType) {

        Integer nextSequence = eventLogRepository.getNextSequenceNumber(operation.getOperationId());
        String eventId = UUID.randomUUID().toString();
        LocalDateTime timestamp = LocalDateTime.now();

        // Capture operation snapshot based on configuration
        Map<String, Object> operationSnapshot = captureOperationSnapshot(operation);

        // Step 1: Create the domain event
        OperationEventExecutedEvent domainEvent = new OperationEventExecutedEvent(
                eventId,
                operation.getOperationId(),
                operation.getProductType(),
                eventCode,
                nextSequence,
                previousStage,
                newStage,
                previousStatus,
                newStatus,
                eventData,
                comments,
                operationSnapshot,
                executedBy
        );

        // Step 2: Save to event store (source of truth)
        eventStoreService.saveEvent(
                operation.getOperationId(),    // aggregateId
                "OPERATION_EVENT",              // aggregateType
                "OPERATION_EVENT_EXECUTED",     // eventType
                domainEvent,                    // eventData
                executedBy                      // performedBy
        );

        log.debug("Saved operation event {} to event store for operation {}", eventId, operation.getOperationId());

        // Step 3: Project to read model for queries
        OperationEventLogReadModel eventLog = OperationEventLogReadModel.builder()
                .eventId(eventId)
                .operationId(operation.getOperationId())
                .operationType(operation.getProductType())
                .eventCode(eventCode)
                .eventSequence(nextSequence)
                .swiftMessageType(swiftMessageType)
                .messageDirection(swiftMessageType != null ? "OUTBOUND" : null)
                .previousStage(previousStage)
                .newStage(newStage)
                .previousStatus(previousStatus)
                .newStatus(newStatus)
                .eventData(eventData)
                .comments(comments)
                .operationSnapshot(operationSnapshot)
                // Individual snapshot columns for key operation fields
                .reference(operation.getReference())
                .swiftMessage(operation.getSwiftMessage())
                .currency(operation.getCurrency())
                .amount(operation.getAmount())
                .issueDate(operation.getIssueDate())
                .expiryDate(operation.getExpiryDate())
                .applicantId(operation.getApplicantId() != null ? operation.getApplicantId().intValue() : null)
                .applicantName(operation.getApplicantName())
                .beneficiaryId(operation.getBeneficiaryId() != null ? operation.getBeneficiaryId().intValue() : null)
                .beneficiaryName(operation.getBeneficiaryName())
                .issuingBankId(operation.getIssuingBankId() != null ? operation.getIssuingBankId().intValue() : null)
                .issuingBankBic(operation.getIssuingBankBic())
                .advisingBankId(operation.getAdvisingBankId() != null ? operation.getAdvisingBankId().intValue() : null)
                .advisingBankBic(operation.getAdvisingBankBic())
                .amendmentCount(operation.getAmendmentCount())
                .executedBy(executedBy)
                .executedAt(timestamp)
                .build();

        eventLogRepository.save(eventLog);
        log.debug("Projected event {} to read model", eventId);
    }

    /**
     * Captures a snapshot of operation fields based on configuration.
     * Uses reflection to dynamically get field values based on configured field names.
     */
    private Map<String, Object> captureOperationSnapshot(OperationReadModel operation) {
        Map<String, Object> snapshot = new HashMap<>();

        try {
            // Get configured fields for this operation type
            List<EventSnapshotFieldConfig> fields = snapshotFieldConfigRepository
                    .findActiveFieldsForOperationType(operation.getProductType());

            if (fields.isEmpty()) {
                log.debug("No snapshot fields configured for operation type: {}", operation.getProductType());
                return snapshot;
            }

            // Use BeanWrapper for property access
            BeanWrapper wrapper = new BeanWrapperImpl(operation);

            for (EventSnapshotFieldConfig fieldConfig : fields) {
                String fieldName = fieldConfig.getFieldName();
                try {
                    if (wrapper.isReadableProperty(fieldName)) {
                        Object value = wrapper.getPropertyValue(fieldName);
                        if (value != null) {
                            // Convert to string for consistent JSON serialization
                            snapshot.put(fieldName, value.toString());
                        }
                    } else {
                        log.debug("Field '{}' is not readable in OperationReadModel", fieldName);
                    }
                } catch (Exception e) {
                    log.warn("Error reading field '{}' from operation: {}", fieldName, e.getMessage());
                }
            }

            log.debug("Captured operation snapshot with {} fields", snapshot.size());
        } catch (Exception e) {
            log.error("Error capturing operation snapshot: {}", e.getMessage(), e);
        }

        return snapshot;
    }

    private OperationQueryDTO toDTO(OperationReadModel entity) {
        return OperationQueryDTO.builder()
                .id(entity.getId())
                .operationId(entity.getOperationId())
                .originalDraftId(entity.getOriginalDraftId())
                .productType(entity.getProductType())
                .messageType(entity.getMessageType())
                .reference(entity.getReference())
                .stage(entity.getStage())
                .status(entity.getStatus())
                .creationMode(entity.getCreationMode())
                .swiftMessage(entity.getSwiftMessage())
                .currency(entity.getCurrency())
                .amount(entity.getAmount())
                .issueDate(entity.getIssueDate())
                .expiryDate(entity.getExpiryDate())
                .applicantId(entity.getApplicantId())
                .applicantName(entity.getApplicantName())
                .beneficiaryId(entity.getBeneficiaryId())
                .beneficiaryName(entity.getBeneficiaryName())
                .issuingBankId(entity.getIssuingBankId())
                .issuingBankBic(entity.getIssuingBankBic())
                .advisingBankId(entity.getAdvisingBankId())
                .advisingBankBic(entity.getAdvisingBankBic())
                .amendmentCount(entity.getAmendmentCount())
                .messageCount(entity.getMessageCount())
                .hasAlerts(entity.getHasAlerts())
                .alertCount(entity.getAlertCount())
                .awaitingResponse(entity.getAwaitingResponse())
                .awaitingMessageType(entity.getAwaitingMessageType())
                .responseDueDate(entity.getResponseDueDate())
                .sourceClientRequestId(entity.getSourceClientRequestId())
                .createdBy(entity.getCreatedBy())
                .createdAt(entity.getCreatedAt())
                .approvedBy(entity.getApprovedBy())
                .approvedAt(entity.getApprovedAt())
                .modifiedBy(entity.getModifiedBy())
                .modifiedAt(entity.getModifiedAt())
                .version(entity.getVersion())
                .build();
    }
}
