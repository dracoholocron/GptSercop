package com.globalcmx.api.customfields.repository;

import com.globalcmx.api.customfields.entity.CustomFieldConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for CustomFieldConfig entities.
 */
@Repository
public interface CustomFieldConfigRepository extends JpaRepository<CustomFieldConfig, String> {

    /**
     * Find active fields for a section.
     */
    @Query("SELECT f FROM CustomFieldConfig f " +
           "WHERE f.section.id = :sectionId " +
           "AND f.isActive = true " +
           "ORDER BY f.displayOrder ASC")
    List<CustomFieldConfig> findActiveFieldsBySectionId(@Param("sectionId") String sectionId);

    /**
     * Find fields visible in wizard mode.
     */
    @Query("SELECT f FROM CustomFieldConfig f " +
           "WHERE f.section.id = :sectionId " +
           "AND f.isActive = true " +
           "AND f.showInWizard = true " +
           "ORDER BY f.displayOrder ASC")
    List<CustomFieldConfig> findWizardFieldsBySectionId(@Param("sectionId") String sectionId);

    /**
     * Find fields visible in expert mode.
     */
    @Query("SELECT f FROM CustomFieldConfig f " +
           "WHERE f.section.id = :sectionId " +
           "AND f.isActive = true " +
           "AND f.showInExpert = true " +
           "ORDER BY f.displayOrder ASC")
    List<CustomFieldConfig> findExpertFieldsBySectionId(@Param("sectionId") String sectionId);

    /**
     * Find fields visible in view mode.
     */
    @Query("SELECT f FROM CustomFieldConfig f " +
           "WHERE f.section.id = :sectionId " +
           "AND f.isActive = true " +
           "AND f.showInView = true " +
           "ORDER BY f.displayOrder ASC")
    List<CustomFieldConfig> findViewFieldsBySectionId(@Param("sectionId") String sectionId);

    /**
     * Find fields that should appear in operation list/grid.
     */
    @Query("SELECT f FROM CustomFieldConfig f " +
           "JOIN f.section s " +
           "JOIN s.step st " +
           "WHERE f.isActive = true " +
           "AND f.showInList = true " +
           "AND st.productType IN (:productType, 'ALL') " +
           "AND (st.tenantId IS NULL OR st.tenantId = :tenantId) " +
           "ORDER BY st.displayOrder, s.displayOrder, f.displayOrder ASC")
    List<CustomFieldConfig> findListFieldsForProduct(
        @Param("productType") String productType,
        @Param("tenantId") String tenantId
    );

    /**
     * Find all fields that should appear in operation list/grid,
     * excluding client portal fields (CLIENT_*).
     */
    @Query("SELECT f FROM CustomFieldConfig f " +
           "JOIN FETCH f.section s " +
           "JOIN FETCH s.step st " +
           "WHERE f.isActive = true " +
           "AND f.showInList = true " +
           "AND st.productType NOT LIKE 'CLIENT_%' " +
           "ORDER BY st.displayOrder, s.displayOrder, f.displayOrder ASC")
    List<CustomFieldConfig> findAllListFields();

    /**
     * Find fields to embed after a SWIFT field.
     */
    @Query("SELECT f FROM CustomFieldConfig f " +
           "JOIN f.section s " +
           "JOIN s.step st " +
           "WHERE f.isActive = true " +
           "AND f.embedAfterSwiftField = :swiftFieldCode " +
           "AND st.productType IN (:productType, 'ALL') " +
           "AND (st.tenantId IS NULL OR st.tenantId = :tenantId) " +
           "ORDER BY f.displayOrder ASC")
    List<CustomFieldConfig> findFieldsToEmbedAfterSwiftField(
        @Param("swiftFieldCode") String swiftFieldCode,
        @Param("productType") String productType,
        @Param("tenantId") String tenantId
    );

    /**
     * Find required fields for a section.
     */
    @Query("SELECT f FROM CustomFieldConfig f " +
           "WHERE f.section.id = :sectionId " +
           "AND f.isActive = true " +
           "AND f.isRequired = true " +
           "ORDER BY f.displayOrder ASC")
    List<CustomFieldConfig> findRequiredFieldsBySectionId(@Param("sectionId") String sectionId);

    /**
     * Find all fields for a section (regardless of isActive, for cascade operations).
     */
    @Query("SELECT f FROM CustomFieldConfig f WHERE f.section.id = :sectionId")
    List<CustomFieldConfig> findAllBySectionId(@Param("sectionId") String sectionId);

    /**
     * Find field by code.
     */
    Optional<CustomFieldConfig> findByFieldCodeAndSectionId(String fieldCode, String sectionId);

    /**
     * Find fields by component type (for data source resolution).
     */
    @Query("SELECT f FROM CustomFieldConfig f " +
           "WHERE f.componentType = :componentType " +
           "AND f.isActive = true")
    List<CustomFieldConfig> findByComponentType(@Param("componentType") String componentType);

    /**
     * Find fields that have mapping configuration for a target product type.
     * Used for transforming client portal data to operation data.
     */
    @Query("SELECT f FROM CustomFieldConfig f " +
           "WHERE f.mapsToProductType = :targetProductType " +
           "AND f.isActive = true " +
           "AND f.mapsToFieldCode IS NOT NULL " +
           "ORDER BY f.displayOrder ASC")
    List<CustomFieldConfig> findByMapsToProductType(@Param("targetProductType") String targetProductType);
}
