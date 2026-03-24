package com.globalcmx.api.alerts.repository;

import com.globalcmx.api.alerts.entity.UserAlertReadModel;
import com.globalcmx.api.alerts.entity.UserAlertReadModel.AlertStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository for user alerts with agenda-optimized queries.
 */
@Repository
public interface UserAlertRepository extends JpaRepository<UserAlertReadModel, Long> {

    /**
     * Find alert by unique alertId
     */
    Optional<UserAlertReadModel> findByAlertId(String alertId);

    /**
     * Find all alerts for a user within a date range (for agenda view)
     */
    @Query("SELECT a FROM UserAlertReadModel a " +
           "WHERE a.userId = :userId " +
           "AND a.scheduledDate BETWEEN :startDate AND :endDate " +
           "AND a.status NOT IN ('CANCELLED') " +
           "ORDER BY a.scheduledDate, a.scheduledTime, a.priority DESC")
    List<UserAlertReadModel> findByUserIdAndDateRange(
        @Param("userId") String userId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    /**
     * Find alerts for today
     */
    @Query("SELECT a FROM UserAlertReadModel a " +
           "WHERE a.userId = :userId " +
           "AND a.scheduledDate = :today " +
           "AND a.status NOT IN ('CANCELLED', 'COMPLETED') " +
           "ORDER BY a.scheduledTime, a.priority DESC")
    List<UserAlertReadModel> findTodayAlerts(
        @Param("userId") String userId,
        @Param("today") LocalDate today
    );

    /**
     * Find upcoming alerts (next N days)
     */
    @Query("SELECT a FROM UserAlertReadModel a " +
           "WHERE a.userId = :userId " +
           "AND a.scheduledDate BETWEEN :today AND :endDate " +
           "AND a.status NOT IN ('CANCELLED', 'COMPLETED') " +
           "ORDER BY a.scheduledDate, a.scheduledTime, a.priority DESC")
    List<UserAlertReadModel> findUpcomingAlerts(
        @Param("userId") String userId,
        @Param("today") LocalDate today,
        @Param("endDate") LocalDate endDate
    );

    /**
     * Find overdue alerts
     */
    @Query("SELECT a FROM UserAlertReadModel a " +
           "WHERE a.userId = :userId " +
           "AND a.scheduledDate < :today " +
           "AND a.status NOT IN ('CANCELLED', 'COMPLETED') " +
           "ORDER BY a.scheduledDate DESC, a.priority DESC")
    List<UserAlertReadModel> findOverdueAlerts(
        @Param("userId") String userId,
        @Param("today") LocalDate today
    );

    /**
     * Find alerts by status
     */
    List<UserAlertReadModel> findByUserIdAndStatusOrderByScheduledDateAsc(String userId, AlertStatus status);

    /**
     * Find alerts by operation
     */
    List<UserAlertReadModel> findByOperationIdOrderByScheduledDateAsc(String operationId);

    /**
     * Find alerts by client
     */
    List<UserAlertReadModel> findByClientIdOrderByScheduledDateAsc(String clientId);

    /**
     * Find alerts by source
     */
    List<UserAlertReadModel> findBySourceTypeAndSourceIdOrderByScheduledDateAsc(
        UserAlertReadModel.AlertSourceType sourceType, String sourceId);

    /**
     * Count pending alerts for user
     */
    @Query("SELECT COUNT(a) FROM UserAlertReadModel a " +
           "WHERE a.userId = :userId " +
           "AND a.status IN ('PENDING', 'IN_PROGRESS')")
    long countPendingAlerts(@Param("userId") String userId);

    /**
     * Count overdue alerts for user
     */
    @Query("SELECT COUNT(a) FROM UserAlertReadModel a " +
           "WHERE a.userId = :userId " +
           "AND a.scheduledDate < :today " +
           "AND a.status NOT IN ('CANCELLED', 'COMPLETED')")
    long countOverdueAlerts(@Param("userId") String userId, @Param("today") LocalDate today);

    /**
     * Count alerts by date for calendar display
     */
    @Query("SELECT a.scheduledDate, COUNT(a) FROM UserAlertReadModel a " +
           "WHERE a.userId = :userId " +
           "AND a.scheduledDate BETWEEN :startDate AND :endDate " +
           "AND a.status NOT IN ('CANCELLED') " +
           "GROUP BY a.scheduledDate")
    List<Object[]> countAlertsByDate(
        @Param("userId") String userId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    /**
     * Search alerts by title or description
     */
    @Query("SELECT a FROM UserAlertReadModel a " +
           "WHERE a.userId = :userId " +
           "AND (LOWER(a.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "     OR LOWER(a.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "     OR LOWER(a.clientName) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "ORDER BY a.scheduledDate DESC")
    Page<UserAlertReadModel> searchAlerts(
        @Param("userId") String userId,
        @Param("searchTerm") String searchTerm,
        Pageable pageable
    );

    /**
     * Find all alerts for multiple users (for managers/admins)
     */
    @Query("SELECT a FROM UserAlertReadModel a " +
           "WHERE a.userId IN :userIds " +
           "AND a.scheduledDate BETWEEN :startDate AND :endDate " +
           "AND a.status NOT IN ('CANCELLED') " +
           "ORDER BY a.scheduledDate, a.userId")
    List<UserAlertReadModel> findByUsersAndDateRange(
        @Param("userIds") List<String> userIds,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    /**
     * Check if alert exists
     */
    boolean existsByAlertId(String alertId);

    // ==================== ADVANCED SEARCH QUERIES ====================

    /**
     * Find alerts assigned BY a user (created by them for others)
     */
    @Query("SELECT a FROM UserAlertReadModel a " +
           "WHERE a.assignedBy = :userId " +
           "AND a.scheduledDate BETWEEN :startDate AND :endDate " +
           "ORDER BY a.scheduledDate DESC, a.scheduledTime DESC")
    List<UserAlertReadModel> findAssignedByUser(
        @Param("userId") String userId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    /**
     * Find alerts assigned BY a user with pagination
     */
    @Query("SELECT a FROM UserAlertReadModel a " +
           "WHERE a.assignedBy = :userId " +
           "AND a.status NOT IN ('CANCELLED') " +
           "ORDER BY a.scheduledDate DESC, a.scheduledTime DESC")
    Page<UserAlertReadModel> findAssignedByUserPaged(
        @Param("userId") String userId,
        Pageable pageable
    );

    /**
     * Find all alerts (for supervisors/admins)
     */
    @Query("SELECT a FROM UserAlertReadModel a " +
           "WHERE a.scheduledDate BETWEEN :startDate AND :endDate " +
           "AND a.status NOT IN ('CANCELLED') " +
           "ORDER BY a.scheduledDate DESC, a.scheduledTime DESC")
    List<UserAlertReadModel> findAllAlerts(
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    /**
     * Find all alerts with pagination (for supervisors/admins)
     */
    @Query("SELECT a FROM UserAlertReadModel a " +
           "WHERE a.status NOT IN ('CANCELLED') " +
           "ORDER BY a.scheduledDate DESC, a.scheduledTime DESC")
    Page<UserAlertReadModel> findAllAlertsPaged(Pageable pageable);

    /**
     * Advanced search with multiple filters
     */
    @Query("SELECT a FROM UserAlertReadModel a WHERE " +
           "(:userId IS NULL OR a.userId = :userId) AND " +
           "(:assignedBy IS NULL OR a.assignedBy = :assignedBy) AND " +
           "(:status IS NULL OR a.status = :status) AND " +
           "(:alertType IS NULL OR a.alertType = :alertType) AND " +
           "(:priority IS NULL OR a.priority = :priority) AND " +
           "(:startDate IS NULL OR a.scheduledDate >= :startDate) AND " +
           "(:endDate IS NULL OR a.scheduledDate <= :endDate) AND " +
           "(:clientId IS NULL OR a.clientId = :clientId) AND " +
           "(:operationId IS NULL OR a.operationId = :operationId) AND " +
           "(:excludeCompleted = false OR a.status <> 'COMPLETED') AND " +
           "a.status NOT IN ('CANCELLED') " +
           "ORDER BY a.scheduledDate DESC, a.scheduledTime DESC")
    Page<UserAlertReadModel> findWithFilters(
        @Param("userId") String userId,
        @Param("assignedBy") String assignedBy,
        @Param("status") AlertStatus status,
        @Param("alertType") UserAlertReadModel.AlertType alertType,
        @Param("priority") UserAlertReadModel.AlertPriority priority,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        @Param("clientId") String clientId,
        @Param("operationId") String operationId,
        @Param("excludeCompleted") boolean excludeCompleted,
        Pageable pageable
    );

    /**
     * Search with text and filters (supports both userId and assignedBy)
     */
    @Query("SELECT a FROM UserAlertReadModel a WHERE " +
           "(:userId IS NULL OR a.userId = :userId) AND " +
           "(:assignedBy IS NULL OR a.assignedBy = :assignedBy) AND " +
           "(LOWER(a.title) LIKE LOWER(CONCAT('%', :searchText, '%')) " +
           " OR LOWER(a.description) LIKE LOWER(CONCAT('%', :searchText, '%')) " +
           " OR LOWER(a.clientName) LIKE LOWER(CONCAT('%', :searchText, '%'))) AND " +
           "(:excludeCompleted = false OR a.status <> 'COMPLETED') AND " +
           "a.status NOT IN ('CANCELLED') " +
           "ORDER BY a.scheduledDate DESC")
    Page<UserAlertReadModel> searchWithText(
        @Param("userId") String userId,
        @Param("assignedBy") String assignedBy,
        @Param("searchText") String searchText,
        @Param("excludeCompleted") boolean excludeCompleted,
        Pageable pageable
    );

    /**
     * Count alerts by assignedBy
     */
    @Query("SELECT COUNT(a) FROM UserAlertReadModel a " +
           "WHERE a.assignedBy = :userId " +
           "AND a.status NOT IN ('CANCELLED', 'COMPLETED')")
    long countAssignedByUser(@Param("userId") String userId);

    /**
     * Find active alerts for an operation with dynamic date reference (for recalculation)
     */
    @Query("SELECT a FROM UserAlertReadModel a WHERE " +
           "a.operationId = :operationId AND " +
           "a.status IN :statuses AND " +
           "a.dueDateReference IS NOT NULL " +
           "ORDER BY a.scheduledDate ASC")
    List<UserAlertReadModel> findByOperationIdAndStatusIn(
        @Param("operationId") String operationId,
        @Param("statuses") List<AlertStatus> statuses
    );

    /**
     * Find alerts with specific tag (using JSON contains)
     * Note: For MySQL JSON column, we use LIKE for simplicity
     */
    @Query("SELECT a FROM UserAlertReadModel a WHERE " +
           "a.userId = :userId AND " +
           "a.tags LIKE CONCAT('%\"', :tag, '\"%') AND " +
           "a.status NOT IN ('CANCELLED') " +
           "ORDER BY a.scheduledDate DESC")
    List<UserAlertReadModel> findByUserIdAndTag(
        @Param("userId") String userId,
        @Param("tag") String tag
    );
}
