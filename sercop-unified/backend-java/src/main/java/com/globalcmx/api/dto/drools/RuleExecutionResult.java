package com.globalcmx.api.dto.drools;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Resultado de la ejecución de una regla DRL en Drools
 * Encapsula toda la información sobre el resultado de evaluar una regla,
 * incluyendo si se disparó, qué acciones se ejecutaron, y datos de salida.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RuleExecutionResult {

    /**
     * Indica si la regla fue evaluada y sus condiciones se cumplieron
     */
    @Builder.Default
    private boolean ruleMatched = false;

    /**
     * Lista de acciones que fueron disparadas por la regla
     * Ejemplo: ["SEND_EMAIL", "NOTIFY_SUPERVISOR", "BLOCK_OPERATION"]
     */
    @Builder.Default
    private List<String> triggeredActions = new ArrayList<>();

    /**
     * Datos de salida generados por la regla
     * Puede contener información adicional calculada o determinada por la regla
     * Ejemplo: {"approvalRequired": true, "approvalLevel": 2, "estimatedTime": "24h"}
     */
    @Builder.Default
    private Map<String, Object> outputData = new HashMap<>();

    /**
     * Mensaje de error si la ejecución falló
     * null si la ejecución fue exitosa
     */
    private String errorMessage;

    /**
     * Mensajes informativos o de advertencia generados durante la evaluación
     */
    @Builder.Default
    private List<String> messages = new ArrayList<>();

    /**
     * Número de reglas que se dispararon en la sesión
     * (útil cuando se ejecutan múltiples reglas)
     */
    @Builder.Default
    private int firedRulesCount = 0;

    /**
     * Tiempo de ejecución en milisegundos
     */
    private Long executionTimeMs;

    /**
     * Nombre de la regla que se ejecutó
     */
    private String ruleName;

    /**
     * Indica si hubo errores durante la ejecución
     */
    public boolean hasError() {
        return errorMessage != null && !errorMessage.isEmpty();
    }

    /**
     * Indica si la ejecución fue exitosa (sin errores y regla evaluada)
     */
    public boolean isSuccessful() {
        return !hasError();
    }

    /**
     * Agrega un mensaje a la lista de mensajes
     */
    public void addMessage(String message) {
        if (this.messages == null) {
            this.messages = new ArrayList<>();
        }
        this.messages.add(message);
    }

    /**
     * Agrega una acción disparada
     */
    public void addTriggeredAction(String action) {
        if (this.triggeredActions == null) {
            this.triggeredActions = new ArrayList<>();
        }
        this.triggeredActions.add(action);
    }

    /**
     * Agrega un dato de salida
     */
    public void addOutputData(String key, Object value) {
        if (this.outputData == null) {
            this.outputData = new HashMap<>();
        }
        this.outputData.put(key, value);
    }

    /**
     * Crea un resultado de éxito desde un RuleContext
     */
    public static RuleExecutionResult fromContext(RuleContext context) {
        return RuleExecutionResult.builder()
            .ruleMatched(context.isRuleMatched())
            .triggeredActions(context.getTriggeredActions() != null ?
                new ArrayList<>(context.getTriggeredActions()) : new ArrayList<>())
            .outputData(context.getOutputData() != null ?
                new HashMap<>(context.getOutputData()) : new HashMap<>())
            .messages(context.getMessages() != null ?
                new ArrayList<>(context.getMessages()) : new ArrayList<>())
            .firedRulesCount(context.isRuleMatched() ? 1 : 0)
            .build();
    }

    /**
     * Crea un resultado de error
     */
    public static RuleExecutionResult error(String errorMessage) {
        return RuleExecutionResult.builder()
            .ruleMatched(false)
            .errorMessage(errorMessage)
            .build();
    }

    /**
     * Crea un resultado de éxito sin reglas disparadas
     */
    public static RuleExecutionResult noMatch() {
        return RuleExecutionResult.builder()
            .ruleMatched(false)
            .build();
    }

    /**
     * Convierte el resultado a un Map para respuestas JSON
     */
    public Map<String, Object> toMap() {
        Map<String, Object> result = new HashMap<>();
        result.put("ruleMatched", ruleMatched);
        result.put("triggeredActions", triggeredActions);
        result.put("outputData", outputData);
        result.put("messages", messages);
        result.put("firedRulesCount", firedRulesCount);
        result.put("hasError", hasError());
        result.put("isSuccessful", isSuccessful());

        if (errorMessage != null) {
            result.put("errorMessage", errorMessage);
        }
        if (executionTimeMs != null) {
            result.put("executionTimeMs", executionTimeMs);
        }
        if (ruleName != null) {
            result.put("ruleName", ruleName);
        }

        return result;
    }
}
