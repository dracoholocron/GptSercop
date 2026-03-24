package com.globalcmx.api.service.actions;

import com.globalcmx.api.dto.actions.ActionExecutionResult;
import com.globalcmx.api.dto.drools.RuleContext;

import java.util.Map;

/**
 * Interface común para todos los ejecutores de acciones.
 * Cada tipo de acción (EMAIL, DOCUMENTO, API, AUDITORIA) debe implementar esta interface.
 */
public interface ActionExecutor {

    /**
     * Ejecuta la acción con la configuración y contexto proporcionados
     *
     * @param config Mapa con la configuración específica de la acción
     * @param context Contexto de la regla con datos del evento
     * @return Resultado de la ejecución
     */
    ActionExecutionResult execute(Map<String, Object> config, RuleContext context);

    /**
     * Obtiene el tipo de acción que maneja este ejecutor
     *
     * @return Tipo de acción (EMAIL, DOCUMENTO, API, AUDITORIA)
     */
    String getActionType();

    /**
     * Valida que la configuración sea correcta para este tipo de acción
     *
     * @param config Configuración a validar
     * @return true si la configuración es válida, false en caso contrario
     */
    boolean validateConfig(Map<String, Object> config);

    /**
     * Obtiene los campos requeridos para la configuración de esta acción
     *
     * @return Array con los nombres de los campos requeridos
     */
    default String[] getRequiredConfigFields() {
        return new String[0];
    }

    /**
     * Obtiene una descripción de la acción para logging
     *
     * @param config Configuración de la acción
     * @return Descripción de la acción
     */
    default String getActionDescription(Map<String, Object> config) {
        return getActionType() + " action";
    }
}
