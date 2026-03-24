package com.globalcmx.api.security.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service for security audit logging.
 * Provides comprehensive security monitoring and threat detection.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SecurityAuditService {

    private final SecurityAuditRepository auditRepository;
    private final ObjectMapper objectMapper;
    private final com.globalcmx.api.security.config.SecurityAuditProperties auditProperties;

    /**
     * Log a security event asynchronously.
     */
    @Async
    public void logEventAsync(SecurityAuditEvent.EventType eventType,
                               SecurityAuditEvent.Severity severity,
                               String username,
                               String resource,
                               String action,
                               boolean success,
                               String failureReason,
                               Map<String, Object> additionalDetails) {
        logEvent(eventType, severity, username, resource, action, success, failureReason, additionalDetails);
    }

    /**
     * Log a security event synchronously.
     */
    @Transactional
    public SecurityAuditEvent logEvent(SecurityAuditEvent.EventType eventType,
                                        SecurityAuditEvent.Severity severity,
                                        String username,
                                        String resource,
                                        String action,
                                        boolean success,
                                        String failureReason,
                                        Map<String, Object> additionalDetails) {
        try {
            HttpServletRequest request = getCurrentRequest();
            String ipAddress = extractIpAddress(request);
            String userAgent = request != null ? request.getHeader("User-Agent") : null;
            String sessionId = request != null && request.getSession(false) != null
                    ? request.getSession().getId() : null;

            String details = null;
            if (additionalDetails != null && !additionalDetails.isEmpty()) {
                try {
                    details = objectMapper.writeValueAsString(additionalDetails);
                } catch (JsonProcessingException e) {
                    log.warn("Failed to serialize audit details", e);
                }
            }

            SecurityAuditEvent event = SecurityAuditEvent.builder()
                    .eventType(eventType)
                    .severity(severity)
                    .username(username)
                    .ipAddress(ipAddress)
                    .userAgent(truncate(userAgent, 500))
                    .resource(resource)
                    .action(action)
                    .success(success)
                    .failureReason(failureReason)
                    .details(details)
                    .sessionId(sessionId)
                    .correlationId(UUID.randomUUID().toString().substring(0, 8))
                    .build();

            SecurityAuditEvent saved = auditRepository.save(event);

            // Check for security threats
            if (!success) {
                checkSecurityThreats(eventType, username, ipAddress);
            }

            return saved;
        } catch (Exception e) {
            log.error("Failed to log security audit event", e);
            return null;
        }
    }

    // Convenience methods for common events

    public void logLoginSuccess(String username, String identityProvider) {
        Map<String, Object> details = new HashMap<>();
        details.put("identityProvider", identityProvider);
        logEvent(SecurityAuditEvent.EventType.LOGIN_SUCCESS,
                SecurityAuditEvent.Severity.INFO,
                username, "/auth/login", "POST", true, null, details);
    }

    public void logLoginFailure(String username, String reason) {
        logEvent(SecurityAuditEvent.EventType.LOGIN_FAILURE,
                SecurityAuditEvent.Severity.WARNING,
                username, "/auth/login", "POST", false, reason, null);
    }

    public void logLogout(String username) {
        logEvent(SecurityAuditEvent.EventType.LOGOUT,
                SecurityAuditEvent.Severity.INFO,
                username, "/auth/logout", "POST", true, null, null);
    }

    public void logSsoLoginInitiated(String username, String provider) {
        Map<String, Object> details = Map.of("provider", provider);
        logEvent(SecurityAuditEvent.EventType.SSO_LOGIN_INITIATED,
                SecurityAuditEvent.Severity.INFO,
                username, "/auth/oauth2/" + provider, "GET", true, null, details);
    }

    public void logSsoLoginSuccess(String username, String provider, boolean isNewUser) {
        Map<String, Object> details = Map.of("provider", provider, "newUser", isNewUser);
        logEvent(SecurityAuditEvent.EventType.SSO_LOGIN_SUCCESS,
                SecurityAuditEvent.Severity.INFO,
                username, "/auth/callback/" + provider, "GET", true, null, details);
    }

    public void logSsoLoginFailure(String username, String provider, String reason) {
        Map<String, Object> details = Map.of("provider", provider);
        logEvent(SecurityAuditEvent.EventType.SSO_LOGIN_FAILURE,
                SecurityAuditEvent.Severity.WARNING,
                username, "/auth/callback/" + provider, "GET", false, reason, details);
    }

    public void logPermissionGranted(String username, String permission, String resource) {
        Map<String, Object> details = Map.of("permission", permission);
        logEvent(SecurityAuditEvent.EventType.PERMISSION_GRANTED,
                SecurityAuditEvent.Severity.INFO,
                username, resource, "ACCESS", true, null, details);
    }

    public void logPermissionDenied(String username, String permission, String resource) {
        Map<String, Object> details = Map.of("permission", permission);
        logEvent(SecurityAuditEvent.EventType.PERMISSION_DENIED,
                SecurityAuditEvent.Severity.WARNING,
                username, resource, "ACCESS", false, "Permission denied: " + permission, details);
    }

    public void logRoleAssigned(String username, String role, String assignedBy) {
        Map<String, Object> details = Map.of("role", role, "assignedBy", assignedBy);
        logEvent(SecurityAuditEvent.EventType.ROLE_ASSIGNED,
                SecurityAuditEvent.Severity.INFO,
                username, "/admin/users/" + username + "/roles", "POST", true, null, details);
    }

    public void logRoleRemoved(String username, String role, String removedBy) {
        Map<String, Object> details = Map.of("role", role, "removedBy", removedBy);
        logEvent(SecurityAuditEvent.EventType.ROLE_REMOVED,
                SecurityAuditEvent.Severity.INFO,
                username, "/admin/users/" + username + "/roles", "DELETE", true, null, details);
    }

    public void logUserCreated(String username, String createdBy, String identityProvider) {
        Map<String, Object> details = Map.of(
                "createdBy", createdBy,
                "identityProvider", identityProvider
        );
        logEvent(SecurityAuditEvent.EventType.USER_CREATED,
                SecurityAuditEvent.Severity.INFO,
                username, "/admin/users", "POST", true, null, details);
    }

    public void logSuspiciousActivity(String username, String description) {
        logEvent(SecurityAuditEvent.EventType.SUSPICIOUS_ACTIVITY,
                SecurityAuditEvent.Severity.CRITICAL,
                username, null, null, false, description, null);
    }

    public void logBruteForceDetected(String username, String ipAddress, int attempts) {
        Map<String, Object> details = Map.of("ipAddress", ipAddress, "attempts", attempts);
        logEvent(SecurityAuditEvent.EventType.BRUTE_FORCE_DETECTED,
                SecurityAuditEvent.Severity.CRITICAL,
                username, "/auth/login", "POST", false,
                "Brute force attack detected: " + attempts + " failed attempts", details);
    }

    public void logAccountLocked(String username, String reason) {
        logEvent(SecurityAuditEvent.EventType.ACCOUNT_LOCKED,
                SecurityAuditEvent.Severity.CRITICAL,
                username, null, null, true, reason, null);
    }

    /**
     * Check for security threats based on recent events.
     */
    private void checkSecurityThreats(SecurityAuditEvent.EventType eventType, String username, String ipAddress) {
        var bruteForce = auditProperties.getBruteForce();
        var suspicious = auditProperties.getSuspiciousActivity();

        Instant since = Instant.now().minus(bruteForce.getWindowMinutes(), ChronoUnit.MINUTES);

        if (eventType == SecurityAuditEvent.EventType.LOGIN_FAILURE) {
            // Check for brute force by username
            if (username != null) {
                long failedLogins = auditRepository.countFailedLogins(username, since);
                if (failedLogins >= bruteForce.getMaxFailedLoginsPerUser()) {
                    logBruteForceDetected(username, ipAddress, (int) failedLogins);
                }
            }

            // Check for brute force by IP
            if (ipAddress != null) {
                long failedByIp = auditRepository.countFailedLoginsByIp(ipAddress, since);
                if (failedByIp >= bruteForce.getMaxFailedLoginsPerIp()) {
                    logBruteForceDetected("IP:" + ipAddress, ipAddress, (int) failedByIp);
                }
            }
        }

        Instant suspiciousSince = Instant.now().minus(suspicious.getWindowMinutes(), ChronoUnit.MINUTES);
        if (eventType == SecurityAuditEvent.EventType.PERMISSION_DENIED && username != null) {
            long denials = auditRepository.countPermissionDenials(username, suspiciousSince);
            if (denials >= suspicious.getMaxPermissionDenials()) {
                logSuspiciousActivity(username,
                        "Excessive permission denials: " + denials + " in " + suspicious.getWindowMinutes() + " minutes");
            }
        }
    }

    // Query methods

    @Transactional(readOnly = true)
    public Page<SecurityAuditEvent> getAuditEvents(Pageable pageable) {
        return auditRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Page<SecurityAuditEvent> getEventsByUsername(String username, Pageable pageable) {
        return auditRepository.findByUsername(username, pageable);
    }

    @Transactional(readOnly = true)
    public Page<SecurityAuditEvent> getEventsByType(SecurityAuditEvent.EventType eventType, Pageable pageable) {
        return auditRepository.findByEventType(eventType, pageable);
    }

    @Transactional(readOnly = true)
    public Page<SecurityAuditEvent> getSecurityAlerts(Instant since, Pageable pageable) {
        return auditRepository.findSecurityAlerts(since, pageable);
    }

    @Transactional(readOnly = true)
    public List<SecurityAuditEvent> getRecentCriticalEvents(int hours) {
        return auditRepository.findRecentCriticalEvents(
                Instant.now().minus(hours, ChronoUnit.HOURS));
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getEventStatistics(int days) {
        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);
        List<Object[]> results = auditRepository.countByEventType(since);
        Map<String, Long> stats = new HashMap<>();
        for (Object[] row : results) {
            stats.put(((SecurityAuditEvent.EventType) row[0]).name(), (Long) row[1]);
        }
        return stats;
    }

    /**
     * Scheduled cleanup of old audit logs.
     * Cron expression configurable via security.audit.retention.cleanup-cron
     */
    @Scheduled(cron = "${security.audit.retention.cleanup-cron:0 0 2 * * *}")
    @Transactional
    public void cleanupOldLogs() {
        int retentionDays = auditProperties.getRetention().getDays();
        Instant cutoff = Instant.now().minus(retentionDays, ChronoUnit.DAYS);
        auditRepository.deleteByTimestampBefore(cutoff);
        log.info("Cleaned up audit logs older than {} days", retentionDays);
    }

    // Helper methods

    private HttpServletRequest getCurrentRequest() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            return attrs != null ? attrs.getRequest() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private String extractIpAddress(HttpServletRequest request) {
        if (request == null) return null;

        // Check for forwarded IP (behind proxy/load balancer)
        String[] headers = {
                "X-Forwarded-For",
                "X-Real-IP",
                "Proxy-Client-IP",
                "WL-Proxy-Client-IP"
        };

        for (String header : headers) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                // X-Forwarded-For can contain multiple IPs, take the first
                return ip.split(",")[0].trim();
            }
        }

        return request.getRemoteAddr();
    }

    private String truncate(String value, int maxLength) {
        if (value == null) return null;
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}
