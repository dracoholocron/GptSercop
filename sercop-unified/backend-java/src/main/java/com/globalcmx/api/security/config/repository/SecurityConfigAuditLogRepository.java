package com.globalcmx.api.security.config.repository;

import com.globalcmx.api.security.config.entity.SecurityConfigAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SecurityConfigAuditLogRepository extends JpaRepository<SecurityConfigAuditLog, Long> {

    Page<SecurityConfigAuditLog> findAllByOrderByChangedAtDesc(Pageable pageable);

    List<SecurityConfigAuditLog> findByConfigTypeOrderByChangedAtDesc(String configType);

    List<SecurityConfigAuditLog> findByChangedByOrderByChangedAtDesc(String changedBy);

    @Query("SELECT a FROM SecurityConfigAuditLog a WHERE a.changedAt BETWEEN :start AND :end ORDER BY a.changedAt DESC")
    List<SecurityConfigAuditLog> findByDateRange(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT a FROM SecurityConfigAuditLog a WHERE a.configType = :type AND a.configKey = :key ORDER BY a.changedAt DESC")
    List<SecurityConfigAuditLog> findByConfigTypeAndKey(
            @Param("type") String configType,
            @Param("key") String configKey);
}
