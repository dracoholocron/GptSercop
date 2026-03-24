package com.globalcmx.api.email.repository;

import com.globalcmx.api.email.entity.EmailLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EmailLogRepository extends JpaRepository<EmailLog, Long> {
    List<EmailLog> findByEmailQueueIdOrderByEventTimestampDesc(Long emailQueueId);
    List<EmailLog> findByEventType(String eventType);
}
