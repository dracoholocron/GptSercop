package com.globalcmx.api.security.controller;

import com.globalcmx.api.security.entity.ApiAccessLog;
import com.globalcmx.api.security.service.ApiAccessLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for API access monitoring and analytics.
 * Provides endpoints for the security dashboard.
 */
@RestController
@RequestMapping("/monitoring")
@RequiredArgsConstructor
public class ApiMonitoringController {

    private final ApiAccessLogService apiAccessLogService;

    /**
     * Get API access statistics for the specified time period.
     * @param hours Number of hours to look back (default 24)
     * @return Aggregated statistics
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('SECURITY_AUDIT') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getStatistics(
            @RequestParam(defaultValue = "24") int hours) {
        
        Instant start = Instant.now().minus(hours, ChronoUnit.HOURS);
        Instant end = Instant.now();
        
        Map<String, Object> stats = apiAccessLogService.getStatistics(start, end);
        return ResponseEntity.ok(stats);
    }

    /**
     * Get paginated list of recent API access logs.
     */
    @GetMapping("/logs")
    @PreAuthorize("hasAuthority('SECURITY_AUDIT') or hasRole('ADMIN')")
    public ResponseEntity<Page<ApiAccessLog>> getRecentLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        return ResponseEntity.ok(apiAccessLogService.getRecentLogs(page, size));
    }

    /**
     * Get logs of denied API access attempts.
     */
    @GetMapping("/logs/denied")
    @PreAuthorize("hasAuthority('SECURITY_AUDIT') or hasRole('ADMIN')")
    public ResponseEntity<Page<ApiAccessLog>> getDeniedLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        return ResponseEntity.ok(apiAccessLogService.getDeniedAccessLogs(page, size));
    }

    /**
     * Get API access logs for a specific user.
     */
    @GetMapping("/logs/user/{username}")
    @PreAuthorize("hasAuthority('SECURITY_AUDIT') or hasRole('ADMIN')")
    public ResponseEntity<Page<ApiAccessLog>> getLogsByUser(
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        return ResponseEntity.ok(apiAccessLogService.getLogsByUser(username, page, size));
    }

    /**
     * Get users with most API accesses.
     */
    @GetMapping("/top-users")
    @PreAuthorize("hasAuthority('SECURITY_AUDIT') or hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getTopUsers(
            @RequestParam(defaultValue = "24") int hours,
            @RequestParam(defaultValue = "10") int limit) {
        
        Instant start = Instant.now().minus(hours, ChronoUnit.HOURS);
        Instant end = Instant.now();
        
        return ResponseEntity.ok(apiAccessLogService.getTopUsersByAccess(start, end, limit));
    }

    /**
     * Get most accessed API endpoints.
     */
    @GetMapping("/top-endpoints")
    @PreAuthorize("hasAuthority('SECURITY_AUDIT') or hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getTopEndpoints(
            @RequestParam(defaultValue = "24") int hours,
            @RequestParam(defaultValue = "10") int limit) {
        
        Instant start = Instant.now().minus(hours, ChronoUnit.HOURS);
        Instant end = Instant.now();
        
        return ResponseEntity.ok(apiAccessLogService.getTopEndpoints(start, end, limit));
    }

    /**
     * Get users who have had access denied (potential security concern).
     */
    @GetMapping("/security-alerts")
    @PreAuthorize("hasAuthority('SECURITY_AUDIT') or hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getSecurityAlerts(
            @RequestParam(defaultValue = "24") int hours,
            @RequestParam(defaultValue = "10") int limit) {
        
        Instant start = Instant.now().minus(hours, ChronoUnit.HOURS);
        Instant end = Instant.now();
        
        return ResponseEntity.ok(apiAccessLogService.getUsersWithDeniedAccess(start, end, limit));
    }

    /**
     * Get hourly distribution of API accesses.
     */
    @GetMapping("/hourly")
    @PreAuthorize("hasAuthority('SECURITY_AUDIT') or hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getHourlyDistribution(
            @RequestParam(defaultValue = "24") int hours) {
        
        Instant start = Instant.now().minus(hours, ChronoUnit.HOURS);
        Instant end = Instant.now();
        
        return ResponseEntity.ok(apiAccessLogService.getHourlyDistribution(start, end));
    }
}
