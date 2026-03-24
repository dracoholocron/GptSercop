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
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for DocumentService.
 * Tests CQRS pattern implementation with write and read models.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("DocumentService - Unit Tests")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class DocumentServiceTest {

    // ==================== MOCKS ====================

    // Write model repositories
    @Mock private DocumentRepository documentRepository;
    @Mock private DocumentCategoryRepository categoryRepository;
    @Mock private DocumentTypeRepository typeRepository;
    @Mock private DocumentAccessLogRepository accessLogRepository;

    // Read model repositories
    @Mock private DocumentReadModelRepository documentReadModelRepository;
    @Mock private DocumentCategoryReadModelRepository categoryReadModelRepository;
    @Mock private DocumentTypeReadModelRepository typeReadModelRepository;

    // Services
    @Mock private CloudStorageFactory storageFactory;
    @Mock private CloudStorageService cloudStorageService;
    @Mock private DocumentReadModelProjector projector;

    // Captors
    @Captor private ArgumentCaptor<DocumentEntity> documentCaptor;
    @Captor private ArgumentCaptor<DocumentAccessLogEntity> accessLogCaptor;

    private DocumentService documentService;
    private ObjectMapper objectMapper;

    // ==================== SETUP ====================

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        documentService = new DocumentService(
                documentRepository,
                categoryRepository,
                typeRepository,
                accessLogRepository,
                documentReadModelRepository,
                categoryReadModelRepository,
                typeReadModelRepository,
                storageFactory,
                projector,
                objectMapper
        );

        // Set default values via reflection
        ReflectionTestUtils.setField(documentService, "maxFileSize", 52428800L);
        ReflectionTestUtils.setField(documentService, "contextPath", "");
        ReflectionTestUtils.setField(documentService, "baseUrl", "http://localhost:8080");
    }

    // ==================================================================================
    // 1. DOCUMENT UPLOAD TESTS
    // ==================================================================================

    @Nested
    @Order(1)
    @DisplayName("1. Document Upload")
    class UploadTests {

        @Test
        @DisplayName("Should upload document successfully")
        void shouldUploadDocumentSuccessfully() throws Exception {
            // Arrange
            MockMultipartFile file = createMockFile("test.pdf", "application/pdf", 1024);
            UploadDocumentRequest request = createUploadRequest();

            when(storageFactory.getDefaultStorage()).thenReturn(cloudStorageService);
            when(cloudStorageService.getProvider()).thenReturn(StorageProvider.LOCAL);
            when(cloudStorageService.upload(any(), anyString(), anyString(), anyLong()))
                    .thenReturn("financial/2025/uuid-test.pdf");
            when(documentRepository.save(any(DocumentEntity.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // Act
            DocumentResponse response = documentService.uploadDocument(file, request, "user@test.com");

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getOriginalFileName()).isEqualTo("test.pdf");
            assertThat(response.getCategoryCode()).isEqualTo("FINANCIAL");

            verify(documentRepository).save(documentCaptor.capture());
            DocumentEntity savedDoc = documentCaptor.getValue();
            assertThat(savedDoc.getUploadedBy()).isEqualTo("user@test.com");
            assertThat(savedDoc.getIsLatest()).isTrue();
            assertThat(savedDoc.getVersion()).isEqualTo(1);

            verify(projector).projectDocument(any(DocumentEntity.class));
            verify(accessLogRepository).save(any(DocumentAccessLogEntity.class));
        }

        @Test
        @DisplayName("Should reject empty file")
        void shouldRejectEmptyFile() {
            // Arrange
            MockMultipartFile emptyFile = new MockMultipartFile(
                    "file", "test.pdf", "application/pdf", new byte[0]);
            UploadDocumentRequest request = createUploadRequest();

            // Act & Assert
            assertThatThrownBy(() -> documentService.uploadDocument(emptyFile, request, "user@test.com"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("File is empty");
        }

        @Test
        @DisplayName("Should reject file exceeding max size")
        void shouldRejectFileTooLarge() {
            // Arrange
            // Set max size to 1KB for testing
            ReflectionTestUtils.setField(documentService, "maxFileSize", 1024L);

            byte[] largeContent = new byte[2048]; // 2KB
            MockMultipartFile largeFile = new MockMultipartFile(
                    "file", "large.pdf", "application/pdf", largeContent);
            UploadDocumentRequest request = createUploadRequest();

            // Act & Assert
            assertThatThrownBy(() -> documentService.uploadDocument(largeFile, request, "user@test.com"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("File size exceeds");
        }

        @Test
        @DisplayName("Should set correct aggregate type for operation document")
        void shouldSetCorrectAggregateTypeForOperation() throws Exception {
            // Arrange
            MockMultipartFile file = createMockFile("test.pdf", "application/pdf", 1024);
            UploadDocumentRequest request = UploadDocumentRequest.builder()
                    .operationId("OP-2025-001")
                    .categoryCode("FINANCIAL")
                    .documentTypeCode("COMMERCIAL_INVOICE")
                    .build();

            when(storageFactory.getDefaultStorage()).thenReturn(cloudStorageService);
            when(cloudStorageService.getProvider()).thenReturn(StorageProvider.LOCAL);
            when(cloudStorageService.upload(any(), anyString(), anyString(), anyLong()))
                    .thenReturn("path/file.pdf");
            when(documentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Act
            documentService.uploadDocument(file, request, "user@test.com");

            // Assert
            verify(documentRepository).save(documentCaptor.capture());
            assertThat(documentCaptor.getValue().getAggregateType())
                    .isEqualTo(DocumentEntity.AggregateType.OPERATION);
            assertThat(documentCaptor.getValue().getAggregateId()).isEqualTo("OP-2025-001");
        }

        @Test
        @DisplayName("Should set correct aggregate type for event document")
        void shouldSetCorrectAggregateTypeForEvent() throws Exception {
            // Arrange
            MockMultipartFile file = createMockFile("test.pdf", "application/pdf", 1024);
            UploadDocumentRequest request = UploadDocumentRequest.builder()
                    .eventId("EVT-2025-001")
                    .categoryCode("FINANCIAL")
                    .documentTypeCode("COMMERCIAL_INVOICE")
                    .build();

            when(storageFactory.getDefaultStorage()).thenReturn(cloudStorageService);
            when(cloudStorageService.getProvider()).thenReturn(StorageProvider.LOCAL);
            when(cloudStorageService.upload(any(), anyString(), anyString(), anyLong()))
                    .thenReturn("path/file.pdf");
            when(documentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Act
            documentService.uploadDocument(file, request, "user@test.com");

            // Assert
            verify(documentRepository).save(documentCaptor.capture());
            assertThat(documentCaptor.getValue().getAggregateType())
                    .isEqualTo(DocumentEntity.AggregateType.EVENT);
            assertThat(documentCaptor.getValue().getAggregateId()).isEqualTo("EVT-2025-001");
        }
    }

    // ==================================================================================
    // 2. DOCUMENT RETRIEVAL TESTS (CQRS - Read Model)
    // ==================================================================================

    @Nested
    @Order(2)
    @DisplayName("2. Document Retrieval (CQRS Read Model)")
    class RetrievalTests {

        @Test
        @DisplayName("Should get document from read model")
        void shouldGetDocumentFromReadModel() {
            // Arrange
            String documentId = "doc-123";
            DocumentReadModel readModel = createDocumentReadModel(documentId);
            when(documentReadModelRepository.findByDocumentId(documentId))
                    .thenReturn(Optional.of(readModel));

            // Act
            DocumentResponse response = documentService.getDocument(documentId, "user@test.com");

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getDocumentId()).isEqualTo(documentId);

            verify(documentReadModelRepository).findByDocumentId(documentId);
            verify(projector).recordView(documentId);
            verify(accessLogRepository).save(any(DocumentAccessLogEntity.class));
        }

        @Test
        @DisplayName("Should throw when document not found in read model")
        void shouldThrowWhenDocumentNotFound() {
            // Arrange
            when(documentReadModelRepository.findByDocumentId("invalid-id"))
                    .thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> documentService.getDocument("invalid-id", "user@test.com"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Document not found");
        }

        @Test
        @DisplayName("Should get documents by operation from read model")
        void shouldGetDocumentsByOperation() {
            // Arrange
            String operationId = "OP-2025-001";
            List<DocumentReadModel> documents = List.of(
                    createDocumentReadModel("doc-1"),
                    createDocumentReadModel("doc-2")
            );
            when(documentReadModelRepository.findByOperationIdAndIsLatestTrueOrderByUploadedAtDesc(operationId))
                    .thenReturn(documents);

            // Act
            List<DocumentResponse> response = documentService.getDocumentsByOperation(operationId);

            // Assert
            assertThat(response).hasSize(2);
            verify(documentReadModelRepository).findByOperationIdAndIsLatestTrueOrderByUploadedAtDesc(operationId);
        }

        @Test
        @DisplayName("Should search documents with filters from read model")
        void shouldSearchDocumentsWithFilters() {
            // Arrange
            PageRequest pageable = PageRequest.of(0, 10);
            Page<DocumentReadModel> page = new PageImpl<>(
                    List.of(createDocumentReadModel("doc-1")),
                    pageable, 1
            );
            when(documentReadModelRepository.searchDocuments(
                    any(), any(), any(), any(), any(), any(), any(), any()))
                    .thenReturn(page);

            // Act
            Page<DocumentResponse> result = documentService.getDocuments(
                    "OP-2025-001", null, "FINANCIAL", null, null, null, null, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getTotalElements()).isEqualTo(1);
        }
    }

    // ==================================================================================
    // 3. DOCUMENT DOWNLOAD TESTS
    // ==================================================================================

    @Nested
    @Order(3)
    @DisplayName("3. Document Download")
    class DownloadTests {

        @Test
        @DisplayName("Should download document content")
        void shouldDownloadDocumentContent() {
            // Arrange
            String documentId = "doc-123";
            DocumentEntity document = createDocumentEntity(documentId);
            InputStream mockInputStream = new ByteArrayInputStream("test content".getBytes());

            when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
            when(storageFactory.getStorage(StorageProvider.LOCAL)).thenReturn(cloudStorageService);
            when(cloudStorageService.download(document.getStoragePath())).thenReturn(mockInputStream);

            // Act
            InputStream result = documentService.downloadDocument(documentId, "user@test.com");

            // Assert
            assertThat(result).isNotNull();
            verify(projector).recordDownload(documentId);
            verify(accessLogRepository).save(accessLogCaptor.capture());
            assertThat(accessLogCaptor.getValue().getAction())
                    .isEqualTo(DocumentAccessLogEntity.DocumentAction.DOWNLOAD);
        }

        @Test
        @DisplayName("Should throw when document not found for download")
        void shouldThrowWhenDocumentNotFoundForDownload() {
            // Arrange
            when(documentRepository.findById("invalid-id")).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> documentService.downloadDocument("invalid-id", "user@test.com"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Document not found");
        }

        @Test
        @DisplayName("Should not download deleted document")
        void shouldNotDownloadDeletedDocument() {
            // Arrange
            String documentId = "doc-123";
            DocumentEntity document = createDocumentEntity(documentId);
            document.setIsDeleted(true);

            when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));

            // Act & Assert
            assertThatThrownBy(() -> documentService.downloadDocument(documentId, "user@test.com"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Document not found");
        }
    }

    // ==================================================================================
    // 4. DOCUMENT DELETE TESTS
    // ==================================================================================

    @Nested
    @Order(4)
    @DisplayName("4. Document Delete")
    class DeleteTests {

        @Test
        @DisplayName("Should soft delete document and update read model")
        void shouldSoftDeleteDocument() {
            // Arrange
            String documentId = "doc-123";
            DocumentEntity document = createDocumentEntity(documentId);
            when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));

            // Act
            documentService.deleteDocument(documentId, "user@test.com");

            // Assert
            verify(documentRepository).softDelete(eq(documentId), eq("user@test.com"), any(LocalDateTime.class));
            verify(projector).removeDocument(documentId, document.getCategoryCode(), document.getDocumentTypeCode());
            verify(accessLogRepository).save(accessLogCaptor.capture());
            assertThat(accessLogCaptor.getValue().getAction())
                    .isEqualTo(DocumentAccessLogEntity.DocumentAction.DELETE);
        }

        @Test
        @DisplayName("Should restore deleted document")
        void shouldRestoreDeletedDocument() {
            // Arrange
            String documentId = "doc-123";
            DocumentEntity document = createDocumentEntity(documentId);
            document.setIsDeleted(true);

            when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
            when(documentReadModelRepository.findByDocumentId(documentId))
                    .thenReturn(Optional.of(createDocumentReadModel(documentId)));

            // Act
            DocumentResponse response = documentService.restoreDocument(documentId, "user@test.com");

            // Assert
            assertThat(response).isNotNull();
            verify(documentRepository).restore(documentId);
            verify(projector).projectDocument(any(DocumentEntity.class));
        }

        @Test
        @DisplayName("Should throw when restoring non-deleted document")
        void shouldThrowWhenRestoringNonDeletedDocument() {
            // Arrange
            String documentId = "doc-123";
            DocumentEntity document = createDocumentEntity(documentId);
            document.setIsDeleted(false);

            when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));

            // Act & Assert
            assertThatThrownBy(() -> documentService.restoreDocument(documentId, "user@test.com"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Document is not deleted");
        }
    }

    // ==================================================================================
    // 5. VERSION MANAGEMENT TESTS
    // ==================================================================================

    @Nested
    @Order(5)
    @DisplayName("5. Version Management")
    class VersionTests {

        @Test
        @DisplayName("Should upload new version")
        void shouldUploadNewVersion() throws Exception {
            // Arrange
            String documentId = "doc-123";
            DocumentEntity currentVersion = createDocumentEntity(documentId);
            currentVersion.setVersion(1);

            MockMultipartFile newFile = createMockFile("test-v2.pdf", "application/pdf", 2048);

            when(documentRepository.findById(documentId)).thenReturn(Optional.of(currentVersion));
            when(storageFactory.getStorage(StorageProvider.LOCAL)).thenReturn(cloudStorageService);
            when(cloudStorageService.upload(any(), anyString(), anyString(), anyLong()))
                    .thenReturn("financial/2025/new-uuid.pdf");
            when(documentRepository.save(any(DocumentEntity.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // Act
            DocumentResponse response = documentService.uploadNewVersion(
                    documentId, newFile, "Updated content", "user@test.com");

            // Assert
            assertThat(response).isNotNull();

            verify(documentRepository).markAsNotLatest(documentId);
            verify(documentRepository).save(documentCaptor.capture());

            DocumentEntity newVersion = documentCaptor.getValue();
            assertThat(newVersion.getVersion()).isEqualTo(2);
            assertThat(newVersion.getPreviousVersionId()).isEqualTo(documentId);
            assertThat(newVersion.getIsLatest()).isTrue();
            assertThat(newVersion.getChangeNotes()).isEqualTo("Updated content");

            verify(projector).projectNewVersion(any(DocumentEntity.class), eq(documentId));
        }

        @Test
        @DisplayName("Should get version history")
        void shouldGetVersionHistory() {
            // Arrange
            String documentId = "doc-v2";
            DocumentEntity v2 = createDocumentEntity(documentId);
            v2.setVersion(2);
            v2.setPreviousVersionId("doc-v1");
            v2.setIsLatest(true);

            DocumentEntity v1 = createDocumentEntity("doc-v1");
            v1.setVersion(1);
            v1.setIsLatest(false);

            when(documentRepository.findById("doc-v2")).thenReturn(Optional.of(v2));
            when(documentRepository.findById("doc-v1")).thenReturn(Optional.of(v1));
            when(documentRepository.findAll()).thenReturn(List.of(v1, v2));

            // Act
            List<DocumentVersionResponse> versions = documentService.getVersions(documentId);

            // Assert
            assertThat(versions).hasSize(2);
            assertThat(versions.get(0).getVersion()).isEqualTo(2);
            assertThat(versions.get(1).getVersion()).isEqualTo(1);
        }
    }

    // ==================================================================================
    // 6. CATEGORIES AND TYPES TESTS (CQRS Read Model)
    // ==================================================================================

    @Nested
    @Order(6)
    @DisplayName("6. Categories and Types (CQRS Read Model)")
    class CategoriesTypesTests {

        @Test
        @DisplayName("Should get categories from read model")
        void shouldGetCategoriesFromReadModel() {
            // Arrange
            DocumentCategoryReadModel category = DocumentCategoryReadModel.builder()
                    .code("FINANCIAL")
                    .nameEs("Financiero")
                    .nameEn("Financial")
                    .isActive(true)
                    .documentCount(5)
                    .build();

            when(categoryReadModelRepository.findByParentCodeIsNullAndIsActiveTrueOrderByDisplayOrderAsc())
                    .thenReturn(List.of(category));
            when(categoryReadModelRepository.findByParentCodeAndIsActiveTrueOrderByDisplayOrderAsc("FINANCIAL"))
                    .thenReturn(List.of());

            // Act
            List<DocumentCategoryResponse> categories = documentService.getCategories();

            // Assert
            assertThat(categories).hasSize(1);
            assertThat(categories.get(0).getCode()).isEqualTo("FINANCIAL");

            verify(categoryReadModelRepository).findByParentCodeIsNullAndIsActiveTrueOrderByDisplayOrderAsc();
        }

        @Test
        @DisplayName("Should get document types from read model")
        void shouldGetDocumentTypesFromReadModel() {
            // Arrange
            DocumentTypeReadModel type = DocumentTypeReadModel.builder()
                    .code("COMMERCIAL_INVOICE")
                    .nameEs("Factura Comercial")
                    .nameEn("Commercial Invoice")
                    .categoryCode("FINANCIAL")
                    .isActive(true)
                    .build();

            when(typeReadModelRepository.findByCategoryCodeAndIsActiveTrueOrderByNameEsAsc("FINANCIAL"))
                    .thenReturn(List.of(type));

            // Act
            List<DocumentTypeResponse> types = documentService.getDocumentTypes("FINANCIAL");

            // Assert
            assertThat(types).hasSize(1);
            assertThat(types.get(0).getCode()).isEqualTo("COMMERCIAL_INVOICE");

            verify(typeReadModelRepository).findByCategoryCodeAndIsActiveTrueOrderByNameEsAsc("FINANCIAL");
        }

        @Test
        @DisplayName("Should get all document types when no category specified")
        void shouldGetAllDocumentTypesWhenNoCategorySpecified() {
            // Arrange
            DocumentTypeReadModel type = DocumentTypeReadModel.builder()
                    .code("BILL_OF_LADING")
                    .nameEs("Conocimiento de Embarque")
                    .nameEn("Bill of Lading")
                    .categoryCode("SHIPPING")
                    .isActive(true)
                    .build();

            when(typeReadModelRepository.findByIsActiveTrueOrderByCategoryCodeAscNameEsAsc())
                    .thenReturn(List.of(type));

            // Act
            List<DocumentTypeResponse> types = documentService.getDocumentTypes(null);

            // Assert
            assertThat(types).hasSize(1);
            verify(typeReadModelRepository).findByIsActiveTrueOrderByCategoryCodeAscNameEsAsc();
        }
    }

    // ==================================================================================
    // 7. AUDIT LOG TESTS
    // ==================================================================================

    @Nested
    @Order(7)
    @DisplayName("7. Audit Log")
    class AuditLogTests {

        @Test
        @DisplayName("Should get audit log for document")
        void shouldGetAuditLog() {
            // Arrange
            String documentId = "doc-123";
            List<DocumentAccessLogEntity> logs = List.of(
                    DocumentAccessLogEntity.builder()
                            .logId("log-1")
                            .documentId(documentId)
                            .userId("user1@test.com")
                            .action(DocumentAccessLogEntity.DocumentAction.UPLOAD)
                            .accessedAt(LocalDateTime.now().minusHours(2))
                            .build(),
                    DocumentAccessLogEntity.builder()
                            .logId("log-2")
                            .documentId(documentId)
                            .userId("user2@test.com")
                            .action(DocumentAccessLogEntity.DocumentAction.VIEW)
                            .accessedAt(LocalDateTime.now().minusHours(1))
                            .build()
            );

            when(accessLogRepository.findByDocumentIdOrderByAccessedAtDesc(documentId))
                    .thenReturn(logs);

            // Act
            List<DocumentAccessLogEntity> result = documentService.getAuditLog(documentId);

            // Assert
            assertThat(result).hasSize(2);
            verify(accessLogRepository).findByDocumentIdOrderByAccessedAtDesc(documentId);
        }
    }

    // ==================================================================================
    // 8. FILE VALIDATION TESTS
    // ==================================================================================

    @Nested
    @Order(8)
    @DisplayName("8. File Validation")
    class FileValidationTests {

        @ParameterizedTest
        @DisplayName("Should accept different valid MIME types")
        @ValueSource(strings = {"application/pdf", "image/png", "image/jpeg", "application/vnd.ms-excel"})
        void shouldAcceptValidMimeTypes(String mimeType) throws Exception {
            // Arrange
            MockMultipartFile file = createMockFile("test-file", mimeType, 1024);
            UploadDocumentRequest request = createUploadRequest();

            when(storageFactory.getDefaultStorage()).thenReturn(cloudStorageService);
            when(cloudStorageService.getProvider()).thenReturn(StorageProvider.LOCAL);
            when(cloudStorageService.upload(any(), anyString(), anyString(), anyLong()))
                    .thenReturn("path/file");
            when(documentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Act & Assert - Should not throw
            documentService.uploadDocument(file, request, "user@test.com");

            verify(documentRepository).save(any());
        }

        @Test
        @DisplayName("Should reject file with invalid MIME type for document type")
        void shouldRejectInvalidMimeTypeForDocumentType() {
            // Arrange
            MockMultipartFile file = createMockFile("test.exe", "application/x-msdownload", 1024);
            UploadDocumentRequest request = createUploadRequest();

            DocumentTypeReadModel docTypeReadModel = DocumentTypeReadModel.builder()
                    .code("COMMERCIAL_INVOICE")
                    .allowedMimeTypes("application/pdf,image/png,image/jpeg")
                    .isActive(true)
                    .build();

            when(typeReadModelRepository.findByCode("COMMERCIAL_INVOICE"))
                    .thenReturn(Optional.of(docTypeReadModel));

            // Act & Assert
            assertThatThrownBy(() -> documentService.uploadDocument(file, request, "user@test.com"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("File type not allowed");
        }
    }

    // ==================================================================================
    // HELPER METHODS
    // ==================================================================================

    private MockMultipartFile createMockFile(String filename, String contentType, int size) {
        byte[] content = new byte[size];
        Arrays.fill(content, (byte) 1);
        return new MockMultipartFile("file", filename, contentType, content);
    }

    private UploadDocumentRequest createUploadRequest() {
        return UploadDocumentRequest.builder()
                .operationId("OP-2025-001")
                .categoryCode("FINANCIAL")
                .documentTypeCode("COMMERCIAL_INVOICE")
                .accessLevel("RESTRICTED")
                .tags(List.of("invoice", "commercial"))
                .build();
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
                .accessLevel(AccessLevel.RESTRICTED)
                .uploadedBy("user@test.com")
                .uploadedAt(LocalDateTime.now())
                .isDeleted(false)
                .build();
    }

    private DocumentReadModel createDocumentReadModel(String documentId) {
        return DocumentReadModel.builder()
                .documentId(documentId)
                .operationId("OP-2025-001")
                .originalFileName("test.pdf")
                .mimeType("application/pdf")
                .fileSize(1024L)
                .formattedFileSize("1.0 KB")
                .categoryCode("FINANCIAL")
                .categoryNameEs("Financiero")
                .categoryNameEn("Financial")
                .documentTypeCode("COMMERCIAL_INVOICE")
                .documentTypeNameEs("Factura Comercial")
                .documentTypeNameEn("Commercial Invoice")
                .version(1)
                .isLatest(true)
                .accessLevel("RESTRICTED")
                .uploadedBy("user@test.com")
                .uploadedAt(LocalDateTime.now())
                .canPreview(true)
                .downloadCount(0)
                .viewCount(0)
                .build();
    }
}
