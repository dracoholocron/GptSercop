package com.globalcmx.api.scheduler.repository;

import com.globalcmx.api.scheduler.entity.ScheduledJobDeadLetter;
import com.globalcmx.api.scheduler.entity.ScheduledJobDeadLetter.Status;
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
public interface ScheduledJobDeadLetterRepository extends JpaRepository<ScheduledJobDeadLetter, Long> {

    Optional<ScheduledJobDeadLetter> findByOriginalExecutionId(String originalExecutionId);

    List<ScheduledJobDeadLetter> findByJobCode(String jobCode);

    Page<ScheduledJobDeadLetter> findByJobCode(String jobCode, Pageable pageable);

    List<ScheduledJobDeadLetter> findByStatus(Status status);

    Page<ScheduledJobDeadLetter> findByStatus(Status status, Pageable pageable);

    @Query("SELECT d FROM ScheduledJobDeadLetter d WHERE d.status = 'PENDING' ORDER BY d.createdAt DESC")
    List<ScheduledJobDeadLetter> findPendingItems();

    @Query("SELECT d FROM ScheduledJobDeadLetter d WHERE d.status = 'PENDING' ORDER BY d.createdAt DESC")
    Page<ScheduledJobDeadLetter> findPendingItems(Pageable pageable);

    @Query("SELECT d FROM ScheduledJobDeadLetter d WHERE d.status IN ('PENDING', 'RETRYING')")
    List<ScheduledJobDeadLetter> findUnresolvedItems();

    @Query("SELECT d FROM ScheduledJobDeadLetter d WHERE d.status = 'RETRYING' AND d.lastRetryAt < :threshold")
    List<ScheduledJobDeadLetter> findStuckRetries(@Param("threshold") LocalDateTime threshold);

    @Modifying
    @Query("UPDATE ScheduledJobDeadLetter d SET " +
           "d.status = 'RETRYING', " +
           "d.lastRetryAt = CURRENT_TIMESTAMP, " +
           "d.retryCount = d.retryCount + 1, " +
           "d.updatedAt = CURRENT_TIMESTAMP " +
           "WHERE d.id = :id")
    int markAsRetrying(@Param("id") Long id);

    @Modifying
    @Query("UPDATE ScheduledJobDeadLetter d SET " +
           "d.status = 'RESOLVED', " +
           "d.resolvedAt = CURRENT_TIMESTAMP, " +
           "d.resolvedBy = :resolvedBy, " +
           "d.resolutionNotes = :notes, " +
           "d.updatedAt = CURRENT_TIMESTAMP " +
           "WHERE d.id = :id")
    int markAsResolved(@Param("id") Long id, @Param("resolvedBy") String resolvedBy, @Param("notes") String notes);

    @Modifying
    @Query("UPDATE ScheduledJobDeadLetter d SET " +
           "d.status = 'ABANDONED', " +
           "d.resolvedAt = CURRENT_TIMESTAMP, " +
           "d.resolvedBy = :abandonedBy, " +
           "d.resolutionNotes = :notes, " +
           "d.updatedAt = CURRENT_TIMESTAMP " +
           "WHERE d.id = :id")
    int markAsAbandoned(@Param("id") Long id, @Param("abandonedBy") String abandonedBy, @Param("notes") String notes);

    // Statistics
    @Query("SELECT d.status, COUNT(d) FROM ScheduledJobDeadLetter d GROUP BY d.status")
    List<Object[]> countByStatus();

    @Query("SELECT d.jobCode, COUNT(d) FROM ScheduledJobDeadLetter d WHERE d.status IN ('PENDING', 'RETRYING') GROUP BY d.jobCode ORDER BY COUNT(d) DESC")
    List<Object[]> countUnresolvedByJobCode();

    @Query("SELECT COUNT(d) FROM ScheduledJobDeadLetter d WHERE d.status = 'PENDING'")
    long countPending();

    @Query("SELECT COUNT(d) FROM ScheduledJobDeadLetter d WHERE d.status IN ('PENDING', 'RETRYING')")
    long countUnresolved();

    @Query("SELECT d FROM ScheduledJobDeadLetter d WHERE " +
           "(:jobCode IS NULL OR d.jobCode = :jobCode) " +
           "AND (:status IS NULL OR d.status = :status) " +
           "ORDER BY d.createdAt DESC")
    Page<ScheduledJobDeadLetter> searchDeadLetters(
        @Param("jobCode") String jobCode,
        @Param("status") Status status,
        Pageable pageable
    );

    // Cleanup
    @Modifying
    @Query("DELETE FROM ScheduledJobDeadLetter d WHERE d.status IN ('RESOLVED', 'ABANDONED') AND d.resolvedAt < :before")
    int deleteResolvedOlderThan(@Param("before") LocalDateTime before);
}
