package com.globalcmx.api.security.service;

import com.globalcmx.api.security.entity.ApiAccessLog;
import com.globalcmx.api.security.repository.ApiAccessLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for managing API access logs.
 * Provides async logging and analytics queries.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ApiAccessLogService {

    private final ApiAccessLogRepository repository;

    /**
     * Log an API access asynchronously to not impact response time.
     */
    @Async
    @Transactional
    public void logAccess(ApiAccessLog accessLog) {
        try {
            repository.save(accessLog);
        } catch (Exception e) {
            log.error("Failed to log API access: {}", e.getMessage());
        }
    }

    /**
     * Get recent access logs with pagination.
     */
    @Transactional(readOnly = true)
    public Page<ApiAccessLog> getRecentLogs(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Instant start = Instant.now().minus(24, ChronoUnit.HOURS);
        return repository.findByAccessedAtBetweenOrderByAccessedAtDesc(start, Instant.now(), pageable);
    }

    /**
     * Get logs by username.
     */
    @Transactional(readOnly = true)
    public Page<ApiAccessLog> getLogsByUser(String username, int page, int size) {
        return repository.findByUsernameOrderByAccessedAtDesc(username, PageRequest.of(page, size));
    }

    /**
     * Get access denied logs.
     */
    @Transactional(readOnly = true)
    public Page<ApiAccessLog> getDeniedAccessLogs(int page, int size) {
        return repository.findByAccessGrantedFalseOrderByAccessedAtDesc(PageRequest.of(page, size));
    }

    /**
     * Get access statistics for a time period.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getStatistics(Instant start, Instant end) {
        Object[] stats = repository.getAccessStatistics(start, end);
        
        if (stats == null || stats[0] == null) {
            return Map.of(
                "totalRequests", 0L,
                "grantedRequests", 0L,
                "deniedRequests", 0L,
                "avgResponseTimeMs", 0.0
            );
        }

        return Map.of(
            "totalRequests", ((Number) stats[0]).longValue(),
            "grantedRequests", stats[1] != null ? ((Number) stats[1]).longValue() : 0L,
            "deniedRequests", stats[2] != null ? ((Number) stats[2]).longValue() : 0L,
            "avgResponseTimeMs", stats[3] != null ? ((Number) stats[3]).doubleValue() : 0.0
        );
    }

    /**
     * Get top users by access count.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTopUsersByAccess(Instant start, Instant end, int limit) {
        return repository.countAccessesByUser(start, end).stream()
            .limit(limit)
            .map(row -> Map.<String, Object>of(
                "username", row[0],
                "count", ((Number) row[1]).longValue()
            ))
            .collect(Collectors.toList());
    }

    /**
     * Get top endpoints by access count.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTopEndpoints(Instant start, Instant end, int limit) {
        return repository.countAccessesByEndpoint(start, end).stream()
            .limit(limit)
            .map(row -> Map.<String, Object>of(
                "method", row[0],
                "pattern", row[1],
                "count", ((Number) row[2]).longValue()
            ))
            .collect(Collectors.toList());
    }

    /**
     * Get users with most denied accesses (security concern).
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getUsersWithDeniedAccess(Instant start, Instant end, int limit) {
        return repository.countDeniedByUser(start, end).stream()
            .limit(limit)
            .map(row -> Map.<String, Object>of(
                "username", row[0],
                "deniedCount", ((Number) row[1]).longValue()
            ))
            .collect(Collectors.toList());
    }

    /**
     * Get hourly access distribution.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getHourlyDistribution(Instant start, Instant end) {
        return repository.getHourlyAccessCounts(start, end).stream()
            .map(row -> Map.<String, Object>of(
                "hour", ((Number) row[0]).intValue(),
                "count", ((Number) row[1]).longValue()
            ))
            .collect(Collectors.toList());
    }

    /**
     * Cleanup old logs (runs daily at 2 AM).
     * Keeps logs for 90 days by default.
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupOldLogs() {
        Instant cutoff = Instant.now().minus(90, ChronoUnit.DAYS);
        repository.deleteByAccessedAtBefore(cutoff);
        log.info("Cleaned up API access logs older than {}", cutoff);
    }
}
