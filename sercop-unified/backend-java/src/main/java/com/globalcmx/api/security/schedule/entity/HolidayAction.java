package com.globalcmx.api.security.schedule.entity;

/**
 * Acción del sistema durante un día festivo.
 */
public enum HolidayAction {
    /**
     * Sistema completamente cerrado
     */
    CLOSED,

    /**
     * Horario reducido (usar start_time y end_time)
     */
    REDUCED_HOURS,

    /**
     * Operación normal (el día festivo es solo informativo)
     */
    NORMAL
}
