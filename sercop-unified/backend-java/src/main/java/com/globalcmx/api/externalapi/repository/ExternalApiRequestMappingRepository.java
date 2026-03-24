package com.globalcmx.api.externalapi.repository;

import com.globalcmx.api.externalapi.entity.ExternalApiRequestMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExternalApiRequestMappingRepository extends JpaRepository<ExternalApiRequestMapping, Long> {

    /**
     * Find all active mappings for an API config, ordered by display order
     */
    List<ExternalApiRequestMapping> findByApiConfigIdAndIsActiveTrueOrderByDisplayOrderAsc(Long apiConfigId);

    /**
     * Find all mappings for an API config
     */
    List<ExternalApiRequestMapping> findByApiConfigIdOrderByDisplayOrderAsc(Long apiConfigId);

    /**
     * Find by API config ID and variable code
     */
    List<ExternalApiRequestMapping> findByApiConfigIdAndVariableCode(Long apiConfigId, String variableCode);

    /**
     * Delete all mappings for an API config
     */
    void deleteByApiConfigId(Long apiConfigId);

    /**
     * Count active mappings for an API config
     */
    long countByApiConfigIdAndIsActiveTrue(Long apiConfigId);

    /**
     * Find all required mappings for an API config
     */
    @Query("SELECT m FROM ExternalApiRequestMapping m WHERE m.apiConfigId = :apiConfigId AND m.isActive = true AND m.isRequired = true ORDER BY m.displayOrder")
    List<ExternalApiRequestMapping> findRequiredMappings(Long apiConfigId);
}
