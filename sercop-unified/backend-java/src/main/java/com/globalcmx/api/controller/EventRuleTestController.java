package com.globalcmx.api.controller;

import com.globalcmx.api.dto.drools.RuleContext;
import com.globalcmx.api.dto.drools.RuleExecutionResult;
import com.globalcmx.api.dto.query.ReglaEventoQueryDTO;
import com.globalcmx.api.service.drools.DroolsService;
import com.globalcmx.api.service.query.EventRuleQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/event-rules/test")
@RequiredArgsConstructor
@Slf4j
public class EventRuleTestController {

    private final EventRuleQueryService eventRuleQueryService;
    private final DroolsService droolsService;

    /**
     * Endpoint especial para probar una regla de evento con datos de prueba
     * Este endpoint permite validar las condiciones DRL y ejecutarlas usando Drools
     *
     * @param id ID de la regla a probar
     * @param testData Datos de prueba en formato JSON
     * @return Resultado de la prueba con detalles de evaluación
     */
    @PostMapping("/{id}")
    public ResponseEntity<Map<String, Object>> testReglaEvento(
            @PathVariable Long id,
            @RequestBody Map<String, Object> testData) {
        try {
            log.info("Recibida solicitud para probar regla de evento: {}", id);

            // Obtener la regla de evento
            ReglaEventoQueryDTO reglaEvento = eventRuleQueryService.getReglaEventoById(id);

            if (!reglaEvento.getActivo()) {
                Map<String, Object> warningResponse = new HashMap<>();
                warningResponse.put("success", false);
                warningResponse.put("message", "La regla de evento está inactiva");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(warningResponse);
            }

            // Verificar que tenga condiciones DRL
            if (reglaEvento.getCondicionesDRL() == null || reglaEvento.getCondicionesDRL().trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "La regla no tiene condiciones DRL definidas");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }

            // Crear RuleContext desde los datos de prueba
            RuleContext context = RuleContext.fromMap(testData);

            // Ejecutar la regla DRL usando DroolsService
            log.debug("Ejecutando regla DRL para ID: {}", id);
            RuleExecutionResult resultado = droolsService.executeRule(
                reglaEvento.getCondicionesDRL(),
                context
            );

            // Construir respuesta
            Map<String, Object> response = new HashMap<>();
            response.put("success", !resultado.hasError());

            if (resultado.hasError()) {
                response.put("message", "Error al ejecutar la regla: " + resultado.getErrorMessage());
                response.put("errorMessage", resultado.getErrorMessage());
            } else {
                response.put("message", "Regla ejecutada exitosamente");
            }

            // Información de la regla
            response.put("regla", Map.of(
                    "id", reglaEvento.getId(),
                    "codigo", reglaEvento.getCodigo(),
                    "nombre", reglaEvento.getNombre(),
                    "tipoOperacion", reglaEvento.getTipoOperacion(),
                    "eventoTrigger", reglaEvento.getEventoTrigger(),
                    "prioridad", reglaEvento.getPrioridad()
            ));

            // Datos de entrada
            response.put("testData", testData);

            // Resultado de la ejecución
            response.put("resultado", Map.of(
                    "ruleMatched", resultado.isRuleMatched(),
                    "firedRulesCount", resultado.getFiredRulesCount(),
                    "triggeredActions", resultado.getTriggeredActions(),
                    "outputData", resultado.getOutputData(),
                    "messages", resultado.getMessages(),
                    "executionTimeMs", resultado.getExecutionTimeMs() != null ?
                        resultado.getExecutionTimeMs() : 0,
                    "accionesConfiguradasJson", reglaEvento.getAccionesJson()
            ));

            log.info("Prueba de regla completada para ID: {} - Matched: {}, Fired: {}",
                id, resultado.isRuleMatched(), resultado.getFiredRulesCount());

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            log.error("Error al probar regla de evento: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            log.error("Error al probar regla de evento: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al probar regla de evento: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Endpoint para validar la sintaxis de las condiciones DRL
     * sin necesidad de tener una regla guardada
     */
    @PostMapping("/validate-drl")
    public ResponseEntity<Map<String, Object>> validateDRL(@RequestBody Map<String, String> request) {
        try {
            String condicionesDRL = request.get("condicionesDRL");

            if (condicionesDRL == null || condicionesDRL.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Las condiciones DRL son requeridas");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }

            log.debug("Validando sintaxis DRL");

            // Validar sintaxis usando DroolsService
            List<String> errors = droolsService.validateDrlSyntax(condicionesDRL);

            Map<String, Object> response = new HashMap<>();
            boolean isValid = errors.isEmpty();

            response.put("success", true);
            response.put("valido", isValid);
            response.put("errors", errors);
            response.put("errorCount", errors.size());

            if (isValid) {
                response.put("message", "Sintaxis DRL válida");
            } else {
                response.put("message", "Se encontraron " + errors.size() + " errores de sintaxis DRL");
            }

            log.debug("Validación DRL completada - Válido: {}, Errores: {}", isValid, errors.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error al validar DRL: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al validar DRL: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
