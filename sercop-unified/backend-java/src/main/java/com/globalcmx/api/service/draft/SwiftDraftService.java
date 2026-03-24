package com.globalcmx.api.service.draft;

import com.globalcmx.api.clientportal.entity.ClientRequestReadModel;
import com.globalcmx.api.clientportal.repository.ClientRequestReadModelRepository;
import com.globalcmx.api.clientportal.service.ClientRequestService;
import com.globalcmx.api.dto.command.ApproveOperationCommand;
import com.globalcmx.api.dto.command.CreateSwiftDraftCommand;
import com.globalcmx.api.dto.command.UpdateSwiftDraftCommand;
import com.globalcmx.api.dto.query.OperationQueryDTO;
import com.globalcmx.api.dto.query.SwiftDraftDTO;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.readmodel.entity.SwiftDraftReadModel;
import com.globalcmx.api.readmodel.repository.FinancialInstitutionReadModelRepository;
import com.globalcmx.api.readmodel.repository.SwiftDraftReadModelRepository;
import com.globalcmx.api.service.OperationCommandService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Generic service for SWIFT drafts.
 *
 * Handles all product types:
 * - LC Import (MT700)
 * - LC Export (MT710, MT720)
 * - Guarantees (MT760)
 * - Free messages (MT799)
 */
@Service
@Slf4j
public class SwiftDraftService {

    private static final String AGGREGATE_TYPE = "SwiftDraft";

    private final SwiftDraftReadModelRepository repository;
    private final EventStoreService eventStoreService;
    private final OperationCommandService operationCommandService;
    private final SwiftMessageParserService swiftMessageParserService;
    private final FinancialInstitutionReadModelRepository financialInstitutionRepository;
    private final ClientRequestReadModelRepository clientRequestRepository;
    private final ClientRequestService clientRequestService;

    public SwiftDraftService(SwiftDraftReadModelRepository repository,
                             EventStoreService eventStoreService,
                             OperationCommandService operationCommandService,
                             SwiftMessageParserService swiftMessageParserService,
                             FinancialInstitutionReadModelRepository financialInstitutionRepository,
                             ClientRequestReadModelRepository clientRequestRepository,
                             @Lazy ClientRequestService clientRequestService) {
        this.repository = repository;
        this.eventStoreService = eventStoreService;
        this.operationCommandService = operationCommandService;
        this.swiftMessageParserService = swiftMessageParserService;
        this.financialInstitutionRepository = financialInstitutionRepository;
        this.clientRequestRepository = clientRequestRepository;
        this.clientRequestService = clientRequestService;
    }

    /**
     * Create a new SWIFT draft.
     */
    @Transactional
    public SwiftDraftDTO createDraft(CreateSwiftDraftCommand command) {
        log.info("Creating SWIFT draft: messageType={}, productType={}",
                command.getMessageType(), command.getProductType());

        // Generate unique draft ID
        String draftId = generateDraftId(command.getProductType());

        SwiftDraftReadModel draft = SwiftDraftReadModel.builder()
                .draftId(draftId)
                .messageType(command.getMessageType())
                .productType(command.getProductType())
                .reference(command.getReference())
                .status("DRAFT")
                .mode(command.getMode() != null ? command.getMode() : "EXPERT")
                .swiftMessage(command.getSwiftMessage())
                .currency(command.getCurrency())
                .amount(command.getAmount())
                .issueDate(command.getIssueDate())
                .expiryDate(command.getExpiryDate())
                .applicantId(command.getApplicantId())
                .beneficiaryId(command.getBeneficiaryId())
                .issuingBankId(command.getIssuingBankId())
                .issuingBankBic(command.getIssuingBankBic())
                .advisingBankId(command.getAdvisingBankId())
                .advisingBankBic(command.getAdvisingBankBic())
                .customData(command.getCustomData())
                .createdBy(command.getCreatedBy())
                .creationDate(LocalDateTime.now())
                .modifiedBy(command.getCreatedBy())
                .modificationDate(LocalDateTime.now())
                .version(0L)
                .build();

        // Parse SWIFT message and extract metadata fields based on configuration
        // This fills in any missing fields from the SWIFT message content
        swiftMessageParserService.parseAndApplyToDraft(draft, command.getSwiftMessage(), command.getMessageType());

        draft = repository.save(draft);
        log.info("SWIFT draft created successfully: draftId={}", draftId);

        // Save event to event store
        Map<String, Object> eventData = new HashMap<>();
        eventData.put("draftId", draftId);
        eventData.put("messageType", command.getMessageType());
        eventData.put("productType", command.getProductType());
        eventData.put("reference", command.getReference());
        eventData.put("currency", command.getCurrency());
        eventData.put("amount", command.getAmount());
        eventStoreService.saveEvent(
                draftId,
                AGGREGATE_TYPE,
                "SWIFT_DRAFT_CREATED",
                eventData,
                command.getCreatedBy()
        );

        return toDTO(draft);
    }

    /**
     * Update an existing SWIFT draft.
     */
    @Transactional
    public SwiftDraftDTO updateDraft(String draftId, UpdateSwiftDraftCommand command) {
        log.info("Updating SWIFT draft: draftId={}", draftId);

        SwiftDraftReadModel draft = repository.findByDraftId(draftId)
                .orElseThrow(() -> new RuntimeException("Draft not found: " + draftId));

        // Update fields
        draft.setSwiftMessage(command.getSwiftMessage());
        draft.setReference(command.getReference());
        draft.setCurrency(command.getCurrency());
        draft.setAmount(command.getAmount());
        draft.setIssueDate(command.getIssueDate());
        draft.setExpiryDate(command.getExpiryDate());
        draft.setApplicantId(command.getApplicantId());
        draft.setBeneficiaryId(command.getBeneficiaryId());
        draft.setIssuingBankId(command.getIssuingBankId());
        draft.setIssuingBankBic(command.getIssuingBankBic());
        draft.setAdvisingBankId(command.getAdvisingBankId());
        draft.setAdvisingBankBic(command.getAdvisingBankBic());
        draft.setCustomData(command.getCustomData());
        draft.setModifiedBy(command.getModifiedBy());
        draft.setModificationDate(LocalDateTime.now());

        // Re-parse SWIFT message and extract/update metadata fields based on configuration
        swiftMessageParserService.parseAndApplyToDraft(draft, command.getSwiftMessage(), draft.getMessageType());

        draft = repository.save(draft);
        log.info("SWIFT draft updated successfully: draftId={}", draftId);

        // Save event to event store
        Map<String, Object> eventData = new HashMap<>();
        eventData.put("draftId", draftId);
        eventData.put("reference", command.getReference());
        eventData.put("currency", command.getCurrency());
        eventData.put("amount", command.getAmount());
        eventData.put("issueDate", command.getIssueDate());
        eventData.put("expiryDate", command.getExpiryDate());
        eventStoreService.saveEvent(
                draftId,
                AGGREGATE_TYPE,
                "SWIFT_DRAFT_UPDATED",
                eventData,
                command.getModifiedBy()
        );

        return toDTO(draft);
    }

    /**
     * Get a draft by its ID.
     */
    @Transactional(readOnly = true)
    public SwiftDraftDTO getDraftById(String draftId) {
        log.debug("Getting SWIFT draft by ID: {}", draftId);

        return repository.findByDraftId(draftId)
                .map(this::toDTO)
                .orElseThrow(() -> new RuntimeException("Draft not found: " + draftId));
    }

    /**
     * Find a draft by its ID, returning Optional to avoid exceptions.
     * Use this method when you want to handle missing drafts gracefully.
     */
    @Transactional(readOnly = true)
    public Optional<SwiftDraftDTO> findDraftById(String draftId) {
        log.debug("Finding SWIFT draft by ID: {}", draftId);
        return repository.findByDraftId(draftId).map(this::toDTO);
    }

    /**
     * Get a draft by its database ID.
     */
    @Transactional(readOnly = true)
    public SwiftDraftDTO getDraftByDbId(Long id) {
        log.debug("Getting SWIFT draft by DB ID: {}", id);

        return repository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new RuntimeException("Draft not found with ID: " + id));
    }

    /**
     * Get all drafts.
     */
    @Transactional(readOnly = true)
    public List<SwiftDraftDTO> getAllDrafts() {
        log.debug("Getting all SWIFT drafts");

        return repository.findAllByOrderByCreationDateDesc()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get drafts by product type.
     */
    @Transactional(readOnly = true)
    public List<SwiftDraftDTO> getDraftsByProductType(String productType) {
        log.debug("Getting SWIFT drafts by product type: {}", productType);

        return repository.findByProductTypeOrderByCreationDateDesc(productType)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get drafts by message type.
     */
    @Transactional(readOnly = true)
    public List<SwiftDraftDTO> getDraftsByMessageType(String messageType) {
        log.debug("Getting SWIFT drafts by message type: {}", messageType);

        return repository.findByMessageTypeOrderByCreationDateDesc(messageType)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get drafts by status.
     */
    @Transactional(readOnly = true)
    public List<SwiftDraftDTO> getDraftsByStatus(String status) {
        log.debug("Getting SWIFT drafts by status: {}", status);

        return repository.findByStatusOrderByCreationDateDesc(status)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get drafts by user.
     */
    @Transactional(readOnly = true)
    public List<SwiftDraftDTO> getDraftsByUser(String createdBy) {
        log.debug("Getting SWIFT drafts by user: {}", createdBy);

        return repository.findByCreatedByOrderByCreationDateDesc(createdBy)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Search drafts with filters.
     */
    @Transactional(readOnly = true)
    public List<SwiftDraftDTO> searchDrafts(String productType, String messageType,
                                             String status, String createdBy, String reference) {
        log.debug("Searching SWIFT drafts with filters");

        return repository.findWithFilters(productType, messageType, status, createdBy, reference)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Delete a draft by its ID.
     */
    @Transactional
    public void deleteDraft(String draftId, String deletedBy) {
        log.info("Deleting SWIFT draft: draftId={}", draftId);

        SwiftDraftReadModel draft = repository.findByDraftId(draftId)
                .orElseThrow(() -> new RuntimeException("Draft not found: " + draftId));

        repository.delete(draft);
        log.info("SWIFT draft deleted successfully: draftId={}", draftId);

        // Save event to event store
        Map<String, Object> eventData = new HashMap<>();
        eventData.put("draftId", draftId);
        eventData.put("messageType", draft.getMessageType());
        eventData.put("productType", draft.getProductType());
        eventData.put("reference", draft.getReference());
        eventStoreService.saveEvent(
                draftId,
                AGGREGATE_TYPE,
                "SWIFT_DRAFT_DELETED",
                eventData,
                deletedBy
        );
    }

    /**
     * Submit a draft for approval.
     */
    @Transactional
    public SwiftDraftDTO submitForApproval(String draftId, String submittedBy) {
        log.info("Submitting SWIFT draft for approval: draftId={}", draftId);

        SwiftDraftReadModel draft = repository.findByDraftId(draftId)
                .orElseThrow(() -> new RuntimeException("Draft not found: " + draftId));

        // Re-parse SWIFT message to update all mapped fields (dates, amounts, reference, etc.)
        swiftMessageParserService.parseAndApplyToDraft(draft, draft.getSwiftMessage(), draft.getMessageType());

        // Resolve institution BICs from IDs if not already set
        if (draft.getIssuingBankId() != null && (draft.getIssuingBankBic() == null || draft.getIssuingBankBic().isBlank())) {
            financialInstitutionRepository.findById(draft.getIssuingBankId())
                .map(bank -> bank.getSwiftCode())
                .ifPresent(draft::setIssuingBankBic);
        }
        if (draft.getAdvisingBankId() != null && (draft.getAdvisingBankBic() == null || draft.getAdvisingBankBic().isBlank())) {
            financialInstitutionRepository.findById(draft.getAdvisingBankId())
                .map(bank -> bank.getSwiftCode())
                .ifPresent(draft::setAdvisingBankBic);
        }

        draft.setStatus("SUBMITTED");
        draft.setModifiedBy(submittedBy);
        draft.setModificationDate(LocalDateTime.now());

        draft = repository.save(draft);
        log.info("SWIFT draft submitted for approval: draftId={}", draftId);

        // Save event to event store
        Map<String, Object> eventData = new HashMap<>();
        eventData.put("draftId", draftId);
        eventData.put("messageType", draft.getMessageType());
        eventData.put("productType", draft.getProductType());
        eventData.put("reference", draft.getReference());
        eventData.put("status", "SUBMITTED");
        eventStoreService.saveEvent(
                draftId,
                AGGREGATE_TYPE,
                "SWIFT_DRAFT_SUBMITTED",
                eventData,
                submittedBy
        );

        return toDTO(draft);
    }

    /**
     * Approve a draft and create an operation.
     * Uses OperationCommandService to create the operation in operation_readmodel
     * and log the event in operation_event_log_readmodel.
     */
    @Transactional
    public SwiftDraftDTO approveDraft(String draftId, String approvedBy) {
        log.info("Approving SWIFT draft: draftId={}", draftId);

        // Validate draft exists and is in SUBMITTED status
        SwiftDraftReadModel draft = repository.findByDraftId(draftId)
                .orElseThrow(() -> new RuntimeException("Draft not found: " + draftId));

        if (!"SUBMITTED".equals(draft.getStatus())) {
            throw new RuntimeException("Draft must be in SUBMITTED status to be approved. Current status: " + draft.getStatus());
        }

        // Use OperationCommandService to approve the draft and create the operation
        // This handles:
        // 1. Creating record in operation_readmodel
        // 2. Creating record in operation_event_log_readmodel
        // 3. Updating draft status to APPROVED
        ApproveOperationCommand command = ApproveOperationCommand.builder()
                .draftId(draftId)
                .approvedBy(approvedBy)
                .build();

        OperationQueryDTO operation = operationCommandService.approveDraft(command);
        log.info("Operation created from draft: draftId={}, operationId={}", draftId, operation.getOperationId());

        // If this draft came from a CLIENT portal request, link the operation to the request
        if ("CLIENT".equals(draft.getMode())) {
            linkOperationToClientRequest(draftId, operation.getOperationId(), operation.getReference(), approvedBy);
        }

        // Save event to event store for draft audit trail
        Map<String, Object> eventData = new HashMap<>();
        eventData.put("draftId", draftId);
        eventData.put("messageType", draft.getMessageType());
        eventData.put("productType", draft.getProductType());
        eventData.put("reference", draft.getReference());
        eventData.put("status", "APPROVED");
        eventData.put("approvedBy", approvedBy);
        eventData.put("operationId", operation.getOperationId());
        eventStoreService.saveEvent(
                draftId,
                AGGREGATE_TYPE,
                "SWIFT_DRAFT_APPROVED",
                eventData,
                approvedBy
        );

        // Reload draft to get updated status
        draft = repository.findByDraftId(draftId)
                .orElseThrow(() -> new RuntimeException("Draft not found after approval: " + draftId));

        return toDTO(draft);
    }

    /**
     * Link an approved operation to its originating client request.
     * Updates the client request with the operation reference and advances the workflow.
     */
    private void linkOperationToClientRequest(String draftId, String operationId, String operationReference, String approvedBy) {
        try {
            clientRequestRepository.findByDraftId(draftId).ifPresent(clientRequest -> {
                log.info("Linking operation to client request: requestId={}, operationId={}, operationRef={}",
                        clientRequest.getId(), operationId, operationReference);

                // Update the client request with operation info
                clientRequest.setOperationId(operationId);
                clientRequest.setOperationReference(operationReference);
                clientRequest.setUpdatedAt(LocalDateTime.now());
                clientRequest.setUpdatedBy(approvedBy);
                clientRequestRepository.save(clientRequest);

                // Advance to next stage using the workflow transition logic
                clientRequestService.advanceToNextStage(clientRequest.getId(), approvedBy, approvedBy);

                log.info("Client request linked and advanced: requestId={}", clientRequest.getId());
            });
        } catch (Exception e) {
            log.error("Failed to link operation to client request: draftId={}, operationId={}", draftId, operationId, e);
        }
    }

    /**
     * Reject a draft.
     */
    @Transactional
    public SwiftDraftDTO rejectDraft(String draftId, String rejectedBy, String reason) {
        return rejectDraft(draftId, rejectedBy, reason, null);
    }

    public SwiftDraftDTO rejectDraft(String draftId, String rejectedBy, String reason, Map<String, Object> fieldComments) {
        log.info("Rejecting SWIFT draft: draftId={}", draftId);

        SwiftDraftReadModel draft = repository.findByDraftId(draftId)
                .orElseThrow(() -> new RuntimeException("Draft not found: " + draftId));

        // Validate that draft is in SUBMITTED status
        if (!"SUBMITTED".equals(draft.getStatus())) {
            throw new RuntimeException("Draft must be in SUBMITTED status to be rejected. Current status: " + draft.getStatus());
        }

        draft.setStatus("REJECTED");
        draft.setModifiedBy(rejectedBy);
        draft.setModificationDate(LocalDateTime.now());
        draft.setRejectionReason(reason);

        // Enrich field comments with metadata
        if (fieldComments != null && !fieldComments.isEmpty()) {
            String now = LocalDateTime.now().toString();
            for (Map.Entry<String, Object> entry : fieldComments.entrySet()) {
                if (entry.getValue() instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> commentData = (Map<String, Object>) entry.getValue();
                    commentData.put("commentedAt", now);
                    commentData.put("commentedBy", rejectedBy);
                }
            }
            draft.setFieldComments(fieldComments);
        }

        draft = repository.save(draft);
        log.info("SWIFT draft rejected: draftId={}", draftId);

        // Save event to event store
        Map<String, Object> eventData = new HashMap<>();
        eventData.put("draftId", draftId);
        eventData.put("messageType", draft.getMessageType());
        eventData.put("productType", draft.getProductType());
        eventData.put("reference", draft.getReference());
        eventData.put("status", "REJECTED");
        eventData.put("rejectedBy", rejectedBy);
        eventData.put("reason", reason);
        if (fieldComments != null) {
            eventData.put("fieldComments", fieldComments);
        }
        eventStoreService.saveEvent(
                draftId,
                AGGREGATE_TYPE,
                "SWIFT_DRAFT_REJECTED",
                eventData,
                rejectedBy
        );

        return toDTO(draft);
    }

    /**
     * Generate a unique draft ID.
     */
    private String generateDraftId(String productType) {
        // Format: DRAFT-{PRODUCT_TYPE}-{TIMESTAMP}
        String timestamp = String.valueOf(System.currentTimeMillis());
        return String.format("DRAFT-%s-%s", productType, timestamp);
    }

    /**
     * Convert entity to DTO.
     */
    private SwiftDraftDTO toDTO(SwiftDraftReadModel entity) {
        return SwiftDraftDTO.builder()
                .id(entity.getId())
                .draftId(entity.getDraftId())
                .messageType(entity.getMessageType())
                .productType(entity.getProductType())
                .reference(entity.getReference())
                .status(entity.getStatus())
                .mode(entity.getMode())
                .swiftMessage(entity.getSwiftMessage())
                .currency(entity.getCurrency())
                .amount(entity.getAmount())
                .issueDate(entity.getIssueDate())
                .expiryDate(entity.getExpiryDate())
                .applicantId(entity.getApplicantId())
                .beneficiaryId(entity.getBeneficiaryId())
                .issuingBankId(entity.getIssuingBankId())
                .issuingBankBic(entity.getIssuingBankBic())
                .advisingBankId(entity.getAdvisingBankId())
                .advisingBankBic(entity.getAdvisingBankBic())
                .customData(entity.getCustomData())
                .rejectionReason(entity.getRejectionReason())
                .fieldComments(entity.getFieldComments())
                .createdBy(entity.getCreatedBy())
                .creationDate(entity.getCreationDate())
                .modifiedBy(entity.getModifiedBy())
                .modificationDate(entity.getModificationDate())
                .version(entity.getVersion())
                .build();
    }
}
