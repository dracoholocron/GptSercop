package com.globalcmx.api.validation;

/**
 * Excepción para errores de validación de negocio
 */
public class BusinessValidationException extends RuntimeException {
    private final ValidationResult validationResult;

    public BusinessValidationException(ValidationResult validationResult) {
        super(validationResult.getErrorMessage());
        this.validationResult = validationResult;
    }

    public ValidationResult getValidationResult() {
        return validationResult;
    }
}
