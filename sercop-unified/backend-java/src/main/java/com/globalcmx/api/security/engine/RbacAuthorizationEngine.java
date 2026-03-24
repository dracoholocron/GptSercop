package com.globalcmx.api.security.engine;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Role-Based Access Control (RBAC) Authorization Engine.
 * This wraps the existing permission system.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RbacAuthorizationEngine implements AuthorizationEngine {

    private static final String ENGINE_ID = "rbac";

    @Override
    public String getEngineId() {
        return ENGINE_ID;
    }

    @Override
    public boolean isEnabled() {
        // RBAC is always enabled
        return true;
    }

    @Override
    public int getPriority() {
        return 1; // Highest priority
    }

    @Override
    public AuthorizationDecision evaluate(AuthorizationRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            return AuthorizationDecision.deny(ENGINE_ID, "Not authenticated");
        }

        // Get user's authorities (roles and permissions)
        Set<String> authorities = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        // Check for ADMIN role (has all permissions)
        if (authorities.contains("ROLE_ADMIN")) {
            return AuthorizationDecision.allow(ENGINE_ID, "Admin role has full access");
        }

        // Build the permission code to check
        String permissionCode = buildPermissionCode(request.resource(), request.action());

        // Check if user has the required permission
        if (authorities.contains(permissionCode)) {
            return AuthorizationDecision.allow(ENGINE_ID, "Has permission: " + permissionCode);
        }

        // Check context-provided permissions (for hasPermission checks)
        @SuppressWarnings("unchecked")
        Collection<String> contextPermissions = (Collection<String>) request.context().get("permissions");
        if (contextPermissions != null && contextPermissions.contains(permissionCode)) {
            return AuthorizationDecision.allow(ENGINE_ID, "Has context permission: " + permissionCode);
        }

        // Check role-based permissions from context
        @SuppressWarnings("unchecked")
        Collection<String> roles = (Collection<String>) request.context().get("roles");
        if (roles != null && hasRoleBasedPermission(roles, request.resource(), request.action())) {
            return AuthorizationDecision.allow(ENGINE_ID, "Role-based permission granted");
        }

        return AuthorizationDecision.deny(ENGINE_ID, "Missing permission: " + permissionCode);
    }

    private String buildPermissionCode(String resource, String action) {
        // Convert to standard permission format: CAN_ACTION_RESOURCE
        // e.g., resource="LC_IMPORT", action="approve" -> "CAN_APPROVE_LC_IMPORT"
        return String.format("CAN_%s_%s", action.toUpperCase(), resource.toUpperCase());
    }

    private boolean hasRoleBasedPermission(Collection<String> roles, String resource, String action) {
        // Map roles to default permissions
        for (String role : roles) {
            switch (role) {
                case "ROLE_ADMIN":
                    return true;
                case "ROLE_MANAGER":
                    // Managers can view, create, edit, approve
                    return List.of("view", "create", "edit", "approve").contains(action.toLowerCase());
                case "ROLE_OPERATOR":
                    // Operators can view, create, edit
                    return List.of("view", "create", "edit").contains(action.toLowerCase());
                case "ROLE_USER":
                    // Users can only view
                    return "view".equalsIgnoreCase(action);
            }
        }
        return false;
    }
}
