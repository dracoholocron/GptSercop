package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.EventSnapshotFieldConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for event snapshot field configuration.
 */
@Repository
public interface EventSnapshotFieldConfigRepository extends JpaRepository<EventSnapshotFieldConfig, Integer> {

    /**
     * Get all active fields for a specific operation type (or global fields).
     */
    @Query("SELECT c FROM EventSnapshotFieldConfig c " +
           "WHERE c.isActive = true " +
           "AND (c.operationType IS NULL OR c.operationType = :operationType) " +
           "ORDER BY c.displayOrder")
    List<EventSnapshotFieldConfig> findActiveFieldsForOperationType(@Param("operationType") String operationType);

    /**
     * Get all active global fields (not specific to any operation type).
     */
    List<EventSnapshotFieldConfig> findByIsActiveTrueAndOperationTypeIsNullOrderByDisplayOrder();

    /**
     * Get fields that should be shown in timeline.
     */
    @Query("SELECT c FROM EventSnapshotFieldConfig c " +
           "WHERE c.isActive = true AND c.showInTimeline = true " +
           "AND (c.operationType IS NULL OR c.operationType = :operationType) " +
           "ORDER BY c.displayOrder")
    List<EventSnapshotFieldConfig> findTimelineFieldsForOperationType(@Param("operationType") String operationType);
}
