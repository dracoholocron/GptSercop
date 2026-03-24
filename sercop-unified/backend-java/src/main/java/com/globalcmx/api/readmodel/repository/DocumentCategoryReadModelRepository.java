package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.DocumentCategoryReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for document category read model - optimized for read operations.
 */
@Repository
public interface DocumentCategoryReadModelRepository extends JpaRepository<DocumentCategoryReadModel, Long> {

    // Find root categories (no parent)
    List<DocumentCategoryReadModel> findByParentCodeIsNullAndIsActiveTrueOrderByDisplayOrderAsc();

    // Find children of a category
    List<DocumentCategoryReadModel> findByParentCodeAndIsActiveTrueOrderByDisplayOrderAsc(String parentCode);

    // Find by code
    Optional<DocumentCategoryReadModel> findByCode(String code);

    // Find by category ID
    Optional<DocumentCategoryReadModel> findByCategoryId(String categoryId);

    // Find all active categories
    List<DocumentCategoryReadModel> findByIsActiveTrueOrderByDisplayOrderAsc();

    // Update document count
    @Modifying
    @Query("UPDATE DocumentCategoryReadModel c SET c.documentCount = c.documentCount + 1 WHERE c.code = :code")
    void incrementDocumentCount(@Param("code") String code);

    // Decrement document count
    @Modifying
    @Query("UPDATE DocumentCategoryReadModel c SET c.documentCount = CASE WHEN c.documentCount > 0 THEN c.documentCount - 1 ELSE 0 END WHERE c.code = :code")
    void decrementDocumentCount(@Param("code") String code);

    // Update has children flag
    @Modifying
    @Query("UPDATE DocumentCategoryReadModel c SET c.hasChildren = true WHERE c.code = :parentCode")
    void markAsHasChildren(@Param("parentCode") String parentCode);
}
