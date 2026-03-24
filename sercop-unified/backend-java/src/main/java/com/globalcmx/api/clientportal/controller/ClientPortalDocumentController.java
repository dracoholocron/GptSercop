package com.globalcmx.api.clientportal.controller;

import com.globalcmx.api.document.dto.DocumentResponse;
import com.globalcmx.api.document.dto.UploadDocumentRequest;
import com.globalcmx.api.document.repository.DocumentRepository;
import com.globalcmx.api.document.service.DocumentService;
import com.globalcmx.api.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * Controlador de documentos para el portal de clientes.
 *
 * Permite a usuarios CLIENT subir documentos que se almacenan en el
 * repositorio activo configurado (LOCAL, S3, Azure, GCS).
 *
 * Endpoints disponibles:
 * - POST /client-portal/documents/upload - Subir un documento
 * - GET /client-portal/documents/{documentId} - Obtener metadata del documento
 *
 * SEGURIDAD: Este endpoint está protegido y solo accesible por usuarios autenticados
 * del portal de clientes.
 */
@RestController
@RequestMapping("/client-portal/documents")
@RequiredArgsConstructor
@Slf4j
public class ClientPortalDocumentController {

    private final DocumentService documentService;
    private final DocumentRepository documentRepository;

    /**
     * Categoría por defecto para documentos del portal de clientes.
     * Los documentos subidos por clientes se clasifican bajo esta categoría.
     */
    private static final String DEFAULT_CATEGORY = "CLIENT_DOCUMENTS";

    /**
     * Tipo de documento por defecto para documentos del portal de clientes.
     */
    private static final String DEFAULT_DOCUMENT_TYPE = "ATTACHMENT";

    /**
     * Sube un documento al repositorio activo.
     *
     * @param file El archivo a subir (multipart)
     * @param operationId ID de operación asociada (opcional)
     * @param draftId ID del borrador asociado (opcional)
     * @param fieldCode Código del campo custom field (opcional)
     * @param categoryCode Categoría del documento (opcional, default: CLIENT_DOCUMENTS)
     * @param documentTypeCode Tipo de documento (opcional, default: ATTACHMENT)
     * @param authentication Información del usuario autenticado
     * @return DocumentResponse con metadata del documento subido
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DocumentResponse>> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "operationId", required = false) String operationId,
            @RequestParam(value = "draftId", required = false) String draftId,
            @RequestParam(value = "fieldCode", required = false) String fieldCode,
            @RequestParam(value = "categoryCode", required = false) String categoryCode,
            @RequestParam(value = "documentTypeCode", required = false) String documentTypeCode,
            Authentication authentication) {

        log.info("POST /client-portal/documents/upload - file: {}, draftId: {}, fieldCode: {}",
                file.getOriginalFilename(), draftId, fieldCode);

        try {
            String userId = getUserId(authentication);

            // Validar archivo
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("El archivo está vacío"));
            }

            // Construir tags para identificar el contexto del documento
            List<String> tags = buildTags(draftId, fieldCode);

            // Crear request para el servicio de documentos
            UploadDocumentRequest request = UploadDocumentRequest.builder()
                    .operationId(operationId)
                    .eventId(draftId) // Usamos draftId como eventId para asociar al borrador
                    .categoryCode(categoryCode != null ? categoryCode : DEFAULT_CATEGORY)
                    .documentTypeCode(documentTypeCode != null ? documentTypeCode : DEFAULT_DOCUMENT_TYPE)
                    .tags(tags)
                    .accessLevel("RESTRICTED") // Documentos de clientes son restringidos por defecto
                    .changeNotes("Documento subido desde portal de clientes")
                    .build();

            // Subir documento usando el servicio existente
            DocumentResponse response = documentService.uploadDocument(file, request, userId);

            log.info("Documento subido exitosamente: {} por usuario {}",
                    response.getDocumentId(), userId);

            return ResponseEntity.ok(ApiResponse.success(
                    "Documento subido exitosamente",
                    response));

        } catch (Exception e) {
            log.error("Error al subir documento desde portal de clientes", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Error al subir documento: " + e.getMessage()));
        }
    }

    /**
     * Obtiene la metadata de un documento.
     *
     * @param documentId ID del documento
     * @param authentication Información del usuario autenticado
     * @return Metadata del documento
     */
    @GetMapping("/{documentId}")
    public ResponseEntity<ApiResponse<DocumentResponse>> getDocument(
            @PathVariable String documentId,
            Authentication authentication) {

        log.debug("GET /client-portal/documents/{}", documentId);

        try {
            String userId = getUserId(authentication);
            DocumentResponse response = documentService.getDocument(documentId, userId);

            return ResponseEntity.ok(ApiResponse.success(
                    "Documento obtenido exitosamente",
                    response));

        } catch (Exception e) {
            log.error("Error al obtener documento: {}", documentId, e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Error al obtener documento: " + e.getMessage()));
        }
    }

    /**
     * Endpoint simplificado para upload que retorna solo la información esencial.
     * Ideal para uso con custom fields FILE_UPLOAD.
     */
    @PostMapping(value = "/upload-simple", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadDocumentSimple(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "operationId", required = false) String operationId,
            @RequestParam(value = "draftId", required = false) String draftId,
            @RequestParam(value = "fieldCode", required = false) String fieldCode,
            @RequestParam(value = "categoryCode", required = false) String categoryCode,
            @RequestParam(value = "documentTypeCode", required = false) String documentTypeCode,
            Authentication authentication) {

        log.info("POST /client-portal/documents/upload-simple - file: {}, operationId: {}",
                file.getOriginalFilename(), operationId);

        try {
            String userId = getUserId(authentication);

            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "El archivo está vacío"
                ));
            }

            List<String> tags = buildTags(draftId, fieldCode);

            UploadDocumentRequest request = UploadDocumentRequest.builder()
                    .operationId(operationId)
                    .eventId(draftId)
                    .categoryCode(categoryCode != null ? categoryCode : DEFAULT_CATEGORY)
                    .documentTypeCode(documentTypeCode != null ? documentTypeCode : DEFAULT_DOCUMENT_TYPE)
                    .tags(tags)
                    .accessLevel("RESTRICTED")
                    .build();

            DocumentResponse response = documentService.uploadDocument(file, request, userId);

            // Build client-portal URLs (instead of /v1/documents/ which CLIENT users can't access)
            String clientPortalDownloadUrl = "/api/client-portal/documents/" + response.getDocumentId() + "/download";
            String clientPortalPreviewUrl = "/api/client-portal/documents/" + response.getDocumentId() + "/preview";

            // Retornar formato simplificado para guardar en custom_data JSON
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "documentId", response.getDocumentId(),
                    "fileName", response.getOriginalFileName(),
                    "fileSize", response.getFileSize(),
                    "formattedFileSize", response.getFormattedFileSize(),
                    "mimeType", response.getMimeType(),
                    "downloadUrl", clientPortalDownloadUrl,
                    "previewUrl", clientPortalPreviewUrl
            ));

        } catch (Exception e) {
            log.error("Error al subir documento (simple)", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Download a document.
     * Client portal users can download documents uploaded by their company.
     */
    @GetMapping("/{documentId}/download")
    public ResponseEntity<org.springframework.core.io.Resource> downloadDocument(
            @PathVariable String documentId,
            Authentication authentication) {

        log.info("GET /client-portal/documents/{}/download", documentId);

        try {
            String userId = getUserId(authentication);

            // Get document metadata first
            com.globalcmx.api.document.entity.DocumentEntity document =
                documentRepository.findById(documentId)
                    .orElseThrow(() -> new RuntimeException("Document not found"));

            java.io.InputStream inputStream = documentService.downloadDocument(documentId, userId);

            // Encode filename for Content-Disposition header
            String encodedFilename = java.net.URLEncoder.encode(document.getOriginalFileName(), java.nio.charset.StandardCharsets.UTF_8)
                    .replace("+", "%20");

            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.parseMediaType(document.getMimeType()))
                    .contentLength(document.getFileSize())
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + document.getOriginalFileName() + "\"; " +
                                    "filename*=UTF-8''" + encodedFilename)
                    .body(new org.springframework.core.io.InputStreamResource(inputStream));

        } catch (Exception e) {
            log.error("Error downloading document: {}", documentId, e);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Preview a document (inline display).
     * Client portal users can preview documents uploaded by their company.
     */
    @GetMapping("/{documentId}/preview")
    public ResponseEntity<org.springframework.core.io.Resource> previewDocument(
            @PathVariable String documentId,
            Authentication authentication) {

        log.info("GET /client-portal/documents/{}/preview", documentId);

        try {
            String userId = getUserId(authentication);

            com.globalcmx.api.document.entity.DocumentEntity document =
                documentRepository.findById(documentId)
                    .orElseThrow(() -> new RuntimeException("Document not found"));

            java.io.InputStream inputStream = documentService.downloadDocument(documentId, userId);

            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.parseMediaType(document.getMimeType()))
                    .contentLength(document.getFileSize())
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline")
                    .body(new org.springframework.core.io.InputStreamResource(inputStream));

        } catch (Exception e) {
            log.error("Error previewing document: {}", documentId, e);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Construye lista de tags para el documento.
     */
    private List<String> buildTags(String draftId, String fieldCode) {
        List<String> tags = new java.util.ArrayList<>();
        tags.add("client-portal");

        if (draftId != null && !draftId.isEmpty()) {
            tags.add("draft:" + draftId);
        }
        if (fieldCode != null && !fieldCode.isEmpty()) {
            tags.add("field:" + fieldCode);
        }

        return tags;
    }

    /**
     * Obtiene el ID del usuario desde la autenticación.
     */
    private String getUserId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return "anonymous";
        }
        return authentication.getName();
    }
}
