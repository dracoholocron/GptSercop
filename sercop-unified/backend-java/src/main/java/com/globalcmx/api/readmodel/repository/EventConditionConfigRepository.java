package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.EventConditionConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for event condition configuration.
 * Provides queries for evaluating configurable conditions.
 */
@Repository
public interface EventConditionConfigRepository extends JpaRepository<EventConditionConfig, Long> {

    /**
     * Find condition by code and language
     */
    Optional<EventConditionConfig> findByConditionCodeAndLanguage(String conditionCode, String language);

    /**
     * Find condition by code (any language)
     */
    List<EventConditionConfig> findByConditionCode(String conditionCode);

    /**
     * Find active conditions by category
     */
    List<EventConditionConfig> findByCategoryAndLanguageAndIsActiveTrueOrderByDisplayOrderAsc(
            String category, String language);

    /**
     * Find conditions by type
     */
    List<EventConditionConfig> findByConditionTypeAndLanguageAndIsActiveTrueOrderByDisplayOrderAsc(
            EventConditionConfig.ConditionType conditionType, String language);

    /**
     * Find SWIFT_FIELD conditions for a specific message type
     */
    List<EventConditionConfig> findByConditionTypeAndMessageTypeAndLanguageAndIsActiveTrueOrderByDisplayOrderAsc(
            EventConditionConfig.ConditionType conditionType, String messageType, String language);

    /**
     * Find conditions for SWIFT field detection
     */
    @Query("SELECT c FROM EventConditionConfig c WHERE " +
            "c.conditionType = 'SWIFT_FIELD' AND " +
            "c.messageType = :messageType AND " +
            "c.fieldCode = :fieldCode AND " +
            "c.language = :language AND " +
            "c.isActive = true")
    List<EventConditionConfig> findSwiftFieldConditions(
            @Param("messageType") String messageType,
            @Param("fieldCode") String fieldCode,
            @Param("language") String language);

    /**
     * Find conditions applicable to an operation type
     */
    @Query(value = "SELECT c.* FROM event_condition_config c WHERE " +
            "c.language = :language AND " +
            "c.is_active = true AND " +
            "(c.operation_types IS NULL OR JSON_CONTAINS(c.operation_types, CONCAT('\"', :operationType, '\"'))) " +
            "ORDER BY c.display_order ASC", nativeQuery = true)
    List<EventConditionConfig> findByOperationType(
            @Param("operationType") String operationType,
            @Param("language") String language);

    /**
     * Find composite conditions that reference a child condition
     */
    @Query(value = "SELECT c.* FROM event_condition_config c WHERE " +
            "c.condition_type = 'COMPOSITE' AND " +
            "c.is_active = true AND " +
            "JSON_CONTAINS(c.child_condition_codes, CONCAT('\"', :childCode, '\"'))",
            nativeQuery = true)
    List<EventConditionConfig> findCompositeConditionsContaining(@Param("childCode") String childCode);

    /**
     * Find condition codes linked to a flow config
     */
    @Query(value = "SELECT m.condition_code FROM event_flow_condition_mapping m WHERE " +
            "m.operation_type = :operationType AND " +
            "m.event_code = :eventCode AND " +
            "m.is_active = true " +
            "ORDER BY m.evaluation_order ASC", nativeQuery = true)
    List<String> findConditionCodesForFlow(
            @Param("operationType") String operationType,
            @Param("eventCode") String eventCode);

    /**
     * Find all active cacheable conditions
     */
    List<EventConditionConfig> findByIsCacheableTrueAndIsActiveTrueOrderByDisplayOrderAsc();

    /**
     * Get distinct categories
     */
    @Query("SELECT DISTINCT c.category FROM EventConditionConfig c WHERE c.isActive = true AND c.category IS NOT NULL")
    List<String> findDistinctCategories();

    /**
     * Get distinct condition types in use
     */
    @Query("SELECT DISTINCT c.conditionType FROM EventConditionConfig c WHERE c.isActive = true")
    List<EventConditionConfig.ConditionType> findDistinctConditionTypes();

    /**
     * Count active conditions
     */
    long countByIsActiveTrue();

    /**
     * Count conditions by category
     */
    long countByCategoryAndIsActiveTrue(String category);
}
