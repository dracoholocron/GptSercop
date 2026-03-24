package com.globalcmx.api.service.actions;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.actions.ActionExecutionResult;
import com.globalcmx.api.dto.drools.RuleContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Ejecutor de acciones de notificación a APIs externas.
 * Realiza llamadas HTTP a endpoints configurados con el método y payload especificados.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ApiNotificationActionExecutor implements ActionExecutor {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public String getActionType() {
        return "API";
    }

    @Override
    public String[] getRequiredConfigFields() {
        return new String[]{"url", "method"};
    }

    @Override
    public boolean validateConfig(Map<String, Object> config) {
        if (config == null || config.isEmpty()) {
            log.error("La configuración de API no puede ser null o vacía");
            return false;
        }

        // Validar URL
        if (!config.containsKey("url") || config.get("url") == null) {
            log.error("Falta campo requerido: url");
            return false;
        }

        String url = config.get("url").toString();
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            log.error("URL debe comenzar con http:// o https://: {}", url);
            return false;
        }

        // Validar método HTTP
        if (!config.containsKey("method") || config.get("method") == null) {
            log.error("Falta campo requerido: method");
            return false;
        }

        String method = config.get("method").toString().toUpperCase();
        if (!method.matches("GET|POST|PUT|DELETE|PATCH")) {
            log.error("Método HTTP no válido: {}. Use GET, POST, PUT, DELETE o PATCH", method);
            return false;
        }

        return true;
    }

    @Override
    public String getActionDescription(Map<String, Object> config) {
        String url = (String) config.get("url");
        String method = (String) config.get("method");
        return String.format("Notificar a API: %s %s", method, url);
    }

    @Override
    public ActionExecutionResult execute(Map<String, Object> config, RuleContext context) {
        ActionExecutionResult result = ActionExecutionResult.success(getActionType());
        long startTime = System.currentTimeMillis();

        try {
            log.info("Iniciando ejecución de acción API");

            // Extraer configuración
            String url = config.get("url").toString();
            String method = config.get("method").toString().toUpperCase();
            @SuppressWarnings("unchecked")
            Map<String, String> headers = (Map<String, String>) config.getOrDefault("headers", new HashMap<>());
            Object bodyTemplate = config.get("body");

            // Preparar body del request con datos del contexto
            Map<String, Object> requestBody = prepareRequestBody(bodyTemplate, context);

            // Crear headers HTTP
            HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(MediaType.APPLICATION_JSON);

            // Agregar headers personalizados
            for (Map.Entry<String, String> header : headers.entrySet()) {
                httpHeaders.add(header.getKey(), header.getValue());
            }

            // Ejecutar request según el método
            ResponseEntity<String> response;
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, httpHeaders);

            log.info("Enviando {} a {}", method, url);
            log.debug("Headers: {}", headers);
            log.debug("Body: {}", requestBody);

            switch (method) {
                case "GET":
                    response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
                    break;
                case "POST":
                    response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
                    break;
                case "PUT":
                    response = restTemplate.exchange(url, HttpMethod.PUT, entity, String.class);
                    break;
                case "DELETE":
                    response = restTemplate.exchange(url, HttpMethod.DELETE, entity, String.class);
                    break;
                case "PATCH":
                    response = restTemplate.exchange(url, HttpMethod.PATCH, entity, String.class);
                    break;
                default:
                    throw new IllegalArgumentException("Método HTTP no soportado: " + method);
            }

            // Verificar respuesta exitosa
            if (response.getStatusCode().is2xxSuccessful()) {
                result.setSuccess(true);
                result.addOutputData("statusCode", response.getStatusCode().value());
                result.addOutputData("responseBody", response.getBody());
                result.addOutputData("requestUrl", url);
                result.addOutputData("requestMethod", method);
                result.addOutputData("calledAt", LocalDateTime.now());
                result.addMetadata("responseHeaders", response.getHeaders().toSingleValueMap());

                log.info("API notificada exitosamente: {} {} - Status: {}",
                    method, url, response.getStatusCode().value());
            } else {
                result.setSuccess(false);
                result.setErrorMessage(String.format("API respondió con status %d: %s",
                    response.getStatusCode().value(), response.getBody()));
                result.addOutputData("statusCode", response.getStatusCode().value());
                result.addOutputData("responseBody", response.getBody());
            }

        } catch (Exception e) {
            log.error("Error al ejecutar acción API", e);
            result.setSuccess(false);
            result.setErrorMessage("Error al notificar API: " + e.getMessage());
            result.setException(e);
        } finally {
            result.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            result.markComplete();
        }

        return result;
    }

    /**
     * Prepara el body del request con datos del contexto
     */
    private Map<String, Object> prepareRequestBody(Object bodyTemplate, RuleContext context) {
        Map<String, Object> requestBody = new HashMap<>();

        // Si hay un body template, usarlo como base
        if (bodyTemplate instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> template = (Map<String, Object>) bodyTemplate;
            requestBody.putAll(template);
        }

        // Agregar datos del contexto
        requestBody.put("event", createEventData(context));
        requestBody.put("timestamp", LocalDateTime.now());

        return requestBody;
    }

    /**
     * Crea un objeto con los datos del evento desde el contexto
     */
    private Map<String, Object> createEventData(RuleContext context) {
        Map<String, Object> eventData = new HashMap<>();

        // Datos de operación
        if (context.getOperationType() != null) {
            eventData.put("operationType", context.getOperationType());
        }
        if (context.getOperationAmount() != null) {
            eventData.put("operationAmount", context.getOperationAmount());
        }
        if (context.getCurrency() != null) {
            eventData.put("currency", context.getCurrency());
        }
        if (context.getOperationStatus() != null) {
            eventData.put("operationStatus", context.getOperationStatus());
        }
        if (context.getReferenceCode() != null) {
            eventData.put("referenceCode", context.getReferenceCode());
        }
        if (context.getOperationId() != null) {
            eventData.put("operationId", context.getOperationId());
        }

        // Datos de usuario
        if (context.getUserCode() != null) {
            eventData.put("userCode", context.getUserCode());
        }
        if (context.getUserRole() != null) {
            eventData.put("userRole", context.getUserRole());
        }

        // Datos de contraparte
        if (context.getCounterpartyCode() != null) {
            eventData.put("counterpartyCode", context.getCounterpartyCode());
        }
        if (context.getCounterpartyName() != null) {
            eventData.put("counterpartyName", context.getCounterpartyName());
        }

        // Datos temporales
        if (context.getEventDateTime() != null) {
            eventData.put("eventDateTime", context.getEventDateTime());
        }

        // Datos adicionales del contexto
        if (context.getAdditionalData() != null && !context.getAdditionalData().isEmpty()) {
            eventData.put("additionalData", context.getAdditionalData());
        }

        return eventData;
    }
}
