package com.globalcmx.api.scheduler.repository;

import com.globalcmx.api.scheduler.entity.ScheduledJobExecutionLog;
import com.globalcmx.api.scheduler.entity.ScheduledJobExecutionLog.Status;
import com.globalcmx.api.scheduler.entity.ScheduledJobExecutionLog.TriggerType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ScheduledJobExecutionLogRepository extends JpaRepository<ScheduledJobExecutionLog, Long> {

    Optional<ScheduledJobExecutionLog> findByExecutionId(String executionId);

    Page<ScheduledJobExecutionLog> findByJobCode(String jobCode, Pageable pageable);

    Page<ScheduledJobExecutionLog> findByJobCodeOrderByStartedAtDesc(String jobCode, Pageable pageable);

    List<ScheduledJobExecutionLog> findByJobCodeAndStatus(String jobCode, Status status);

    Page<ScheduledJobExecutionLog> findByStatus(Status status, Pageable pageable);

    List<ScheduledJobExecutionLog> findByStatusIn(List<Status> statuses);

    @Query("SELECT e FROM ScheduledJobExecutionLog e WHERE e.status = 'RUNNING'")
    List<ScheduledJobExecutionLog> findRunningExecutions();

    @Query("SELECT e FROM ScheduledJobExecutionLog e WHERE e.status = 'RUNNING' AND e.startedAt < :threshold")
    List<ScheduledJobExecutionLog> findStuckExecutions(@Param("threshold") LocalDateTime threshold);

    @Query("SELECT e FROM ScheduledJobExecutionLog e WHERE e.jobCode = :jobCode ORDER BY e.startedAt DESC LIMIT 1")
    Optional<ScheduledJobExecutionLog> findLatestExecution(@Param("jobCode") String jobCode);

    @Query("SELECT e FROM ScheduledJobExecutionLog e WHERE e.jobCode = :jobCode AND e.status = 'SUCCESS' ORDER BY e.startedAt DESC LIMIT 1")
    Optional<ScheduledJobExecutionLog> findLatestSuccessfulExecution(@Param("jobCode") String jobCode);

    List<ScheduledJobExecutionLog> findByTriggeredBy(TriggerType triggeredBy);

    Page<ScheduledJobExecutionLog> findByTriggeredByUser(String triggeredByUser, Pageable pageable);

    @Query("SELECT e FROM ScheduledJobExecutionLog e WHERE e.startedAt BETWEEN :from AND :to")
    Page<ScheduledJobExecutionLog> findByDateRange(
        @Param("from") LocalDateTime from,
        @Param("to") LocalDateTime to,
        Pageable pageable
    );

    @Query("SELECT e FROM ScheduledJobExecutionLog e WHERE e.jobCode = :jobCode AND e.startedAt BETWEEN :from AND :to")
    List<ScheduledJobExecutionLog> findByJobCodeAndDateRange(
        @Param("jobCode") String jobCode,
        @Param("from") LocalDateTime from,
        @Param("to") LocalDateTime to
    );

    @Modifying
    @Query("UPDATE ScheduledJobExecutionLog e SET " +
           "e.status = :status, " +
           "e.completedAt = :completedAt, " +
           "e.durationMs = :durationMs, " +
           "e.resultSummary = :resultSummary " +
           "WHERE e.executionId = :executionId")
    int updateExecutionResult(
        @Param("executionId") String executionId,
        @Param("status") Status status,
        @Param("completedAt") LocalDateTime completedAt,
        @Param("durationMs") Long durationMs,
        @Param("resultSummary") String resultSummary
    );

    @Modifying
    @Query("UPDATE ScheduledJobExecutionLog e SET " +
           "e.status = 'FAILED', " +
           "e.completedAt = :completedAt, " +
           "e.durationMs = :durationMs, " +
           "e.errorMessage = :errorMessage, " +
           "e.errorStackTrace = :errorStackTrace " +
           "WHERE e.executionId = :executionId")
    int updateExecutionFailure(
        @Param("executionId") String executionId,
        @Param("completedAt") LocalDateTime completedAt,
        @Param("durationMs") Long durationMs,
        @Param("errorMessage") String errorMessage,
        @Param("errorStackTrace") String errorStackTrace
    );

    // Statistics queries
    @Query("SELECT e.status, COUNT(e) FROM ScheduledJobExecutionLog e GROUP BY e.status")
    List<Object[]> countByStatus();

    @Query("SELECT e.status, COUNT(e) FROM ScheduledJobExecutionLog e WHERE e.jobCode = :jobCode GROUP BY e.status")
    List<Object[]> countByStatusForJob(@Param("jobCode") String jobCode);

    @Query("SELECT e.jobCode, COUNT(e) FROM ScheduledJobExecutionLog e WHERE e.startedAt >= :since GROUP BY e.jobCode ORDER BY COUNT(e) DESC")
    List<Object[]> countExecutionsByJobSince(@Param("since") LocalDateTime since);

    @Query("SELECT AVG(e.durationMs) FROM ScheduledJobExecutionLog e WHERE e.jobCode = :jobCode AND e.status = 'SUCCESS'")
    Double getAverageDuration(@Param("jobCode") String jobCode);

    @Query("SELECT AVG(e.durationMs) FROM ScheduledJobExecutionLog e WHERE e.jobCode = :jobCode AND e.status = 'SUCCESS' AND e.startedAt >= :since")
    Double getAverageDurationSince(@Param("jobCode") String jobCode, @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(e) FROM ScheduledJobExecutionLog e WHERE e.startedAt >= :since")
    long countExecutionsSince(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(e) FROM ScheduledJobExecutionLog e WHERE e.status = :status AND e.startedAt >= :since")
    long countExecutionsByStatusSince(@Param("status") Status status, @Param("since") LocalDateTime since);

    @Query("SELECT e FROM ScheduledJobExecutionLog e WHERE " +
           "(:jobCode IS NULL OR e.jobCode = :jobCode) " +
           "AND (:status IS NULL OR e.status = :status) " +
           "AND (:from IS NULL OR e.startedAt >= :from) " +
           "AND (:to IS NULL OR e.startedAt <= :to) " +
           "ORDER BY e.startedAt DESC")
    Page<ScheduledJobExecutionLog> searchExecutions(
        @Param("jobCode") String jobCode,
        @Param("status") Status status,
        @Param("from") LocalDateTime from,
        @Param("to") LocalDateTime to,
        Pageable pageable
    );

    // Cleanup old executions
    @Modifying
    @Query("DELETE FROM ScheduledJobExecutionLog e WHERE e.startedAt < :before")
    int deleteOlderThan(@Param("before") LocalDateTime before);
}
