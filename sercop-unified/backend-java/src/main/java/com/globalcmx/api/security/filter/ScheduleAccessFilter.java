package com.globalcmx.api.security.filter;

import com.globalcmx.api.security.entity.User;
import com.globalcmx.api.security.repository.UserRepository;
import com.globalcmx.api.security.schedule.dto.ScheduleAccessResult;
import com.globalcmx.api.security.schedule.entity.AccessResult;
import com.globalcmx.api.security.schedule.service.SystemScheduleService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

/**
 * Filtro de seguridad que valida el acceso basado en horarios del sistema.
 * Intercepta todas las solicitudes autenticadas y verifica si el usuario
 * tiene acceso según la configuración de horarios.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ScheduleAccessFilter extends OncePerRequestFilter {

    private final SystemScheduleService scheduleService;
    private final UserRepository userRepository;

    @Value("${globalcmx.schedule.enabled:true}")
    private boolean scheduleEnabled;

    @Value("${globalcmx.schedule.block-access:true}")
    private boolean blockAccess;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                   HttpServletResponse response,
                                   FilterChain filterChain) throws ServletException, IOException {

        // Si los horarios están deshabilitados, continuar sin validar
        if (!scheduleEnabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String requestUri = request.getRequestURI();
        String httpMethod = request.getMethod();

        // Debug logging for AI Chat endpoints
        if (requestUri != null && requestUri.contains("/ai/chat")) {
            log.warn("=== SCHEDULE FILTER DEBUG: method={}, uri={} ===", httpMethod, requestUri);
        }

        // Skip OPTIONS requests (CORS preflight)
        if ("OPTIONS".equalsIgnoreCase(httpMethod)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Get current authentication
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // If not authenticated, let other filters handle it
        if (authentication == null || !authentication.isAuthenticated() ||
            "anonymousUser".equals(authentication.getPrincipal())) {
            if (requestUri != null && requestUri.contains("/ai/chat")) {
                log.warn("Schedule filter: Not authenticated, allowing through");
            }
            filterChain.doFilter(request, response);
            return;
        }

        String username = authentication.getName();

        // Buscar usuario
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            // Usuario no encontrado, dejar pasar (otros filtros manejarán esto)
            filterChain.doFilter(request, response);
            return;
        }

        User user = userOpt.get();
        String userTimezone = request.getHeader("X-User-Timezone");
        if (userTimezone == null || userTimezone.isEmpty()) {
            userTimezone = request.getParameter("timezone");
        }

        // Evaluar acceso por horario
        ScheduleAccessResult result = scheduleService.evaluateAccess(user, userTimezone);

        // Registrar intento de acceso
        String ipAddress = getClientIpAddress(request);
        String userAgent = request.getHeader("User-Agent");
        String sessionId = request.getSession(false) != null ? request.getSession().getId() : null;
        scheduleService.logAccessAttempt(user, result, ipAddress, userAgent, sessionId);

        // Si el acceso está denegado y el bloqueo está habilitado
        if (result.getResult() == AccessResult.DENIED && blockAccess) {
            log.warn("Schedule access denied for user {} to {} {} - Reason: {}",
                    username, httpMethod, requestUri, result.getReason());
            
            // Debug logging for AI Chat endpoints
            if (requestUri != null && requestUri.contains("/ai/chat")) {
                log.warn("=== SCHEDULE FILTER BLOCKING AI CHAT: user={}, result={}, blockAccess={} ===",
                    username, result.getResult(), blockAccess);
            }

            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());

            String jsonResponse = String.format(
                "{\"success\":false,\"error\":\"SCHEDULE_ACCESS_DENIED\",\"message\":\"%s\",\"data\":{\"reason\":\"%s\",\"level\":\"%s\",\"nextAccessTime\":\"%s\"},\"path\":\"%s\",\"status\":403}",
                "Access denied due to schedule restrictions",
                result.getReason() != null ? result.getReason() : "schedule.error.outside_operation_hours",
                result.getLevelApplied() != null ? result.getLevelApplied().name() : "GLOBAL",
                result.getAllowedStart() != null ? result.getAllowedStart().toString() : "",
                requestUri
            );

            response.getWriter().write(jsonResponse);
            return;
        }

        // Si hay advertencia, agregar header
        if (result.getResult() == AccessResult.WARNED) {
            response.setHeader("X-Schedule-Warning", "true");
            response.setHeader("X-Schedule-Minutes-Remaining",
                    String.valueOf(result.getMinutesRemaining()));
        }

        log.debug("Schedule access granted for user {} to {} {}", username, httpMethod, requestUri);
        filterChain.doFilter(request, response);
    }

    /**
     * Obtiene la dirección IP del cliente, manejando proxies.
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
        // Endpoints que no deben ser filtrados por horario
        return path.startsWith("/auth/") ||
               path.startsWith("/actuator/") ||
               path.equals("/health") ||
               path.startsWith("/schedules/current-status") || // Permitir verificar estado
               path.startsWith("/api/schedules/current-status") ||
               path.startsWith("/api/auth/") ||
               path.startsWith("/api/actuator/");
    }
}
