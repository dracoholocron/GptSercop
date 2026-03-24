package com.globalcmx.api.service;

import com.globalcmx.api.dto.query.PendingApprovalDTO;
import com.globalcmx.api.readmodel.entity.PendingEventApprovalReadModel;
import com.globalcmx.api.readmodel.repository.PendingEventApprovalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Query service for pending approvals (CQRS Read side).
 * Handles all read operations for pending approvals.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PendingApprovalQueryService {

    private final PendingEventApprovalRepository approvalRepository;

    /**
     * Get all pending approvals (unified view).
     */
    public List<PendingApprovalDTO> getAllPending() {
        return approvalRepository.findAllPending().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get pending approvals by status.
     */
    public List<PendingApprovalDTO> getByStatus(String status) {
        return approvalRepository.findByStatusOrderBySubmittedAtDesc(status).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get pending approvals by product type.
     */
    public List<PendingApprovalDTO> getByProductType(String productType) {
        return approvalRepository.findByStatusAndProductTypeOrderBySubmittedAtDesc("PENDING", productType).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get pending approvals by approval type (NEW_OPERATION or OPERATION_EVENT).
     */
    public List<PendingApprovalDTO> getByApprovalType(String approvalType) {
        return approvalRepository.findByStatusAndApprovalTypeOrderBySubmittedAtDesc("PENDING", approvalType).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get a specific approval by ID.
     */
    public PendingApprovalDTO getByApprovalId(String approvalId) {
        return approvalRepository.findByApprovalId(approvalId)
                .map(this::toDTO)
                .orElse(null);
    }

    /**
     * Search pending approvals.
     */
    public List<PendingApprovalDTO> search(String searchTerm) {
        return approvalRepository.searchPending("PENDING", searchTerm).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get count statistics.
     */
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();

        // Total pending
        stats.put("totalPending", approvalRepository.countByStatus("PENDING"));

        // By type
        Map<String, Long> byType = new HashMap<>();
        approvalRepository.countPendingByType().forEach(row -> {
            byType.put((String) row[0], (Long) row[1]);
        });
        stats.put("byType", byType);

        // By product type
        Map<String, Long> byProduct = new HashMap<>();
        approvalRepository.countPendingByProductType().forEach(row -> {
            byProduct.put((String) row[0], (Long) row[1]);
        });
        stats.put("byProductType", byProduct);

        return stats;
    }

    /**
     * Get approvals submitted by a user.
     */
    public List<PendingApprovalDTO> getSubmittedBy(String username) {
        return approvalRepository.findBySubmittedByOrderBySubmittedAtDesc(username).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get approvals reviewed by a user.
     */
    public List<PendingApprovalDTO> getReviewedBy(String username) {
        return approvalRepository.findByReviewedByOrderByReviewedAtDesc(username).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get the latest rejected approval for a draft (to get field comments).
     */
    public PendingApprovalDTO getLatestRejectedByDraftId(String draftId) {
        List<PendingEventApprovalReadModel> rejected = approvalRepository.findRejectedByDraftId(draftId);
        if (rejected.isEmpty()) return null;
        return toDTO(rejected.get(0));
    }

    /**
     * Get list of operation IDs that have pending approvals.
     */
    public List<String> getPendingOperationIds() {
        return approvalRepository.findPendingOperationIds();
    }

    private PendingApprovalDTO toDTO(PendingEventApprovalReadModel entity) {
        return PendingApprovalDTO.builder()
                .id(entity.getId())
                .approvalId(entity.getApprovalId())
                .approvalType(entity.getApprovalType())
                .approvalTypeLabel(getApprovalTypeLabel(entity.getApprovalType()))
                .status(entity.getStatus())
                .statusLabel(getStatusLabel(entity.getStatus()))
                .operationId(entity.getOperationId())
                .draftId(entity.getDraftId())
                .productType(entity.getProductType())
                .productTypeLabel(getProductTypeLabel(entity.getProductType()))
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
                .build();
    }

    private String getApprovalTypeLabel(String type) {
        if (type == null) return "";
        switch (type) {
            case "NEW_OPERATION": return "Nueva Operaci\u00f3n";
            case "OPERATION_EVENT": return "Evento de Operaci\u00f3n";
            default: return type;
        }
    }

    private String getStatusLabel(String status) {
        if (status == null) return "";
        switch (status) {
            case "PENDING": return "Pendiente";
            case "APPROVED": return "Aprobado";
            case "REJECTED": return "Rechazado";
            default: return status;
        }
    }

    private String getProductTypeLabel(String productType) {
        if (productType == null) return "";
        switch (productType) {
            case "LC_IMPORT": return "LC Importaci\u00f3n";
            case "LC_EXPORT": return "LC Exportaci\u00f3n";
            case "GUARANTEE": return "Garant\u00eda";
            case "STANDBY_LC": return "Standby LC";
            case "COLLECTION": return "Cobranza";
            default: return productType;
        }
    }
}
