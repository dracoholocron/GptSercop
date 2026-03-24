package com.globalcmx.api.clientportal.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.clientportal.dto.CreateSolicitudRequest;
import com.globalcmx.api.clientportal.dto.SolicitudClienteDTO;
import com.globalcmx.api.clientportal.entity.SolicitudCliente;
import com.globalcmx.api.clientportal.repository.SolicitudClienteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Service for managing client requests (solicitudes).
 * Implements business logic for the client portal.
 */
@Service
@Transactional
public class SolicitudClienteService {

    private static final Logger logger = LoggerFactory.getLogger(SolicitudClienteService.class);

    private final SolicitudClienteRepository solicitudRepository;
    private final ObjectMapper objectMapper;

    public SolicitudClienteService(SolicitudClienteRepository solicitudRepository, ObjectMapper objectMapper) {
        this.solicitudRepository = solicitudRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Create a new request for a client.
     * Implements data isolation by requiring clienteId.
     */
    public SolicitudCliente createSolicitud(String clienteId, String clienteName, CreateSolicitudRequest request, String createdBy) {
        SolicitudCliente solicitud = new SolicitudCliente(clienteId, clienteName, request.getProductoType());

        // Generate request number
        solicitud.setRequestNumber(generateRequestNumber(request.getProductoType()));

        // Set optional fields
        if (request.getProductoSubtype() != null) {
            solicitud.setProductoSubtype(request.getProductoSubtype());
        }
        if (request.getMonto() != null) {
            solicitud.setMonto(request.getMonto());
        }
        if (request.getMoneda() != null) {
            solicitud.setMoneda(request.getMoneda());
        }
        if (request.getPriority() != null) {
            solicitud.setPriority(request.getPriority());
        }

        // Set custom data as JSON
        if (request.getCustomData() != null) {
            try {
                solicitud.setCustomData(objectMapper.writeValueAsString(request.getCustomData()));
            } catch (JsonProcessingException e) {
                logger.error("Failed to serialize custom data", e);
            }
        }

        // Set audit fields
        solicitud.setCreatedBy(createdBy);
        solicitud.setEstado("DRAFT");
        solicitud.setCurrentStep(1);
        solicitud.setTotalSteps(getStepsForProduct(request.getProductoType()));
        solicitud.setCompletionPercentage(0);

        return solicitudRepository.save(solicitud);
    }

    /**
     * Update a draft request.
     * Only drafts and pending documents status can be edited.
     */
    public SolicitudCliente updateSolicitud(String solicitudId, String clienteId, Map<String, Object> updates, String updatedBy) {
        SolicitudCliente solicitud = solicitudRepository.findById(solicitudId)
                .orElseThrow(() -> new IllegalArgumentException("Solicitud not found: " + solicitudId));

        // Data isolation check
        if (!solicitud.getClienteId().equals(clienteId)) {
            throw new SecurityException("Access denied to solicitud: " + solicitudId);
        }

        // Check if editable
        if (!solicitud.canBeEdited()) {
            throw new IllegalStateException("Solicitud cannot be edited in status: " + solicitud.getEstado());
        }

        // Update fields
        if (updates.containsKey("monto")) {
            solicitud.setMonto(new BigDecimal(updates.get("monto").toString()));
        }
        if (updates.containsKey("moneda")) {
            solicitud.setMoneda(updates.get("moneda").toString());
        }
        if (updates.containsKey("priority")) {
            solicitud.setPriority(updates.get("priority").toString());
        }
        if (updates.containsKey("currentStep")) {
            solicitud.setCurrentStep(Integer.parseInt(updates.get("currentStep").toString()));
        }
        if (updates.containsKey("customData")) {
            try {
                solicitud.setCustomData(objectMapper.writeValueAsString(updates.get("customData")));
            } catch (JsonProcessingException e) {
                logger.error("Failed to serialize custom data", e);
            }
        }

        // Calculate completion percentage
        if (solicitud.getTotalSteps() != null && solicitud.getCurrentStep() != null) {
            int percentage = (solicitud.getCurrentStep() * 100) / solicitud.getTotalSteps();
            solicitud.setCompletionPercentage(Math.min(percentage, 100));
        }

        solicitud.setFechaUltimaModificacion(LocalDateTime.now());
        solicitud.setUpdatedBy(updatedBy);

        return solicitudRepository.save(solicitud);
    }

    /**
     * Submit a request for review.
     */
    public SolicitudCliente submitSolicitud(String solicitudId, String clienteId, String submittedBy) {
        SolicitudCliente solicitud = solicitudRepository.findById(solicitudId)
                .orElseThrow(() -> new IllegalArgumentException("Solicitud not found: " + solicitudId));

        // Data isolation check
        if (!solicitud.getClienteId().equals(clienteId)) {
            throw new SecurityException("Access denied to solicitud: " + solicitudId);
        }

        // Check if can be submitted
        if (!solicitud.isDraft() && !solicitud.isPendingDocuments()) {
            throw new IllegalStateException("Solicitud cannot be submitted in status: " + solicitud.getEstado());
        }

        // Update status
        solicitud.setEstado("SUBMITTED");
        solicitud.setFechaEnvio(LocalDateTime.now());
        solicitud.setCompletionPercentage(100);
        solicitud.setUpdatedBy(submittedBy);

        // Calculate SLA deadline
        int slaHours = getSlaHoursForProduct(solicitud.getProductoType(), solicitud.getPriority(), solicitud.getMonto());
        solicitud.setSlaHours(slaHours);
        solicitud.setSlaDeadline(LocalDateTime.now().plusHours(slaHours));

        return solicitudRepository.save(solicitud);
    }

    /**
     * Cancel a request.
     */
    public SolicitudCliente cancelSolicitud(String solicitudId, String clienteId, String cancelledBy) {
        SolicitudCliente solicitud = solicitudRepository.findById(solicitudId)
                .orElseThrow(() -> new IllegalArgumentException("Solicitud not found: " + solicitudId));

        // Data isolation check
        if (!solicitud.getClienteId().equals(clienteId)) {
            throw new SecurityException("Access denied to solicitud: " + solicitudId);
        }

        // Check if can be cancelled
        if (!solicitud.canBeCancelled()) {
            throw new IllegalStateException("Solicitud cannot be cancelled in status: " + solicitud.getEstado());
        }

        solicitud.setEstado("CANCELLED");
        solicitud.setUpdatedBy(cancelledBy);

        return solicitudRepository.save(solicitud);
    }

    /**
     * Assign a request to a processor (backoffice).
     */
    public SolicitudCliente assignSolicitud(String solicitudId, String assigneeId, String assigneeName, String assignedBy) {
        SolicitudCliente solicitud = solicitudRepository.findById(solicitudId)
                .orElseThrow(() -> new IllegalArgumentException("Solicitud not found: " + solicitudId));

        if (!solicitud.isSubmitted() && !solicitud.isInReview()) {
            throw new IllegalStateException("Solicitud cannot be assigned in status: " + solicitud.getEstado());
        }

        solicitud.setAssignedToUserId(assigneeId);
        solicitud.setAssignedToUserName(assigneeName);
        solicitud.setEstado("IN_REVIEW");
        solicitud.setFechaInicioRevision(LocalDateTime.now());
        solicitud.setUpdatedBy(assignedBy);

        return solicitudRepository.save(solicitud);
    }

    /**
     * Request additional documents from client.
     */
    public SolicitudCliente requestDocuments(String solicitudId, String details, String requestedBy) {
        SolicitudCliente solicitud = solicitudRepository.findById(solicitudId)
                .orElseThrow(() -> new IllegalArgumentException("Solicitud not found: " + solicitudId));

        if (!solicitud.isInReview()) {
            throw new IllegalStateException("Can only request documents when in review");
        }

        solicitud.setEstado("PENDING_DOCUMENTS");
        solicitud.setEstadoDetalle(details);
        solicitud.setUpdatedBy(requestedBy);

        return solicitudRepository.save(solicitud);
    }

    /**
     * Approve a request (backoffice).
     */
    public SolicitudCliente approveSolicitud(String solicitudId, String approvedById, String approvedByName) {
        SolicitudCliente solicitud = solicitudRepository.findById(solicitudId)
                .orElseThrow(() -> new IllegalArgumentException("Solicitud not found: " + solicitudId));

        if (!solicitud.isInReview()) {
            throw new IllegalStateException("Solicitud cannot be approved in status: " + solicitud.getEstado());
        }

        solicitud.setEstado("APPROVED");
        solicitud.setFechaAprobacion(LocalDateTime.now());
        solicitud.setAprobadoPorUserId(approvedById);
        solicitud.setAprobadoPorUserName(approvedByName);

        // Check if SLA was breached
        if (solicitud.getSlaDeadline() != null && LocalDateTime.now().isAfter(solicitud.getSlaDeadline())) {
            solicitud.setSlaBreached(true);
        }

        return solicitudRepository.save(solicitud);
    }

    /**
     * Reject a request (backoffice).
     */
    public SolicitudCliente rejectSolicitud(String solicitudId, String rejectedById, String rejectedByName, String reason) {
        SolicitudCliente solicitud = solicitudRepository.findById(solicitudId)
                .orElseThrow(() -> new IllegalArgumentException("Solicitud not found: " + solicitudId));

        if (!solicitud.isInReview()) {
            throw new IllegalStateException("Solicitud cannot be rejected in status: " + solicitud.getEstado());
        }

        solicitud.setEstado("REJECTED");
        solicitud.setFechaRechazo(LocalDateTime.now());
        solicitud.setAprobadoPorUserId(rejectedById);
        solicitud.setAprobadoPorUserName(rejectedByName);
        solicitud.setMotivoRechazo(reason);

        return solicitudRepository.save(solicitud);
    }

    /**
     * Get a request by ID with data isolation check.
     */
    @Transactional(readOnly = true)
    public Optional<SolicitudCliente> getSolicitudById(String solicitudId, String clienteId) {
        return solicitudRepository.findById(solicitudId)
                .filter(s -> s.getClienteId().equals(clienteId));
    }

    /**
     * Get a request by ID (backoffice - no data isolation).
     */
    @Transactional(readOnly = true)
    public Optional<SolicitudCliente> getSolicitudById(String solicitudId) {
        return solicitudRepository.findById(solicitudId);
    }

    /**
     * Get all requests for a client with pagination.
     */
    @Transactional(readOnly = true)
    public Page<SolicitudCliente> getSolicitudesByCliente(String clienteId, Pageable pageable) {
        return solicitudRepository.findByClienteId(clienteId, pageable);
    }

    /**
     * Search requests for a client.
     */
    @Transactional(readOnly = true)
    public Page<SolicitudCliente> searchSolicitudesByCliente(
            String clienteId, String productoType, String estado, String searchTerm, Pageable pageable) {
        return solicitudRepository.searchByCliente(clienteId, productoType, estado, searchTerm, pageable);
    }

    /**
     * Search all requests (backoffice).
     */
    @Transactional(readOnly = true)
    public Page<SolicitudCliente> searchAllSolicitudes(
            String clienteId, String productoType, String estado, String assignedToUserId, String searchTerm, Pageable pageable) {
        return solicitudRepository.searchAll(clienteId, productoType, estado, assignedToUserId, searchTerm, pageable);
    }

    /**
     * Convert entity to DTO.
     */
    public SolicitudClienteDTO toDTO(SolicitudCliente entity) {
        SolicitudClienteDTO dto = new SolicitudClienteDTO();

        dto.setId(entity.getId());
        dto.setClienteId(entity.getClienteId());
        dto.setClienteName(entity.getClienteName());
        dto.setProductoType(entity.getProductoType());
        dto.setRequestNumber(entity.getRequestNumber());
        dto.setEstado(entity.getEstado());
        dto.setEstadoDetalle(entity.getEstadoDetalle());
        dto.setCurrentStep(entity.getCurrentStep());
        dto.setTotalSteps(entity.getTotalSteps());
        dto.setCompletionPercentage(entity.getCompletionPercentage());
        dto.setOperacionId(entity.getOperacionId());
        dto.setOperacionReference(entity.getOperacionReference());
        dto.setMonto(entity.getMonto());
        dto.setMoneda(entity.getMoneda());
        dto.setFechaCreacion(entity.getFechaCreacion());
        dto.setFechaEnvio(entity.getFechaEnvio());
        dto.setFechaAprobacion(entity.getFechaAprobacion());
        dto.setFechaRechazo(entity.getFechaRechazo());
        dto.setAssignedToUserId(entity.getAssignedToUserId());
        dto.setAssignedToUserName(entity.getAssignedToUserName());
        dto.setAprobadoPorUserName(entity.getAprobadoPorUserName());
        dto.setMotivoRechazo(entity.getMotivoRechazo());
        dto.setSlaHours(entity.getSlaHours());
        dto.setSlaDeadline(entity.getSlaDeadline());
        dto.setSlaBreached(entity.getSlaBreached());
        dto.setPriority(entity.getPriority());

        // Calculate SLA status
        dto.setSlaStatus(calculateSlaStatus(entity));

        // Calculate days since creation
        if (entity.getFechaCreacion() != null) {
            dto.setDiasDesdeCreacion((int) ChronoUnit.DAYS.between(entity.getFechaCreacion(), LocalDateTime.now()));
        }

        // Format amount
        if (entity.getMonto() != null && entity.getMoneda() != null) {
            dto.setMontoFormatted(String.format("%s %,.2f", entity.getMoneda(), entity.getMonto()));
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
    public Map<String, Object> getClientStatistics(String clienteId) {
        Map<String, Object> stats = new HashMap<>();

        stats.put("totalRequests", solicitudRepository.countByClienteId(clienteId));
        stats.put("draftRequests", solicitudRepository.countByClienteIdAndEstado(clienteId, "DRAFT"));
        stats.put("submittedRequests", solicitudRepository.countByClienteIdAndEstado(clienteId, "SUBMITTED"));
        stats.put("inReviewRequests", solicitudRepository.countByClienteIdAndEstado(clienteId, "IN_REVIEW"));
        stats.put("approvedRequests", solicitudRepository.countByClienteIdAndEstado(clienteId, "APPROVED"));
        stats.put("rejectedRequests", solicitudRepository.countByClienteIdAndEstado(clienteId, "REJECTED"));

        return stats;
    }

    /**
     * Get backoffice statistics.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getBackofficeStatistics(String userId) {
        Map<String, Object> stats = new HashMap<>();

        stats.put("pendingTotal", solicitudRepository.countByEstadoForStats("SUBMITTED"));
        stats.put("myAssigned", solicitudRepository.countActiveByAssignedUser(userId));
        stats.put("slaAtRisk", solicitudRepository.countSlaAtRisk(LocalDateTime.now().plusHours(8)));
        stats.put("slaBreached", solicitudRepository.countSlaBreached());

        return stats;
    }

    // Private helper methods

    private String generateRequestNumber(String productoType) {
        String prefix;
        switch (productoType) {
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
        long count = solicitudRepository.count() + 1;
        return String.format("%s-%d-%05d", prefix, year, count);
    }

    private int getStepsForProduct(String productoType) {
        switch (productoType) {
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

    private int getSlaHoursForProduct(String productoType, String priority, BigDecimal amount) {
        // Base SLA hours by product
        int baseHours;
        switch (productoType) {
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

    private String calculateSlaStatus(SolicitudCliente entity) {
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
}
