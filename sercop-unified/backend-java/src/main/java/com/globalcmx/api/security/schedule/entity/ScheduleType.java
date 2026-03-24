package com.globalcmx.api.security.schedule.entity;

/**
 * Tipo de modificación del horario respecto al nivel superior.
 */
public enum ScheduleType {
    /**
     * Amplía el horario base (permite acceso en horarios adicionales)
     */
    EXTEND,

    /**
     * Restringe dentro del horario base (limita el acceso)
     */
    RESTRICT,

    /**
     * Reemplaza completamente el horario base
     */
    REPLACE
}
