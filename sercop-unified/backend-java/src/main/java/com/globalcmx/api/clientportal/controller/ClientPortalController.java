package com.globalcmx.api.clientportal.controller;

import com.globalcmx.api.clientportal.dto.CreateClientRequestDTO;
import com.globalcmx.api.clientportal.dto.ClientRequestDTO;
import com.globalcmx.api.clientportal.dto.ClientOperationDTO;
import com.globalcmx.api.clientportal.dto.ClientEventRequestDTO;
import com.globalcmx.api.clientportal.entity.ClientRequestReadModel;
import com.globalcmx.api.clientportal.service.ClientRequestService;
import com.globalcmx.api.clientportal.service.ClientEventRequestService;
import com.globalcmx.api.clientportal.service.ParticipantHierarchyService;
import com.globalcmx.api.customfields.dto.CustomFieldsConfigurationDTO;
import com.globalcmx.api.customfields.service.CustomFieldConfigService;
import com.globalcmx.api.document.dto.DocumentResponse;
import com.globalcmx.api.document.service.DocumentService;
import com.globalcmx.api.dto.query.EventFlowConfigQueryDTO;
import com.globalcmx.api.readmodel.entity.OperationEventLogReadModel;
import com.globalcmx.api.readmodel.entity.OperationReadModel;
import com.globalcmx.api.readmodel.entity.ParticipanteReadModel;
import com.globalcmx.api.readmodel.repository.OperationEventLogReadModelRepository;
import com.globalcmx.api.readmodel.repository.OperationReadModelRepository;
import com.globalcmx.api.readmodel.repository.ParticipanteReadModelRepository;
import com.globalcmx.api.readmodel.repository.EventTypeConfigReadModelRepository;
import com.globalcmx.api.readmodel.entity.EventTypeConfigReadModel;
import com.globalcmx.api.service.EventConfigQueryService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import com.globalcmx.api.security.entity.UserPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * REST Controller for Client Portal operations.
 * All endpoints enforce data isolation by requiring and validating clientId.
 */
@RestController
@RequestMapping("/client-portal")
public class ClientPortalController {

    private static final Logger logger = LoggerFactory.getLogger(ClientPortalController.class);

    private final ClientRequestService requestService;
    private final ClientEventRequestService eventRequestService;
    private final CustomFieldConfigService customFieldConfigService;
    private final OperationReadModelRepository operationRepository;
    private final OperationEventLogReadModelRepository operationEventLogRepository;
    private final ParticipanteReadModelRepository participantRepository;
    private final ParticipantHierarchyService hierarchyService;
    private final DocumentService documentService;
    private final EventConfigQueryService eventConfigQueryService;
    private final EventTypeConfigReadModelRepository eventTypeConfigRepository;

    // Allowed product types for client portal
    private static final Set<String> ALLOWED_PRODUCT_TYPES = Set.of(
            "CLIENT_GUARANTEE_REQUEST",
            "CLIENT_LC_IMPORT_REQUEST",
            "CLIENT_LC_EXPORT_REQUEST",
            "CLIENT_COLLECTION_REQUEST"
    );

    public ClientPortalController(
            ClientRequestService requestService,
            ClientEventRequestService eventRequestService,
            CustomFieldConfigService customFieldConfigService,
            OperationReadModelRepository operationRepository,
            OperationEventLogReadModelRepository operationEventLogRepository,
            ParticipanteReadModelRepository participantRepository,
            ParticipantHierarchyService hierarchyService,
            DocumentService documentService,
            EventConfigQueryService eventConfigQueryService,
            EventTypeConfigReadModelRepository eventTypeConfigRepository) {
        this.requestService = requestService;
        this.eventRequestService = eventRequestService;
        this.customFieldConfigService = customFieldConfigService;
        this.operationRepository = operationRepository;
        this.operationEventLogRepository = operationEventLogRepository;
        this.participantRepository = participantRepository;
        this.hierarchyService = hierarchyService;
        this.documentService = documentService;
        this.eventConfigQueryService = eventConfigQueryService;
        this.eventTypeConfigRepository = eventTypeConfigRepository;
    }

    /**
     * Create a new request.
     */
    @PostMapping("/requests")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_CREATE')")
    public ResponseEntity<ClientRequestDTO> createRequest(
            @Valid @RequestBody CreateClientRequestDTO request,
            @RequestHeader(value = "X-Client-Id", required = false) String clientId,
            @RequestHeader(value = "X-Client-Name", required = false) String clientName,
            @AuthenticationPrincipal UserDetails user) {

        // Get effective clientId: prefer header, fallback to UserPrincipal.clienteId
        String effectiveClientId = clientId;
        if ((effectiveClientId == null || effectiveClientId.isEmpty()) && user instanceof UserPrincipal userPrincipal) {
            effectiveClientId = userPrincipal.getClienteId();
            logger.debug("Using clientId from UserPrincipal: {}", effectiveClientId);
        }

        // Validate that clientId is present (required for data isolation)
        if (effectiveClientId == null || effectiveClientId.isEmpty()) {
            logger.warn("Cannot create request: clientId is required but was not provided");
            return ResponseEntity.badRequest().build();
        }

        logger.info("Creating new request for client: {} by user: {}", effectiveClientId, user.getUsername());

        // Use clientName from header, or from request body, or fetch from participant
        String effectiveClientName = clientName;
        if (effectiveClientName == null || effectiveClientName.isEmpty()) {
            effectiveClientName = request.getClientName();
        }
        if (effectiveClientName == null || effectiveClientName.isEmpty()) {
            // Try to get client name from participant repository
            try {
                Long participantId = Long.parseLong(effectiveClientId);
                effectiveClientName = participantRepository.findById(participantId)
                        .map(ParticipanteReadModel::getDisplayName)
                        .orElse(effectiveClientId);
            } catch (NumberFormatException e) {
                effectiveClientName = effectiveClientId;
            }
        }

        ClientRequestReadModel clientRequest = requestService.createRequest(effectiveClientId, effectiveClientName, request, user.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(requestService.toDTO(clientRequest));
    }

    /**
     * Get a specific request by ID.
     * For internal users (null clientId): no data isolation check (backoffice mode).
     */
    @GetMapping("/requests/{id}")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_VIEW')")
    public ResponseEntity<ClientRequestDTO> getRequest(
            @PathVariable String id,
            @RequestHeader(value = "X-Client-Id", required = false) String clientId) {

        // Internal users can view any request - backoffice mode
        if (clientId == null || clientId.isEmpty()) {
            return requestService.getRequestById(id)
                    .map(r -> ResponseEntity.ok(requestService.toDTO(r)))
                    .orElse(ResponseEntity.notFound().build());
        }

        return requestService.getRequestById(id, clientId)
                .map(r -> ResponseEntity.ok(requestService.toDTO(r)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get documents associated with a request.
     * Uses the central document service to retrieve files regardless of storage provider.
     * For internal users (null clientId): no data isolation check (backoffice mode).
     */
    @GetMapping("/requests/{id}/documents")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_VIEW')")
    public ResponseEntity<List<DocumentResponse>> getRequestDocuments(
            @PathVariable String id,
            @RequestHeader(value = "X-Client-Id", required = false) String clientId) {

        // First verify the request exists
        // Internal users can view any request's documents
        if (clientId == null || clientId.isEmpty()) {
            if (requestService.getRequestById(id).isEmpty()) {
                return ResponseEntity.notFound().build();
            }
        } else {
            if (requestService.getRequestById(id, clientId).isEmpty()) {
                return ResponseEntity.notFound().build();
            }
        }

        // Get documents where eventId matches the request ID
        // Using file validation to exclude documents with missing files
        Page<DocumentResponse> documents = documentService.getDocumentsWithFileValidation(
                null,           // operationId
                id,             // eventId (request ID used as draftId during upload)
                null,           // categoryCode
                null,           // documentTypeCode
                null,           // uploadedBy
                null,           // mimeType
                null,           // searchText
                org.springframework.data.domain.PageRequest.of(0, 100)
        );

        return ResponseEntity.ok(documents.getContent());
    }

    /**
     * List all requests for the client.
     * For corporation users: can filter by specific company or view all.
     * For internal users (null clientId): returns ALL requests (backoffice mode).
     */
    @GetMapping("/requests")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_VIEW')")
    public ResponseEntity<Page<ClientRequestDTO>> listRequests(
            @RequestHeader(value = "X-Client-Id", required = false) String clientId,
            @RequestParam(required = false) String productType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long companyId,
            @PageableDefault(size = 20) Pageable pageable) {

        // Internal users (no clientId) see all requests - backoffice mode
        if (clientId == null || clientId.isEmpty()) {
            logger.debug("Internal user accessing requests - backoffice mode");
            Page<ClientRequestReadModel> page = requestService.searchAllRequests(
                    companyId != null ? companyId.toString() : null,
                    productType, status, null, search, pageable);
            Page<ClientRequestDTO> dtoPage = page.map(requestService::toDTO);
            return ResponseEntity.ok(dtoPage);
        }

        Long participantId;
        try {
            participantId = Long.parseLong(clientId);
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().build();
        }

        // If companyId specified, validate access
        String targetClientId;
        if (companyId != null) {
            if (!hierarchyService.canAccessParticipant(participantId, companyId)) {
                logger.warn("User {} attempted to access requests for unauthorized company {}", participantId, companyId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            targetClientId = companyId.toString();
        } else {
            // For corporation users viewing all companies, get all accessible IDs
            List<Long> accessibleIds = hierarchyService.getAccessibleParticipantIds(participantId);
            if (accessibleIds.size() == 1) {
                targetClientId = clientId;
            } else {
                // Multiple companies - search across all
                // For now, use the requestService to search with list of IDs
                Page<ClientRequestReadModel> page = requestService.searchRequestsByClients(
                        accessibleIds.stream().map(String::valueOf).collect(Collectors.toList()),
                        productType, status, search, pageable);
                Page<ClientRequestDTO> dtoPage = page.map(requestService::toDTO);
                return ResponseEntity.ok(dtoPage);
            }
        }

        Page<ClientRequestReadModel> page = requestService.searchRequestsByClient(
                targetClientId, productType, status, search, pageable);

        Page<ClientRequestDTO> dtoPage = page.map(requestService::toDTO);
        return ResponseEntity.ok(dtoPage);
    }

    /**
     * Update a draft request.
     * For internal users (null clientId): can update any request (backoffice mode).
     */
    @PutMapping("/requests/{id}")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_EDIT')")
    public ResponseEntity<ClientRequestDTO> updateRequest(
            @PathVariable String id,
            @RequestHeader(value = "X-Client-Id", required = false) String clientId,
            @RequestBody Map<String, Object> updates,
            @AuthenticationPrincipal UserDetails user) {

        // For internal users, get the request's clientId to pass to service
        String effectiveClientId = clientId;
        if (clientId == null || clientId.isEmpty()) {
            var existingRequest = requestService.getRequestById(id);
            if (existingRequest.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            effectiveClientId = existingRequest.get().getClientId();
        }

        logger.info("Updating request {} for client: {} by user: {}", id, effectiveClientId, user.getUsername());

        ClientRequestReadModel clientRequest = requestService.updateRequest(id, effectiveClientId, updates, user.getUsername());
        return ResponseEntity.ok(requestService.toDTO(clientRequest));
    }

    /**
     * Submit a request for review.
     * For internal users (null clientId): can submit any request (backoffice mode).
     */
    @PostMapping("/requests/{id}/submit")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_SUBMIT')")
    public ResponseEntity<ClientRequestDTO> submitRequest(
            @PathVariable String id,
            @RequestHeader(value = "X-Client-Id", required = false) String clientId,
            @AuthenticationPrincipal UserDetails user) {

        // For internal users, get the request's clientId to pass to service
        String effectiveClientId = clientId;
        if (clientId == null || clientId.isEmpty()) {
            var existingRequest = requestService.getRequestById(id);
            if (existingRequest.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            effectiveClientId = existingRequest.get().getClientId();
        }

        logger.info("Submitting request {} for client: {} by user: {}", id, effectiveClientId, user.getUsername());

        ClientRequestReadModel clientRequest = requestService.submitRequest(id, effectiveClientId, user.getUsername());
        return ResponseEntity.ok(requestService.toDTO(clientRequest));
    }

    /**
     * Cancel a request.
     * For internal users (null clientId): can cancel any request (backoffice mode).
     */
    @PostMapping("/requests/{id}/cancel")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_CANCEL')")
    public ResponseEntity<ClientRequestDTO> cancelRequest(
            @PathVariable String id,
            @RequestHeader(value = "X-Client-Id", required = false) String clientId,
            @AuthenticationPrincipal UserDetails user) {

        // For internal users, get the request's clientId to pass to service
        String effectiveClientId = clientId;
        if (clientId == null || clientId.isEmpty()) {
            var existingRequest = requestService.getRequestById(id);
            if (existingRequest.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            effectiveClientId = existingRequest.get().getClientId();
        }

        logger.info("Cancelling request {} for client: {} by user: {}", id, effectiveClientId, user.getUsername());

        ClientRequestReadModel clientRequest = requestService.cancelRequest(id, effectiveClientId, user.getUsername());
        return ResponseEntity.ok(requestService.toDTO(clientRequest));
    }

    /**
     * Get client statistics for dashboard.
     * For internal users (null clientId): returns empty stats (use backoffice dashboard instead).
     */
    @GetMapping("/stats")
    @PreAuthorize("hasPermission(null, 'CLIENT_DASHBOARD_VIEW')")
    public ResponseEntity<Map<String, Object>> getStatistics(
            @RequestHeader(value = "X-Client-Id", required = false) String clientId) {

        // Internal users should use the backoffice dashboard
        if (clientId == null || clientId.isEmpty()) {
            Map<String, Object> emptyStats = new HashMap<>();
            emptyStats.put("totalRequests", 0L);
            emptyStats.put("draftRequests", 0L);
            emptyStats.put("submittedRequests", 0L);
            emptyStats.put("inReviewRequests", 0L);
            emptyStats.put("approvedRequests", 0L);
            emptyStats.put("rejectedRequests", 0L);
            return ResponseEntity.ok(emptyStats);
        }

        Map<String, Object> stats = requestService.getClientStatistics(clientId);
        return ResponseEntity.ok(stats);
    }

    /**
     * Get statistics for specific endpoints used by widgets.
     * For internal users (null clientId): returns 0 (use backoffice dashboard).
     */
    @GetMapping("/stats/active-operations")
    @PreAuthorize("hasPermission(null, 'CLIENT_OPERATION_VIEW')")
    public ResponseEntity<Map<String, Object>> getActiveOperationsStats(
            @RequestHeader(value = "X-Client-Id", required = false) String clientId) {

        if (clientId == null || clientId.isEmpty()) {
            return ResponseEntity.ok(Map.of("count", 0L));
        }

        Map<String, Object> stats = Map.of(
                "count", requestService.getClientStatistics(clientId).get("approvedRequests")
        );
        return ResponseEntity.ok(stats);
    }

    /**
     * For internal users (null clientId): returns 0 (use backoffice dashboard).
     */
    @GetMapping("/stats/pending-requests")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_VIEW')")
    public ResponseEntity<Map<String, Object>> getPendingRequestsStats(
            @RequestHeader(value = "X-Client-Id", required = false) String clientId) {

        if (clientId == null || clientId.isEmpty()) {
            return ResponseEntity.ok(Map.of("count", 0L));
        }

        Map<String, Object> fullStats = requestService.getClientStatistics(clientId);
        long pending = (Long) fullStats.getOrDefault("submittedRequests", 0L) +
                       (Long) fullStats.getOrDefault("inReviewRequests", 0L);

        Map<String, Object> stats = Map.of("count", pending);
        return ResponseEntity.ok(stats);
    }

    /**
     * Get the company/participant information for the current client.
     * This allows client portal users to see their own company details.
     * For internal users (null clientId): returns empty response (not applicable).
     */
    @GetMapping("/my-company")
    @PreAuthorize("hasPermission(null, 'CLIENT_DASHBOARD_VIEW')")
    public ResponseEntity<Map<String, Object>> getMyCompany(
            @RequestHeader(value = "X-Client-Id", required = false) String clientId) {

        // Internal users don't have a "company" - they're bank employees
        if (clientId == null || clientId.isEmpty()) {
            Map<String, Object> company = new HashMap<>();
            company.put("id", null);
            company.put("nombres", "Internal User");
            company.put("isInternalUser", true);
            return ResponseEntity.ok(company);
        }

        Long participantId;
        try {
            participantId = Long.parseLong(clientId);
        } catch (NumberFormatException e) {
            logger.warn("Invalid client ID format: {}", clientId);
            return ResponseEntity.badRequest().build();
        }

        return participantRepository.findById(participantId)
                .map(p -> {
                    Map<String, Object> company = new java.util.HashMap<>();
                    company.put("id", p.getId());
                    company.put("identificacion", p.getIdentificacion());
                    company.put("tipo", p.getTipo());
                    company.put("tipoReferencia", p.getTipoReferencia());
                    company.put("nombres", p.getNombres());
                    company.put("apellidos", p.getApellidos());
                    company.put("email", p.getEmail());
                    company.put("telefono", p.getTelefono());
                    company.put("direccion", p.getDireccion());
                    company.put("agencia", p.getAgencia());
                    company.put("ejecutivoAsignado", p.getEjecutivoAsignado());
                    company.put("ejecutivoId", p.getEjecutivoId());
                    company.put("correoEjecutivo", p.getCorreoEjecutivo());
                    // Add hierarchy information
                    company.put("hierarchyType", p.getHierarchyType());
                    company.put("hierarchyLevel", p.getHierarchyLevel());
                    company.put("parentId", p.getParentId());
                    company.put("isCorporation", p.isCorporation());
                    company.put("hasChildren", participantRepository.hasChildren(p.getId()));
                    return ResponseEntity.ok(company);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get all companies accessible by the current user.
     * For corporation users: returns all child companies.
     * For company users: returns only their own company.
     * For internal users (null clientId): returns empty list (not applicable).
     */
    @GetMapping("/accessible-companies")
    @PreAuthorize("hasPermission(null, 'CLIENT_DASHBOARD_VIEW')")
    public ResponseEntity<Map<String, Object>> getAccessibleCompanies(
            @RequestHeader(value = "X-Client-Id", required = false) String clientId) {

        // Internal users don't have a participant ID
        if (clientId == null || clientId.isEmpty()) {
            Map<String, Object> result = new HashMap<>();
            result.put("hasMultipleCompanies", false);
            result.put("companies", List.of());
            result.put("totalCount", 0);
            result.put("isInternalUser", true);
            return ResponseEntity.ok(result);
        }

        Long participantId;
        try {
            participantId = Long.parseLong(clientId);
        } catch (NumberFormatException e) {
            logger.warn("Invalid client ID format: {}", clientId);
            return ResponseEntity.badRequest().build();
        }

        // Check if user has multiple companies (corporation or parent)
        boolean hasMultipleCompanies = hierarchyService.hasMultipleCompanies(participantId);

        // Get accessible participants
        List<ParticipanteReadModel> accessibleParticipants = hierarchyService.getAccessibleParticipants(participantId);

        // Convert to simplified DTOs
        List<Map<String, Object>> companies = accessibleParticipants.stream()
                .map(p -> {
                    Map<String, Object> company = new HashMap<>();
                    company.put("id", p.getId());
                    company.put("identificacion", p.getIdentificacion());
                    company.put("nombres", p.getNombres());
                    company.put("apellidos", p.getApellidos());
                    company.put("displayName", p.getDisplayName());
                    company.put("hierarchyType", p.getHierarchyType());
                    company.put("hierarchyLevel", p.getHierarchyLevel());
                    company.put("parentId", p.getParentId());
                    return company;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("hasMultipleCompanies", hasMultipleCompanies);
        result.put("companies", companies);
        result.put("totalCount", companies.size());

        return ResponseEntity.ok(result);
    }

    /**
     * Get the hierarchy tree for the current user's company.
     * Useful for displaying company structure in UI.
     * For internal users (null clientId): returns empty response (not applicable).
     */
    @GetMapping("/company-hierarchy")
    @PreAuthorize("hasPermission(null, 'CLIENT_VIEW_CORPORATION')")
    public ResponseEntity<Map<String, Object>> getCompanyHierarchy(
            @RequestHeader(value = "X-Client-Id", required = false) String clientId) {

        // Internal users don't have a hierarchy
        if (clientId == null || clientId.isEmpty()) {
            Map<String, Object> result = new HashMap<>();
            result.put("tree", null);
            result.put("ancestorPath", List.of());
            result.put("isInternalUser", true);
            return ResponseEntity.ok(result);
        }

        Long participantId;
        try {
            participantId = Long.parseLong(clientId);
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().build();
        }

        // Get root corporation (or self if no parent)
        return hierarchyService.getRootCorporation(participantId)
                .flatMap(root -> hierarchyService.getHierarchyTree(root.getId()))
                .map(tree -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("tree", convertToHierarchyMap(tree));
                    result.put("ancestorPath", hierarchyService.getAncestorPath(participantId)
                            .stream()
                            .map(this::toSimpleCompanyMap)
                            .collect(Collectors.toList()));
                    return ResponseEntity.ok(result);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private Map<String, Object> convertToHierarchyMap(ParticipanteReadModel p) {
        Map<String, Object> map = toSimpleCompanyMap(p);
        if (p.getChildren() != null && !p.getChildren().isEmpty()) {
            map.put("children", p.getChildren().stream()
                    .map(this::convertToHierarchyMap)
                    .collect(Collectors.toList()));
        }
        return map;
    }

    private Map<String, Object> toSimpleCompanyMap(ParticipanteReadModel p) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", p.getId());
        map.put("identificacion", p.getIdentificacion());
        map.put("nombres", p.getNombres());
        map.put("displayName", p.getDisplayName());
        map.put("hierarchyType", p.getHierarchyType());
        map.put("hierarchyLevel", p.getHierarchyLevel());
        return map;
    }

    /**
     * Get custom fields configuration for client portal forms.
     * This endpoint allows client portal users to get the form configuration
     * without requiring admin permissions.
     */
    @GetMapping("/custom-fields/config")
    @PreAuthorize("hasPermission(null, 'CLIENT_REQUEST_VIEW')")
    public ResponseEntity<CustomFieldsConfigurationDTO> getCustomFieldsConfig(
            @RequestParam String productType,
            @RequestParam(required = false) String tenantId,
            @RequestParam(defaultValue = "WIZARD") String mode) {

        // Validate that the product type is allowed for client portal
        if (!ALLOWED_PRODUCT_TYPES.contains(productType)) {
            logger.warn("Attempted access to non-client product type: {}", productType);
            return ResponseEntity.badRequest().build();
        }

        logger.debug("Getting custom fields config for product: {}, mode: {}", productType, mode);

        var config = customFieldConfigService.getFullConfiguration(productType, tenantId, mode);
        return ResponseEntity.ok(config);
    }

    /**
     * Get operations for the client.
     * Returns all operations where the client is the applicant.
     * For corporation users: returns operations from ALL accessible companies.
     * For company users: returns only their own operations.
     * For internal users (null clientId): returns ALL operations (backoffice mode).
     */
    @GetMapping("/operations")
    @PreAuthorize("hasPermission(null, 'CLIENT_OPERATION_VIEW')")
    public ResponseEntity<Page<ClientOperationDTO>> listOperations(
            @RequestHeader(value = "X-Client-Id", required = false) String clientId,
            @RequestParam(required = false) String productType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long companyId,
            @PageableDefault(size = 20) Pageable pageable) {

        logger.debug("Listing operations for client: {}", clientId);

        List<OperationReadModel> operations;

        // Internal users (no clientId) see all operations - backoffice mode
        if (clientId == null || clientId.isEmpty()) {
            logger.debug("Internal user accessing operations - backoffice mode");
            if (companyId != null) {
                operations = operationRepository.findByApplicantIdOrderByCreatedAtDesc(companyId);
            } else {
                operations = operationRepository.findAllByOrderByCreatedAtDesc();
            }
        } else {
            // Parse client ID as Long (it's the participant ID)
            Long participantId;
            try {
                participantId = Long.parseLong(clientId);
            } catch (NumberFormatException e) {
                logger.warn("Invalid client ID format: {}", clientId);
                return ResponseEntity.badRequest().build();
            }

            // Get all accessible participant IDs for this user
            List<Long> accessibleIds = hierarchyService.getAccessibleParticipantIds(participantId);

            // If companyId is specified, validate access and filter to that company only
            List<Long> targetIds;
            if (companyId != null) {
                if (!hierarchyService.canAccessParticipant(participantId, companyId)) {
                    logger.warn("User {} attempted to access operations for unauthorized company {}", participantId, companyId);
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }
                targetIds = List.of(companyId);
            } else {
                targetIds = accessibleIds;
            }

            // Get operations for all accessible applicants
            operations = new ArrayList<>();
            for (Long applicantId : targetIds) {
                operations.addAll(operationRepository.findByApplicantIdOrderByCreatedAtDesc(applicantId));
            }
        }

        // Filter by product type if specified
        if (productType != null && !productType.isEmpty()) {
            operations = operations.stream()
                    .filter(op -> productType.equals(op.getProductType()))
                    .collect(Collectors.toList());
        }

        // Filter by status if specified
        if (status != null && !status.isEmpty()) {
            operations = operations.stream()
                    .filter(op -> status.equals(op.getStatus()))
                    .collect(Collectors.toList());
        }

        // Filter by search term if specified
        if (search != null && !search.isEmpty()) {
            String searchLower = search.toLowerCase();
            operations = operations.stream()
                    .filter(op ->
                        (op.getReference() != null && op.getReference().toLowerCase().contains(searchLower)) ||
                        (op.getBeneficiaryName() != null && op.getBeneficiaryName().toLowerCase().contains(searchLower)))
                    .collect(Collectors.toList());
        }

        // Convert to DTOs
        List<ClientOperationDTO> dtos = operations.stream()
                .map(this::toClientOperationDTO)
                .collect(Collectors.toList());

        // Apply pagination
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), dtos.size());
        List<ClientOperationDTO> pageContent = start < dtos.size() ? dtos.subList(start, end) : List.of();

        Page<ClientOperationDTO> page = new PageImpl<>(pageContent, pageable, dtos.size());
        return ResponseEntity.ok(page);
    }

    /**
     * Get a specific operation by ID.
     * For corporation users: allows viewing operations from any accessible company.
     * For internal users (null clientId): can view any operation (backoffice mode).
     */
    @GetMapping("/operations/{operationId}")
    @PreAuthorize("hasPermission(null, 'CLIENT_OPERATION_VIEW')")
    public ResponseEntity<ClientOperationDTO> getOperation(
            @PathVariable String operationId,
            @RequestHeader(value = "X-Client-Id", required = false) String clientId) {

        // Internal users can view any operation
        if (clientId == null || clientId.isEmpty()) {
            return operationRepository.findByOperationId(operationId)
                    .map(this::toClientOperationDTO)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        }

        // Parse client ID
        Long participantId;
        try {
            participantId = Long.parseLong(clientId);
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().build();
        }

        // Find operation and validate access through hierarchy
        return operationRepository.findByOperationId(operationId)
                .filter(op -> {
                    // Security: ensure user can access this operation's applicant
                    Long opApplicantId = op.getApplicantId();
                    return opApplicantId != null && hierarchyService.canAccessParticipant(participantId, opApplicantId);
                })
                .map(this::toClientOperationDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get available events for an operation (facade for event-config API).
     * Returns only events that are marked as client-requestable.
     * Maps EventFlowConfigQueryDTO fields to AvailableEvent format expected by frontend.
     */
    @GetMapping("/operations/{operationId}/available-events")
    @PreAuthorize("hasPermission(null, 'CLIENT_OPERATION_VIEW')")
    public ResponseEntity<List<Map<String, Object>>> getAvailableEventsForOperation(
            @PathVariable String operationId,
            @RequestParam(defaultValue = "es") String language,
            @RequestHeader(value = "X-Client-Id", required = false) String clientId) {

        logger.info("Getting available events for operation {} (client portal)", operationId);

        // Validate access to operation
        if (clientId != null && !clientId.isEmpty()) {
            Long participantId;
            try {
                participantId = Long.parseLong(clientId);
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().build();
            }

            // Verify operation exists and client has access
            OperationReadModel operation = operationRepository.findByOperationId(operationId).orElse(null);
            if (operation == null) {
                return ResponseEntity.notFound().build();
            }

            // Check access through hierarchy
            Long opApplicantId = operation.getApplicantId();
            if (opApplicantId == null || !hierarchyService.canAccessParticipant(participantId, opApplicantId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }

        // Get operation to know the product type
        OperationReadModel operation = operationRepository.findByOperationId(operationId).orElse(null);
        if (operation == null) {
            return ResponseEntity.notFound().build();
        }
        String operationType = operation.getProductType();

        // Get available events - clientPortal=true filters to only client-requestable events
        List<EventFlowConfigQueryDTO> events = eventConfigQueryService.getAvailableEventsForOperation(
                operationId, language, true);

        // Map to format expected by frontend (AvailableEvent)
        List<Map<String, Object>> mappedEvents = events.stream().map(e -> {
            Map<String, Object> event = new HashMap<>();
            event.put("eventCode", e.getToEventCode());
            event.put("eventName", e.getToEventName());
            event.put("eventDescription", e.getToEventDescription());
            event.put("helpText", e.getToEventHelpText());
            event.put("icon", e.getToEventIcon());
            event.put("color", e.getToEventColor());

            // Get additional config from EventTypeConfig
            EventTypeConfigReadModel eventTypeConfig = eventTypeConfigRepository
                    .findByEventCodeAndOperationTypeAndLanguage(e.getToEventCode(), operationType, language)
                    .orElse(null);

            if (eventTypeConfig != null) {
                event.put("eventCategory", eventTypeConfig.getEventCategory() != null ?
                        eventTypeConfig.getEventCategory() : "POST_ISSUANCE");
                event.put("requiresApproval", Boolean.TRUE.equals(eventTypeConfig.getRequiresApproval()));
                event.put("approvalLevels", eventTypeConfig.getApprovalLevels() != null ?
                        eventTypeConfig.getApprovalLevels() : 1);
                event.put("requiresSwiftMessage", Boolean.TRUE.equals(eventTypeConfig.getRequiresSwiftMessage()));
                event.put("outboundMessageType", eventTypeConfig.getOutboundMessageType());
                event.put("resultingStage", eventTypeConfig.getResultingStage());
                event.put("resultingStatus", eventTypeConfig.getResultingStatus());
                // Add form fields configuration from database
                event.put("formFieldsConfig", eventTypeConfig.getFormFieldsConfig());
            } else {
                event.put("eventCategory", "POST_ISSUANCE");
                event.put("requiresApproval", true);
                event.put("approvalLevels", 1);
                event.put("requiresSwiftMessage", false);
                event.put("formFieldsConfig", null);
            }

            event.put("isReversible", false);
            event.put("generatesNotification", true);
            event.put("displayOrder", e.getSequenceOrder() != null ? e.getSequenceOrder() : 0);
            return event;
        }).collect(Collectors.toList());

        logger.info("Returning {} available events for operation {}", mappedEvents.size(), operationId);
        return ResponseEntity.ok(mappedEvents);
    }

    /**
     * Get event history for an operation (facade for operations events API).
     */
    @GetMapping("/operations/{operationId}/event-history")
    @PreAuthorize("hasPermission(null, 'CLIENT_OPERATION_VIEW')")
    public ResponseEntity<List<Map<String, Object>>> getOperationEventHistory(
            @PathVariable String operationId,
            @RequestHeader(value = "X-Client-Id", required = false) String clientId) {

        logger.debug("Getting event history for operation {} (client portal)", operationId);

        // Validate access to operation
        if (clientId != null && !clientId.isEmpty()) {
            Long participantId;
            try {
                participantId = Long.parseLong(clientId);
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().build();
            }

            // Verify operation exists and client has access
            OperationReadModel operation = operationRepository.findByOperationId(operationId).orElse(null);
            if (operation == null) {
                return ResponseEntity.notFound().build();
            }

            // Check access through hierarchy
            Long opApplicantId = operation.getApplicantId();
            if (opApplicantId == null || !hierarchyService.canAccessParticipant(participantId, opApplicantId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }

        // Get event history from repository
        List<OperationEventLogReadModel> events = operationEventLogRepository.findByOperationIdOrderByExecutedAtDesc(operationId);

        // Convert to simplified DTOs for client portal
        List<Map<String, Object>> eventDtos = events.stream()
                .map(event -> {
                    Map<String, Object> dto = new HashMap<>();
                    dto.put("eventId", event.getEventId());
                    dto.put("eventCode", event.getEventCode());
                    dto.put("eventSequence", event.getEventSequence());
                    dto.put("comments", event.getComments());
                    dto.put("executedAt", event.getExecutedAt());
                    dto.put("executedBy", event.getExecutedBy());
                    dto.put("swiftMessageType", event.getSwiftMessageType());
                    dto.put("swiftMessageId", event.getSwiftMessageId());
                    dto.put("previousStage", event.getPreviousStage());
                    dto.put("newStage", event.getNewStage());
                    dto.put("previousStatus", event.getPreviousStatus());
                    dto.put("newStatus", event.getNewStatus());
                    return dto;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(eventDtos);
    }

    // ==========================================
    // Event Request Endpoints (Post-Issuance)
    // ==========================================

    /**
     * Create a new event request for an operation.
     * Allows clients to request amendments, cancellations, payments, etc.
     */
    @PostMapping("/operations/{operationId}/event-requests")
    @PreAuthorize("hasPermission(null, 'CLIENT_OPERATION_VIEW')")
    public ResponseEntity<ClientEventRequestDTO.CreateResponse> createEventRequest(
            @PathVariable String operationId,
            @RequestBody @Valid ClientEventRequestDTO.CreateRequest request,
            @RequestHeader(value = "X-Client-Id", required = false) String clientIdHeader,
            @AuthenticationPrincipal UserDetails userDetails) {

        // Validate client access
        if (clientIdHeader == null || clientIdHeader.isEmpty()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Long clientId;
        try {
            clientId = Long.parseLong(clientIdHeader);
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().build();
        }

        // Get client info
        ParticipanteReadModel client = participantRepository.findById(clientId).orElse(null);
        String clientName = client != null ? client.getDisplayName() : "Unknown";
        String requestedBy = userDetails != null ? userDetails.getUsername() : clientIdHeader;
        String requestedByName = clientName;

        // Set operationId from path
        request.setOperationId(operationId);

        ClientEventRequestDTO.CreateResponse response = eventRequestService.createEventRequest(
                request, clientId, clientName, requestedBy, requestedByName);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get event requests for an operation.
     */
    @GetMapping("/operations/{operationId}/event-requests")
    @PreAuthorize("hasPermission(null, 'CLIENT_OPERATION_VIEW')")
    public ResponseEntity<List<ClientEventRequestDTO>> getEventRequests(
            @PathVariable String operationId,
            @RequestHeader(value = "X-Client-Id", required = false) String clientIdHeader) {

        // Validate operation access first
        if (clientIdHeader != null && !clientIdHeader.isEmpty()) {
            Long clientId;
            try {
                clientId = Long.parseLong(clientIdHeader);
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().build();
            }

            // Verify client has access to operation
            OperationReadModel operation = operationRepository.findByOperationId(operationId).orElse(null);
            if (operation == null) {
                return ResponseEntity.notFound().build();
            }

            // Check if client owns operation or has access via hierarchy
            List<Long> accessibleIds = hierarchyService.getAccessibleParticipantIds(clientId);
            if (!accessibleIds.contains(operation.getApplicantId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }

        List<ClientEventRequestDTO> requests = eventRequestService.getRequestsForOperation(operationId);
        return ResponseEntity.ok(requests);
    }

    /**
     * Get a specific event request.
     */
    @GetMapping("/event-requests/{requestId}")
    @PreAuthorize("hasPermission(null, 'CLIENT_OPERATION_VIEW')")
    public ResponseEntity<ClientEventRequestDTO> getEventRequest(
            @PathVariable String requestId,
            @RequestHeader(value = "X-Client-Id", required = false) String clientIdHeader) {

        return eventRequestService.getRequest(requestId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Cancel an event request.
     */
    @PostMapping("/event-requests/{requestId}/cancel")
    @PreAuthorize("hasPermission(null, 'CLIENT_OPERATION_VIEW')")
    public ResponseEntity<ClientEventRequestDTO> cancelEventRequest(
            @PathVariable String requestId,
            @RequestHeader(value = "X-Client-Id", required = false) String clientIdHeader) {

        if (clientIdHeader == null || clientIdHeader.isEmpty()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Long clientId;
        try {
            clientId = Long.parseLong(clientIdHeader);
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().build();
        }

        ClientEventRequestDTO response = eventRequestService.cancelRequest(requestId, clientId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get all event requests for the current client.
     */
    @GetMapping("/my-event-requests")
    @PreAuthorize("hasPermission(null, 'CLIENT_OPERATION_VIEW')")
    public ResponseEntity<List<ClientEventRequestDTO>> getMyEventRequests(
            @RequestHeader(value = "X-Client-Id", required = false) String clientIdHeader) {

        if (clientIdHeader == null || clientIdHeader.isEmpty()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Long clientId;
        try {
            clientId = Long.parseLong(clientIdHeader);
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().build();
        }

        List<ClientEventRequestDTO> requests = eventRequestService.getRequestsForClient(clientId);
        return ResponseEntity.ok(requests);
    }

    /**
     * Convert OperationReadModel to ClientOperationDTO.
     */
    private ClientOperationDTO toClientOperationDTO(OperationReadModel op) {
        ClientOperationDTO.ClientOperationDTOBuilder builder = ClientOperationDTO.builder()
                .operationId(op.getOperationId())
                .reference(op.getReference())
                .productType(op.getProductType())
                .stage(op.getStage())
                .status(op.getStatus())
                .currency(op.getCurrency())
                .amount(op.getAmount())
                .issueDate(op.getIssueDate())
                .expiryDate(op.getExpiryDate())
                .beneficiaryName(op.getBeneficiaryName())
                .issuingBankBic(op.getIssuingBankBic())
                .advisingBankBic(op.getAdvisingBankBic())
                .createdAt(op.getCreatedAt())
                .applicantId(op.getApplicantId());

        // Add applicant name if available
        if (op.getApplicantId() != null) {
            participantRepository.findById(op.getApplicantId())
                    .ifPresent(p -> builder.applicantName(p.getDisplayName()));
        }

        return builder.build();
    }

    /**
     * Exception handler for business logic errors.
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
    public ResponseEntity<Map<String, String>> handleSecurity(SecurityException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
    }
}
