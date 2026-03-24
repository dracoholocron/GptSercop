package com.globalcmx.api.compraspublicas.risk.repository;

import com.globalcmx.api.compraspublicas.risk.entity.CPRiskItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CPRiskItemRepository extends JpaRepository<CPRiskItem, String> {

    List<CPRiskItem> findByAssessmentIdOrderByRiskScoreDesc(String assessmentId);

    List<CPRiskItem> findByAssessmentIdAndDetectedTrueOrderByRiskScoreDesc(String assessmentId);

    List<CPRiskItem> findByIndicatorCodeAndDetectedTrueOrderByRiskScoreDesc(String indicatorCode);
}
