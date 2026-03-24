package com.globalcmx.api.security.engine;

import com.globalcmx.api.security.config.entity.FourEyesConfig;
import com.globalcmx.api.security.config.repository.FourEyesConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

/**
 * 4-Eyes Principle Authorization Engine.
 * Enforces maker-checker workflow: creator cannot approve their own work.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class FourEyesAuthorizationEngine implements AuthorizationEngine {

    private static final String ENGINE_ID = "four-eyes";

    private final FourEyesConfigRepository fourEyesConfigRepository;

    @Override
    public String getEngineId() {
        return ENGINE_ID;
    }

    @Override
    public boolean isEnabled() {
        // Check if there are any enabled 4-eyes configs
        return !fourEyesConfigRepository.findByIsEnabledTrue().isEmpty();
    }

    @Override
    public int getPriority() {
        return 10; // High priority - should run early
    }

    @Override
    public AuthorizationDecision evaluate(AuthorizationRequest request) {
        String entityType = request.resource();
        String action = request.action();

        // Only check for approval-type actions
        if (!isApprovalAction(action)) {
            return AuthorizationDecision.allow(ENGINE_ID, "Not an approval action");
        }

        // Get 4-eyes config for this entity/action
        Optional<FourEyesConfig> configOpt = fourEyesConfigRepository
                .findActiveConfig(entityType, action.toUpperCase());

        if (configOpt.isEmpty()) {
            return AuthorizationDecision.allow(ENGINE_ID, "No 4-eyes rule configured");
        }

        FourEyesConfig config = configOpt.get();

        // Check amount threshold if applicable
        BigDecimal amount = getAmountFromContext(request.context());
        if (config.getAmountThreshold() != null && amount != null) {
            if (amount.compareTo(config.getAmountThreshold()) < 0) {
                return AuthorizationDecision.allow(ENGINE_ID, "Amount below threshold");
            }
        }

        // Get creator and current user
        String createdBy = (String) request.context().get("createdBy");
        String currentUser = request.subject();

        if (createdBy == null) {
            log.warn("4-Eyes check: createdBy not provided in context for {}/{}", entityType, action);
            return AuthorizationDecision.allow(ENGINE_ID, "Creator information not available");
        }

        // CORE 4-EYES CHECK: Creator cannot approve their own work
        if (createdBy.equalsIgnoreCase(currentUser)) {
            log.warn("4-Eyes violation: User {} attempted to {} their own {} (created by {})",
                    currentUser, action, entityType, createdBy);
            return AuthorizationDecision.deny(
                    ENGINE_ID,
                    "fourEyes.error.sameUser",
                    Map.of(
                            "createdBy", createdBy,
                            "currentUser", currentUser,
                            "entityType", entityType,
                            "action", action
                    )
            );
        }

        // Check department requirement
        if (Boolean.TRUE.equals(config.getRequireDifferentDepartment())) {
            String creatorDept = (String) request.context().get("creatorDepartment");
            String approverDept = (String) request.context().get("approverDepartment");

            if (creatorDept != null && creatorDept.equals(approverDept)) {
                return AuthorizationDecision.deny(
                        ENGINE_ID,
                        "fourEyes.error.sameDepartment",
                        Map.of("department", creatorDept)
                );
            }
        }

        // Check role level requirement
        if (Boolean.TRUE.equals(config.getRequireHigherRole())) {
            Integer creatorLevel = (Integer) request.context().get("creatorRoleLevel");
            Integer approverLevel = (Integer) request.context().get("approverRoleLevel");

            if (creatorLevel != null && approverLevel != null && approverLevel <= creatorLevel) {
                return AuthorizationDecision.deny(
                        ENGINE_ID,
                        "fourEyes.error.requireHigherRole",
                        Map.of(
                                "creatorLevel", creatorLevel,
                                "approverLevel", approverLevel
                        )
                );
            }
        }

        return AuthorizationDecision.allow(ENGINE_ID, "4-eyes check passed");
    }

    private boolean isApprovalAction(String action) {
        String upperAction = action.toUpperCase();
        return upperAction.contains("APPROVE") ||
               upperAction.contains("RELEASE") ||
               upperAction.contains("AUTHORIZE") ||
               upperAction.contains("CONFIRM") ||
               upperAction.contains("VALIDATE");
    }

    private BigDecimal getAmountFromContext(Map<String, Object> context) {
        Object amount = context.get("amount");
        if (amount == null) return null;
        if (amount instanceof BigDecimal) return (BigDecimal) amount;
        if (amount instanceof Number) return BigDecimal.valueOf(((Number) amount).doubleValue());
        try {
            return new BigDecimal(amount.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
