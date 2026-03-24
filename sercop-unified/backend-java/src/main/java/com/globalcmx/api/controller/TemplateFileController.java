package com.globalcmx.api.controller;

import com.globalcmx.api.readmodel.entity.PlantillaReadModel;
import com.globalcmx.api.readmodel.repository.PlantillaReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/plantillas/files")
@RequiredArgsConstructor
@Slf4j
public class TemplateFileController {

    private final PlantillaReadModelRepository plantillaReadModelRepository;

    @Value("${plantillas.storage.path:${user.home}/plantillas}")
    private String storagePath;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                throw new IllegalArgumentException("El archivo está vacío");
            }

            // Crear directorio si no existe
            Path uploadPath = Paths.get(storagePath);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generar nombre único para el archivo
            String originalFilename = file.getOriginalFilename();
            String fileExtension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : "";
            String uniqueFilename = UUID.randomUUID().toString() + fileExtension;

            // Guardar archivo
            Path filePath = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            log.info("Archivo cargado exitosamente: {}", uniqueFilename);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Archivo cargado exitosamente");
            response.put("data", Map.of(
                "nombreArchivo", originalFilename,
                "rutaArchivo", uniqueFilename,
                "tamanioArchivo", file.getSize(),
                "tipoDocumento", determineFileType(fileExtension)
            ));

            return ResponseEntity.ok(response);
        } catch (IOException e) {
            log.error("Error al cargar archivo: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al cargar archivo: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id) {
        try {
            PlantillaReadModel plantilla = plantillaReadModelRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Plantilla no encontrada"));

            Path filePath = Paths.get(storagePath).resolve(plantilla.getRutaArchivo());
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                throw new RuntimeException("No se puede leer el archivo");
            }

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"" + plantilla.getNombreArchivo() + "\"")
                .body(resource);
        } catch (Exception e) {
            log.error("Error al descargar archivo: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/preview/{id}")
    public ResponseEntity<Resource> previewFile(@PathVariable Long id) {
        try {
            PlantillaReadModel plantilla = plantillaReadModelRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Plantilla no encontrada"));

            Path filePath = Paths.get(storagePath).resolve(plantilla.getRutaArchivo());
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                throw new RuntimeException("No se puede leer el archivo");
            }

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(resource);
        } catch (Exception e) {
            log.error("Error al obtener vista previa del archivo: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


    @DeleteMapping("/{rutaArchivo}")
    public ResponseEntity<Map<String, Object>> deleteFile(@PathVariable String rutaArchivo) {
        try {
            Path filePath = Paths.get(storagePath).resolve(rutaArchivo);
            Files.deleteIfExists(filePath);

            log.info("Archivo eliminado exitosamente: {}", rutaArchivo);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Archivo eliminado exitosamente");

            return ResponseEntity.ok(response);
        } catch (IOException e) {
            log.error("Error al eliminar archivo: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al eliminar archivo: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    private String determineFileType(String extension) {
        return switch (extension.toLowerCase()) {
            case ".pdf" -> "PDF";
            case ".html", ".htm" -> "HTML";
            default -> "OTRO";
        };
    }
}
