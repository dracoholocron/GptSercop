package com.globalcmx.api.service;

import com.globalcmx.api.dto.query.OperationQueryDTO;
import com.globalcmx.api.readmodel.entity.OperationReadModel;
import com.globalcmx.api.readmodel.repository.OperationReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Query service for operations (CQRS read side).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OperationQueryService {

    private final OperationReadModelRepository repository;

    @Transactional(readOnly = true)
    public Optional<OperationQueryDTO> findByOperationId(String operationId) {
        log.debug("Finding operation by operationId: {}", operationId);
        return repository.findByOperationId(operationId).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public List<OperationQueryDTO> findByProductType(String productType) {
        log.debug("Finding operations by productType: {}", productType);
        return repository.findByProductTypeOrderByCreatedAtDesc(productType)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OperationQueryDTO> findByProductTypeAndStage(String productType, String stage) {
        log.debug("Finding operations by productType: {} and stage: {}", productType, stage);
        return repository.findByProductTypeAndStageOrderByCreatedAtDesc(productType, stage)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OperationQueryDTO> findByProductTypeAndStatus(String productType, String status) {
        log.debug("Finding operations by productType: {} and status: {}", productType, status);
        return repository.findByProductTypeAndStatusOrderByCreatedAtDesc(productType, status)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OperationQueryDTO> findAwaitingResponse() {
        log.debug("Finding operations awaiting response");
        return repository.findByAwaitingResponseTrueOrderByResponseDueDateAsc()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OperationQueryDTO> findAwaitingResponseByProductType(String productType) {
        log.debug("Finding operations awaiting response by productType: {}", productType);
        return repository.findByProductTypeAndAwaitingResponseTrueOrderByResponseDueDateAsc(productType)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OperationQueryDTO> findOverdueResponses() {
        log.debug("Finding operations with overdue responses");
        return repository.findOverdueResponses(LocalDate.now())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OperationQueryDTO> findExpiringSoon(int days) {
        log.debug("Finding operations expiring in {} days", days);
        LocalDate today = LocalDate.now();
        LocalDate endDate = today.plusDays(days);
        return repository.findExpiringSoon(today, endDate)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OperationQueryDTO> searchByReference(String reference) {
        log.debug("Searching operations by reference: {}", reference);
        return repository.findByReferenceContaining(reference)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OperationQueryDTO> findWithFilters(
            String productType, String stage, String status,
            String reference, Long applicantId, Long beneficiaryId,
            String applicantName, String beneficiaryName) {
        log.debug("Finding operations with filters");
        return repository.findWithFilters(productType, stage, status, reference, applicantId, beneficiaryId, applicantName, beneficiaryName)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long countByProductType(String productType) {
        return repository.countByProductType(productType);
    }

    @Transactional(readOnly = true)
    public long countByProductTypeAndStage(String productType, String stage) {
        return repository.countByProductTypeAndStage(productType, stage);
    }

    @Transactional(readOnly = true)
    public long countAwaitingResponse() {
        return repository.countByAwaitingResponseTrue();
    }

    @Transactional(readOnly = true)
    public List<OperationQueryDTO> findWithAlerts(String productType) {
        log.debug("Finding operations with alerts, productType: {}", productType);
        if (productType != null && !productType.isBlank()) {
            return repository.findByProductTypeAndHasAlertsTrueOrderByAlertCountDesc(productType)
                    .stream().map(this::toDTO).collect(Collectors.toList());
        } else {
            return repository.findByHasAlertsTrueOrderByAlertCountDesc()
                    .stream().map(this::toDTO).collect(Collectors.toList());
        }
    }

    @Transactional(readOnly = true)
    public long countWithAlerts(String productType) {
        if (productType != null && !productType.isBlank()) {
            return repository.countByProductTypeAndHasAlertsTrue(productType);
        } else {
            return repository.countByHasAlertsTrue();
        }
    }

    private OperationQueryDTO toDTO(OperationReadModel entity) {
        return OperationQueryDTO.builder()
                .id(entity.getId())
                .operationId(entity.getOperationId())
                .originalDraftId(entity.getOriginalDraftId())
                .productType(entity.getProductType())
                .messageType(entity.getMessageType())
                .reference(entity.getReference())
                .stage(entity.getStage())
                .status(entity.getStatus())
                .creationMode(entity.getCreationMode())
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
                .messageCount(entity.getMessageCount())
                .hasAlerts(entity.getHasAlerts())
                .alertCount(entity.getAlertCount())
                .awaitingResponse(entity.getAwaitingResponse())
                .awaitingMessageType(entity.getAwaitingMessageType())
                .responseDueDate(entity.getResponseDueDate())
                .createdBy(entity.getCreatedBy())
                .createdAt(entity.getCreatedAt())
                .approvedBy(entity.getApprovedBy())
                .approvedAt(entity.getApprovedAt())
                .modifiedBy(entity.getModifiedBy())
                .modifiedAt(entity.getModifiedAt())
                .version(entity.getVersion())
                .build();
    }
}
