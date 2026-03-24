package com.globalcmx.api.eventsourcing.repository;

import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventStoreRepository extends JpaRepository<EventStoreEntity, String> {

    List<EventStoreEntity> findByAggregateIdOrderByVersionAsc(String aggregateId);

    @Query("SELECT e FROM EventStoreEntity e WHERE e.aggregateId = :aggregateId AND e.version > :afterVersion ORDER BY e.version ASC")
    List<EventStoreEntity> findByAggregateIdAfterVersion(
            @Param("aggregateId") String aggregateId,
            @Param("afterVersion") Long afterVersion
    );

    @Query("SELECT MAX(e.version) FROM EventStoreEntity e WHERE e.aggregateId = :aggregateId")
    Long findMaxVersionByAggregateId(@Param("aggregateId") String aggregateId);

    List<EventStoreEntity> findByProcessedFalseOrderByTimestampAsc();

    List<EventStoreEntity> findByAggregateTypeOrderByTimestampAsc(String aggregateType);
}
