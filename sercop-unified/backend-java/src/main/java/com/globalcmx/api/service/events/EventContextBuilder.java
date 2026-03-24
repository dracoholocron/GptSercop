package com.globalcmx.api.service.events;

import com.globalcmx.api.dto.drools.RuleContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * Constructor de contextos de reglas desde diferentes tipos de eventos.
 * Proporciona métodos factory para crear instancias de RuleContext
 * desde eventos de plantillas, LC importación/exportación, garantías, cobranzas, etc.
 */
@Slf4j
@Component
public class EventContextBuilder {

    /**
     * Crea un RuleContext desde un evento genérico en formato Map
     *
     * @param eventData Datos del evento
     * @return RuleContext construido
     */
    public RuleContext fromGenericEvent(Map<String, Object> eventData) {
        log.debug("Construyendo RuleContext desde evento genérico");

        RuleContext.RuleContextBuilder builder = RuleContext.builder();

        try {
            // Extraer datos comunes de operación
            extractOperationData(builder, eventData);

            // Extraer datos de usuario
            extractUserData(builder, eventData);

            // Extraer datos de aprobación
            extractApprovalData(builder, eventData);

            // Extraer datos de contraparte
            extractCounterpartyData(builder, eventData);

            // Extraer datos temporales
            extractTemporalData(builder, eventData);

            // Agregar datos adicionales
            builder.operationData(eventData);
            builder.additionalData(eventData);

        } catch (Exception e) {
            log.error("Error al construir RuleContext desde evento genérico", e);
        }

        return builder.build();
    }

    /**
     * Crea un RuleContext desde un evento de Plantilla
     *
     * @param plantillaId ID de la plantilla
     * @param plantillaCodigo Código de la plantilla
     * @param tipoPlantilla Tipo de plantilla
     * @param formato Formato de la plantilla
     * @param userCode Usuario que disparó el evento
     * @param eventType Tipo de evento (CREATED, UPDATED, etc.)
     * @return RuleContext construido
     */
    public RuleContext fromPlantillaEvent(Long plantillaId,
                                         String plantillaCodigo,
                                         String tipoPlantilla,
                                         String formato,
                                         String userCode,
                                         String eventType) {
        log.debug("Construyendo RuleContext desde evento de Plantilla: {}", plantillaCodigo);

        Map<String, Object> operationData = new HashMap<>();
        operationData.put("plantillaId", plantillaId);
        operationData.put("plantillaCodigo", plantillaCodigo);
        operationData.put("tipoPlantilla", tipoPlantilla);
        operationData.put("formato", formato);
        operationData.put("eventType", eventType);

        return RuleContext.builder()
            .operationType("PLANTILLA")
            .operationId(plantillaId)
            .referenceCode(plantillaCodigo)
            .operationStatus(eventType)
            .userCode(userCode)
            .eventDateTime(LocalDateTime.now())
            .operationData(operationData)
            .build();
    }

    /**
     * Crea un RuleContext desde un evento de LC Importación
     */
    public RuleContext fromLCImportacionEvent(Map<String, Object> lcData) {
        log.debug("Construyendo RuleContext desde evento de LC Importación");

        RuleContext.RuleContextBuilder builder = RuleContext.builder()
            .operationType("LC_IMPORTACION")
            .eventDateTime(LocalDateTime.now());

        // Extraer datos específicos de LC
        if (lcData.containsKey("lcId")) {
            builder.operationId(getLongValue(lcData, "lcId"));
        }
        if (lcData.containsKey("numeroLC")) {
            builder.referenceCode((String) lcData.get("numeroLC"));
        }
        if (lcData.containsKey("montoLC")) {
            builder.operationAmount(getBigDecimalValue(lcData, "montoLC"));
        }
        if (lcData.containsKey("moneda")) {
            builder.currency((String) lcData.get("moneda"));
        }
        if (lcData.containsKey("estado")) {
            builder.operationStatus((String) lcData.get("estado"));
        }
        if (lcData.containsKey("ordenante")) {
            builder.counterpartyCode((String) lcData.get("ordenante"));
            builder.counterpartyType("ORDENANTE");
        }
        if (lcData.containsKey("beneficiario")) {
            builder.counterpartyName((String) lcData.get("beneficiario"));
        }
        if (lcData.containsKey("paisDestino")) {
            builder.counterpartyCountry((String) lcData.get("paisDestino"));
        }
        if (lcData.containsKey("usuarioCreador")) {
            builder.userCode((String) lcData.get("usuarioCreador"));
        }
        if (lcData.containsKey("fechaEmision")) {
            builder.valueDate(parseDateTime(lcData.get("fechaEmision")));
        }

        // Agregar datos completos
        builder.operationData(lcData);

        return builder.build();
    }

    /**
     * Crea un RuleContext desde un evento de LC Exportación
     */
    public RuleContext fromLCExportacionEvent(Map<String, Object> lcData) {
        log.debug("Construyendo RuleContext desde evento de LC Exportación");

        RuleContext.RuleContextBuilder builder = RuleContext.builder()
            .operationType("LC_EXPORTACION")
            .eventDateTime(LocalDateTime.now());

        // Similar a LC Importación pero con tipo diferente
        if (lcData.containsKey("lcId")) {
            builder.operationId(getLongValue(lcData, "lcId"));
        }
        if (lcData.containsKey("numeroLC")) {
            builder.referenceCode((String) lcData.get("numeroLC"));
        }
        if (lcData.containsKey("montoLC")) {
            builder.operationAmount(getBigDecimalValue(lcData, "montoLC"));
        }
        if (lcData.containsKey("moneda")) {
            builder.currency((String) lcData.get("moneda"));
        }
        if (lcData.containsKey("estado")) {
            builder.operationStatus((String) lcData.get("estado"));
        }
        if (lcData.containsKey("exportador")) {
            builder.counterpartyCode((String) lcData.get("exportador"));
            builder.counterpartyType("EXPORTADOR");
        }
        if (lcData.containsKey("importador")) {
            builder.counterpartyName((String) lcData.get("importador"));
        }
        if (lcData.containsKey("usuarioCreador")) {
            builder.userCode((String) lcData.get("usuarioCreador"));
        }

        builder.operationData(lcData);

        return builder.build();
    }

    /**
     * Crea un RuleContext desde un evento de Garantía
     */
    public RuleContext fromGarantiaEvent(Map<String, Object> garantiaData) {
        log.debug("Construyendo RuleContext desde evento de Garantía");

        RuleContext.RuleContextBuilder builder = RuleContext.builder()
            .operationType("GARANTIA")
            .eventDateTime(LocalDateTime.now());

        if (garantiaData.containsKey("garantiaId")) {
            builder.operationId(getLongValue(garantiaData, "garantiaId"));
        }
        if (garantiaData.containsKey("numeroGarantia")) {
            builder.referenceCode((String) garantiaData.get("numeroGarantia"));
        }
        if (garantiaData.containsKey("montoGarantia")) {
            builder.operationAmount(getBigDecimalValue(garantiaData, "montoGarantia"));
        }
        if (garantiaData.containsKey("moneda")) {
            builder.currency((String) garantiaData.get("moneda"));
        }
        if (garantiaData.containsKey("estado")) {
            builder.operationStatus((String) garantiaData.get("estado"));
        }
        if (garantiaData.containsKey("beneficiario")) {
            builder.counterpartyCode((String) garantiaData.get("beneficiario"));
            builder.counterpartyType("BENEFICIARIO");
        }
        if (garantiaData.containsKey("tipoGarantia")) {
            Map<String, Object> additionalData = new HashMap<>();
            additionalData.put("tipoGarantia", garantiaData.get("tipoGarantia"));
            builder.additionalData(additionalData);
        }
        if (garantiaData.containsKey("usuarioCreador")) {
            builder.userCode((String) garantiaData.get("usuarioCreador"));
        }

        builder.operationData(garantiaData);

        return builder.build();
    }

    /**
     * Crea un RuleContext desde un evento de Cobranza
     */
    public RuleContext fromCobranzaEvent(Map<String, Object> cobranzaData) {
        log.debug("Construyendo RuleContext desde evento de Cobranza");

        RuleContext.RuleContextBuilder builder = RuleContext.builder()
            .operationType("COBRANZA")
            .eventDateTime(LocalDateTime.now());

        if (cobranzaData.containsKey("cobranzaId")) {
            builder.operationId(getLongValue(cobranzaData, "cobranzaId"));
        }
        if (cobranzaData.containsKey("numeroCobranza")) {
            builder.referenceCode((String) cobranzaData.get("numeroCobranza"));
        }
        if (cobranzaData.containsKey("montoCobranza")) {
            builder.operationAmount(getBigDecimalValue(cobranzaData, "montoCobranza"));
        }
        if (cobranzaData.containsKey("moneda")) {
            builder.currency((String) cobranzaData.get("moneda"));
        }
        if (cobranzaData.containsKey("estado")) {
            builder.operationStatus((String) cobranzaData.get("estado"));
        }
        if (cobranzaData.containsKey("cliente")) {
            builder.counterpartyCode((String) cobranzaData.get("cliente"));
            builder.counterpartyType("CLIENTE");
        }
        if (cobranzaData.containsKey("usuarioCreador")) {
            builder.userCode((String) cobranzaData.get("usuarioCreador"));
        }

        builder.operationData(cobranzaData);

        return builder.build();
    }

    // ==================== Métodos auxiliares ====================

    /**
     * Extrae datos de operación del evento
     */
    private void extractOperationData(RuleContext.RuleContextBuilder builder, Map<String, Object> data) {
        if (data.containsKey("operationType")) {
            builder.operationType((String) data.get("operationType"));
        }
        if (data.containsKey("operationId")) {
            builder.operationId(getLongValue(data, "operationId"));
        }
        if (data.containsKey("operationAmount") || data.containsKey("monto")) {
            String key = data.containsKey("operationAmount") ? "operationAmount" : "monto";
            builder.operationAmount(getBigDecimalValue(data, key));
        }
        if (data.containsKey("currency") || data.containsKey("moneda")) {
            String key = data.containsKey("currency") ? "currency" : "moneda";
            builder.currency((String) data.get(key));
        }
        if (data.containsKey("operationStatus") || data.containsKey("estado")) {
            String key = data.containsKey("operationStatus") ? "operationStatus" : "estado";
            builder.operationStatus((String) data.get(key));
        }
        if (data.containsKey("referenceCode") || data.containsKey("numeroReferencia")) {
            String key = data.containsKey("referenceCode") ? "referenceCode" : "numeroReferencia";
            builder.referenceCode((String) data.get(key));
        }
    }

    /**
     * Extrae datos de usuario del evento
     */
    private void extractUserData(RuleContext.RuleContextBuilder builder, Map<String, Object> data) {
        if (data.containsKey("userCode") || data.containsKey("usuarioCreador")) {
            String key = data.containsKey("userCode") ? "userCode" : "usuarioCreador";
            builder.userCode((String) data.get(key));
        }
        if (data.containsKey("userRole") || data.containsKey("rol")) {
            String key = data.containsKey("userRole") ? "userRole" : "rol";
            builder.userRole((String) data.get(key));
        }
        if (data.containsKey("userDepartment") || data.containsKey("departamento")) {
            String key = data.containsKey("userDepartment") ? "userDepartment" : "departamento";
            builder.userDepartment((String) data.get(key));
        }
    }

    /**
     * Extrae datos de aprobación del evento
     */
    private void extractApprovalData(RuleContext.RuleContextBuilder builder, Map<String, Object> data) {
        if (data.containsKey("approverCode")) {
            builder.approverCode((String) data.get("approverCode"));
        }
        if (data.containsKey("approvalLevel")) {
            builder.approvalLevel(getIntValue(data, "approvalLevel"));
        }
        if (data.containsKey("requiresMultipleApproval")) {
            builder.requiresMultipleApproval((Boolean) data.get("requiresMultipleApproval"));
        }
    }

    /**
     * Extrae datos de contraparte del evento
     */
    private void extractCounterpartyData(RuleContext.RuleContextBuilder builder, Map<String, Object> data) {
        if (data.containsKey("counterpartyCode")) {
            builder.counterpartyCode((String) data.get("counterpartyCode"));
        }
        if (data.containsKey("counterpartyName")) {
            builder.counterpartyName((String) data.get("counterpartyName"));
        }
        if (data.containsKey("counterpartyCountry") || data.containsKey("pais")) {
            String key = data.containsKey("counterpartyCountry") ? "counterpartyCountry" : "pais";
            builder.counterpartyCountry((String) data.get(key));
        }
        if (data.containsKey("counterpartyType")) {
            builder.counterpartyType((String) data.get("counterpartyType"));
        }
    }

    /**
     * Extrae datos temporales del evento
     */
    private void extractTemporalData(RuleContext.RuleContextBuilder builder, Map<String, Object> data) {
        if (data.containsKey("eventDateTime")) {
            builder.eventDateTime(parseDateTime(data.get("eventDateTime")));
        } else {
            builder.eventDateTime(LocalDateTime.now());
        }
        if (data.containsKey("valueDate") || data.containsKey("fechaValor")) {
            String key = data.containsKey("valueDate") ? "valueDate" : "fechaValor";
            builder.valueDate(parseDateTime(data.get(key)));
        }
    }

    /**
     * Convierte un valor a Long de forma segura
     */
    private Long getLongValue(Map<String, Object> data, String key) {
        Object value = data.get(key);
        if (value == null) return null;
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        try {
            return Long.parseLong(value.toString());
        } catch (Exception e) {
            log.warn("No se pudo convertir {} a Long: {}", key, value);
            return null;
        }
    }

    /**
     * Convierte un valor a Integer de forma segura
     */
    private Integer getIntValue(Map<String, Object> data, String key) {
        Object value = data.get(key);
        if (value == null) return null;
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        try {
            return Integer.parseInt(value.toString());
        } catch (Exception e) {
            log.warn("No se pudo convertir {} a Integer: {}", key, value);
            return null;
        }
    }

    /**
     * Convierte un valor a BigDecimal de forma segura
     */
    private BigDecimal getBigDecimalValue(Map<String, Object> data, String key) {
        Object value = data.get(key);
        if (value == null) return null;
        if (value instanceof BigDecimal) {
            return (BigDecimal) value;
        }
        if (value instanceof Number) {
            return new BigDecimal(value.toString());
        }
        try {
            return new BigDecimal(value.toString());
        } catch (Exception e) {
            log.warn("No se pudo convertir {} a BigDecimal: {}", key, value);
            return null;
        }
    }

    /**
     * Parsea un objeto a LocalDateTime
     */
    private LocalDateTime parseDateTime(Object value) {
        if (value == null) return null;
        if (value instanceof LocalDateTime) {
            return (LocalDateTime) value;
        }
        try {
            // Intentar parsear como ISO date time
            return LocalDateTime.parse(value.toString(), DateTimeFormatter.ISO_DATE_TIME);
        } catch (Exception e) {
            try {
                // Intentar otros formatos comunes
                return LocalDateTime.parse(value.toString(), DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            } catch (Exception e2) {
                log.warn("No se pudo parsear fecha: {}", value);
                return null;
            }
        }
    }
}
