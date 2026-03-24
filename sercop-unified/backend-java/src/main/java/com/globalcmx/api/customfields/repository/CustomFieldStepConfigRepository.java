package com.globalcmx.api.customfields.repository;

import com.globalcmx.api.customfields.entity.CustomFieldStepConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for CustomFieldStepConfig entities.
 */
@Repository
public interface CustomFieldStepConfigRepository extends JpaRepository<CustomFieldStepConfig, String> {

    /**
     * Find active steps for a product type, including 'ALL'.
     * Uses nested fetch join to load sections and their fields.
     */
    @Query("SELECT DISTINCT s FROM CustomFieldStepConfig s " +
           "LEFT JOIN FETCH s.sections sec " +
           "LEFT JOIN FETCH sec.fields " +
           "WHERE s.isActive = true " +
           "AND (s.productType = :productType OR s.productType = 'ALL') " +
           "AND (s.tenantId IS NULL OR s.tenantId = :tenantId) " +
           "ORDER BY s.displayOrder ASC")
    List<CustomFieldStepConfig> findActiveStepsForProduct(
        @Param("productType") String productType,
        @Param("tenantId") String tenantId
    );

    /**
     * Find steps by embed mode.
     */
    @Query("SELECT DISTINCT s FROM CustomFieldStepConfig s " +
           "LEFT JOIN FETCH s.sections sec " +
           "LEFT JOIN FETCH sec.fields " +
           "WHERE s.isActive = true " +
           "AND s.embedMode = :embedMode " +
           "AND (s.productType = :productType OR s.productType = 'ALL') " +
           "AND (s.tenantId IS NULL OR s.tenantId = :tenantId) " +
           "ORDER BY s.displayOrder ASC")
    List<CustomFieldStepConfig> findByEmbedMode(
        @Param("embedMode") String embedMode,
        @Param("productType") String productType,
        @Param("tenantId") String tenantId
    );

    /**
     * Find steps that embed in a specific SWIFT step.
     */
    @Query("SELECT DISTINCT s FROM CustomFieldStepConfig s " +
           "LEFT JOIN FETCH s.sections sec " +
           "LEFT JOIN FETCH sec.fields " +
           "WHERE s.isActive = true " +
           "AND s.embedMode = 'EMBEDDED_IN_SWIFT' " +
           "AND s.embedSwiftStep = :swiftStep " +
           "AND (s.productType = :productType OR s.productType = 'ALL') " +
           "AND (s.tenantId IS NULL OR s.tenantId = :tenantId) " +
           "ORDER BY s.displayOrder ASC")
    List<CustomFieldStepConfig> findEmbeddedInSwiftStep(
        @Param("swiftStep") String swiftStep,
        @Param("productType") String productType,
        @Param("tenantId") String tenantId
    );

    /**
     * Find step by code.
     */
    Optional<CustomFieldStepConfig> findByStepCodeAndProductTypeAndTenantId(
        String stepCode, String productType, String tenantId
    );

    /**
     * Find all steps for admin.
     */
    @Query("SELECT DISTINCT s FROM CustomFieldStepConfig s " +
           "LEFT JOIN FETCH s.sections sec " +
           "LEFT JOIN FETCH sec.fields " +
           "WHERE (:productType IS NULL OR s.productType = :productType OR s.productType = 'ALL') " +
           "AND (:tenantId IS NULL OR s.tenantId IS NULL OR s.tenantId = :tenantId) " +
           "ORDER BY s.productType, s.displayOrder ASC")
    List<CustomFieldStepConfig> findAllForAdmin(
        @Param("productType") String productType,
        @Param("tenantId") String tenantId
    );
}
