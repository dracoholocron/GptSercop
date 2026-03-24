package com.globalcmx.api.videoconference.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for OAuth callback data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OAuthCallbackRequest {

    /**
     * Authorization code from OAuth provider
     */
    private String code;

    /**
     * State parameter for CSRF protection
     */
    private String state;

    /**
     * Error code if authorization failed
     */
    private String error;

    /**
     * Error description if authorization failed
     */
    private String errorDescription;
}
