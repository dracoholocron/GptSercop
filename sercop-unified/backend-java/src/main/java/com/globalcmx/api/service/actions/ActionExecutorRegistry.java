package com.globalcmx.api.service.actions;

import com.globalcmx.api.dto.actions.ActionExecutionResult;
import com.globalcmx.api.dto.drools.RuleContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Registro central de todos los ejecutores de acciones disponibles.
 * Este componente permite registrar y obtener ejecutores de acciones
 * de forma dinámica.
 */
@Slf4j
@Component
public class ActionExecutorRegistry {

    private final Map<String, ActionExecutor> executors = new ConcurrentHashMap<>();

    /**
     * Constructor que auto-registra todos los ejecutores disponibles
     *
     * @param executorList Lista de ejecutores inyectados por Spring
     */
    public ActionExecutorRegistry(List<ActionExecutor> executorList) {
        log.info("Inicializando ActionExecutorRegistry con {} ejecutores", executorList.size());

        for (ActionExecutor executor : executorList) {
            registerExecutor(executor);
        }

        log.info("Ejecutores registrados: {}", executors.keySet());
    }

    /**
     * Registra un ejecutor de acciones
     *
     * @param executor Ejecutor a registrar
     */
    public void registerExecutor(ActionExecutor executor) {
        String actionType = executor.getActionType();

        if (executors.containsKey(actionType)) {
            log.warn("Sobrescribiendo ejecutor existente para tipo: {}", actionType);
        }

        executors.put(actionType, executor);
        log.debug("Ejecutor registrado: {} -> {}", actionType, executor.getClass().getSimpleName());
    }

    /**
     * Obtiene un ejecutor por su tipo de acción
     *
     * @param actionType Tipo de acción
     * @return Ejecutor correspondiente o null si no existe
     */
    public ActionExecutor getExecutor(String actionType) {
        if (actionType == null) {
            log.warn("Se intentó obtener un ejecutor con actionType null");
            return null;
        }

        ActionExecutor executor = executors.get(actionType.toUpperCase());

        if (executor == null) {
            log.warn("No se encontró ejecutor para el tipo: {}", actionType);
        }

        return executor;
    }

    /**
     * Verifica si existe un ejecutor para el tipo de acción dado
     *
     * @param actionType Tipo de acción
     * @return true si existe un ejecutor, false en caso contrario
     */
    public boolean hasExecutor(String actionType) {
        return actionType != null && executors.containsKey(actionType.toUpperCase());
    }

    /**
     * Ejecuta una acción usando el ejecutor apropiado
     *
     * @param actionType Tipo de acción a ejecutar
     * @param config Configuración de la acción
     * @param context Contexto de la regla
     * @return Resultado de la ejecución
     */
    public ActionExecutionResult executeAction(String actionType, Map<String, Object> config, RuleContext context) {
        log.debug("Ejecutando acción: {} con config: {}", actionType, config);

        // Validar parámetros
        if (actionType == null || actionType.trim().isEmpty()) {
            String error = "El tipo de acción no puede ser null o vacío";
            log.error(error);
            return ActionExecutionResult.failure("UNKNOWN", error);
        }

        if (config == null) {
            String error = "La configuración de la acción no puede ser null";
            log.error(error);
            return ActionExecutionResult.failure(actionType, error);
        }

        if (context == null) {
            String error = "El contexto de la regla no puede ser null";
            log.error(error);
            return ActionExecutionResult.failure(actionType, error);
        }

        // Obtener ejecutor
        ActionExecutor executor = getExecutor(actionType);

        if (executor == null) {
            String error = String.format("No existe ejecutor para el tipo de acción: %s", actionType);
            log.error(error);
            return ActionExecutionResult.failure(actionType, error);
        }

        // Validar configuración
        try {
            if (!executor.validateConfig(config)) {
                String error = String.format("Configuración inválida para acción tipo: %s", actionType);
                log.error(error + ". Config: {}", config);
                return ActionExecutionResult.failure(actionType, error);
            }
        } catch (Exception e) {
            String error = String.format("Error al validar configuración de acción %s: %s", actionType, e.getMessage());
            log.error(error, e);
            return ActionExecutionResult.failure(actionType, error, e);
        }

        // Ejecutar acción
        try {
            log.info("Ejecutando acción {} - {}", actionType, executor.getActionDescription(config));
            ActionExecutionResult result = executor.execute(config, context);

            if (result.getSuccess()) {
                log.info("Acción {} ejecutada exitosamente en {}ms",
                    actionType, result.getExecutionTimeMs());
            } else {
                log.error("Acción {} falló: {}", actionType, result.getErrorMessage());
            }

            return result;

        } catch (Exception e) {
            String error = String.format("Error al ejecutar acción %s: %s", actionType, e.getMessage());
            log.error(error, e);
            return ActionExecutionResult.failure(actionType, error, e);
        }
    }

    /**
     * Obtiene todos los tipos de acciones registrados
     *
     * @return Set con los tipos de acciones disponibles
     */
    public java.util.Set<String> getRegisteredActionTypes() {
        return executors.keySet();
    }

    /**
     * Obtiene el número de ejecutores registrados
     *
     * @return Número de ejecutores
     */
    public int getExecutorCount() {
        return executors.size();
    }
}
