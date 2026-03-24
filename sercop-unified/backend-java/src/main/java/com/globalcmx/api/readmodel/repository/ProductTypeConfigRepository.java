package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.ProductTypeConfigReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for product type configuration.
 * Provides queries for centralized product type to UI mapping.
 */
@Repository
public interface ProductTypeConfigRepository extends JpaRepository<ProductTypeConfigReadModel, Long> {

    /**
     * Find configuration by product type
     */
    Optional<ProductTypeConfigReadModel> findByProductType(String productType);

    /**
     * Find active configuration by product type
     */
    Optional<ProductTypeConfigReadModel> findByProductTypeAndActiveTrue(String productType);

    /**
     * Find all active configurations ordered by display order
     */
    List<ProductTypeConfigReadModel> findByActiveTrueOrderByDisplayOrderAsc();

    /**
     * Find configurations by category
     */
    List<ProductTypeConfigReadModel> findByCategoryAndActiveTrueOrderByDisplayOrderAsc(String category);

    /**
     * Check if product type exists
     */
    boolean existsByProductType(String productType);
}
