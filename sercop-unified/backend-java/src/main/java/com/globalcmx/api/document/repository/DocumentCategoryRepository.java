package com.globalcmx.api.document.repository;

import com.globalcmx.api.document.entity.DocumentCategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for document categories with hierarchical support.
 */
@Repository
public interface DocumentCategoryRepository extends JpaRepository<DocumentCategoryEntity, String> {

    // Find by code
    Optional<DocumentCategoryEntity> findByCode(String code);

    // Check if code exists
    boolean existsByCode(String code);

    // Find active categories
    List<DocumentCategoryEntity> findByIsActiveTrueOrderByDisplayOrderAsc();

    // Find root categories (no parent)
    List<DocumentCategoryEntity> findByParentCategoryIdIsNullAndIsActiveTrueOrderByDisplayOrderAsc();

    // Find child categories
    List<DocumentCategoryEntity> findByParentCategoryIdAndIsActiveTrueOrderByDisplayOrderAsc(String parentCategoryId);

    // Find all children recursively
    @Query(value = """
        WITH RECURSIVE category_tree AS (
            SELECT * FROM document_categories WHERE category_id = :categoryId
            UNION ALL
            SELECT c.* FROM document_categories c
            INNER JOIN category_tree ct ON c.parent_category_id = ct.category_id
        )
        SELECT * FROM category_tree WHERE is_active = true ORDER BY display_order
        """, nativeQuery = true)
    List<DocumentCategoryEntity> findAllChildrenRecursive(@Param("categoryId") String categoryId);

    // Search categories by name
    List<DocumentCategoryEntity> findByNameEsContainingIgnoreCaseOrNameEnContainingIgnoreCaseAndIsActiveTrue(
            String nameEs, String nameEn);

    // Find by code pattern
    List<DocumentCategoryEntity> findByCodeStartingWithAndIsActiveTrueOrderByDisplayOrderAsc(String codePrefix);
}
