package com.globalcmx.api.security.mfa.entity;

import lombok.Getter;

/**
 * Supported MFA methods.
 */
@Getter
public enum MfaMethod {
    TOTP("totp", "Authenticator App", "Genera códigos temporales usando Google Authenticator, Authy, etc.", true),
    SMS("sms", "SMS", "Recibe códigos por mensaje de texto", true),
    EMAIL("email", "Email", "Recibe códigos por correo electrónico", true),
    WEBAUTHN("webauthn", "Biométrico/Llave de Seguridad", "Usa huella digital, Face ID o llaves FIDO2", false),
    PUSH("push", "Notificación Push", "Aprueba desde la app móvil", false);

    private final String code;
    private final String displayName;
    private final String description;
    private final boolean supportsIdpSync;

    MfaMethod(String code, String displayName, String description, boolean supportsIdpSync) {
        this.code = code;
        this.displayName = displayName;
        this.description = description;
        this.supportsIdpSync = supportsIdpSync;
    }

    public static MfaMethod fromCode(String code) {
        if (code == null) return null;
        for (MfaMethod method : values()) {
            if (method.code.equalsIgnoreCase(code)) {
                return method;
            }
        }
        return null;
    }
}
