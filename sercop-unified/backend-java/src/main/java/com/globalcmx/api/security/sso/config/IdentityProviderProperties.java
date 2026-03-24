package com.globalcmx.api.security.sso.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

/**
 * Configuration properties for Identity Provider settings.
 * All values are externalized via environment variables.
 */
@Data
@Component
@ConfigurationProperties(prefix = "auth")
@Validated
public class IdentityProviderProperties {

    /**
     * Base URL for API Gateway (Kong).
     * In development: if empty, will be auto-detected from request
     * In production: set via API_BASE_URL environment variable
     */
    private String apiBaseUrl;

    /**
     * Default identity provider: LOCAL, AUTH0, AZURE_AD, GOOGLE, COGNITO, OKTA
     */
    private String defaultProvider = "LOCAL";

    /**
     * Enable Just-In-Time user provisioning for SSO users.
     */
    private boolean jitProvisioningEnabled = true;

    /**
     * Default role for JIT provisioned users.
     */
    private String jitDefaultRole = "ROLE_USER";

    /**
     * Enable local authentication (username/password).
     */
    private boolean localAuthEnabled = true;

    /**
     * Group sync mode: ADDITIVE, REPLACE, MERGE
     */
    private String groupSyncMode = "MERGE";

    /**
     * Builds callback URL dynamically based on apiBaseUrl or request context.
     */
    public String buildCallbackUrl(String baseUrl, String provider) {
        String effectiveBase = (apiBaseUrl != null && !apiBaseUrl.isEmpty()) ? apiBaseUrl : baseUrl;
        return effectiveBase + "/api/auth/callback/" + provider;
    }

    /**
     * Auth0 configuration.
     */
    private Auth0Properties auth0 = new Auth0Properties();

    /**
     * Azure AD / Entra ID configuration.
     */
    private AzureAdProperties azureAd = new AzureAdProperties();

    /**
     * Google Cloud Identity configuration.
     */
    private GoogleProperties google = new GoogleProperties();

    /**
     * AWS Cognito configuration.
     */
    private CognitoProperties cognito = new CognitoProperties();

    /**
     * Okta configuration.
     */
    private OktaProperties okta = new OktaProperties();

    @Data
    public static class Auth0Properties {
        private boolean enabled = false;
        private String domain;
        private String clientId;
        private String clientSecret;
        private String audience;
        private String callbackUrl; // Optional: override for dynamic callback URL
    }

    @Data
    public static class AzureAdProperties {
        private boolean enabled = false;
        private String tenantId;
        private String clientId;
        private String clientSecret;
        private String callbackUrl; // Optional: override for dynamic callback URL
    }

    @Data
    public static class GoogleProperties {
        private boolean enabled = false;
        private String clientId;
        private String clientSecret;
        private String hostedDomain; // Optional: restrict to specific domain
        private String callbackUrl; // Optional: override for dynamic callback URL
    }

    @Data
    public static class CognitoProperties {
        private boolean enabled = false;
        private String userPoolId;
        private String clientId;
        private String clientSecret;
        private String region = "us-east-1";
        private String domain;
        private String callbackUrl; // Optional: override for dynamic callback URL
    }

    @Data
    public static class OktaProperties {
        private boolean enabled = false;
        /**
         * Okta domain (e.g., "dev-123456.okta.com" or "mycompany.okta.com")
         */
        private String domain;
        private String clientId;
        private String clientSecret;
        /**
         * Optional: Authorization server ID. Use "default" for the default server
         * or a custom server ID for custom authorization servers.
         */
        private String authorizationServerId = "default";
        private String callbackUrl; // Optional: override for dynamic callback URL
    }
}
