package com.globalcmx.api.compraspublicas.risk.repository;

import com.globalcmx.api.compraspublicas.risk.entity.CPRiskAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CPRiskAssessmentRepository extends JpaRepository<CPRiskAssessment, String> {

    List<CPRiskAssessment> findByProcessIdOrderByAssessmentDateDesc(String processId);

    List<CPRiskAssessment> findByRiskLevelOrderByOverallScoreDesc(String riskLevel);

    List<CPRiskAssessment> findByStatusOrderByCreatedAtDesc(String status);
}
