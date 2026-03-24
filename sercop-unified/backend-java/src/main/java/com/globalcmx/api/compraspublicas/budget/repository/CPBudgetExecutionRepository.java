package com.globalcmx.api.compraspublicas.budget.repository;

import com.globalcmx.api.compraspublicas.budget.entity.CPBudgetExecution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CPBudgetExecutionRepository extends JpaRepository<CPBudgetExecution, String> {

    List<CPBudgetExecution> findByCertificateIdOrderByExecutionDateAsc(String certificateId);

    List<CPBudgetExecution> findByCertificateIdAndExecutionTypeOrderByExecutionDateAsc(String certificateId, String executionType);
}
