package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.TemplateVariable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TemplateVariableRepository extends JpaRepository<TemplateVariable, Long> {

    /**
     * Find all active variables ordered by category and display order
     */
    List<TemplateVariable> findByIsActiveTrueOrderByCategoryAscDisplayOrderAsc();

    /**
     * Find active variables by category
     */
    List<TemplateVariable> findByCategoryAndIsActiveTrueOrderByDisplayOrderAsc(String category);

    /**
     * Find variable by code
     */
    Optional<TemplateVariable> findByCode(String code);

    /**
     * Check if variable code exists
     */
    boolean existsByCode(String code);

    /**
     * Find all variables ordered by category and display order (including inactive)
     */
    List<TemplateVariable> findAllByOrderByCategoryAscDisplayOrderAsc();

    /**
     * Get distinct categories
     */
    @Query("SELECT DISTINCT t.category FROM TemplateVariable t ORDER BY t.category")
    List<String> findDistinctCategories();

    /**
     * Find variables by source table
     */
    List<TemplateVariable> findBySourceTableAndIsActiveTrueOrderByDisplayOrderAsc(String sourceTable);

    /**
     * Search variables by code or label key containing text
     */
    @Query("SELECT t FROM TemplateVariable t WHERE " +
           "LOWER(t.code) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(t.labelKey) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "ORDER BY t.category, t.displayOrder")
    List<TemplateVariable> searchByCodeOrLabelKey(String search);
}
