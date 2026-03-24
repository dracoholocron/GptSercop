package com.globalcmx.api.compraspublicas.budget.service;

import com.globalcmx.api.compraspublicas.budget.entity.CPBudgetCertificate;
import com.globalcmx.api.compraspublicas.budget.entity.CPBudgetExecution;
import com.globalcmx.api.compraspublicas.budget.repository.CPBudgetCertificateRepository;
import com.globalcmx.api.compraspublicas.budget.repository.CPBudgetExecutionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CPBudgetService {

    private final CPBudgetCertificateRepository budgetCertificateRepository;
    private final CPBudgetExecutionRepository budgetExecutionRepository;

    @Transactional("readModelTransactionManager")
    public CPBudgetCertificate createCertificate(String processId, String paaItemId, String certificateNumber,
                                                  LocalDate certificateDate, BigDecimal amount,
                                                  String budgetPartition, String fundingSource,
                                                  Integer fiscalYear, String userId) {
        log.info("Creating budget certificate: process={}, certificate={}, amount={}",
                processId, certificateNumber, amount);

        CPBudgetCertificate certificate = CPBudgetCertificate.builder()
                .id(UUID.randomUUID().toString())
                .processId(processId)
                .paaItemId(paaItemId)
                .certificateNumber(certificateNumber)
                .certificateDate(certificateDate)
                .amount(amount)
                .budgetPartition(budgetPartition)
                .fundingSource(fundingSource)
                .fiscalYear(fiscalYear)
                .status("SOLICITADO")
                .createdBy(userId)
                .createdAt(LocalDateTime.now())
                .build();

        return budgetCertificateRepository.save(certificate);
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public CPBudgetCertificate getCertificate(String id) {
        return budgetCertificateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Budget certificate not found: " + id));
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<CPBudgetCertificate> getCertificatesByProcess(String processId) {
        return budgetCertificateRepository.findByProcessIdOrderByCreatedAtDesc(processId);
    }

    @Transactional("readModelTransactionManager")
    public CPBudgetCertificate updateCertificateStatus(String id, String status) {
        log.info("Updating budget certificate status: id={}, status={}", id, status);

        CPBudgetCertificate certificate = budgetCertificateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Budget certificate not found: " + id));

        certificate.setStatus(status);
        return budgetCertificateRepository.save(certificate);
    }

    @Transactional("readModelTransactionManager")
    public CPBudgetExecution addExecution(String certificateId, String executionType, BigDecimal amount,
                                           LocalDate executionDate, String documentNumber) {
        log.info("Adding budget execution: certificate={}, type={}, amount={}",
                certificateId, executionType, amount);

        // Verify that the certificate exists
        budgetCertificateRepository.findById(certificateId)
                .orElseThrow(() -> new IllegalArgumentException("Budget certificate not found: " + certificateId));

        CPBudgetExecution execution = CPBudgetExecution.builder()
                .id(UUID.randomUUID().toString())
                .certificateId(certificateId)
                .executionType(executionType)
                .amount(amount)
                .executionDate(executionDate)
                .documentNumber(documentNumber)
                .createdAt(LocalDateTime.now())
                .build();

        return budgetExecutionRepository.save(execution);
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<CPBudgetExecution> getExecutions(String certificateId) {
        return budgetExecutionRepository.findByCertificateIdOrderByExecutionDateAsc(certificateId);
    }
}
