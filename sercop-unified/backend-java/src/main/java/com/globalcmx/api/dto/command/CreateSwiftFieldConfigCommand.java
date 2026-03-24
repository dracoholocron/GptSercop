package com.globalcmx.api.dto.command;

import com.globalcmx.api.readmodel.enums.FieldType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Comando para crear una nueva configuración de campo SWIFT
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateSwiftFieldConfigCommand {

    @NotBlank(message = "El código del campo es obligatorio")
    private String fieldCode;

    @NotBlank(message = "La clave de traducción del nombre es obligatoria")
    private String fieldNameKey;      // Translation key (e.g., "swift.mt700.20.fieldName")

    private String descriptionKey;    // Translation key

    @NotBlank(message = "El tipo de mensaje es obligatorio")
    private String messageType;

    @NotBlank(message = "La sección es obligatoria")
    private String section;

    @NotNull(message = "El orden de visualización es obligatorio")
    private Integer displayOrder;

    @NotNull(message = "Debe especificar si el campo es obligatorio")
    @Builder.Default
    private Boolean isRequired = false;

    @NotNull(message = "El tipo de campo es obligatorio")
    private FieldType fieldType;

    @NotBlank(message = "El tipo de componente es obligatorio")
    private String componentType;

    private String placeholderKey;    // Translation key

    /**
     * Reglas de validación en formato JSON
     */
    private String validationRules;

    /**
     * Dependencias con otros campos en formato JSON
     */
    private String dependencies;

    /**
     * Alertas contextuales en formato JSON
     */
    private String contextualAlerts;

    /**
     * Opciones para campos SELECT en formato JSON
     */
    private String fieldOptions;

    private String defaultValue;
    private String helpTextKey;       // Translation key
    private String draftFieldMapping;
    private String documentationUrl;

    /**
     * Usuario que crea la configuración
     */
    private String createdBy;
}
