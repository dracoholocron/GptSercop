package com.globalcmx.api.security.sso;

import lombok.Getter;

/**
 * Enum representing supported Identity Providers for SSO.
 */
@Getter
public enum IdentityProvider {
    LOCAL("LOCAL", "Local Authentication", "key"),
    AUTH0("AUTH0", "Auth0", "shield"),
    AZURE_AD("AZURE_AD", "Microsoft Azure AD", "microsoft"),
    GOOGLE("GOOGLE", "Google Cloud Identity", "google"),
    COGNITO("COGNITO", "AWS Cognito", "aws"),
    OKTA("OKTA", "Okta", "okta");

    private final String code;
    private final String displayName;
    private final String icon;

    IdentityProvider(String code, String displayName, String icon) {
        this.code = code;
        this.displayName = displayName;
        this.icon = icon;
    }

    /**
     * Get provider from code string.
     */
    public static IdentityProvider fromCode(String code) {
        if (code == null) return LOCAL;
        for (IdentityProvider provider : values()) {
            if (provider.code.equalsIgnoreCase(code)) {
                return provider;
            }
        }
        return LOCAL;
    }

    /**
     * Check if this is an SSO provider (not local).
     */
    public boolean isSso() {
        return this != LOCAL;
    }
}
