package com.globalcmx.api.clientportal.service;

import com.globalcmx.api.clientportal.dto.ClientEventRequestDTO;
import com.globalcmx.api.clientportal.entity.ClientEventRequest;
import com.globalcmx.api.clientportal.entity.ClientEventRequest.RequestStatus;
import com.globalcmx.api.clientportal.repository.ClientEventRequestRepository;
import com.globalcmx.api.readmodel.entity.EventTypeConfigReadModel;
import com.globalcmx.api.readmodel.entity.OperationReadModel;
import com.globalcmx.api.readmodel.repository.EventTypeConfigReadModelRepository;
import com.globalcmx.api.readmodel.repository.OperationReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for managing client event requests.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ClientEventRequestService {

    private final ClientEventRequestRepository eventRequestRepository;
    private final OperationReadModelRepository operationRepository;
    private final EventTypeConfigReadModelRepository eventTypeConfigRepository;

    /**
     * Create a new event request
     */
    @Transactional
    public ClientEventRequestDTO.CreateResponse createEventRequest(
            ClientEventRequestDTO.CreateRequest request,
            Long clientId,
            String clientName,
            String requestedBy,
            String requestedByName) {

        log.info("Creating event request for operation {} event {} by client {}",
                request.getOperationId(), request.getEventCode(), clientId);

        // Validate operation exists and belongs to client
        Optional<OperationReadModel> operationOpt = operationRepository.findByOperationId(request.getOperationId());
        if (operationOpt.isEmpty()) {
            throw new IllegalArgumentException("Operation not found: " + request.getOperationId());
        }

        OperationReadModel operation = operationOpt.get();

        // Validate client has access to this operation
        if (!operation.getApplicantId().equals(clientId)) {
            log.warn("Client {} attempted to request event on operation {} owned by {}",
                    clientId, request.getOperationId(), operation.getApplicantId());
            throw new SecurityException("Access denied to this operation");
        }

        // Validate event type exists and is client-requestable
        Optional<EventTypeConfigReadModel> eventConfigOpt = eventTypeConfigRepository
                .findByEventCodeAndOperationTypeAndLanguage(
                        request.getEventCode(),
                        operation.getProductType(),
                        "es"); // Default to Spanish

        if (eventConfigOpt.isEmpty()) {
            throw new IllegalArgumentException("Event type not found: " + request.getEventCode());
        }

        EventTypeConfigReadModel eventConfig = eventConfigOpt.get();

        if (!Boolean.TRUE.equals(eventConfig.getIsClientRequestable())) {
            throw new IllegalArgumentException("Event type is not available for client requests: " + request.getEventCode());
        }

        // Check for existing pending request for the same event
        if (eventRequestRepository.existsPendingRequestForEvent(request.getOperationId(), request.getEventCode())) {
            throw new IllegalStateException("There is already a pending request for this event on this operation");
        }

        // Create the request
        ClientEventRequest eventRequest = ClientEventRequest.builder()
                .operationId(request.getOperationId())
                .operationReference(operation.getReference())
                .eventCode(request.getEventCode())
                .eventCategory(eventConfig.getEventCategory())
                .clientId(clientId)
                .clientName(clientName)
                .status(RequestStatus.PENDING)
                .justification(request.getJustification())
                .requestedChanges(request.getRequestedChanges())
                .currentAmount(operation.getAmount())
                .newAmount(request.getNewAmount())
                .currentExpiryDate(operation.getExpiryDate())
                .newExpiryDate(request.getNewExpiryDate())
                .cancellationReason(request.getCancellationReason())
                .paymentAmount(request.getPaymentAmount())
                .debitAccountNumber(request.getDebitAccountNumber())
                .requiresApproval(eventConfig.getRequiresApproval())
                .approvalLevels(eventConfig.getApprovalLevels())
                .currentApprovalLevel(0)
                .requestedBy(requestedBy)
                .requestedByName(requestedByName)
                .requestedAt(LocalDateTime.now())
                .build();

        eventRequest = eventRequestRepository.save(eventRequest);

        log.info("Created event request {} for operation {} event {}",
                eventRequest.getRequestId(), request.getOperationId(), request.getEventCode());

        return ClientEventRequestDTO.CreateResponse.builder()
                .requestId(eventRequest.getRequestId())
                .operationId(eventRequest.getOperationId())
                .eventCode(eventRequest.getEventCode())
                .status(eventRequest.getStatus().name())
                .createdAt(eventRequest.getCreatedAt())
                .message("Request submitted successfully")
                .build();
    }

    /**
     * Get event requests for an operation
     */
    public List<ClientEventRequestDTO> getRequestsForOperation(String operationId) {
        return eventRequestRepository.findByOperationIdOrderByRequestedAtDesc(operationId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get event requests for a client
     */
    public List<ClientEventRequestDTO> getRequestsForClient(Long clientId) {
        return eventRequestRepository.findByClientIdOrderByRequestedAtDesc(clientId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get a specific request by ID
     */
    public Optional<ClientEventRequestDTO> getRequest(String requestId) {
        return eventRequestRepository.findById(requestId).map(this::toDTO);
    }

    /**
     * Cancel a pending request (client action)
     */
    @Transactional
    public ClientEventRequestDTO cancelRequest(String requestId, Long clientId) {
        ClientEventRequest request = eventRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        // Validate client owns this request
        if (!request.getClientId().equals(clientId)) {
            throw new SecurityException("Access denied to this request");
        }

        // Can only cancel pending requests
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new IllegalStateException("Can only cancel pending requests");
        }

        request.setStatus(RequestStatus.CANCELLED);
        request.setProcessedAt(LocalDateTime.now());
        request = eventRequestRepository.save(request);

        log.info("Client {} cancelled event request {}", clientId, requestId);

        return toDTO(request);
    }

    /**
     * Approve a request (backoffice action)
     */
    @Transactional
    public ClientEventRequestDTO approveRequest(
            String requestId,
            String approvedBy,
            String approvedByName) {

        ClientEventRequest request = eventRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new IllegalStateException("Can only approve pending requests");
        }

        request.setCurrentApprovalLevel(request.getCurrentApprovalLevel() + 1);

        // Check if all approval levels are met
        if (request.getCurrentApprovalLevel() >= request.getApprovalLevels()) {
            request.setStatus(RequestStatus.APPROVED);
            log.info("Event request {} fully approved by {}", requestId, approvedBy);
        } else {
            log.info("Event request {} approved at level {} of {} by {}",
                    requestId, request.getCurrentApprovalLevel(), request.getApprovalLevels(), approvedBy);
        }

        request.setProcessedBy(approvedBy);
        request.setProcessedByName(approvedByName);
        request.setProcessedAt(LocalDateTime.now());

        return toDTO(eventRequestRepository.save(request));
    }

    /**
     * Reject a request (backoffice action)
     */
    @Transactional
    public ClientEventRequestDTO rejectRequest(
            String requestId,
            String rejectedBy,
            String rejectedByName,
            String reason) {

        ClientEventRequest request = eventRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new IllegalStateException("Can only reject pending requests");
        }

        request.setStatus(RequestStatus.REJECTED);
        request.setProcessedBy(rejectedBy);
        request.setProcessedByName(rejectedByName);
        request.setProcessedAt(LocalDateTime.now());
        request.setRejectionReason(reason);

        log.info("Event request {} rejected by {} with reason: {}", requestId, rejectedBy, reason);

        return toDTO(eventRequestRepository.save(request));
    }

    /**
     * Get pending requests for backoffice
     */
    public List<ClientEventRequestDTO> getPendingRequests() {
        return eventRequestRepository.findPendingApprovals()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Convert entity to DTO
     */
    private ClientEventRequestDTO toDTO(ClientEventRequest entity) {
        ClientEventRequestDTO.ClientEventRequestDTOBuilder builder = ClientEventRequestDTO.builder()
                .requestId(entity.getRequestId())
                .operationId(entity.getOperationId())
                .operationReference(entity.getOperationReference())
                .eventCode(entity.getEventCode())
                .status(entity.getStatus().name())
                .justification(entity.getJustification())
                .requestedChanges(entity.getRequestedChanges())
                .newAmount(entity.getNewAmount())
                .newExpiryDate(entity.getNewExpiryDate())
                .cancellationReason(entity.getCancellationReason())
                .paymentAmount(entity.getPaymentAmount())
                .debitAccountNumber(entity.getDebitAccountNumber())
                .requestedBy(entity.getRequestedBy())
                .requestedByName(entity.getRequestedByName())
                .requestedAt(entity.getRequestedAt())
                .processedBy(entity.getProcessedBy())
                .processedByName(entity.getProcessedByName())
                .processedAt(entity.getProcessedAt())
                .rejectionReason(entity.getRejectionReason())
                .requiresApproval(Boolean.TRUE.equals(entity.getRequiresApproval()))
                .approvalLevels(entity.getApprovalLevels() != null ? entity.getApprovalLevels() : 1)
                .currentApprovalLevel(entity.getCurrentApprovalLevel() != null ? entity.getCurrentApprovalLevel() : 0);

        // Get event configuration for display names
        operationRepository.findByOperationId(entity.getOperationId())
                .ifPresent(operation -> {
                    eventTypeConfigRepository.findByEventCodeAndOperationTypeAndLanguage(
                            entity.getEventCode(),
                            operation.getProductType(),
                            "es"
                    ).ifPresent(eventConfig -> {
                        builder.eventName(eventConfig.getEventName());
                        builder.eventDescription(eventConfig.getEventDescription());
                        builder.eventIcon(eventConfig.getIcon());
                        builder.eventColor(eventConfig.getColor());
                    });
                });

        return builder.build();
    }
}
