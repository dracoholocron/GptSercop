package com.globalcmx.api.service.actions;

import com.globalcmx.api.dto.actions.ActionExecutionResult;
import com.globalcmx.api.dto.drools.RuleContext;
import com.globalcmx.api.service.plantilla.PlantillaGenerationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Ejecutor de acciones de generación de documentos.
 * Integra con el servicio de plantillas para generar documentos
 * en formato PDF u otros formatos configurados.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentActionExecutor implements ActionExecutor {

    private final PlantillaGenerationService plantillaGenerationService;

    @Override
    public String getActionType() {
        return "DOCUMENTO";
    }

    @Override
    public String[] getRequiredConfigFields() {
        return new String[]{"plantillaCodigo", "formato"};
    }

    @Override
    public boolean validateConfig(Map<String, Object> config) {
        if (config == null || config.isEmpty()) {
            log.error("La configuración de DOCUMENTO no puede ser null o vacía");
            return false;
        }

        // Validar plantillaCodigo
        if (!config.containsKey("plantillaCodigo") || config.get("plantillaCodigo") == null) {
            log.error("Falta campo requerido: plantillaCodigo");
            return false;
        }

        // Validar formato
        if (!config.containsKey("formato") || config.get("formato") == null) {
            log.error("Falta campo requerido: formato");
            return false;
        }

        String formato = config.get("formato").toString().toUpperCase();
        if (!formato.equals("PDF") && !formato.equals("HTML") && !formato.equals("DOCX")) {
            log.error("Formato no soportado: {}. Use PDF, HTML o DOCX", formato);
            return false;
        }

        return true;
    }

    @Override
    public String getActionDescription(Map<String, Object> config) {
        String plantillaCodigo = (String) config.get("plantillaCodigo");
        String formato = (String) config.get("formato");
        return String.format("Generar documento %s usando plantilla '%s'", formato, plantillaCodigo);
    }

    @Override
    public ActionExecutionResult execute(Map<String, Object> config, RuleContext context) {
        ActionExecutionResult result = ActionExecutionResult.success(getActionType());
        long startTime = System.currentTimeMillis();

        try {
            log.info("Iniciando ejecución de acción DOCUMENTO");

            // Extraer configuración
            String plantillaCodigo = (String) config.get("plantillaCodigo");
            String formato = config.get("formato").toString().toUpperCase();
            @SuppressWarnings("unchecked")
            Map<String, Object> variables = (Map<String, Object>) config.getOrDefault("variables", new HashMap<>());
            String almacenarEn = (String) config.getOrDefault("almacenarEn", "/tmp/documents");

            // Agregar variables del contexto
            Map<String, Object> allVariables = new HashMap<>(variables);
            allVariables.put("operationType", context.getOperationType());
            allVariables.put("operationAmount", context.getOperationAmount());
            allVariables.put("currency", context.getCurrency());
            allVariables.put("operationStatus", context.getOperationStatus());
            allVariables.put("referenceCode", context.getReferenceCode());
            allVariables.put("userCode", context.getUserCode());
            allVariables.put("eventDateTime", context.getEventDateTime());
            allVariables.put("generatedAt", LocalDateTime.now());

            // Generar nombre de archivo único
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String uniqueId = UUID.randomUUID().toString().substring(0, 8);
            String fileName = String.format("%s_%s_%s.%s",
                plantillaCodigo, timestamp, uniqueId, formato.toLowerCase());

            // Crear directorio si no existe
            Path directoryPath = Paths.get(almacenarEn);
            if (!Files.exists(directoryPath)) {
                Files.createDirectories(directoryPath);
                log.info("Directorio creado: {}", directoryPath);
            }

            String filePath = Paths.get(almacenarEn, fileName).toString();

            // Generar documento según formato
            String documentId = generateDocument(plantillaCodigo, formato, allVariables, filePath);

            // Registrar éxito
            result.setSuccess(true);
            result.addOutputData("documentId", documentId);
            result.addOutputData("fileName", fileName);
            result.addOutputData("filePath", filePath);
            result.addOutputData("formato", formato);
            result.addOutputData("generatedAt", LocalDateTime.now());
            result.addMetadata("plantillaCodigo", plantillaCodigo);
            result.addMetadata("fileSize", getFileSize(filePath));

            log.info("Documento generado exitosamente: ID={}, path={}", documentId, filePath);

        } catch (Exception e) {
            log.error("Error al ejecutar acción DOCUMENTO", e);
            result.setSuccess(false);
            result.setErrorMessage("Error al generar documento: " + e.getMessage());
            result.setException(e);
        } finally {
            result.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            result.markComplete();
        }

        return result;
    }

    /**
     * Genera el documento según el formato especificado
     */
    private String generateDocument(String plantillaCodigo, String formato,
                                   Map<String, Object> variables, String filePath) throws Exception {
        log.debug("Generando documento: plantilla={}, formato={}, path={}",
            plantillaCodigo, formato, filePath);

        String documentId = "DOC-" + UUID.randomUUID().toString().substring(0, 8);

        switch (formato) {
            case "PDF":
                generatePdfDocument(plantillaCodigo, variables, filePath);
                break;
            case "HTML":
                generateHtmlDocument(plantillaCodigo, variables, filePath);
                break;
            case "DOCX":
                generateDocxDocument(plantillaCodigo, variables, filePath);
                break;
            default:
                throw new IllegalArgumentException("Formato no soportado: " + formato);
        }

        log.info("=== DOCUMENTO GENERADO ===");
        log.info("Document ID: {}", documentId);
        log.info("Plantilla: {}", plantillaCodigo);
        log.info("Formato: {}", formato);
        log.info("Ruta: {}", filePath);
        log.info("Variables: {} keys", variables.size());
        log.info("==========================");

        return documentId;
    }

    /**
     * Genera documento PDF usando Flying Saucer
     */
    private void generatePdfDocument(String plantillaCodigo, Map<String, Object> variables,
                                    String filePath) throws Exception {
        log.debug("Generando documento PDF");

        // TODO: Implementar integración real con PlantillaGenerationService
        // Por ahora simulamos la generación

        // Renderizar HTML desde plantilla
        String htmlContent = renderTemplate(plantillaCodigo, variables);

        // Simular guardado del archivo
        simulateFileSave(filePath, htmlContent.getBytes());

        log.info("PDF generado y guardado en: {}", filePath);
    }

    /**
     * Genera documento HTML
     */
    private void generateHtmlDocument(String plantillaCodigo, Map<String, Object> variables,
                                     String filePath) throws Exception {
        log.debug("Generando documento HTML");

        String htmlContent = renderTemplate(plantillaCodigo, variables);

        // Simular guardado del archivo
        simulateFileSave(filePath, htmlContent.getBytes());

        log.info("HTML generado y guardado en: {}", filePath);
    }

    /**
     * Genera documento DOCX
     */
    private void generateDocxDocument(String plantillaCodigo, Map<String, Object> variables,
                                     String filePath) throws Exception {
        log.debug("Generando documento DOCX");

        // TODO: Implementar generación de DOCX usando Apache POI
        // Por ahora simulamos

        String content = renderTemplate(plantillaCodigo, variables);

        // Simular guardado del archivo
        simulateFileSave(filePath, content.getBytes());

        log.info("DOCX generado y guardado en: {}", filePath);
    }

    /**
     * Renderiza una plantilla con las variables proporcionadas
     */
    private String renderTemplate(String plantillaCodigo, Map<String, Object> variables) {
        log.debug("Renderizando plantilla: {}", plantillaCodigo);

        // TODO: Implementar integración real con PlantillaGenerationService
        // Por ahora retornamos un HTML simulado

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>\n<html>\n<head>\n");
        html.append("<meta charset=\"UTF-8\">\n");
        html.append("<title>Documento - ").append(plantillaCodigo).append("</title>\n");
        html.append("<style>\n");
        html.append("body { font-family: Arial, sans-serif; margin: 40px; }\n");
        html.append("h1 { color: #333; }\n");
        html.append("table { border-collapse: collapse; width: 100%; margin-top: 20px; }\n");
        html.append("th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }\n");
        html.append("th { background-color: #4CAF50; color: white; }\n");
        html.append("</style>\n");
        html.append("</head>\n<body>\n");
        html.append("<h1>Documento Generado - GlobalCMX</h1>\n");
        html.append("<p><strong>Plantilla:</strong> ").append(plantillaCodigo).append("</p>\n");
        html.append("<hr/>\n");
        html.append("<h2>Datos de la Operación</h2>\n");
        html.append("<table>\n");
        html.append("<tr><th>Campo</th><th>Valor</th></tr>\n");

        for (Map.Entry<String, Object> entry : variables.entrySet()) {
            html.append("<tr><td>").append(entry.getKey()).append("</td><td>")
                .append(entry.getValue()).append("</td></tr>\n");
        }

        html.append("</table>\n");
        html.append("<hr/>\n");
        html.append("<p><small>Documento generado automáticamente por el sistema de reglas el ")
            .append(LocalDateTime.now()).append("</small></p>\n");
        html.append("</body>\n</html>");

        return html.toString();
    }

    /**
     * Simula el guardado de un archivo
     */
    private void simulateFileSave(String filePath, byte[] content) throws Exception {
        Path path = Paths.get(filePath);
        Files.createDirectories(path.getParent());
        Files.write(path, content);
        log.debug("Archivo simulado guardado: {} ({} bytes)", filePath, content.length);
    }

    /**
     * Obtiene el tamaño de un archivo
     */
    private long getFileSize(String filePath) {
        try {
            File file = new File(filePath);
            return file.exists() ? file.length() : 0;
        } catch (Exception e) {
            log.warn("No se pudo obtener tamaño del archivo: {}", filePath);
            return 0;
        }
    }
}
