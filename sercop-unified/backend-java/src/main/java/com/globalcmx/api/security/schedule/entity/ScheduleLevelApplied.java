package com.globalcmx.api.security.schedule.entity;

/**
 * Nivel de horario que fue aplicado en una evaluación de acceso.
 */
public enum ScheduleLevelApplied {
    /**
     * Se aplicó el horario global
     */
    GLOBAL,

    /**
     * Se aplicó un horario de rol
     */
    ROLE,

    /**
     * Se aplicó un horario de usuario
     */
    USER,

    /**
     * Se aplicó una excepción temporal
     */
    EXCEPTION,

    /**
     * Se aplicó un día festivo
     */
    HOLIDAY,

    /**
     * Se aplicó una exención permanente (usuario o rol exento)
     */
    EXEMPT
}
