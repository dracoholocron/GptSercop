package com.globalcmx.api.dto.drools;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Contexto para la evaluación de reglas DRL en Drools
 * Esta clase encapsula todos los datos necesarios para que las reglas puedan
 * tomar decisiones y ejecutar acciones.
 *
 * Uso en reglas DRL:
 * <pre>
 * rule "Ejemplo"
 *   when
 *     $ctx : RuleContext(
 *       operationAmount > 10000,
 *       userCode == "USR001"
 *     )
 *   then
 *     $ctx.addTriggeredAction("NOTIFY_SUPERVISOR");
 *     $ctx.setRuleMatched(true);
 * end
 * </pre>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RuleContext {

    // ==================== Control de ejecución ====================

    /**
     * Indica si la regla ha sido evaluada y cumplió con las condiciones
     */
    @Builder.Default
    private boolean ruleMatched = false;

    /**
     * Lista de acciones que se han disparado durante la evaluación
     */
    @Builder.Default
    private List<String> triggeredActions = new ArrayList<>();

    /**
     * Datos de salida generados por la regla
     */
    @Builder.Default
    private Map<String, Object> outputData = new HashMap<>();

    /**
     * Mensajes de error o advertencia generados durante la evaluación
     */
    @Builder.Default
    private List<String> messages = new ArrayList<>();

    // ==================== Datos de la operación ====================

    /**
     * Datos generales de la operación en formato Map
     * Contiene información flexible según el tipo de operación
     */
    @Builder.Default
    private Map<String, Object> operationData = new HashMap<>();

    /**
     * Datos del mensaje SWIFT asociado
     */
    @Builder.Default
    private Map<String, Object> swiftData = new HashMap<>();

    /**
     * Tipo de operación (ej: "PAGO", "TRANSFERENCIA", "ORDEN")
     */
    private String operationType;

    /**
     * Tipo de evento (ej: "CREATED", "UPDATED", "DELETED", "APPROVED")
     */
    private String eventType;

    /**
     * Monto de la operación
     */
    private BigDecimal operationAmount;

    /**
     * Moneda de la operación
     */
    private String currency;

    /**
     * Estado actual de la operación
     */
    private String operationStatus;

    /**
     * ID de la operación
     */
    private Long operationId;

    /**
     * Código de referencia de la operación
     */
    private String referenceCode;

    // ==================== Datos de usuario ====================

    /**
     * Código del usuario que ejecuta/crea la operación
     */
    private String userCode;

    /**
     * Rol del usuario
     */
    private String userRole;

    /**
     * Departamento del usuario
     */
    private String userDepartment;

    // ==================== Datos de aprobación ====================

    /**
     * Código del aprobador (si aplica)
     */
    private String approverCode;

    /**
     * Nivel de aprobación requerido
     */
    private Integer approvalLevel;

    /**
     * Indica si se requiere aprobación múltiple
     */
    private Boolean requiresMultipleApproval;

    // ==================== Datos de contraparte ====================

    /**
     * Código de la contraparte
     */
    private String counterpartyCode;

    /**
     * Nombre de la contraparte
     */
    private String counterpartyName;

    /**
     * País de la contraparte
     */
    private String counterpartyCountry;

    /**
     * Tipo de contraparte (ej: "CLIENTE", "PROVEEDOR", "BANCO")
     */
    private String counterpartyType;

    // ==================== Datos temporales ====================

    /**
     * Fecha y hora del evento/operación
     */
    private LocalDateTime eventDateTime;

    /**
     * Fecha de valor de la operación
     */
    private LocalDateTime valueDate;

    // ==================== Datos de contexto adicional ====================

    /**
     * Datos adicionales en formato flexible
     * Permite extender el contexto sin modificar la clase
     */
    @Builder.Default
    private Map<String, Object> additionalData = new HashMap<>();

    // ==================== Métodos auxiliares para uso en reglas ====================

    /**
     * Agrega una acción disparada a la lista
     * Uso en DRL: $ctx.addTriggeredAction("SEND_EMAIL");
     */
    public void addTriggeredAction(String action) {
        if (this.triggeredActions == null) {
            this.triggeredActions = new ArrayList<>();
        }
        this.triggeredActions.add(action);
    }

    /**
     * Agrega un dato de salida
     * Uso en DRL: $ctx.addOutputData("approvalRequired", true);
     */
    public void addOutputData(String key, Object value) {
        if (this.outputData == null) {
            this.outputData = new HashMap<>();
        }
        this.outputData.put(key, value);
    }

    /**
     * Agrega un mensaje (error, advertencia, info)
     * Uso en DRL: $ctx.addMessage("Monto excede límite diario");
     */
    public void addMessage(String message) {
        if (this.messages == null) {
            this.messages = new ArrayList<>();
        }
        this.messages.add(message);
    }

    /**
     * Obtiene un dato de la operación de forma segura
     * Uso en DRL: $ctx.getOperationDataValue("campo")
     */
    public Object getOperationDataValue(String key) {
        return operationData != null ? operationData.get(key) : null;
    }

    /**
     * Obtiene un dato SWIFT de forma segura
     */
    public Object getSwiftDataValue(String key) {
        return swiftData != null ? swiftData.get(key) : null;
    }

    /**
     * Obtiene un dato adicional de forma segura
     */
    public Object getAdditionalDataValue(String key) {
        return additionalData != null ? additionalData.get(key) : null;
    }

    /**
     * Verifica si el monto excede un límite
     * Uso en DRL: $ctx.exceedsAmount(new BigDecimal("10000"))
     */
    public boolean exceedsAmount(BigDecimal limit) {
        return operationAmount != null &&
               limit != null &&
               operationAmount.compareTo(limit) > 0;
    }

    /**
     * Verifica si el monto está dentro de un rango
     * Uso en DRL: $ctx.isAmountInRange(new BigDecimal("1000"), new BigDecimal("5000"))
     */
    public boolean isAmountInRange(BigDecimal min, BigDecimal max) {
        return operationAmount != null &&
               min != null &&
               max != null &&
               operationAmount.compareTo(min) >= 0 &&
               operationAmount.compareTo(max) <= 0;
    }

    /**
     * Verifica si el usuario tiene un rol específico
     * Uso en DRL: $ctx.hasRole("SUPERVISOR")
     */
    public boolean hasRole(String role) {
        return userRole != null && userRole.equalsIgnoreCase(role);
    }

    /**
     * Verifica si la moneda coincide
     * Uso en DRL: $ctx.isCurrency("USD")
     */
    public boolean isCurrency(String currencyCode) {
        return currency != null && currency.equalsIgnoreCase(currencyCode);
    }

    /**
     * Crea una instancia de RuleContext desde un Map
     * Útil para construir el contexto desde datos JSON
     */
    public static RuleContext fromMap(Map<String, Object> data) {
        RuleContextBuilder builder = RuleContext.builder();

        // Datos de operación
        if (data.containsKey("operationType")) {
            builder.operationType((String) data.get("operationType"));
        }
        if (data.containsKey("eventType")) {
            builder.eventType((String) data.get("eventType"));
        }
        if (data.containsKey("operationAmount")) {
            Object amount = data.get("operationAmount");
            if (amount instanceof Number) {
                builder.operationAmount(new BigDecimal(amount.toString()));
            }
        }
        if (data.containsKey("currency")) {
            builder.currency((String) data.get("currency"));
        }
        if (data.containsKey("operationStatus")) {
            builder.operationStatus((String) data.get("operationStatus"));
        }
        if (data.containsKey("operationId")) {
            Object id = data.get("operationId");
            if (id instanceof Number) {
                builder.operationId(((Number) id).longValue());
            }
        }
        if (data.containsKey("referenceCode")) {
            builder.referenceCode((String) data.get("referenceCode"));
        }

        // Datos de usuario
        if (data.containsKey("userCode")) {
            builder.userCode((String) data.get("userCode"));
        }
        if (data.containsKey("userRole")) {
            builder.userRole((String) data.get("userRole"));
        }
        if (data.containsKey("userDepartment")) {
            builder.userDepartment((String) data.get("userDepartment"));
        }

        // Datos de aprobación
        if (data.containsKey("approverCode")) {
            builder.approverCode((String) data.get("approverCode"));
        }
        if (data.containsKey("approvalLevel")) {
            Object level = data.get("approvalLevel");
            if (level instanceof Number) {
                builder.approvalLevel(((Number) level).intValue());
            }
        }
        if (data.containsKey("requiresMultipleApproval")) {
            builder.requiresMultipleApproval((Boolean) data.get("requiresMultipleApproval"));
        }

        // Datos de contraparte
        if (data.containsKey("counterpartyCode")) {
            builder.counterpartyCode((String) data.get("counterpartyCode"));
        }
        if (data.containsKey("counterpartyName")) {
            builder.counterpartyName((String) data.get("counterpartyName"));
        }
        if (data.containsKey("counterpartyCountry")) {
            builder.counterpartyCountry((String) data.get("counterpartyCountry"));
        }
        if (data.containsKey("counterpartyType")) {
            builder.counterpartyType((String) data.get("counterpartyType"));
        }

        // Datos adicionales como Maps
        if (data.containsKey("operationData") && data.get("operationData") instanceof Map) {
            builder.operationData((Map<String, Object>) data.get("operationData"));
        }
        if (data.containsKey("swiftData") && data.get("swiftData") instanceof Map) {
            builder.swiftData((Map<String, Object>) data.get("swiftData"));
        }
        if (data.containsKey("additionalData") && data.get("additionalData") instanceof Map) {
            builder.additionalData((Map<String, Object>) data.get("additionalData"));
        }

        return builder.build();
    }
}
