package com.globalcmx.api.externalapi.controller;

import com.globalcmx.api.externalapi.dto.OpenApiParseResponse;
import com.globalcmx.api.externalapi.dto.command.*;
import com.globalcmx.api.externalapi.dto.query.TestResultResponse;
import com.globalcmx.api.externalapi.entity.ExternalApiConfigReadModel;
import com.globalcmx.api.externalapi.service.OpenApiParserService;
import com.globalcmx.api.externalapi.service.command.ExternalApiConfigCommandService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/admin/external-api/commands")
@RequiredArgsConstructor
@Slf4j
public class ExternalApiConfigCommandController {

    private final ExternalApiConfigCommandService commandService;
    private final OpenApiParserService openApiParserService;

    @PostMapping
    @PreAuthorize("hasAuthority('CAN_CREATE_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> create(
            @Valid @RequestBody CreateExternalApiConfigCommand command) {
        try {
            log.info("Creating external API config: {}", command.getCode());
            ExternalApiConfigReadModel config = commandService.create(command);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Configuracion de API creada exitosamente");
            response.put("data", config);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("Error creating API config: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('CAN_EDIT_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateExternalApiConfigCommand command) {
        try {
            log.info("Updating external API config: {}", id);
            ExternalApiConfigReadModel config = commandService.update(id, command);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Configuracion actualizada exitosamente");
            response.put("data", config);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error updating API config: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('CAN_DELETE_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Long id) {
        try {
            log.info("Deleting external API config: {}", id);
            commandService.delete(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Configuracion eliminada exitosamente");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error deleting API config: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @PostMapping("/{id}/test")
    @PreAuthorize("hasAuthority('CAN_TEST_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> testConnection(
            @PathVariable Long id,
            @RequestBody(required = false) TestApiConnectionCommand command) {
        try {
            log.info("Testing connection for API config: {}", id);
            TestResultResponse result = commandService.testConnection(id, command != null ? command : new TestApiConnectionCommand());

            Map<String, Object> response = new HashMap<>();
            response.put("success", result.getSuccess());
            response.put("message", result.getMessage());
            response.put("data", result);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error testing API connection: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @PostMapping("/{id}/toggle-active")
    @PreAuthorize("hasAuthority('CAN_EDIT_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> toggleActive(@PathVariable Long id) {
        try {
            ExternalApiConfigReadModel config = commandService.toggleActive(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", config.getActive() ? "API activada" : "API desactivada");
            response.put("data", config);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error toggling API active state: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    /**
     * Parse an OpenAPI/Swagger specification file.
     * Supports both JSON and YAML formats, OpenAPI 2.0 (Swagger) and 3.0/3.1.
     *
     * @param file The OpenAPI specification file
     * @return Parsed specification with endpoints and security schemes
     */
    @PostMapping(value = "/parse-openapi", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('CAN_CREATE_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> parseOpenApiFile(
            @RequestParam("file") MultipartFile file) {
        try {
            log.info("Parsing OpenAPI specification file: {}", file.getOriginalFilename());

            if (file.isEmpty()) {
                throw new IllegalArgumentException("El archivo esta vacio");
            }

            // Validate file extension
            String filename = file.getOriginalFilename();
            if (filename != null && !filename.toLowerCase().endsWith(".json") &&
                !filename.toLowerCase().endsWith(".yaml") &&
                !filename.toLowerCase().endsWith(".yml")) {
                throw new IllegalArgumentException("Formato no soportado. Use archivos .json, .yaml o .yml");
            }

            // Read file content
            String content = new String(file.getBytes(), StandardCharsets.UTF_8);

            // Parse the specification
            OpenApiParseResponse parseResult = openApiParserService.parseSpecification(content);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Especificacion OpenAPI parseada exitosamente");
            response.put("data", parseResult);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error parsing OpenAPI file: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al parsear el archivo: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    /**
     * Parse an OpenAPI/Swagger specification from URL.
     *
     * @param url The URL to the OpenAPI specification
     * @return Parsed specification with endpoints and security schemes
     */
    @PostMapping("/parse-openapi-url")
    @PreAuthorize("hasAuthority('CAN_CREATE_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> parseOpenApiUrl(
            @RequestBody Map<String, String> request) {
        try {
            String url = request.get("url");
            if (url == null || url.isEmpty()) {
                throw new IllegalArgumentException("URL es requerida");
            }

            log.info("Parsing OpenAPI specification from URL: {}", url);

            // Fetch content from URL
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            java.net.http.HttpRequest httpRequest = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(url))
                    .timeout(java.time.Duration.ofSeconds(30))
                    .GET()
                    .build();

            java.net.http.HttpResponse<String> httpResponse =
                    client.send(httpRequest, java.net.http.HttpResponse.BodyHandlers.ofString());

            if (httpResponse.statusCode() != 200) {
                throw new IllegalArgumentException("Error al obtener la especificacion: HTTP " + httpResponse.statusCode());
            }

            String content = httpResponse.body();

            // Parse the specification
            OpenApiParseResponse parseResult = openApiParserService.parseSpecification(content);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Especificacion OpenAPI parseada exitosamente");
            response.put("data", parseResult);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error parsing OpenAPI from URL: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al parsear desde URL: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
}
