package com.globalcmx.api.security.config.repository;

import com.globalcmx.api.security.config.entity.RiskScoringRule;
import com.globalcmx.api.security.config.entity.RiskScoringRule.RuleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RiskScoringRuleRepository extends JpaRepository<RiskScoringRule, Long> {

    List<RiskScoringRule> findByIsActiveTrueOrderByPriorityAsc();

    List<RiskScoringRule> findByRuleTypeAndIsActiveTrue(RuleType ruleType);

    @Query("SELECT r FROM RiskScoringRule r WHERE r.isActive = true ORDER BY r.priority ASC, r.riskScore DESC")
    List<RiskScoringRule> findAllActiveOrderedByPriority();
}
