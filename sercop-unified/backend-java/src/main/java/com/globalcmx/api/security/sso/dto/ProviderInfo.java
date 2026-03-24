package com.globalcmx.api.security.sso.dto;

import com.globalcmx.api.security.sso.IdentityProvider;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing information about an enabled identity provider.
 * Used by frontend to display available SSO options.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderInfo {

    /**
     * Provider identifier.
     */
    private String id;

    /**
     * Display name for the provider.
     */
    private String name;

    /**
     * Icon identifier for UI.
     */
    private String icon;

    /**
     * Authorization URL to initiate SSO flow.
     */
    private String authorizationUrl;

    /**
     * Whether this is the default provider.
     */
    private boolean isDefault;

    /**
     * Create from IdentityProvider enum.
     */
    public static ProviderInfo from(IdentityProvider provider, String authUrl, boolean isDefault) {
        return ProviderInfo.builder()
                .id(provider.getCode())
                .name(provider.getDisplayName())
                .icon(provider.getIcon())
                .authorizationUrl(authUrl)
                .isDefault(isDefault)
                .build();
    }
}
