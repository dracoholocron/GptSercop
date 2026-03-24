package com.globalcmx.api.service.actions;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.actions.ActionConfig;
import com.globalcmx.api.dto.actions.ActionExecutionResult;
import com.globalcmx.api.dto.drools.RuleContext;
import com.globalcmx.api.entity.ReglaEvento;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

/**
 * Servicio orquestador de acciones para reglas de eventos.
 * Se encarga de parsear las acciones configuradas en JSON y ejecutarlas
 * usando el registry de ejecutores correspondiente.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ActionExecutionService {

    private final ActionExecutorRegistry executorRegistry;
    private final ObjectMapper objectMapper;

    // Pool de threads para ejecución asíncrona de acciones
    private final ExecutorService asyncExecutor = Executors.newFixedThreadPool(10);

    /**
     * Ejecuta todas las acciones configuradas para una regla
     *
     * @param regla Regla de evento con las acciones configuradas
     * @param context Contexto de la regla con datos del evento
     * @return Mapa con resultados de ejecución de cada acción
     */
    public Map<String, ActionExecutionResult> executeActions(ReglaEvento regla, RuleContext context) {
        log.info("Ejecutando acciones para regla: {} ({})", regla.getCodigo(), regla.getNombre());

        Map<String, ActionExecutionResult> results = new LinkedHashMap<>();

        try {
            // Parsear acciones desde JSON
            List<ActionConfig> actions = parseActionsJson(regla.getAccionesJson());

            if (actions == null || actions.isEmpty()) {
                log.warn("La regla {} no tiene acciones configuradas", regla.getCodigo());
                return results;
            }

            log.info("Se encontraron {} acciones para ejecutar", actions.size());

            // Ordenar acciones por orden si está especificado
            actions.sort(Comparator.comparingInt(a -> a.getOrden() != null ? a.getOrden() : 999));

            // Ejecutar acciones
            for (int i = 0; i < actions.size(); i++) {
                ActionConfig action = actions.get(i);
                String actionKey = String.format("action_%d_%s", i + 1, action.getTipo());

                try {
                    ActionExecutionResult result;

                    if (action.getAsync() != null && action.getAsync()) {
                        // Ejecución asíncrona
                        log.debug("Ejecutando acción {} de forma asíncrona", actionKey);
                        result = executeActionAsync(action, context);
                    } else {
                        // Ejecución síncrona
                        log.debug("Ejecutando acción {} de forma síncrona", actionKey);
                        result = executeActionSync(action, context);
                    }

                    results.put(actionKey, result);

                    // Si la acción falló y no se debe continuar, detener ejecución
                    if (!result.getSuccess() && !action.getContinueOnError()) {
                        log.warn("Acción {} falló y continueOnError=false, deteniendo ejecución de acciones restantes",
                            actionKey);
                        break;
                    }

                } catch (Exception e) {
                    log.error("Error inesperado al ejecutar acción {}", actionKey, e);
                    ActionExecutionResult errorResult = ActionExecutionResult.failure(
                        action.getTipo().toString(),
                        "Error inesperado: " + e.getMessage(),
                        e
                    );
                    results.put(actionKey, errorResult);

                    if (!action.getContinueOnError()) {
                        break;
                    }
                }
            }

            // Resumen de ejecución
            logExecutionSummary(regla.getCodigo(), results);

        } catch (Exception e) {
            log.error("Error al ejecutar acciones para regla {}", regla.getCodigo(), e);
        }

        return results;
    }

    /**
     * Ejecuta una acción de forma síncrona
     */
    private ActionExecutionResult executeActionSync(ActionConfig action, RuleContext context) {
        String actionType = action.getTipo().toString();
        Map<String, Object> config = action.getConfig();

        log.debug("Ejecutando acción síncrona: tipo={}, config={}", actionType, config);

        return executorRegistry.executeAction(actionType, config, context);
    }

    /**
     * Ejecuta una acción de forma asíncrona
     * Nota: Retorna un resultado inmediato, la ejecución real ocurre en background
     */
    private ActionExecutionResult executeActionAsync(ActionConfig action, RuleContext context) {
        String actionType = action.getTipo().toString();
        Map<String, Object> config = action.getConfig();

        log.debug("Lanzando acción asíncrona: tipo={}, config={}", actionType, config);

        // Crear resultado preliminar
        ActionExecutionResult asyncResult = ActionExecutionResult.success(actionType);
        asyncResult.addMetadata("async", true);
        asyncResult.addMetadata("status", "submitted");

        // Ejecutar en background
        CompletableFuture.runAsync(() -> {
            try {
                log.debug("Ejecutando acción asíncrona en background: {}", actionType);
                ActionExecutionResult result = executorRegistry.executeAction(actionType, config, context);
                log.info("Acción asíncrona completada: {} - {}", actionType, result.getSuccess() ? "éxito" : "fallo");
            } catch (Exception e) {
                log.error("Error en ejecución asíncrona de acción {}", actionType, e);
            }
        }, asyncExecutor);

        return asyncResult;
    }

    /**
     * Parsea el JSON de acciones a una lista de ActionConfig
     */
    private List<ActionConfig> parseActionsJson(String accionesJson) {
        if (accionesJson == null || accionesJson.trim().isEmpty()) {
            return Collections.emptyList();
        }

        try {
            log.debug("Parseando JSON de acciones: {}", accionesJson);

            // Parsear a lista de Maps
            List<Map<String, Object>> actionMaps = objectMapper.readValue(
                accionesJson,
                new TypeReference<List<Map<String, Object>>>() {}
            );

            // Convertir a ActionConfig
            List<ActionConfig> actions = new ArrayList<>();
            for (Map<String, Object> actionMap : actionMaps) {
                try {
                    ActionConfig config = convertMapToActionConfig(actionMap);
                    actions.add(config);
                } catch (Exception e) {
                    log.error("Error al convertir acción: {}", actionMap, e);
                }
            }

            return actions;

        } catch (Exception e) {
            log.error("Error al parsear JSON de acciones", e);
            return Collections.emptyList();
        }
    }

    /**
     * Convierte un Map a ActionConfig
     */
    private ActionConfig convertMapToActionConfig(Map<String, Object> map) {
        String tipo = (String) map.get("tipo");
        @SuppressWarnings("unchecked")
        Map<String, Object> config = (Map<String, Object>) map.getOrDefault("config", new HashMap<>());
        Integer orden = map.containsKey("orden") ? ((Number) map.get("orden")).intValue() : null;
        Boolean async = map.containsKey("async") ? (Boolean) map.get("async") : false;
        Boolean continueOnError = map.containsKey("continueOnError") ?
            (Boolean) map.get("continueOnError") : true;

        return ActionConfig.builder()
            .tipo(ActionConfig.ActionType.valueOf(tipo.toUpperCase()))
            .config(config)
            .orden(orden)
            .async(async)
            .continueOnError(continueOnError)
            .build();
    }

    /**
     * Registra un resumen de la ejecución de acciones
     */
    private void logExecutionSummary(String reglaCodigo, Map<String, ActionExecutionResult> results) {
        long successCount = results.values().stream().filter(ActionExecutionResult::getSuccess).count();
        long failureCount = results.size() - successCount;

        log.info("=== RESUMEN DE EJECUCIÓN DE ACCIONES ===");
        log.info("Regla: {}", reglaCodigo);
        log.info("Total acciones: {}", results.size());
        log.info("Exitosas: {}", successCount);
        log.info("Fallidas: {}", failureCount);

        // Detalles de cada acción
        results.forEach((key, result) -> {
            log.info("  - {}: {} ({}ms)",
                key,
                result.getSuccess() ? "OK" : "FAILED",
                result.getExecutionTimeMs()
            );
            if (!result.getSuccess() && result.getErrorMessage() != null) {
                log.info("    Error: {}", result.getErrorMessage());
            }
        });

        log.info("========================================");
    }

    /**
     * Ejecuta una acción individual (método público para uso externo)
     *
     * @param actionType Tipo de acción
     * @param config Configuración de la acción
     * @param context Contexto de la regla
     * @return Resultado de la ejecución
     */
    public ActionExecutionResult executeSingleAction(String actionType,
                                                     Map<String, Object> config,
                                                     RuleContext context) {
        log.info("Ejecutando acción individual: {}", actionType);
        return executorRegistry.executeAction(actionType, config, context);
    }

    /**
     * Valida que una configuración de acciones sea correcta
     *
     * @param accionesJson JSON con las acciones
     * @return true si es válido, false en caso contrario
     */
    public boolean validateActionsJson(String accionesJson) {
        try {
            List<ActionConfig> actions = parseActionsJson(accionesJson);

            for (ActionConfig action : actions) {
                // Verificar que el tipo de acción tenga un ejecutor registrado
                if (!executorRegistry.hasExecutor(action.getTipo().toString())) {
                    log.error("No existe ejecutor para tipo de acción: {}", action.getTipo());
                    return false;
                }

                // Validar configuración
                ActionExecutor executor = executorRegistry.getExecutor(action.getTipo().toString());
                if (!executor.validateConfig(action.getConfig())) {
                    log.error("Configuración inválida para acción tipo: {}", action.getTipo());
                    return false;
                }
            }

            return true;

        } catch (Exception e) {
            log.error("Error al validar JSON de acciones", e);
            return false;
        }
    }

    /**
     * Obtiene información sobre los tipos de acciones disponibles
     *
     * @return Set con los tipos de acciones registrados
     */
    public Set<String> getAvailableActionTypes() {
        return executorRegistry.getRegisteredActionTypes();
    }

    /**
     * Cierra el executor de tareas asíncronas
     */
    public void shutdown() {
        log.info("Cerrando executor de acciones asíncronas");
        asyncExecutor.shutdown();
    }
}
