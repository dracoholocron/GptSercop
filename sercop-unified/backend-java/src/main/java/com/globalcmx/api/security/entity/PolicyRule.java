package com.globalcmx.api.security.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalTime;

/**
 * Policy Rule for Attribute-Based Access Control (ABAC-like).
 * Allows defining complex authorization rules based on user, resource, and context attributes.
 *
 * Example rules:
 * - "Treasury department can approve LCs under $1M during business hours"
 * - "Only managers can approve operations over $500K"
 * - "Operations over $5M require two approvers from different departments"
 */
@Entity
@Table(name = "policy_rule")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PolicyRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Unique code for this rule
     */
    @Column(name = "rule_code", nullable = false, unique = true, length = 50)
    private String ruleCode;

    /**
     * Human-readable name
     */
    @Column(name = "rule_name", nullable = false, length = 100)
    private String ruleName;

    /**
     * Detailed description of what this rule does
     */
    @Column(name = "description", length = 500)
    private String description;

    /**
     * Whether this rule is active
     */
    @Column(name = "enabled", nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    /**
     * Priority (lower = higher priority). Rules are evaluated in priority order.
     */
    @Column(name = "priority", nullable = false)
    @Builder.Default
    private Integer priority = 100;

    // ============ SUBJECT CONDITIONS (Who) ============

    /**
     * Required department(s) - comma-separated. Null = any department.
     * Example: "TREASURY,FINANCE"
     */
    @Column(name = "allowed_departments", length = 500)
    private String allowedDepartments;

    /**
     * Required role(s) - comma-separated. Null = any role.
     * Example: "ROLE_MANAGER,ROLE_ADMIN"
     */
    @Column(name = "allowed_roles", length = 500)
    private String allowedRoles;

    /**
     * Minimum role level required (1=USER, 2=OPERATOR, 3=MANAGER, 4=ADMIN)
     */
    @Column(name = "min_role_level")
    private Integer minRoleLevel;

    // ============ RESOURCE CONDITIONS (What) ============

    /**
     * Entity type this rule applies to. Null = all entities.
     * Example: "LETTER_OF_CREDIT", "BANK_GUARANTEE", "PARTICIPANT"
     */
    @Column(name = "entity_type", length = 50)
    private String entityType;

    /**
     * Action this rule applies to. Null = all actions.
     * Example: "APPROVE", "CREATE", "DELETE", "EDIT"
     */
    @Column(name = "action_type", length = 50)
    private String actionType;

    /**
     * Minimum amount for this rule to apply (inclusive)
     */
    @Column(name = "min_amount", precision = 19, scale = 4)
    private BigDecimal minAmount;

    /**
     * Maximum amount for this rule to apply (inclusive)
     */
    @Column(name = "max_amount", precision = 19, scale = 4)
    private BigDecimal maxAmount;

    /**
     * Currency for amount conditions. Null = any currency.
     */
    @Column(name = "currency", length = 3)
    private String currency;

    // ============ CONTEXT CONDITIONS (When/Where) ============

    /**
     * Start of allowed time window (e.g., 09:00)
     */
    @Column(name = "allowed_time_start")
    private LocalTime allowedTimeStart;

    /**
     * End of allowed time window (e.g., 18:00)
     */
    @Column(name = "allowed_time_end")
    private LocalTime allowedTimeEnd;

    /**
     * Allowed days of week (1=Monday, 7=Sunday). Comma-separated.
     * Example: "1,2,3,4,5" for weekdays only
     */
    @Column(name = "allowed_days_of_week", length = 20)
    private String allowedDaysOfWeek;

    /**
     * Require same country as user's registered country
     */
    @Column(name = "require_same_country")
    @Builder.Default
    private Boolean requireSameCountry = false;

    /**
     * Allowed countries - comma-separated ISO codes. Null = any country.
     */
    @Column(name = "allowed_countries", length = 200)
    private String allowedCountries;

    // ============ DECISION ============

    /**
     * Decision when ALL conditions match: ALLOW, DENY, REQUIRE_MFA, REQUIRE_APPROVAL
     */
    @Column(name = "decision", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private PolicyDecision decision;

    /**
     * Message to show when rule is triggered
     */
    @Column(name = "decision_message", length = 500)
    private String decisionMessage;

    /**
     * If REQUIRE_APPROVAL, how many approvers needed
     */
    @Column(name = "required_approvers")
    private Integer requiredApprovers;

    /**
     * If REQUIRE_APPROVAL, must approvers be from different department than requester
     */
    @Column(name = "require_different_department")
    @Builder.Default
    private Boolean requireDifferentDepartment = false;

    public enum PolicyDecision {
        ALLOW,              // Allow the operation
        DENY,               // Deny the operation
        REQUIRE_MFA,        // Require MFA verification
        REQUIRE_APPROVAL,   // Require additional approval (4-eyes)
        ESCALATE            // Escalate to higher authority
    }
}
