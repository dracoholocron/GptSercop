package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.EventTypeConfigReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for event type configuration.
 * Provides queries for event definitions with i18n support.
 */
@Repository
public interface EventTypeConfigReadModelRepository extends JpaRepository<EventTypeConfigReadModel, Long> {

    /**
     * Find by event code, operation type and language
     */
    Optional<EventTypeConfigReadModel> findByEventCodeAndOperationTypeAndLanguage(
            String eventCode, String operationType, String language);

    /**
     * List all events for operation type in a language
     */
    List<EventTypeConfigReadModel> findByOperationTypeAndLanguageAndIsActiveTrueOrderByDisplayOrderAsc(
            String operationType, String language);

    /**
     * List all active events for operation type (all languages)
     */
    List<EventTypeConfigReadModel> findByOperationTypeAndIsActiveTrueOrderByDisplayOrderAsc(
            String operationType);

    /**
     * Find events by language
     */
    List<EventTypeConfigReadModel> findByLanguageAndIsActiveTrueOrderByOperationTypeAscDisplayOrderAsc(
            String language);

    /**
     * Find events by outbound message type
     */
    List<EventTypeConfigReadModel> findByOutboundMessageTypeAndLanguageAndIsActiveTrueOrderByDisplayOrderAsc(
            String outboundMessageType, String language);

    /**
     * Find events by inbound message type
     */
    List<EventTypeConfigReadModel> findByInboundMessageTypeAndLanguageAndIsActiveTrueOrderByDisplayOrderAsc(
            String inboundMessageType, String language);

    /**
     * Find events valid from a specific stage (using native query for JSON_CONTAINS)
     */
    @Query(value = "SELECT * FROM event_type_config_readmodel e WHERE " +
            "e.operation_type = :operationType AND " +
            "e.language = :language AND " +
            "e.is_active = true AND " +
            "JSON_CONTAINS(e.valid_from_stages, CONCAT('\"', :stage, '\"')) = 1 " +
            "ORDER BY e.display_order ASC", nativeQuery = true)
    List<EventTypeConfigReadModel> findValidEventsFromStage(
            @Param("operationType") String operationType,
            @Param("language") String language,
            @Param("stage") String stage);

    /**
     * Find events that require approval
     */
    List<EventTypeConfigReadModel> findByOperationTypeAndLanguageAndRequiresApprovalTrueAndIsActiveTrueOrderByDisplayOrderAsc(
            String operationType, String language);

    /**
     * Find events by resulting stage
     */
    List<EventTypeConfigReadModel> findByResultingStageAndLanguageAndIsActiveTrueOrderByDisplayOrderAsc(
            String resultingStage, String language);

    /**
     * Get distinct operation types
     */
    @Query("SELECT DISTINCT e.operationType FROM EventTypeConfigReadModel e WHERE e.isActive = true")
    List<String> findDistinctOperationTypes();

    /**
     * Get distinct event codes for operation type
     */
    @Query("SELECT DISTINCT e.eventCode FROM EventTypeConfigReadModel e WHERE " +
            "e.operationType = :operationType AND e.isActive = true")
    List<String> findDistinctEventCodesByOperationType(@Param("operationType") String operationType);

    /**
     * Count by operation type
     */
    long countByOperationTypeAndIsActiveTrue(String operationType);

    /**
     * Get distinct resulting stages across all active event types
     */
    @Query("SELECT DISTINCT e.resultingStage FROM EventTypeConfigReadModel e WHERE e.resultingStage IS NOT NULL AND e.isActive = true")
    List<String> findDistinctResultingStages();

    /**
     * Get distinct resulting stages for a specific operation type
     */
    @Query("SELECT DISTINCT e.resultingStage FROM EventTypeConfigReadModel e WHERE e.operationType = :operationType AND e.resultingStage IS NOT NULL AND e.isActive = true")
    List<String> findDistinctResultingStagesByOperationType(@Param("operationType") String operationType);

    /**
     * Get distinct outbound SWIFT message types
     */
    @Query("SELECT DISTINCT e.outboundMessageType FROM EventTypeConfigReadModel e WHERE e.outboundMessageType IS NOT NULL AND e.isActive = true")
    List<String> findDistinctOutboundMessageTypes();

    /**
     * Get distinct inbound SWIFT message types
     */
    @Query("SELECT DISTINCT e.inboundMessageType FROM EventTypeConfigReadModel e WHERE e.inboundMessageType IS NOT NULL AND e.isActive = true")
    List<String> findDistinctInboundMessageTypes();

    /**
     * Find client-requestable events for an operation type
     */
    List<EventTypeConfigReadModel> findByOperationTypeAndLanguageAndIsClientRequestableTrueAndIsActiveTrueOrderByDisplayOrderAsc(
            String operationType, String language);

    /**
     * Find client-requestable events from a specific stage (using native query for JSON_CONTAINS)
     */
    @Query(value = "SELECT * FROM event_type_config_readmodel e WHERE " +
            "e.operation_type = :operationType AND " +
            "e.language = :language AND " +
            "e.is_active = true AND " +
            "e.is_client_requestable = true AND " +
            "JSON_CONTAINS(e.valid_from_stages, CONCAT('\"', :stage, '\"')) = 1 " +
            "ORDER BY e.display_order ASC", nativeQuery = true)
    List<EventTypeConfigReadModel> findClientRequestableEventsFromStage(
            @Param("operationType") String operationType,
            @Param("language") String language,
            @Param("stage") String stage);
}
