package com.globalcmx.api.document.service;

import com.globalcmx.api.document.entity.*;
import com.globalcmx.api.document.entity.DocumentEntity.AccessLevel;
import com.globalcmx.api.document.entity.DocumentEntity.StorageProvider;
import com.globalcmx.api.document.repository.*;
import com.globalcmx.api.readmodel.entity.*;
import com.globalcmx.api.readmodel.repository.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for DocumentReadModelProjector.
 * Tests CQRS projection logic from write models to read models.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("DocumentReadModelProjector - Unit Tests")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class DocumentReadModelProjectorTest {

    // Read model repositories
    @Mock private DocumentReadModelRepository documentReadModelRepository;
    @Mock private DocumentCategoryReadModelRepository categoryReadModelRepository;
    @Mock private DocumentTypeReadModelRepository typeReadModelRepository;

    // Write model repositories
    @Mock private DocumentCategoryRepository categoryRepository;
    @Mock private DocumentTypeRepository typeRepository;

    // Captors
    @Captor private ArgumentCaptor<DocumentReadModel> documentReadModelCaptor;
    @Captor private ArgumentCaptor<DocumentCategoryReadModel> categoryReadModelCaptor;
    @Captor private ArgumentCaptor<DocumentTypeReadModel> typeReadModelCaptor;

    private DocumentReadModelProjector projector;

    @BeforeEach
    void setUp() {
        projector = new DocumentReadModelProjector(
                documentReadModelRepository,
                categoryReadModelRepository,
                typeReadModelRepository,
                categoryRepository,
                typeRepository
        );
    }

    // ==================================================================================
    // 1. DOCUMENT PROJECTION TESTS
    // ==================================================================================

    @Nested
    @Order(1)
    @DisplayName("1. Document Projection")
    class DocumentProjectionTests {

        @Test
        @DisplayName("Should project document to read model with denormalized data")
        void shouldProjectDocumentWithDenormalizedData() {
            // Arrange
            DocumentEntity document = createDocumentEntity("doc-123");

            DocumentCategoryReadModel categoryReadModel = DocumentCategoryReadModel.builder()
                    .code("FINANCIAL")
                    .nameEs("Financiero")
                    .nameEn("Financial")
                    .build();

            DocumentTypeReadModel docTypeReadModel = DocumentTypeReadModel.builder()
                    .code("COMMERCIAL_INVOICE")
                    .nameEs("Factura Comercial")
                    .nameEn("Commercial Invoice")
                    .build();

            when(categoryReadModelRepository.findByCode("FINANCIAL")).thenReturn(Optional.of(categoryReadModel));
            when(typeReadModelRepository.findByCode("COMMERCIAL_INVOICE")).thenReturn(Optional.of(docTypeReadModel));

            // Act
            projector.projectDocument(document);

            // Assert
            verify(documentReadModelRepository).save(documentReadModelCaptor.capture());
            DocumentReadModel readModel = documentReadModelCaptor.getValue();

            assertThat(readModel.getDocumentId()).isEqualTo("doc-123");
            assertThat(readModel.getCategoryCode()).isEqualTo("FINANCIAL");
            assertThat(readModel.getCategoryNameEs()).isEqualTo("Financiero");
            assertThat(readModel.getCategoryNameEn()).isEqualTo("Financial");
            assertThat(readModel.getDocumentTypeCode()).isEqualTo("COMMERCIAL_INVOICE");
            assertThat(readModel.getDocumentTypeNameEs()).isEqualTo("Factura Comercial");
            assertThat(readModel.getDocumentTypeNameEn()).isEqualTo("Commercial Invoice");
            assertThat(readModel.getDownloadCount()).isEqualTo(0);
            assertThat(readModel.getViewCount()).isEqualTo(0);

            verify(categoryReadModelRepository).incrementDocumentCount("FINANCIAL");
            verify(typeReadModelRepository).incrementDocumentCount("COMMERCIAL_INVOICE");
        }

        @Test
        @DisplayName("Should handle missing category gracefully")
        void shouldHandleMissingCategoryGracefully() {
            // Arrange
            DocumentEntity document = createDocumentEntity("doc-123");
            when(categoryReadModelRepository.findByCode(anyString())).thenReturn(Optional.empty());
            when(typeReadModelRepository.findByCode(anyString())).thenReturn(Optional.empty());

            // Act
            projector.projectDocument(document);

            // Assert
            verify(documentReadModelRepository).save(documentReadModelCaptor.capture());
            DocumentReadModel readModel = documentReadModelCaptor.getValue();

            assertThat(readModel.getCategoryNameEs()).isNull();
            assertThat(readModel.getCategoryNameEn()).isNull();
        }

        @ParameterizedTest
        @DisplayName("Should set canPreview based on MIME type")
        @CsvSource({
                "application/pdf, true",
                "image/png, true",
                "image/jpeg, true",
                "text/plain, true",
                "application/vnd.ms-excel, false",
                "application/zip, false"
        })
        void shouldSetCanPreviewBasedOnMimeType(String mimeType, boolean expectedCanPreview) {
            // Arrange
            DocumentEntity document = createDocumentEntity("doc-123");
            document.setMimeType(mimeType);

            when(categoryReadModelRepository.findByCode(anyString())).thenReturn(Optional.empty());
            when(typeReadModelRepository.findByCode(anyString())).thenReturn(Optional.empty());

            // Act
            projector.projectDocument(document);

            // Assert
            verify(documentReadModelRepository).save(documentReadModelCaptor.capture());
            assertThat(documentReadModelCaptor.getValue().getCanPreview()).isEqualTo(expectedCanPreview);
        }

        @ParameterizedTest
        @DisplayName("Should format file size correctly")
        @CsvSource({
                "512, '512 B'",
                "1024, '1.0 KB'",
                "1536, '1.5 KB'",
                "1048576, '1.0 MB'",
                "1572864, '1.5 MB'"
        })
        void shouldFormatFileSizeCorrectly(long bytes, String expectedFormat) {
            // Arrange
            DocumentEntity document = createDocumentEntity("doc-123");
            document.setFileSize(bytes);

            when(categoryReadModelRepository.findByCode(anyString())).thenReturn(Optional.empty());
            when(typeReadModelRepository.findByCode(anyString())).thenReturn(Optional.empty());

            // Act
            projector.projectDocument(document);

            // Assert
            verify(documentReadModelRepository).save(documentReadModelCaptor.capture());
            assertThat(documentReadModelCaptor.getValue().getFormattedFileSize()).isEqualTo(expectedFormat);
        }
    }

    // ==================================================================================
    // 2. VERSION PROJECTION TESTS
    // ==================================================================================

    @Nested
    @Order(2)
    @DisplayName("2. Version Projection")
    class VersionProjectionTests {

        @Test
        @DisplayName("Should mark previous version as not latest")
        void shouldMarkPreviousVersionAsNotLatest() {
            // Arrange
            DocumentEntity newVersion = createDocumentEntity("doc-v2");
            newVersion.setVersion(2);
            newVersion.setPreviousVersionId("doc-v1");

            when(categoryReadModelRepository.findByCode(anyString())).thenReturn(Optional.empty());
            when(typeReadModelRepository.findByCode(anyString())).thenReturn(Optional.empty());

            // Act
            projector.projectNewVersion(newVersion, "doc-v1");

            // Assert
            verify(documentReadModelRepository).markAsNotLatest("doc-v1");
            verify(documentReadModelRepository).save(any(DocumentReadModel.class));
        }

        @Test
        @DisplayName("Should project new version as latest")
        void shouldProjectNewVersionAsLatest() {
            // Arrange
            DocumentEntity newVersion = createDocumentEntity("doc-v2");
            newVersion.setVersion(2);
            newVersion.setIsLatest(true);

            when(categoryReadModelRepository.findByCode(anyString())).thenReturn(Optional.empty());
            when(typeReadModelRepository.findByCode(anyString())).thenReturn(Optional.empty());

            // Act
            projector.projectNewVersion(newVersion, "doc-v1");

            // Assert
            verify(documentReadModelRepository).save(documentReadModelCaptor.capture());
            assertThat(documentReadModelCaptor.getValue().getIsLatest()).isTrue();
            assertThat(documentReadModelCaptor.getValue().getVersion()).isEqualTo(2);
        }
    }

    // ==================================================================================
    // 3. DOCUMENT REMOVAL TESTS
    // ==================================================================================

    @Nested
    @Order(3)
    @DisplayName("3. Document Removal")
    class DocumentRemovalTests {

        @Test
        @DisplayName("Should remove document from read model and decrement counts")
        void shouldRemoveDocumentAndDecrementCounts() {
            // Act
            projector.removeDocument("doc-123", "FINANCIAL", "COMMERCIAL_INVOICE");

            // Assert
            verify(documentReadModelRepository).deleteById("doc-123");
            verify(categoryReadModelRepository).decrementDocumentCount("FINANCIAL");
            verify(typeReadModelRepository).decrementDocumentCount("COMMERCIAL_INVOICE");
        }

        @Test
        @DisplayName("Should handle removal errors gracefully")
        void shouldHandleRemovalErrorsGracefully() {
            // Arrange
            doThrow(new RuntimeException("DB error")).when(documentReadModelRepository).deleteById(anyString());

            // Act - Should not throw
            projector.removeDocument("doc-123", "FINANCIAL", "COMMERCIAL_INVOICE");

            // Verify other operations were not attempted after error
            verify(documentReadModelRepository).deleteById("doc-123");
        }
    }

    // ==================================================================================
    // 4. ACCESS TRACKING TESTS
    // ==================================================================================

    @Nested
    @Order(4)
    @DisplayName("4. Access Tracking")
    class AccessTrackingTests {

        @Test
        @DisplayName("Should record view by incrementing view count")
        void shouldRecordView() {
            // Act
            projector.recordView("doc-123");

            // Assert
            verify(documentReadModelRepository).incrementViewCount("doc-123");
        }

        @Test
        @DisplayName("Should record download by incrementing download count")
        void shouldRecordDownload() {
            // Act
            projector.recordDownload("doc-123");

            // Assert
            verify(documentReadModelRepository).incrementDownloadCount("doc-123");
        }

        @Test
        @DisplayName("Should handle view tracking errors gracefully")
        void shouldHandleViewTrackingErrorsGracefully() {
            // Arrange
            doThrow(new RuntimeException("DB error")).when(documentReadModelRepository)
                    .incrementViewCount(anyString());

            // Act - Should not throw
            projector.recordView("doc-123");

            // Assert - method was called
            verify(documentReadModelRepository).incrementViewCount("doc-123");
        }

        @Test
        @DisplayName("Should handle download tracking errors gracefully")
        void shouldHandleDownloadTrackingErrorsGracefully() {
            // Arrange
            doThrow(new RuntimeException("DB error")).when(documentReadModelRepository)
                    .incrementDownloadCount(anyString());

            // Act - Should not throw
            projector.recordDownload("doc-123");

            // Assert
            verify(documentReadModelRepository).incrementDownloadCount("doc-123");
        }
    }

    // ==================================================================================
    // 5. CATEGORY PROJECTION TESTS
    // ==================================================================================

    @Nested
    @Order(5)
    @DisplayName("5. Category Projection")
    class CategoryProjectionTests {

        @Test
        @DisplayName("Should project root category")
        void shouldProjectRootCategory() {
            // Arrange
            DocumentCategoryEntity category = DocumentCategoryEntity.builder()
                    .categoryId("cat-1")
                    .code("FINANCIAL")
                    .nameEs("Financiero")
                    .nameEn("Financial")
                    .descriptionEs("Documentos financieros")
                    .descriptionEn("Financial documents")
                    .icon("money-icon")
                    .displayOrder(1)
                    .isActive(true)
                    .build();

            // Act
            projector.projectCategory(category);

            // Assert
            verify(categoryReadModelRepository).save(categoryReadModelCaptor.capture());
            DocumentCategoryReadModel readModel = categoryReadModelCaptor.getValue();

            assertThat(readModel.getCode()).isEqualTo("FINANCIAL");
            assertThat(readModel.getParentCode()).isNull();
            assertThat(readModel.getLevel()).isEqualTo(0);
            assertThat(readModel.getFullPath()).isEqualTo("Financiero");
            assertThat(readModel.getDocumentCount()).isEqualTo(0);
            assertThat(readModel.getHasChildren()).isFalse();
        }

        @Test
        @DisplayName("Should project child category with parent reference")
        void shouldProjectChildCategoryWithParentReference() {
            // Arrange
            DocumentCategoryEntity parentCategory = DocumentCategoryEntity.builder()
                    .categoryId("cat-parent")
                    .code("FINANCIAL")
                    .nameEs("Financiero")
                    .nameEn("Financial")
                    .build();

            DocumentCategoryEntity childCategory = DocumentCategoryEntity.builder()
                    .categoryId("cat-child")
                    .code("INVOICES")
                    .nameEs("Facturas")
                    .nameEn("Invoices")
                    .parentCategoryId("cat-parent")
                    .isActive(true)
                    .build();

            DocumentCategoryReadModel parentReadModel = DocumentCategoryReadModel.builder()
                    .code("FINANCIAL")
                    .level(0)
                    .fullPath("Financiero")
                    .build();

            when(categoryRepository.findById("cat-parent")).thenReturn(Optional.of(parentCategory));
            when(categoryReadModelRepository.findByCode("FINANCIAL")).thenReturn(Optional.of(parentReadModel));

            // Act
            projector.projectCategory(childCategory);

            // Assert
            verify(categoryReadModelRepository).markAsHasChildren("FINANCIAL");
            verify(categoryReadModelRepository).save(categoryReadModelCaptor.capture());

            DocumentCategoryReadModel readModel = categoryReadModelCaptor.getValue();
            assertThat(readModel.getCode()).isEqualTo("INVOICES");
            assertThat(readModel.getParentCode()).isEqualTo("FINANCIAL");
            assertThat(readModel.getLevel()).isEqualTo(1);
            assertThat(readModel.getFullPath()).isEqualTo("Financiero > Facturas");
        }
    }

    // ==================================================================================
    // 6. DOCUMENT TYPE PROJECTION TESTS
    // ==================================================================================

    @Nested
    @Order(6)
    @DisplayName("6. Document Type Projection")
    class DocumentTypeProjectionTests {

        @Test
        @DisplayName("Should project document type with category names")
        void shouldProjectDocumentTypeWithCategoryNames() {
            // Arrange
            DocumentTypeEntity docType = DocumentTypeEntity.builder()
                    .typeId("type-1")
                    .code("COMMERCIAL_INVOICE")
                    .categoryCode("FINANCIAL")
                    .nameEs("Factura Comercial")
                    .nameEn("Commercial Invoice")
                    .allowedMimeTypes("application/pdf,image/png")
                    .maxFileSizeMb(10)
                    .requiresApproval(false)
                    .isActive(true)
                    .build();

            DocumentCategoryEntity category = DocumentCategoryEntity.builder()
                    .code("FINANCIAL")
                    .nameEs("Financiero")
                    .nameEn("Financial")
                    .build();

            when(categoryRepository.findByCode("FINANCIAL")).thenReturn(Optional.of(category));

            // Act
            projector.projectDocumentType(docType);

            // Assert
            verify(typeReadModelRepository).save(typeReadModelCaptor.capture());
            DocumentTypeReadModel readModel = typeReadModelCaptor.getValue();

            assertThat(readModel.getCode()).isEqualTo("COMMERCIAL_INVOICE");
            assertThat(readModel.getCategoryCode()).isEqualTo("FINANCIAL");
            assertThat(readModel.getCategoryNameEs()).isEqualTo("Financiero");
            assertThat(readModel.getCategoryNameEn()).isEqualTo("Financial");
            assertThat(readModel.getNameEs()).isEqualTo("Factura Comercial");
            assertThat(readModel.getNameEn()).isEqualTo("Commercial Invoice");
            assertThat(readModel.getAllowedMimeTypes()).isEqualTo("application/pdf,image/png");
            assertThat(readModel.getDocumentCount()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should handle document type with missing category")
        void shouldHandleDocumentTypeWithMissingCategory() {
            // Arrange
            DocumentTypeEntity docType = DocumentTypeEntity.builder()
                    .typeId("type-1")
                    .code("ORPHAN_TYPE")
                    .categoryCode("NON_EXISTENT")
                    .nameEs("Tipo Huérfano")
                    .nameEn("Orphan Type")
                    .isActive(true)
                    .build();

            when(categoryRepository.findByCode("NON_EXISTENT")).thenReturn(Optional.empty());

            // Act
            projector.projectDocumentType(docType);

            // Assert
            verify(typeReadModelRepository).save(typeReadModelCaptor.capture());
            DocumentTypeReadModel readModel = typeReadModelCaptor.getValue();

            assertThat(readModel.getCategoryNameEs()).isNull();
            assertThat(readModel.getCategoryNameEn()).isNull();
        }
    }

    // ==================================================================================
    // 7. REBUILD ALL TESTS
    // ==================================================================================

    @Nested
    @Order(7)
    @DisplayName("7. Rebuild All Read Models")
    class RebuildAllTests {

        @Test
        @DisplayName("Should rebuild all read models from write models")
        void shouldRebuildAllReadModels() {
            // Arrange
            DocumentCategoryEntity category = DocumentCategoryEntity.builder()
                    .categoryId("cat-1")
                    .code("FINANCIAL")
                    .nameEs("Financiero")
                    .nameEn("Financial")
                    .isActive(true)
                    .build();

            DocumentTypeEntity docType = DocumentTypeEntity.builder()
                    .typeId("type-1")
                    .code("INVOICE")
                    .categoryCode("FINANCIAL")
                    .nameEs("Factura")
                    .nameEn("Invoice")
                    .isActive(true)
                    .build();

            when(categoryRepository.findAll()).thenReturn(List.of(category));
            when(typeRepository.findAll()).thenReturn(List.of(docType));
            when(categoryRepository.findByCode("FINANCIAL")).thenReturn(Optional.of(category));

            // Act
            projector.rebuildAllReadModels();

            // Assert
            verify(documentReadModelRepository).deleteAll();
            verify(categoryReadModelRepository).deleteAll();
            verify(typeReadModelRepository).deleteAll();

            verify(categoryReadModelRepository).save(any(DocumentCategoryReadModel.class));
            verify(typeReadModelRepository).save(any(DocumentTypeReadModel.class));
        }
    }

    // ==================================================================================
    // HELPER METHODS
    // ==================================================================================

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
}
