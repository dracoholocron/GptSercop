package com.globalcmx.api.email.repository;

import com.globalcmx.api.email.entity.EmailActionConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EmailActionConfigRepository extends JpaRepository<EmailActionConfig, Long> {
    List<EmailActionConfig> findByIsActiveTrue();
    List<EmailActionConfig> findByActionType(EmailActionConfig.ActionType actionType);

    @Query("SELECT e FROM EmailActionConfig e WHERE e.isActive = true AND e.actionType = :actionType AND (e.eventTypeCode = :eventTypeCode OR e.eventTypeCode IS NULL) AND (e.productTypeCode = :productTypeCode OR e.productTypeCode IS NULL)")
    List<EmailActionConfig> findMatchingConfigs(@Param("actionType") EmailActionConfig.ActionType actionType, @Param("eventTypeCode") String eventTypeCode, @Param("productTypeCode") String productTypeCode);
}
