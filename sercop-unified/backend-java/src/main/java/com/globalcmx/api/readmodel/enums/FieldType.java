package com.globalcmx.api.readmodel.enums;

/**
 * Tipos de campos SWIFT configurables
 */
public enum FieldType {
    /**
     * Texto libre
     */
    TEXT,

    /**
     * Número entero
     */
    NUMBER,

    /**
     * Número decimal
     */
    DECIMAL,

    /**
     * Fecha (formato ISO)
     */
    DATE,

    /**
     * Lista desplegable (opciones predefinidas)
     */
    SELECT,

    /**
     * Selección múltiple
     */
    MULTISELECT,

    /**
     * Área de texto (texto largo)
     */
    TEXTAREA,

    /**
     * Booleano (Sí/No)
     */
    BOOLEAN,

    /**
     * Institución financiera (selector especial)
     */
    INSTITUTION,

    /**
     * País (selector especial)
     */
    COUNTRY,

    /**
     * Moneda (selector especial)
     */
    CURRENCY,

    /**
     * Participante (selector especial)
     */
    PARTICIPANT,

    /**
     * Party SWIFT (formato de 4 líneas de 35 caracteres)
     * Para campos como :50: Applicant, :59: Beneficiary
     */
    SWIFT_PARTY,

    /**
     * Selector de banco (para campos como Advising Bank, Issuing Bank)
     */
    BANK_SELECTION,

    /**
     * Campo compuesto (contiene subcampos)
     * Para campos SWIFT que tienen componentes anidados
     */
    COMPOSITE
}
