package com.globalcmx.api.security.repository;

import com.globalcmx.api.security.entity.PolicyRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Policy Rules (ABAC-like authorization rules).
 */
@Repository
public interface PolicyRuleRepository extends JpaRepository<PolicyRule, Long> {

    /**
     * Find rule by its unique code.
     */
    Optional<PolicyRule> findByRuleCode(String ruleCode);

    /**
     * Find all enabled rules ordered by priority.
     */
    List<PolicyRule> findByEnabledTrueOrderByPriorityAsc();

    /**
     * Find enabled rules that apply to a specific entity type and action.
     * Also includes rules with null entity/action (applies to all).
     */
    @Query("SELECT r FROM PolicyRule r WHERE r.enabled = true " +
           "AND (r.entityType IS NULL OR r.entityType = :entityType) " +
           "AND (r.actionType IS NULL OR r.actionType = :actionType) " +
           "ORDER BY r.priority ASC")
    List<PolicyRule> findApplicableRules(
            @Param("entityType") String entityType,
            @Param("actionType") String actionType
    );

    /**
     * Find all rules for a specific entity type.
     */
    List<PolicyRule> findByEntityTypeAndEnabledTrueOrderByPriorityAsc(String entityType);

    /**
     * Check if rule code already exists (for validation).
     */
    boolean existsByRuleCode(String ruleCode);
}
