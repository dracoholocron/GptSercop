package com.globalcmx.api.email.repository;

import com.globalcmx.api.email.entity.EmailQueue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmailQueueRepository extends JpaRepository<EmailQueue, Long> {
    Optional<EmailQueue> findByUuid(String uuid);
    Page<EmailQueue> findByTenantId(String tenantId, Pageable pageable);
    Page<EmailQueue> findByStatus(EmailQueue.Status status, Pageable pageable);

    @Query("SELECT e FROM EmailQueue e WHERE e.status = :status AND (e.scheduledAt IS NULL OR e.scheduledAt <= :now) ORDER BY e.priority DESC, e.createdAt ASC")
    List<EmailQueue> findPendingEmails(@Param("status") EmailQueue.Status status, @Param("now") LocalDateTime now, Pageable pageable);

    @Query("SELECT e FROM EmailQueue e WHERE e.status = 'RETRY' AND e.nextRetryAt <= :now ORDER BY e.priority DESC")
    List<EmailQueue> findEmailsToRetry(@Param("now") LocalDateTime now);

    List<EmailQueue> findByReferenceTypeAndReferenceId(String referenceType, String referenceId);

    @Query("SELECT e.status, COUNT(e) FROM EmailQueue e GROUP BY e.status")
    List<Object[]> getStatusCounts();
}
