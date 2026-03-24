package com.globalcmx.api.clientportal.controller;

import com.globalcmx.api.clientportal.dto.ClientRequestDTO;
import com.globalcmx.api.clientportal.dto.RetryPreviewResponse;
import com.globalcmx.api.clientportal.entity.ClientRequestReadModel;
import com.globalcmx.api.clientportal.service.ClientRequestService;
import com.globalcmx.api.clientportal.service.StageApprovalService;
import com.globalcmx.api.document.dto.DocumentResponse;
import com.globalcmx.api.document.service.DocumentService;
import com.globalcmx.api.dto.query.EventFlowConfigQueryDTO;
import com.globalcmx.api.dto.query.EventTypeConfigQueryDTO;
import com.globalcmx.api.service.EventConfigQueryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.globalcmx.api.customfields.service.FieldMappingService;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST Controller for Backoffice processing of client requests.
 * These endpoints are for internal bank users to review, approve, and reject requests.
 */
@RestController
@RequestMapping("/backoffice/client-requests")
public class BackofficeRequestController {

    private static final Logger logger = LoggerFactory.getLogger(BackofficeRequestController.class);

    private final ClientRequestService requestService;
    private final DocumentService documentService;
    private final EventConfigQueryService eventConfigQueryService;
    private final FieldMappingService fieldMappingService;
    private final StageApprovalService stageApprovalService;

    // Map client request product types to operation types for workflow config
    // TODO: Move this mapping to a database configuration table
    private static final Map<String, String> PRODUCT_TO_OPERATION_TYPE = Map.of(
            "LC_IMPORT_REQUEST", "LC_IMPORT",
            "LC_EXPORT_REQUEST", "LC_EXPORT",
            "GUARANTEE_REQUEST", "GUARANTEE",
            "COLLECTION_REQUEST", "DOCUMENTARY_COLLECTION"
    );

    // Status configuration (colors for UI)
    // These values match the UI framework's color palette names
    // TODO: Move to database configuration table (e.g., status_config)
    private static final Map<String, String> STATUS_COLORS = Map.ofEntries(
            // Client request statuses
            Map.entry("DRAFT", "gray"),
            Map.entry("SUBMITTED", "blue"),
            Map.entry("IN_REVIEW", "orange"),
            Map.entry("PENDING_DOCUMENTS", "yellow"),
            Map.entry("APPROVED", "green"),
            Map.entry("REJECTED", "red"),
            Map.entry("CANCELLED", "gray"),
            // Operation statuses
            Map.entry("ISSUED", "blue"),
            Map.entry("ADVISED", "teal"),
            Map.entry("CONFIRMED", "purple"),
            Map.entry("PENDING_AMENDMENT", "orange"),
            Map.entry("DOCUMENTS_PRESENTED", "cyan"),
            Map.entry("DISCREPANT", "yellow"),
            Map.entry("DOCUMENTS_ACCEPTED", "green"),
            Map.entry("PAID", "green"),
            Map.entry("CLOSED", "gray"),
            Map.entry("ACKNOWLEDGED", "blue")
    );

    // Product type labels (i18n should come from translation service)
    // TODO: Move to database configuration table
    private static final Map<String, String> PRODUCT_TYPE_LABELS = Map.of(
            "LC_IMPORT_REQUEST", "Carta de Crédito de Importación",
            "LC_EXPORT_REQUEST", "Carta de Crédito de Exportación",
            "GUARANTEE_REQUEST", "Garantía Bancaria",
            "COLLECTION_REQUEST", "Cobranza Documentaria"
    );

    public BackofficeRequestController(ClientRequestService requestService,
                                       DocumentService documentService,
                                       EventConfigQueryService eventConfigQueryService,
                                       FieldMappingService fieldMappingService,
                                       StageApprovalService stageApprovalService) {
        this.requestService = requestService;
        this.documentService = documentService;
        this.eventConfigQueryService = eventConfigQueryService;
        this.fieldMappingService = fieldMappingService;
        this.stageApprovalService = stageApprovalService;
    }

    /**
     * List all client requests with filters.
     */
    @GetMapping
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_VIEW_ALL')")
    public ResponseEntity<Page<ClientRequestDTO>> listAllRequests(
            @RequestParam(required = false) String clientId,
            @RequestParam(required = false) String productType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String assignedToUserId,
            @RequestParam(required = false) String internalProcessingStage,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<ClientRequestReadModel> page = requestService.searchAllRequests(
                clientId, productType, status, assignedToUserId, internalProcessingStage, search, pageable);

        Page<ClientRequestDTO> dtoPage = page.map(requestService::toDTO);
        return ResponseEntity.ok(dtoPage);
    }

    /**
     * Get a specific request by ID (no data isolation - backoffice can see all).
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_VIEW_ALL')")
    public ResponseEntity<ClientRequestDTO> getRequest(@PathVariable String id) {
        return requestService.getRequestById(id)
                .map(r -> ResponseEntity.ok(requestService.toDTO(r)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get documents associated with a request.
     * Documents are linked via eventId which is the request ID (draftId during upload).
     */
    @GetMapping("/{id}/documents")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_VIEW_ALL')")
    public ResponseEntity<List<DocumentResponse>> getRequestDocuments(@PathVariable String id) {
        // First verify the request exists
        if (requestService.getRequestById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // Get documents where eventId matches the request ID
        // Using file validation to exclude documents with missing files
        Page<DocumentResponse> documents = documentService.getDocumentsWithFileValidation(
                null,           // operationId
                id,             // eventId (request ID)
                null,           // categoryCode
                null,           // documentTypeCode
                null,           // uploadedBy
                null,           // mimeType
                null,           // searchText
                PageRequest.of(0, 100)  // Get up to 100 documents
        );

        return ResponseEntity.ok(documents.getContent());
    }

    /**
     * Assign a request to a processor.
     */
    @PostMapping("/{id}/assign")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_ASSIGN')")
    public ResponseEntity<ClientRequestDTO> assignRequest(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails user) {

        String assigneeId = body.get("assigneeId");
        String assigneeName = body.get("assigneeName");

        logger.info("Assigning request {} to {} by {}", id, assigneeName, user.getUsername());

        ClientRequestReadModel clientRequest = requestService.assignRequest(id, assigneeId, assigneeName, user.getUsername());
        return ResponseEntity.ok(requestService.toDTO(clientRequest));
    }

    /**
     * Request additional documents from client.
     */
    @PostMapping("/{id}/request-documents")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_DOCS_REQUEST')")
    public ResponseEntity<ClientRequestDTO> requestDocuments(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails user) {

        String details = body.get("details");

        logger.info("Requesting documents for request {} by {}", id, user.getUsername());

        ClientRequestReadModel clientRequest = requestService.requestDocuments(id, details, user.getUsername());
        return ResponseEntity.ok(requestService.toDTO(clientRequest));
    }

    /**
     * Approve a request.
     */
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_APPROVE')")
    public ResponseEntity<ClientRequestDTO> approveRequest(
            @PathVariable String id,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Name") String userName,
            @AuthenticationPrincipal UserDetails user) {

        logger.info("Approving request {} by {}", id, user.getUsername());

        ClientRequestReadModel clientRequest = requestService.approveRequest(id, userId, userName);
        return ResponseEntity.ok(requestService.toDTO(clientRequest));
    }

    /**
     * Reject a request.
     */
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_REJECT')")
    public ResponseEntity<ClientRequestDTO> rejectRequest(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Name") String userName,
            @AuthenticationPrincipal UserDetails user) {

        String reason = body.get("reason");

        logger.info("Rejecting request {} by {} with reason: {}", id, user.getUsername(), reason);

        ClientRequestReadModel clientRequest = requestService.rejectRequest(id, userId, userName, reason);
        return ResponseEntity.ok(requestService.toDTO(clientRequest));
    }

    /**
     * Get backoffice statistics.
     */
    @GetMapping("/stats")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_VIEW_ALL')")
    public ResponseEntity<Map<String, Object>> getStatistics(
            @RequestHeader("X-User-Id") String userId) {

        Map<String, Object> stats = requestService.getBackofficeStatistics(userId);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/stats/pending")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_VIEW_ALL')")
    public ResponseEntity<Map<String, Object>> getPendingStats() {
        Map<String, Object> stats = requestService.getBackofficeStatistics(null);
        return ResponseEntity.ok(Map.of("count", stats.get("pendingTotal")));
    }

    @GetMapping("/stats/my-assigned")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_PROCESS')")
    public ResponseEntity<Map<String, Object>> getMyAssignedStats(
            @RequestHeader("X-User-Id") String userId) {
        Map<String, Object> stats = requestService.getBackofficeStatistics(userId);
        return ResponseEntity.ok(Map.of("count", stats.get("myAssigned")));
    }

    @GetMapping("/stats/sla-at-risk")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_VIEW_ALL')")
    public ResponseEntity<Map<String, Object>> getSlaAtRiskStats() {
        Map<String, Object> stats = requestService.getBackofficeStatistics(null);
        return ResponseEntity.ok(Map.of("count", stats.get("slaAtRisk")));
    }

    @GetMapping("/stats/sla-breached")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_VIEW_ALL')")
    public ResponseEntity<Map<String, Object>> getSlaBreachedStats() {
        Map<String, Object> stats = requestService.getBackofficeStatistics(null);
        return ResponseEntity.ok(Map.of("count", stats.get("slaBreached")));
    }

    /**
     * Get request counts grouped by internal processing stage.
     */
    @GetMapping("/stats/stage-counts")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_VIEW_ALL')")
    public ResponseEntity<Map<String, Long>> getStageCounts() {
        Map<String, Long> counts = requestService.getStageCountsMap();
        return ResponseEntity.ok(counts);
    }

    // ==================== Workflow Configuration Endpoints ====================

    /**
     * Get the operation workflow configuration for a request.
     * Maps the client request product type to the operation type and returns the complete workflow.
     */
    @GetMapping("/{id}/workflow-config")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_VIEW_ALL')")
    public ResponseEntity<Map<String, Object>> getWorkflowConfig(
            @PathVariable String id,
            @RequestParam(defaultValue = "es") String language) {

        return requestService.getRequestById(id)
                .map(request -> {
                    String operationType = PRODUCT_TO_OPERATION_TYPE.get(request.getProductType());
                    if (operationType == null) {
                        return ResponseEntity.ok(Map.<String, Object>of(
                                "error", "Unknown product type: " + request.getProductType(),
                                "productType", request.getProductType()
                        ));
                    }

                    // Get all event types for this operation type
                    List<EventTypeConfigQueryDTO> eventTypes =
                            eventConfigQueryService.getEventTypesForOperation(operationType, language);

                    // Get all workflow flows
                    List<EventFlowConfigQueryDTO> flows =
                            eventConfigQueryService.getAllFlows(operationType, language);

                    // Get initial events
                    List<EventFlowConfigQueryDTO> initialEvents =
                            eventConfigQueryService.getInitialEvents(operationType, language);

                    Map<String, Object> result = new HashMap<>();
                    result.put("productType", request.getProductType());
                    result.put("operationType", operationType);
                    result.put("eventTypes", eventTypes);
                    result.put("flows", flows);
                    result.put("initialEvents", initialEvents);

                    return ResponseEntity.ok(result);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get the status flow/history for a request.
     * Returns the timeline of status changes with timestamps.
     */
    @GetMapping("/{id}/status-flow")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_VIEW_ALL')")
    public ResponseEntity<Map<String, Object>> getStatusFlow(@PathVariable String id) {
        return requestService.getRequestById(id)
                .map(request -> {
                    List<Map<String, Object>> statusHistory = new ArrayList<>();

                    // DRAFT - Created
                    addStatusEvent(statusHistory, "DRAFT", "Borrador Creado",
                            request.getCreatedAt(), request.getCreatedBy(), "create");

                    // SUBMITTED
                    if (request.getSubmittedAt() != null) {
                        addStatusEvent(statusHistory, "SUBMITTED", "Solicitud Enviada",
                                request.getSubmittedAt(), request.getCreatedBy(), "send");
                    }

                    // IN_REVIEW
                    if (request.getReviewStartedAt() != null) {
                        addStatusEvent(statusHistory, "IN_REVIEW", "En Revisión",
                                request.getReviewStartedAt(), request.getAssignedToUserName(), "review");
                    }

                    // PENDING_DOCUMENTS (if applicable)
                    if ("PENDING_DOCUMENTS".equals(request.getStatus()) && request.getUpdatedAt() != null) {
                        addStatusEvent(statusHistory, "PENDING_DOCUMENTS", "Documentos Pendientes",
                                request.getUpdatedAt(), request.getAssignedToUserName(), "docs");
                    }

                    // APPROVED
                    if (request.getApprovedAt() != null) {
                        addStatusEvent(statusHistory, "APPROVED", "Aprobada",
                                request.getApprovedAt(), request.getApprovedByUserName(), "approve");
                    }

                    // REJECTED
                    if (request.getRejectedAt() != null) {
                        addStatusEvent(statusHistory, "REJECTED", "Rechazada",
                                request.getRejectedAt(), request.getApprovedByUserName(), "reject");
                    }

                    // Build response
                    Map<String, Object> result = new HashMap<>();
                    result.put("requestId", request.getId());
                    result.put("requestNumber", request.getRequestNumber());
                    result.put("currentStatus", request.getStatus());
                    result.put("currentStatusColor", STATUS_COLORS.getOrDefault(request.getStatus(), "gray"));
                    result.put("statusDetail", request.getStatusDetail());
                    result.put("statusHistory", statusHistory);
                    result.put("operationId", request.getOperationId());
                    result.put("operationReference", request.getOperationReference());

                    // Add available next statuses based on current state
                    result.put("availableTransitions", getAvailableTransitions(request));

                    // Include status colors configuration for frontend
                    result.put("statusColors", STATUS_COLORS);

                    // Include product type info
                    result.put("productType", request.getProductType());
                    result.put("productTypeLabel", PRODUCT_TYPE_LABELS.getOrDefault(request.getProductType(), request.getProductType()));

                    return ResponseEntity.ok(result);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private void addStatusEvent(List<Map<String, Object>> history, String status, String label,
                                LocalDateTime timestamp, String actor, String icon) {
        if (timestamp == null) return;

        Map<String, Object> event = new HashMap<>();
        event.put("status", status);
        event.put("label", label);
        event.put("timestamp", timestamp);
        event.put("actor", actor);
        event.put("icon", icon);
        event.put("color", STATUS_COLORS.getOrDefault(status, "gray"));
        history.add(event);
    }

    private List<Map<String, Object>> getAvailableTransitions(ClientRequestReadModel request) {
        List<Map<String, Object>> transitions = new ArrayList<>();

        switch (request.getStatus()) {
            case "DRAFT":
                transitions.add(Map.of("action", "submit", "targetStatus", "SUBMITTED", "label", "Enviar Solicitud"));
                transitions.add(Map.of("action", "cancel", "targetStatus", "CANCELLED", "label", "Cancelar"));
                break;
            case "SUBMITTED":
                transitions.add(Map.of("action", "assign", "targetStatus", "IN_REVIEW", "label", "Asignar y Revisar"));
                transitions.add(Map.of("action", "cancel", "targetStatus", "CANCELLED", "label", "Cancelar"));
                break;
            case "IN_REVIEW":
                transitions.add(Map.of("action", "approve", "targetStatus", "APPROVED", "label", "Aprobar"));
                transitions.add(Map.of("action", "reject", "targetStatus", "REJECTED", "label", "Rechazar"));
                transitions.add(Map.of("action", "request_docs", "targetStatus", "PENDING_DOCUMENTS", "label", "Solicitar Documentos"));
                break;
            case "PENDING_DOCUMENTS":
                transitions.add(Map.of("action", "resume_review", "targetStatus", "IN_REVIEW", "label", "Continuar Revisión"));
                transitions.add(Map.of("action", "cancel", "targetStatus", "CANCELLED", "label", "Cancelar"));
                break;
            // APPROVED, REJECTED, CANCELLED are final states
        }

        return transitions;
    }

    // ==================== Internal Processing Workflow Endpoints ====================

    /**
     * Get the internal processing workflow configuration.
     * This returns the 7-step internal bank processing workflow:
     * Recepcion -> Validacion -> Compliance -> Aprobacion -> Comisiones -> Registro -> Finalizado
     */
    @GetMapping("/{id}/internal-processing-config")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_VIEW_ALL')")
    public ResponseEntity<Map<String, Object>> getInternalProcessingConfig(
            @PathVariable String id,
            @RequestParam(defaultValue = "es") String language) {

        return requestService.getRequestById(id)
                .map(request -> {
                    String operationType = "INTERNAL_PROCESSING";

                    // Get all event types for internal processing
                    List<EventTypeConfigQueryDTO> eventTypes =
                            eventConfigQueryService.getEventTypesForOperation(operationType, language);

                    // Get all workflow flows
                    List<EventFlowConfigQueryDTO> flows =
                            eventConfigQueryService.getAllFlows(operationType, language);

                    // Get initial events
                    List<EventFlowConfigQueryDTO> initialEvents =
                            eventConfigQueryService.getInitialEvents(operationType, language);

                    // Define the main processing steps in order
                    List<String> mainSteps = List.of(
                            "INTERNAL_RECEPCION",
                            "INTERNAL_VALIDACION",
                            "INTERNAL_COMPLIANCE",
                            "INTERNAL_APROBACION",
                            "INTERNAL_COMISIONES",
                            "INTERNAL_REGISTRO",
                            "INTERNAL_FINALIZADO"
                    );

                    // Filter to get only main step events in order
                    List<EventTypeConfigQueryDTO> orderedSteps = mainSteps.stream()
                            .flatMap(code -> eventTypes.stream()
                                    .filter(e -> e.getEventCode().equals(code)))
                            .collect(Collectors.toList());

                    Map<String, Object> result = new HashMap<>();
                    result.put("requestId", request.getId());
                    result.put("requestNumber", request.getRequestNumber());
                    result.put("operationType", operationType);
                    result.put("steps", orderedSteps);
                    result.put("allEventTypes", eventTypes);
                    result.put("flows", flows);
                    result.put("initialEvents", initialEvents);
                    result.put("currentStage", request.getInternalProcessingStage());
                    result.put("processingStartedAt", request.getInternalProcessingStartedAt());

                    return ResponseEntity.ok(result);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get the internal processing status/history for a request.
     * Returns the timeline of internal processing steps with timestamps.
     */
    @GetMapping("/{id}/internal-processing-status")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_VIEW_ALL')")
    public ResponseEntity<Map<String, Object>> getInternalProcessingStatus(
            @PathVariable String id,
            @RequestParam(defaultValue = "es") String language) {

        return requestService.getRequestById(id)
                .map(request -> {
                    // Get event types for labels
                    List<EventTypeConfigQueryDTO> eventTypes =
                            eventConfigQueryService.getEventTypesForOperation("INTERNAL_PROCESSING", language);

                    Map<String, EventTypeConfigQueryDTO> eventTypeMap = eventTypes.stream()
                            .collect(Collectors.toMap(
                                    EventTypeConfigQueryDTO::getEventCode,
                                    e -> e,
                                    (e1, e2) -> e1
                            ));

                    // Get processing log entries
                    List<Map<String, Object>> history = requestService.getInternalProcessingHistory(request.getId());

                    // Enrich history with event type info
                    history.forEach(entry -> {
                        String eventCode = (String) entry.get("eventCode");
                        EventTypeConfigQueryDTO eventType = eventTypeMap.get(eventCode);
                        if (eventType != null) {
                            entry.put("eventName", eventType.getEventName());
                            entry.put("eventDescription", eventType.getEventDescription());
                            entry.put("icon", eventType.getIcon());
                            entry.put("color", eventType.getColor());
                        }
                    });

                    // Determine current step and available transitions
                    String currentStage = request.getInternalProcessingStage();
                    List<Map<String, Object>> availableTransitions = new ArrayList<>();

                    if (currentStage != null) {
                        // Get flows from current stage
                        List<EventFlowConfigQueryDTO> flows =
                                eventConfigQueryService.getAllFlows("INTERNAL_PROCESSING", language);

                        String currentEventCode = "INTERNAL_" + currentStage;
                        flows.stream()
                                .filter(f -> currentEventCode.equals(f.getFromEventCode()))
                                .forEach(flow -> {
                                    Map<String, Object> transition = new HashMap<>();
                                    transition.put("eventCode", flow.getToEventCode());
                                    transition.put("label", flow.getTransitionLabel());
                                    transition.put("help", flow.getTransitionHelp());
                                    transition.put("isRequired", flow.getIsRequired());
                                    transition.put("isOptional", flow.getIsOptional());

                                    EventTypeConfigQueryDTO targetEvent = eventTypeMap.get(flow.getToEventCode());
                                    if (targetEvent != null) {
                                        transition.put("targetStage", targetEvent.getResultingStage());
                                        transition.put("icon", targetEvent.getIcon());
                                        transition.put("color", targetEvent.getColor());
                                    }
                                    availableTransitions.add(transition);
                                });
                    } else if ("SUBMITTED".equals(request.getStatus()) || "IN_REVIEW".equals(request.getStatus())) {
                        // If not started, show initial transition
                        List<EventFlowConfigQueryDTO> initialEvents =
                                eventConfigQueryService.getInitialEvents("INTERNAL_PROCESSING", language);
                        initialEvents.forEach(flow -> {
                            Map<String, Object> transition = new HashMap<>();
                            transition.put("eventCode", flow.getToEventCode());
                            transition.put("label", flow.getTransitionLabel());
                            transition.put("help", flow.getTransitionHelp());
                            transition.put("isRequired", flow.getIsRequired());

                            EventTypeConfigQueryDTO targetEvent = eventTypeMap.get(flow.getToEventCode());
                            if (targetEvent != null) {
                                transition.put("targetStage", targetEvent.getResultingStage());
                                transition.put("icon", targetEvent.getIcon());
                                transition.put("color", targetEvent.getColor());
                            }
                            availableTransitions.add(transition);
                        });
                    }

                    Map<String, Object> result = new HashMap<>();
                    result.put("requestId", request.getId());
                    result.put("requestNumber", request.getRequestNumber());
                    result.put("currentStage", currentStage);
                    result.put("processingStartedAt", request.getInternalProcessingStartedAt());
                    result.put("history", history);
                    result.put("availableTransitions", availableTransitions);
                    result.put("isCompleted", "FINALIZADO".equals(currentStage));
                    result.put("isRejected", "RECHAZADO".equals(currentStage));

                    return ResponseEntity.ok(result);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Execute an internal processing transition.
     */
    @PostMapping("/{id}/internal-processing/transition")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_PROCESS')")
    public ResponseEntity<Map<String, Object>> executeInternalProcessingTransition(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Name") String userName) {

        String eventCode = body.get("eventCode");
        String comments = body.get("comments");

        logger.info("Executing internal processing transition {} for request {} by {}",
                eventCode, id, userName);

        try {
            ClientRequestReadModel updated = requestService.executeInternalProcessingTransition(
                    id, eventCode, userId, userName, comments);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("request", requestService.toDTO(updated));
            result.put("newStage", updated.getInternalProcessingStage());

            return ResponseEntity.ok(result);
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    // ==================== WorkboxDrafts Integration Endpoints ====================

    /**
     * Get client requests pending registration (in REGISTRO stage).
     * These are requests that have completed internal processing and are ready
     * for an operator to create the operation in the system.
     */
    @GetMapping("/pending-registration")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_VIEW_ALL')")
    public ResponseEntity<List<ClientRequestDTO>> getRequestsPendingRegistration(
            @RequestParam(required = false) String productType,
            @PageableDefault(size = 50) Pageable pageable) {

        logger.info("Getting client requests pending registration, productType={}", productType);

        Page<ClientRequestReadModel> requests = requestService.getRequestsByInternalStage("REGISTRO", productType, pageable);

        List<ClientRequestDTO> dtos = requests.getContent().stream()
                .map(requestService::toDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    /**
     * Get mapped data for a client request to create an operation.
     * This applies the field mappings configured in custom_field_config_readmodel
     * to transform portal data to operation/SWIFT data.
     */
    @GetMapping("/{id}/mapped-data")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_VIEW_ALL')")
    public ResponseEntity<Map<String, Object>> getMappedDataForOperation(@PathVariable String id) {
        return requestService.getRequestById(id)
                .map(request -> {
                    String sourceProductType = request.getProductType();
                    String targetProductType = fieldMappingService.getTargetProductType(sourceProductType);

                    if (targetProductType == null) {
                        return ResponseEntity.ok(Map.<String, Object>of(
                                "error", "No target product type mapping found for: " + sourceProductType,
                                "sourceProductType", sourceProductType
                        ));
                    }

                    // Parse custom data from JSON
                    Map<String, Object> sourceData = new HashMap<>();
                    if (request.getCustomData() != null) {
                        try {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> customData = new com.fasterxml.jackson.databind.ObjectMapper()
                                    .readValue(request.getCustomData(), Map.class);
                            sourceData.putAll(customData);
                        } catch (Exception e) {
                            logger.error("Error parsing custom data for request {}", id, e);
                        }
                    }

                    // Add standard fields
                    sourceData.put("clientId", request.getClientId());
                    sourceData.put("clientName", request.getClientName());
                    sourceData.put("requestNumber", request.getRequestNumber());
                    sourceData.put("amount", request.getAmount());
                    sourceData.put("currency", request.getCurrency());

                    // Apply field mappings
                    Map<String, Object> mappedData = fieldMappingService.applyMappings(
                            sourceProductType, targetProductType, sourceData);

                    Map<String, Object> result = new HashMap<>();
                    result.put("success", true);
                    result.put("requestId", request.getId());
                    result.put("requestNumber", request.getRequestNumber());
                    result.put("sourceProductType", sourceProductType);
                    result.put("targetProductType", targetProductType);
                    result.put("sourceData", sourceData);
                    result.put("mappedData", mappedData);
                    result.put("clientInfo", Map.of(
                            "clientId", request.getClientId(),
                            "clientName", request.getClientName(),
                            "clientIdentification", request.getClientIdentification() != null ? request.getClientIdentification() : ""
                    ));

                    return ResponseEntity.ok(result);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get form data from the SWIFT draft associated with a client request.
     * Returns the custom data stored in the draft, which can be used to
     * pre-fill the operation wizard when creating an operation from a client request.
     */
    @GetMapping("/{id}/form-data")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_VIEW_ALL')")
    public ResponseEntity<Map<String, Object>> getFormDataFromDraft(@PathVariable String id) {
        return requestService.getRequestById(id)
                .map(request -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("requestId", request.getId());
                    result.put("requestNumber", request.getRequestNumber());
                    result.put("draftId", request.getDraftId());

                    if (request.getDraftId() != null) {
                        // Get form data from the draft
                        Map<String, Object> formData = requestService.getFormDataFromDraft(id);
                        result.put("formData", formData);
                        result.put("hasDraft", true);
                    } else {
                        // No draft, return custom data from the request
                        if (request.getCustomData() != null) {
                            try {
                                @SuppressWarnings("unchecked")
                                Map<String, Object> customData = new com.fasterxml.jackson.databind.ObjectMapper()
                                        .readValue(request.getCustomData(), Map.class);
                                result.put("formData", customData);
                            } catch (Exception e) {
                                logger.error("Error parsing custom data for request {}", id, e);
                                result.put("formData", new HashMap<>());
                            }
                        } else {
                            result.put("formData", new HashMap<>());
                        }
                        result.put("hasDraft", false);
                    }

                    // Include client info
                    result.put("clientInfo", Map.of(
                            "clientId", request.getClientId(),
                            "clientName", request.getClientName(),
                            "clientIdentification", request.getClientIdentification() != null ? request.getClientIdentification() : ""
                    ));

                    return ResponseEntity.ok(result);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Link a created operation to the client request.
     * Called after the operator creates the operation from the mapped data.
     */
    @PostMapping("/{id}/link-operation")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_PROCESS')")
    public ResponseEntity<ClientRequestDTO> linkOperation(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Name") String userName) {

        String operationId = body.get("operationId");
        String operationReference = body.get("operationReference");

        logger.info("Linking operation {} ({}) to request {} by {}",
                operationId, operationReference, id, userName);

        try {
            ClientRequestReadModel updated = requestService.linkOperation(
                    id, operationId, operationReference, userId, userName);

            return ResponseEntity.ok(requestService.toDTO(updated));
        } catch (Exception e) {
            logger.error("Error linking operation to request {}", id, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Find a client request by operation reference.
     * Returns the client request linked to the given operation.
     */
    @GetMapping("/by-operation-reference/{operationReference}")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_VIEW_ALL')")
    public ResponseEntity<ClientRequestDTO> getByOperationReference(@PathVariable String operationReference) {
        List<ClientRequestReadModel> requests = requestService.findByOperationReference(operationReference);

        if (requests.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // Return the first one (should be unique)
        return ResponseEntity.ok(requestService.toDTO(requests.get(0)));
    }

    /**
     * Get documents associated with a client request by operation reference.
     * Uses the central document manager - documents are linked via event_id = request.id.
     *
     * This is the correct way to retrieve documents:
     * - Documents are uploaded with event_id = client_request.id
     * - Query by event_id from the document_readmodel table
     * - Storage provider agnostic (LOCAL, S3, Azure, GCS)
     */
    @GetMapping("/by-operation-reference/{operationReference}/documents")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_VIEW_ALL')")
    public ResponseEntity<List<DocumentResponse>> getDocumentsByOperationReference(@PathVariable String operationReference) {
        List<ClientRequestReadModel> requests = requestService.findByOperationReference(operationReference);

        if (requests.isEmpty()) {
            logger.debug("No client request found for operation reference: {}", operationReference);
            return ResponseEntity.ok(List.of());
        }

        ClientRequestReadModel request = requests.get(0);
        List<DocumentResponse> allDocuments = new ArrayList<>();

        // Primary query: documents linked by event_id = request.id
        // This is the standard way documents are associated when uploaded from client portal
        // Using file validation to exclude documents with missing files
        Page<DocumentResponse> documentsByRequestId = documentService.getDocumentsWithFileValidation(
                null,                // operationId
                request.getId(),     // eventId = client_request.id
                null,                // categoryCode
                null,                // documentTypeCode
                null,                // uploadedBy
                null,                // mimeType
                null,                // searchText
                PageRequest.of(0, 100)
        );
        allDocuments.addAll(documentsByRequestId.getContent());

        logger.debug("Found {} documents by request ID {} for operation {}",
                documentsByRequestId.getTotalElements(), request.getId(), operationReference);

        // Secondary query: also check by SWIFT draft ID if available
        // Some documents may have been linked to the draft instead of the request
        if (request.getDraftId() != null && !request.getDraftId().isEmpty()) {
            Page<DocumentResponse> documentsByDraftId = documentService.getDocumentsWithFileValidation(
                    null, request.getDraftId(), null, null, null, null, null, PageRequest.of(0, 100));

            // Add only if not already in the list (avoid duplicates)
            for (DocumentResponse doc : documentsByDraftId.getContent()) {
                if (allDocuments.stream().noneMatch(d -> d.getDocumentId().equals(doc.getDocumentId()))) {
                    allDocuments.add(doc);
                }
            }

            logger.debug("Found {} additional documents by draft ID {}",
                    documentsByDraftId.getTotalElements(), request.getDraftId());
        }

        return ResponseEntity.ok(allDocuments);
    }

    // ==================== Workflow Permission & Approval Endpoints ====================

    /**
     * Get user permissions for a specific request based on current stage.
     * Returns what actions the user can perform.
     */
    @GetMapping("/{id}/permissions")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_VIEW_ALL')")
    public ResponseEntity<Map<String, Object>> getUserPermissions(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails user) {

        List<String> userRoles = user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        Map<String, Boolean> permissions = requestService.getUserPermissionsForRequest(id, userRoles);

        Map<String, Object> result = new HashMap<>();
        result.put("requestId", id);
        result.put("permissions", permissions);
        result.put("userRoles", userRoles);

        return ResponseEntity.ok(result);
    }

    /**
     * Get validation results for a request.
     * Returns all CONFIGURED validations with their execution status (pending, passed, failed).
     * This shows what validations are expected and their current status.
     */
    @GetMapping("/{id}/validations")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_VIEW_ALL')")
    public ResponseEntity<Map<String, Object>> getValidationResults(@PathVariable String id) {
        return requestService.getRequestById(id)
                .map(request -> {
                    // Get configured validations with their execution results
                    List<StageApprovalService.ValidationResult> validations =
                            requestService.getConfiguredValidationsWithResults(id);

                    long passedCount = validations.stream()
                            .filter(v -> "PASSED".equals(v.getStatus()))
                            .count();
                    long failedCount = validations.stream()
                            .filter(v -> "FAILED".equals(v.getStatus()))
                            .count();
                    long pendingCount = validations.stream()
                            .filter(v -> "PENDING".equals(v.getStatus()))
                            .count();
                    boolean allPassed = validations.stream()
                            .allMatch(v -> "PASSED".equals(v.getStatus()));
                    boolean allExecuted = pendingCount == 0;

                    Map<String, Object> result = new HashMap<>();
                    result.put("requestId", id);
                    result.put("validations", validations);
                    result.put("totalCount", validations.size());
                    result.put("passedCount", passedCount);
                    result.put("failedCount", failedCount);
                    result.put("pendingCount", pendingCount);
                    result.put("allPassed", allPassed);
                    result.put("allExecuted", allExecuted);
                    result.put("currentStage", request.getInternalProcessingStage());

                    return ResponseEntity.ok(result);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get compliance/screening results for a request.
     * Returns all CONFIGURED compliance checks with their execution status.
     * This shows what screenings are expected and their current status.
     */
    @GetMapping("/{id}/compliance")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_VIEW_ALL')")
    public ResponseEntity<Map<String, Object>> getComplianceResults(@PathVariable String id) {
        return requestService.getRequestById(id)
                .map(request -> {
                    // Get configured compliance checks with their execution results
                    List<StageApprovalService.ComplianceResult> screenings =
                            requestService.getConfiguredComplianceWithResults(id);

                    long clearCount = screenings.stream()
                            .filter(s -> "CLEAR".equals(s.getStatus()))
                            .count();
                    long matchCount = screenings.stream()
                            .filter(s -> "MATCH".equals(s.getStatus()))
                            .count();
                    long pendingCount = screenings.stream()
                            .filter(s -> "PENDING".equals(s.getStatus()))
                            .count();
                    long errorCount = screenings.stream()
                            .filter(s -> "ERROR".equals(s.getStatus()))
                            .count();
                    boolean hasMatches = matchCount > 0;
                    boolean allExecuted = pendingCount == 0;

                    String overallRiskLevel = screenings.stream()
                            .map(StageApprovalService.ComplianceResult::getRiskLevel)
                            .reduce("LOW", (a, b) -> {
                                if ("HIGH".equals(a) || "HIGH".equals(b)) return "HIGH";
                                if ("MEDIUM".equals(a) || "MEDIUM".equals(b)) return "MEDIUM";
                                return "LOW";
                            });

                    Map<String, Object> result = new HashMap<>();
                    result.put("requestId", id);
                    result.put("screenings", screenings);
                    result.put("totalCount", screenings.size());
                    result.put("clearCount", clearCount);
                    result.put("matchCount", matchCount);
                    result.put("pendingCount", pendingCount);
                    result.put("errorCount", errorCount);
                    result.put("allExecuted", allExecuted);
                    result.put("hasMatches", hasMatches);
                    result.put("overallRiskLevel", overallRiskLevel);
                    result.put("currentStage", request.getInternalProcessingStage());

                    return ResponseEntity.ok(result);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get approval chain status for a request.
     * Returns the multi-level approval progress.
     */
    @GetMapping("/{id}/approval-chain")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_VIEW_ALL')")
    public ResponseEntity<Map<String, Object>> getApprovalChainStatus(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails user) {

        return requestService.getRequestById(id)
                .map(request -> {
                    StageApprovalService.ApprovalChainStatus chainStatus =
                            requestService.getApprovalChainStatus(id);

                    List<String> userRoles = user.getAuthorities().stream()
                            .map(GrantedAuthority::getAuthority)
                            .collect(Collectors.toList());

                    // Check if user can approve at current level
                    boolean canUserApproveNow = chainStatus.getCurrentPendingLevel() != null &&
                            stageApprovalService.canUserApproveInStage(
                                    request.getInternalProcessingStage(), userRoles);

                    Map<String, Object> result = new HashMap<>();
                    result.put("requestId", id);
                    result.put("stageCode", chainStatus.getStageCode());
                    result.put("approvals", chainStatus.getApprovals());
                    result.put("allComplete", chainStatus.isAllComplete());
                    result.put("hasRejection", chainStatus.isHasRejection());
                    result.put("currentPendingLevel", chainStatus.getCurrentPendingLevel());
                    result.put("canUserApproveNow", canUserApproveNow);
                    result.put("userRoles", userRoles);
                    result.put("currentStage", request.getInternalProcessingStage());

                    return ResponseEntity.ok(result);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Process an approval in the multi-level approval chain.
     */
    @PostMapping("/{id}/approval-chain/approve")
    @PreAuthorize("hasPermission(null, 'CAN_APPROVE_REQUESTS')")
    public ResponseEntity<Map<String, Object>> processChainApproval(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Name") String userName,
            @AuthenticationPrincipal UserDetails user) {

        String comments = body.get("comments");

        List<String> userRoles = user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        logger.info("Processing approval for request {} by user {} with roles {}",
                id, userName, userRoles);

        try {
            ClientRequestReadModel updated = requestService.processApprovalChainApproval(
                    id, userId, userName, userRoles, comments);

            StageApprovalService.ApprovalChainStatus chainStatus =
                    requestService.getApprovalChainStatus(id);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("request", requestService.toDTO(updated));
            result.put("chainStatus", chainStatus);
            result.put("message", chainStatus.isAllComplete() ?
                    "Aprobación completa. Solicitud avanzada a siguiente etapa." :
                    "Aprobación registrada. Pendiente nivel " + chainStatus.getCurrentPendingLevel());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error processing approval for request {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Process a rejection in the multi-level approval chain.
     */
    @PostMapping("/{id}/approval-chain/reject")
    @PreAuthorize("hasPermission(null, 'CAN_APPROVE_REQUESTS')")
    public ResponseEntity<Map<String, Object>> processChainRejection(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Name") String userName,
            @AuthenticationPrincipal UserDetails user) {

        String comments = body.get("comments");
        if (comments == null || comments.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Se requiere un motivo de rechazo"
            ));
        }

        List<String> userRoles = user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        logger.info("Processing rejection for request {} by user {} with roles {}",
                id, userName, userRoles);

        try {
            ClientRequestReadModel updated = requestService.processApprovalChainRejection(
                    id, userId, userName, userRoles, comments);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("request", requestService.toDTO(updated));
            result.put("message", "Solicitud rechazada");

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error processing rejection for request {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Execute internal processing transition with role verification.
     * Enhanced version that validates user permissions before transition.
     */
    @PostMapping("/{id}/internal-processing/transition-v2")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_PROCESS')")
    public ResponseEntity<Map<String, Object>> executeInternalProcessingTransitionWithRoles(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Name") String userName,
            @AuthenticationPrincipal UserDetails user) {

        String eventCode = body.get("eventCode");
        String comments = body.get("comments");

        List<String> userRoles = user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        logger.info("Executing internal processing transition {} for request {} by {} with roles {}",
                eventCode, id, userName, userRoles);

        try {
            ClientRequestReadModel updated = requestService.executeInternalProcessingTransition(
                    id, eventCode, userId, userName, comments, userRoles);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("request", requestService.toDTO(updated));
            result.put("newStage", updated.getInternalProcessingStage());

            // If entering APROBACION, include approval chain status
            if ("APROBACION".equals(updated.getInternalProcessingStage())) {
                StageApprovalService.ApprovalChainStatus chainStatus =
                        requestService.getApprovalChainStatus(id);
                result.put("approvalChainStatus", chainStatus);
            }

            return ResponseEntity.ok(result);
        } catch (SecurityException e) {
            logger.warn("Permission denied for transition {} on request {} by {}: {}",
                    eventCode, id, userName, e.getMessage());
            return ResponseEntity.status(403).body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Get pending approvals for current user.
     * Returns all requests waiting for approval by the current user's roles.
     */
    @GetMapping("/pending-approvals")
    @PreAuthorize("hasPermission(null, 'CAN_VIEW_APPROVAL_CHAIN')")
    public ResponseEntity<List<Map<String, Object>>> getPendingApprovalsForUser(
            @AuthenticationPrincipal UserDetails user) {

        List<String> userRoles = user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        List<com.globalcmx.api.clientportal.entity.StageApprovalChain> pendingApprovals =
                stageApprovalService.getPendingApprovalsForUser(userRoles);

        List<Map<String, Object>> result = pendingApprovals.stream()
                .map(approval -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("approvalId", approval.getId());
                    item.put("requestId", approval.getRequestId());
                    item.put("stageCode", approval.getStageCode());
                    item.put("approvalLevel", approval.getApprovalLevel());
                    item.put("requiredRole", approval.getRequiredRole());
                    item.put("pendingSince", approval.getCreatedAt());

                    // Get request details
                    requestService.getRequestById(approval.getRequestId())
                            .ifPresent(request -> {
                                item.put("requestNumber", request.getRequestNumber());
                                item.put("clientName", request.getClientName());
                                item.put("productType", request.getProductType());
                                item.put("amount", request.getAmount());
                                item.put("currency", request.getCurrency());
                            });

                    return item;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * Get stage role configuration.
     * Returns the role permissions configured for a specific stage.
     */
    @GetMapping("/stage-config/{stageCode}")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_VIEW_ALL')")
    public ResponseEntity<Map<String, Object>> getStageConfig(@PathVariable String stageCode) {
        var roleAssignments = stageApprovalService.getStageRoleAssignments(stageCode);

        Map<String, Object> result = new HashMap<>();
        result.put("stageCode", stageCode);
        result.put("roleAssignments", roleAssignments);
        result.put("requiresApproval", stageApprovalService.stageRequiresApproval(stageCode));

        return ResponseEntity.ok(result);
    }

    // ==================== Validation & Compliance Retry / Skip / History ====================

    /**
     * Get retry preview for a validation check.
     * Returns the data that will be sent to the external API, allowing the user to edit values.
     */
    @GetMapping("/{id}/validations/{checkCode}/retry-preview")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_PROCESS')")
    public ResponseEntity<RetryPreviewResponse> getValidationRetryPreview(
            @PathVariable String id,
            @PathVariable String checkCode,
            @RequestHeader("X-User-Id") String userId) {

        try {
            RetryPreviewResponse preview = requestService.getRetryPreview(id, checkCode, userId);
            return ResponseEntity.ok(preview);
        } catch (Exception e) {
            logger.error("Error getting retry preview for validation {} on request {}: {}", checkCode, id, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get retry preview for a compliance screening.
     */
    @GetMapping("/{id}/compliance/{screeningCode}/retry-preview")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_PROCESS')")
    public ResponseEntity<RetryPreviewResponse> getComplianceRetryPreview(
            @PathVariable String id,
            @PathVariable String screeningCode,
            @RequestHeader("X-User-Id") String userId) {

        try {
            RetryPreviewResponse preview = requestService.getRetryPreview(id, screeningCode, userId);
            return ResponseEntity.ok(preview);
        } catch (Exception e) {
            logger.error("Error getting retry preview for compliance {} on request {}: {}", screeningCode, id, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Retry a specific validation check.
     * Re-executes the external API and logs the result.
     * Accepts optional contextOverrides in the request body to modify data before execution.
     */
    @PostMapping("/{id}/validations/{checkCode}/retry")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_PROCESS')")
    public ResponseEntity<Map<String, Object>> retryValidation(
            @PathVariable String id,
            @PathVariable String checkCode,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Name") String userName,
            @RequestBody(required = false) Map<String, Object> body) {

        logger.info("Retrying validation {} for request {} by {}", checkCode, id, userName);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> contextOverrides = body != null
                    ? (Map<String, Object>) body.get("contextOverrides")
                    : null;

            var result = (contextOverrides != null && !contextOverrides.isEmpty())
                    ? requestService.retryValidation(id, checkCode, userId, contextOverrides)
                    : requestService.retryValidation(id, checkCode, userId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("validation", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error retrying validation {} for request {}: {}", checkCode, id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Skip a validation check with documented reason.
     */
    @PostMapping("/{id}/validations/{checkCode}/skip")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_PROCESS')")
    public ResponseEntity<Map<String, Object>> skipValidation(
            @PathVariable String id,
            @PathVariable String checkCode,
            @RequestBody Map<String, String> body,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Name") String userName) {

        String reason = body.get("reason");
        if (reason == null || reason.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Reason is required to skip a validation"
            ));
        }

        logger.info("Skipping validation {} for request {} by {} with reason: {}", checkCode, id, userName, reason);

        try {
            requestService.skipValidation(id, checkCode, reason, userId, userName);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            logger.error("Error skipping validation {} for request {}: {}", checkCode, id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Retry a specific compliance screening.
     * Accepts optional contextOverrides in the request body to modify data before execution.
     */
    @PostMapping("/{id}/compliance/{screeningCode}/retry")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_PROCESS')")
    public ResponseEntity<Map<String, Object>> retryCompliance(
            @PathVariable String id,
            @PathVariable String screeningCode,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Name") String userName,
            @RequestBody(required = false) Map<String, Object> body) {

        logger.info("Retrying compliance {} for request {} by {}", screeningCode, id, userName);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> contextOverrides = body != null
                    ? (Map<String, Object>) body.get("contextOverrides")
                    : null;

            var result = (contextOverrides != null && !contextOverrides.isEmpty())
                    ? requestService.retryCompliance(id, screeningCode, userId, contextOverrides)
                    : requestService.retryCompliance(id, screeningCode, userId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("screening", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error retrying compliance {} for request {}: {}", screeningCode, id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Skip a compliance screening with documented reason.
     */
    @PostMapping("/{id}/compliance/{screeningCode}/skip")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_PROCESS')")
    public ResponseEntity<Map<String, Object>> skipCompliance(
            @PathVariable String id,
            @PathVariable String screeningCode,
            @RequestBody Map<String, String> body,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Name") String userName) {

        String reason = body.get("reason");
        if (reason == null || reason.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Reason is required to skip a compliance screening"
            ));
        }

        logger.info("Skipping compliance {} for request {} by {} with reason: {}", screeningCode, id, userName, reason);

        try {
            requestService.skipCompliance(id, screeningCode, reason, userId, userName);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            logger.error("Error skipping compliance {} for request {}: {}", screeningCode, id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Get API call history for a specific validation/compliance check.
     * Returns all attempts (retries, skips) from the external API call log.
     */
    @GetMapping("/{id}/api-call-logs/{apiConfigCode}")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_VIEW_ALL')")
    public ResponseEntity<Map<String, Object>> getApiCallHistory(
            @PathVariable String id,
            @PathVariable String apiConfigCode) {

        List<Map<String, Object>> history = requestService.getApiCallHistory(id, apiConfigCode);

        Map<String, Object> result = new HashMap<>();
        result.put("requestId", id);
        result.put("apiConfigCode", apiConfigCode);
        result.put("entries", history);
        result.put("totalEntries", history.size());

        return ResponseEntity.ok(result);
    }

    /**
     * Exception handlers.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalState(IllegalStateException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<Map<String, String>> handleSecurityException(SecurityException ex) {
        return ResponseEntity.status(403).body(Map.of("error", ex.getMessage()));
    }
}
