package com.globalcmx.api.alerts.repository;

import com.globalcmx.api.alerts.entity.AlertTypeConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for alert type configuration.
 */
@Repository
public interface AlertTypeConfigRepository extends JpaRepository<AlertTypeConfig, Long> {

    /**
     * Find by type code
     */
    Optional<AlertTypeConfig> findByTypeCode(String typeCode);

    /**
     * Find all active alert types ordered by display order
     */
    List<AlertTypeConfig> findByIsActiveTrueOrderByDisplayOrderAsc();

    /**
     * Find all ordered by display order
     */
    List<AlertTypeConfig> findAllByOrderByDisplayOrderAsc();

    /**
     * Check if type code exists
     */
    boolean existsByTypeCode(String typeCode);
}
