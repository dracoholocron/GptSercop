package com.globalcmx.api.security.schedule.entity;

/**
 * Resultado de la evaluación de acceso por horario.
 */
public enum AccessResult {
    /**
     * Acceso permitido
     */
    ALLOWED,

    /**
     * Acceso denegado
     */
    DENIED,

    /**
     * Acceso permitido con advertencia (ej: próximo a terminar horario)
     */
    WARNED
}
