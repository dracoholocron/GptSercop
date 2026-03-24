package com.globalcmx.api.scheduler.repository;

import com.globalcmx.api.scheduler.entity.ScheduledJobConfigReadModel;
import com.globalcmx.api.scheduler.entity.ScheduledJobConfigReadModel.ExecutionStatus;
import com.globalcmx.api.scheduler.entity.ScheduledJobConfigReadModel.JobType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ScheduledJobConfigRepository extends JpaRepository<ScheduledJobConfigReadModel, Long> {

    Optional<ScheduledJobConfigReadModel> findByCode(String code);

    boolean existsByCode(String code);

    List<ScheduledJobConfigReadModel> findByIsEnabledTrue();

    List<ScheduledJobConfigReadModel> findByIsEnabledTrueAndIsClusterSafeTrue();

    Page<ScheduledJobConfigReadModel> findByIsEnabledTrue(Pageable pageable);

    List<ScheduledJobConfigReadModel> findByJobType(JobType jobType);

    List<ScheduledJobConfigReadModel> findByIsSystemJobTrue();

    List<ScheduledJobConfigReadModel> findByIsSystemJobFalse();

    @Query("SELECT j FROM ScheduledJobConfigReadModel j WHERE j.lastExecutionStatus = :status")
    List<ScheduledJobConfigReadModel> findByLastExecutionStatus(@Param("status") ExecutionStatus status);

    @Query("SELECT j FROM ScheduledJobConfigReadModel j WHERE j.consecutiveFailures >= :threshold")
    List<ScheduledJobConfigReadModel> findJobsExceedingFailureThreshold(@Param("threshold") int threshold);

    @Query("SELECT j FROM ScheduledJobConfigReadModel j WHERE j.nextExecutionAt <= :now AND j.isEnabled = true")
    List<ScheduledJobConfigReadModel> findDueJobs(@Param("now") LocalDateTime now);

    @Query("SELECT j FROM ScheduledJobConfigReadModel j WHERE j.lastExecutionStatus = 'RUNNING'")
    List<ScheduledJobConfigReadModel> findRunningJobs();

    @Modifying(clearAutomatically = true)
    @Transactional("readModelTransactionManager")
    @Query("UPDATE ScheduledJobConfigReadModel j SET j.isEnabled = :enabled, j.updatedBy = :updatedBy, j.updatedAt = CURRENT_TIMESTAMP WHERE j.code = :code")
    int updateEnabledStatus(@Param("code") String code, @Param("enabled") boolean enabled, @Param("updatedBy") String updatedBy);

    @Modifying(clearAutomatically = true)
    @Transactional("readModelTransactionManager")
    @Query("UPDATE ScheduledJobConfigReadModel j SET " +
           "j.lastExecutionStatus = :status, " +
           "j.lastExecutionAt = :executionAt, " +
           "j.nextExecutionAt = :nextExecutionAt " +
           "WHERE j.code = :code")
    int updateExecutionStatus(
        @Param("code") String code,
        @Param("status") ExecutionStatus status,
        @Param("executionAt") LocalDateTime executionAt,
        @Param("nextExecutionAt") LocalDateTime nextExecutionAt
    );

    @Modifying(clearAutomatically = true)
    @Transactional("readModelTransactionManager")
    @Query("UPDATE ScheduledJobConfigReadModel j SET " +
           "j.lastExecutionStatus = 'SUCCESS', " +
           "j.lastExecutionAt = :executionAt, " +
           "j.lastSuccessAt = :executionAt, " +
           "j.nextExecutionAt = :nextExecutionAt, " +
           "j.consecutiveFailures = 0, " +
           "j.totalExecutions = j.totalExecutions + 1, " +
           "j.totalSuccesses = j.totalSuccesses + 1 " +
           "WHERE j.code = :code")
    int recordSuccessfulExecution(
        @Param("code") String code,
        @Param("executionAt") LocalDateTime executionAt,
        @Param("nextExecutionAt") LocalDateTime nextExecutionAt
    );

    @Modifying(clearAutomatically = true)
    @Transactional("readModelTransactionManager")
    @Query("UPDATE ScheduledJobConfigReadModel j SET " +
           "j.lastExecutionStatus = 'FAILED', " +
           "j.lastExecutionAt = :executionAt, " +
           "j.lastFailureAt = :executionAt, " +
           "j.nextExecutionAt = :nextExecutionAt, " +
           "j.consecutiveFailures = j.consecutiveFailures + 1, " +
           "j.totalExecutions = j.totalExecutions + 1, " +
           "j.totalFailures = j.totalFailures + 1 " +
           "WHERE j.code = :code")
    int recordFailedExecution(
        @Param("code") String code,
        @Param("executionAt") LocalDateTime executionAt,
        @Param("nextExecutionAt") LocalDateTime nextExecutionAt
    );

    @Query("SELECT COUNT(j) FROM ScheduledJobConfigReadModel j WHERE j.isEnabled = true")
    long countEnabledJobs();

    @Query("SELECT COUNT(j) FROM ScheduledJobConfigReadModel j WHERE j.lastExecutionStatus = 'RUNNING'")
    long countRunningJobs();

    @Query("SELECT COUNT(j) FROM ScheduledJobConfigReadModel j WHERE j.lastExecutionStatus = 'FAILED'")
    long countFailedJobs();

    @Query("SELECT j.jobType, COUNT(j) FROM ScheduledJobConfigReadModel j GROUP BY j.jobType")
    List<Object[]> countByJobType();

    @Query("SELECT j.lastExecutionStatus, COUNT(j) FROM ScheduledJobConfigReadModel j GROUP BY j.lastExecutionStatus")
    List<Object[]> countByExecutionStatus();

    @Query("SELECT j FROM ScheduledJobConfigReadModel j WHERE " +
           "(:search IS NULL OR LOWER(j.code) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(j.name) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:jobType IS NULL OR j.jobType = :jobType) " +
           "AND (:enabled IS NULL OR j.isEnabled = :enabled)")
    Page<ScheduledJobConfigReadModel> searchJobs(
        @Param("search") String search,
        @Param("jobType") JobType jobType,
        @Param("enabled") Boolean enabled,
        Pageable pageable
    );
}
