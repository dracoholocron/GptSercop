package com.globalcmx.api.ai.controller;

import com.globalcmx.api.ai.dto.AIPromptConfigDTO;
import com.globalcmx.api.ai.dto.AIPromptConfigHistoryDTO;
import com.globalcmx.api.ai.service.AIPromptConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controlador REST para gestión de configuración de prompts de IA.
 * Proporciona endpoints para CRUD, versionado y herramientas de ayuda.
 */
@RestController
@RequestMapping("/ai-prompt-config")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "AI Prompt Configuration", description = "Endpoints para configuración de prompts de IA")
public class AIPromptConfigController {

    private final AIPromptConfigService service;

    // =========================================================================
    // OPERACIONES DE LECTURA
    // =========================================================================

    @GetMapping
    @Operation(summary = "Obtiene todos los prompts activos",
               description = "Retorna la lista de prompts de IA activos")
    public ResponseEntity<List<AIPromptConfigDTO>> getAllActive() {
        log.info("GET /ai-prompt-config - Obteniendo prompts activos");
        return ResponseEntity.ok(service.getAllActivePrompts());
    }

    @GetMapping("/all")
    @Operation(summary = "Obtiene todos los prompts",
               description = "Retorna todos los prompts incluyendo inactivos")
    @PreAuthorize("hasAuthority('AI_PROMPT_VIEW')")
    public ResponseEntity<List<AIPromptConfigDTO>> getAll() {
        log.info("GET /ai-prompt-config/all - Obteniendo todos los prompts");
        return ResponseEntity.ok(service.getAllPrompts());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtiene un prompt por ID")
    public ResponseEntity<AIPromptConfigDTO> getById(@PathVariable Long id) {
        log.info("GET /ai-prompt-config/{}", id);
        return service.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/key/{promptKey}")
    @Operation(summary = "Obtiene un prompt por su clave única")
    public ResponseEntity<AIPromptConfigDTO> getByKey(@PathVariable String promptKey) {
        log.info("GET /ai-prompt-config/key/{}", promptKey);
        return service.getByPromptKey(promptKey)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Obtiene prompts por categoría")
    public ResponseEntity<List<AIPromptConfigDTO>> getByCategory(@PathVariable String category) {
        log.info("GET /ai-prompt-config/category/{}", category);
        return ResponseEntity.ok(service.getByCategory(category));
    }

    @GetMapping("/extraction")
    @Operation(summary = "Obtiene prompts para extracción SWIFT",
               description = "Retorna los prompts configurados para un tipo de mensaje e idioma")
    public ResponseEntity<List<AIPromptConfigDTO>> getForExtraction(
            @Parameter(description = "Tipo de mensaje SWIFT (MT700, MT760, etc.)")
            @RequestParam(defaultValue = "ALL") String messageType,
            @Parameter(description = "Idioma (es, en)")
            @RequestParam(defaultValue = "es") String language) {
        log.info("GET /ai-prompt-config/extraction?messageType={}&language={}", messageType, language);
        return ResponseEntity.ok(service.getPromptsForExtraction(messageType, language));
    }

    @GetMapping("/categories")
    @Operation(summary = "Obtiene las categorías disponibles")
    public ResponseEntity<List<String>> getCategories() {
        return ResponseEntity.ok(service.getCategories());
    }

    @GetMapping("/message-types")
    @Operation(summary = "Obtiene los tipos de mensaje configurados")
    public ResponseEntity<List<String>> getMessageTypes() {
        return ResponseEntity.ok(service.getMessageTypes());
    }

    @GetMapping("/search")
    @Operation(summary = "Busca prompts por texto")
    public ResponseEntity<List<AIPromptConfigDTO>> search(
            @Parameter(description = "Texto a buscar")
            @RequestParam String q) {
        log.info("GET /ai-prompt-config/search?q={}", q);
        return ResponseEntity.ok(service.searchPrompts(q));
    }

    @GetMapping("/stats")
    @Operation(summary = "Obtiene estadísticas de los prompts")
    @PreAuthorize("hasAuthority('AI_PROMPT_VIEW')")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(service.getStats());
    }

    // =========================================================================
    // OPERACIONES DE ESCRITURA
    // =========================================================================

    @PostMapping
    @Operation(summary = "Crea un nuevo prompt")
    @PreAuthorize("hasAuthority('AI_PROMPT_CREATE')")
    public ResponseEntity<AIPromptConfigDTO> create(
            @RequestBody AIPromptConfigDTO dto,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "system";
        log.info("POST /ai-prompt-config - Creando prompt: {} por {}", dto.getPromptKey(), username);

        AIPromptConfigDTO created = service.create(dto, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualiza un prompt existente")
    @PreAuthorize("hasAuthority('AI_PROMPT_EDIT')")
    public ResponseEntity<AIPromptConfigDTO> update(
            @PathVariable Long id,
            @RequestBody AIPromptConfigDTO dto,
            @Parameter(description = "Razón del cambio")
            @RequestParam(required = false, defaultValue = "Actualización manual") String changeReason,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "system";
        log.info("PUT /ai-prompt-config/{} - Actualizando por {}: {}", id, username, changeReason);

        AIPromptConfigDTO updated = service.update(id, dto, username, changeReason);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/toggle-active")
    @Operation(summary = "Activa/desactiva un prompt")
    @PreAuthorize("hasAuthority('AI_PROMPT_EDIT')")
    public ResponseEntity<AIPromptConfigDTO> toggleActive(
            @PathVariable Long id,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "system";
        log.info("PATCH /ai-prompt-config/{}/toggle-active por {}", id, username);

        AIPromptConfigDTO updated = service.toggleActive(id, username);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Elimina (desactiva) un prompt")
    @PreAuthorize("hasAuthority('AI_PROMPT_DELETE')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "system";
        log.info("DELETE /ai-prompt-config/{} por {}", id, username);

        service.delete(id, username);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // HISTORIAL Y VERSIONADO
    // =========================================================================

    @GetMapping("/{id}/history")
    @Operation(summary = "Obtiene el historial de versiones de un prompt")
    @PreAuthorize("hasAuthority('AI_PROMPT_VIEW')")
    public ResponseEntity<List<AIPromptConfigHistoryDTO>> getHistory(@PathVariable Long id) {
        log.info("GET /ai-prompt-config/{}/history", id);
        return ResponseEntity.ok(service.getHistory(id));
    }

    @GetMapping("/key/{promptKey}/history")
    @Operation(summary = "Obtiene el historial por clave de prompt")
    @PreAuthorize("hasAuthority('AI_PROMPT_VIEW')")
    public ResponseEntity<List<AIPromptConfigHistoryDTO>> getHistoryByKey(@PathVariable String promptKey) {
        log.info("GET /ai-prompt-config/key/{}/history", promptKey);
        return ResponseEntity.ok(service.getHistoryByKey(promptKey));
    }

    @PostMapping("/key/{promptKey}/restore/{version}")
    @Operation(summary = "Restaura una versión anterior")
    @PreAuthorize("hasAuthority('AI_PROMPT_EDIT')")
    public ResponseEntity<AIPromptConfigDTO> restoreVersion(
            @PathVariable String promptKey,
            @PathVariable Integer version,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "system";
        log.info("POST /ai-prompt-config/key/{}/restore/{} por {}", promptKey, version, username);

        AIPromptConfigDTO restored = service.restoreVersion(promptKey, version, username);
        return ResponseEntity.ok(restored);
    }

    // =========================================================================
    // HERRAMIENTAS DE AYUDA
    // =========================================================================

    @PostMapping("/render")
    @Operation(summary = "Renderiza un template con variables",
               description = "Útil para previsualizar cómo quedará el prompt final")
    public ResponseEntity<Map<String, String>> renderTemplate(
            @RequestBody Map<String, Object> request) {
        String template = (String) request.get("template");
        @SuppressWarnings("unchecked")
        Map<String, String> variables = (Map<String, String>) request.get("variables");

        String rendered = service.renderTemplate(template, variables);
        return ResponseEntity.ok(Map.of("rendered", rendered));
    }

    @GetMapping("/render-extraction")
    @Operation(summary = "Obtiene el prompt completo renderizado para extracción")
    public ResponseEntity<Map<String, String>> getRenderedExtractionPrompt(
            @RequestParam(defaultValue = "MT700") String messageType,
            @RequestParam(defaultValue = "es") String language) {
        log.info("GET /ai-prompt-config/render-extraction?messageType={}&language={}", messageType, language);

        Map<String, String> variables = Map.of(
                "messageType", messageType,
                "language", language
        );

        String rendered = service.getRenderedExtractionPrompt(messageType, language, variables);
        return ResponseEntity.ok(Map.of("prompt", rendered));
    }

    @PostMapping("/validate")
    @Operation(summary = "Valida un template de prompt",
               description = "Verifica errores y proporciona advertencias")
    public ResponseEntity<Map<String, Object>> validateTemplate(
            @RequestBody Map<String, String> request) {
        String template = request.get("template");
        return ResponseEntity.ok(service.validateTemplate(template));
    }

    @PostMapping("/suggestions")
    @Operation(summary = "Obtiene sugerencias de mejora para un prompt")
    @PreAuthorize("hasAuthority('AI_PROMPT_VIEW')")
    public ResponseEntity<Map<String, Object>> getSuggestions(
            @RequestBody Map<String, String> request) {
        String template = request.get("template");
        String category = request.get("category");
        return ResponseEntity.ok(service.getSuggestions(template, category));
    }

    @PostMapping("/extract-variables")
    @Operation(summary = "Extrae las variables de un template")
    public ResponseEntity<List<String>> extractVariables(
            @RequestBody Map<String, String> request) {
        String template = request.get("template");
        return ResponseEntity.ok(service.extractVariables(template));
    }
}
