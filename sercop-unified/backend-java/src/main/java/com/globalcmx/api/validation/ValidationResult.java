package com.globalcmx.api.validation;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Resultado de validaciones de Drools
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ValidationResult {
    private boolean valid = true;
    private List<String> errors = new ArrayList<>();

    public void addError(String error) {
        this.valid = false;
        this.errors.add(error);
    }

    public boolean hasErrors() {
        return !valid;
    }

    public String getErrorMessage() {
        if (errors.isEmpty()) {
            return "";
        }
        return "Errores de validación de negocio:\n  • " + String.join("\n  • ", errors);
    }
}
