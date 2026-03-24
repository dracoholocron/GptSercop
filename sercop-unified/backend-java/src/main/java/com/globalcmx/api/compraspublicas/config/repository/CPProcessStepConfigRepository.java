package com.globalcmx.api.compraspublicas.config.repository;

import com.globalcmx.api.compraspublicas.config.entity.CPProcessStepConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CPProcessStepConfigRepository extends JpaRepository<CPProcessStepConfig, String> {

    @Query("SELECT s FROM CPProcessStepConfig s WHERE s.isActive = true " +
           "AND (s.countryCode = :countryCode OR s.countryCode IS NULL) " +
           "AND (s.processType = :processType OR s.processType IS NULL) " +
           "AND (s.tenantId = :tenantId OR s.tenantId IS NULL) " +
           "ORDER BY s.phase, s.displayOrder")
    List<CPProcessStepConfig> findActiveSteps(
            @Param("countryCode") String countryCode,
            @Param("processType") String processType,
            @Param("tenantId") String tenantId);

    @Query("SELECT s FROM CPProcessStepConfig s WHERE s.isActive = true " +
           "AND (s.countryCode = :countryCode OR s.countryCode IS NULL) " +
           "AND (s.processType = :processType OR s.processType IS NULL) " +
           "AND s.tenantId IS NULL " +
           "ORDER BY s.phase, s.displayOrder")
    List<CPProcessStepConfig> findActiveStepsGlobal(
            @Param("countryCode") String countryCode,
            @Param("processType") String processType);

    List<CPProcessStepConfig> findByCountryCodeAndIsActiveTrueOrderByDisplayOrderAsc(String countryCode);

    List<CPProcessStepConfig> findByPhaseAndIsActiveTrueOrderByDisplayOrderAsc(String phase);
}
