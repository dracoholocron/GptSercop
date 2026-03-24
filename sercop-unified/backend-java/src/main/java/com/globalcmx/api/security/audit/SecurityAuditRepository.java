package com.globalcmx.api.security.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

/**
 * Repository for security audit events.
 */
@Repository
public interface SecurityAuditRepository extends JpaRepository<SecurityAuditEvent, Long> {

    Page<SecurityAuditEvent> findByUsername(String username, Pageable pageable);

    Page<SecurityAuditEvent> findByEventType(SecurityAuditEvent.EventType eventType, Pageable pageable);

    Page<SecurityAuditEvent> findBySeverity(SecurityAuditEvent.Severity severity, Pageable pageable);

    Page<SecurityAuditEvent> findByTimestampBetween(Instant start, Instant end, Pageable pageable);

    @Query("SELECT e FROM SecurityAuditEvent e WHERE e.username = :username AND e.timestamp > :since ORDER BY e.timestamp DESC")
    List<SecurityAuditEvent> findRecentByUsername(@Param("username") String username, @Param("since") Instant since);

    @Query("SELECT e FROM SecurityAuditEvent e WHERE e.ipAddress = :ipAddress AND e.timestamp > :since")
    List<SecurityAuditEvent> findRecentByIpAddress(@Param("ipAddress") String ipAddress, @Param("since") Instant since);

    // Security monitoring queries
    @Query("SELECT COUNT(e) FROM SecurityAuditEvent e WHERE e.eventType = 'LOGIN_FAILURE' AND e.username = :username AND e.timestamp > :since")
    long countFailedLogins(@Param("username") String username, @Param("since") Instant since);

    @Query("SELECT COUNT(e) FROM SecurityAuditEvent e WHERE e.eventType = 'LOGIN_FAILURE' AND e.ipAddress = :ipAddress AND e.timestamp > :since")
    long countFailedLoginsByIp(@Param("ipAddress") String ipAddress, @Param("since") Instant since);

    @Query("SELECT COUNT(e) FROM SecurityAuditEvent e WHERE e.eventType = 'PERMISSION_DENIED' AND e.username = :username AND e.timestamp > :since")
    long countPermissionDenials(@Param("username") String username, @Param("since") Instant since);

    @Query("SELECT e FROM SecurityAuditEvent e WHERE e.severity = 'CRITICAL' AND e.timestamp > :since ORDER BY e.timestamp DESC")
    List<SecurityAuditEvent> findRecentCriticalEvents(@Param("since") Instant since);

    @Query("SELECT e FROM SecurityAuditEvent e WHERE e.severity IN ('CRITICAL', 'WARNING') AND e.timestamp > :since ORDER BY e.timestamp DESC")
    Page<SecurityAuditEvent> findSecurityAlerts(@Param("since") Instant since, Pageable pageable);

    // Statistics queries
    @Query("SELECT e.eventType, COUNT(e) FROM SecurityAuditEvent e WHERE e.timestamp > :since GROUP BY e.eventType")
    List<Object[]> countByEventType(@Param("since") Instant since);

    @Query("SELECT e.username, COUNT(e) FROM SecurityAuditEvent e WHERE e.eventType = 'PERMISSION_DENIED' AND e.timestamp > :since GROUP BY e.username ORDER BY COUNT(e) DESC")
    List<Object[]> findUsersWithMostDenials(@Param("since") Instant since, Pageable pageable);

    // Cleanup old events
    void deleteByTimestampBefore(Instant before);
}
