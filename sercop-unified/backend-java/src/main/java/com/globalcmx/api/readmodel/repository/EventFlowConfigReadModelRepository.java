package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.EventFlowConfigReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for event flow configuration.
 * Provides queries for the state machine transitions.
 */
@Repository
public interface EventFlowConfigReadModelRepository extends JpaRepository<EventFlowConfigReadModel, Long> {

    /**
     * Find available transitions from an event
     */
    List<EventFlowConfigReadModel> findByOperationTypeAndFromEventCodeAndLanguageAndIsActiveTrueOrderBySequenceOrderAsc(
            String operationType, String fromEventCode, String language);

    /**
     * Find available transitions from a stage
     */
    List<EventFlowConfigReadModel> findByOperationTypeAndFromStageAndLanguageAndIsActiveTrueOrderBySequenceOrderAsc(
            String operationType, String fromStage, String language);

    /**
     * Find initial transitions (no from_event_code)
     */
    @Query("SELECT f FROM EventFlowConfigReadModel f WHERE " +
            "f.operationType = :operationType AND " +
            "f.language = :language AND " +
            "f.fromEventCode IS NULL AND " +
            "f.isActive = true " +
            "ORDER BY f.sequenceOrder ASC")
    List<EventFlowConfigReadModel> findInitialTransitions(
            @Param("operationType") String operationType,
            @Param("language") String language);

    /**
     * Find all flows for operation type
     */
    List<EventFlowConfigReadModel> findByOperationTypeAndLanguageAndIsActiveTrueOrderBySequenceOrderAsc(
            String operationType, String language);

    /**
     * Find required transitions
     */
    List<EventFlowConfigReadModel> findByOperationTypeAndLanguageAndIsRequiredTrueAndIsActiveTrueOrderBySequenceOrderAsc(
            String operationType, String language);

    /**
     * Find transitions to a specific event
     */
    List<EventFlowConfigReadModel> findByOperationTypeAndToEventCodeAndLanguageAndIsActiveTrueOrderBySequenceOrderAsc(
            String operationType, String toEventCode, String language);

    /**
     * Find next possible events from current state.
     * Matches transitions where:
     * - fromEventCode matches the current event (if provided)
     * - OR fromStage matches the current stage (regardless of fromEventCode)
     * - OR both fromEventCode and fromStage are null (initial transitions)
     */
    @Query("SELECT f FROM EventFlowConfigReadModel f WHERE " +
            "f.operationType = :operationType AND " +
            "f.language = :language AND " +
            "f.isActive = true AND " +
            "(f.fromEventCode = :currentEvent OR " +
            "f.fromStage = :currentStage OR " +
            "(f.fromEventCode IS NULL AND f.fromStage IS NULL)) " +
            "ORDER BY f.sequenceOrder ASC")
    List<EventFlowConfigReadModel> findNextPossibleEvents(
            @Param("operationType") String operationType,
            @Param("language") String language,
            @Param("currentEvent") String currentEvent,
            @Param("currentStage") String currentStage);

    /**
     * Get distinct operation types
     */
    @Query("SELECT DISTINCT f.operationType FROM EventFlowConfigReadModel f WHERE f.isActive = true")
    List<String> findDistinctOperationTypes();

    /**
     * Count transitions for operation type
     */
    long countByOperationTypeAndIsActiveTrue(String operationType);

    /**
     * Find flows referencing a specific target event code
     */
    List<EventFlowConfigReadModel> findByOperationTypeAndToEventCode(String operationType, String toEventCode);
}
