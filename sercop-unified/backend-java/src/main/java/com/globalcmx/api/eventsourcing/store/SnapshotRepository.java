package com.globalcmx.api.eventsourcing.store;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SnapshotRepository extends JpaRepository<SnapshotEntity, Long> {

    /**
     * Obtiene el snapshot más reciente de un agregado
     */
    @Query("SELECT s FROM SnapshotEntity s " +
           "WHERE s.aggregateId = :aggregateId AND s.aggregateType = :aggregateType " +
           "ORDER BY s.version DESC LIMIT 1")
    Optional<SnapshotEntity> findLatestSnapshot(
        @Param("aggregateId") String aggregateId,
        @Param("aggregateType") String aggregateType);

    /**
     * Obtiene snapshot por agregado y versión específica
     */
    Optional<SnapshotEntity> findByAggregateIdAndAggregateTypeAndVersion(
        String aggregateId, String aggregateType, Long version);

    /**
     * Elimina snapshots antiguos manteniendo solo el más reciente
     */
    @Query("DELETE FROM SnapshotEntity s " +
           "WHERE s.aggregateId = :aggregateId AND s.aggregateType = :aggregateType " +
           "AND s.version < (SELECT MAX(s2.version) FROM SnapshotEntity s2 " +
           "WHERE s2.aggregateId = :aggregateId AND s2.aggregateType = :aggregateType)")
    void deleteOldSnapshots(@Param("aggregateId") String aggregateId,
                           @Param("aggregateType") String aggregateType);
}
