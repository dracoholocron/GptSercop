package com.globalcmx.api.document.service;

import com.globalcmx.api.document.dto.*;
import com.globalcmx.api.document.entity.*;
import com.globalcmx.api.document.entity.DocumentEntity.AccessLevel;
import com.globalcmx.api.document.entity.DocumentEntity.StorageProvider;
import com.globalcmx.api.document.repository.*;
import com.globalcmx.api.document.storage.CloudStorageFactory;
import com.globalcmx.api.document.storage.CloudStorageService;
import com.globalcmx.api.readmodel.entity.*;
import com.globalcmx.api.readmodel.repository.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for document management operations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    // Write model repositories
    private final DocumentRepository documentRepository;
    private final DocumentCategoryRepository categoryRepository;
    private final DocumentTypeRepository typeRepository;
    private final DocumentAccessLogRepository accessLogRepository;

    // Read model repositories (CQRS)
    private final DocumentReadModelRepository documentReadModelRepository;
    private final DocumentCategoryReadModelRepository categoryReadModelRepository;
    private final DocumentTypeReadModelRepository typeReadModelRepository;

    // Services
    private final CloudStorageFactory storageFactory;
    private final DocumentReadModelProjector projector;
    private final ObjectMapper objectMapper;

    @Value("${documents.storage.max-file-size:52428800}")
    private long maxFileSize; // 50 MB default

    @Value("${server.servlet.context-path:}")
    private String contextPath;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    // ==================== Document CRUD ====================

    /**
     * Upload a new document.
     */
    @Transactional
    public DocumentResponse uploadDocument(MultipartFile file, UploadDocumentRequest request, String userId) {
        validateFile(file, request.getDocumentTypeCode());

        String documentId = UUID.randomUUID().toString();
        String storedFileName = documentId + getFileExtension(file.getOriginalFilename());
        String storagePath = buildStoragePath(request.getCategoryCode(), storedFileName);

        // Get the storage service
        CloudStorageService storage = storageFactory.getDefaultStorage();
        StorageProvider provider = storage.getProvider();

        try {
            // Upload file to storage
            String fullPath = storage.upload(
                    file.getInputStream(),
                    storagePath,
                    file.getContentType(),
                    file.getSize()
            );

            // Calculate checksum
            String checksum = calculateChecksum(file);

            // Build the document entity
            DocumentEntity document = DocumentEntity.builder()
                    .documentId(documentId)
                    .operationId(request.getOperationId())
                    .eventId(request.getEventId())
                    .alertId(request.getAlertId())
                    .aggregateId(request.getOperationId() != null ? request.getOperationId() :
                                 request.getEventId() != null ? request.getEventId() :
                                 request.getAlertId())
                    .aggregateType(request.getOperationId() != null ?
                            DocumentEntity.AggregateType.OPERATION :
                            request.getEventId() != null ?
                            DocumentEntity.AggregateType.EVENT :
                            DocumentEntity.AggregateType.ALERT)
                    .originalFileName(file.getOriginalFilename())
                    .storedFileName(storedFileName)
                    .storagePath(fullPath)
                    .storageProvider(provider)
                    .mimeType(file.getContentType())
                    .fileSize(file.getSize())
                    .checksum(checksum)
                    .categoryCode(request.getCategoryCode())
                    .subcategoryCode(request.getSubcategoryCode())
                    .documentTypeCode(request.getDocumentTypeCode())
                    .tags(serializeTags(request.getTags()))
                    .version(1)
                    .isLatest(true)
                    .accessLevel(parseAccessLevel(request.getAccessLevel()))
                    .changeNotes(request.getChangeNotes())
                    .uploadedBy(userId)
                    .uploadedAt(LocalDateTime.now())
                    .isDeleted(false)
                    .build();

            document = documentRepository.save(document);

            // Project to read model (CQRS)
            projector.projectDocument(document);

            // Log the upload
            logAccess(documentId, userId, DocumentAccessLogEntity.DocumentAction.UPLOAD, null);

            log.info("Document uploaded: {} by user {}", documentId, userId);
            return DocumentResponse.fromEntity(document, getBaseUrl());

        } catch (IOException e) {
            log.error("Failed to upload document", e);
            throw new RuntimeException("Failed to upload document: " + e.getMessage(), e);
        }
    }

    /**
     * Get document by ID - Uses READ MODEL for query (CQRS).
     */
    @Transactional(readOnly = true)
    public DocumentResponse getDocument(String documentId, String userId) {
        // Query from read model
        DocumentReadModel readModel = documentReadModelRepository.findByDocumentId(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found: " + documentId));

        // Record view in read model
        projector.recordView(documentId);

        // Log the view
        logAccess(documentId, userId, DocumentAccessLogEntity.DocumentAction.VIEW, null);

        return DocumentResponse.fromReadModel(readModel, getBaseUrl());
    }

    /**
     * Download document content - Uses WRITE MODEL for file access but records in read model.
     */
    @Transactional(readOnly = true)
    public InputStream downloadDocument(String documentId, String userId) {
        DocumentEntity document = findDocumentOrThrow(documentId);

        CloudStorageService storage = storageFactory.getStorage(document.getStorageProvider());
        InputStream inputStream = storage.download(document.getStoragePath());

        // Record download in read model
        projector.recordDownload(documentId);

        // Log the download
        logAccess(documentId, userId, DocumentAccessLogEntity.DocumentAction.DOWNLOAD, null);

        return inputStream;
    }

    /**
     * Get documents with filters - Uses READ MODEL (CQRS).
     */
    @Transactional(readOnly = true)
    public Page<DocumentResponse> getDocuments(
            String operationId,
            String eventId,
            String categoryCode,
            String documentTypeCode,
            String uploadedBy,
            String mimeType,
            String searchText,
            Pageable pageable) {

        // Query from read model
        Page<DocumentReadModel> documents = documentReadModelRepository.searchDocuments(
                operationId, eventId, categoryCode, documentTypeCode,
                uploadedBy, mimeType, searchText, pageable);

        return documents.map(doc -> DocumentResponse.fromReadModel(doc, getBaseUrl()));
    }

    /**
     * Get documents by operation - Uses READ MODEL (CQRS).
     */
    @Transactional(readOnly = true)
    public List<DocumentResponse> getDocumentsByOperation(String operationId) {
        return documentReadModelRepository.findByOperationIdAndIsLatestTrueOrderByUploadedAtDesc(operationId)
                .stream()
                .map(doc -> DocumentResponse.fromReadModel(doc, getBaseUrl()))
                .collect(Collectors.toList());
    }

    /**
     * Get documents by alert - Uses READ MODEL (CQRS).
     */
    @Transactional(readOnly = true)
    public List<DocumentResponse> getDocumentsByAlert(String alertId) {
        return documentReadModelRepository.findByAlertIdAndIsLatestTrueOrderByUploadedAtDesc(alertId)
                .stream()
                .map(doc -> DocumentResponse.fromReadModel(doc, getBaseUrl()))
                .collect(Collectors.toList());
    }

    /**
     * Soft delete a document - Updates both WRITE and READ models.
     */
    @Transactional
    public void deleteDocument(String documentId, String userId) {
        DocumentEntity document = findDocumentOrThrow(documentId);

        // Soft delete in write model
        documentRepository.softDelete(documentId, userId, LocalDateTime.now());

        // Remove from read model
        projector.removeDocument(documentId, document.getCategoryCode(), document.getDocumentTypeCode());

        logAccess(documentId, userId, DocumentAccessLogEntity.DocumentAction.DELETE, null);
        log.info("Document soft deleted: {} by user {}", documentId, userId);
    }

    /**
     * Restore a deleted document - Re-projects to read model.
     */
    @Transactional
    public DocumentResponse restoreDocument(String documentId, String userId) {
        DocumentEntity document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found: " + documentId));

        if (!document.getIsDeleted()) {
            throw new RuntimeException("Document is not deleted");
        }

        documentRepository.restore(documentId);

        // Re-project to read model
        document.setIsDeleted(false);
        projector.projectDocument(document);

        logAccess(documentId, userId, DocumentAccessLogEntity.DocumentAction.RESTORE, null);

        log.info("Document restored: {} by user {}", documentId, userId);
        return getDocument(documentId, userId);
    }

    // ==================== Version Management ====================

    /**
     * Upload a new version of a document.
     */
    @Transactional
    public DocumentResponse uploadNewVersion(String documentId, MultipartFile file, String changeNotes, String userId) {
        DocumentEntity currentVersion = findDocumentOrThrow(documentId);

        validateFile(file, currentVersion.getDocumentTypeCode());

        // Mark current version as not latest
        documentRepository.markAsNotLatest(documentId);

        // Create new version
        String newDocumentId = UUID.randomUUID().toString();
        String storedFileName = newDocumentId + getFileExtension(file.getOriginalFilename());
        String storagePath = buildStoragePath(currentVersion.getCategoryCode(), storedFileName);

        CloudStorageService storage = storageFactory.getStorage(currentVersion.getStorageProvider());

        try {
            String fullPath = storage.upload(
                    file.getInputStream(),
                    storagePath,
                    file.getContentType(),
                    file.getSize()
            );

            String checksum = calculateChecksum(file);

            DocumentEntity newVersion = DocumentEntity.builder()
                    .documentId(newDocumentId)
                    .operationId(currentVersion.getOperationId())
                    .eventId(currentVersion.getEventId())
                    .aggregateId(currentVersion.getAggregateId())
                    .aggregateType(currentVersion.getAggregateType())
                    .originalFileName(file.getOriginalFilename())
                    .storedFileName(storedFileName)
                    .storagePath(fullPath)
                    .storageProvider(currentVersion.getStorageProvider())
                    .mimeType(file.getContentType())
                    .fileSize(file.getSize())
                    .checksum(checksum)
                    .categoryCode(currentVersion.getCategoryCode())
                    .subcategoryCode(currentVersion.getSubcategoryCode())
                    .documentTypeCode(currentVersion.getDocumentTypeCode())
                    .tags(currentVersion.getTags())
                    .version(currentVersion.getVersion() + 1)
                    .previousVersionId(documentId)
                    .isLatest(true)
                    .accessLevel(currentVersion.getAccessLevel())
                    .changeNotes(changeNotes)
                    .uploadedBy(userId)
                    .uploadedAt(LocalDateTime.now())
                    .isDeleted(false)
                    .build();

            newVersion = documentRepository.save(newVersion);

            // Project to read model with version chain update (CQRS)
            projector.projectNewVersion(newVersion, documentId);

            logAccess(newDocumentId, userId, DocumentAccessLogEntity.DocumentAction.VERSION,
                    Map.of("previousVersion", documentId));

            log.info("New version {} uploaded for document {} by user {}",
                    newVersion.getVersion(), documentId, userId);

            return DocumentResponse.fromEntity(newVersion, getBaseUrl());

        } catch (IOException e) {
            // Rollback the isLatest change
            throw new RuntimeException("Failed to upload new version: " + e.getMessage(), e);
        }
    }

    /**
     * Get all versions of a document.
     */
    @Transactional(readOnly = true)
    public List<DocumentVersionResponse> getVersions(String documentId) {
        // Find the latest version first
        DocumentEntity document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found: " + documentId));

        // Get version chain
        List<DocumentEntity> versions = new ArrayList<>();
        versions.add(document);

        // Walk back through previous versions
        String previousId = document.getPreviousVersionId();
        while (previousId != null) {
            Optional<DocumentEntity> prev = documentRepository.findById(previousId);
            if (prev.isPresent()) {
                versions.add(prev.get());
                previousId = prev.get().getPreviousVersionId();
            } else {
                break;
            }
        }

        // Also look for newer versions
        documentRepository.findAll().stream()
                .filter(d -> documentId.equals(d.getPreviousVersionId()))
                .forEach(versions::add);

        return versions.stream()
                .sorted((a, b) -> b.getVersion().compareTo(a.getVersion()))
                .map(v -> DocumentVersionResponse.fromEntity(v, getBaseUrl()))
                .collect(Collectors.toList());
    }

    // ==================== Categories & Types ====================

    /**
     * Get all active categories with hierarchy - Uses READ MODEL (CQRS).
     */
    @Transactional(readOnly = true)
    public List<DocumentCategoryResponse> getCategories() {
        List<DocumentCategoryReadModel> rootCategories =
                categoryReadModelRepository.findByParentCodeIsNullAndIsActiveTrueOrderByDisplayOrderAsc();

        return rootCategories.stream()
                .map(this::mapCategoryWithChildren)
                .collect(Collectors.toList());
    }

    /**
     * Get document types, optionally filtered by category - Uses READ MODEL (CQRS).
     */
    @Transactional(readOnly = true)
    public List<DocumentTypeResponse> getDocumentTypes(String categoryCode) {
        List<DocumentTypeReadModel> types;
        if (categoryCode != null && !categoryCode.isEmpty()) {
            types = typeReadModelRepository.findByCategoryCodeAndIsActiveTrueOrderByNameEsAsc(categoryCode);
        } else {
            types = typeReadModelRepository.findByIsActiveTrueOrderByCategoryCodeAscNameEsAsc();
        }
        return types.stream()
                .map(DocumentTypeResponse::fromReadModel)
                .collect(Collectors.toList());
    }

    // ==================== Audit Log ====================

    /**
     * Get audit log for a document.
     */
    @Transactional(readOnly = true)
    public List<DocumentAccessLogEntity> getAuditLog(String documentId) {
        return accessLogRepository.findByDocumentIdOrderByAccessedAtDesc(documentId);
    }

    // ==================== Helper Methods ====================

    private DocumentEntity findDocumentOrThrow(String documentId) {
        return documentRepository.findById(documentId)
                .filter(doc -> !doc.getIsDeleted())
                .orElseThrow(() -> new RuntimeException("Document not found: " + documentId));
    }

    private void validateFile(MultipartFile file, String documentTypeCode) {
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }

        if (file.getSize() > maxFileSize) {
            throw new RuntimeException("File size exceeds maximum allowed: " + (maxFileSize / 1024 / 1024) + " MB");
        }

        // "OTHER" type accepts any file - skip MIME validation
        if ("OTHER".equalsIgnoreCase(documentTypeCode)) {
            return;
        }

        // Check allowed MIME types for the document type - Uses READ MODEL (CQRS)
        Optional<DocumentTypeReadModel> docType = typeReadModelRepository.findByCode(documentTypeCode);
        if (docType.isPresent() && docType.get().getAllowedMimeTypes() != null) {
            String allowedTypes = docType.get().getAllowedMimeTypes();
            if (allowedTypes.isBlank() || "null".equalsIgnoreCase(allowedTypes.trim())) {
                return; // No restrictions
            }
            String contentType = file.getContentType();
            if (contentType != null && !allowedTypes.contains(contentType)) {
                throw new RuntimeException("File type not allowed for this document type: " + contentType);
            }
        }
    }

    private String buildStoragePath(String categoryCode, String fileName) {
        return String.format("%s/%s/%s",
                categoryCode.toLowerCase(),
                LocalDateTime.now().getYear(),
                fileName);
    }

    private String getFileExtension(String filename) {
        if (filename == null) return "";
        int lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(lastDot) : "";
    }

    private String calculateChecksum(MultipartFile file) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(file.getBytes());
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException | IOException e) {
            log.warn("Failed to calculate checksum", e);
            return null;
        }
    }

    private String serializeTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(tags);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private AccessLevel parseAccessLevel(String level) {
        if (level == null) return AccessLevel.RESTRICTED;
        try {
            return AccessLevel.valueOf(level.toUpperCase());
        } catch (IllegalArgumentException e) {
            return AccessLevel.RESTRICTED;
        }
    }

    private void logAccess(String documentId, String userId, DocumentAccessLogEntity.DocumentAction action,
                          Map<String, Object> details) {
        try {
            DocumentAccessLogEntity log = DocumentAccessLogEntity.builder()
                    .logId(UUID.randomUUID().toString())
                    .documentId(documentId)
                    .userId(userId)
                    .action(action)
                    .accessedAt(LocalDateTime.now())
                    .details(details != null ? objectMapper.writeValueAsString(details) : null)
                    .build();
            accessLogRepository.save(log);
        } catch (Exception e) {
            // Don't fail the main operation if logging fails
            log.warn("Failed to log document access", e);
        }
    }

    private DocumentCategoryResponse mapCategoryWithChildren(DocumentCategoryReadModel category) {
        DocumentCategoryResponse response = DocumentCategoryResponse.fromReadModel(category);

        List<DocumentCategoryReadModel> children =
                categoryReadModelRepository.findByParentCodeAndIsActiveTrueOrderByDisplayOrderAsc(category.getCode());

        if (!children.isEmpty()) {
            response.setChildren(children.stream()
                    .map(this::mapCategoryWithChildren)
                    .collect(Collectors.toList()));
        }

        return response;
    }

    private String getBaseUrl() {
        // Use relative URLs so the frontend can resolve them against its own origin.
        // This avoids CORS issues when the backend's app.base-url is localhost
        // but the frontend runs on a different host (e.g., production/staging).
        return contextPath != null ? contextPath : "";
    }

    /**
     * Check if a document's physical file exists in storage.
     *
     * @param storagePath The storage path from the document record
     * @param storageProviderName The storage provider name (LOCAL, S3, etc.)
     * @return true if the file exists, false otherwise
     */
    public boolean checkFileExists(String storagePath, String storageProviderName) {
        if (storagePath == null || storagePath.isEmpty()) {
            return false;
        }

        try {
            StorageProvider provider = storageProviderName != null
                    ? StorageProvider.valueOf(storageProviderName)
                    : StorageProvider.LOCAL;

            CloudStorageService storage = storageFactory.getStorage(provider);
            return storage.exists(storagePath);
        } catch (Exception e) {
            log.warn("Failed to check file existence for path: {}", storagePath, e);
            return false;
        }
    }

    /**
     * Get documents with filters, excluding those whose physical files don't exist.
     * Uses READ MODEL (CQRS) with file existence validation.
     */
    @Transactional(readOnly = true)
    public Page<DocumentResponse> getDocumentsWithFileValidation(
            String operationId,
            String eventId,
            String categoryCode,
            String documentTypeCode,
            String uploadedBy,
            String mimeType,
            String searchText,
            Pageable pageable) {

        // Query from read model
        Page<DocumentReadModel> documents = documentReadModelRepository.searchDocuments(
                operationId, eventId, categoryCode, documentTypeCode,
                uploadedBy, mimeType, searchText, pageable);

        // Filter out documents whose files don't exist and convert to response
        List<DocumentResponse> validDocuments = documents.getContent().stream()
                .filter(doc -> {
                    boolean exists = checkFileExists(doc.getStoragePath(), doc.getStorageProvider());
                    if (!exists) {
                        log.warn("Document {} has missing file: {}", doc.getDocumentId(), doc.getStoragePath());
                    }
                    return exists;
                })
                .map(doc -> DocumentResponse.fromReadModel(doc, getBaseUrl()))
                .collect(Collectors.toList());

        // Return as page (note: total count will still include orphaned documents)
        return new org.springframework.data.domain.PageImpl<>(
                validDocuments,
                pageable,
                documents.getTotalElements()
        );
    }
}
