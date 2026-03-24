package com.globalcmx.api.dto.plantilla;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

/**
 * DTO para la respuesta de variables detectadas en una plantilla
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TemplateVariablesResponse {

    /**
     * Set de nombres de variables detectadas en la plantilla
     */
    private Set<String> variables;

    /**
     * Indica si la plantilla es válida
     */
    private boolean valid;

    /**
     * Mensaje de error si la plantilla es inválida
     */
    private String errorMessage;
}
