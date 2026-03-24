package com.globalcmx.api.alerts.service;

import com.globalcmx.api.alerts.dto.AlertResponse;
import com.globalcmx.api.alerts.dto.BusinessRequestCreateRequest;
import com.globalcmx.api.alerts.dto.BusinessRequestResponse;
import com.globalcmx.api.alerts.entity.BusinessRequestReadModel;
import com.globalcmx.api.alerts.entity.BusinessRequestReadModel.RequestSourceType;
import com.globalcmx.api.alerts.entity.BusinessRequestReadModel.RequestStatus;
import com.globalcmx.api.alerts.repository.BusinessRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing business requests from AI extraction and other sources.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BusinessRequestService {

    private final BusinessRequestRepository requestRepository;
    private final AlertCreationService alertCreationService;

    /**
     * Create a new business request from AI extraction.
     */
    @Transactional
    public BusinessRequestResponse createRequest(BusinessRequestCreateRequest request, String createdBy) {
        String requestId = UUID.randomUUID().toString();
        String requestNumber = generateRequestNumber();

        BusinessRequestReadModel entity = BusinessRequestReadModel.builder()
            .requestId(requestId)
            .requestNumber(requestNumber)
            .sourceType(request.getExtractionId() != null ?
                RequestSourceType.AI_EXTRACTION : RequestSourceType.MANUAL)
            .extractionId(request.getExtractionId())
            .title(request.getTitle())
            .description(request.getDescription())
            .extractedData(request.getExtractedData())
            .clientId(request.getClientId())
            .clientName(request.getClientName())
            .operationType(request.getOperationType())
            .alertsConfig(request.getAlertsConfig())
            .status(RequestStatus.PENDING)
            .createdBy(createdBy)
            .build();

        entity = requestRepository.save(entity);

        log.info("Created business request {} from {} by {}",
            requestNumber, entity.getSourceType(), createdBy);

        return BusinessRequestResponse.fromEntity(entity);
    }

    /**
     * Get a business request by ID.
     */
    public Optional<BusinessRequestResponse> getRequest(String requestId) {
        return requestRepository.findByRequestId(requestId)
            .map(BusinessRequestResponse::fromEntity);
    }

    /**
     * Get a business request by number.
     */
    public Optional<BusinessRequestResponse> getRequestByNumber(String requestNumber) {
        return requestRepository.findByRequestNumber(requestNumber)
            .map(BusinessRequestResponse::fromEntity);
    }

    /**
     * Get all pending requests.
     */
    public List<BusinessRequestResponse> getPendingRequests() {
        return requestRepository.findByStatusOrderByCreatedAtDesc(RequestStatus.PENDING)
            .stream()
            .map(BusinessRequestResponse::fromEntity)
            .collect(Collectors.toList());
    }

    /**
     * Get pending requests with pagination.
     */
    public Page<BusinessRequestResponse> getPendingRequests(Pageable pageable) {
        return requestRepository.findByStatusOrderByCreatedAtDesc(RequestStatus.PENDING, pageable)
            .map(BusinessRequestResponse::fromEntity);
    }

    /**
     * Get pending requests for a specific user.
     */
    public List<BusinessRequestResponse> getUserPendingRequests(String userId) {
        return requestRepository.findByCreatedByAndStatusOrderByCreatedAtDesc(userId, RequestStatus.PENDING)
            .stream()
            .map(BusinessRequestResponse::fromEntity)
            .collect(Collectors.toList());
    }

    /**
     * Search requests.
     */
    public Page<BusinessRequestResponse> searchRequests(String searchTerm, Pageable pageable) {
        return requestRepository.searchRequests(searchTerm, pageable)
            .map(BusinessRequestResponse::fromEntity);
    }

    /**
     * Approve a business request.
     * Creates alerts and optionally converts to draft/operation.
     */
    @Transactional
    public BusinessRequestResponse approveRequest(
            String requestId,
            String draftId,
            String operationId,
            String approvedBy) {

        BusinessRequestReadModel request = requestRepository.findByRequestId(requestId)
            .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new IllegalStateException("Request is not pending: " + request.getStatus());
        }

        // Update request status
        request.setStatus(RequestStatus.APPROVED);
        request.setApprovedAt(LocalDateTime.now());
        request.setApprovedBy(approvedBy);
        request.setConvertedToDraftId(draftId);
        request.setConvertedToOperationId(operationId);
        if (draftId != null || operationId != null) {
            request.setConvertedAt(LocalDateTime.now());
            request.setStatus(RequestStatus.CONVERTED);
        }

        request = requestRepository.save(request);

        // Create alerts
        List<AlertResponse> createdAlerts = alertCreationService.createAlertsFromBusinessRequest(
            request, approvedBy);

        log.info("Approved business request {}. Created {} alerts. Converted to draft: {}, operation: {}",
            request.getRequestNumber(), createdAlerts.size(), draftId, operationId);

        return BusinessRequestResponse.fromEntity(request);
    }

    /**
     * Reject a business request.
     */
    @Transactional
    public BusinessRequestResponse rejectRequest(String requestId, String reason, String rejectedBy) {
        BusinessRequestReadModel request = requestRepository.findByRequestId(requestId)
            .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new IllegalStateException("Request is not pending: " + request.getStatus());
        }

        request.setStatus(RequestStatus.REJECTED);
        request.setRejectionReason(reason);
        request.setRejectedAt(LocalDateTime.now());
        request.setRejectedBy(rejectedBy);

        request = requestRepository.save(request);

        log.info("Rejected business request {} by {}. Reason: {}",
            request.getRequestNumber(), rejectedBy, reason);

        return BusinessRequestResponse.fromEntity(request);
    }

    /**
     * Cancel a business request.
     */
    @Transactional
    public BusinessRequestResponse cancelRequest(String requestId, String cancelledBy) {
        BusinessRequestReadModel request = requestRepository.findByRequestId(requestId)
            .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new IllegalStateException("Request is not pending: " + request.getStatus());
        }

        request.setStatus(RequestStatus.CANCELLED);

        request = requestRepository.save(request);

        log.info("Cancelled business request {} by {}", request.getRequestNumber(), cancelledBy);

        return BusinessRequestResponse.fromEntity(request);
    }

    /**
     * Update alerts configuration for a pending request.
     */
    @Transactional
    public BusinessRequestResponse updateAlertsConfig(
            String requestId,
            List<BusinessRequestReadModel.AlertConfig> alertsConfig,
            String updatedBy) {

        BusinessRequestReadModel request = requestRepository.findByRequestId(requestId)
            .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new IllegalStateException("Request is not pending: " + request.getStatus());
        }

        request.setAlertsConfig(alertsConfig);
        request = requestRepository.save(request);

        log.info("Updated alerts config for request {} by {}", request.getRequestNumber(), updatedBy);

        return BusinessRequestResponse.fromEntity(request);
    }

    /**
     * Get count of pending requests.
     */
    public long countPendingRequests() {
        return requestRepository.countByStatus(RequestStatus.PENDING);
    }

    /**
     * Generate unique request number.
     */
    private String generateRequestNumber() {
        Integer maxNumber = requestRepository.findMaxRequestNumber();
        int nextNumber = (maxNumber != null ? maxNumber : 0) + 1;
        return String.format("BR-%06d", nextNumber);
    }
}
