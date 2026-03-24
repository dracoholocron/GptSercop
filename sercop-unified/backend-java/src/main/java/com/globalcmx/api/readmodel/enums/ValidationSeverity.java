package com.globalcmx.api.readmodel.enums;

/**
 * Severidad de validación para errores de campos SWIFT
 */
public enum ValidationSeverity {
    /**
     * Error crítico - Bloquea el envío del formulario
     */
    ERROR,

    /**
     * Advertencia - Muestra mensaje pero permite continuar
     */
    WARNING,

    /**
     * Información - Solo informativo, no afecta el envío
     */
    INFO
}
