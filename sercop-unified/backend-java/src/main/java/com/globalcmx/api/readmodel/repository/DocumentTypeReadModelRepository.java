package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.DocumentTypeReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for document type read model - optimized for read operations.
 */
@Repository
public interface DocumentTypeReadModelRepository extends JpaRepository<DocumentTypeReadModel, Long> {

    // Find by category
    List<DocumentTypeReadModel> findByCategoryCodeAndIsActiveTrueOrderByNameEsAsc(String categoryCode);

    // Find all active types
    List<DocumentTypeReadModel> findByIsActiveTrueOrderByCategoryCodeAscNameEsAsc();

    // Find by code
    Optional<DocumentTypeReadModel> findByCode(String code);

    // Find by type ID
    Optional<DocumentTypeReadModel> findByTypeId(String typeId);

    // Update document count
    @Modifying
    @Query("UPDATE DocumentTypeReadModel t SET t.documentCount = t.documentCount + 1 WHERE t.code = :code")
    void incrementDocumentCount(@Param("code") String code);

    // Decrement document count
    @Modifying
    @Query("UPDATE DocumentTypeReadModel t SET t.documentCount = CASE WHEN t.documentCount > 0 THEN t.documentCount - 1 ELSE 0 END WHERE t.code = :code")
    void decrementDocumentCount(@Param("code") String code);

    // Search by name
    @Query("""
        SELECT t FROM DocumentTypeReadModel t
        WHERE t.isActive = true
        AND (LOWER(t.nameEs) LIKE LOWER(CONCAT('%', :searchText, '%'))
             OR LOWER(t.nameEn) LIKE LOWER(CONCAT('%', :searchText, '%')))
        ORDER BY t.nameEs
        """)
    List<DocumentTypeReadModel> searchByName(@Param("searchText") String searchText);
}
