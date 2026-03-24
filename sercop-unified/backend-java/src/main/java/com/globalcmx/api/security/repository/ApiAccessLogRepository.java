package com.globalcmx.api.security.repository;

import com.globalcmx.api.security.entity.ApiAccessLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

/**
 * Repository for API access logs.
 * Provides queries for monitoring and dashboard analytics.
 */
@Repository
public interface ApiAccessLogRepository extends JpaRepository<ApiAccessLog, Long> {

    // Find logs by username
    Page<ApiAccessLog> findByUsernameOrderByAccessedAtDesc(String username, Pageable pageable);

    // Find logs by endpoint
    Page<ApiAccessLog> findByHttpMethodAndUrlPatternContainingOrderByAccessedAtDesc(
            String httpMethod, String urlPattern, Pageable pageable);

    // Find access denied logs
    Page<ApiAccessLog> findByAccessGrantedFalseOrderByAccessedAtDesc(Pageable pageable);

    // Find logs within date range
    Page<ApiAccessLog> findByAccessedAtBetweenOrderByAccessedAtDesc(
            Instant start, Instant end, Pageable pageable);

    // Count accesses by user in time range
    @Query("SELECT l.username, COUNT(l) FROM ApiAccessLog l " +
           "WHERE l.accessedAt BETWEEN :start AND :end " +
           "GROUP BY l.username ORDER BY COUNT(l) DESC")
    List<Object[]> countAccessesByUser(@Param("start") Instant start, @Param("end") Instant end);

    // Count accesses by endpoint in time range
    @Query("SELECT l.httpMethod, l.urlPattern, COUNT(l) FROM ApiAccessLog l " +
           "WHERE l.accessedAt BETWEEN :start AND :end " +
           "GROUP BY l.httpMethod, l.urlPattern ORDER BY COUNT(l) DESC")
    List<Object[]> countAccessesByEndpoint(@Param("start") Instant start, @Param("end") Instant end);

    // Count denied accesses by user
    @Query("SELECT l.username, COUNT(l) FROM ApiAccessLog l " +
           "WHERE l.accessGranted = false " +
           "AND l.accessedAt BETWEEN :start AND :end " +
           "GROUP BY l.username ORDER BY COUNT(l) DESC")
    List<Object[]> countDeniedByUser(@Param("start") Instant start, @Param("end") Instant end);

    // Get access statistics
    @Query("SELECT " +
           "COUNT(l), " +
           "SUM(CASE WHEN l.accessGranted = true THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN l.accessGranted = false THEN 1 ELSE 0 END), " +
           "AVG(l.responseTimeMs) " +
           "FROM ApiAccessLog l " +
           "WHERE l.accessedAt BETWEEN :start AND :end")
    Object[] getAccessStatistics(@Param("start") Instant start, @Param("end") Instant end);

    // Get hourly access counts for a day
    @Query(value = "SELECT HOUR(accessed_at) as hour, COUNT(*) as count " +
           "FROM api_access_log " +
           "WHERE accessed_at BETWEEN :start AND :end " +
           "GROUP BY HOUR(accessed_at) " +
           "ORDER BY hour", nativeQuery = true)
    List<Object[]> getHourlyAccessCounts(@Param("start") Instant start, @Param("end") Instant end);

    // Delete old logs (for cleanup)
    void deleteByAccessedAtBefore(Instant cutoff);
}
