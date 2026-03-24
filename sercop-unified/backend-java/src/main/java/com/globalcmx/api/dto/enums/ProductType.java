package com.globalcmx.api.dto.enums;

/**
 * Enum for product types supported by the SWIFT draft system.
 *
 * All values are in English for consistency across the system.
 */
public enum ProductType {

    /**
     * Letter of Credit - Import (MT700)
     */
    LC_IMPORT("LC_IMPORT", "Letter of Credit - Import"),

    /**
     * Letter of Credit - Export (MT710, MT720)
     */
    LC_EXPORT("LC_EXPORT", "Letter of Credit - Export"),

    /**
     * Bank Guarantee - Generic (MT760)
     * @deprecated Use GUARANTEE_ISSUED or GUARANTEE_RECEIVED for new operations
     */
    GUARANTEE("GUARANTEE", "Bank Guarantee"),

    /**
     * Bank Guarantee - Issued (MT760)
     * Ecuador: Cuenta 630290/640290
     * References: B* (BE, B1, B2, B3, B4)
     */
    GUARANTEE_ISSUED("GUARANTEE_ISSUED", "Garantía Emitida"),

    /**
     * Bank Guarantee - Received (MT760)
     * Ecuador: Cuenta 630290/640290
     * References: J* (JE, J1, J2, J3, J4)
     */
    GUARANTEE_RECEIVED("GUARANTEE_RECEIVED", "Garantía Recibida"),

    /**
     * Aval / Endorsement (MT760)
     * Ecuador: Cuenta 630105/640105
     * References: K*, CE*
     */
    AVAL("AVAL", "Aval"),

    /**
     * Standby Letter of Credit (MT760)
     */
    STANDBY_LC("STANDBY_LC", "Standby Letter of Credit"),

    /**
     * Free format message (MT799)
     */
    FREE_MESSAGE("FREE_MESSAGE", "Free Format Message"),

    /**
     * Transferable LC (MT720)
     */
    TRANSFERABLE_LC("TRANSFERABLE_LC", "Transferable Letter of Credit"),

    /**
     * Back-to-Back LC
     */
    BACK_TO_BACK_LC("BACK_TO_BACK_LC", "Back-to-Back Letter of Credit"),

    /**
     * LC Amendment (MT707)
     */
    LC_AMENDMENT("LC_AMENDMENT", "Letter of Credit Amendment"),

    /**
     * Collection (MT400, MT410)
     */
    COLLECTION("COLLECTION", "Documentary Collection");

    private final String code;
    private final String description;

    ProductType(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    /**
     * Get ProductType from code string.
     *
     * @param code The code to look up
     * @return The matching ProductType or null if not found
     */
    public static ProductType fromCode(String code) {
        if (code == null) return null;
        for (ProductType type : values()) {
            if (type.code.equalsIgnoreCase(code)) {
                return type;
            }
        }
        return null;
    }
}
