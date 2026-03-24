package com.globalcmx.api.service.plantilla;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.readmodel.entity.PlantillaReadModel;
import com.globalcmx.api.readmodel.repository.PlantillaReadModelRepository;
import com.globalcmx.api.service.document.HtmlToPdfConverter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.Set;

/**
 * Servicio para la generación de documentos PDF desde plantillas
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PlantillaGenerationService {

    private final PlantillaReadModelRepository plantillaRepository;
    private final HtmlToPdfConverter htmlToPdfConverter;
    private final ObjectMapper objectMapper;

    @Value("${plantillas.storage.path:${user.home}/plantillas}")
    private String storagePath;

    /**
     * Genera un PDF desde una plantilla con los datos proporcionados
     *
     * @param plantillaId ID de la plantilla
     * @param data        Datos para reemplazar en la plantilla
     * @return Array de bytes del PDF generado
     */
    public byte[] generatePdf(Long plantillaId, Map<String, Object> data) throws Exception {
        log.info("Generando PDF desde plantilla ID: {}", plantillaId);

        // Obtener plantilla
        PlantillaReadModel plantilla = plantillaRepository.findById(plantillaId)
            .orElseThrow(() -> new IllegalArgumentException("Plantilla no encontrada: " + plantillaId));

        // Verificar que sea plantilla HTML
        if (!"HTML".equalsIgnoreCase(plantilla.getTipoDocumento())) {
            throw new IllegalArgumentException("La plantilla debe ser de tipo HTML. Tipo actual: " + plantilla.getTipoDocumento());
        }

        // Leer contenido de la plantilla
        String htmlTemplate = readTemplateContent(plantilla.getRutaArchivo());

        // Generar PDF
        return htmlToPdfConverter.convertHtmlToPdf(htmlTemplate, data);
    }

    /**
     * Detecta las variables de una plantilla
     *
     * @param plantillaId ID de la plantilla
     * @return Set de nombres de variables
     */
    public Set<String> detectTemplateVariables(Long plantillaId) throws Exception {
        log.info("Detectando variables de plantilla ID: {}", plantillaId);

        // Obtener plantilla
        PlantillaReadModel plantilla = plantillaRepository.findById(plantillaId)
            .orElseThrow(() -> new IllegalArgumentException("Plantilla no encontrada: " + plantillaId));

        // Verificar que sea plantilla HTML
        if (!"HTML".equalsIgnoreCase(plantilla.getTipoDocumento())) {
            throw new IllegalArgumentException("La plantilla debe ser de tipo HTML");
        }

        // Leer contenido de la plantilla
        String htmlTemplate = readTemplateContent(plantilla.getRutaArchivo());

        // Detectar variables
        Set<String> variables = htmlToPdfConverter.detectVariables(htmlTemplate);

        // Guardar variables en la base de datos
        try {
            plantilla.setVariables(objectMapper.writeValueAsString(variables));
            plantillaRepository.save(plantilla);
            log.info("Variables guardadas en base de datos para plantilla {}", plantillaId);
        } catch (Exception e) {
            log.warn("No se pudieron guardar las variables: {}", e.getMessage());
        }

        return variables;
    }

    /**
     * Obtiene las variables almacenadas de una plantilla
     *
     * @param plantillaId ID de la plantilla
     * @return Set de nombres de variables
     */
    public Set<String> getStoredVariables(Long plantillaId) throws Exception {
        PlantillaReadModel plantilla = plantillaRepository.findById(plantillaId)
            .orElseThrow(() -> new IllegalArgumentException("Plantilla no encontrada: " + plantillaId));

        if (plantilla.getVariables() == null || plantilla.getVariables().isEmpty()) {
            // Si no hay variables almacenadas, detectarlas
            return detectTemplateVariables(plantillaId);
        }

        try {
            return objectMapper.readValue(plantilla.getVariables(), new TypeReference<Set<String>>() {});
        } catch (Exception e) {
            log.error("Error leyendo variables almacenadas: {}", e.getMessage());
            // Si hay error, detectar nuevamente
            return detectTemplateVariables(plantillaId);
        }
    }

    /**
     * Genera un preview HTML de la plantilla sin datos
     *
     * @param plantillaId ID de la plantilla
     * @return HTML con variables resaltadas
     */
    public String generatePreviewHtml(Long plantillaId) throws Exception {
        log.info("Generando preview HTML para plantilla ID: {}", plantillaId);

        // Obtener plantilla
        PlantillaReadModel plantilla = plantillaRepository.findById(plantillaId)
            .orElseThrow(() -> new IllegalArgumentException("Plantilla no encontrada: " + plantillaId));

        // Verificar que sea plantilla HTML
        if (!"HTML".equalsIgnoreCase(plantilla.getTipoDocumento())) {
            throw new IllegalArgumentException("La plantilla debe ser de tipo HTML");
        }

        // Leer contenido de la plantilla
        String htmlTemplate = readTemplateContent(plantilla.getRutaArchivo());

        // Generar preview
        return htmlToPdfConverter.generatePreviewHtml(htmlTemplate);
    }

    /**
     * Valida una plantilla HTML
     *
     * @param htmlContent Contenido HTML
     * @return true si es válida
     */
    public boolean validateTemplate(String htmlContent) {
        return htmlToPdfConverter.validateTemplate(htmlContent);
    }

    /**
     * Lee el contenido de una plantilla desde el sistema de archivos
     *
     * @param rutaArchivo Ruta del archivo
     * @return Contenido del archivo
     */
    private String readTemplateContent(String rutaArchivo) throws IOException {
        Path filePath = Paths.get(storagePath).resolve(rutaArchivo);

        if (!Files.exists(filePath)) {
            throw new IOException("Archivo de plantilla no encontrado: " + rutaArchivo);
        }

        return Files.readString(filePath);
    }
}
