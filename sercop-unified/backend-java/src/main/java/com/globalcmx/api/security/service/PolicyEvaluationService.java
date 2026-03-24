package com.globalcmx.api.security.service;

import com.globalcmx.api.security.entity.PolicyRule;
import com.globalcmx.api.security.entity.PolicyRule.PolicyDecision;
import com.globalcmx.api.security.repository.PolicyRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for evaluating Policy Rules (ABAC-like authorization).
 *
 * Evaluates rules based on:
 * - Subject attributes (user department, roles)
 * - Resource attributes (entity type, action, amount)
 * - Context attributes (time, location)
 *
 * Example usage:
 * PolicyEvaluationContext ctx = PolicyEvaluationContext.builder()
 *     .userDepartment("TREASURY")
 *     .userRoles(Set.of("ROLE_MANAGER"))
 *     .entityType("LETTER_OF_CREDIT")
 *     .actionType("APPROVE")
 *     .amount(new BigDecimal("500000"))
 *     .build();
 * PolicyEvaluationResult result = policyService.evaluate(ctx);
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PolicyEvaluationService {

    private final PolicyRuleRepository policyRuleRepository;

    /**
     * Evaluate all applicable policy rules for the given context.
     * Returns the decision of the first matching rule (by priority).
     */
    public PolicyEvaluationResult evaluate(PolicyEvaluationContext context) {
        log.debug("Evaluating policy rules for context: entityType={}, action={}, amount={}",
                context.getEntityType(), context.getActionType(), context.getAmount());

        // Get applicable rules
        List<PolicyRule> rules = policyRuleRepository.findApplicableRules(
                context.getEntityType(),
                context.getActionType()
        );

        if (rules.isEmpty()) {
            log.debug("No policy rules found, defaulting to ALLOW");
            return PolicyEvaluationResult.builder()
                    .decision(PolicyDecision.ALLOW)
                    .message("No applicable policy rules")
                    .matchedRule(null)
                    .build();
        }

        // Evaluate each rule in priority order
        for (PolicyRule rule : rules) {
            PolicyMatchResult matchResult = evaluateRule(rule, context);

            if (matchResult.isMatch()) {
                log.info("Policy rule '{}' matched. Decision: {}",
                        rule.getRuleCode(), rule.getDecision());

                return PolicyEvaluationResult.builder()
                        .decision(rule.getDecision())
                        .message(rule.getDecisionMessage() != null ?
                                rule.getDecisionMessage() :
                                "Rule " + rule.getRuleCode() + " applied")
                        .matchedRule(rule)
                        .requiredApprovers(rule.getRequiredApprovers())
                        .requireDifferentDepartment(rule.getRequireDifferentDepartment())
                        .matchDetails(matchResult.getDetails())
                        .build();
            } else {
                log.trace("Rule '{}' did not match: {}", rule.getRuleCode(), matchResult.getReason());
            }
        }

        // No rule matched - default to ALLOW
        log.debug("No rules matched, defaulting to ALLOW");
        return PolicyEvaluationResult.builder()
                .decision(PolicyDecision.ALLOW)
                .message("No matching policy rules")
                .matchedRule(null)
                .build();
    }

    /**
     * Evaluate a single rule against the context.
     */
    private PolicyMatchResult evaluateRule(PolicyRule rule, PolicyEvaluationContext context) {
        List<String> matchedConditions = new ArrayList<>();

        // Check subject conditions (WHO)
        if (!checkDepartment(rule, context)) {
            return PolicyMatchResult.noMatch("Department not in allowed list");
        }
        if (rule.getAllowedDepartments() != null) {
            matchedConditions.add("department=" + context.getUserDepartment());
        }

        if (!checkRoles(rule, context)) {
            return PolicyMatchResult.noMatch("Role not in allowed list");
        }
        if (rule.getAllowedRoles() != null) {
            matchedConditions.add("roles matched");
        }

        if (!checkMinRoleLevel(rule, context)) {
            return PolicyMatchResult.noMatch("Role level too low");
        }
        if (rule.getMinRoleLevel() != null) {
            matchedConditions.add("roleLevel>=" + rule.getMinRoleLevel());
        }

        // Check resource conditions (WHAT)
        if (!checkAmount(rule, context)) {
            return PolicyMatchResult.noMatch("Amount outside allowed range");
        }
        if (rule.getMinAmount() != null || rule.getMaxAmount() != null) {
            matchedConditions.add("amount=" + context.getAmount());
        }

        if (!checkCurrency(rule, context)) {
            return PolicyMatchResult.noMatch("Currency not allowed");
        }
        if (rule.getCurrency() != null) {
            matchedConditions.add("currency=" + context.getCurrency());
        }

        // Check context conditions (WHEN/WHERE)
        if (!checkTimeWindow(rule, context)) {
            return PolicyMatchResult.noMatch("Outside allowed time window");
        }
        if (rule.getAllowedTimeStart() != null || rule.getAllowedTimeEnd() != null) {
            matchedConditions.add("time within allowed window");
        }

        if (!checkDayOfWeek(rule, context)) {
            return PolicyMatchResult.noMatch("Day of week not allowed");
        }
        if (rule.getAllowedDaysOfWeek() != null) {
            matchedConditions.add("dayOfWeek allowed");
        }

        if (!checkCountry(rule, context)) {
            return PolicyMatchResult.noMatch("Country not allowed");
        }
        if (rule.getAllowedCountries() != null || Boolean.TRUE.equals(rule.getRequireSameCountry())) {
            matchedConditions.add("country=" + context.getUserCountry());
        }

        return PolicyMatchResult.match(String.join(", ", matchedConditions));
    }

    // ============ CONDITION CHECKERS ============

    private boolean checkDepartment(PolicyRule rule, PolicyEvaluationContext context) {
        if (rule.getAllowedDepartments() == null || rule.getAllowedDepartments().isBlank()) {
            return true; // No restriction
        }
        if (context.getUserDepartment() == null) {
            return false;
        }
        Set<String> allowed = parseCommaSeparated(rule.getAllowedDepartments());
        return allowed.contains(context.getUserDepartment().toUpperCase());
    }

    private boolean checkRoles(PolicyRule rule, PolicyEvaluationContext context) {
        if (rule.getAllowedRoles() == null || rule.getAllowedRoles().isBlank()) {
            return true; // No restriction
        }
        if (context.getUserRoles() == null || context.getUserRoles().isEmpty()) {
            return false;
        }
        Set<String> allowed = parseCommaSeparated(rule.getAllowedRoles());
        return context.getUserRoles().stream()
                .map(String::toUpperCase)
                .anyMatch(allowed::contains);
    }

    private boolean checkMinRoleLevel(PolicyRule rule, PolicyEvaluationContext context) {
        if (rule.getMinRoleLevel() == null) {
            return true; // No restriction
        }
        return context.getUserRoleLevel() >= rule.getMinRoleLevel();
    }

    private boolean checkAmount(PolicyRule rule, PolicyEvaluationContext context) {
        BigDecimal amount = context.getAmount();
        if (amount == null) {
            // If rule requires amount check but no amount provided, rule doesn't apply
            return rule.getMinAmount() == null && rule.getMaxAmount() == null;
        }

        if (rule.getMinAmount() != null && amount.compareTo(rule.getMinAmount()) < 0) {
            return false;
        }
        if (rule.getMaxAmount() != null && amount.compareTo(rule.getMaxAmount()) > 0) {
            return false;
        }
        return true;
    }

    private boolean checkCurrency(PolicyRule rule, PolicyEvaluationContext context) {
        if (rule.getCurrency() == null || rule.getCurrency().isBlank()) {
            return true; // No restriction
        }
        return rule.getCurrency().equalsIgnoreCase(context.getCurrency());
    }

    private boolean checkTimeWindow(PolicyRule rule, PolicyEvaluationContext context) {
        LocalTime now = context.getCurrentTime() != null ?
                context.getCurrentTime().toLocalTime() : LocalTime.now();

        if (rule.getAllowedTimeStart() != null && now.isBefore(rule.getAllowedTimeStart())) {
            return false;
        }
        if (rule.getAllowedTimeEnd() != null && now.isAfter(rule.getAllowedTimeEnd())) {
            return false;
        }
        return true;
    }

    private boolean checkDayOfWeek(PolicyRule rule, PolicyEvaluationContext context) {
        if (rule.getAllowedDaysOfWeek() == null || rule.getAllowedDaysOfWeek().isBlank()) {
            return true; // No restriction
        }

        DayOfWeek today = context.getCurrentTime() != null ?
                context.getCurrentTime().getDayOfWeek() : LocalDateTime.now().getDayOfWeek();
        int dayNum = today.getValue(); // 1=Monday, 7=Sunday

        Set<String> allowedDays = parseCommaSeparated(rule.getAllowedDaysOfWeek());
        return allowedDays.contains(String.valueOf(dayNum));
    }

    private boolean checkCountry(PolicyRule rule, PolicyEvaluationContext context) {
        // Check same country requirement
        if (Boolean.TRUE.equals(rule.getRequireSameCountry())) {
            if (context.getUserCountry() == null || context.getRequestCountry() == null) {
                return false;
            }
            if (!context.getUserCountry().equalsIgnoreCase(context.getRequestCountry())) {
                return false;
            }
        }

        // Check allowed countries
        if (rule.getAllowedCountries() != null && !rule.getAllowedCountries().isBlank()) {
            if (context.getRequestCountry() == null) {
                return false;
            }
            Set<String> allowed = parseCommaSeparated(rule.getAllowedCountries());
            return allowed.contains(context.getRequestCountry().toUpperCase());
        }

        return true;
    }

    private Set<String> parseCommaSeparated(String value) {
        if (value == null || value.isBlank()) {
            return Collections.emptySet();
        }
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .map(String::toUpperCase)
                .collect(Collectors.toSet());
    }

    // ============ DTOs ============

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class PolicyEvaluationContext {
        // Subject (User) attributes
        private String userId;
        private String userDepartment;
        private Set<String> userRoles;
        private int userRoleLevel; // 1=USER, 2=OPERATOR, 3=MANAGER, 4=ADMIN
        private String userCountry;

        // Resource attributes
        private String entityType;
        private String entityId;
        private String actionType;
        private BigDecimal amount;
        private String currency;

        // Context attributes
        private LocalDateTime currentTime;
        private String requestCountry;
        private String requestIp;
        private String deviceId;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class PolicyEvaluationResult {
        private PolicyDecision decision;
        private String message;
        private PolicyRule matchedRule;
        private Integer requiredApprovers;
        private Boolean requireDifferentDepartment;
        private String matchDetails;

        public boolean isAllowed() {
            return decision == PolicyDecision.ALLOW;
        }

        public boolean isDenied() {
            return decision == PolicyDecision.DENY;
        }

        public boolean requiresMfa() {
            return decision == PolicyDecision.REQUIRE_MFA;
        }

        public boolean requiresApproval() {
            return decision == PolicyDecision.REQUIRE_APPROVAL;
        }
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    private static class PolicyMatchResult {
        private boolean match;
        private String reason;
        private String details;

        static PolicyMatchResult match(String details) {
            return new PolicyMatchResult(true, "All conditions matched", details);
        }

        static PolicyMatchResult noMatch(String reason) {
            return new PolicyMatchResult(false, reason, null);
        }
    }
}
