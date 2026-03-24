package com.globalcmx.api.document.repository;

import com.globalcmx.api.document.entity.DocumentEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for document operations with filtering and search capabilities.
 */
@Repository
public interface DocumentRepository extends JpaRepository<DocumentEntity, String>, JpaSpecificationExecutor<DocumentEntity> {

    // Find by operation
    List<DocumentEntity> findByOperationIdAndIsDeletedFalseOrderByUploadedAtDesc(String operationId);

    Page<DocumentEntity> findByOperationIdAndIsDeletedFalse(String operationId, Pageable pageable);

    // Find by event
    List<DocumentEntity> findByEventIdAndIsDeletedFalseOrderByUploadedAtDesc(String eventId);

    // Find by alert
    List<DocumentEntity> findByAlertIdAndIsDeletedFalseOrderByUploadedAtDesc(String alertId);

    // Find by category
    List<DocumentEntity> findByCategoryCodeAndIsDeletedFalseOrderByUploadedAtDesc(String categoryCode);

    // Find by document type
    List<DocumentEntity> findByDocumentTypeCodeAndIsDeletedFalseOrderByUploadedAtDesc(String documentTypeCode);

    // Find latest version only
    List<DocumentEntity> findByOperationIdAndIsLatestTrueAndIsDeletedFalseOrderByUploadedAtDesc(String operationId);

    // Find all versions of a document (by tracking previous versions)
    @Query("SELECT d FROM DocumentEntity d WHERE d.documentId = :documentId OR d.previousVersionId = :documentId ORDER BY d.version DESC")
    List<DocumentEntity> findAllVersions(@Param("documentId") String documentId);

    // Find previous versions chain
    @Query(value = """
        WITH RECURSIVE version_chain AS (
            SELECT * FROM documents WHERE document_id = :documentId
            UNION ALL
            SELECT d.* FROM documents d
            INNER JOIN version_chain vc ON d.document_id = vc.previous_version_id
        )
        SELECT * FROM version_chain ORDER BY version DESC
        """, nativeQuery = true)
    List<DocumentEntity> findVersionChain(@Param("documentId") String documentId);

    // Count by operation
    long countByOperationIdAndIsDeletedFalse(String operationId);

    // Count by category
    long countByCategoryCodeAndIsDeletedFalse(String categoryCode);

    // Search by filename
    List<DocumentEntity> findByOriginalFileNameContainingIgnoreCaseAndIsDeletedFalse(String filename);

    // Find by storage provider
    List<DocumentEntity> findByStorageProviderAndIsDeletedFalse(DocumentEntity.StorageProvider storageProvider);

    // Find by access level
    List<DocumentEntity> findByAccessLevelAndIsDeletedFalse(DocumentEntity.AccessLevel accessLevel);

    // Find documents uploaded in date range
    List<DocumentEntity> findByUploadedAtBetweenAndIsDeletedFalseOrderByUploadedAtDesc(
            LocalDateTime from, LocalDateTime to);

    // Soft delete
    @Modifying
    @Query("UPDATE DocumentEntity d SET d.isDeleted = true, d.deletedBy = :deletedBy, d.deletedAt = :deletedAt WHERE d.documentId = :documentId")
    void softDelete(@Param("documentId") String documentId,
                    @Param("deletedBy") String deletedBy,
                    @Param("deletedAt") LocalDateTime deletedAt);

    // Restore soft deleted
    @Modifying
    @Query("UPDATE DocumentEntity d SET d.isDeleted = false, d.deletedBy = null, d.deletedAt = null WHERE d.documentId = :documentId")
    void restore(@Param("documentId") String documentId);

    // Mark previous version as not latest
    @Modifying
    @Query("UPDATE DocumentEntity d SET d.isLatest = false WHERE d.documentId = :documentId")
    void markAsNotLatest(@Param("documentId") String documentId);

    // Statistics queries
    @Query("SELECT d.categoryCode, COUNT(d) FROM DocumentEntity d WHERE d.isDeleted = false GROUP BY d.categoryCode")
    List<Object[]> countByCategory();

    @Query("SELECT d.documentTypeCode, COUNT(d) FROM DocumentEntity d WHERE d.isDeleted = false GROUP BY d.documentTypeCode")
    List<Object[]> countByDocumentType();

    @Query("SELECT d.storageProvider, COUNT(d), SUM(d.fileSize) FROM DocumentEntity d WHERE d.isDeleted = false GROUP BY d.storageProvider")
    List<Object[]> countAndSizeByStorageProvider();

    @Query("SELECT SUM(d.fileSize) FROM DocumentEntity d WHERE d.isDeleted = false")
    Long getTotalStorageUsed();

    // Find by checksum (for duplicate detection)
    Optional<DocumentEntity> findByChecksumAndIsDeletedFalse(String checksum);

    // Complex search with multiple criteria
    @Query("SELECT d FROM DocumentEntity d WHERE d.isDeleted = false " +
           "AND (:operationId IS NULL OR d.operationId = :operationId) " +
           "AND (:eventId IS NULL OR d.eventId = :eventId) " +
           "AND (:categoryCode IS NULL OR d.categoryCode = :categoryCode) " +
           "AND (:documentTypeCode IS NULL OR d.documentTypeCode = :documentTypeCode) " +
           "AND (:uploadedBy IS NULL OR d.uploadedBy = :uploadedBy) " +
           "AND (:mimeType IS NULL OR d.mimeType LIKE CONCAT('%', :mimeType, '%')) " +
           "AND (:searchText IS NULL OR LOWER(d.originalFileName) LIKE LOWER(CONCAT('%', :searchText, '%')))" +
           "ORDER BY d.uploadedAt DESC")
    Page<DocumentEntity> searchDocuments(
            @Param("operationId") String operationId,
            @Param("eventId") String eventId,
            @Param("categoryCode") String categoryCode,
            @Param("documentTypeCode") String documentTypeCode,
            @Param("uploadedBy") String uploadedBy,
            @Param("mimeType") String mimeType,
            @Param("searchText") String searchText,
            Pageable pageable);
}
