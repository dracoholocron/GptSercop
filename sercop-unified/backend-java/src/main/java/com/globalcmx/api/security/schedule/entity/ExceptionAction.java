package com.globalcmx.api.security.schedule.entity;

/**
 * Acción que toma una excepción de horario.
 */
public enum ExceptionAction {
    /**
     * Permite acceso fuera del horario normal
     */
    ALLOW,

    /**
     * Bloquea acceso en horario que normalmente estaría permitido
     */
    DENY,

    /**
     * Modifica el horario para ese día específico
     */
    MODIFY
}
