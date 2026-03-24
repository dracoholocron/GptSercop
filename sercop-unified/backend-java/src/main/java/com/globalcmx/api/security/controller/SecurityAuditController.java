package com.globalcmx.api.security.controller;

import com.globalcmx.api.dto.ApiResponse;
import com.globalcmx.api.security.audit.SecurityAuditEvent;
import com.globalcmx.api.security.audit.SecurityAuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

/**
 * Controller for Security Audit Log operations.
 * Provides endpoints for viewing and exporting security events.
 *
 * Endpoints:
 * - GET /api/admin/audit - Get paginated audit events
 * - GET /api/admin/audit/user/{username} - Events by username
 * - GET /api/admin/audit/type/{eventType} - Events by type
 * - GET /api/admin/audit/alerts - Security alerts
 * - GET /api/admin/audit/critical - Recent critical events
 * - GET /api/admin/audit/statistics - Event statistics
 * - GET /api/admin/audit/export - Export audit logs (CSV)
 */
@RestController
@RequestMapping("/admin/audit")
@RequiredArgsConstructor
@Slf4j
public class SecurityAuditController {

    private final SecurityAuditService auditService;

    /**
     * Get paginated audit events.
     */
    @GetMapping
    @PreAuthorize("hasPermission(null, 'CAN_VIEW_AUDIT')")
    public ResponseEntity<ApiResponse<Page<SecurityAuditEventDTO>>> getAuditEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        log.debug("Request to get audit events - page: {}, size: {}", page, size);

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<SecurityAuditEvent> events = auditService.getAuditEvents(pageable);
        Page<SecurityAuditEventDTO> dtos = events.map(this::toDTO);

        return ResponseEntity.ok(ApiResponse.success("Audit events retrieved", dtos));
    }

    /**
     * Get audit events by username.
     */
    @GetMapping("/user/{username}")
    @PreAuthorize("hasPermission(null, 'CAN_VIEW_AUDIT')")
    public ResponseEntity<ApiResponse<Page<SecurityAuditEventDTO>>> getEventsByUsername(
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.debug("Request to get audit events for user: {}", username);

        Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").descending());
        Page<SecurityAuditEvent> events = auditService.getEventsByUsername(username, pageable);
        Page<SecurityAuditEventDTO> dtos = events.map(this::toDTO);

        return ResponseEntity.ok(ApiResponse.success("User events retrieved", dtos));
    }

    /**
     * Get audit events by event type.
     */
    @GetMapping("/type/{eventType}")
    @PreAuthorize("hasPermission(null, 'CAN_VIEW_AUDIT')")
    public ResponseEntity<ApiResponse<Page<SecurityAuditEventDTO>>> getEventsByType(
            @PathVariable SecurityAuditEvent.EventType eventType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.debug("Request to get audit events of type: {}", eventType);

        Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").descending());
        Page<SecurityAuditEvent> events = auditService.getEventsByType(eventType, pageable);
        Page<SecurityAuditEventDTO> dtos = events.map(this::toDTO);

        return ResponseEntity.ok(ApiResponse.success("Events by type retrieved", dtos));
    }

    /**
     * Get security alerts (failed logins, permission denials, suspicious activity).
     */
    @GetMapping("/alerts")
    @PreAuthorize("hasPermission(null, 'CAN_VIEW_AUDIT')")
    public ResponseEntity<ApiResponse<Page<SecurityAuditEventDTO>>> getSecurityAlerts(
            @RequestParam(defaultValue = "24") int hours,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.debug("Request to get security alerts from last {} hours", hours);

        Instant since = Instant.now().minus(hours, ChronoUnit.HOURS);
        Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").descending());
        Page<SecurityAuditEvent> events = auditService.getSecurityAlerts(since, pageable);
        Page<SecurityAuditEventDTO> dtos = events.map(this::toDTO);

        return ResponseEntity.ok(ApiResponse.success("Security alerts retrieved", dtos));
    }

    /**
     * Get recent critical events.
     */
    @GetMapping("/critical")
    @PreAuthorize("hasPermission(null, 'CAN_VIEW_AUDIT')")
    public ResponseEntity<ApiResponse<List<SecurityAuditEventDTO>>> getRecentCriticalEvents(
            @RequestParam(defaultValue = "24") int hours) {

        log.debug("Request to get critical events from last {} hours", hours);

        List<SecurityAuditEvent> events = auditService.getRecentCriticalEvents(hours);
        List<SecurityAuditEventDTO> dtos = events.stream().map(this::toDTO).toList();

        return ResponseEntity.ok(ApiResponse.success("Critical events retrieved", dtos));
    }

    /**
     * Get event statistics.
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasPermission(null, 'CAN_VIEW_AUDIT')")
    public ResponseEntity<ApiResponse<AuditStatistics>> getEventStatistics(
            @RequestParam(defaultValue = "30") int days) {

        log.debug("Request to get audit statistics for last {} days", days);

        Map<String, Long> stats = auditService.getEventStatistics(days);

        long totalEvents = stats.values().stream().mapToLong(Long::longValue).sum();
        long failedLogins = stats.getOrDefault("LOGIN_FAILURE", 0L);
        long permissionDenials = stats.getOrDefault("PERMISSION_DENIED", 0L);
        long criticalEvents = stats.getOrDefault("BRUTE_FORCE_DETECTED", 0L) +
                             stats.getOrDefault("SUSPICIOUS_ACTIVITY", 0L) +
                             stats.getOrDefault("ACCOUNT_LOCKED", 0L);

        AuditStatistics statistics = new AuditStatistics(
                totalEvents,
                failedLogins,
                permissionDenials,
                criticalEvents,
                stats,
                days
        );

        return ResponseEntity.ok(ApiResponse.success("Audit statistics retrieved", statistics));
    }

    /**
     * Get available event types.
     */
    @GetMapping("/event-types")
    @PreAuthorize("hasPermission(null, 'CAN_VIEW_AUDIT')")
    public ResponseEntity<ApiResponse<SecurityAuditEvent.EventType[]>> getEventTypes() {
        return ResponseEntity.ok(ApiResponse.success("Event types retrieved", SecurityAuditEvent.EventType.values()));
    }

    /**
     * Get available severity levels.
     */
    @GetMapping("/severities")
    @PreAuthorize("hasPermission(null, 'CAN_VIEW_AUDIT')")
    public ResponseEntity<ApiResponse<SecurityAuditEvent.Severity[]>> getSeverities() {
        return ResponseEntity.ok(ApiResponse.success("Severities retrieved", SecurityAuditEvent.Severity.values()));
    }

    /**
     * Export audit logs as CSV.
     */
    @GetMapping("/export")
    @PreAuthorize("hasPermission(null, 'CAN_EXPORT_AUDIT')")
    public ResponseEntity<String> exportAuditLogs(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) SecurityAuditEvent.EventType eventType) {

        log.info("Request to export audit logs");

        // Default to last 30 days if no date range specified
        Instant start = startDate != null
                ? startDate.toInstant(ZoneOffset.UTC)
                : Instant.now().minus(30, ChronoUnit.DAYS);
        Instant end = endDate != null
                ? endDate.toInstant(ZoneOffset.UTC)
                : Instant.now();

        StringBuilder csv = new StringBuilder();
        csv.append("ID,Timestamp,Event Type,Severity,Username,IP Address,Resource,Action,Success,Failure Reason,Details\n");

        // Get all events (pagination handled for export)
        Pageable pageable = PageRequest.of(0, 10000, Sort.by("timestamp").descending());
        Page<SecurityAuditEvent> events = auditService.getAuditEvents(pageable);

        for (SecurityAuditEvent event : events) {
            if (event.getTimestamp().isBefore(start) || event.getTimestamp().isAfter(end)) continue;
            if (username != null && !username.equals(event.getUsername())) continue;
            if (eventType != null && eventType != event.getEventType()) continue;

            csv.append(String.format("%d,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n",
                    event.getId(),
                    event.getTimestamp(),
                    event.getEventType(),
                    event.getSeverity(),
                    escapeCsv(event.getUsername()),
                    escapeCsv(event.getIpAddress()),
                    escapeCsv(event.getResource()),
                    escapeCsv(event.getAction()),
                    event.getSuccess(),
                    escapeCsv(event.getFailureReason()),
                    escapeCsv(event.getDetails())
            ));
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "security_audit_" + Instant.now().toString() + ".csv");

        return ResponseEntity.ok()
                .headers(headers)
                .body(csv.toString());
    }

    /**
     * Trigger manual cleanup of old logs.
     */
    @PostMapping("/cleanup")
    @PreAuthorize("hasPermission(null, 'CAN_CONFIG_SYSTEM')")
    public ResponseEntity<ApiResponse<Void>> triggerCleanup() {
        log.info("Manual audit log cleanup triggered");
        auditService.cleanupOldLogs();
        return ResponseEntity.ok(ApiResponse.success("Audit logs cleanup completed", null));
    }

    // Helper methods

    private SecurityAuditEventDTO toDTO(SecurityAuditEvent event) {
        return new SecurityAuditEventDTO(
                event.getId(),
                event.getEventType(),
                event.getSeverity(),
                event.getUsername(),
                event.getIpAddress(),
                event.getUserAgent(),
                event.getResource(),
                event.getAction(),
                event.getSuccess(),
                event.getFailureReason(),
                event.getDetails(),
                event.getSessionId(),
                event.getCorrelationId(),
                event.getTimestamp()
        );
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    // DTOs

    public record SecurityAuditEventDTO(
            Long id,
            SecurityAuditEvent.EventType eventType,
            SecurityAuditEvent.Severity severity,
            String username,
            String ipAddress,
            String userAgent,
            String resource,
            String action,
            Boolean success,
            String failureReason,
            String details,
            String sessionId,
            String correlationId,
            Instant timestamp
    ) {}

    public record AuditStatistics(
            long totalEvents,
            long failedLogins,
            long permissionDenials,
            long criticalEvents,
            Map<String, Long> byEventType,
            int periodDays
    ) {}
}
