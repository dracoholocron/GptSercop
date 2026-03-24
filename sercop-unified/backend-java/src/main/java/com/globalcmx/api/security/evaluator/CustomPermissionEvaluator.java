package com.globalcmx.api.security.evaluator;

import com.globalcmx.api.security.engine.AuthorizationCombiner;
import com.globalcmx.api.security.engine.AuthorizationEngine.AuthorizationDecision;
import com.globalcmx.api.security.engine.AuthorizationEngine.AuthorizationRequest;
import com.globalcmx.api.security.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.io.Serializable;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Custom permission evaluator for granular access control.
 * Supports @PreAuthorize("hasPermission('CAN_CREATE_LC_IMPORT')") syntax.
 *
 * Security Features:
 * - Integration with AuthorizationCombiner for multi-engine authorization
 * - 4-Eyes Principle enforcement for approval actions
 * - Permission caching with TTL to reduce DB calls
 * - Audit logging for permission checks
 * - Support for ROLE_ADMIN bypass (full access)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CustomPermissionEvaluator implements PermissionEvaluator {

    private final PermissionRepository permissionRepository;
    private final AuthorizationCombiner authorizationCombiner;

    // Cache for permissions with TTL (5 minutes)
    private final ConcurrentHashMap<String, CachedPermissions> permissionCache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = TimeUnit.MINUTES.toMillis(5);

    // Thread-local context for 4-eyes checks
    private static final ThreadLocal<Map<String, Object>> authorizationContext = new ThreadLocal<>();

    /**
     * Set context for 4-eyes and other authorization checks.
     * Call this before approval actions to provide createdBy, amount, etc.
     *
     * Example:
     * CustomPermissionEvaluator.setContext(Map.of(
     *     "createdBy", lcImport.getCreatedBy(),
     *     "amount", lcImport.getAmount()
     * ));
     */
    public static void setContext(Map<String, Object> context) {
        authorizationContext.set(context);
    }

    /**
     * Clear the context after authorization check
     */
    public static void clearContext() {
        authorizationContext.remove();
    }

    /**
     * Check if the user has a specific permission.
     * Used by @PreAuthorize("hasPermission(#root.authentication, 'CAN_CREATE_LC')")
     */
    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        if (authentication == null || permission == null) {
            return false;
        }

        String permissionCode = permission.toString();
        String username = authentication.getName();

        // Log permission check for audit
        log.debug("Permission check: user={}, permission={}", username, permissionCode);

        // Check if user has ROLE_ADMIN (bypass all permission checks)
        if (hasRole(authentication.getAuthorities(), "ROLE_ADMIN")) {
            // Admin still needs to pass 4-eyes check for approvals
            if (isApprovalPermission(permissionCode)) {
                return checkWithCombiner(authentication, targetDomainObject, permissionCode);
            }
            log.debug("User {} has ROLE_ADMIN, granting access to {}", username, permissionCode);
            return true;
        }

        // Use AuthorizationCombiner for comprehensive check
        return checkWithCombiner(authentication, targetDomainObject, permissionCode);
    }

    /**
     * Check permission using the AuthorizationCombiner (multi-engine)
     */
    private boolean checkWithCombiner(Authentication authentication, Object target, String permissionCode) {
        String username = authentication.getName();

        // Build context for authorization
        Map<String, Object> context = buildAuthorizationContext(authentication, target);

        // Parse permission code to extract resource and action
        // Format: CAN_ACTION_RESOURCE or just PERMISSION_CODE
        String resource = extractResource(permissionCode);
        String action = extractAction(permissionCode);

        // Create authorization request
        AuthorizationRequest request = new AuthorizationRequest(
                username,
                resource,
                action,
                context
        );

        // Evaluate with all engines
        AuthorizationDecision decision = authorizationCombiner.evaluate(request);

        if (!decision.allowed()) {
            log.warn("Authorization denied: user={}, permission={}, engine={}, reason={}",
                    username, permissionCode, decision.engineId(), decision.reason());

            // Store denial reason for error messages
            if (decision.metadata() != null && !decision.metadata().isEmpty()) {
                authorizationContext.set(Map.of("denialReason", decision.reason(), "denialMetadata", decision.metadata()));
            }
        }

        return decision.allowed();
    }

    /**
     * Build context for authorization check
     */
    private Map<String, Object> buildAuthorizationContext(Authentication authentication, Object target) {
        Map<String, Object> context = new HashMap<>();

        // Add user's roles
        Set<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(auth -> auth.startsWith("ROLE_"))
                .collect(Collectors.toSet());
        context.put("roles", roles);

        // Add user's permissions
        Set<String> permissions = getUserPermissions(authentication.getName());
        context.put("permissions", permissions);

        // Add thread-local context (createdBy, amount, etc.)
        Map<String, Object> threadContext = authorizationContext.get();
        if (threadContext != null) {
            context.putAll(threadContext);
        }

        // Extract context from target object if it's an Auditable entity
        if (target != null) {
            extractTargetContext(target, context);
        }

        return context;
    }

    /**
     * Extract context from target object using reflection
     */
    private void extractTargetContext(Object target, Map<String, Object> context) {
        try {
            // Try to get createdBy
            if (!context.containsKey("createdBy")) {
                try {
                    var method = target.getClass().getMethod("getCreatedBy");
                    Object createdBy = method.invoke(target);
                    if (createdBy != null) {
                        context.put("createdBy", createdBy.toString());
                    }
                } catch (NoSuchMethodException ignored) {}
            }

            // Try to get amount
            if (!context.containsKey("amount")) {
                try {
                    var method = target.getClass().getMethod("getAmount");
                    Object amount = method.invoke(target);
                    if (amount != null) {
                        context.put("amount", amount);
                    }
                } catch (NoSuchMethodException ignored) {}
            }

            // Try to get entity type
            if (!context.containsKey("entityType")) {
                context.put("entityType", target.getClass().getSimpleName());
            }
        } catch (Exception e) {
            log.debug("Could not extract context from target: {}", e.getMessage());
        }
    }

    private String extractResource(String permissionCode) {
        // CAN_APPROVE_LC_IMPORT -> LC_IMPORT
        if (permissionCode.startsWith("CAN_")) {
            String[] parts = permissionCode.substring(4).split("_", 2);
            return parts.length > 1 ? parts[1] : parts[0];
        }
        return permissionCode;
    }

    private String extractAction(String permissionCode) {
        // CAN_APPROVE_LC_IMPORT -> APPROVE
        if (permissionCode.startsWith("CAN_")) {
            String[] parts = permissionCode.substring(4).split("_", 2);
            return parts[0];
        }
        return "ACCESS";
    }

    private boolean isApprovalPermission(String permissionCode) {
        String upper = permissionCode.toUpperCase();
        return upper.contains("APPROVE") ||
               upper.contains("RELEASE") ||
               upper.contains("AUTHORIZE") ||
               upper.contains("CONFIRM");
    }

    /**
     * Check permission for a specific target type and ID.
     * Used by @PreAuthorize("hasPermission(#id, 'Operation', 'WRITE')")
     */
    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId,
                                  String targetType, Object permission) {
        // Create context with target info
        Map<String, Object> context = new HashMap<>();
        context.put("targetId", targetId);
        context.put("targetType", targetType);

        Map<String, Object> existingContext = authorizationContext.get();
        if (existingContext != null) {
            context.putAll(existingContext);
        }
        authorizationContext.set(context);

        try {
            return hasPermission(authentication, targetType, permission);
        } finally {
            authorizationContext.set(existingContext);
        }
    }

    /**
     * Check if user has any of the specified permissions.
     * Called from SpEL: hasAnyPermission('PERM1', 'PERM2', 'PERM3')
     */
    public boolean hasAnyPermission(Authentication authentication, String... permissions) {
        if (authentication == null || permissions == null || permissions.length == 0) {
            return false;
        }

        String username = authentication.getName();

        // Admin bypass (except for approval checks)
        if (hasRole(authentication.getAuthorities(), "ROLE_ADMIN")) {
            boolean hasApproval = Arrays.stream(permissions).anyMatch(this::isApprovalPermission);
            if (!hasApproval) {
                return true;
            }
        }

        return Arrays.stream(permissions)
                .anyMatch(perm -> hasPermission(authentication, null, perm));
    }

    /**
     * Check if user has all of the specified permissions.
     * Called from SpEL: hasAllPermissions('PERM1', 'PERM2')
     */
    public boolean hasAllPermissions(Authentication authentication, String... permissions) {
        if (authentication == null || permissions == null || permissions.length == 0) {
            return false;
        }

        return Arrays.stream(permissions)
                .allMatch(perm -> hasPermission(authentication, null, perm));
    }

    /**
     * Get user permissions with caching.
     */
    private Set<String> getUserPermissions(String username) {
        CachedPermissions cached = permissionCache.get(username);

        if (cached != null && !cached.isExpired()) {
            return cached.permissions;
        }

        // Load from database
        Set<String> permissions = permissionRepository.findPermissionCodesByUsername(username);

        // Cache the result
        permissionCache.put(username, new CachedPermissions(permissions));

        return permissions;
    }

    /**
     * Clear permission cache for a specific user.
     * Call this when user's roles/permissions change.
     */
    public void clearCacheForUser(String username) {
        permissionCache.remove(username);
        log.info("Cleared permission cache for user: {}", username);
    }

    /**
     * Clear all permission cache.
     * Call this when roles/permissions are modified globally.
     */
    public void clearAllCache() {
        permissionCache.clear();
        log.info("Cleared all permission cache");
    }

    /**
     * Check if user has a specific role.
     */
    private boolean hasRole(Collection<? extends GrantedAuthority> authorities, String role) {
        return authorities.stream()
                .anyMatch(auth -> auth.getAuthority().equals(role));
    }

    /**
     * Inner class for cached permissions with TTL.
     */
    private static class CachedPermissions {
        final Set<String> permissions;
        final long timestamp;

        CachedPermissions(Set<String> permissions) {
            this.permissions = permissions;
            this.timestamp = System.currentTimeMillis();
        }

        boolean isExpired() {
            return System.currentTimeMillis() - timestamp > CACHE_TTL_MS;
        }
    }
}
