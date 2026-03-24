package com.globalcmx.api.security.schedule.entity;

/**
 * Nivel al que aplica una excepción de horario.
 */
public enum ExceptionType {
    /**
     * Excepción que aplica a todo el sistema
     */
    GLOBAL,

    /**
     * Excepción que aplica a un rol específico
     */
    ROLE,

    /**
     * Excepción que aplica a un usuario específico
     */
    USER
}
