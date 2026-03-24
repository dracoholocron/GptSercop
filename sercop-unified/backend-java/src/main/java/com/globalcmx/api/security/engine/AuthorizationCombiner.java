package com.globalcmx.api.security.engine;

import com.globalcmx.api.security.config.entity.SecurityConfigurationReadModel;
import com.globalcmx.api.security.config.event.SecurityConfigurationChangedEvent;
import com.globalcmx.api.security.config.repository.SecurityConfigurationRepository;
import com.globalcmx.api.security.engine.AuthorizationEngine.AuthorizationDecision;
import com.globalcmx.api.security.engine.AuthorizationEngine.AuthorizationRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Combines decisions from multiple authorization engines based on configuration.
 * Supports different combination strategies:
 * - any-allows: If ANY engine allows, access is granted (OR logic)
 * - all-must-allow: ALL engines must allow for access to be granted (AND logic)
 * - weighted: Engines have weights, decision based on weighted score
 * - first-applicable: First engine that returns a decision wins
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AuthorizationCombiner {

    private final List<AuthorizationEngine> engines;
    private final SecurityConfigurationRepository configRepository;

    private final Map<String, Boolean> engineEnabledCache = new ConcurrentHashMap<>();
    private volatile String combinationStrategy = "any-allows";

    @PostConstruct
    public void init() {
        refreshConfiguration();
        log.info("AuthorizationCombiner initialized with {} engines: {}",
                engines.size(),
                engines.stream().map(AuthorizationEngine::getEngineId).collect(Collectors.joining(", ")));
    }

    /**
     * Evaluate authorization request using all configured engines
     */
    public AuthorizationDecision evaluate(AuthorizationRequest request) {
        List<AuthorizationEngine> activeEngines = getActiveEngines();

        if (activeEngines.isEmpty()) {
            log.warn("No active authorization engines - defaulting to deny");
            return AuthorizationDecision.deny("combiner", "No authorization engines configured");
        }

        log.debug("Evaluating request with strategy '{}' using engines: {}",
                combinationStrategy,
                activeEngines.stream().map(AuthorizationEngine::getEngineId).collect(Collectors.joining(", ")));

        return switch (combinationStrategy) {
            case "all-must-allow" -> evaluateAllMustAllow(request, activeEngines);
            case "weighted" -> evaluateWeighted(request, activeEngines);
            case "first-applicable" -> evaluateFirstApplicable(request, activeEngines);
            default -> evaluateAnyAllows(request, activeEngines);
        };
    }

    /**
     * ANY engine allows = access granted (OR logic)
     * But if 4-eyes denies, that always takes precedence
     */
    private AuthorizationDecision evaluateAnyAllows(AuthorizationRequest request, List<AuthorizationEngine> engines) {
        List<AuthorizationDecision> decisions = new ArrayList<>();
        AuthorizationDecision fourEyesDenial = null;

        for (AuthorizationEngine engine : engines) {
            try {
                AuthorizationDecision decision = engine.evaluate(request);
                decisions.add(decision);

                // 4-eyes denial always takes precedence
                if (!decision.allowed() && "four-eyes".equals(engine.getEngineId())) {
                    fourEyesDenial = decision;
                }

                log.debug("Engine '{}' decision: {} - {}",
                        engine.getEngineId(), decision.allowed() ? "ALLOW" : "DENY", decision.reason());
            } catch (Exception e) {
                log.error("Engine '{}' failed: {}", engine.getEngineId(), e.getMessage());
            }
        }

        // 4-eyes denial always wins
        if (fourEyesDenial != null) {
            return fourEyesDenial;
        }

        // Any allow wins
        Optional<AuthorizationDecision> allowed = decisions.stream()
                .filter(AuthorizationDecision::allowed)
                .findFirst();

        if (allowed.isPresent()) {
            return allowed.get();
        }

        // All denied - return first denial reason
        return decisions.stream()
                .filter(d -> !d.allowed())
                .findFirst()
                .orElse(AuthorizationDecision.deny("combiner", "No engine granted access"));
    }

    /**
     * ALL engines must allow = access granted (AND logic)
     */
    private AuthorizationDecision evaluateAllMustAllow(AuthorizationRequest request, List<AuthorizationEngine> engines) {
        for (AuthorizationEngine engine : engines) {
            try {
                AuthorizationDecision decision = engine.evaluate(request);
                if (!decision.allowed()) {
                    return decision; // First denial wins
                }
            } catch (Exception e) {
                log.error("Engine '{}' failed: {}", engine.getEngineId(), e.getMessage());
                return AuthorizationDecision.deny(engine.getEngineId(), "Engine evaluation failed");
            }
        }
        return AuthorizationDecision.allow("combiner", "All engines allowed");
    }

    /**
     * First engine that returns a definitive decision wins
     */
    private AuthorizationDecision evaluateFirstApplicable(AuthorizationRequest request, List<AuthorizationEngine> engines) {
        for (AuthorizationEngine engine : engines) {
            try {
                AuthorizationDecision decision = engine.evaluate(request);
                // Return first non-abstain decision
                if (!"abstain".equalsIgnoreCase(decision.reason())) {
                    return decision;
                }
            } catch (Exception e) {
                log.error("Engine '{}' failed: {}", engine.getEngineId(), e.getMessage());
            }
        }
        return AuthorizationDecision.deny("combiner", "No applicable decision");
    }

    /**
     * Weighted scoring - calculate score based on engine weights
     */
    private AuthorizationDecision evaluateWeighted(AuthorizationRequest request, List<AuthorizationEngine> engines) {
        int allowScore = 0;
        int denyScore = 0;
        AuthorizationDecision lastDenial = null;

        for (AuthorizationEngine engine : engines) {
            try {
                AuthorizationDecision decision = engine.evaluate(request);
                int weight = getEngineWeight(engine.getEngineId());

                if (decision.allowed()) {
                    allowScore += weight;
                } else {
                    denyScore += weight;
                    lastDenial = decision;
                }
            } catch (Exception e) {
                log.error("Engine '{}' failed: {}", engine.getEngineId(), e.getMessage());
            }
        }

        if (allowScore > denyScore) {
            return AuthorizationDecision.allow("combiner",
                    String.format("Weighted allow (score: %d vs %d)", allowScore, denyScore));
        }

        return lastDenial != null ? lastDenial :
                AuthorizationDecision.deny("combiner",
                        String.format("Weighted deny (score: %d vs %d)", denyScore, allowScore));
    }

    private int getEngineWeight(String engineId) {
        return switch (engineId) {
            case "rbac" -> 100;
            case "four-eyes" -> 200; // 4-eyes has highest weight
            case "opa" -> 80;
            case "risk" -> 60;
            default -> 50;
        };
    }

    private List<AuthorizationEngine> getActiveEngines() {
        return engines.stream()
                .filter(this::isEngineActive)
                .sorted(Comparator.comparingInt(AuthorizationEngine::getPriority))
                .collect(Collectors.toList());
    }

    private boolean isEngineActive(AuthorizationEngine engine) {
        // RBAC and 4-eyes are always checked if they have configs
        if ("rbac".equals(engine.getEngineId())) {
            return true;
        }
        if ("four-eyes".equals(engine.getEngineId())) {
            return engine.isEnabled();
        }

        // Other engines check the cache
        return engineEnabledCache.getOrDefault(engine.getEngineId(), false);
    }

    /**
     * Refresh configuration from database
     */
    public void refreshConfiguration() {
        try {
            configRepository.findByConfigTypeAndConfigKeyAndEnvironmentAndIsActiveTrue(
                    SecurityConfigurationReadModel.ConfigType.AUTHORIZATION,
                    "authorization",
                    "production"
            ).ifPresent(config -> {
                Map<String, Object> value = config.getConfigValue();

                // Update combination strategy
                if (value.containsKey("combinationStrategy")) {
                    this.combinationStrategy = (String) value.get("combinationStrategy");
                }

                // Update engine enabled states
                @SuppressWarnings("unchecked")
                Map<String, Boolean> engines = (Map<String, Boolean>) value.get("engines");
                if (engines != null) {
                    engineEnabledCache.clear();
                    engineEnabledCache.putAll(engines);
                }

                log.info("Authorization config refreshed: strategy={}, engines={}",
                        combinationStrategy, engineEnabledCache);
            });
        } catch (Exception e) {
            log.error("Failed to refresh authorization configuration: {}", e.getMessage());
        }
    }

    /**
     * Listen for security configuration changes and refresh if authorization-related
     */
    @EventListener
    public void onSecurityConfigurationChanged(SecurityConfigurationChangedEvent event) {
        if (event.affectsAuthorization()) {
            log.info("Authorization configuration changed by {}, refreshing...", event.getChangedBy());
            refreshConfiguration();
        }
    }
}
