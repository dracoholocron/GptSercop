package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.ReferenceNumberHistoryReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReferenceNumberHistoryRepository extends JpaRepository<ReferenceNumberHistoryReadModel, Long> {

    Optional<ReferenceNumberHistoryReadModel> findByReferenceNumber(String referenceNumber);

    boolean existsByReferenceNumber(String referenceNumber);

    List<ReferenceNumberHistoryReadModel> findByEntityTypeAndEntityId(String entityType, String entityId);

    @Query("SELECT h FROM ReferenceNumberHistoryReadModel h WHERE h.productCode = :productCode " +
           "AND h.yearCode = :yearCode ORDER BY h.sequenceNumber DESC")
    List<ReferenceNumberHistoryReadModel> findByProductAndYear(
            @Param("productCode") String productCode,
            @Param("yearCode") String yearCode);

    @Query("SELECT h FROM ReferenceNumberHistoryReadModel h WHERE h.generatedAt BETWEEN :startDate AND :endDate " +
           "ORDER BY h.generatedAt DESC")
    List<ReferenceNumberHistoryReadModel> findByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(h) FROM ReferenceNumberHistoryReadModel h WHERE h.configId = :configId " +
           "AND h.yearCode = :yearCode")
    Long countByConfigAndYear(@Param("configId") Long configId, @Param("yearCode") String yearCode);
}
