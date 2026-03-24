package com.globalcmx.api.service.document;

import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.StringTemplateResolver;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.HashSet;
import java.util.Set;

/**
 * Servicio para convertir HTML con plantillas Thymeleaf a PDF
 */
@Service
@Slf4j
public class HtmlToPdfConverter {

    private final TemplateEngine templateEngine;

    public HtmlToPdfConverter() {
        // Configurar Thymeleaf para procesar templates desde String
        StringTemplateResolver templateResolver = new StringTemplateResolver();
        templateResolver.setTemplateMode(TemplateMode.HTML);
        templateResolver.setCacheable(false);

        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.setTemplateResolver(templateResolver);
        this.templateEngine = engine;
    }

    /**
     * Convierte una plantilla HTML con datos a PDF
     *
     * @param htmlTemplate Plantilla HTML con sintaxis Thymeleaf
     * @param data         Mapa de datos para reemplazar en la plantilla
     * @return Array de bytes del PDF generado
     */
    public byte[] convertHtmlToPdf(String htmlTemplate, Map<String, Object> data) throws Exception {
        try {
            log.info("Procesando plantilla HTML con Thymeleaf...");

            // Procesar plantilla con Thymeleaf
            Context context = new Context();
            context.setVariables(data);
            String processedHtml = templateEngine.process(htmlTemplate, context);

            log.info("Convirtiendo HTML procesado a PDF...");

            // Limpiar y validar HTML con Jsoup
            Document doc = Jsoup.parse(processedHtml);
            doc.outputSettings().syntax(Document.OutputSettings.Syntax.xml);
            String xhtml = doc.html();

            // Convertir a PDF usando Flying Saucer
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            ITextRenderer renderer = new ITextRenderer();
            renderer.setDocumentFromString(xhtml);
            renderer.layout();
            renderer.createPDF(outputStream);
            renderer.finishPDF();

            log.info("PDF generado exitosamente");
            return outputStream.toByteArray();

        } catch (IOException e) {
            log.error("Error convirtiendo HTML a PDF: {}", e.getMessage(), e);
            throw new Exception("Error al generar PDF desde HTML: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Error en la conversión HTML a PDF: {}", e.getMessage(), e);
            throw new Exception("Error al generar PDF desde HTML: " + e.getMessage(), e);
        }
    }

    /**
     * Detecta las variables usadas en una plantilla HTML Thymeleaf
     *
     * @param htmlTemplate Plantilla HTML
     * @return Set de nombres de variables encontradas
     */
    public Set<String> detectVariables(String htmlTemplate) {
        Set<String> variables = new HashSet<>();

        // Patrones para detectar variables Thymeleaf
        // Formato: ${variable} o [[${variable}]]
        Pattern pattern1 = Pattern.compile("\\$\\{([a-zA-Z0-9_.]+)\\}");
        Pattern pattern2 = Pattern.compile("\\[\\[\\$\\{([a-zA-Z0-9_.]+)\\}\\]\\]");

        // Patrón para th:each (listas)
        Pattern pattern3 = Pattern.compile("th:each=\"([a-zA-Z0-9_]+)\\s*:\\s*\\$\\{([a-zA-Z0-9_.]+)\\}\"");

        Matcher matcher1 = pattern1.matcher(htmlTemplate);
        while (matcher1.find()) {
            String var = matcher1.group(1);
            // Ignorar variables que son propiedades de iteración
            if (!var.contains(".")) {
                variables.add(var);
            }
        }

        Matcher matcher2 = pattern2.matcher(htmlTemplate);
        while (matcher2.find()) {
            String var = matcher2.group(1);
            if (!var.contains(".")) {
                variables.add(var);
            }
        }

        Matcher matcher3 = pattern3.matcher(htmlTemplate);
        while (matcher3.find()) {
            // Agregar la variable de la lista (segundo grupo)
            variables.add(matcher3.group(2));
        }

        log.info("Variables detectadas en plantilla: {}", variables);
        return variables;
    }

    /**
     * Valida que una plantilla HTML sea válida
     *
     * @param htmlTemplate Plantilla HTML
     * @return true si es válida
     */
    public boolean validateTemplate(String htmlTemplate) {
        try {
            Document doc = Jsoup.parse(htmlTemplate);
            return doc.body() != null;
        } catch (Exception e) {
            log.error("Plantilla HTML inválida: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Genera un HTML de ejemplo para preview sin datos
     *
     * @param htmlTemplate Plantilla HTML
     * @return HTML procesado con valores de ejemplo
     */
    public String generatePreviewHtml(String htmlTemplate) {
        try {
            // Reemplazar variables con valores de ejemplo
            String preview = htmlTemplate
                .replaceAll("\\[\\[\\$\\{([^}]+)\\}\\]\\]", "<span style='background-color: #ffeb3b; padding: 2px 4px;'>[$1]</span>")
                .replaceAll("\\$\\{([^}]+)\\}", "<span style='background-color: #ffeb3b; padding: 2px 4px;'>[$1]</span>");

            return preview;
        } catch (Exception e) {
            log.error("Error generando preview HTML: {}", e.getMessage());
            return htmlTemplate;
        }
    }
}
