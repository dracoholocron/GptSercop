package com.globalcmx.api.service.plantilla;

import com.globalcmx.api.readmodel.entity.OperationReadModel;
import com.globalcmx.api.readmodel.entity.PlantillaReadModel;
import com.globalcmx.api.readmodel.repository.OperationReadModelRepository;
import com.globalcmx.api.readmodel.repository.PlantillaReadModelRepository;
import com.globalcmx.api.service.document.HtmlToPdfConverter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/**
 * Servicio principal para generación de documentos de garantías bancarias
 * Integra el resolver de datos, el conversor HTML a PDF y las plantillas
 * Usa OperationReadModel como fuente de datos
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GuaranteeDocumentService {

    private final GuaranteeTemplateDataResolver templateDataResolver;
    private final HtmlToPdfConverter htmlToPdfConverter;
    private final OperationReadModelRepository operationRepository;
    private final PlantillaReadModelRepository plantillaRepository;

    private static final String TEMPLATES_PATH = "templates/guarantees/";

    /**
     * Genera el documento PDF de una garantía por ID de operación
     * @param operationId ID de la operación
     * @param language Idioma (ES o EN)
     * @return Bytes del PDF generado
     */
    public byte[] generateGuaranteePdf(Long operationId, String language) throws Exception {
        log.info("Generando PDF para operación {} en idioma {}", operationId, language);

        OperationReadModel operation = operationRepository.findById(operationId)
            .orElseThrow(() -> new IllegalArgumentException("Operación no encontrada: " + operationId));

        if (!"GUARANTEE".equals(operation.getProductType())) {
            throw new IllegalArgumentException("La operación no es una garantía: " + operationId);
        }

        return generateGuaranteePdfFromOperation(operation, language);
    }

    /**
     * Genera el documento PDF de una garantía por referencia (número de garantía)
     * @param reference Referencia de la operación (número de garantía)
     * @param language Idioma (ES o EN)
     * @return Bytes del PDF generado
     */
    public byte[] generateGuaranteePdfFromOperation(String reference, String language) throws Exception {
        log.info("Generando PDF desde operación {} en idioma {}", reference, language);

        OperationReadModel operation = operationRepository.findByReference(reference)
            .orElseThrow(() -> new IllegalArgumentException("Operación no encontrada: " + reference));

        if (!"GUARANTEE".equals(operation.getProductType())) {
            throw new IllegalArgumentException("La operación no es una garantía: " + reference);
        }

        return generateGuaranteePdfFromOperation(operation, language);
    }

    /**
     * Genera el documento PDF de una garantía desde OperationReadModel
     * @param operation Operación
     * @param language Idioma (ES o EN)
     * @return Bytes del PDF generado
     */
    private byte[] generateGuaranteePdfFromOperation(OperationReadModel operation, String language) throws Exception {
        // Resolver datos desde la operación
        Map<String, Object> templateData = templateDataResolver.resolveFromOperation(operation, language);

        // Obtener plantilla apropiada para el tipo de garantía
        String htmlTemplate = getTemplateForGuarantee(operation, language);

        // Generar PDF
        return htmlToPdfConverter.convertHtmlToPdf(htmlTemplate, templateData);
    }

    /**
     * Genera un preview HTML del documento de garantía por ID
     * @param operationId ID de la operación
     * @param language Idioma (ES o EN)
     * @return HTML procesado con los datos de la garantía
     */
    public String generateGuaranteePreview(Long operationId, String language) throws Exception {
        log.info("Generando preview para operación {} en idioma {}", operationId, language);

        OperationReadModel operation = operationRepository.findById(operationId)
            .orElseThrow(() -> new IllegalArgumentException("Operación no encontrada: " + operationId));

        if (!"GUARANTEE".equals(operation.getProductType())) {
            throw new IllegalArgumentException("La operación no es una garantía: " + operationId);
        }

        // Resolver datos
        Map<String, Object> templateData = templateDataResolver.resolveFromOperation(operation, language);

        // Obtener plantilla apropiada
        String htmlTemplate = getTemplateForGuarantee(operation, language);

        // Procesar sin convertir a PDF
        return processTemplate(htmlTemplate, templateData);
    }

    /**
     * Genera un preview HTML del documento de garantía por referencia
     * @param reference Referencia de la operación
     * @param language Idioma (ES o EN)
     * @return HTML procesado con los datos
     */
    public String generateGuaranteePreviewFromOperation(String reference, String language) throws Exception {
        log.info("Generando preview desde operación {} en idioma {}", reference, language);

        OperationReadModel operation = operationRepository.findByReference(reference)
            .orElseThrow(() -> new IllegalArgumentException("Operación no encontrada: " + reference));

        if (!"GUARANTEE".equals(operation.getProductType())) {
            throw new IllegalArgumentException("La operación no es una garantía: " + reference);
        }

        // Resolver datos desde la operación
        Map<String, Object> templateData = templateDataResolver.resolveFromOperation(operation, language);

        // Obtener plantilla por defecto para garantías
        String htmlTemplate = getTemplateForGuarantee(operation, language);

        // Procesar template sin convertir a PDF
        return processTemplate(htmlTemplate, templateData);
    }

    /**
     * Genera un documento usando una plantilla específica de la base de datos
     * @param operationId ID de la operación
     * @param plantillaId ID de la plantilla
     * @param language Idioma
     * @return Bytes del PDF generado
     */
    public byte[] generateWithCustomTemplate(Long operationId, Long plantillaId, String language) throws Exception {
        log.info("Generando PDF para operación {} con plantilla {} en idioma {}", operationId, plantillaId, language);

        OperationReadModel operation = operationRepository.findById(operationId)
            .orElseThrow(() -> new IllegalArgumentException("Operación no encontrada: " + operationId));

        if (!"GUARANTEE".equals(operation.getProductType())) {
            throw new IllegalArgumentException("La operación no es una garantía: " + operationId);
        }

        PlantillaReadModel plantilla = plantillaRepository.findById(plantillaId)
            .orElseThrow(() -> new IllegalArgumentException("Plantilla no encontrada: " + plantillaId));

        if (!"HTML".equalsIgnoreCase(plantilla.getTipoDocumento())) {
            throw new IllegalArgumentException("La plantilla debe ser de tipo HTML");
        }

        // Resolver datos
        Map<String, Object> templateData = templateDataResolver.resolveFromOperation(operation, language);

        // Leer contenido de la plantilla
        String htmlTemplate = readTemplateFromPath(plantilla.getRutaArchivo());

        // Generar PDF
        return htmlToPdfConverter.convertHtmlToPdf(htmlTemplate, templateData);
    }

    /**
     * Obtiene las variables disponibles para plantillas de garantías
     * @return Lista de nombres de variables disponibles
     */
    public List<String> getAvailableVariables() {
        return List.of(
            // Datos básicos
            "numeroGarantia", "referencia", "tipo", "subtipo", "estado", "tipoDescripcion",
            // Montos
            "moneda", "monto", "montoFormateado", "montoLetras", "montoConLetras",
            "porcentajeProyecto", "porcentajeFormateado",
            // Fechas
            "fechaEmision", "fechaEmisionCorta", "fechaVencimiento", "fechaVencimientoCorta",
            "fechaActual", "fechaEjecucion", "fechaLiberacion",
            // Contrato
            "numeroContrato", "objetoContrato", "descripcion",
            "montoContrato", "montoContratoFormateado", "montoContratoLetras",
            // Condiciones
            "condicionesEjecucion", "condicionesLiberacion", "esReducible", "formulaReduccion",
            // Ordenante
            "ordenanteNombre", "ordenanteDireccion", "ordenanteIdentificacion",
            "ordenanteEmail", "ordenanteTelefono", "applicantName", "applicantAddress",
            // Beneficiario
            "beneficiarioNombre", "beneficiarioDireccion", "beneficiarioIdentificacion",
            "beneficiarioEmail", "beneficiarioTelefono", "beneficiaryName", "beneficiaryAddress",
            // Banco Garante
            "bancoGaranteNombre", "bancoGaranteSwift", "bancoGaranteDireccion",
            "bancoGarantePais", "bancoGaranteCiudad", "issuingBankName", "issuingBankSwift", "issuingBankAddress",
            // Banco Contragarante
            "bancoContragaranteNombre", "bancoContragaranteSwift", "bancoContragaranteDireccion",
            "counterGuarantorName", "counterGuarantorSwift",
            // Textos legales
            "textoIrrevocable", "textoTransferible", "textoJurisdiccion", "textoLeyAplicable",
            // Idioma
            "idioma", "esEspanol"
        );
    }

    /**
     * Obtiene la plantilla HTML apropiada para el tipo de garantía desde operation
     */
    private String getTemplateForGuarantee(OperationReadModel operation, String language) throws IOException {
        String subtipo = operation.getStage() != null ? operation.getStage() : "OTHER";
        String langSuffix = "ES".equalsIgnoreCase(language) ? "-es" : "-en";

        // Mapear subtipo a nombre de archivo
        String templateName = mapSubtipoToTemplateName(subtipo) + langSuffix + ".html";

        try {
            return loadTemplateFromClasspath(templateName);
        } catch (IOException e) {
            log.warn("No se encontró plantilla específica {}, usando plantilla por defecto", templateName);
            // Intentar cargar plantilla por defecto
            return loadTemplateFromClasspath("default" + langSuffix + ".html");
        }
    }

    private String mapSubtipoToTemplateName(String subtipo) {
        return switch (subtipo) {
            // Tipos principales de Doka
            case "ADVANCE_PAYMENT", "A" -> "advance-payment";
            case "PERFORMANCE", "P" -> "performance-bond";
            case "BID_BOND", "B" -> "bid-bond";
            case "PAYMENT", "Z" -> "payment-guarantee";
            case "WARRANTY", "W" -> "warranty-bond";
            case "COUNTER", "C" -> "counter-guarantee";
            case "CREDIT_FACILITIES", "CREDIT", "F" -> "credit-facilities";
            // Tipos adicionales
            case "CUSTOMS", "Y" -> "customs-bond";
            case "RETENTION", "R" -> "retention-bond";
            case "OTHER", "O" -> "default";
            default -> "default";
        };
    }

    private String loadTemplateFromClasspath(String templateName) throws IOException {
        ClassPathResource resource = new ClassPathResource(TEMPLATES_PATH + templateName);
        return new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
    }

    private String readTemplateFromPath(String path) throws IOException {
        ClassPathResource resource = new ClassPathResource(path);
        if (resource.exists()) {
            return new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        }
        throw new IOException("Plantilla no encontrada: " + path);
    }

    private String processTemplate(String htmlTemplate, Map<String, Object> data) {
        // Procesar variables simples en formato [[${variable}]]
        String result = htmlTemplate;
        for (Map.Entry<String, Object> entry : data.entrySet()) {
            String placeholder = "[[${" + entry.getKey() + "}]]";
            String value = entry.getValue() != null ? entry.getValue().toString() : "";
            result = result.replace(placeholder, value);
        }
        return result;
    }
}
