package com.globalcmx.api.compraspublicas.budget.repository;

import com.globalcmx.api.compraspublicas.budget.entity.CPBudgetCertificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CPBudgetCertificateRepository extends JpaRepository<CPBudgetCertificate, String> {

    Optional<CPBudgetCertificate> findByCertificateNumber(String certificateNumber);

    List<CPBudgetCertificate> findByProcessIdOrderByCreatedAtDesc(String processId);

    List<CPBudgetCertificate> findByPaaItemIdOrderByCreatedAtDesc(String paaItemId);

    List<CPBudgetCertificate> findByFiscalYearAndStatusOrderByCreatedAtDesc(Integer fiscalYear, String status);
}
