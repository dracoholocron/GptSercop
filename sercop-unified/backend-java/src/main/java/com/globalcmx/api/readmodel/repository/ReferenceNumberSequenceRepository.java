package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.ReferenceNumberSequenceReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.Optional;

@Repository
public interface ReferenceNumberSequenceRepository extends JpaRepository<ReferenceNumberSequenceReadModel, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM ReferenceNumberSequenceReadModel s WHERE s.configId = :configId " +
           "AND s.agencyCode = :agencyCode AND s.yearCode = :yearCode")
    Optional<ReferenceNumberSequenceReadModel> findByConfigAndAgencyAndYearForUpdate(
            @Param("configId") Long configId,
            @Param("agencyCode") String agencyCode,
            @Param("yearCode") String yearCode);

    Optional<ReferenceNumberSequenceReadModel> findByConfigIdAndAgencyCodeAndYearCode(
            Long configId, String agencyCode, String yearCode);

    @Modifying
    @Query("UPDATE ReferenceNumberSequenceReadModel s SET s.currentSequence = s.currentSequence + 1, " +
           "s.lastGeneratedAt = CURRENT_TIMESTAMP WHERE s.id = :id")
    void incrementSequence(@Param("id") Long id);
}
