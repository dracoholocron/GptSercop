package com.globalcmx.api.document.repository;

import com.globalcmx.api.document.entity.DocumentAccessLogEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for document access audit logs.
 */
@Repository
public interface DocumentAccessLogRepository extends JpaRepository<DocumentAccessLogEntity, String> {

    // Find by document
    List<DocumentAccessLogEntity> findByDocumentIdOrderByAccessedAtDesc(String documentId);

    Page<DocumentAccessLogEntity> findByDocumentId(String documentId, Pageable pageable);

    // Find by user
    List<DocumentAccessLogEntity> findByUserIdOrderByAccessedAtDesc(String userId);

    Page<DocumentAccessLogEntity> findByUserId(String userId, Pageable pageable);

    // Find by action
    List<DocumentAccessLogEntity> findByActionOrderByAccessedAtDesc(DocumentAccessLogEntity.DocumentAction action);

    // Find by document and action
    List<DocumentAccessLogEntity> findByDocumentIdAndActionOrderByAccessedAtDesc(
            String documentId, DocumentAccessLogEntity.DocumentAction action);

    // Find by date range
    List<DocumentAccessLogEntity> findByAccessedAtBetweenOrderByAccessedAtDesc(
            LocalDateTime from, LocalDateTime to);

    // Find by document and date range
    List<DocumentAccessLogEntity> findByDocumentIdAndAccessedAtBetweenOrderByAccessedAtDesc(
            String documentId, LocalDateTime from, LocalDateTime to);

    // Count by action for a document
    long countByDocumentIdAndAction(String documentId, DocumentAccessLogEntity.DocumentAction action);

    // Statistics: most accessed documents
    @Query("SELECT dal.documentId, COUNT(dal) as accessCount " +
           "FROM DocumentAccessLogEntity dal " +
           "WHERE dal.accessedAt >= :since " +
           "GROUP BY dal.documentId " +
           "ORDER BY accessCount DESC")
    List<Object[]> findMostAccessedDocuments(@Param("since") LocalDateTime since, Pageable pageable);

    // Statistics: access by user
    @Query("SELECT dal.userId, dal.userName, COUNT(dal) as accessCount " +
           "FROM DocumentAccessLogEntity dal " +
           "WHERE dal.accessedAt >= :since " +
           "GROUP BY dal.userId, dal.userName " +
           "ORDER BY accessCount DESC")
    List<Object[]> findAccessByUser(@Param("since") LocalDateTime since, Pageable pageable);

    // Statistics: access by action type
    @Query("SELECT dal.action, COUNT(dal) as actionCount " +
           "FROM DocumentAccessLogEntity dal " +
           "WHERE dal.accessedAt >= :since " +
           "GROUP BY dal.action")
    List<Object[]> countByAction(@Param("since") LocalDateTime since);

    // Delete old logs (for cleanup)
    void deleteByAccessedAtBefore(LocalDateTime before);
}
