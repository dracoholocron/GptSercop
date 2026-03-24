package com.globalcmx.api.customfields.repository;

import com.globalcmx.api.customfields.entity.CustomFieldSectionConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for CustomFieldSectionConfig entities.
 */
@Repository
public interface CustomFieldSectionConfigRepository extends JpaRepository<CustomFieldSectionConfig, String> {

    /**
     * Find active sections for a step.
     */
    @Query("SELECT DISTINCT s FROM CustomFieldSectionConfig s " +
           "LEFT JOIN FETCH s.fields " +
           "WHERE s.step.id = :stepId " +
           "AND s.isActive = true " +
           "ORDER BY s.displayOrder ASC")
    List<CustomFieldSectionConfig> findActiveSectionsByStepId(@Param("stepId") String stepId);

    /**
     * Find sections by embed mode and target.
     */
    @Query("SELECT DISTINCT s FROM CustomFieldSectionConfig s " +
           "LEFT JOIN FETCH s.fields " +
           "WHERE s.isActive = true " +
           "AND s.embedMode = :embedMode " +
           "AND s.embedTargetType = :targetType " +
           "AND s.embedTargetCode = :targetCode " +
           "AND s.step.productType IN (:productType, 'ALL') " +
           "AND (s.step.tenantId IS NULL OR s.step.tenantId = :tenantId) " +
           "ORDER BY s.displayOrder ASC")
    List<CustomFieldSectionConfig> findByEmbedTarget(
        @Param("embedMode") String embedMode,
        @Param("targetType") String targetType,
        @Param("targetCode") String targetCode,
        @Param("productType") String productType,
        @Param("tenantId") String tenantId
    );

    /**
     * Find sections to embed after a SWIFT section.
     */
    @Query("SELECT DISTINCT s FROM CustomFieldSectionConfig s " +
           "LEFT JOIN FETCH s.fields " +
           "WHERE s.isActive = true " +
           "AND s.embedMode = 'AFTER_SECTION' " +
           "AND s.embedTargetType = 'SECTION' " +
           "AND s.embedTargetCode = :sectionCode " +
           "AND s.step.productType IN (:productType, 'ALL') " +
           "AND (s.step.tenantId IS NULL OR s.step.tenantId = :tenantId) " +
           "ORDER BY s.displayOrder ASC")
    List<CustomFieldSectionConfig> findSectionsToEmbedAfterSwiftSection(
        @Param("sectionCode") String sectionCode,
        @Param("productType") String productType,
        @Param("tenantId") String tenantId
    );

    /**
     * Find all sections for a step (regardless of isActive, for cascade operations).
     */
    @Query("SELECT s FROM CustomFieldSectionConfig s WHERE s.step.id = :stepId")
    List<CustomFieldSectionConfig> findAllByStepId(@Param("stepId") String stepId);

    /**
     * Find section by code.
     */
    Optional<CustomFieldSectionConfig> findBySectionCodeAndStepId(String sectionCode, String stepId);

    /**
     * Find repeatable sections for a step.
     */
    @Query("SELECT DISTINCT s FROM CustomFieldSectionConfig s " +
           "LEFT JOIN FETCH s.fields " +
           "WHERE s.step.id = :stepId " +
           "AND s.sectionType = 'REPEATABLE' " +
           "AND s.isActive = true " +
           "ORDER BY s.displayOrder ASC")
    List<CustomFieldSectionConfig> findRepeatableSectionsByStepId(@Param("stepId") String stepId);
}
