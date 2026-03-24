package com.globalcmx.api.security.filter;

import com.globalcmx.api.clientportal.service.ParticipantHierarchyService;
import com.globalcmx.api.security.entity.UserPrincipal;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

/**
 * Security filter for Client Portal access control.
 *
 * This filter enforces two critical security rules:
 *
 * 1. CLIENT users can ONLY access /client-portal/** endpoints
 *    - Blocks CLIENT users from accessing internal APIs like /v1/operations, /participants, etc.
 *
 * 2. For /client-portal/** endpoints, validates that X-Client-Id matches user's clienteId
 *    - Prevents CLIENT users from accessing data of other companies by spoofing headers
 *    - For corporate users, allows access to child companies via hierarchy validation
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(2) // Run after JwtAuthenticationFilter (Order 1)
public class ClientPortalSecurityFilter extends OncePerRequestFilter {

    private final ParticipantHierarchyService hierarchyService;

    // Endpoints that CLIENT users ARE allowed to access (their isolated environment)
    // Note: Paths may or may not include /api prefix depending on gateway configuration
    private static final Set<String> CLIENT_ALLOWED_PATH_PATTERNS = Set.of(
            "/client-portal",
            "/api/client-portal",
            "/auth",
            "/api/auth",
            "/actuator/health",
            "/api/actuator/health",
            "/alerts",
            "/api/alerts",
            "/custom-catalogs",
            "/api/custom-catalogs"
    );

    // Endpoints that are public and should not be filtered
    private static final Set<String> PUBLIC_PATHS = Set.of(
            "/auth/",
            "/api/auth/",
            "/actuator/",
            "/api/actuator/",
            "/swagger-ui",
            "/v3/api-docs",
            "/api-docs"
    );

    // Client portal config endpoints that don't require X-Client-Id validation
    // These return system-wide configuration data, not client-specific data
    // Also includes document upload endpoints (documents are tagged with user, not client-specific)
    private static final Set<String> CONFIG_PATHS_NO_CLIENT_ID = Set.of(
            "/client-portal/config/",
            "/api/client-portal/config/",
            "/client-portal/custom-fields/config",
            "/api/client-portal/custom-fields/config",
            "/client-portal/catalogs/",
            "/api/client-portal/catalogs/",
            "/client-portal/documents/",
            "/api/client-portal/documents/"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                   HttpServletResponse response,
                                   FilterChain filterChain) throws ServletException, IOException {

        String requestUri = request.getRequestURI();
        String httpMethod = request.getMethod();

        // Skip OPTIONS requests (CORS preflight)
        if ("OPTIONS".equalsIgnoreCase(httpMethod)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Get current authentication
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // If not authenticated, let other filters handle it
        if (authentication == null || !authentication.isAuthenticated()) {
            filterChain.doFilter(request, response);
            return;
        }

        // Check if principal is UserPrincipal (our custom type with userType info)
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof UserPrincipal userPrincipal)) {
            // Not our custom principal, continue (backward compatibility)
            filterChain.doFilter(request, response);
            return;
        }

        // If user is INTERNAL, allow all access (no restrictions)
        if (userPrincipal.isInternalUser()) {
            filterChain.doFilter(request, response);
            return;
        }

        // === CLIENT USER SECURITY CHECKS ===

        // Check 1: CLIENT users can ONLY access allowed paths
        if (!isClientAllowedPath(requestUri)) {
            log.warn("SECURITY: CLIENT user {} attempted to access internal API: {} {}",
                    userPrincipal.getUsername(), httpMethod, requestUri);

            sendForbiddenResponse(response, requestUri,
                    "Client portal users are not allowed to access internal system APIs");
            return;
        }

        // Check 2: For client-portal endpoints, validate X-Client-Id header
        // Exception: Config endpoints that return system-wide data don't need X-Client-Id
        if ((requestUri.startsWith("/client-portal") || requestUri.startsWith("/api/client-portal"))
                && !isConfigPathWithoutClientId(requestUri)) {
            String xClientId = request.getHeader("X-Client-Id");

            if (xClientId == null || xClientId.isBlank()) {
                log.warn("SECURITY: CLIENT user {} missing X-Client-Id header for: {} {}",
                        userPrincipal.getUsername(), httpMethod, requestUri);

                sendForbiddenResponse(response, requestUri,
                        "X-Client-Id header is required for client portal access");
                return;
            }

            // Validate X-Client-Id matches user's clienteId or is an accessible child company
            if (!isClientIdValid(userPrincipal, xClientId)) {
                log.warn("SECURITY: CLIENT user {} (clienteId={}) attempted to spoof X-Client-Id={} for: {} {}",
                        userPrincipal.getUsername(), userPrincipal.getClienteId(), xClientId, httpMethod, requestUri);

                sendForbiddenResponse(response, requestUri,
                        "Access denied: You are not authorized to access data for this client");
                return;
            }

            log.debug("CLIENT user {} validated for X-Client-Id={}", userPrincipal.getUsername(), xClientId);
        }

        // All checks passed
        filterChain.doFilter(request, response);
    }

    /**
     * Check if the request path is allowed for CLIENT users.
     */
    private boolean isClientAllowedPath(String requestUri) {
        return CLIENT_ALLOWED_PATH_PATTERNS.stream().anyMatch(requestUri::startsWith);
    }

    /**
     * Check if the request path is a config endpoint that doesn't require X-Client-Id.
     * These endpoints return system-wide configuration data (brand templates, schedules, etc.)
     */
    private boolean isConfigPathWithoutClientId(String requestUri) {
        return CONFIG_PATHS_NO_CLIENT_ID.stream().anyMatch(requestUri::startsWith);
    }

    /**
     * Validate that the X-Client-Id header is authorized for this user.
     * - Direct match: X-Client-Id equals user's clienteId
     * - Hierarchy match: X-Client-Id is a child company of user's clienteId (for corporate users)
     */
    private boolean isClientIdValid(UserPrincipal userPrincipal, String xClientId) {
        String userClienteId = userPrincipal.getClienteId();

        // User must have a clienteId assigned
        if (userClienteId == null || userClienteId.isBlank()) {
            log.warn("CLIENT user {} has no clienteId assigned", userPrincipal.getUsername());
            return false;
        }

        // Direct match - most common case
        if (userClienteId.equals(xClientId)) {
            return true;
        }

        // Hierarchy check - for corporate users accessing child companies
        try {
            Long userParticipantId = Long.parseLong(userClienteId);
            Long requestedParticipantId = Long.parseLong(xClientId);

            // Check if user can access the requested participant through hierarchy
            boolean canAccess = hierarchyService.canAccessParticipant(userParticipantId, requestedParticipantId);

            if (canAccess) {
                log.debug("Hierarchy access granted: user {} (clienteId={}) can access participant {}",
                        userPrincipal.getUsername(), userClienteId, xClientId);
            }

            return canAccess;
        } catch (NumberFormatException e) {
            log.warn("Invalid participant ID format: userClienteId={}, xClientId={}", userClienteId, xClientId);
            return false;
        }
    }

    /**
     * Send a 403 Forbidden response with JSON error body.
     */
    private void sendForbiddenResponse(HttpServletResponse response, String path, String message) throws IOException {
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(String.format(
                "{\"error\":\"Forbidden\",\"message\":\"%s\",\"path\":\"%s\",\"status\":403}",
                message, path
        ));
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // Skip filtering for public endpoints
        return PUBLIC_PATHS.stream().anyMatch(path::startsWith);
    }
}
