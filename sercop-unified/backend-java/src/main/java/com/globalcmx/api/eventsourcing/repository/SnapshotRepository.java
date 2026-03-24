package com.globalcmx.api.eventsourcing.repository;

import com.globalcmx.api.eventsourcing.entity.SnapshotEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SnapshotRepository extends JpaRepository<SnapshotEntity, Long> {

    @Query("SELECT s FROM SnapshotEntity s WHERE s.aggregateId = :aggregateId ORDER BY s.version DESC LIMIT 1")
    Optional<SnapshotEntity> findLatestByAggregateId(@Param("aggregateId") String aggregateId);

    void deleteByAggregateIdAndVersionLessThan(String aggregateId, Long version);
}
