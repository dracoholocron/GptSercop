package com.globalcmx.api.dto.document;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * DTO para solicitud de generación de documentos
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentGenerationRequest {

    /**
     * Nombre de la plantilla ODT (sin extensión)
     * Ejemplo: "contrato_credito", "carta_credito", "factura"
     */
    @NotBlank(message = "El nombre de la plantilla es obligatorio")
    private String templateName;

    /**
     * Datos para reemplazar en la plantilla
     * Las claves deben coincidir con las variables en la plantilla ODT
     * Ejemplo: {"cliente": "Juan Pérez", "monto": "10000", "fecha": "2025-10-23"}
     */
    @NotNull(message = "Los datos del documento son obligatorios")
    private Map<String, String> data;

    /**
     * Nombre del archivo de salida (sin extensión)
     * Si no se proporciona, se usa el nombre de la plantilla + timestamp
     */
    private String outputFileName;

    /**
     * Formato de salida: PDF o ODT
     * Por defecto: PDF
     */
    @Builder.Default
    private OutputFormat outputFormat = OutputFormat.PDF;

    /**
     * Idioma del documento
     */
    @Builder.Default
    private String language = "es";
}
