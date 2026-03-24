package com.globalcmx.api.service.actions;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.actions.ActionExecutionResult;
import com.globalcmx.api.dto.drools.RuleContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Ejecutor de acciones de auditoría.
 * Guarda registros de auditoría en la base de datos con información
 * sobre eventos disparados por reglas.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditActionExecutor implements ActionExecutor {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public String getActionType() {
        return "AUDITORIA";
    }

    @Override
    public String[] getRequiredConfigFields() {
        return new String[]{"categoria", "mensaje"};
    }

    @Override
    public boolean validateConfig(Map<String, Object> config) {
        if (config == null || config.isEmpty()) {
            log.error("La configuración de AUDITORIA no puede ser null o vacía");
            return false;
        }

        // Validar categoría
        if (!config.containsKey("categoria") || config.get("categoria") == null) {
            log.error("Falta campo requerido: categoria");
            return false;
        }

        // Validar mensaje
        if (!config.containsKey("mensaje") || config.get("mensaje") == null) {
            log.error("Falta campo requerido: mensaje");
            return false;
        }

        // Validar severidad si está presente
        if (config.containsKey("severidad")) {
            String severidad = config.get("severidad").toString().toUpperCase();
            if (!severidad.matches("INFO|WARN|ERROR|DEBUG|CRITICAL")) {
                log.error("Severidad no válida: {}. Use INFO, WARN, ERROR, DEBUG o CRITICAL", severidad);
                return false;
            }
        }

        return true;
    }

    @Override
    public String getActionDescription(Map<String, Object> config) {
        String categoria = (String) config.get("categoria");
        String severidad = (String) config.getOrDefault("severidad", "INFO");
        return String.format("Crear registro de auditoría [%s] - %s", severidad, categoria);
    }

    @Override
    public ActionExecutionResult execute(Map<String, Object> config, RuleContext context) {
        ActionExecutionResult result = ActionExecutionResult.success(getActionType());
        long startTime = System.currentTimeMillis();

        try {
            log.info("Iniciando ejecución de acción AUDITORIA");

            // Extraer configuración
            String categoria = config.get("categoria").toString();
            String mensaje = config.get("mensaje").toString();
            String severidad = config.getOrDefault("severidad", "INFO").toString().toUpperCase();
            @SuppressWarnings("unchecked")
            Map<String, Object> metadataConfig = (Map<String, Object>) config.getOrDefault("metadata", new HashMap<>());

            // Preparar metadata con datos del contexto
            Map<String, Object> auditMetadata = new HashMap<>(metadataConfig);
            enrichMetadataWithContext(auditMetadata, context);

            // Renderizar mensaje con variables del contexto
            String renderedMessage = renderMessage(mensaje, context);

            // Generar ID único para el registro de auditoría
            String auditId = "AUDIT-" + UUID.randomUUID().toString();

            // Guardar en base de datos
            saveAuditRecord(auditId, categoria, severidad, renderedMessage, auditMetadata, context);

            // Registrar éxito
            result.setSuccess(true);
            result.addOutputData("auditId", auditId);
            result.addOutputData("categoria", categoria);
            result.addOutputData("severidad", severidad);
            result.addOutputData("mensaje", renderedMessage);
            result.addOutputData("createdAt", LocalDateTime.now());
            result.addMetadata("metadataKeys", auditMetadata.keySet());

            log.info("Registro de auditoría creado exitosamente: ID={}, categoria={}, severidad={}",
                auditId, categoria, severidad);

        } catch (Exception e) {
            log.error("Error al ejecutar acción AUDITORIA", e);
            result.setSuccess(false);
            result.setErrorMessage("Error al crear registro de auditoría: " + e.getMessage());
            result.setException(e);
        } finally {
            result.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            result.markComplete();
        }

        return result;
    }

    /**
     * Enriquece la metadata con datos del contexto de la regla
     */
    private void enrichMetadataWithContext(Map<String, Object> metadata, RuleContext context) {
        // Datos de operación
        if (context.getOperationType() != null) {
            metadata.put("operationType", context.getOperationType());
        }
        if (context.getOperationAmount() != null) {
            metadata.put("operationAmount", context.getOperationAmount().toString());
        }
        if (context.getCurrency() != null) {
            metadata.put("currency", context.getCurrency());
        }
        if (context.getOperationStatus() != null) {
            metadata.put("operationStatus", context.getOperationStatus());
        }
        if (context.getReferenceCode() != null) {
            metadata.put("referenceCode", context.getReferenceCode());
        }
        if (context.getOperationId() != null) {
            metadata.put("operationId", context.getOperationId());
        }

        // Datos de usuario
        if (context.getUserCode() != null) {
            metadata.put("userCode", context.getUserCode());
        }
        if (context.getUserRole() != null) {
            metadata.put("userRole", context.getUserRole());
        }

        // Timestamp del evento
        if (context.getEventDateTime() != null) {
            metadata.put("eventDateTime", context.getEventDateTime().toString());
        }
    }

    /**
     * Renderiza el mensaje reemplazando variables con datos del contexto
     */
    private String renderMessage(String template, RuleContext context) {
        String rendered = template;

        // Mapeo de variables disponibles
        Map<String, String> variables = new HashMap<>();

        if (context.getOperationType() != null) {
            variables.put("operationType", context.getOperationType());
        }
        if (context.getOperationAmount() != null) {
            variables.put("operationAmount", context.getOperationAmount().toString());
        }
        if (context.getCurrency() != null) {
            variables.put("currency", context.getCurrency());
        }
        if (context.getOperationStatus() != null) {
            variables.put("operationStatus", context.getOperationStatus());
        }
        if (context.getReferenceCode() != null) {
            variables.put("referenceCode", context.getReferenceCode());
        }
        if (context.getUserCode() != null) {
            variables.put("userCode", context.getUserCode());
        }

        // Reemplazar variables en el template
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            String placeholder = "${" + entry.getKey() + "}";
            rendered = rendered.replace(placeholder, entry.getValue());
        }

        return rendered;
    }

    /**
     * Guarda el registro de auditoría en la base de datos
     */
    private void saveAuditRecord(String auditId, String categoria, String severidad,
                                 String mensaje, Map<String, Object> metadata,
                                 RuleContext context) {
        try {
            // SQL para insertar registro de auditoría
            String sql = "INSERT INTO auditoria_reglas_eventos " +
                        "(audit_id, categoria, severidad, mensaje, operation_type, operation_id, " +
                        "reference_code, user_code, metadata_json, created_at) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS jsonb), ?)";

            // Convertir metadata a JSON
            String metadataJson = convertMapToJson(metadata);

            jdbcTemplate.update(sql,
                auditId,
                categoria,
                severidad,
                mensaje,
                context.getOperationType(),
                context.getOperationId(),
                context.getReferenceCode(),
                context.getUserCode(),
                metadataJson,
                LocalDateTime.now()
            );

            log.debug("Registro de auditoría persistido en base de datos: {}", auditId);

        } catch (Exception e) {
            // Si falla la persistencia en BD, al menos logueamos
            log.error("Error al persistir registro de auditoría en BD, usando log como fallback", e);
            logAuditRecordAsFallback(auditId, categoria, severidad, mensaje, metadata);
        }
    }

    /**
     * Convierte un Map a JSON string
     */
    private String convertMapToJson(Map<String, Object> map) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.writeValueAsString(map);
        } catch (Exception e) {
            log.warn("Error al convertir metadata a JSON, retornando string vacío", e);
            return "{}";
        }
    }

    /**
     * Loguea el registro de auditoría como fallback si falla la persistencia
     */
    private void logAuditRecordAsFallback(String auditId, String categoria, String severidad,
                                         String mensaje, Map<String, Object> metadata) {
        String logMessage = String.format(
            "=== REGISTRO DE AUDITORÍA (FALLBACK) ===\n" +
            "Audit ID: %s\n" +
            "Categoría: %s\n" +
            "Severidad: %s\n" +
            "Mensaje: %s\n" +
            "Metadata: %s\n" +
            "Timestamp: %s\n" +
            "========================================",
            auditId, categoria, severidad, mensaje, metadata, LocalDateTime.now()
        );

        switch (severidad) {
            case "ERROR":
            case "CRITICAL":
                log.error(logMessage);
                break;
            case "WARN":
                log.warn(logMessage);
                break;
            case "DEBUG":
                log.debug(logMessage);
                break;
            default:
                log.info(logMessage);
        }
    }
}
