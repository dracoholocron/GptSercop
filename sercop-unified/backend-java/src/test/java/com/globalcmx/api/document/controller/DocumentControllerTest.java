package com.globalcmx.api.document.controller;

import com.globalcmx.api.document.dto.*;
import com.globalcmx.api.document.entity.DocumentAccessLogEntity;
import com.globalcmx.api.document.entity.DocumentEntity;
import com.globalcmx.api.document.entity.DocumentEntity.StorageProvider;
import com.globalcmx.api.document.repository.DocumentRepository;
import com.globalcmx.api.document.service.DocumentService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.Authentication;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for DocumentController.
 * Tests REST endpoints for document management.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("DocumentController - Unit Tests")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class DocumentControllerTest {

    @Mock private DocumentService documentService;
    @Mock private DocumentRepository documentRepository;
    @Mock private Authentication authentication;

    private DocumentController controller;

    @BeforeEach
    void setUp() {
        controller = new DocumentController(documentService, documentRepository);
    }

    // ==================================================================================
    // 1. UPLOAD ENDPOINT TESTS
    // ==================================================================================

    @Nested
    @Order(1)
    @DisplayName("1. Upload Endpoint")
    class UploadEndpointTests {

        @Test
        @DisplayName("Should upload document successfully")
        void shouldUploadDocumentSuccessfully() {
            // Arrange
            MockMultipartFile file = new MockMultipartFile(
                    "file", "test.pdf", "application/pdf", "content".getBytes());
            DocumentResponse response = createDocumentResponse("doc-123");

            when(authentication.getName()).thenReturn("user@test.com");
            when(documentService.uploadDocument(any(), any(UploadDocumentRequest.class), anyString()))
                    .thenReturn(response);

            // Act
            ResponseEntity<Map<String, Object>> result = controller.uploadDocument(
                    file, "OP-2025-001", null, null, "FINANCIAL", null,
                    "COMMERCIAL_INVOICE", null, "RESTRICTED", null, authentication);

            // Assert
            assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(result.getBody()).containsEntry("success", true);
            assertThat(result.getBody()).containsKey("data");
        }

        @Test
        @DisplayName("Should return error when upload fails")
        void shouldReturnErrorWhenUploadFails() {
            // Arrange
            MockMultipartFile file = new MockMultipartFile(
                    "file", "test.pdf", "application/pdf", new byte[0]);

            when(authentication.getName()).thenReturn("user@test.com");
            when(documentService.uploadDocument(any(), any(), anyString()))
                    .thenThrow(new RuntimeException("File is empty"));

            // Act
            ResponseEntity<Map<String, Object>> result = controller.uploadDocument(
                    file, "OP-2025-001", null, null, "FINANCIAL", null,
                    "COMMERCIAL_INVOICE", null, null, null, authentication);

            // Assert
            assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(result.getBody()).containsEntry("success", false);
            assertThat(result.getBody().get("message").toString()).contains("File is empty");
        }

        @Test
        @DisplayName("Should handle anonymous user")
        void shouldHandleAnonymousUser() {
            // Arrange
            MockMultipartFile file = new MockMultipartFile(
                    "file", "test.pdf", "application/pdf", "content".getBytes());
            DocumentResponse response = createDocumentResponse("doc-123");

            when(documentService.uploadDocument(any(), any(), eq("anonymous")))
                    .thenReturn(response);

            // Act - null authentication
            ResponseEntity<Map<String, Object>> result = controller.uploadDocument(
                    file, "OP-2025-001", null, null, "FINANCIAL", null,
                    "COMMERCIAL_INVOICE", null, null, null, null);

            // Assert
            assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(documentService).uploadDocument(any(), any(), eq("anonymous"));
        }
    }

    // ==================================================================================
    // 2. GET DOCUMENT ENDPOINT TESTS
    // ==================================================================================

    @Nested
    @Order(2)
    @DisplayName("2. Get Document Endpoint")
    class GetDocumentEndpointTests {

        @Test
        @DisplayName("Should get document metadata successfully")
        void shouldGetDocumentMetadataSuccessfully() {
            // Arrange
            String documentId = "doc-123";
            DocumentResponse response = createDocumentResponse(documentId);

            when(authentication.getName()).thenReturn("user@test.com");
            when(documentService.getDocument(documentId, "user@test.com")).thenReturn(response);

            // Act
            ResponseEntity<Map<String, Object>> result = controller.getDocument(documentId, authentication);

            // Assert
            assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(result.getBody()).containsEntry("success", true);
            assertThat(result.getBody()).containsKey("data");
        }

        @Test
        @DisplayName("Should return error when document not found")
        void shouldReturnErrorWhenDocumentNotFound() {
            // Arrange
            when(authentication.getName()).thenReturn("user@test.com");
            when(documentService.getDocument(anyString(), anyString()))
                    .thenThrow(new RuntimeException("Document not found"));

            // Act
            ResponseEntity<Map<String, Object>> result = controller.getDocument("invalid", authentication);

            // Assert
            assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(result.getBody()).containsEntry("success", false);
        }
    }

    // ==================================================================================
    // 3. DOWNLOAD ENDPOINT TESTS
    // ==================================================================================

    @Nested
    @Order(3)
    @DisplayName("3. Download Endpoint")
    class DownloadEndpointTests {

        @Test
        @DisplayName("Should download document successfully")
        void shouldDownloadDocumentSuccessfully() {
            // Arrange
            String documentId = "doc-123";
            DocumentEntity document = createDocumentEntity(documentId);
            InputStream inputStream = new ByteArrayInputStream("file content".getBytes());

            when(authentication.getName()).thenReturn("user@test.com");
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
            when(documentService.downloadDocument(documentId, "user@test.com")).thenReturn(inputStream);

            // Act
            ResponseEntity<Resource> result = controller.downloadDocument(documentId, authentication);

            // Assert
            assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(result.getHeaders().getContentType().toString()).isEqualTo("application/pdf");
            assertThat(result.getHeaders().getContentDisposition().toString()).contains("attachment");
        }

        @Test
        @DisplayName("Should return not found when download fails")
        void shouldReturnNotFoundWhenDownloadFails() {
            // Arrange
            when(authentication.getName()).thenReturn("user@test.com");
            when(documentRepository.findById(anyString()))
                    .thenThrow(new RuntimeException("Document not found"));

            // Act
            ResponseEntity<Resource> result = controller.downloadDocument("invalid", authentication);

            // Assert
            assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        }
    }

    // ==================================================================================
    // 4. PREVIEW ENDPOINT TESTS
    // ==================================================================================

    @Nested
    @Order(4)
    @DisplayName("4. Preview Endpoint")
    class PreviewEndpointTests {

        @Test
        @DisplayName("Should preview document inline")
        void shouldPreviewDocumentInline() {
            // Arrange
            String documentId = "doc-123";
            DocumentEntity document = createDocumentEntity(documentId);
            InputStream inputStream = new ByteArrayInputStream("PDF content".getBytes());

            when(authentication.getName()).thenReturn("user@test.com");
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
            when(documentService.downloadDocument(documentId, "user@test.com")).thenReturn(inputStream);

            // Act
            ResponseEntity<Resource> result = controller.previewDocument(documentId, authentication);

            // Assert
            assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(result.getHeaders().getContentDisposition().toString()).isEqualTo("inline");
        }
    }

    // ==================================================================================
    // 5. SEARCH ENDPOINT TESTS
    // ==================================================================================

    @Nested
    @Order(5)
    @DisplayName("5. Search Endpoint")
    class SearchEndpointTests {

        @Test
        @DisplayName("Should search documents with filters")
        void shouldSearchDocumentsWithFilters() {
            // Arrange
            PageRequest pageable = PageRequest.of(0, 10);
            Page<DocumentResponse> page = new PageImpl<>(
                    List.of(createDocumentResponse("doc-1")),
                    pageable, 1
            );

            when(documentService.getDocuments(any(), any(), any(), any(), any(), any(), any(), any()))
                    .thenReturn(page);

            // Act
            ResponseEntity<Map<String, Object>> result = controller.getDocuments(
                    "OP-2025-001", null, "FINANCIAL", null, null, null, null, pageable);

            // Assert
            assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(result.getBody()).containsEntry("success", true);
            assertThat(result.getBody()).containsEntry("totalElements", 1L);
            assertThat(result.getBody()).containsEntry("totalPages", 1);
            assertThat(result.getBody()).containsKey("data");
        }

        @Test
        @DisplayName("Should return empty page when no documents found")
        void shouldReturnEmptyPageWhenNoDocumentsFound() {
            // Arrange
            PageRequest pageable = PageRequest.of(0, 10);
            Page<DocumentResponse> emptyPage = new PageImpl<>(List.of(), pageable, 0);

            when(documentService.getDocuments(any(), any(), any(), any(), any(), any(), any(), any()))
                    .thenReturn(emptyPage);

            // Act
            ResponseEntity<Map<String, Object>> result = controller.getDocuments(
                    null, null, null, null, null, null, null, pageable);

            // Assert
            assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(result.getBody()).containsEntry("totalElements", 0L);
            assertThat(((List<?>) result.getBody().get("data"))).isEmpty();
        }
    }

    // ==================================================================================
    // 6. DELETE ENDPOINT TESTS
    // ==================================================================================

    @Nested
    @Order(6)
    @DisplayName("6. Delete Endpoint")
    class DeleteEndpointTests {

        @Test
        @DisplayName("Should delete document successfully")
        void shouldDeleteDocumentSuccessfully() {
            // Arrange
            String documentId = "doc-123";
            when(authentication.getName()).thenReturn("user@test.com");
            doNothing().when(documentService).deleteDocument(documentId, "user@test.com");

            // Act
            ResponseEntity<Map<String, Object>> result = controller.deleteDocument(documentId, authentication);

            // Assert
            assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(result.getBody()).containsEntry("success", true);
            verify(documentService).deleteDocument(documentId, "user@test.com");
        }

        @Test
        @DisplayName("Should return error when delete fails")
        void shouldReturnErrorWhenDeleteFails() {
            // Arrange
            when(authentication.getName()).thenReturn("user@test.com");
            doThrow(new RuntimeException("Document not found"))
                    .when(documentService).deleteDocument(anyString(), anyString());

            // Act
            ResponseEntity<Map<String, Object>> result = controller.deleteDocument("invalid", authentication);

            // Assert
            assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(result.getBody()).containsEntry("success", false);
        }
    }

    // ==================================================================================
    // 7. RESTORE ENDPOINT TESTS
    // ==================================================================================

    @Nested
    @Order(7)
    @DisplayName("7. Restore Endpoint")
    class RestoreEndpointTests {

        @Test
        @DisplayName("Should restore document successfully")
        void shouldRestoreDocumentSuccessfully() {
            // Arrange
            String documentId = "doc-123";
            DocumentResponse response = createDocumentResponse(documentId);

            when(authentication.getName()).thenReturn("user@test.com");
            when(documentService.restoreDocument(documentId, "user@test.com")).thenReturn(response);

            // Act
            ResponseEntity<Map<String, Object>> result = controller.restoreDocument(documentId, authentication);

            // Assert
            assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(result.getBody()).containsEntry("success", true);
            assertThat(result.getBody().get("message").toString()).contains("restored");
        }
    }

    // ==================================================================================
    // 8. VERSION ENDPOINTS TESTS
    // ==================================================================================

    @Nested
    @Order(8)
    @DisplayName("8. Version Endpoints")
    class VersionEndpointTests {

        @Test
        @DisplayName("Should get version history")
        void shouldGetVersionHistory() {
            // Arrange
            String documentId = "doc-123";
            List<DocumentVersionResponse> versions = List.of(
                    DocumentVersionResponse.builder()
                            .documentId("doc-v2")
                            .version(2)
                            .isLatest(true)
                            .uploadedBy("user@test.com")
                            .uploadedAt(LocalDateTime.now())
                            .build(),
                    DocumentVersionResponse.builder()
                            .documentId("doc-v1")
                            .version(1)
                            .isLatest(false)
                            .uploadedBy("user@test.com")
                            .uploadedAt(LocalDateTime.now().minusDays(1))
                            .build()
            );

            when(documentService.getVersions(documentId)).thenReturn(versions);

            // Act
            ResponseEntity<Map<String, Object>> result = controller.getVersions(documentId);

            // Assert
            assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(result.getBody()).containsEntry("success", true);
            List<?> data = (List<?>) result.getBody().get("data");
            assertThat(data).hasSize(2);
        }

        @Test
        @DisplayName("Should upload new version")
        void shouldUploadNewVersion() {
            // Arrange
            String documentId = "doc-123";
            MockMultipartFile file = new MockMultipartFile(
                    "file", "test-v2.pdf", "application/pdf", "new content".getBytes());
            DocumentResponse response = createDocumentResponse("doc-v2");
            response.setVersion(2);

            when(authentication.getName()).thenReturn("user@test.com");
            when(documentService.uploadNewVersion(documentId, file, "Updated content", "user@test.com"))
                    .thenReturn(response);

            // Act
            ResponseEntity<Map<String, Object>> result = controller.uploadNewVersion(
                    documentId, file, "Updated content", authentication);

            // Assert
            assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(result.getBody()).containsEntry("success", true);
            assertThat(result.getBody().get("message").toString()).contains("version");
        }
    }

    // ==================================================================================
    // 9. CATEGORIES AND TYPES ENDPOINTS TESTS
    // ==================================================================================

    @Nested
    @Order(9)
    @DisplayName("9. Categories and Types Endpoints")
    class CategoriesTypesEndpointTests {

        @Test
        @DisplayName("Should get categories")
        void shouldGetCategories() {
            // Arrange
            List<DocumentCategoryResponse> categories = List.of(
                    DocumentCategoryResponse.builder()
                            .code("FINANCIAL")
                            .nameEs("Financiero")
                            .nameEn("Financial")
                            .isActive(true)
                            .build()
            );

            when(documentService.getCategories()).thenReturn(categories);

            // Act
            ResponseEntity<Map<String, Object>> result = controller.getCategories();

            // Assert
            assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(result.getBody()).containsEntry("success", true);
            List<?> data = (List<?>) result.getBody().get("data");
            assertThat(data).hasSize(1);
        }

        @Test
        @DisplayName("Should get document types by category")
        void shouldGetDocumentTypesByCategory() {
            // Arrange
            List<DocumentTypeResponse> types = List.of(
                    DocumentTypeResponse.builder()
                            .code("COMMERCIAL_INVOICE")
                            .nameEs("Factura Comercial")
                            .nameEn("Commercial Invoice")
                            .categoryCode("FINANCIAL")
                            .isActive(true)
                            .build()
            );

            when(documentService.getDocumentTypes("FINANCIAL")).thenReturn(types);

            // Act
            ResponseEntity<Map<String, Object>> result = controller.getDocumentTypes("FINANCIAL");

            // Assert
            assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(result.getBody()).containsEntry("success", true);
        }
    }

    // ==================================================================================
    // 10. AUDIT LOG ENDPOINT TESTS
    // ==================================================================================

    @Nested
    @Order(10)
    @DisplayName("10. Audit Log Endpoint")
    class AuditLogEndpointTests {

        @Test
        @DisplayName("Should get audit log for document")
        void shouldGetAuditLog() {
            // Arrange
            String documentId = "doc-123";
            List<DocumentAccessLogEntity> logs = List.of(
                    DocumentAccessLogEntity.builder()
                            .logId("log-1")
                            .documentId(documentId)
                            .userId("user@test.com")
                            .action(DocumentAccessLogEntity.DocumentAction.UPLOAD)
                            .accessedAt(LocalDateTime.now())
                            .build()
            );

            when(documentService.getAuditLog(documentId)).thenReturn(logs);

            // Act
            ResponseEntity<Map<String, Object>> result = controller.getAuditLog(documentId);

            // Assert
            assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(result.getBody()).containsEntry("success", true);
            List<?> data = (List<?>) result.getBody().get("data");
            assertThat(data).hasSize(1);
        }
    }

    // ==================================================================================
    // HELPER METHODS
    // ==================================================================================

    private DocumentResponse createDocumentResponse(String documentId) {
        DocumentResponse response = new DocumentResponse();
        response.setDocumentId(documentId);
        response.setOperationId("OP-2025-001");
        response.setOriginalFileName("test.pdf");
        response.setMimeType("application/pdf");
        response.setFileSize(1024L);
        response.setFormattedFileSize("1.0 KB");
        response.setCategoryCode("FINANCIAL");
        response.setDocumentTypeCode("COMMERCIAL_INVOICE");
        response.setVersion(1);
        response.setIsLatest(true);
        response.setAccessLevel("RESTRICTED");
        response.setUploadedBy("user@test.com");
        response.setUploadedAt(LocalDateTime.now());
        return response;
    }

    private DocumentEntity createDocumentEntity(String documentId) {
        return DocumentEntity.builder()
                .documentId(documentId)
                .operationId("OP-2025-001")
                .aggregateId("OP-2025-001")
                .aggregateType(DocumentEntity.AggregateType.OPERATION)
                .originalFileName("test.pdf")
                .storedFileName(documentId + ".pdf")
                .storagePath("financial/2025/" + documentId + ".pdf")
                .storageProvider(StorageProvider.LOCAL)
                .mimeType("application/pdf")
                .fileSize(1024L)
                .checksum("abc123")
                .categoryCode("FINANCIAL")
                .documentTypeCode("COMMERCIAL_INVOICE")
                .version(1)
                .isLatest(true)
                .accessLevel(DocumentEntity.AccessLevel.RESTRICTED)
                .uploadedBy("user@test.com")
                .uploadedAt(LocalDateTime.now())
                .isDeleted(false)
                .build();
    }
}
