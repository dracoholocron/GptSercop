package com.globalcmx.api.externalapi.repository;

import com.globalcmx.api.externalapi.entity.ExternalApiListenerExecutionLog;
import com.globalcmx.api.externalapi.entity.ExternalApiListenerExecutionLog.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ExternalApiListenerExecutionLogRepository extends JpaRepository<ExternalApiListenerExecutionLog, Long> {

    /**
     * Find all execution logs for a specific API call
     */
    List<ExternalApiListenerExecutionLog> findByApiCallLogIdOrderByCreatedAtAsc(Long apiCallLogId);

    /**
     * Find all execution logs for a specific call ID
     */
    List<ExternalApiListenerExecutionLog> findByCallIdOrderByCreatedAtAsc(String callId);

    /**
     * Find all execution logs for a specific listener
     */
    Page<ExternalApiListenerExecutionLog> findByListenerIdOrderByCreatedAtDesc(Long listenerId, Pageable pageable);

    /**
     * Find execution logs by status
     */
    List<ExternalApiListenerExecutionLog> findByStatus(Status status);

    /**
     * Find failed executions that can be retried
     */
    @Query("SELECT e FROM ExternalApiListenerExecutionLog e WHERE e.status = 'FAILED' AND e.retryCount < :maxRetries AND e.createdAt > :since")
    List<ExternalApiListenerExecutionLog> findRetryableExecutions(int maxRetries, LocalDateTime since);

    /**
     * Count executions by status for a listener
     */
    long countByListenerIdAndStatus(Long listenerId, Status status);

    /**
     * Delete old execution logs
     */
    void deleteByCreatedAtBefore(LocalDateTime before);
}
