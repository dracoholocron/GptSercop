package com.globalcmx.api.videoconference.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing the status of a video conference provider.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderStatus {

    /**
     * Provider code (googlemeet, teams, jitsi)
     */
    private String providerCode;

    /**
     * Display name for the provider
     */
    private String displayName;

    /**
     * Whether the provider is enabled in configuration
     */
    private boolean enabled;

    /**
     * Whether the provider is properly configured
     */
    private boolean configured;

    /**
     * Whether the provider requires OAuth authorization
     */
    private boolean requiresOAuth;

    /**
     * Whether the current user is connected/authorized
     */
    private boolean connected;

    /**
     * OAuth authorization URL (if not connected and requires OAuth)
     */
    private String authorizationUrl;

    /**
     * Server URL (for Jitsi)
     */
    private String serverUrl;

    /**
     * Additional status message
     */
    private String message;
}
