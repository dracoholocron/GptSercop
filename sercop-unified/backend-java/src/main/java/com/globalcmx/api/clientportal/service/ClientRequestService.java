package com.globalcmx.api.clientportal.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.clientportal.dto.CreateClientRequestDTO;
import com.globalcmx.api.clientportal.dto.ClientRequestDTO;
import com.globalcmx.api.clientportal.dto.RetryPreviewResponse;
import com.globalcmx.api.clientportal.entity.ClientRequestReadModel;
import com.globalcmx.api.clientportal.repository.ClientRequestReadModelRepository;
import com.globalcmx.api.dto.command.CreateSwiftDraftCommand;
import com.globalcmx.api.dto.command.UpdateSwiftDraftCommand;
import com.globalcmx.api.dto.query.SwiftDraftDTO;
import com.globalcmx.api.dto.swift.SwiftFieldConfigDTO;
import com.globalcmx.api.readmodel.entity.CatalogoPersonalizadoReadModel;
import com.globalcmx.api.readmodel.entity.EventTypeConfigReadModel;
import com.globalcmx.api.readmodel.repository.CatalogoPersonalizadoReadModelRepository;
import com.globalcmx.api.readmodel.repository.EventTypeConfigReadModelRepository;
import com.globalcmx.api.service.SwiftFieldConfigService;
import com.globalcmx.api.service.draft.SwiftDraftService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Service for managing client requests.
 * Implements business logic for the client portal.
 */
@Service
@Transactional
public class ClientRequestService {

    private static final Logger logger = LoggerFactory.getLogger(ClientRequestService.class);
    private static final String PRODUCT_TYPE_MAPPING_CATALOG = "PRODUCT_TYPE_MAPPING";

    private final ClientRequestReadModelRepository requestRepository;
    private final EventTypeConfigReadModelRepository eventTypeConfigRepository;
    private final ObjectMapper objectMapper;
    private final SwiftDraftService swiftDraftService;
    private final SwiftFieldConfigService swiftFieldConfigService;
    private final CatalogoPersonalizadoReadModelRepository catalogRepository;
    private final StageApprovalService stageApprovalService;

    public ClientRequestService(ClientRequestReadModelRepository requestRepository,
                                EventTypeConfigReadModelRepository eventTypeConfigRepository,
                                ObjectMapper objectMapper,
                                SwiftDraftService swiftDraftService,
                                SwiftFieldConfigService swiftFieldConfigService,
                                CatalogoPersonalizadoReadModelRepository catalogRepository,
                                StageApprovalService stageApprovalService) {
        this.requestRepository = requestRepository;
        this.eventTypeConfigRepository = eventTypeConfigRepository;
        this.objectMapper = objectMapper;
        this.swiftDraftService = swiftDraftService;
        this.swiftFieldConfigService = swiftFieldConfigService;
        this.catalogRepository = catalogRepository;
        this.stageApprovalService = stageApprovalService;
    }

    /**
     * Create a new request for a client.
     * Implements data isolation by requiring clientId.
     */
    public ClientRequestReadModel createRequest(String clientId, String clientName, CreateClientRequestDTO request, String createdBy) {
        ClientRequestReadModel clientRequest = new ClientRequestReadModel(clientId, clientName, request.getProductType());

        // Generate request number
        clientRequest.setRequestNumber(generateRequestNumber(request.getProductType()));

        // Set optional fields
        if (request.getProductSubtype() != null) {
            clientRequest.setProductSubtype(request.getProductSubtype());
        }
        if (request.getAmount() != null) {
            clientRequest.setAmount(request.getAmount());
        }
        if (request.getCurrency() != null) {
            clientRequest.setCurrency(request.getCurrency());
        }
        if (request.getPriority() != null) {
            clientRequest.setPriority(request.getPriority());
        }

        // Set custom data as JSON
        if (request.getCustomData() != null) {
            try {
                clientRequest.setCustomData(objectMapper.writeValueAsString(request.getCustomData()));
            } catch (JsonProcessingException e) {
                logger.error("Failed to serialize custom data", e);
            }
        }

        // Set audit fields
        clientRequest.setCreatedBy(createdBy);
        clientRequest.setStatus("DRAFT");
        clientRequest.setCurrentStep(1);
        clientRequest.setTotalSteps(getStepsForProduct(request.getProductType()));
        clientRequest.setCompletionPercentage(0);

        // Save client request first to get ID
        clientRequest = requestRepository.save(clientRequest);

        // Create SWIFT draft if we have custom data
        if (request.getCustomData() != null && !request.getCustomData().isEmpty()) {
            try {
                String draftId = createSwiftDraftFromRequest(clientRequest, request.getCustomData(), createdBy);
                if (draftId != null) {
                    clientRequest.setDraftId(draftId);
                    clientRequest = requestRepository.save(clientRequest);
                }
            } catch (Exception e) {
                logger.error("Failed to create SWIFT draft for request {}: {}", clientRequest.getId(), e.getMessage());
                // Don't fail the request creation if draft creation fails
            }
        }

        return clientRequest;
    }

    /**
     * Update a draft request.
     * Only drafts and pending documents status can be edited.
     */
    public ClientRequestReadModel updateRequest(String requestId, String clientId, Map<String, Object> updates, String updatedBy) {
        ClientRequestReadModel request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        // Data isolation check
        if (!request.getClientId().equals(clientId)) {
            throw new SecurityException("Access denied to request: " + requestId);
        }

        // Check if editable
        if (!request.canBeEdited()) {
            throw new IllegalStateException("Request cannot be edited in status: " + request.getStatus());
        }

        // Update fields
        if (updates.containsKey("amount")) {
            request.setAmount(new BigDecimal(updates.get("amount").toString()));
        }
        if (updates.containsKey("currency")) {
            request.setCurrency(updates.get("currency").toString());
        }
        if (updates.containsKey("priority")) {
            request.setPriority(updates.get("priority").toString());
        }
        if (updates.containsKey("currentStep")) {
            request.setCurrentStep(Integer.parseInt(updates.get("currentStep").toString()));
        }
        if (updates.containsKey("customData")) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> customData = (Map<String, Object>) updates.get("customData");
                request.setCustomData(objectMapper.writeValueAsString(customData));

                // Update or create SWIFT draft
                if (customData != null && !customData.isEmpty()) {
                    try {
                        if (request.getDraftId() != null) {
                            // Update existing draft
                            updateSwiftDraftFromRequest(request.getDraftId(), customData, updatedBy);
                        } else {
                            // Create new draft
                            String draftId = createSwiftDraftFromRequest(request, customData, updatedBy);
                            if (draftId != null) {
                                request.setDraftId(draftId);
                            }
                        }
                    } catch (Exception e) {
                        logger.error("Failed to update SWIFT draft for request {}: {}", requestId, e.getMessage());
                        // Don't fail the request update if draft update fails
                    }
                }
            } catch (JsonProcessingException e) {
                logger.error("Failed to serialize custom data", e);
            }
        }

        // Calculate completion percentage
        if (request.getTotalSteps() != null && request.getCurrentStep() != null) {
            int percentage = (request.getCurrentStep() * 100) / request.getTotalSteps();
            request.setCompletionPercentage(Math.min(percentage, 100));
        }

        request.setUpdatedAt(LocalDateTime.now());
        request.setUpdatedBy(updatedBy);

        return requestRepository.save(request);
    }

    /**
     * Submit a request for review.
     */
    public ClientRequestReadModel submitRequest(String requestId, String clientId, String submittedBy) {
        ClientRequestReadModel request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        // Data isolation check
        if (!request.getClientId().equals(clientId)) {
            throw new SecurityException("Access denied to request: " + requestId);
        }

        // Check if can be submitted
        if (!request.isDraft() && !request.isPendingDocuments()) {
            throw new IllegalStateException("Request cannot be submitted in status: " + request.getStatus());
        }

        // Update status
        request.setStatus("SUBMITTED");
        request.setSubmittedAt(LocalDateTime.now());
        request.setCompletionPercentage(100);
        request.setUpdatedBy(submittedBy);

        // Calculate SLA deadline
        int slaHours = getSlaHoursForProduct(request.getProductType(), request.getPriority(), request.getAmount());
        request.setSlaHours(slaHours);
        request.setSlaDeadline(LocalDateTime.now().plusHours(slaHours));

        return requestRepository.save(request);
    }

    /**
     * Cancel a request.
     */
    public ClientRequestReadModel cancelRequest(String requestId, String clientId, String cancelledBy) {
        ClientRequestReadModel request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        // Data isolation check
        if (!request.getClientId().equals(clientId)) {
            throw new SecurityException("Access denied to request: " + requestId);
        }

        // Check if can be cancelled
        if (!request.canBeCancelled()) {
            throw new IllegalStateException("Request cannot be cancelled in status: " + request.getStatus());
        }

        request.setStatus("CANCELLED");
        request.setUpdatedBy(cancelledBy);

        return requestRepository.save(request);
    }

    /**
     * Assign a request to a processor (backoffice).
     * Automatically initializes the internal processing workflow to RECEPCION stage.
     */
    public ClientRequestReadModel assignRequest(String requestId, String assigneeId, String assigneeName, String assignedBy) {
        ClientRequestReadModel request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        if (!request.isSubmitted() && !request.isInReview()) {
            throw new IllegalStateException("Request cannot be assigned in status: " + request.getStatus());
        }

        request.setAssignedToUserId(assigneeId);
        request.setAssignedToUserName(assigneeName);
        request.setStatus("IN_REVIEW");
        request.setReviewStartedAt(LocalDateTime.now());
        request.setUpdatedBy(assignedBy);

        // Initialize internal processing workflow if not already started
        if (request.getInternalProcessingStage() == null) {
            request.setInternalProcessingStage("RECEPCION");
            request.setInternalProcessingStartedAt(LocalDateTime.now());

            // Log the initial transition
            try {
                requestRepository.insertInternalProcessingLog(
                        requestId, "INTERNAL_RECEPCION", "SUBMITTED", "RECEPCION",
                        assigneeId, assigneeName, "Solicitud asignada - Inicio de procesamiento interno", null);
                logger.info("Initialized internal processing workflow for request {} at stage RECEPCION", requestId);
            } catch (Exception e) {
                logger.error("Error logging initial internal processing transition for request: {}", requestId, e);
            }
        }

        return requestRepository.save(request);
    }

    /**
     * Request additional documents from client.
     */
    public ClientRequestReadModel requestDocuments(String requestId, String details, String requestedBy) {
        ClientRequestReadModel request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        if (!request.isInReview()) {
            throw new IllegalStateException("Can only request documents when in review");
        }

        request.setStatus("PENDING_DOCUMENTS");
        request.setStatusDetail(details);
        request.setUpdatedBy(requestedBy);

        return requestRepository.save(request);
    }

    /**
     * Approve a request (backoffice).
     */
    public ClientRequestReadModel approveRequest(String requestId, String approvedById, String approvedByName) {
        ClientRequestReadModel request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        if (!request.isInReview()) {
            throw new IllegalStateException("Request cannot be approved in status: " + request.getStatus());
        }

        request.setStatus("APPROVED");
        request.setApprovedAt(LocalDateTime.now());
        request.setApprovedByUserId(approvedById);
        request.setApprovedByUserName(approvedByName);

        // Check if SLA was breached
        if (request.getSlaDeadline() != null && LocalDateTime.now().isAfter(request.getSlaDeadline())) {
            request.setSlaBreached(true);
        }

        return requestRepository.save(request);
    }

    /**
     * Reject a request (backoffice).
     */
    public ClientRequestReadModel rejectRequest(String requestId, String rejectedById, String rejectedByName, String reason) {
        ClientRequestReadModel request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        if (!request.isInReview()) {
            throw new IllegalStateException("Request cannot be rejected in status: " + request.getStatus());
        }

        request.setStatus("REJECTED");
        request.setRejectedAt(LocalDateTime.now());
        request.setApprovedByUserId(rejectedById);
        request.setApprovedByUserName(rejectedByName);
        request.setRejectionReason(reason);

        return requestRepository.save(request);
    }

    /**
     * Get a request by ID with data isolation check.
     */
    @Transactional(readOnly = true)
    public Optional<ClientRequestReadModel> getRequestById(String requestId, String clientId) {
        return requestRepository.findById(requestId)
                .filter(r -> r.getClientId().equals(clientId));
    }

    /**
     * Get a request by ID (backoffice - no data isolation).
     */
    @Transactional(readOnly = true)
    public Optional<ClientRequestReadModel> getRequestById(String requestId) {
        return requestRepository.findById(requestId);
    }

    /**
     * Find client requests by operation reference.
     */
    @Transactional(readOnly = true)
    public List<ClientRequestReadModel> findByOperationReference(String operationReference) {
        return requestRepository.findByOperationReference(operationReference);
    }

    /**
     * Get all requests for a client with pagination.
     */
    @Transactional(readOnly = true)
    public Page<ClientRequestReadModel> getRequestsByClient(String clientId, Pageable pageable) {
        return requestRepository.findByClientId(clientId, pageable);
    }

    /**
     * Search requests for a client.
     */
    @Transactional(readOnly = true)
    public Page<ClientRequestReadModel> searchRequestsByClient(
            String clientId, String productType, String status, String searchTerm, Pageable pageable) {
        return requestRepository.searchByClient(clientId, productType, status, searchTerm, pageable);
    }

    /**
     * Search requests across multiple clients (for corporation users).
     */
    @Transactional(readOnly = true)
    public Page<ClientRequestReadModel> searchRequestsByClients(
            java.util.List<String> clientIds, String productType, String status, String searchTerm, Pageable pageable) {
        return requestRepository.searchByClients(clientIds, productType, status, searchTerm, pageable);
    }

    /**
     * Search all requests (backoffice).
     */
    @Transactional(readOnly = true)
    public Page<ClientRequestReadModel> searchAllRequests(
            String clientId, String productType, String status, String assignedToUserId, String searchTerm, Pageable pageable) {
        return requestRepository.searchAll(clientId, productType, status, assignedToUserId, searchTerm, pageable);
    }

    /**
     * Search all requests with internal processing stage filter (backoffice).
     */
    @Transactional(readOnly = true)
    public Page<ClientRequestReadModel> searchAllRequests(
            String clientId, String productType, String status, String assignedToUserId,
            String internalProcessingStage, String searchTerm, Pageable pageable) {
        if (internalProcessingStage != null && !internalProcessingStage.isEmpty()) {
            return requestRepository.searchAllWithStage(
                    clientId, productType, status, assignedToUserId, internalProcessingStage, searchTerm, pageable);
        }
        return requestRepository.searchAll(clientId, productType, status, assignedToUserId, searchTerm, pageable);
    }

    /**
     * Get counts of requests grouped by internal processing stage.
     * Dynamically returns all stages that have at least one request.
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getStageCountsMap() {
        List<Object[]> results = requestRepository.countByStages();
        Map<String, Long> counts = new java.util.LinkedHashMap<>();
        for (Object[] row : results) {
            String stage = (String) row[0];
            Long count = (Long) row[1];
            if (stage != null) {
                counts.put(stage, count);
            }
        }
        return counts;
    }

    /**
     * Convert entity to DTO.
     */
    public ClientRequestDTO toDTO(ClientRequestReadModel entity) {
        ClientRequestDTO dto = new ClientRequestDTO();

        dto.setId(entity.getId());
        dto.setClientId(entity.getClientId());
        dto.setClientName(entity.getClientName());
        dto.setProductType(entity.getProductType());
        dto.setProductTypeLabel(getProductTypeLabel(entity.getProductType()));
        dto.setRequestNumber(entity.getRequestNumber());
        dto.setStatus(entity.getStatus());
        dto.setStatusLabel(getStatusLabel(entity.getStatus()));
        dto.setStatusDetail(entity.getStatusDetail());
        dto.setCurrentStep(entity.getCurrentStep());
        dto.setTotalSteps(entity.getTotalSteps());
        dto.setCompletionPercentage(entity.getCompletionPercentage());
        dto.setOperationId(entity.getOperationId());
        dto.setDraftId(entity.getDraftId());
        // Use operation reference, or fall back to draft reference if available
        String opRef = entity.getOperationReference();
        if (opRef == null && entity.getDraftId() != null) {
            // Use findDraftById to avoid exceptions that mark transaction for rollback
            opRef = swiftDraftService.findDraftById(entity.getDraftId())
                    .map(SwiftDraftDTO::getReference)
                    .orElse(null);
        }
        dto.setOperationReference(opRef);
        dto.setAmount(entity.getAmount());
        dto.setCurrency(entity.getCurrency());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setCreatedBy(entity.getCreatedBy());
        dto.setCreatedByName(entity.getCreatedBy()); // Username is stored as createdBy
        dto.setSubmittedAt(entity.getSubmittedAt());
        dto.setApprovedAt(entity.getApprovedAt());
        dto.setRejectedAt(entity.getRejectedAt());
        dto.setExpiresAt(entity.getExpiresAt());
        dto.setAssignedToUserId(entity.getAssignedToUserId());
        dto.setAssignedToUserName(entity.getAssignedToUserName());
        dto.setApprovedByUserName(entity.getApprovedByUserName());
        dto.setRejectionReason(entity.getRejectionReason());
        dto.setSlaHours(entity.getSlaHours());
        dto.setSlaDeadline(entity.getSlaDeadline());
        dto.setSlaBreached(entity.getSlaBreached());
        dto.setPriority(entity.getPriority());
        dto.setPriorityLabel(entity.getPriority());

        // Internal processing workflow - get config from database
        dto.setInternalProcessingStage(entity.getInternalProcessingStage());
        dto.setInternalProcessingStartedAt(entity.getInternalProcessingStartedAt());

        // Fetch label, color and icon from event_type_config_readmodel
        if (entity.getInternalProcessingStage() != null) {
            List<EventTypeConfigReadModel> stageConfigs = eventTypeConfigRepository
                    .findByResultingStageAndLanguageAndIsActiveTrueOrderByDisplayOrderAsc(
                            entity.getInternalProcessingStage(), "es");
            if (!stageConfigs.isEmpty()) {
                EventTypeConfigReadModel stageConfig = stageConfigs.get(0);
                dto.setInternalProcessingStageLabel(stageConfig.getEventName());
                dto.setInternalProcessingStageColor(stageConfig.getColor());
                dto.setInternalProcessingStageIcon(stageConfig.getIcon());
            } else {
                // Fallback to stage name if no config found
                dto.setInternalProcessingStageLabel(entity.getInternalProcessingStage());
            }
        }

        // Calculate SLA status
        dto.setSlaStatus(calculateSlaStatus(entity));

        // Calculate days since creation
        if (entity.getCreatedAt() != null) {
            dto.setDaysSinceCreation((int) ChronoUnit.DAYS.between(entity.getCreatedAt(), LocalDateTime.now()));
        }

        // Format amount
        if (entity.getAmount() != null && entity.getCurrency() != null) {
            dto.setAmountFormatted(String.format("%s %,.2f", entity.getCurrency(), entity.getAmount()));
        }

        // Parse custom data
        if (entity.getCustomData() != null) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> customData = objectMapper.readValue(entity.getCustomData(), Map.class);
                dto.setCustomData(customData);
            } catch (JsonProcessingException e) {
                logger.error("Failed to parse custom data", e);
            }
        }

        // Set permissions based on status
        dto.setCanEdit(entity.canBeEdited());
        dto.setCanSubmit(entity.isDraft());
        dto.setCanCancel(entity.canBeCancelled());
        dto.setCanComment(!entity.isFinalState());
        dto.setCanViewDocuments(true);
        dto.setCanUploadDocuments(entity.canBeEdited());

        return dto;
    }

    /**
     * Get statistics for a client.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getClientStatistics(String clientId) {
        Map<String, Object> stats = new HashMap<>();

        stats.put("totalRequests", requestRepository.countByClientId(clientId));
        stats.put("draftRequests", requestRepository.countByClientIdAndStatus(clientId, "DRAFT"));
        stats.put("submittedRequests", requestRepository.countByClientIdAndStatus(clientId, "SUBMITTED"));
        stats.put("inReviewRequests", requestRepository.countByClientIdAndStatus(clientId, "IN_REVIEW"));
        stats.put("approvedRequests", requestRepository.countByClientIdAndStatus(clientId, "APPROVED"));
        stats.put("rejectedRequests", requestRepository.countByClientIdAndStatus(clientId, "REJECTED"));

        return stats;
    }

    /**
     * Get backoffice statistics.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getBackofficeStatistics(String userId) {
        Map<String, Object> stats = new HashMap<>();

        stats.put("pendingTotal", requestRepository.countByStatusForStats("SUBMITTED"));
        stats.put("myAssigned", requestRepository.countActiveByAssignedUser(userId));
        stats.put("slaAtRisk", requestRepository.countSlaAtRisk(LocalDateTime.now().plusHours(8)));
        stats.put("slaBreached", requestRepository.countSlaBreached());

        return stats;
    }

    // Private helper methods

    private String generateRequestNumber(String productType) {
        String prefix;
        switch (productType) {
            case "GUARANTEE_REQUEST":
                prefix = "GR";
                break;
            case "LC_IMPORT_REQUEST":
                prefix = "LI";
                break;
            case "LC_EXPORT_REQUEST":
                prefix = "LE";
                break;
            case "COLLECTION_REQUEST":
                prefix = "CR";
                break;
            default:
                prefix = "RQ";
        }

        int year = LocalDateTime.now().getYear();
        long count = requestRepository.count() + 1;
        return String.format("%s-%d-%05d", prefix, year, count);
    }

    private int getStepsForProduct(String productType) {
        switch (productType) {
            case "GUARANTEE_REQUEST":
                return 5;
            case "LC_IMPORT_REQUEST":
                return 6;
            case "LC_EXPORT_REQUEST":
                return 5;
            case "COLLECTION_REQUEST":
                return 5;
            default:
                return 4;
        }
    }

    private int getSlaHoursForProduct(String productType, String priority, BigDecimal amount) {
        // Base SLA hours by product
        int baseHours;
        switch (productType) {
            case "GUARANTEE_REQUEST":
                baseHours = 48;
                break;
            case "LC_IMPORT_REQUEST":
                baseHours = 72;
                break;
            case "LC_EXPORT_REQUEST":
                baseHours = 48;
                break;
            case "COLLECTION_REQUEST":
                baseHours = 24;
                break;
            default:
                baseHours = 48;
        }

        // Adjust by priority
        if ("URGENT".equals(priority)) {
            baseHours = 8;
        } else if ("HIGH".equals(priority)) {
            baseHours = baseHours / 2;
        }

        // Adjust by amount (larger amounts get more time)
        if (amount != null && amount.compareTo(new BigDecimal("500000")) > 0) {
            baseHours = (int) (baseHours * 1.5);
        }

        return baseHours;
    }

    private String calculateSlaStatus(ClientRequestReadModel entity) {
        if (entity.getSlaDeadline() == null) {
            return null;
        }

        if (Boolean.TRUE.equals(entity.getSlaBreached()) || LocalDateTime.now().isAfter(entity.getSlaDeadline())) {
            return "BREACHED";
        }

        long hoursRemaining = ChronoUnit.HOURS.between(LocalDateTime.now(), entity.getSlaDeadline());

        if (hoursRemaining <= 2) {
            return "CRITICAL";
        } else if (entity.getSlaHours() != null && hoursRemaining < entity.getSlaHours() * 0.25) {
            return "WARNING";
        }

        return "ON_TRACK";
    }

    private String getProductTypeLabel(String productType) {
        if (productType == null) return null;
        switch (productType) {
            case "GUARANTEE_REQUEST":
                return "Garantía Bancaria";
            case "LC_IMPORT_REQUEST":
                return "Carta de Crédito de Importación";
            case "LC_EXPORT_REQUEST":
                return "Carta de Crédito de Exportación";
            case "COLLECTION_REQUEST":
                return "Cobranza Documentaria";
            default:
                return productType;
        }
    }

    private String getStatusLabel(String status) {
        if (status == null) return null;
        switch (status) {
            case "DRAFT":
                return "Borrador";
            case "SUBMITTED":
                return "Enviada";
            case "IN_REVIEW":
                return "En Revisión";
            case "PENDING_DOCUMENTS":
                return "Documentos Pendientes";
            case "APPROVED":
                return "Aprobada";
            case "REJECTED":
                return "Rechazada";
            case "CANCELLED":
                return "Cancelada";
            default:
                return status;
        }
    }

    // ==================== WorkboxDrafts Integration Methods ====================

    /**
     * Get requests by internal processing stage.
     */
    @Transactional(readOnly = true)
    public Page<ClientRequestReadModel> getRequestsByInternalStage(String stage, String productType, Pageable pageable) {
        if ("REGISTRO".equals(stage)) {
            // For REGISTRO stage, only return those without an operation linked
            return requestRepository.findPendingRegistration(productType, pageable);
        }
        return requestRepository.findByInternalProcessingStage(stage, productType, pageable);
    }

    /**
     * Link an operation to a client request.
     * Called after the operator creates an operation from the request data.
     */
    public ClientRequestReadModel linkOperation(String requestId, String operationId, String operationReference,
                                                String userId, String userName) {
        ClientRequestReadModel request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        // Verify the request is in REGISTRO stage
        if (!"REGISTRO".equals(request.getInternalProcessingStage())) {
            throw new IllegalStateException("Request must be in REGISTRO stage to link an operation");
        }

        // Link the operation
        request.setOperationId(operationId);
        request.setOperationReference(operationReference);
        request.setUpdatedAt(LocalDateTime.now());
        request.setUpdatedBy(userName);

        // Transition to FINALIZADO stage
        String currentStage = request.getInternalProcessingStage();

        // Log the transition
        try {
            Long executionTimeMs = null;
            if (request.getInternalProcessingStartedAt() != null) {
                executionTimeMs = ChronoUnit.MILLIS.between(
                        request.getInternalProcessingStartedAt(), LocalDateTime.now());
            }
            requestRepository.insertInternalProcessingLog(
                    requestId, "INTERNAL_FINALIZADO", currentStage, "FINALIZADO",
                    userId, userName, "Operación creada: " + operationReference, executionTimeMs);
        } catch (Exception e) {
            logger.error("Error logging internal processing transition for operation link", e);
        }

        // Update stage and status
        request.setInternalProcessingStage("FINALIZADO");
        request.setStatus("APPROVED");
        request.setApprovedAt(LocalDateTime.now());
        request.setApprovedByUserId(userId);
        request.setApprovedByUserName(userName);

        logger.info("Linked operation {} to request {} and completed internal processing", operationId, requestId);

        return requestRepository.save(request);
    }

    // ==================== Internal Processing Methods ====================

    /**
     * Valid transitions for internal processing workflow.
     * Maps fromStage -> Set of valid toEventCodes
     */
    private static final Map<String, Set<String>> VALID_TRANSITIONS = Map.of(
            "SUBMITTED", Set.of("INTERNAL_RECEPCION"),
            "RECEPCION", Set.of("INTERNAL_VALIDACION", "INTERNAL_DEVUELTO"),
            "VALIDACION", Set.of("INTERNAL_COMPLIANCE", "INTERNAL_DEVUELTO", "INTERNAL_RECHAZADO"),
            "COMPLIANCE", Set.of("INTERNAL_APROBACION", "INTERNAL_DEVUELTO", "INTERNAL_RECHAZADO"),
            "APROBACION", Set.of("INTERNAL_COMISIONES", "INTERNAL_RECHAZADO"),
            "COMISIONES", Set.of("INTERNAL_REGISTRO"),
            "REGISTRO", Set.of("INTERNAL_FINALIZADO")
    );

    /**
     * Get internal processing history for a request.
     * Returns timeline of internal processing events.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getInternalProcessingHistory(String requestId) {
        // Query the internal processing log table
        // For now, return empty list since we'll query native SQL
        List<Map<String, Object>> history = new ArrayList<>();

        try {
            @SuppressWarnings("unchecked")
            List<Object[]> results = (List<Object[]>) requestRepository.findInternalProcessingLog(requestId);

            for (Object[] row : results) {
                Map<String, Object> entry = new HashMap<>();
                entry.put("id", row[0]);
                entry.put("eventCode", row[1]);
                entry.put("fromStage", row[2]);
                entry.put("toStage", row[3]);
                entry.put("executedBy", row[4]);
                entry.put("executedByName", row[5]);
                entry.put("comments", row[6]);
                entry.put("executionTimeMs", row[7]);
                entry.put("createdAt", row[8]);
                history.add(entry);
            }
        } catch (Exception e) {
            logger.error("Error fetching internal processing history for request: {}", requestId, e);
        }

        return history;
    }

    /**
     * Execute an internal processing transition with role verification.
     * Overloaded method that accepts user roles for permission checking.
     */
    public ClientRequestReadModel executeInternalProcessingTransition(
            String requestId, String eventCode, String userId, String userName,
            String comments, List<String> userRoles) {

        ClientRequestReadModel request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        // Determine current stage
        String currentStage = request.getInternalProcessingStage();
        if (currentStage == null) {
            // If not started yet, use the request status
            if ("SUBMITTED".equals(request.getStatus()) || "IN_REVIEW".equals(request.getStatus())) {
                currentStage = "SUBMITTED";
            } else {
                throw new IllegalStateException("Request must be submitted or in review to start internal processing");
            }
        }

        // Extract target stage from event code (remove INTERNAL_ prefix)
        String targetStage = eventCode.replace("INTERNAL_", "");

        // Verify user has permission to execute this transition
        if (userRoles != null && !userRoles.isEmpty()) {
            verifyTransitionPermission(currentStage, targetStage, userRoles);
        }

        // Validate transition is allowed
        Set<String> validTransitions = VALID_TRANSITIONS.get(currentStage);
        if (validTransitions == null || !validTransitions.contains(eventCode)) {
            throw new IllegalStateException(String.format(
                    "Invalid transition from stage '%s' to event '%s'", currentStage, eventCode));
        }

        // Calculate execution time (time spent in previous stage)
        Long executionTimeMs = null;
        if (request.getInternalProcessingStartedAt() != null) {
            executionTimeMs = ChronoUnit.MILLIS.between(
                    request.getInternalProcessingStartedAt(), LocalDateTime.now());
        }

        // Log the transition
        try {
            requestRepository.insertInternalProcessingLog(
                    requestId, eventCode, currentStage, targetStage,
                    userId, userName, comments, executionTimeMs);
        } catch (Exception e) {
            logger.error("Error logging internal processing transition", e);
        }

        // Update request
        request.setInternalProcessingStage(targetStage);
        request.setUpdatedBy(userId);
        request.setUpdatedAt(LocalDateTime.now());

        // Set processing started timestamp if this is the first transition
        if (request.getInternalProcessingStartedAt() == null) {
            request.setInternalProcessingStartedAt(LocalDateTime.now());
        }

        // Handle special stages
        if ("FINALIZADO".equals(targetStage)) {
            // Internal processing completed - could trigger operation creation
            request.setStatus("APPROVED");
            request.setApprovedAt(LocalDateTime.now());
            request.setApprovedByUserId(userId);
            request.setApprovedByUserName(userName);
        } else if ("RECHAZADO".equals(targetStage)) {
            // Request rejected
            request.setStatus("REJECTED");
            request.setRejectedAt(LocalDateTime.now());
            request.setApprovedByUserId(userId);
            request.setApprovedByUserName(userName);
            request.setRejectionReason(comments);
        } else if ("DEVUELTO".equals(targetStage)) {
            // Returned to client for more info
            request.setStatus("PENDING_DOCUMENTS");
            request.setStatusDetail(comments);
        } else if ("APROBACION".equals(targetStage)) {
            // Initialize approval chain when entering APROBACION stage
            if (stageApprovalService.stageRequiresApproval(targetStage)) {
                stageApprovalService.initializeApprovalChain(requestId, targetStage);
            }
        }

        // Save the request first
        request = requestRepository.save(request);

        // Execute event rules for this transition (validations, compliance, notifications)
        try {
            stageApprovalService.executeStageTransitionRules(request, eventCode, userId);
        } catch (Exception e) {
            logger.error("Error executing stage transition rules for {}: {}", eventCode, e.getMessage(), e);
            // Don't fail the transition if rules execution fails
        }

        return request;
    }

    /**
     * Execute an internal processing transition (legacy method without role check).
     */
    public ClientRequestReadModel executeInternalProcessingTransition(
            String requestId, String eventCode, String userId, String userName, String comments) {
        return executeInternalProcessingTransition(requestId, eventCode, userId, userName, comments, Collections.emptyList());
    }

    /**
     * Advance a client request to the next forward stage in the internal processing workflow.
     * Determines the next stage dynamically from VALID_TRANSITIONS (excluding RECHAZADO/DEVUELTO).
     * Used when an external event (e.g. draft approval) triggers workflow advancement.
     */
    public void advanceToNextStage(String requestId, String executedBy, String executedByName) {
        ClientRequestReadModel request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        String currentStage = request.getInternalProcessingStage();
        if (currentStage == null) {
            logger.warn("Cannot advance request {} - no internal processing stage set", requestId);
            return;
        }

        Set<String> validEvents = VALID_TRANSITIONS.get(currentStage);
        if (validEvents == null || validEvents.isEmpty()) {
            logger.warn("Cannot advance request {} - no transitions from stage {}", requestId, currentStage);
            return;
        }

        // Find the forward event (exclude RECHAZADO and DEVUELTO)
        String forwardEvent = validEvents.stream()
                .filter(e -> !e.contains("RECHAZADO") && !e.contains("DEVUELTO"))
                .findFirst()
                .orElse(null);

        if (forwardEvent == null) {
            logger.warn("Cannot advance request {} - no forward transition from stage {}", requestId, currentStage);
            return;
        }

        logger.info("Auto-advancing request {} from stage {} via event {}", requestId, currentStage, forwardEvent);
        executeInternalProcessingTransition(requestId, forwardEvent, executedBy, executedByName,
                "Avance automático por aprobación de operación");
    }

    /**
     * Verify that user has permission to execute a stage transition.
     */
    private void verifyTransitionPermission(String currentStage, String targetStage, List<String> userRoles) {
        // Check execute permission for current stage
        if (!stageApprovalService.canUserExecuteInStage(currentStage, userRoles)) {
            throw new SecurityException("You do not have permission to process requests in stage: " + currentStage);
        }

        // For rejection, check reject permission
        if ("RECHAZADO".equals(targetStage)) {
            if (!stageApprovalService.canUserRejectInStage(currentStage, userRoles)) {
                throw new SecurityException("You do not have permission to reject in stage: " + currentStage);
            }
        }

        // For return to client, check return permission
        if ("DEVUELTO".equals(targetStage)) {
            if (!stageApprovalService.canUserReturnInStage(currentStage, userRoles)) {
                throw new SecurityException("You do not have permission to return requests in stage: " + currentStage);
            }
        }
    }

    // ==================== Multi-Level Approval Methods ====================

    /**
     * Process an approval in the approval chain.
     * Used when request is in APROBACION stage with multi-level approval.
     */
    public ClientRequestReadModel processApprovalChainApproval(
            String requestId, String userId, String userName,
            List<String> userRoles, String comments) {

        ClientRequestReadModel request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        if (!"APROBACION".equals(request.getInternalProcessingStage())) {
            throw new IllegalStateException("Request is not in APROBACION stage");
        }

        // Process the approval
        StageApprovalService.ApprovalResult result = stageApprovalService.processApproval(
                requestId, "APROBACION", userId, userName, userRoles, comments);

        if (!result.isSuccess()) {
            throw new IllegalStateException(result.getMessage());
        }

        // If all approvals are complete, transition to COMISIONES
        if (result.isAllComplete()) {
            return executeInternalProcessingTransition(
                    requestId, "INTERNAL_COMISIONES", userId, userName,
                    "Aprobación multinivel completada", userRoles);
        }

        // Update timestamp even if not transitioning
        request.setUpdatedAt(LocalDateTime.now());
        request.setUpdatedBy(userId);
        return requestRepository.save(request);
    }

    /**
     * Process a rejection in the approval chain.
     */
    public ClientRequestReadModel processApprovalChainRejection(
            String requestId, String userId, String userName,
            List<String> userRoles, String comments) {

        ClientRequestReadModel request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        if (!"APROBACION".equals(request.getInternalProcessingStage())) {
            throw new IllegalStateException("Request is not in APROBACION stage");
        }

        // Process the rejection
        StageApprovalService.ApprovalResult result = stageApprovalService.processRejection(
                requestId, "APROBACION", userId, userName, userRoles, comments);

        if (!result.isSuccess()) {
            throw new IllegalStateException(result.getMessage());
        }

        // Transition to RECHAZADO
        return executeInternalProcessingTransition(
                requestId, "INTERNAL_RECHAZADO", userId, userName,
                comments, userRoles);
    }

    /**
     * Get approval chain status for a request.
     */
    @Transactional(readOnly = true)
    public StageApprovalService.ApprovalChainStatus getApprovalChainStatus(String requestId) {
        ClientRequestReadModel request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        String stageCode = request.getInternalProcessingStage();
        if (stageCode == null) {
            stageCode = "APROBACION"; // Default to APROBACION for query
        }

        return stageApprovalService.getApprovalChainStatus(requestId, stageCode);
    }

    /**
     * Get user permissions for current stage of a request.
     */
    @Transactional(readOnly = true)
    public Map<String, Boolean> getUserPermissionsForRequest(String requestId, List<String> userRoles) {
        ClientRequestReadModel request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        String stageCode = request.getInternalProcessingStage();
        if (stageCode == null) {
            // If not in internal processing, check if submitted
            if ("SUBMITTED".equals(request.getStatus()) || "IN_REVIEW".equals(request.getStatus())) {
                stageCode = "RECEPCION";
            } else {
                return Map.of(
                        "canView", true,
                        "canExecute", false,
                        "canApprove", false,
                        "canReject", false,
                        "canReturn", false
                );
            }
        }

        Map<String, Boolean> permissions = stageApprovalService.getUserPermissionsForStage(stageCode, userRoles);

        // Add specific permission for approval chain
        if ("APROBACION".equals(stageCode) && stageApprovalService.stageRequiresApproval(stageCode)) {
            // Check if user can approve at current level
            boolean canApproveNow = stageApprovalService.getApprovalChainStatus(requestId, stageCode)
                    .getCurrentPendingLevel() != null &&
                    stageApprovalService.canUserApproveInStage(stageCode, userRoles);
            permissions.put("canApproveNow", canApproveNow);
        }

        return permissions;
    }

    // ==================== Validation & Compliance Results ====================

    /**
     * Get validation results for a request.
     */
    @Transactional(readOnly = true)
    public List<StageApprovalService.ValidationResult> getValidationResults(String requestId) {
        return stageApprovalService.getValidationResults(requestId);
    }

    /**
     * Get compliance/screening results for a request.
     */
    @Transactional(readOnly = true)
    public List<StageApprovalService.ComplianceResult> getComplianceResults(String requestId) {
        return stageApprovalService.getComplianceResults(requestId);
    }

    /**
     * Get configured validations with execution results for a request.
     * Shows all validations that are configured, with their current status (pending, passed, failed).
     */
    @Transactional(readOnly = true)
    public List<StageApprovalService.ValidationResult> getConfiguredValidationsWithResults(String requestId) {
        return stageApprovalService.getConfiguredValidationsWithResults(requestId, "INTERNAL_VALIDACION");
    }

    /**
     * Get configured compliance checks with execution results for a request.
     * Shows all compliance checks that are configured, with their current status (pending, clear, match).
     */
    @Transactional(readOnly = true)
    public List<StageApprovalService.ComplianceResult> getConfiguredComplianceWithResults(String requestId) {
        return stageApprovalService.getConfiguredComplianceWithResults(requestId, "INTERNAL_COMPLIANCE");
    }

    // ==================== Retry / Skip / History Methods ====================

    @Transactional
    public StageApprovalService.ValidationResult retryValidation(String requestId, String checkCode, String userId) {
        return stageApprovalService.retryValidation(requestId, checkCode, userId);
    }

    @Transactional
    public void skipValidation(String requestId, String checkCode, String reason, String userId, String userName) {
        stageApprovalService.skipValidation(requestId, checkCode, reason, userId, userName);
    }

    @Transactional
    public StageApprovalService.ComplianceResult retryCompliance(String requestId, String screeningCode, String userId) {
        return stageApprovalService.retryCompliance(requestId, screeningCode, userId);
    }

    @Transactional
    public void skipCompliance(String requestId, String screeningCode, String reason, String userId, String userName) {
        stageApprovalService.skipCompliance(requestId, screeningCode, reason, userId, userName);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getApiCallHistory(String requestId, String apiConfigCode) {
        return stageApprovalService.getApiCallHistory(requestId, apiConfigCode);
    }

    @Transactional(readOnly = true)
    public RetryPreviewResponse getRetryPreview(String requestId, String checkCode, String userId) {
        return stageApprovalService.getRetryPreview(requestId, checkCode, userId);
    }

    @Transactional
    public StageApprovalService.ValidationResult retryValidation(String requestId, String checkCode, String userId,
                                                                  Map<String, Object> contextOverrides) {
        return stageApprovalService.retryValidation(requestId, checkCode, userId, contextOverrides);
    }

    @Transactional
    public StageApprovalService.ComplianceResult retryCompliance(String requestId, String screeningCode, String userId,
                                                                  Map<String, Object> contextOverrides) {
        return stageApprovalService.retryCompliance(requestId, screeningCode, userId, contextOverrides);
    }

    // ==================== SWIFT Draft Integration Methods ====================

    /**
     * Create a SWIFT draft from a client request.
     * Uses the product type mapping from the database to determine message type and product type.
     *
     * @param request The client request
     * @param customData The custom data from the form
     * @param createdBy User creating the draft
     * @return The draft ID if created successfully, null otherwise
     */
    private String createSwiftDraftFromRequest(ClientRequestReadModel request,
                                                Map<String, Object> customData,
                                                String createdBy) {
        // Get product type configuration from database
        ProductTypeMappingInfo mappingInfo = getProductTypeMappingInfo(request.getProductType());
        if (mappingInfo == null) {
            logger.warn("No product type mapping found for: {}", request.getProductType());
            return null;
        }

        // Build SWIFT message from custom data
        String swiftMessage = buildSwiftMessageFromCustomData(customData, mappingInfo.messageType);

        // Create the draft
        // Parse clientId as applicantId for data isolation in operations
        Long applicantId = null;
        try {
            applicantId = Long.parseLong(request.getClientId());
        } catch (NumberFormatException e) {
            logger.warn("Could not parse clientId as applicantId: {}", request.getClientId());
        }

        CreateSwiftDraftCommand command = CreateSwiftDraftCommand.builder()
                .messageType(mappingInfo.messageType)
                .productType(mappingInfo.targetProductType)
                .mode("CLIENT")
                .swiftMessage(swiftMessage)
                .currency(request.getCurrency())
                .amount(request.getAmount())
                .customData(serializeCustomData(customData))
                .applicantId(applicantId)
                .createdBy(createdBy)
                .build();

        SwiftDraftDTO draft = swiftDraftService.createDraft(command);
        logger.info("Created SWIFT draft {} for client request {}", draft.getDraftId(), request.getId());

        return draft.getDraftId();
    }

    /**
     * Update an existing SWIFT draft from request data.
     *
     * @param draftId The draft ID to update
     * @param customData The updated custom data
     * @param modifiedBy User modifying the draft
     */
    private void updateSwiftDraftFromRequest(String draftId,
                                              Map<String, Object> customData,
                                              String modifiedBy) {
        // Get existing draft to know the message type
        SwiftDraftDTO existingDraft = swiftDraftService.getDraftById(draftId);

        // Build updated SWIFT message
        String swiftMessage = buildSwiftMessageFromCustomData(customData, existingDraft.getMessageType());

        // Extract amount and currency from custom data if present
        BigDecimal amount = extractAmount(customData);
        String currency = extractCurrency(customData);

        UpdateSwiftDraftCommand command = UpdateSwiftDraftCommand.builder()
                .swiftMessage(swiftMessage)
                .currency(currency)
                .amount(amount)
                .customData(serializeCustomData(customData))
                .modifiedBy(modifiedBy)
                .build();

        swiftDraftService.updateDraft(draftId, command);
        logger.info("Updated SWIFT draft {} ", draftId);
    }

    /**
     * Build a SWIFT message from custom data using field configuration.
     *
     * @param customData The form data
     * @param messageType The SWIFT message type (MT700, MT760, etc.)
     * @return The SWIFT message text
     */
    private String buildSwiftMessageFromCustomData(Map<String, Object> customData, String messageType) {
        StringBuilder swiftMessage = new StringBuilder();

        // Get field configurations for this message type
        List<SwiftFieldConfigDTO> fieldConfigs = swiftFieldConfigService.findAll(messageType, true);

        for (SwiftFieldConfigDTO config : fieldConfigs) {
            String fieldCode = config.getFieldCode();
            // Try to find matching data by field code or draft field mapping
            Object value = customData.get(fieldCode);
            if (value == null && config.getDraftFieldMapping() != null) {
                value = customData.get(config.getDraftFieldMapping());
            }

            if (value != null) {
                String formattedValue = formatSwiftFieldValue(value, config);
                if (formattedValue != null && !formattedValue.isEmpty()) {
                    // Format: :TAG:VALUE
                    swiftMessage.append(fieldCode).append(":").append(formattedValue).append("\n");
                }
            }
        }

        return swiftMessage.toString();
    }

    /**
     * Format a value for inclusion in a SWIFT message.
     */
    private String formatSwiftFieldValue(Object value, SwiftFieldConfigDTO config) {
        if (value == null) {
            return null;
        }

        String componentType = config.getComponentType();
        if (componentType == null) {
            return String.valueOf(value);
        }

        // Handle composite types
        if (value instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> mapValue = (Map<String, Object>) value;

            switch (componentType) {
                case "CURRENCY_AMOUNT_INPUT":
                    // Format: CCCNNN,NN (e.g., USD100000,00)
                    String curr = String.valueOf(mapValue.getOrDefault("currency", ""));
                    Object amt = mapValue.get("amount");
                    if (amt != null) {
                        return curr + formatAmount(amt);
                    }
                    return null;

                case "SWIFT_PARTY":
                    // Format: Multi-line party info
                    StringBuilder party = new StringBuilder();
                    for (int i = 1; i <= 4; i++) {
                        String line = String.valueOf(mapValue.getOrDefault("line" + i, ""));
                        if (!line.isEmpty() && !"null".equals(line)) {
                            if (party.length() > 0) party.append("\n");
                            party.append(line);
                        }
                    }
                    return party.toString();

                case "FINANCIAL_INSTITUTION_SELECTOR":
                    // Format: BIC code
                    Object bic = mapValue.get("bic");
                    if (bic != null) {
                        return String.valueOf(bic);
                    }
                    return null;

                default:
                    return String.valueOf(value);
            }
        }

        return String.valueOf(value);
    }

    /**
     * Format an amount for SWIFT message (no decimal point, comma separator)
     */
    private String formatAmount(Object amount) {
        if (amount == null) return "";

        try {
            BigDecimal bd;
            if (amount instanceof BigDecimal) {
                bd = (BigDecimal) amount;
            } else {
                bd = new BigDecimal(String.valueOf(amount));
            }
            // SWIFT format: no decimal point, comma separator
            return bd.setScale(2, java.math.RoundingMode.HALF_UP).toString().replace(".", ",");
        } catch (Exception e) {
            return String.valueOf(amount);
        }
    }

    /**
     * Get product type mapping info from database catalog.
     * Returns target product type and message type for a source product type.
     */
    private ProductTypeMappingInfo getProductTypeMappingInfo(String sourceProductType) {
        if (sourceProductType == null) {
            return null;
        }

        try {
            // Find the parent catalog
            Optional<CatalogoPersonalizadoReadModel> parentCatalog =
                    catalogRepository.findByCodigo(PRODUCT_TYPE_MAPPING_CATALOG);

            if (parentCatalog.isEmpty()) {
                logger.warn("Product type mapping catalog not found: {}", PRODUCT_TYPE_MAPPING_CATALOG);
                return null;
            }

            // Find the mapping entry by source product type code
            List<CatalogoPersonalizadoReadModel> mappings =
                    catalogRepository.findByCatalogoPadreIdAndActivoOrderByOrdenAsc(
                            parentCatalog.get().getId(), true);

            for (CatalogoPersonalizadoReadModel mapping : mappings) {
                if (sourceProductType.equals(mapping.getCodigo())) {
                    // nombre = target product type, descripcion = message type
                    return new ProductTypeMappingInfo(
                            mapping.getNombre(),  // targetProductType
                            mapping.getDescripcion()  // messageType
                    );
                }
            }

            logger.warn("No mapping found for source product type: {}", sourceProductType);
            return null;
        } catch (Exception e) {
            logger.error("Error getting product type mapping for: {}", sourceProductType, e);
            return null;
        }
    }

    /**
     * Extract amount from custom data.
     */
    private BigDecimal extractAmount(Map<String, Object> customData) {
        // Try different field names
        Object amount = customData.get("LC_AMOUNT");
        if (amount == null) amount = customData.get("AMOUNT");
        if (amount == null) amount = customData.get("COL_AMOUNT");
        if (amount == null) amount = customData.get("GUARANTEE_AMOUNT");

        // Also check composite field
        if (amount == null) {
            Object currencyAmount = customData.get("LC_CURRENCY_AMOUNT");
            if (currencyAmount instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> caMap = (Map<String, Object>) currencyAmount;
                amount = caMap.get("amount");
            }
        }

        if (amount != null) {
            try {
                if (amount instanceof BigDecimal) {
                    return (BigDecimal) amount;
                }
                return new BigDecimal(String.valueOf(amount));
            } catch (Exception e) {
                logger.warn("Could not parse amount: {}", amount);
            }
        }
        return null;
    }

    /**
     * Extract currency from custom data.
     */
    private String extractCurrency(Map<String, Object> customData) {
        // Try different field names
        Object currency = customData.get("LC_CURRENCY");
        if (currency == null) currency = customData.get("CURRENCY");
        if (currency == null) currency = customData.get("COL_CURRENCY");
        if (currency == null) currency = customData.get("GUARANTEE_CURRENCY");

        // Also check composite field
        if (currency == null) {
            Object currencyAmount = customData.get("LC_CURRENCY_AMOUNT");
            if (currencyAmount instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> caMap = (Map<String, Object>) currencyAmount;
                currency = caMap.get("currency");
            }
        }

        return currency != null ? String.valueOf(currency) : null;
    }

    /**
     * Serialize custom data to JSON string.
     */
    private String serializeCustomData(Map<String, Object> customData) {
        try {
            return objectMapper.writeValueAsString(customData);
        } catch (JsonProcessingException e) {
            logger.error("Failed to serialize custom data", e);
            return null;
        }
    }

    /**
     * Get form data from SWIFT draft.
     * Returns the custom data stored in the draft.
     *
     * @param requestId The client request ID
     * @return The form data from the draft, or empty map if no draft
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getFormDataFromDraft(String requestId) {
        ClientRequestReadModel request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        if (request.getDraftId() == null) {
            return new HashMap<>();
        }

        try {
            SwiftDraftDTO draft = swiftDraftService.getDraftById(request.getDraftId());
            if (draft.getCustomData() != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> customData = objectMapper.readValue(draft.getCustomData(), Map.class);
                return customData;
            }
        } catch (Exception e) {
            logger.error("Failed to get form data from draft {}", request.getDraftId(), e);
        }

        return new HashMap<>();
    }

    /**
     * Helper class to hold product type mapping info.
     */
    private static class ProductTypeMappingInfo {
        final String targetProductType;
        final String messageType;

        ProductTypeMappingInfo(String targetProductType, String messageType) {
            this.targetProductType = targetProductType;
            this.messageType = messageType;
        }
    }
}
