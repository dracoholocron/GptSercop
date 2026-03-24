package com.globalcmx.api.security.engine;

import java.util.Map;

/**
 * Interface for authorization engines.
 * Each engine implements a different authorization strategy (RBAC, OPA, Risk, etc.)
 */
public interface AuthorizationEngine {

    /**
     * Engine identifier
     */
    String getEngineId();

    /**
     * Check if the engine is currently enabled in configuration
     */
    boolean isEnabled();

    /**
     * Evaluate an authorization request
     *
     * @param request the authorization request containing subject, resource, action, and context
     * @return the authorization decision
     */
    AuthorizationDecision evaluate(AuthorizationRequest request);

    /**
     * Priority of this engine (lower = higher priority)
     */
    default int getPriority() {
        return 100;
    }

    /**
     * Authorization request containing all context for evaluation
     */
    record AuthorizationRequest(
            String subject,           // User performing the action
            String resource,          // Resource being accessed
            String action,            // Action being performed
            Map<String, Object> context  // Additional context (roles, amount, createdBy, etc.)
    ) {}

    /**
     * Result of an authorization evaluation
     */
    record AuthorizationDecision(
            boolean allowed,
            String engineId,
            String reason,
            Map<String, Object> metadata
    ) {
        public static AuthorizationDecision allow(String engineId) {
            return new AuthorizationDecision(true, engineId, "Allowed", Map.of());
        }

        public static AuthorizationDecision allow(String engineId, String reason) {
            return new AuthorizationDecision(true, engineId, reason, Map.of());
        }

        public static AuthorizationDecision deny(String engineId, String reason) {
            return new AuthorizationDecision(false, engineId, reason, Map.of());
        }

        public static AuthorizationDecision deny(String engineId, String reason, Map<String, Object> metadata) {
            return new AuthorizationDecision(false, engineId, reason, metadata);
        }
    }
}
