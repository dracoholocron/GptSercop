package com.globalcmx.api.externalapi.repository;

import com.globalcmx.api.externalapi.entity.ExternalApiResponseMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExternalApiResponseMappingRepository extends JpaRepository<ExternalApiResponseMapping, Long> {

    /**
     * Find all active mappings for an API config, ordered by display order
     */
    List<ExternalApiResponseMapping> findByApiConfigIdAndIsActiveTrueOrderByDisplayOrderAsc(Long apiConfigId);

    /**
     * Find all mappings for an API config
     */
    List<ExternalApiResponseMapping> findByApiConfigIdOrderByDisplayOrderAsc(Long apiConfigId);

    /**
     * Find by API config ID and internal name
     */
    Optional<ExternalApiResponseMapping> findByApiConfigIdAndInternalName(Long apiConfigId, String internalName);

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
    @Query("SELECT m FROM ExternalApiResponseMapping m WHERE m.apiConfigId = :apiConfigId AND m.isActive = true AND m.isRequired = true ORDER BY m.displayOrder")
    List<ExternalApiResponseMapping> findRequiredMappings(Long apiConfigId);
}
