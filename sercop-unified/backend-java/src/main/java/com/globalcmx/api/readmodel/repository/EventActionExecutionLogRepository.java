package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.EventActionExecutionLog;
import com.globalcmx.api.readmodel.entity.EventActionExecutionLog.ExecutionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventActionExecutionLogRepository extends JpaRepository<EventActionExecutionLog, Long> {

    List<EventActionExecutionLog> findByExecutionIdOrderByActionOrder(String executionId);

    List<EventActionExecutionLog> findByOperationIdOrderByCreatedAtDesc(String operationId);

    List<EventActionExecutionLog> findByStatusOrderByCreatedAtAsc(ExecutionStatus status);

    List<EventActionExecutionLog> findByRuleCodeAndOperationId(String ruleCode, String operationId);

    long countByExecutionIdAndStatus(String executionId, ExecutionStatus status);
}
