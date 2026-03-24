package com.globalcmx.api.service;

import com.globalcmx.api.dto.query.OperationEventLogQueryDTO;
import com.globalcmx.api.readmodel.entity.OperationEventLogReadModel;
import com.globalcmx.api.readmodel.entity.EventTypeConfigReadModel;
import com.globalcmx.api.readmodel.repository.OperationEventLogReadModelRepository;
import com.globalcmx.api.readmodel.repository.EventTypeConfigReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Query service for operation event logs (CQRS read side).
 * Provides event history and audit trail.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OperationEventLogQueryService {

    private final OperationEventLogReadModelRepository repository;
    private final EventTypeConfigReadModelRepository eventTypeRepository;

    @Transactional(readOnly = true)
    public Optional<OperationEventLogQueryDTO> findByEventId(String eventId) {
        log.debug("Finding event by eventId: {}", eventId);
        return repository.findByEventId(eventId).map(e -> toDTO(e, "en"));
    }

    @Transactional(readOnly = true)
    public List<OperationEventLogQueryDTO> getEventHistory(String operationId, String language) {
        log.debug("Getting event history for operation: {}", operationId);
        return repository.findByOperationIdOrderByEventSequenceAsc(operationId)
                .stream().map(e -> toDTO(e, language)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OperationEventLogQueryDTO> getRecentEvents(String operationId, String language) {
        log.debug("Getting recent events for operation: {}", operationId);
        return repository.findByOperationIdOrderByExecutedAtDesc(operationId)
                .stream().map(e -> toDTO(e, language)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OperationEventLogQueryDTO> getEventsByType(String operationType, String language) {
        log.debug("Getting events by operationType: {}", operationType);
        return repository.findByOperationTypeOrderByExecutedAtDesc(operationType)
                .stream().map(e -> toDTO(e, language)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OperationEventLogQueryDTO> getEventsByCode(String eventCode, String language) {
        log.debug("Getting events by eventCode: {}", eventCode);
        return repository.findByEventCodeOrderByExecutedAtDesc(eventCode)
                .stream().map(e -> toDTO(e, language)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OperationEventLogQueryDTO> getEventsForMessage(String swiftMessageId, String language) {
        log.debug("Getting events for SWIFT message: {}", swiftMessageId);
        return repository.findBySwiftMessageIdOrderByExecutedAtDesc(swiftMessageId)
                .stream().map(e -> toDTO(e, language)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OperationEventLogQueryDTO> getEventsByUser(String executedBy, String language) {
        log.debug("Getting events by user: {}", executedBy);
        return repository.findByExecutedByOrderByExecutedAtDesc(executedBy)
                .stream().map(e -> toDTO(e, language)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<OperationEventLogQueryDTO> getLastEvent(String operationId, String language) {
        log.debug("Getting last event for operation: {}", operationId);
        return repository.findFirstByOperationIdOrderByEventSequenceDesc(operationId)
                .map(e -> toDTO(e, language));
    }

    @Transactional(readOnly = true)
    public List<OperationEventLogQueryDTO> getStateTransitions(String operationId, String language) {
        log.debug("Getting state transitions for operation: {}", operationId);
        return repository.findStateTransitions(operationId)
                .stream().map(e -> toDTO(e, language)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OperationEventLogQueryDTO> getEventsByDateRange(
            LocalDateTime startDate, LocalDateTime endDate, String language) {
        log.debug("Getting events between {} and {}", startDate, endDate);
        return repository.findByDateRange(startDate, endDate)
                .stream().map(e -> toDTO(e, language)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OperationEventLogQueryDTO> searchWithFilters(
            String operationId, String operationType, String eventCode,
            String executedBy, String language) {
        log.debug("Searching events with filters");
        return repository.findWithFilters(operationId, operationType, eventCode, executedBy)
                .stream().map(e -> toDTO(e, language)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long countByOperationId(String operationId) {
        return repository.countByOperationId(operationId);
    }

    @Transactional(readOnly = true)
    public long countByEventCode(String eventCode) {
        return repository.countByEventCode(eventCode);
    }

    private OperationEventLogQueryDTO toDTO(OperationEventLogReadModel entity, String language) {
        OperationEventLogQueryDTO dto = OperationEventLogQueryDTO.builder()
                .id(entity.getId())
                .eventId(entity.getEventId())
                .operationId(entity.getOperationId())
                .operationType(entity.getOperationType())
                .eventCode(entity.getEventCode())
                .eventSequence(entity.getEventSequence())
                .swiftMessageId(entity.getSwiftMessageId())
                .swiftMessageType(entity.getSwiftMessageType())
                .messageDirection(entity.getMessageDirection())
                .previousStage(entity.getPreviousStage())
                .newStage(entity.getNewStage())
                .previousStatus(entity.getPreviousStatus())
                .newStatus(entity.getNewStatus())
                .eventData(entity.getEventData())
                .comments(entity.getComments())
                .operationSnapshot(entity.getOperationSnapshot())
                // Individual snapshot columns
                .reference(entity.getReference())
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
                .executedBy(entity.getExecutedBy())
                .executedAt(entity.getExecutedAt())
                .build();

        // Enrich with event type info
        eventTypeRepository.findByEventCodeAndOperationTypeAndLanguage(
                entity.getEventCode(), entity.getOperationType(), language)
                .ifPresent(eventType -> {
                    dto.setEventName(eventType.getEventName());
                    dto.setEventDescription(eventType.getEventDescription());
                    dto.setIcon(eventType.getIcon());
                    dto.setColor(eventType.getColor());
                });

        return dto;
    }
}
