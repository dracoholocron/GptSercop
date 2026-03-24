package com.globalcmx.api.security.filter;

import com.globalcmx.api.security.entity.ApiAccessLog;
import com.globalcmx.api.security.entity.ApiEndpoint;
import com.globalcmx.api.security.entity.Permission;
import com.globalcmx.api.security.entity.UserPrincipal;
import com.globalcmx.api.security.service.ApiAccessLogService;
import com.globalcmx.api.security.service.ApiEndpointCacheService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Filter to validate API endpoint permissions and log access.
 * Checks if the authenticated user has the required permissions 
 * to access the requested API endpoint.
 * Logs all API accesses for monitoring and security auditing.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ApiPermissionFilter extends OncePerRequestFilter {

    private final ApiEndpointCacheService apiEndpointCacheService;
    private final ApiAccessLogService apiAccessLogService;

    /**
     * Prefijos de endpoints permitidos para widget tokens (solo lectura de dashboards).
     * Widget tokens son JWT de corta vida (15 min) usados para embeber dashboards
     * en sistemas externos (portales de bancos, intranets).
     */
    private static final List<String> WIDGET_ALLOWED_PREFIXES = List.of(
            "/dashboard", "/api/dashboard",
            "/commissions", "/api/commissions",
            "/alerts", "/api/alerts",
            "/custom-catalogs", "/api/custom-catalogs",
            "/participants", "/api/participants",
            "/brand-templates", "/api/brand-templates",
            "/system-config", "/api/system-config",
            "/product-type-config", "/api/product-type-config"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                   HttpServletResponse response,
                                   FilterChain filterChain) throws ServletException, IOException {

        String requestUri = request.getRequestURI();
        String httpMethod = request.getMethod();
        long startTime = System.currentTimeMillis();
        
        // Debug logging for AI Chat endpoints
        if (requestUri != null && requestUri.contains("/ai/chat")) {
            log.warn("=== REQUEST URI DEBUG: method={}, uri={}, contextPath={}, servletPath={} ===", 
                httpMethod, requestUri, request.getContextPath(), request.getServletPath());
        }

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

        String username = authentication.getName();
        String ipAddress = getClientIpAddress(request);
        String userAgent = request.getHeader("User-Agent");

        // ── Widget Token Scope Enforcement ──
        // Widget tokens (scope=widget) solo permiten GET a endpoints de dashboard.
        // Marcado por JwtAuthenticationFilter via request attribute.
        Boolean isWidgetScope = (Boolean) request.getAttribute("WIDGET_SCOPE");
        if (Boolean.TRUE.equals(isWidgetScope)) {
            // Widget tokens SOLO permiten GET (lectura)
            if (!"GET".equalsIgnoreCase(httpMethod)) {
                log.warn("SECURITY: Widget token de {} intento {} {} - BLOQUEADO (solo GET permitido)",
                        username, httpMethod, requestUri);
                logAccess(username, httpMethod, requestUri, null, null, false,
                        "Widget token denied: only GET allowed", Set.of(), ipAddress, userAgent, startTime);
                response.setStatus(HttpStatus.FORBIDDEN.value());
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write(
                        "{\"error\":\"WIDGET_SCOPE_DENIED\",\"message\":\"Widget tokens solo permiten lectura (GET)\"}");
                return;
            }

            // Verificar whitelist de endpoints para widgets
            boolean widgetPathAllowed = WIDGET_ALLOWED_PREFIXES.stream()
                    .anyMatch(requestUri::startsWith);

            if (!widgetPathAllowed) {
                log.warn("SECURITY: Widget token de {} intento GET {} - BLOQUEADO (endpoint no permitido para widgets)",
                        username, requestUri);
                logAccess(username, httpMethod, requestUri, null, null, false,
                        "Widget token denied: endpoint not in widget whitelist", Set.of(), ipAddress, userAgent, startTime);
                response.setStatus(HttpStatus.FORBIDDEN.value());
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write(
                        "{\"error\":\"WIDGET_SCOPE_DENIED\",\"message\":\"Endpoint no permitido para widget tokens\"}");
                return;
            }

            log.debug("Widget token acceso permitido: GET {}", requestUri);
            // Continuar con la validacion normal de permisos
        }

        // Get user's permissions
        Set<String> userPermissions = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(auth -> !auth.startsWith("ROLE_"))
                .collect(Collectors.toSet());

        // Find matching API endpoint configuration (using cache)
        Optional<ApiEndpoint> matchingEndpointOpt = apiEndpointCacheService.findMatchingEndpoint(httpMethod, requestUri);

        // If no endpoint configuration found, apply security policy
        if (matchingEndpointOpt.isEmpty()) {
            // Check if user is a CLIENT type - extra security layer
            Object principal = authentication.getPrincipal();
            if (principal instanceof UserPrincipal userPrincipal && userPrincipal.isClientUser()) {
                // Allow CLIENT users to access /client-portal/** and /custom-catalogs/** endpoints
                // These are already secured by ClientPortalSecurityFilter (X-Client-Id validation)
                if (requestUri.startsWith("/client-portal") || requestUri.startsWith("/api/client-portal")
                        || requestUri.startsWith("/custom-catalogs") || requestUri.startsWith("/api/custom-catalogs")
                        || requestUri.startsWith("/alerts") || requestUri.startsWith("/api/alerts")) {
                    log.debug("CLIENT user {} accessing client-portal endpoint (pre-validated): {} {}",
                            username, httpMethod, requestUri);
                    filterChain.doFilter(request, response);
                    logAccess(username, httpMethod, requestUri, null, null, true, null,
                             userPermissions, ipAddress, userAgent, startTime);
                    return;
                }

                // CLIENT users should NEVER access other unconfigured endpoints
                log.warn("SECURITY: CLIENT user {} attempted to access unconfigured endpoint: {} {}",
                        username, httpMethod, requestUri);
                logAccess(username, httpMethod, requestUri, null, null, false,
                        "CLIENT user access to unconfigured endpoint denied",
                        userPermissions, ipAddress, userAgent, startTime);
                response.setStatus(HttpStatus.FORBIDDEN.value());
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write(String.format(
                        "{\"error\":\"Forbidden\",\"message\":\"Access denied\",\"path\":\"%s\",\"status\":403}",
                        requestUri
                ));
                return;
            }

            // DEFAULT ALLOW for INTERNAL users: endpoints not yet registered are allowed
            // but logged for auditing so they can be configured later
            log.debug("SECURITY: INTERNAL user {} accessing unconfigured endpoint (allowed): {} {}",
                    username, httpMethod, requestUri);
            logAccess(username, httpMethod, requestUri, null, null, true,
                    "INTERNAL user access to unconfigured endpoint allowed (DEFAULT ALLOW)",
                    userPermissions, ipAddress, userAgent, startTime);
            filterChain.doFilter(request, response);
            return;
        }

        ApiEndpoint matchingEndpoint = matchingEndpointOpt.get();

        // If endpoint is public, allow access
        if (Boolean.TRUE.equals(matchingEndpoint.getIsPublic())) {
            filterChain.doFilter(request, response);
            logAccess(username, httpMethod, requestUri, matchingEndpoint.getUrlPattern(), 
                     matchingEndpoint.getCode(), true, null, userPermissions, ipAddress, userAgent, startTime);
            return;
        }

        // Check if user has required permissions
        Set<Permission> requiredPermissions = matchingEndpoint.getRequiredPermissions();
        
        // If no permissions required, allow access
        if (requiredPermissions == null || requiredPermissions.isEmpty()) {
            filterChain.doFilter(request, response);
            logAccess(username, httpMethod, requestUri, matchingEndpoint.getUrlPattern(),
                     matchingEndpoint.getCode(), true, null, userPermissions, ipAddress, userAgent, startTime);
            return;
        }

        // Check if user has any of the required permissions
        Set<String> requiredPermCodes = requiredPermissions.stream()
                .map(Permission::getCode)
                .collect(Collectors.toSet());

        boolean hasPermission = requiredPermCodes.stream()
                .anyMatch(userPermissions::contains);

        if (!hasPermission) {
            log.warn("Access denied for user {} to endpoint {} {} - Missing permissions: {}",
                    username, httpMethod, requestUri, requiredPermCodes);

            // Log the denied access
            logAccess(username, httpMethod, requestUri, matchingEndpoint.getUrlPattern(),
                     matchingEndpoint.getCode(), false, "Missing required permissions: " + requiredPermCodes,
                     userPermissions, ipAddress, userAgent, startTime);

            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write(String.format(
                    "{\"error\":\"Forbidden\",\"message\":\"You don't have permission to access this resource\",\"path\":\"%s\",\"status\":403}",
                    requestUri
            ));
            return;
        }

        log.debug("Access granted for user {} to endpoint {} {}",
                username, httpMethod, requestUri);

        // Log successful access
        logAccess(username, httpMethod, requestUri, matchingEndpoint.getUrlPattern(),
                 matchingEndpoint.getCode(), true, null, userPermissions, ipAddress, userAgent, startTime);

        filterChain.doFilter(request, response);
    }

    /**
     * Log API access asynchronously.
     */
    private void logAccess(String username, String httpMethod, String requestUri,
                          String urlPattern, String endpointCode, boolean granted,
                          String denialReason, Set<String> userPermissions,
                          String ipAddress, String userAgent, long startTime) {
        try {
            ApiAccessLog accessLog = ApiAccessLog.builder()
                    .username(username)
                    .httpMethod(httpMethod)
                    .requestUri(requestUri)
                    .urlPattern(urlPattern != null ? urlPattern : requestUri)
                    .endpointCode(endpointCode)
                    .accessGranted(granted)
                    .denialReason(denialReason)
                    .userPermissions(userPermissions != null ? String.join(",", userPermissions) : null)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent != null && userAgent.length() > 500 ? userAgent.substring(0, 500) : userAgent)
                    .accessedAt(Instant.now())
                    .responseTimeMs(System.currentTimeMillis() - startTime)
                    .build();

            apiAccessLogService.logAccess(accessLog);
        } catch (Exception e) {
            log.error("Error logging API access: {}", e.getMessage());
        }
    }

    /**
     * Get client IP address, handling proxies.
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // Skip filtering for auth and public endpoints
        return path.startsWith("/auth/") ||
               path.startsWith("/actuator/") ||
               path.startsWith("/api/swift-section-config/") ||
               path.startsWith("/api/swift-field-configs/") ||
               path.startsWith("/ai/extraction/") ||
               path.equals("/health");
    }
}
