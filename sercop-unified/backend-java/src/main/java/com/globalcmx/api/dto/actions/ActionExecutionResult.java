package com.globalcmx.api.dto.actions;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Clase que representa el resultado de la ejecución de una acción.
 * Contiene información sobre el éxito o fracaso de la acción,
 * tiempo de ejecución y datos de salida.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActionExecutionResult {

    /**
     * Tipo de acción ejecutada
     */
    private String actionType;

    /**
     * Indica si la acción se ejecutó exitosamente
     */
    private Boolean success;

    /**
     * Mensaje de error en caso de fallo
     */
    private String errorMessage;

    /**
     * Excepción capturada (solo para logging interno)
     */
    private transient Throwable exception;

    /**
     * Tiempo de ejecución en milisegundos
     */
    private Long executionTimeMs;

    /**
     * Timestamp de inicio de ejecución
     */
    @Builder.Default
    private LocalDateTime executionStartTime = LocalDateTime.now();

    /**
     * Timestamp de fin de ejecución
     */
    private LocalDateTime executionEndTime;

    /**
     * Datos de salida generados por la acción
     * Por ejemplo: ID del documento generado, ID del email enviado, etc.
     */
    @Builder.Default
    private Map<String, Object> outputData = new HashMap<>();

    /**
     * Detalles adicionales de la ejecución
     */
    @Builder.Default
    private Map<String, Object> metadata = new HashMap<>();

    /**
     * Crea un resultado exitoso
     *
     * @param actionType Tipo de acción
     * @return Resultado exitoso
     */
    public static ActionExecutionResult success(String actionType) {
        return ActionExecutionResult.builder()
                .actionType(actionType)
                .success(true)
                .executionStartTime(LocalDateTime.now())
                .build();
    }

    /**
     * Crea un resultado exitoso con datos de salida
     *
     * @param actionType Tipo de acción
     * @param outputData Datos de salida
     * @return Resultado exitoso
     */
    public static ActionExecutionResult success(String actionType, Map<String, Object> outputData) {
        return ActionExecutionResult.builder()
                .actionType(actionType)
                .success(true)
                .outputData(outputData != null ? outputData : new HashMap<>())
                .executionStartTime(LocalDateTime.now())
                .build();
    }

    /**
     * Crea un resultado de fallo
     *
     * @param actionType Tipo de acción
     * @param errorMessage Mensaje de error
     * @return Resultado de fallo
     */
    public static ActionExecutionResult failure(String actionType, String errorMessage) {
        return ActionExecutionResult.builder()
                .actionType(actionType)
                .success(false)
                .errorMessage(errorMessage)
                .executionStartTime(LocalDateTime.now())
                .build();
    }

    /**
     * Crea un resultado de fallo con excepción
     *
     * @param actionType Tipo de acción
     * @param errorMessage Mensaje de error
     * @param exception Excepción capturada
     * @return Resultado de fallo
     */
    public static ActionExecutionResult failure(String actionType, String errorMessage, Throwable exception) {
        return ActionExecutionResult.builder()
                .actionType(actionType)
                .success(false)
                .errorMessage(errorMessage)
                .exception(exception)
                .executionStartTime(LocalDateTime.now())
                .build();
    }

    /**
     * Agrega un dato de salida
     *
     * @param key Clave
     * @param value Valor
     */
    public void addOutputData(String key, Object value) {
        if (this.outputData == null) {
            this.outputData = new HashMap<>();
        }
        this.outputData.put(key, value);
    }

    /**
     * Agrega metadata
     *
     * @param key Clave
     * @param value Valor
     */
    public void addMetadata(String key, Object value) {
        if (this.metadata == null) {
            this.metadata = new HashMap<>();
        }
        this.metadata.put(key, value);
    }

    /**
     * Marca el fin de la ejecución y calcula el tiempo transcurrido
     */
    public void markComplete() {
        this.executionEndTime = LocalDateTime.now();
        if (this.executionStartTime != null) {
            this.executionTimeMs = java.time.Duration.between(
                    this.executionStartTime,
                    this.executionEndTime
            ).toMillis();
        }
    }

    /**
     * Obtiene un resumen de la ejecución en formato String
     *
     * @return Resumen de ejecución
     */
    public String getSummary() {
        StringBuilder sb = new StringBuilder();
        sb.append("Action: ").append(actionType);
        sb.append(" | Success: ").append(success);
        if (!success && errorMessage != null) {
            sb.append(" | Error: ").append(errorMessage);
        }
        if (executionTimeMs != null) {
            sb.append(" | Time: ").append(executionTimeMs).append("ms");
        }
        return sb.toString();
    }
}
