package com.globalcmx.api.service.events;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.actions.ActionExecutionResult;
import com.globalcmx.api.dto.drools.RuleContext;
import com.globalcmx.api.dto.drools.RuleExecutionResult;
import com.globalcmx.api.readmodel.entity.ReglaEventoReadModel;
import com.globalcmx.api.readmodel.repository.ReglaEventoReadModelRepository;
import com.globalcmx.api.service.actions.ActionExecutionService;
import com.globalcmx.api.service.drools.DroolsService;
import com.globalcmx.api.entity.ReglaEvento;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Servicio que escucha eventos dinámicos desde múltiples tópicos de Kafka
 * y ejecuta reglas configuradas con Drools cuando los eventos coinciden.
 *
 * Flujo de procesamiento:
 * 1. Recibe evento JSON desde un tópico de Kafka
 * 2. Extrae metadata del evento (tipo de operación, evento trigger)
 * 3. Busca reglas activas que coincidan con el tipo y evento
 * 4. Construye RuleContext desde el evento
 * 5. Ejecuta evaluación con Drools
 * 6. Si la regla se dispara, ejecuta las acciones configuradas
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DynamicEventListenerService {

    private final ReglaEventoReadModelRepository reglaEventoRepository;
    private final EventContextBuilder contextBuilder;
    private final DroolsService droolsService;
    private final ActionExecutionService actionExecutionService;
    private final ObjectMapper objectMapper;

    /**
     * Maneja un evento genérico desde cualquier tópico de Kafka
     *
     * @param eventJson JSON del evento
     * @param topicName Nombre del tópico de origen
     */
    public void handleEvent(String eventJson, String topicName) {
        log.info("=== PROCESANDO EVENTO DESDE TÓPICO: {} ===", topicName);
        log.debug("Event JSON: {}", eventJson);

        try {
            // Parsear evento
            Map<String, Object> eventData = parseEventJson(eventJson);

            // Extraer metadata del evento
            EventMetadata metadata = extractEventMetadata(eventData, topicName);

            log.info("Metadata del evento: tipoOperacion={}, eventoTrigger={}, operationId={}",
                metadata.getTipoOperacion(),
                metadata.getEventoTrigger(),
                metadata.getOperationId());

            // Buscar reglas que coincidan
            List<ReglaEventoReadModel> matchingRules = findMatchingRules(
                metadata.getTipoOperacion(),
                metadata.getEventoTrigger()
            );

            if (matchingRules.isEmpty()) {
                log.info("No se encontraron reglas activas para tipoOperacion={}, eventoTrigger={}",
                    metadata.getTipoOperacion(), metadata.getEventoTrigger());
                return;
            }

            log.info("Se encontraron {} reglas activas para evaluar", matchingRules.size());

            // Construir contexto desde el evento
            RuleContext context = buildContextFromEvent(eventData, metadata);

            // Ejecutar reglas
            executeRulesForEvent(matchingRules, context);

            log.info("=== FIN PROCESAMIENTO EVENTO ===");

        } catch (Exception e) {
            log.error("Error al procesar evento desde tópico {}", topicName, e);
        }
    }

    /**
     * Busca reglas activas que coincidan con el tipo de operación y evento trigger
     *
     * @param tipoOperacion Tipo de operación
     * @param eventoTrigger Evento que dispara la regla
     * @return Lista de reglas que coinciden
     */
    public List<ReglaEventoReadModel> findMatchingRules(String tipoOperacion, String eventoTrigger) {
        log.debug("Buscando reglas para tipoOperacion={}, eventoTrigger={}", tipoOperacion, eventoTrigger);

        // Buscar reglas específicas para este tipo de operación y evento
        List<ReglaEventoReadModel> specificRules = reglaEventoRepository
            .findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                tipoOperacion, eventoTrigger, true
            );

        log.debug("Reglas específicas encontradas: {}", specificRules.size());

        // También buscar reglas genéricas (con tipo de operación "*")
        List<ReglaEventoReadModel> genericRules = reglaEventoRepository
            .findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                "*", eventoTrigger, true
            );

        log.debug("Reglas genéricas encontradas: {}", genericRules.size());

        // Combinar ambas listas (específicas primero, luego genéricas)
        specificRules.addAll(genericRules);

        return specificRules;
    }

    /**
     * Ejecuta las reglas para el evento dado
     *
     * @param reglas Lista de reglas a evaluar
     * @param context Contexto construido desde el evento
     */
    public void executeRulesForEvent(List<ReglaEventoReadModel> reglas, RuleContext context) {
        log.info("Ejecutando {} reglas", reglas.size());

        int rulesMatched = 0;
        int actionsExecuted = 0;

        for (ReglaEventoReadModel reglaReadModel : reglas) {
            try {
                log.info("--- Evaluando regla: {} ({}) ---", reglaReadModel.getCodigo(), reglaReadModel.getNombre());

                // Convertir ReglaEventoReadModel a ReglaEvento para compatibilidad
                ReglaEvento regla = convertToReglaEvento(reglaReadModel);

                // Ejecutar evaluación con Drools
                RuleExecutionResult ruleResult = droolsService.executeRule(
                    regla.getCondicionesDRL(),
                    context
                );
                RuleContext evaluatedContext = context;

                // Verificar si la regla se disparó
                if (evaluatedContext.isRuleMatched()) {
                    rulesMatched++;
                    log.info("✓ Regla {} DISPARADA", regla.getCodigo());

                    // Ejecutar acciones configuradas
                    if (regla.getAccionesJson() != null && !regla.getAccionesJson().trim().isEmpty()) {
                        log.info("Ejecutando acciones para regla {}", regla.getCodigo());

                        Map<String, ActionExecutionResult> results =
                            actionExecutionService.executeActions(regla, evaluatedContext);

                        actionsExecuted += results.size();

                        // Log de resultados
                        results.forEach((key, result) -> {
                            if (result.getSuccess()) {
                                log.info("  ✓ Acción {} ejecutada exitosamente", key);
                            } else {
                                log.error("  ✗ Acción {} falló: {}", key, result.getErrorMessage());
                            }
                        });
                    } else {
                        log.warn("Regla {} no tiene acciones configuradas", regla.getCodigo());
                    }
                } else {
                    log.info("✗ Regla {} no se disparó (condiciones no cumplidas)", regla.getCodigo());
                }

            } catch (Exception e) {
                log.error("Error al ejecutar regla {}", reglaReadModel.getCodigo(), e);
            }
        }

        log.info("=== RESUMEN ===");
        log.info("Reglas evaluadas: {}", reglas.size());
        log.info("Reglas disparadas: {}", rulesMatched);
        log.info("Acciones ejecutadas: {}", actionsExecuted);
        log.info("===============");
    }

    /**
     * Extrae metadata del evento
     *
     * @param eventData Datos del evento
     * @param topicName Nombre del tópico
     * @return Metadata extraída
     */
    public EventMetadata extractEventMetadata(Map<String, Object> eventData, String topicName) {
        EventMetadata metadata = new EventMetadata();

        // Determinar tipo de operación desde el tópico si no viene en el evento
        if (eventData.containsKey("tipoOperacion")) {
            metadata.setTipoOperacion((String) eventData.get("tipoOperacion"));
        } else {
            metadata.setTipoOperacion(inferOperationTypeFromTopic(topicName));
        }

        // Extraer evento trigger
        if (eventData.containsKey("eventoTrigger")) {
            metadata.setEventoTrigger((String) eventData.get("eventoTrigger"));
        } else if (eventData.containsKey("eventType")) {
            metadata.setEventoTrigger((String) eventData.get("eventType"));
        } else if (eventData.containsKey("action")) {
            metadata.setEventoTrigger((String) eventData.get("action"));
        } else {
            metadata.setEventoTrigger("UNKNOWN");
        }

        // Extraer ID de operación
        if (eventData.containsKey("operationId")) {
            metadata.setOperationId(getLongValue(eventData, "operationId"));
        } else if (eventData.containsKey("id")) {
            metadata.setOperationId(getLongValue(eventData, "id"));
        }

        // Extraer timestamp
        if (eventData.containsKey("timestamp")) {
            metadata.setTimestamp((String) eventData.get("timestamp"));
        }

        return metadata;
    }

    /**
     * Construye RuleContext desde los datos del evento
     */
    private RuleContext buildContextFromEvent(Map<String, Object> eventData, EventMetadata metadata) {
        String tipoOperacion = metadata.getTipoOperacion();

        log.debug("Construyendo contexto para tipo de operación: {}", tipoOperacion);

        // Usar el builder apropiado según el tipo de operación
        switch (tipoOperacion) {
            case "PLANTILLA":
                return contextBuilder.fromPlantillaEvent(
                    getLongValue(eventData, "plantillaId"),
                    (String) eventData.get("plantillaCodigo"),
                    (String) eventData.get("tipoPlantilla"),
                    (String) eventData.get("formato"),
                    (String) eventData.get("userCode"),
                    metadata.getEventoTrigger()
                );

            case "LC_IMPORTACION":
                return contextBuilder.fromLCImportacionEvent(eventData);

            case "LC_EXPORTACION":
                return contextBuilder.fromLCExportacionEvent(eventData);

            case "GARANTIA":
                return contextBuilder.fromGarantiaEvent(eventData);

            case "COBRANZA":
                return contextBuilder.fromCobranzaEvent(eventData);

            default:
                // Usar constructor genérico para tipos desconocidos
                return contextBuilder.fromGenericEvent(eventData);
        }
    }

    /**
     * Infiere el tipo de operación desde el nombre del tópico
     */
    private String inferOperationTypeFromTopic(String topicName) {
        if (topicName.contains("plantilla")) {
            return "PLANTILLA";
        } else if (topicName.contains("lc-importacion") || topicName.contains("lc_importacion")) {
            return "LC_IMPORTACION";
        } else if (topicName.contains("lc-exportacion") || topicName.contains("lc_exportacion")) {
            return "LC_EXPORTACION";
        } else if (topicName.contains("garantia")) {
            return "GARANTIA";
        } else if (topicName.contains("cobranza")) {
            return "COBRANZA";
        } else {
            return "UNKNOWN";
        }
    }

    /**
     * Parsea el JSON del evento a Map
     */
    private Map<String, Object> parseEventJson(String eventJson) throws Exception {
        return objectMapper.readValue(eventJson, new TypeReference<Map<String, Object>>() {});
    }

    /**
     * Convierte un ReglaEventoReadModel a ReglaEvento
     */
    private ReglaEvento convertToReglaEvento(ReglaEventoReadModel readModel) {
        return ReglaEvento.builder()
            .id(readModel.getId())
            .codigo(readModel.getCodigo())
            .nombre(readModel.getNombre())
            .descripcion(readModel.getDescripcion())
            .tipoOperacion(readModel.getTipoOperacion())
            .eventoTrigger(readModel.getEventoTrigger())
            .condicionesDRL(readModel.getCondicionesDRL())
            .accionesJson(readModel.getAccionesJson())
            .prioridad(readModel.getPrioridad())
            .activo(readModel.getActivo())
            .createdAt(readModel.getCreatedAt())
            .updatedAt(readModel.getUpdatedAt())
            .createdBy(readModel.getCreatedBy())
            .updatedBy(readModel.getUpdatedBy())
            .build();
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
            return null;
        }
    }

    /**
     * Clase interna para almacenar metadata del evento
     */
    public static class EventMetadata {
        private String tipoOperacion;
        private String eventoTrigger;
        private Long operationId;
        private String timestamp;

        public String getTipoOperacion() {
            return tipoOperacion;
        }

        public void setTipoOperacion(String tipoOperacion) {
            this.tipoOperacion = tipoOperacion;
        }

        public String getEventoTrigger() {
            return eventoTrigger;
        }

        public void setEventoTrigger(String eventoTrigger) {
            this.eventoTrigger = eventoTrigger;
        }

        public Long getOperationId() {
            return operationId;
        }

        public void setOperationId(Long operationId) {
            this.operationId = operationId;
        }

        public String getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(String timestamp) {
            this.timestamp = timestamp;
        }
    }
}
