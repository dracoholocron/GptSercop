package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.EventAlertTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventAlertTemplateRepository extends JpaRepository<EventAlertTemplate, Long> {

    List<EventAlertTemplate> findByOperationTypeAndLanguageAndIsActiveTrueOrderByEventCodeAscDisplayOrderAsc(
            String operationType, String language);

    List<EventAlertTemplate> findByOperationTypeAndEventCodeAndLanguageAndIsActiveTrueOrderByDisplayOrderAsc(
            String operationType, String eventCode, String language);

    List<EventAlertTemplate> findByOperationTypeAndLanguageOrderByEventCodeAscDisplayOrderAsc(
            String operationType, String language);

    @Query("SELECT DISTINCT e.eventCode FROM EventAlertTemplate e WHERE e.operationType = :operationType AND e.isActive = true")
    List<String> findDistinctEventCodesByOperationType(@Param("operationType") String operationType);

    long countByOperationTypeAndIsActiveTrue(String operationType);
}
