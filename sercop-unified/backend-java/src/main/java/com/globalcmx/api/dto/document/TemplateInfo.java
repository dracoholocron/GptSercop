package com.globalcmx.api.dto.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO para información de plantillas disponibles
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TemplateInfo {

    /**
     * Nombre de la plantilla
     */
    private String name;

    /**
     * Descripción de la plantilla
     */
    private String description;

    /**
     * Categoría de la plantilla
     * Ejemplo: "CREDITOS", "CARTAS", "CONTRATOS", "REPORTES"
     */
    private String category;

    /**
     * Variables que acepta la plantilla
     */
    private List<String> variables;

    /**
     * Indica si la plantilla está disponible
     */
    private boolean available;

    /**
     * Ruta del archivo de plantilla
     */
    private String templatePath;

    /**
     * Formatos de salida soportados
     */
    private List<OutputFormat> supportedFormats;
}
