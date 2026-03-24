package com.globalcmx.api.document.controller;

import com.globalcmx.api.document.dto.*;
import com.globalcmx.api.document.entity.DocumentAccessLogEntity;
import com.globalcmx.api.document.entity.DocumentEntity;
import com.globalcmx.api.document.repository.DocumentRepository;
import com.globalcmx.api.document.service.DocumentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for document management operations.
 */
@RestController
@RequestMapping("/v1/documents")
@RequiredArgsConstructor
@Slf4j
public class DocumentController {

    private final DocumentService documentService;
    private final DocumentRepository documentRepository;

    // ==================== Document CRUD ====================

    /**
     * Upload a new document.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "operationId", required = false) String operationId,
            @RequestParam(value = "eventId", required = false) String eventId,
            @RequestParam(value = "alertId", required = false) String alertId,
            @RequestParam("categoryCode") String categoryCode,
            @RequestParam(value = "subcategoryCode", required = false) String subcategoryCode,
            @RequestParam("documentTypeCode") String documentTypeCode,
            @RequestParam(value = "tags", required = false) List<String> tags,
            @RequestParam(value = "accessLevel", required = false) String accessLevel,
            @RequestParam(value = "changeNotes", required = false) String changeNotes,
            Authentication authentication) {

        try {
            String userId = getUserId(authentication);

            UploadDocumentRequest request = UploadDocumentRequest.builder()
                    .operationId(operationId)
                    .eventId(eventId)
                    .alertId(alertId)
                    .categoryCode(categoryCode)
                    .subcategoryCode(subcategoryCode)
                    .documentTypeCode(documentTypeCode)
                    .tags(tags)
                    .accessLevel(accessLevel)
                    .changeNotes(changeNotes)
                    .build();

            DocumentResponse response = documentService.uploadDocument(file, request, userId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", response,
                    "message", "Document uploaded successfully"
            ));
        } catch (Exception e) {
            log.error("Error uploading document", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Get document metadata by ID.
     */
    @GetMapping("/{documentId}")
    public ResponseEntity<Map<String, Object>> getDocument(
            @PathVariable String documentId,
            Authentication authentication) {

        try {
            String userId = getUserId(authentication);
            DocumentResponse response = documentService.getDocument(documentId, userId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", response
            ));
        } catch (Exception e) {
            log.error("Error getting document: {}", documentId, e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Download document content.
     */
    @GetMapping("/{documentId}/download")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable String documentId,
            Authentication authentication) {

        try {
            String userId = getUserId(authentication);

            // Get document metadata first
            DocumentEntity document = documentRepository.findById(documentId)
                    .orElseThrow(() -> new RuntimeException("Document not found"));

            InputStream inputStream = documentService.downloadDocument(documentId, userId);

            // Encode filename for Content-Disposition header
            String encodedFilename = URLEncoder.encode(document.getOriginalFileName(), StandardCharsets.UTF_8)
                    .replace("+", "%20");

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(document.getMimeType()))
                    .contentLength(document.getFileSize())
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + document.getOriginalFileName() + "\"; " +
                                    "filename*=UTF-8''" + encodedFilename)
                    .body(new InputStreamResource(inputStream));

        } catch (Exception e) {
            log.error("Error downloading document: {}", documentId, e);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Preview document (inline display).
     */
    @GetMapping("/{documentId}/preview")
    public ResponseEntity<Resource> previewDocument(
            @PathVariable String documentId,
            Authentication authentication) {

        try {
            String userId = getUserId(authentication);

            DocumentEntity document = documentRepository.findById(documentId)
                    .orElseThrow(() -> new RuntimeException("Document not found"));

            InputStream inputStream = documentService.downloadDocument(documentId, userId);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(document.getMimeType()))
                    .contentLength(document.getFileSize())
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                    .body(new InputStreamResource(inputStream));

        } catch (Exception e) {
            log.error("Error previewing document: {}", documentId, e);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Search documents with filters.
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getDocuments(
            @RequestParam(required = false) String operationId,
            @RequestParam(required = false) String eventId,
            @RequestParam(required = false) String categoryCode,
            @RequestParam(required = false) String documentTypeCode,
            @RequestParam(required = false) String uploadedBy,
            @RequestParam(required = false) String mimeType,
            @RequestParam(required = false) String searchText,
            Pageable pageable) {

        try {
            Page<DocumentResponse> documents = documentService.getDocuments(
                    operationId, eventId, categoryCode, documentTypeCode,
                    uploadedBy, mimeType, searchText, pageable);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", documents.getContent(),
                    "totalElements", documents.getTotalElements(),
                    "totalPages", documents.getTotalPages(),
                    "currentPage", documents.getNumber()
            ));
        } catch (Exception e) {
            log.error("Error searching documents", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Get documents by alert ID.
     */
    @GetMapping("/by-alert/{alertId}")
    public ResponseEntity<Map<String, Object>> getDocumentsByAlert(@PathVariable String alertId) {
        try {
            List<DocumentResponse> documents = documentService.getDocumentsByAlert(alertId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", documents
            ));
        } catch (Exception e) {
            log.error("Error getting documents for alert: {}", alertId, e);
            // Return empty list instead of error if table/column doesn't exist yet
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", List.of()
            ));
        }
    }

    /**
     * Delete document (soft delete).
     */
    @DeleteMapping("/{documentId}")
    public ResponseEntity<Map<String, Object>> deleteDocument(
            @PathVariable String documentId,
            Authentication authentication) {

        try {
            String userId = getUserId(authentication);
            documentService.deleteDocument(documentId, userId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Document deleted successfully"
            ));
        } catch (Exception e) {
            log.error("Error deleting document: {}", documentId, e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Restore a deleted document.
     */
    @PostMapping("/{documentId}/restore")
    public ResponseEntity<Map<String, Object>> restoreDocument(
            @PathVariable String documentId,
            Authentication authentication) {

        try {
            String userId = getUserId(authentication);
            DocumentResponse response = documentService.restoreDocument(documentId, userId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", response,
                    "message", "Document restored successfully"
            ));
        } catch (Exception e) {
            log.error("Error restoring document: {}", documentId, e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    // ==================== Version Management ====================

    /**
     * Get all versions of a document.
     */
    @GetMapping("/{documentId}/versions")
    public ResponseEntity<Map<String, Object>> getVersions(@PathVariable String documentId) {

        try {
            List<DocumentVersionResponse> versions = documentService.getVersions(documentId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", versions
            ));
        } catch (Exception e) {
            log.error("Error getting versions for document: {}", documentId, e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Upload a new version of a document.
     */
    @PostMapping(value = "/{documentId}/versions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadNewVersion(
            @PathVariable String documentId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "changeNotes", required = false) String changeNotes,
            Authentication authentication) {

        try {
            String userId = getUserId(authentication);
            DocumentResponse response = documentService.uploadNewVersion(documentId, file, changeNotes, userId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", response,
                    "message", "New version uploaded successfully"
            ));
        } catch (Exception e) {
            log.error("Error uploading new version for document: {}", documentId, e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    // ==================== Categories & Types ====================

    /**
     * Get all document categories.
     */
    @GetMapping("/categories")
    public ResponseEntity<Map<String, Object>> getCategories() {
        try {
            List<DocumentCategoryResponse> categories = documentService.getCategories();

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", categories
            ));
        } catch (Exception e) {
            log.error("Error getting categories", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Get document types, optionally filtered by category.
     */
    @GetMapping("/types")
    public ResponseEntity<Map<String, Object>> getDocumentTypes(
            @RequestParam(required = false) String categoryCode) {

        try {
            List<DocumentTypeResponse> types = documentService.getDocumentTypes(categoryCode);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", types
            ));
        } catch (Exception e) {
            log.error("Error getting document types", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    // ==================== Audit Log ====================

    /**
     * Get audit log for a document.
     */
    @GetMapping("/{documentId}/audit-log")
    public ResponseEntity<Map<String, Object>> getAuditLog(@PathVariable String documentId) {

        try {
            List<DocumentAccessLogEntity> logs = documentService.getAuditLog(documentId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", logs
            ));
        } catch (Exception e) {
            log.error("Error getting audit log for document: {}", documentId, e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    // ==================== Helper Methods ====================

    private String getUserId(Authentication authentication) {
        if (authentication == null) {
            return "anonymous";
        }
        return authentication.getName();
    }
}
