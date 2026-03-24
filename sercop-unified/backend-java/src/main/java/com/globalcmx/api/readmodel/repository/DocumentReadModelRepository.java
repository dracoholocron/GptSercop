package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.DocumentReadModel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for document read model queries - optimized for read operations.
 */
@Repository
public interface DocumentReadModelRepository extends JpaRepository<DocumentReadModel, String> {

    // Find by operation
    List<DocumentReadModel> findByOperationIdAndIsLatestTrueOrderByUploadedAtDesc(String operationId);

    // Find by event
    List<DocumentReadModel> findByEventIdAndIsLatestTrueOrderByUploadedAtDesc(String eventId);

    // Find by alert
    List<DocumentReadModel> findByAlertIdAndIsLatestTrueOrderByUploadedAtDesc(String alertId);

    // Find by category
    List<DocumentReadModel> findByCategoryCodeAndIsLatestTrueOrderByUploadedAtDesc(String categoryCode);

    // Find by document type
    List<DocumentReadModel> findByDocumentTypeCodeAndIsLatestTrueOrderByUploadedAtDesc(String documentTypeCode);

    // Search with multiple filters
    @Query("""
        SELECT d FROM DocumentReadModel d
        WHERE d.isLatest = true
        AND (:operationId IS NULL OR d.operationId = :operationId)
        AND (:eventId IS NULL OR d.eventId = :eventId)
        AND (:categoryCode IS NULL OR d.categoryCode = :categoryCode)
        AND (:documentTypeCode IS NULL OR d.documentTypeCode = :documentTypeCode)
        AND (:uploadedBy IS NULL OR d.uploadedBy = :uploadedBy)
        AND (:mimeType IS NULL OR d.mimeType LIKE CONCAT(:mimeType, '%'))
        AND (:searchText IS NULL OR
             LOWER(d.originalFileName) LIKE LOWER(CONCAT('%', :searchText, '%')) OR
             LOWER(d.categoryNameEs) LIKE LOWER(CONCAT('%', :searchText, '%')) OR
             LOWER(d.categoryNameEn) LIKE LOWER(CONCAT('%', :searchText, '%')) OR
             LOWER(d.documentTypeNameEs) LIKE LOWER(CONCAT('%', :searchText, '%')) OR
             LOWER(d.documentTypeNameEn) LIKE LOWER(CONCAT('%', :searchText, '%')))
        ORDER BY d.uploadedAt DESC
        """)
    Page<DocumentReadModel> searchDocuments(
            @Param("operationId") String operationId,
            @Param("eventId") String eventId,
            @Param("categoryCode") String categoryCode,
            @Param("documentTypeCode") String documentTypeCode,
            @Param("uploadedBy") String uploadedBy,
            @Param("mimeType") String mimeType,
            @Param("searchText") String searchText,
            Pageable pageable);

    // Count documents by operation
    long countByOperationIdAndIsLatestTrue(String operationId);

    // Count documents by category
    long countByCategoryCodeAndIsLatestTrue(String categoryCode);

    // Count documents by type
    long countByDocumentTypeCodeAndIsLatestTrue(String documentTypeCode);

    // Find all versions of a document
    @Query("""
        SELECT d FROM DocumentReadModel d
        WHERE d.operationId = (SELECT d2.operationId FROM DocumentReadModel d2 WHERE d2.documentId = :documentId)
        AND d.originalFileName = (SELECT d2.originalFileName FROM DocumentReadModel d2 WHERE d2.documentId = :documentId)
        ORDER BY d.version DESC
        """)
    List<DocumentReadModel> findVersionChain(@Param("documentId") String documentId);

    // Update view count
    @Modifying
    @Query("UPDATE DocumentReadModel d SET d.viewCount = d.viewCount + 1 WHERE d.documentId = :documentId")
    void incrementViewCount(@Param("documentId") String documentId);

    // Update download count
    @Modifying
    @Query("UPDATE DocumentReadModel d SET d.downloadCount = d.downloadCount + 1 WHERE d.documentId = :documentId")
    void incrementDownloadCount(@Param("documentId") String documentId);

    // Delete by document ID
    void deleteByDocumentId(String documentId);

    // Find by document ID
    Optional<DocumentReadModel> findByDocumentId(String documentId);

    // Bulk update isLatest
    @Modifying
    @Query("UPDATE DocumentReadModel d SET d.isLatest = false WHERE d.documentId = :documentId")
    void markAsNotLatest(@Param("documentId") String documentId);
}
