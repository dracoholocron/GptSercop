package com.globalcmx.api.document.service;

import com.globalcmx.api.document.entity.*;
import com.globalcmx.api.document.repository.*;
import com.globalcmx.api.readmodel.entity.*;
import com.globalcmx.api.readmodel.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Projector service that syncs document write models to read models.
 * Following CQRS pattern - projections are updated when commands are executed.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentReadModelProjector {

    private final DocumentReadModelRepository documentReadModelRepository;
    private final DocumentCategoryReadModelRepository categoryReadModelRepository;
    private final DocumentTypeReadModelRepository typeReadModelRepository;
    private final DocumentCategoryRepository categoryRepository;
    private final DocumentTypeRepository typeRepository;

    /**
     * Project a document entity to its read model.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void projectDocument(DocumentEntity document) {
        try {
            // Get category and type names for denormalization - use READ MODEL (CQRS)
            String categoryNameEs = null;
            String categoryNameEn = null;
            String typeNameEs = null;
            String typeNameEn = null;

            Optional<DocumentCategoryReadModel> category = categoryReadModelRepository.findByCode(document.getCategoryCode());
            if (category.isPresent()) {
                categoryNameEs = category.get().getNameEs();
                categoryNameEn = category.get().getNameEn();
            }

            Optional<DocumentTypeReadModel> docType = typeReadModelRepository.findByCode(document.getDocumentTypeCode());
            if (docType.isPresent()) {
                typeNameEs = docType.get().getNameEs();
                typeNameEn = docType.get().getNameEn();
            }

            DocumentReadModel readModel = DocumentReadModel.builder()
                    .documentId(document.getDocumentId())
                    .operationId(document.getOperationId())
                    .eventId(document.getEventId())
                    .alertId(document.getAlertId())
                    .originalFileName(document.getOriginalFileName())
                    .mimeType(document.getMimeType())
                    .fileSize(document.getFileSize())
                    .formattedFileSize(formatFileSize(document.getFileSize()))
                    .categoryCode(document.getCategoryCode())
                    .categoryNameEs(categoryNameEs)
                    .categoryNameEn(categoryNameEn)
                    .subcategoryCode(document.getSubcategoryCode())
                    .documentTypeCode(document.getDocumentTypeCode())
                    .documentTypeNameEs(typeNameEs)
                    .documentTypeNameEn(typeNameEn)
                    .tags(document.getTags())
                    .version(document.getVersion())
                    .isLatest(document.getIsLatest())
                    .changeNotes(document.getChangeNotes())
                    .accessLevel(document.getAccessLevel().name())
                    .storagePath(document.getStoragePath())
                    .storageProvider(document.getStorageProvider() != null ? document.getStorageProvider().name() : null)
                    .uploadedBy(document.getUploadedBy())
                    .uploadedAt(document.getUploadedAt())
                    .modifiedBy(document.getModifiedBy())
                    .modifiedAt(document.getModifiedAt())
                    .canPreview(isPreviewable(document.getMimeType()))
                    .downloadCount(0)
                    .viewCount(0)
                    .build();

            documentReadModelRepository.save(readModel);

            // Update category and type counts
            categoryReadModelRepository.incrementDocumentCount(document.getCategoryCode());
            typeReadModelRepository.incrementDocumentCount(document.getDocumentTypeCode());

            log.debug("Projected document to read model: {}", document.getDocumentId());
        } catch (Exception e) {
            log.error("Failed to project document to read model: {}", document.getDocumentId(), e);
        }
    }

    /**
     * Update document read model when version changes.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void projectNewVersion(DocumentEntity newVersion, String previousDocumentId) {
        try {
            // Mark previous version as not latest in read model
            documentReadModelRepository.markAsNotLatest(previousDocumentId);

            // Project the new version
            projectDocument(newVersion);

            log.debug("Projected new version {} of document {}", newVersion.getVersion(), previousDocumentId);
        } catch (Exception e) {
            log.error("Failed to project new version", e);
        }
    }

    /**
     * Remove document from read model (soft delete).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void removeDocument(String documentId, String categoryCode, String documentTypeCode) {
        try {
            documentReadModelRepository.deleteById(documentId);

            // Decrement counts
            categoryReadModelRepository.decrementDocumentCount(categoryCode);
            typeReadModelRepository.decrementDocumentCount(documentTypeCode);

            log.debug("Removed document from read model: {}", documentId);
        } catch (Exception e) {
            log.error("Failed to remove document from read model: {}", documentId, e);
        }
    }

    /**
     * Track view access.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordView(String documentId) {
        try {
            documentReadModelRepository.incrementViewCount(documentId);
        } catch (Exception e) {
            log.warn("Failed to record view for document: {}", documentId, e);
        }
    }

    /**
     * Track download access.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordDownload(String documentId) {
        try {
            documentReadModelRepository.incrementDownloadCount(documentId);
        } catch (Exception e) {
            log.warn("Failed to record download for document: {}", documentId, e);
        }
    }

    /**
     * Project a category entity to its read model.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void projectCategory(DocumentCategoryEntity category) {
        try {
            String parentCode = null;
            int level = 0;
            String fullPath = category.getNameEs();

            if (category.getParentCategoryId() != null) {
                Optional<DocumentCategoryEntity> parent = categoryRepository.findById(category.getParentCategoryId());
                if (parent.isPresent()) {
                    parentCode = parent.get().getCode();
                    Optional<DocumentCategoryReadModel> parentReadModel = categoryReadModelRepository.findByCode(parentCode);
                    if (parentReadModel.isPresent()) {
                        level = parentReadModel.get().getLevel() + 1;
                        fullPath = parentReadModel.get().getFullPath() + " > " + category.getNameEs();
                    }
                    // Mark parent as having children
                    categoryReadModelRepository.markAsHasChildren(parentCode);
                }
            }

            DocumentCategoryReadModel readModel = DocumentCategoryReadModel.builder()
                    .categoryId(category.getCategoryId())
                    .code(category.getCode())
                    .parentCode(parentCode)
                    .nameEs(category.getNameEs())
                    .nameEn(category.getNameEn())
                    .descriptionEs(category.getDescriptionEs())
                    .descriptionEn(category.getDescriptionEn())
                    .icon(category.getIcon())
                    .displayOrder(category.getDisplayOrder())
                    .isActive(category.getIsActive())
                    .documentCount(0)
                    .hasChildren(false)
                    .level(level)
                    .fullPath(fullPath)
                    .build();

            categoryReadModelRepository.save(readModel);
            log.debug("Projected category to read model: {}", category.getCode());
        } catch (Exception e) {
            log.error("Failed to project category to read model: {}", category.getCode(), e);
        }
    }

    /**
     * Project a document type entity to its read model.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void projectDocumentType(DocumentTypeEntity type) {
        try {
            String categoryNameEs = null;
            String categoryNameEn = null;

            Optional<DocumentCategoryEntity> category = categoryRepository.findByCode(type.getCategoryCode());
            if (category.isPresent()) {
                categoryNameEs = category.get().getNameEs();
                categoryNameEn = category.get().getNameEn();
            }

            DocumentTypeReadModel readModel = DocumentTypeReadModel.builder()
                    .typeId(type.getTypeId())
                    .code(type.getCode())
                    .categoryCode(type.getCategoryCode())
                    .categoryNameEs(categoryNameEs)
                    .categoryNameEn(categoryNameEn)
                    .nameEs(type.getNameEs())
                    .nameEn(type.getNameEn())
                    .allowedMimeTypes(type.getAllowedMimeTypes())
                    .maxFileSizeMb(type.getMaxFileSizeMb())
                    .requiresApproval(type.getRequiresApproval())
                    .isActive(type.getIsActive())
                    .documentCount(0)
                    .build();

            typeReadModelRepository.save(readModel);
            log.debug("Projected document type to read model: {}", type.getCode());
        } catch (Exception e) {
            log.error("Failed to project document type to read model: {}", type.getCode(), e);
        }
    }

    /**
     * Rebuild all read models from write models.
     * Use with caution - this is for maintenance/recovery.
     */
    @Transactional
    public void rebuildAllReadModels() {
        log.info("Starting full read model rebuild...");

        // Clear read models
        documentReadModelRepository.deleteAll();
        categoryReadModelRepository.deleteAll();
        typeReadModelRepository.deleteAll();

        // Rebuild categories
        categoryRepository.findAll().forEach(this::projectCategory);

        // Rebuild types
        typeRepository.findAll().forEach(this::projectDocumentType);

        log.info("Read model rebuild completed");
    }

    private boolean isPreviewable(String mimeType) {
        if (mimeType == null) return false;
        return mimeType.equals("application/pdf") ||
               mimeType.startsWith("image/") ||
               mimeType.startsWith("text/");
    }

    private String formatFileSize(Long bytes) {
        if (bytes == null) return "0 B";
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024));
        return String.format("%.1f GB", bytes / (1024.0 * 1024 * 1024));
    }
}
