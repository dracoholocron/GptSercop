package com.globalcmx.api.alerts.repository;

import com.globalcmx.api.alerts.entity.UserAlertHistoryReadModel;
import com.globalcmx.api.alerts.entity.UserAlertHistoryReadModel.AlertHistoryAction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for alert history entries (audit trail).
 */
@Repository
public interface UserAlertHistoryRepository extends JpaRepository<UserAlertHistoryReadModel, Long> {

    /**
     * Find history by unique historyId
     */
    Optional<UserAlertHistoryReadModel> findByHistoryId(String historyId);

    /**
     * Find all history for an alert, ordered by creation time
     */
    List<UserAlertHistoryReadModel> findByAlertIdOrderByCreatedAtDesc(String alertId);

    /**
     * Find history by action type
     */
    List<UserAlertHistoryReadModel> findByAlertIdAndActionTypeOrderByCreatedAtDesc(
        String alertId, AlertHistoryAction actionType);

    /**
     * Find history for a user's alerts in a time range (for audit reports)
     */
    @Query("SELECT h FROM UserAlertHistoryReadModel h " +
           "JOIN UserAlertReadModel a ON h.alertId = a.alertId " +
           "WHERE a.userId = :userId " +
           "AND h.createdAt BETWEEN :startDate AND :endDate " +
           "ORDER BY h.createdAt DESC")
    Page<UserAlertHistoryReadModel> findUserAlertHistory(
        @Param("userId") String userId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        Pageable pageable
    );

    /**
     * Find all history entries by user who made the change
     */
    Page<UserAlertHistoryReadModel> findByCreatedByOrderByCreatedAtDesc(
        String createdBy, Pageable pageable);

    /**
     * Count actions by type for analytics
     */
    @Query("SELECT h.actionType, COUNT(h) FROM UserAlertHistoryReadModel h " +
           "WHERE h.createdAt BETWEEN :startDate AND :endDate " +
           "GROUP BY h.actionType")
    List<Object[]> countActionsByType(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Find reschedule history for an alert
     */
    @Query("SELECT h FROM UserAlertHistoryReadModel h " +
           "WHERE h.alertId = :alertId " +
           "AND h.actionType = 'RESCHEDULED' " +
           "ORDER BY h.createdAt DESC")
    List<UserAlertHistoryReadModel> findRescheduleHistory(@Param("alertId") String alertId);

    /**
     * Delete all history for an alert (when alert is permanently deleted)
     */
    void deleteByAlertId(String alertId);
}
