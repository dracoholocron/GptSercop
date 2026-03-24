package com.globalcmx.api.eventsourcing.store;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventStoreRepository extends JpaRepository<EventStoreEntity, Long> {

    /**
     * Obtiene todos los eventos de un agregado específico ordenados por versión
     */
    List<EventStoreEntity> findByAggregateIdOrderByVersionAsc(String aggregateId);

    /**
     * Obtiene eventos de un agregado desde una versión específica
     */
    List<EventStoreEntity> findByAggregateIdAndVersionGreaterThanEqualOrderByVersionAsc(
        String aggregateId, Long fromVersion);

    /**
     * Obtiene todos los eventos de un tipo de agregado
     */
    List<EventStoreEntity> findByAggregateTypeOrderByTimestampAsc(String aggregateType);

    /**
     * Obtiene un evento por su ID único
     */
    Optional<EventStoreEntity> findByEventId(String eventId);

    /**
     * Obtiene la versión más alta de un agregado
     */
    @Query("SELECT MAX(e.version) FROM EventStoreEntity e WHERE e.aggregateId = :aggregateId")
    Optional<Long> findMaxVersionByAggregateId(@Param("aggregateId") String aggregateId);

    /**
     * Obtiene eventos no procesados para proyecciones
     */
    List<EventStoreEntity> findByProcessedFalseOrderByTimestampAsc();

    /**
     * Verifica si existe un agregado
     */
    boolean existsByAggregateId(String aggregateId);

    /**
     * Cuenta eventos de un agregado
     */
    long countByAggregateId(String aggregateId);
}
