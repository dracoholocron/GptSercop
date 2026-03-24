package com.globalcmx.api.dto.command;

import com.globalcmx.api.readmodel.enums.FieldType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Comando para actualizar una configuración de campo SWIFT existente
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateSwiftFieldConfigCommand {

    @NotNull(message = "El ID es obligatorio")
    private String id;

    private String fieldNameKey;      // Translation key
    private String descriptionKey;    // Translation key
    private String section;
    private Integer displayOrder;
    private Boolean isRequired;
    private FieldType fieldType;
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
     * Usuario que actualiza la configuración
     */
    private String updatedBy;
}
