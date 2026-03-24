package com.globalcmx.api.ai.service;

import com.globalcmx.api.ai.dto.AIPromptConfigDTO;
import com.globalcmx.api.ai.dto.AIPromptConfigHistoryDTO;
import com.globalcmx.api.ai.entity.AIPromptConfig;
import com.globalcmx.api.ai.entity.AIPromptConfigHistory;
import com.globalcmx.api.ai.repository.AIPromptConfigHistoryRepository;
import com.globalcmx.api.ai.repository.AIPromptConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Servicio para gestión de configuración de prompts de IA.
 * Proporciona operaciones CRUD y funcionalidades adicionales como
 * versionado, renderizado de templates y sugerencias de mejora.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AIPromptConfigService {

    private final AIPromptConfigRepository repository;
    private final AIPromptConfigHistoryRepository historyRepository;

    // Patrón para detectar variables en el template: {{variableName}}
    private static final Pattern VARIABLE_PATTERN = Pattern.compile("\\{\\{(\\w+)\\}\\}");

    // =========================================================================
    // OPERACIONES DE LECTURA
    // =========================================================================

    /**
     * Obtiene todos los prompts activos
     */
    public List<AIPromptConfigDTO> getAllActivePrompts() {
        return repository.findByIsActiveTrueOrderByCategory()
                .stream()
                .map(AIPromptConfigDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene todos los prompts (incluyendo inactivos)
     */
    public List<AIPromptConfigDTO> getAllPrompts() {
        return repository.findAll()
                .stream()
                .map(AIPromptConfigDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene un prompt por ID
     */
    public Optional<AIPromptConfigDTO> getById(Long id) {
        return repository.findById(id).map(AIPromptConfigDTO::fromEntity);
    }

    /**
     * Obtiene un prompt por su clave única
     */
    public Optional<AIPromptConfigDTO> getByPromptKey(String promptKey) {
        return repository.findByPromptKeyAndIsActiveTrue(promptKey)
                .map(AIPromptConfigDTO::fromEntity);
    }

    /**
     * Obtiene prompts por categoría
     */
    public List<AIPromptConfigDTO> getByCategory(String category) {
        return repository.findByCategoryAndIsActiveTrueOrderByDisplayName(category)
                .stream()
                .map(AIPromptConfigDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene prompts para extracción SWIFT
     */
    public List<AIPromptConfigDTO> getPromptsForExtraction(String messageType, String language) {
        return repository.findPromptsForExtraction(messageType, language)
                .stream()
                .map(AIPromptConfigDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene las categorías disponibles
     */
    public List<String> getCategories() {
        return repository.findDistinctCategories();
    }

    /**
     * Obtiene los tipos de mensaje configurados
     */
    public List<String> getMessageTypes() {
        return repository.findDistinctMessageTypes();
    }

    /**
     * Busca prompts por texto
     */
    public List<AIPromptConfigDTO> searchPrompts(String searchText) {
        return repository.searchPrompts(searchText)
                .stream()
                .map(AIPromptConfigDTO::fromEntity)
                .collect(Collectors.toList());
    }

    // =========================================================================
    // OPERACIONES DE ESCRITURA
    // =========================================================================

    /**
     * Crea un nuevo prompt
     */
    @Transactional
    public AIPromptConfigDTO create(AIPromptConfigDTO dto, String username) {
        if (repository.existsByPromptKey(dto.getPromptKey())) {
            throw new IllegalArgumentException("Ya existe un prompt con la clave: " + dto.getPromptKey());
        }

        AIPromptConfig entity = dto.toEntity();
        entity.setVersion(1);
        entity.setCreatedBy(username);
        entity.setUpdatedBy(username);

        AIPromptConfig saved = repository.save(entity);
        log.info("Prompt creado: {} por {}", saved.getPromptKey(), username);

        return AIPromptConfigDTO.fromEntity(saved);
    }

    /**
     * Actualiza un prompt existente (crea versión en historial)
     */
    @Transactional
    public AIPromptConfigDTO update(Long id, AIPromptConfigDTO dto, String username, String changeReason) {
        AIPromptConfig existing = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Prompt no encontrado: " + id));

        // Guardar versión anterior en historial
        saveToHistory(existing, username, changeReason);

        // Actualizar prompt
        existing.setDisplayName(dto.getDisplayName());
        existing.setDescription(dto.getDescription());
        existing.setCategory(dto.getCategory());
        existing.setLanguage(dto.getLanguage());
        existing.setMessageType(dto.getMessageType());
        existing.setPromptTemplate(dto.getPromptTemplate());
        existing.setAvailableVariables(dto.getAvailableVariables());
        existing.setConfig(dto.getConfig());
        existing.setIsActive(dto.getIsActive());
        existing.setVersion(existing.getVersion() + 1);
        existing.setUpdatedBy(username);

        AIPromptConfig saved = repository.save(existing);
        log.info("Prompt actualizado: {} v{} por {}", saved.getPromptKey(), saved.getVersion(), username);

        return AIPromptConfigDTO.fromEntity(saved);
    }

    /**
     * Activa/desactiva un prompt
     */
    @Transactional
    public AIPromptConfigDTO toggleActive(Long id, String username) {
        AIPromptConfig existing = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Prompt no encontrado: " + id));

        existing.setIsActive(!existing.getIsActive());
        existing.setUpdatedBy(username);

        AIPromptConfig saved = repository.save(existing);
        log.info("Prompt {} {} por {}", saved.getPromptKey(),
                saved.getIsActive() ? "activado" : "desactivado", username);

        return AIPromptConfigDTO.fromEntity(saved);
    }

    /**
     * Elimina un prompt (soft delete - desactiva)
     */
    @Transactional
    public void delete(Long id, String username) {
        AIPromptConfig existing = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Prompt no encontrado: " + id));

        existing.setIsActive(false);
        existing.setUpdatedBy(username);
        repository.save(existing);

        log.info("Prompt eliminado (desactivado): {} por {}", existing.getPromptKey(), username);
    }

    // =========================================================================
    // HISTORIAL Y VERSIONADO
    // =========================================================================

    /**
     * Guarda una versión en el historial
     */
    private void saveToHistory(AIPromptConfig config, String username, String reason) {
        AIPromptConfigHistory history = AIPromptConfigHistory.builder()
                .promptConfigId(config.getId())
                .promptKey(config.getPromptKey())
                .version(config.getVersion())
                .promptTemplate(config.getPromptTemplate())
                .availableVariables(config.getAvailableVariables())
                .config(config.getConfig())
                .changedBy(username)
                .changedAt(LocalDateTime.now())
                .changeReason(reason)
                .build();

        historyRepository.save(history);
    }

    /**
     * Obtiene el historial de versiones de un prompt
     */
    public List<AIPromptConfigHistoryDTO> getHistory(Long promptConfigId) {
        return historyRepository.findByPromptConfigIdOrderByVersionDesc(promptConfigId)
                .stream()
                .map(AIPromptConfigHistoryDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene el historial por clave de prompt
     */
    public List<AIPromptConfigHistoryDTO> getHistoryByKey(String promptKey) {
        return historyRepository.findByPromptKeyOrderByVersionDesc(promptKey)
                .stream()
                .map(AIPromptConfigHistoryDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Restaura una versión anterior
     */
    @Transactional
    public AIPromptConfigDTO restoreVersion(String promptKey, Integer version, String username) {
        AIPromptConfigHistory history = historyRepository.findByPromptKeyAndVersion(promptKey, version)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Versión no encontrada: " + promptKey + " v" + version));

        AIPromptConfig current = repository.findByPromptKey(promptKey)
                .orElseThrow(() -> new IllegalArgumentException("Prompt no encontrado: " + promptKey));

        // Guardar versión actual en historial
        saveToHistory(current, username, "Restaurando a versión " + version);

        // Restaurar
        current.setPromptTemplate(history.getPromptTemplate());
        current.setAvailableVariables(history.getAvailableVariables());
        current.setConfig(history.getConfig());
        current.setVersion(current.getVersion() + 1);
        current.setUpdatedBy(username);

        AIPromptConfig saved = repository.save(current);
        log.info("Prompt {} restaurado a v{} por {}", promptKey, version, username);

        return AIPromptConfigDTO.fromEntity(saved);
    }

    // =========================================================================
    // RENDERIZADO DE TEMPLATES
    // =========================================================================

    /**
     * Renderiza un template con las variables proporcionadas
     */
    public String renderTemplate(String template, Map<String, String> variables) {
        if (template == null || variables == null) {
            return template;
        }

        String result = template;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            String placeholder = "{{" + entry.getKey() + "}}";
            result = result.replace(placeholder, entry.getValue() != null ? entry.getValue() : "");
        }

        return result;
    }

    /**
     * Obtiene el prompt completo renderizado para extracción
     */
    public String getRenderedExtractionPrompt(String messageType, String language, Map<String, String> variables) {
        List<AIPromptConfig> prompts = repository.findPromptsForExtraction(messageType, language);

        StringBuilder fullPrompt = new StringBuilder();

        for (AIPromptConfig prompt : prompts) {
            String rendered = renderTemplate(prompt.getPromptTemplate(), variables);
            fullPrompt.append(rendered).append("\n\n");
        }

        return fullPrompt.toString().trim();
    }

    /**
     * Extrae las variables usadas en un template
     */
    public List<String> extractVariables(String template) {
        if (template == null) return List.of();

        Matcher matcher = VARIABLE_PATTERN.matcher(template);
        return matcher.results()
                .map(m -> m.group(1))
                .distinct()
                .collect(Collectors.toList());
    }

    // =========================================================================
    // VALIDACIÓN Y SUGERENCIAS
    // =========================================================================

    /**
     * Valida un template de prompt
     */
    public Map<String, Object> validateTemplate(String template) {
        Map<String, Object> result = new HashMap<>();
        result.put("isValid", true);
        result.put("errors", List.of());
        result.put("warnings", List.of());
        result.put("variables", extractVariables(template));

        List<String> errors = new java.util.ArrayList<>();
        List<String> warnings = new java.util.ArrayList<>();

        if (template == null || template.trim().isEmpty()) {
            errors.add("El template no puede estar vacío");
            result.put("isValid", false);
        } else {
            // Verificar longitud
            if (template.length() < 100) {
                warnings.add("El template parece muy corto. Considera agregar más instrucciones.");
            }

            // Verificar que tenga estructura JSON si es de extracción
            if (!template.contains("JSON") && !template.contains("json")) {
                warnings.add("El template no menciona formato JSON. Asegúrate de incluir instrucciones de formato.");
            }

            // Verificar variables no cerradas
            int openCount = template.split("\\{\\{").length - 1;
            int closeCount = template.split("\\}\\}").length - 1;
            if (openCount != closeCount) {
                errors.add("Hay variables mal formadas ({{ sin cerrar con }})");
                result.put("isValid", false);
            }
        }

        result.put("errors", errors);
        result.put("warnings", warnings);
        result.put("characterCount", template != null ? template.length() : 0);

        return result;
    }

    /**
     * Genera sugerencias de mejora para un prompt
     */
    public Map<String, Object> getSuggestions(String template, String category) {
        Map<String, Object> suggestions = new HashMap<>();
        List<String> improvements = new java.util.ArrayList<>();
        List<String> bestPractices = new java.util.ArrayList<>();

        // Sugerencias basadas en categoría
        if ("EXTRACTION".equals(category)) {
            if (!template.contains("confidence")) {
                improvements.add("Considera solicitar un puntaje de confianza para cada campo extraído");
            }
            if (!template.contains("evidence") && !template.contains("evidencia")) {
                improvements.add("Incluye instrucciones para proporcionar evidencia del texto fuente");
            }
            bestPractices.add("Define claramente el formato de salida JSON esperado");
            bestPractices.add("Incluye ejemplos de campos y sus formatos");
        }

        if ("ANALYSIS".equals(category)) {
            if (!template.contains("severity") && !template.contains("severidad")) {
                improvements.add("Considera incluir niveles de severidad en los análisis");
            }
            bestPractices.add("Estructura el análisis en secciones claras");
            bestPractices.add("Incluye recomendaciones accionables");
        }

        if ("ACTIONS".equals(category)) {
            if (!template.contains("priority") && !template.contains("prioridad")) {
                improvements.add("Incluye niveles de prioridad para las acciones");
            }
            if (!template.contains("dueDate") && !template.contains("fecha")) {
                improvements.add("Considera solicitar fechas límite para las acciones");
            }
            if (!template.contains("responsible") && !template.contains("responsable")) {
                improvements.add("Incluye asignación de responsables para las acciones");
            }
            bestPractices.add("Define claramente los tipos de acciones disponibles");
            bestPractices.add("Incluye flujos SWIFT típicos como referencia");
        }

        // Sugerencias generales
        if (template.length() > 5000) {
            improvements.add("El prompt es muy largo. Considera dividirlo en prompts más pequeños por categoría");
        }

        suggestions.put("improvements", improvements);
        suggestions.put("bestPractices", bestPractices);
        suggestions.put("estimatedTokens", template != null ? template.length() / 4 : 0);

        return suggestions;
    }

    // =========================================================================
    // ESTADÍSTICAS
    // =========================================================================

    /**
     * Obtiene estadísticas de los prompts
     */
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();

        List<AIPromptConfig> all = repository.findAll();
        long activeCount = all.stream().filter(AIPromptConfig::getIsActive).count();
        long inactiveCount = all.size() - activeCount;

        stats.put("totalPrompts", all.size());
        stats.put("activePrompts", activeCount);
        stats.put("inactivePrompts", inactiveCount);
        stats.put("categories", repository.findDistinctCategories());
        stats.put("messageTypes", repository.findDistinctMessageTypes());

        // Promedio de versiones
        double avgVersion = all.stream()
                .mapToInt(AIPromptConfig::getVersion)
                .average()
                .orElse(1.0);
        stats.put("averageVersion", avgVersion);

        return stats;
    }
}
