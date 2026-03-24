package com.globalcmx.api.document.repository;

import com.globalcmx.api.document.entity.DocumentTypeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for document types within categories.
 */
@Repository
public interface DocumentTypeRepository extends JpaRepository<DocumentTypeEntity, String> {

    // Find by code
    Optional<DocumentTypeEntity> findByCode(String code);

    // Check if code exists
    boolean existsByCode(String code);

    // Find by category
    List<DocumentTypeEntity> findByCategoryCodeAndIsActiveTrueOrderByNameEsAsc(String categoryCode);

    // Find all active
    List<DocumentTypeEntity> findByIsActiveTrueOrderByCategoryCodeAscNameEsAsc();

    // Search by name
    List<DocumentTypeEntity> findByNameEsContainingIgnoreCaseOrNameEnContainingIgnoreCaseAndIsActiveTrue(
            String nameEs, String nameEn);

    // Find types that require approval
    List<DocumentTypeEntity> findByRequiresApprovalTrueAndIsActiveTrue();

    // Find by category and active status
    List<DocumentTypeEntity> findByCategoryCodeAndIsActiveTrue(String categoryCode);
}
