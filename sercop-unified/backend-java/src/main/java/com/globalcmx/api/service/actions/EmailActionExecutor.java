package com.globalcmx.api.service.actions;

import com.globalcmx.api.dto.actions.ActionExecutionResult;
import com.globalcmx.api.dto.drools.RuleContext;
import com.globalcmx.api.service.query.EmailTemplateQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Ejecutor de acciones de envío de email.
 * Integra con el servicio de plantillas de correo para renderizar
 * y enviar emails basados en plantillas configuradas.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailActionExecutor implements ActionExecutor {

    private final EmailTemplateQueryService emailTemplateQueryService;

    @Override
    public String getActionType() {
        return "EMAIL";
    }

    @Override
    public String[] getRequiredConfigFields() {
        return new String[]{"destinatarios", "asunto"};
    }

    @Override
    public boolean validateConfig(Map<String, Object> config) {
        if (config == null || config.isEmpty()) {
            log.error("La configuración de EMAIL no puede ser null o vacía");
            return false;
        }

        // Validar destinatarios
        if (!config.containsKey("destinatarios")) {
            log.error("Falta campo requerido: destinatarios");
            return false;
        }

        Object destinatariosObj = config.get("destinatarios");
        if (!(destinatariosObj instanceof List) || ((List<?>) destinatariosObj).isEmpty()) {
            log.error("El campo 'destinatarios' debe ser una lista no vacía");
            return false;
        }

        // Validar asunto
        if (!config.containsKey("asunto") || config.get("asunto") == null) {
            log.error("Falta campo requerido: asunto");
            return false;
        }

        return true;
    }

    @Override
    public String getActionDescription(Map<String, Object> config) {
        String asunto = (String) config.get("asunto");
        @SuppressWarnings("unchecked")
        List<String> destinatarios = (List<String>) config.get("destinatarios");
        return String.format("Enviar email '%s' a %d destinatario(s)", asunto, destinatarios.size());
    }

    @Override
    public ActionExecutionResult execute(Map<String, Object> config, RuleContext context) {
        ActionExecutionResult result = ActionExecutionResult.success(getActionType());
        long startTime = System.currentTimeMillis();

        try {
            log.info("Iniciando ejecución de acción EMAIL");

            // Extraer configuración
            String plantillaCorreoCodigo = (String) config.get("plantillaCorreoCodigo");
            @SuppressWarnings("unchecked")
            List<String> destinatarios = (List<String>) config.get("destinatarios");
            @SuppressWarnings("unchecked")
            List<String> cc = (List<String>) config.getOrDefault("cc", new ArrayList<>());
            String asunto = (String) config.get("asunto");
            @SuppressWarnings("unchecked")
            Map<String, Object> variables = (Map<String, Object>) config.getOrDefault("variables", new HashMap<>());

            // Agregar variables del contexto
            Map<String, Object> allVariables = new HashMap<>(variables);
            allVariables.put("operationType", context.getOperationType());
            allVariables.put("operationAmount", context.getOperationAmount());
            allVariables.put("currency", context.getCurrency());
            allVariables.put("operationStatus", context.getOperationStatus());
            allVariables.put("referenceCode", context.getReferenceCode());
            allVariables.put("userCode", context.getUserCode());
            allVariables.put("eventDateTime", context.getEventDateTime());

            // Si hay una plantilla configurada, obtenerla y renderizarla
            String htmlContent;
            if (plantillaCorreoCodigo != null && !plantillaCorreoCodigo.isEmpty()) {
                log.debug("Buscando plantilla de correo: {}", plantillaCorreoCodigo);

                // TODO: Aquí se debería integrar con EmailTemplateQueryService
                // para obtener y renderizar la plantilla
                // Por ahora simulamos el contenido
                htmlContent = renderEmailTemplate(plantillaCorreoCodigo, allVariables);
            } else {
                // Generar contenido simple si no hay plantilla
                htmlContent = generateSimpleEmailContent(asunto, allVariables);
            }

            // Simular envío de email (implementación real pendiente)
            String emailId = simulateEmailSending(destinatarios, cc, asunto, htmlContent);

            // Registrar éxito
            result.setSuccess(true);
            result.addOutputData("emailId", emailId);
            result.addOutputData("destinatarios", destinatarios);
            result.addOutputData("asunto", asunto);
            result.addOutputData("sentAt", LocalDateTime.now());
            result.addMetadata("destinatariosCount", destinatarios.size());
            result.addMetadata("ccCount", cc.size());
            result.addMetadata("hasTemplate", plantillaCorreoCodigo != null);

            log.info("Email enviado exitosamente: ID={}, destinatarios={}", emailId, destinatarios);

        } catch (Exception e) {
            log.error("Error al ejecutar acción EMAIL", e);
            result.setSuccess(false);
            result.setErrorMessage("Error al enviar email: " + e.getMessage());
            result.setException(e);
        } finally {
            result.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            result.markComplete();
        }

        return result;
    }

    /**
     * Renderiza una plantilla de email con las variables proporcionadas
     */
    private String renderEmailTemplate(String plantillaCodigo, Map<String, Object> variables) {
        log.debug("Renderizando plantilla de email: {}", plantillaCodigo);

        // TODO: Implementar integración real con EmailTemplateQueryService
        // Por ahora retornamos un HTML simulado

        StringBuilder html = new StringBuilder();
        html.append("<html><body>");
        html.append("<h2>Notificación Automática - GlobalCMX</h2>");
        html.append("<p>Plantilla: ").append(plantillaCodigo).append("</p>");
        html.append("<hr/>");
        html.append("<h3>Detalles de la Operación:</h3>");
        html.append("<ul>");

        for (Map.Entry<String, Object> entry : variables.entrySet()) {
            html.append("<li><strong>").append(entry.getKey()).append(":</strong> ")
                .append(entry.getValue()).append("</li>");
        }

        html.append("</ul>");
        html.append("<hr/>");
        html.append("<p><small>Este es un email generado automáticamente por el sistema de reglas</small></p>");
        html.append("</body></html>");

        return html.toString();
    }

    /**
     * Genera contenido simple de email sin plantilla
     */
    private String generateSimpleEmailContent(String asunto, Map<String, Object> variables) {
        StringBuilder html = new StringBuilder();
        html.append("<html><body>");
        html.append("<h2>").append(asunto).append("</h2>");
        html.append("<p>Se ha disparado una regla de evento con los siguientes datos:</p>");
        html.append("<ul>");

        for (Map.Entry<String, Object> entry : variables.entrySet()) {
            html.append("<li><strong>").append(entry.getKey()).append(":</strong> ")
                .append(entry.getValue()).append("</li>");
        }

        html.append("</ul>");
        html.append("</body></html>");

        return html.toString();
    }

    /**
     * Simula el envío de un email
     * En producción, esto debería usar JavaMailSender o un servicio de email
     */
    private String simulateEmailSending(List<String> destinatarios, List<String> cc,
                                       String asunto, String htmlContent) {
        String emailId = "EMAIL-" + UUID.randomUUID().toString().substring(0, 8);

        log.info("=== SIMULACIÓN DE ENVÍO DE EMAIL ===");
        log.info("Email ID: {}", emailId);
        log.info("Para: {}", String.join(", ", destinatarios));
        if (!cc.isEmpty()) {
            log.info("CC: {}", String.join(", ", cc));
        }
        log.info("Asunto: {}", asunto);
        log.info("Contenido HTML: {} caracteres", htmlContent.length());
        log.info("=====================================");

        // En producción, aquí se enviaría el email real
        // javaMailSender.send(mimeMessage);

        return emailId;
    }
}
