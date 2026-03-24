package com.globalcmx.api.service;

import com.globalcmx.api.dto.query.EventTypeConfigQueryDTO;
import com.globalcmx.api.dto.query.EventFlowConfigQueryDTO;
import com.globalcmx.api.dto.query.SwiftResponseConfigQueryDTO;
import com.globalcmx.api.readmodel.entity.EventTypeConfigReadModel;
import com.globalcmx.api.readmodel.entity.EventFlowConfigReadModel;
import com.globalcmx.api.readmodel.entity.OperationReadModel;
import com.globalcmx.api.readmodel.entity.SwiftResponseConfigReadModel;
import com.globalcmx.api.readmodel.repository.EventTypeConfigReadModelRepository;
import com.globalcmx.api.readmodel.repository.EventFlowConfigReadModelRepository;
import com.globalcmx.api.readmodel.repository.OperationReadModelRepository;
import com.globalcmx.api.readmodel.repository.SwiftResponseConfigReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Query service for event configurations (CQRS read side).
 * Provides event types, flows, and response configurations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EventConfigQueryService {

    private final EventTypeConfigReadModelRepository eventTypeRepository;
    private final EventFlowConfigReadModelRepository eventFlowRepository;
    private final SwiftResponseConfigReadModelRepository responseConfigRepository;
    private final OperationReadModelRepository operationRepository;
    private final EventConditionEvaluator conditionEvaluator;

    // ==================== Event Type Queries ====================

    @Transactional(readOnly = true)
    public List<EventTypeConfigQueryDTO> getEventTypesForOperation(String operationType, String language) {
        log.debug("Getting event types for operation: {}, language: {}", operationType, language);
        return eventTypeRepository.findByOperationTypeAndLanguageAndIsActiveTrueOrderByDisplayOrderAsc(
                        operationType, language)
                .stream().map(this::toEventTypeDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<EventTypeConfigQueryDTO> getEventType(String eventCode, String operationType, String language) {
        log.debug("Getting event type: {} for operation: {}, language: {}", eventCode, operationType, language);
        return eventTypeRepository.findByEventCodeAndOperationTypeAndLanguage(eventCode, operationType, language)
                .map(this::toEventTypeDTO);
    }

    @Transactional(readOnly = true)
    public List<EventTypeConfigQueryDTO> getEventsRequiringApproval(String operationType, String language) {
        log.debug("Getting events requiring approval for operation: {}", operationType);
        return eventTypeRepository.findByOperationTypeAndLanguageAndRequiresApprovalTrueAndIsActiveTrueOrderByDisplayOrderAsc(
                        operationType, language)
                .stream().map(this::toEventTypeDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<String> getDistinctOperationTypes() {
        return eventTypeRepository.findDistinctOperationTypes();
    }

    @Transactional(readOnly = true)
    public List<String> getDistinctStages() {
        return eventTypeRepository.findDistinctResultingStages();
    }

    @Transactional(readOnly = true)
    public List<String> getDistinctStagesByOperationType(String operationType) {
        return eventTypeRepository.findDistinctResultingStagesByOperationType(operationType);
    }

    @Transactional(readOnly = true)
    public List<String> getDistinctSwiftMessageTypes() {
        java.util.Set<String> types = new java.util.TreeSet<>();
        types.addAll(eventTypeRepository.findDistinctOutboundMessageTypes());
        types.addAll(eventTypeRepository.findDistinctInboundMessageTypes());
        return new java.util.ArrayList<>(types);
    }

    // ==================== Event Flow Queries ====================

    @Transactional(readOnly = true)
    public List<EventFlowConfigQueryDTO> getAvailableEvents(
            String operationType, String currentStage, String currentEvent, String language) {
        log.debug("Getting available events for operation: {}, stage: {}, event: {}",
                operationType, currentStage, currentEvent);

        List<EventFlowConfigReadModel> flows = eventFlowRepository.findNextPossibleEvents(
                operationType, language, currentEvent, currentStage);

        return flows.stream().map(flow -> {
            EventFlowConfigQueryDTO dto = toEventFlowDTO(flow);
            // Enrich with event type info
            eventTypeRepository.findByEventCodeAndOperationTypeAndLanguage(
                    flow.getToEventCode(), operationType, language)
                    .ifPresent(eventType -> {
                        dto.setToEventName(eventType.getEventName());
                        dto.setToEventDescription(eventType.getEventDescription());
                        dto.setToEventHelpText(eventType.getHelpText());
                        dto.setToEventIcon(eventType.getIcon());
                        dto.setToEventColor(eventType.getColor());
                    });
            return dto;
        }).collect(Collectors.toList());
    }

    /**
     * Get available events for an operation with condition evaluation.
     * This filters events based on configurable conditions (e.g., SWIFT field 57a existence).
     *
     * @param operationId The operation ID to evaluate
     * @param language The language for i18n
     * @return List of available events after condition filtering
     */
    @Transactional(readOnly = true)
    public List<EventFlowConfigQueryDTO> getAvailableEventsForOperation(
            String operationId, String language) {
        return getAvailableEventsForOperation(operationId, language, false);
    }

    @Transactional(readOnly = true)
    public List<EventFlowConfigQueryDTO> getAvailableEventsForOperation(
            String operationId, String language, boolean clientPortalOnly) {
        log.info("Getting available events for operation ID: {} language={} clientPortalOnly={}", operationId, language, clientPortalOnly);

        // Get the operation
        Optional<OperationReadModel> operationOpt = operationRepository.findByOperationId(operationId);
        if (operationOpt.isEmpty()) {
            log.warn("Operation not found: {}", operationId);
            return List.of();
        }

        OperationReadModel operation = operationOpt.get();
        String operationType = operation.getProductType();
        String currentStage = operation.getStage();
        log.info("Operation: type={} stage={}", operationType, currentStage);

        // Get last event (could be enhanced to track this better)
        String currentEvent = null; // Could be retrieved from event log if needed

        // Get all possible events for this state
        List<EventFlowConfigReadModel> flows = eventFlowRepository.findNextPossibleEvents(
                operationType, language, currentEvent, currentStage);

        log.info("Found {} potential events before filtering for stage={}", flows.size(), currentStage);
        flows.forEach(f -> log.info("  -> Potential event: {} (fromStage={} fromEvent={})",
            f.getToEventCode(), f.getFromStage(), f.getFromEventCode()));

        // Filter by conditions and enrich
        return flows.stream()
                .filter(flow -> {
                    // Check conditions from flow's JSON column
                    boolean passes = conditionEvaluator.shouldShowEventByFlowConditions(
                            flow.getConditions(), operation, language);
                    if (!passes) {
                        log.info("Event {} filtered out by flow conditions", flow.getToEventCode());
                    }
                    return passes;
                })
                .filter(flow -> {
                    // If client portal only, check if event is client-requestable
                    if (clientPortalOnly) {
                        Optional<EventTypeConfigReadModel> eventType = eventTypeRepository
                                .findByEventCodeAndOperationTypeAndLanguage(flow.getToEventCode(), operationType, language);
                        boolean isClientRequestable = eventType.map(et -> Boolean.TRUE.equals(et.getIsClientRequestable())).orElse(false);
                        log.info("Event {} clientRequestable={} (eventTypeFound={})",
                            flow.getToEventCode(), isClientRequestable, eventType.isPresent());
                        return isClientRequestable;
                    }
                    return true;
                })
                .map(flow -> {
                    EventFlowConfigQueryDTO dto = toEventFlowDTO(flow);
                    // Enrich with event type info
                    eventTypeRepository.findByEventCodeAndOperationTypeAndLanguage(
                                    flow.getToEventCode(), operationType, language)
                            .ifPresent(eventType -> {
                                dto.setToEventName(eventType.getEventName());
                                dto.setToEventDescription(eventType.getEventDescription());
                                dto.setToEventHelpText(eventType.getHelpText());
                                dto.setToEventIcon(eventType.getIcon());
                                dto.setToEventColor(eventType.getColor());
                            });
                    return dto;
                })
                .collect(Collectors.toList());
    }

    /**
     * Get available events for an operation with explicit stage/event override.
     * Useful for testing or when stage doesn't come from operation.
     */
    @Transactional(readOnly = true)
    public List<EventFlowConfigQueryDTO> getAvailableEventsForOperation(
            String operationId, String currentStage, String currentEvent, String language) {
        return getAvailableEventsForOperation(operationId, currentStage, currentEvent, language, false);
    }

    @Transactional(readOnly = true)
    public List<EventFlowConfigQueryDTO> getAvailableEventsForOperation(
            String operationId, String currentStage, String currentEvent, String language, boolean clientPortalOnly) {
        log.debug("Getting available events for operation ID: {} with stage: {}, event: {}, clientPortalOnly={}",
                operationId, currentStage, currentEvent, clientPortalOnly);

        // Get the operation
        Optional<OperationReadModel> operationOpt = operationRepository.findByOperationId(operationId);
        if (operationOpt.isEmpty()) {
            log.warn("Operation not found: {}", operationId);
            return List.of();
        }

        OperationReadModel operation = operationOpt.get();
        String operationType = operation.getProductType();

        // Use provided stage/event or fall back to operation values
        String stage = currentStage != null ? currentStage : operation.getStage();
        String event = currentEvent;

        // Get all possible events for this state
        List<EventFlowConfigReadModel> flows = eventFlowRepository.findNextPossibleEvents(
                operationType, language, event, stage);

        log.debug("Found {} potential events before condition filtering", flows.size());

        // Filter by conditions from flow's JSON column and enrich
        return flows.stream()
                .filter(flow -> conditionEvaluator.shouldShowEventByFlowConditions(
                        flow.getConditions(), operation, language))
                .filter(flow -> {
                    // If client portal only, check if event is client-requestable
                    if (clientPortalOnly) {
                        Optional<EventTypeConfigReadModel> eventType = eventTypeRepository
                                .findByEventCodeAndOperationTypeAndLanguage(flow.getToEventCode(), operationType, language);
                        boolean isClientRequestable = eventType.map(et -> Boolean.TRUE.equals(et.getIsClientRequestable())).orElse(false);
                        if (!isClientRequestable) {
                            log.debug("Event {} filtered out - not client-requestable", flow.getToEventCode());
                        }
                        return isClientRequestable;
                    }
                    return true;
                })
                .map(flow -> {
                    EventFlowConfigQueryDTO dto = toEventFlowDTO(flow);
                    eventTypeRepository.findByEventCodeAndOperationTypeAndLanguage(
                                    flow.getToEventCode(), operationType, language)
                            .ifPresent(eventType -> {
                                dto.setToEventName(eventType.getEventName());
                                dto.setToEventDescription(eventType.getEventDescription());
                                dto.setToEventHelpText(eventType.getHelpText());
                                dto.setToEventIcon(eventType.getIcon());
                                dto.setToEventColor(eventType.getColor());
                            });
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EventFlowConfigQueryDTO> getInitialEvents(String operationType, String language) {
        log.debug("Getting initial events for operation: {}", operationType);
        return eventFlowRepository.findInitialTransitions(operationType, language)
                .stream().map(flow -> {
                    EventFlowConfigQueryDTO dto = toEventFlowDTO(flow);
                    eventTypeRepository.findByEventCodeAndOperationTypeAndLanguage(
                            flow.getToEventCode(), operationType, language)
                            .ifPresent(eventType -> {
                                dto.setToEventName(eventType.getEventName());
                                dto.setToEventDescription(eventType.getEventDescription());
                                dto.setToEventHelpText(eventType.getHelpText());
                                dto.setToEventIcon(eventType.getIcon());
                                dto.setToEventColor(eventType.getColor());
                            });
                    return dto;
                }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EventFlowConfigQueryDTO> getAllFlows(String operationType, String language) {
        log.debug("Getting all flows for operation: {}", operationType);
        return eventFlowRepository.findByOperationTypeAndLanguageAndIsActiveTrueOrderBySequenceOrderAsc(
                        operationType, language)
                .stream().map(this::toEventFlowDTO).collect(Collectors.toList());
    }

    // ==================== Response Config Queries ====================

    @Transactional(readOnly = true)
    public Optional<SwiftResponseConfigQueryDTO> getResponseConfig(
            String sentMessageType, String operationType, String language) {
        log.debug("Getting response config for message: {}, operation: {}", sentMessageType, operationType);
        return responseConfigRepository.findBySentMessageTypeAndOperationTypeAndLanguageAndIsActiveTrue(
                        sentMessageType, operationType, language)
                .map(this::toResponseConfigDTO);
    }

    @Transactional(readOnly = true)
    public List<SwiftResponseConfigQueryDTO> getResponseConfigsForOperation(String operationType, String language) {
        log.debug("Getting all response configs for operation: {}", operationType);
        return responseConfigRepository.findByOperationTypeAndLanguageAndIsActiveTrue(operationType, language)
                .stream().map(this::toResponseConfigDTO).collect(Collectors.toList());
    }

    // ==================== DTO Converters ====================

    private EventTypeConfigQueryDTO toEventTypeDTO(EventTypeConfigReadModel entity) {
        return EventTypeConfigQueryDTO.builder()
                .id(entity.getId())
                .eventCode(entity.getEventCode())
                .operationType(entity.getOperationType())
                .language(entity.getLanguage())
                .eventName(entity.getEventName())
                .eventDescription(entity.getEventDescription())
                .helpText(entity.getHelpText())
                .outboundMessageType(entity.getOutboundMessageType())
                .inboundMessageType(entity.getInboundMessageType())
                .validFromStages(entity.getValidFromStages())
                .validFromStatuses(entity.getValidFromStatuses())
                .resultingStage(entity.getResultingStage())
                .resultingStatus(entity.getResultingStatus())
                .icon(entity.getIcon())
                .color(entity.getColor())
                .displayOrder(entity.getDisplayOrder())
                // Message direction fields
                .messageSender(entity.getMessageSender())
                .messageReceiver(entity.getMessageReceiver())
                .ourRole(entity.getOurRole())
                .requiresSwiftMessage(entity.getRequiresSwiftMessage())
                .eventCategory(entity.getEventCategory())
                // Initial event configuration
                .isInitialEvent(entity.getIsInitialEvent())
                .initialEventRole(entity.getInitialEventRole())
                // Client portal configuration
                .isClientRequestable(entity.getIsClientRequestable())
                .eventSource(entity.getEventSource())
                // Flags
                .isActive(entity.getIsActive())
                .requiresApproval(entity.getRequiresApproval())
                .approvalLevels(entity.getApprovalLevels())
                .isReversible(entity.getIsReversible())
                .generatesNotification(entity.getGeneratesNotification())
                .allowedRoles(entity.getAllowedRoles())
                .formFieldsConfig(entity.getFormFieldsConfig())
                .createdAt(entity.getCreatedAt())
                .modifiedAt(entity.getModifiedAt())
                .version(entity.getVersion())
                .build();
    }

    private EventFlowConfigQueryDTO toEventFlowDTO(EventFlowConfigReadModel entity) {
        return EventFlowConfigQueryDTO.builder()
                .id(entity.getId())
                .operationType(entity.getOperationType())
                .fromEventCode(entity.getFromEventCode())
                .fromStage(entity.getFromStage())
                .toEventCode(entity.getToEventCode())
                .conditions(entity.getConditions())
                .isRequired(entity.getIsRequired())
                .isOptional(entity.getIsOptional())
                .sequenceOrder(entity.getSequenceOrder())
                .language(entity.getLanguage())
                .transitionLabel(entity.getTransitionLabel())
                .transitionHelp(entity.getTransitionHelp())
                .isActive(entity.getIsActive())
                .build();
    }

    private SwiftResponseConfigQueryDTO toResponseConfigDTO(SwiftResponseConfigReadModel entity) {
        return SwiftResponseConfigQueryDTO.builder()
                .id(entity.getId())
                .sentMessageType(entity.getSentMessageType())
                .operationType(entity.getOperationType())
                .expectedResponseType(entity.getExpectedResponseType())
                .responseEventCode(entity.getResponseEventCode())
                .expectedResponseDays(entity.getExpectedResponseDays())
                .alertAfterDays(entity.getAlertAfterDays())
                .escalateAfterDays(entity.getEscalateAfterDays())
                .language(entity.getLanguage())
                .responseDescription(entity.getResponseDescription())
                .timeoutMessage(entity.getTimeoutMessage())
                .isActive(entity.getIsActive())
                .build();
    }
}
