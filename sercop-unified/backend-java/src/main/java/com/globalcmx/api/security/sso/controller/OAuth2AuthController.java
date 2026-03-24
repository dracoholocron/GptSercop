package com.globalcmx.api.security.sso.controller;

import com.globalcmx.api.dto.ApiResponse;
import com.globalcmx.api.security.audit.SecurityAuditService;
import com.globalcmx.api.security.sso.IdentityProvider;
import com.globalcmx.api.security.sso.config.IdentityProviderProperties;
import com.globalcmx.api.security.sso.dto.ProviderInfo;
import com.globalcmx.api.security.entity.UserApprovalStatus;
import com.globalcmx.api.security.sso.service.IdentityProviderService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller for OAuth2/SSO authentication endpoints.
 *
 * Endpoints:
 * - GET /auth/providers - Get enabled identity providers
 * - GET /auth/oauth2/{provider} - Initiate OAuth2 flow
 * - GET /auth/callback/{provider} - OAuth2 callback handler
 * - POST /auth/callback/{provider} - OAuth2 callback handler (POST)
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class OAuth2AuthController {

    private final IdentityProviderService identityProviderService;
    private final IdentityProviderProperties properties;
    private final SecurityAuditService auditService;
    private final RestTemplate restTemplate = new RestTemplate();

    @org.springframework.beans.factory.annotation.Value("${security.frontend-callback-url:http://localhost:5173}")
    private String frontendCallbackUrl;

    /**
     * Get list of enabled identity providers.
     * Dynamically generates callback URLs based on the request origin.
     */
    @GetMapping("/providers")
    public ResponseEntity<ApiResponse<List<ProviderInfo>>> getEnabledProviders(HttpServletRequest request) {
        log.debug("Request to get enabled identity providers");
        String baseUrl = getBaseUrl(request);
        List<ProviderInfo> providers = identityProviderService.getEnabledProviders(baseUrl);
        return ResponseEntity.ok(ApiResponse.success("Identity providers retrieved", providers));
    }

    /**
     * Extracts the base URL from the request, considering proxy headers (Kong).
     * Priority: X-Forwarded-* headers > Origin header > Request URL
     */
    private String getBaseUrl(HttpServletRequest request) {
        // First check if apiBaseUrl is configured
        String configuredUrl = properties.getApiBaseUrl();
        if (configuredUrl != null && !configuredUrl.isEmpty()) {
            return configuredUrl;
        }

        // Check X-Forwarded headers (set by Kong/reverse proxy)
        String forwardedProto = request.getHeader("X-Forwarded-Proto");
        String forwardedHost = request.getHeader("X-Forwarded-Host");
        String forwardedPort = request.getHeader("X-Forwarded-Port");

        if (forwardedHost != null) {
            String proto = forwardedProto != null ? forwardedProto : "http";
            String port = "";
            if (forwardedPort != null && !forwardedPort.equals("80") && !forwardedPort.equals("443")) {
                port = ":" + forwardedPort;
            }
            return proto + "://" + forwardedHost + port;
        }

        // Check Origin header
        String origin = request.getHeader("Origin");
        if (origin != null && !origin.isEmpty()) {
            return origin;
        }

        // Fallback to request URL
        String scheme = request.getScheme();
        String serverName = request.getServerName();
        int serverPort = request.getServerPort();

        if ((scheme.equals("http") && serverPort == 80) ||
            (scheme.equals("https") && serverPort == 443)) {
            return scheme + "://" + serverName;
        }
        return scheme + "://" + serverName + ":" + serverPort;
    }

    /**
     * Initiate OAuth2 flow - returns redirect URL.
     */
    @GetMapping("/oauth2/{provider}")
    public ResponseEntity<ApiResponse<OAuth2InitResponse>> initiateOAuth2(
            HttpServletRequest request,
            @PathVariable String provider,
            @RequestParam(required = false) String returnUrl) {

        log.info("Initiating OAuth2 flow for provider: {}", provider);

        IdentityProvider idp = IdentityProvider.fromCode(provider.toUpperCase());

        if (!identityProviderService.isProviderEnabled(idp)) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Provider not enabled: " + provider));
        }

        String baseUrl = getBaseUrl(request);
        List<ProviderInfo> providers = identityProviderService.getEnabledProviders(baseUrl);
        String authUrl = providers.stream()
                .filter(p -> p.getId().equalsIgnoreCase(provider))
                .map(ProviderInfo::getAuthorizationUrl)
                .findFirst()
                .orElse(null);

        if (authUrl == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Authorization URL not configured for: " + provider));
        }

        // Add state parameter for security
        String state = generateState(returnUrl);
        authUrl += "&state=" + state;

        auditService.logSsoLoginInitiated(null, provider);

        return ResponseEntity.ok(ApiResponse.success("OAuth2 initiated",
                new OAuth2InitResponse(authUrl, state)
        ));
    }

    /**
     * Handle OAuth2 callback.
     */
    @GetMapping("/callback/{provider}")
    public ResponseEntity<?> handleCallback(
            HttpServletRequest request,
            @PathVariable String provider,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error,
            @RequestParam(required = false) String error_description) {

        log.info("Received OAuth2 callback for provider: {}", provider);

        // Check for OAuth2 error
        if (error != null) {
            log.error("OAuth2 error: {} - {}", error, error_description);
            auditService.logSsoLoginFailure(null, provider, error + ": " + error_description);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("OAuth2 error: " + error_description));
        }

        if (code == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Authorization code not provided"));
        }

        IdentityProvider idp = IdentityProvider.fromCode(provider.toUpperCase());
        String baseUrl = getBaseUrl(request);

        try {
            // Exchange code for tokens using dynamic callback URL
            Map<String, Object> tokenResponse = exchangeCodeForTokens(idp, code, baseUrl);
            if (tokenResponse == null || tokenResponse.containsKey("error")) {
                String tokenError = tokenResponse != null ?
                        (String) tokenResponse.get("error_description") : "Token exchange failed";
                auditService.logSsoLoginFailure(null, provider, tokenError);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error(tokenError));
            }

            // Get user info from tokens
            Map<String, Object> claims = extractClaims(idp, tokenResponse);

            // Process authentication
            IdentityProviderService.AuthResult result =
                    identityProviderService.handleOAuth2Callback(idp, claims);

            if (!result.success()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error(result.error()));
            }

            // Redirect to frontend with token
            String frontendUrl = frontendCallbackUrl;
            String redirectUrl = String.format(
                    "%s/auth/callback?token=%s&username=%s&name=%s&provider=%s&newUser=%s&approvalStatus=%s",
                    frontendUrl,
                    result.token(),
                    result.user().getUsername(),
                    java.net.URLEncoder.encode(result.user().getName() != null ? result.user().getName() : "", java.nio.charset.StandardCharsets.UTF_8),
                    idp.getCode(),
                    result.newUser(),
                    result.user().getApprovalStatus().name()
            );

            return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", redirectUrl)
                    .build();

        } catch (Exception e) {
            log.error("OAuth2 callback processing failed", e);
            auditService.logSsoLoginFailure(null, provider, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Authentication processing failed"));
        }
    }

    /**
     * Exchange authorization code for tokens.
     * @param provider The identity provider
     * @param code The authorization code
     * @param baseUrl The base URL for constructing the callback URL (auto-detected if null)
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> exchangeCodeForTokens(IdentityProvider provider, String code, String baseUrl) {
        String tokenUrl;
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();

        switch (provider) {
            case AUTH0 -> {
                tokenUrl = "https://" + properties.getAuth0().getDomain() + "/oauth/token";
                params.add("grant_type", "authorization_code");
                params.add("client_id", properties.getAuth0().getClientId());
                params.add("client_secret", properties.getAuth0().getClientSecret());
                params.add("code", code);
                params.add("redirect_uri", properties.buildCallbackUrl(baseUrl, "auth0"));
            }
            case AZURE_AD -> {
                tokenUrl = "https://login.microsoftonline.com/" +
                        properties.getAzureAd().getTenantId() + "/oauth2/v2.0/token";
                params.add("grant_type", "authorization_code");
                params.add("client_id", properties.getAzureAd().getClientId());
                params.add("client_secret", properties.getAzureAd().getClientSecret());
                params.add("code", code);
                params.add("redirect_uri", properties.buildCallbackUrl(baseUrl, "azure"));
                params.add("scope", "openid profile email");
            }
            case GOOGLE -> {
                tokenUrl = "https://oauth2.googleapis.com/token";
                params.add("grant_type", "authorization_code");
                params.add("client_id", properties.getGoogle().getClientId());
                params.add("client_secret", properties.getGoogle().getClientSecret());
                params.add("code", code);
                params.add("redirect_uri", properties.buildCallbackUrl(baseUrl, "google"));
            }
            case COGNITO -> {
                tokenUrl = "https://" + properties.getCognito().getDomain() +
                        ".auth." + properties.getCognito().getRegion() +
                        ".amazoncognito.com/oauth2/token";
                params.add("grant_type", "authorization_code");
                params.add("client_id", properties.getCognito().getClientId());
                params.add("client_secret", properties.getCognito().getClientSecret());
                params.add("code", code);
                params.add("redirect_uri", properties.buildCallbackUrl(baseUrl, "cognito"));
            }
            case OKTA -> {
                String authServerId = properties.getOkta().getAuthorizationServerId();
                tokenUrl = String.format("https://%s/oauth2/%s/v1/token",
                        properties.getOkta().getDomain(),
                        authServerId != null ? authServerId : "default");
                params.add("grant_type", "authorization_code");
                params.add("client_id", properties.getOkta().getClientId());
                params.add("client_secret", properties.getOkta().getClientSecret());
                params.add("code", code);
                params.add("redirect_uri", properties.buildCallbackUrl(baseUrl, "okta"));
                params.add("scope", "openid profile email groups");
            }
            default -> throw new IllegalArgumentException("Unsupported provider: " + provider);
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            HttpEntity<MultiValueMap<String, String>> httpRequest = new HttpEntity<>(params, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, httpRequest, Map.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("Token exchange failed for provider: {}", provider, e);
            return null;
        }
    }

    /**
     * Extract user claims from token response.
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> extractClaims(IdentityProvider provider, Map<String, Object> tokenResponse) {
        String idToken = (String) tokenResponse.get("id_token");
        String accessToken = (String) tokenResponse.get("access_token");

        // Decode ID token (simple base64 decode of payload)
        if (idToken != null) {
            try {
                String[] parts = idToken.split("\\.");
                if (parts.length >= 2) {
                    String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
                    return new com.fasterxml.jackson.databind.ObjectMapper()
                            .readValue(payload, Map.class);
                }
            } catch (Exception e) {
                log.warn("Failed to decode ID token, falling back to userinfo endpoint", e);
            }
        }

        // Fallback: call userinfo endpoint
        String userInfoUrl = switch (provider) {
            case AUTH0 -> "https://" + properties.getAuth0().getDomain() + "/userinfo";
            case AZURE_AD -> "https://graph.microsoft.com/oidc/userinfo";
            case GOOGLE -> "https://openidconnect.googleapis.com/v1/userinfo";
            case COGNITO -> "https://" + properties.getCognito().getDomain() +
                    ".auth." + properties.getCognito().getRegion() +
                    ".amazoncognito.com/oauth2/userInfo";
            case OKTA -> {
                String authServerId = properties.getOkta().getAuthorizationServerId();
                yield String.format("https://%s/oauth2/%s/v1/userinfo",
                        properties.getOkta().getDomain(),
                        authServerId != null ? authServerId : "default");
            }
            default -> null;
        };

        if (userInfoUrl != null && accessToken != null) {
            try {
                org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                headers.setBearerAuth(accessToken);
                org.springframework.http.HttpEntity<Void> entity = new org.springframework.http.HttpEntity<>(headers);
                return restTemplate.exchange(userInfoUrl,
                        org.springframework.http.HttpMethod.GET,
                        entity, Map.class).getBody();
            } catch (Exception e) {
                log.error("Failed to fetch userinfo", e);
            }
        }

        return new HashMap<>();
    }

    /**
     * Generate state parameter for CSRF protection.
     */
    private String generateState(String returnUrl) {
        String random = java.util.UUID.randomUUID().toString().substring(0, 8);
        if (returnUrl != null) {
            return random + ":" + java.util.Base64.getUrlEncoder()
                    .encodeToString(returnUrl.getBytes());
        }
        return random;
    }

    // DTOs

    public record OAuth2InitResponse(
            String authorizationUrl,
            String state
    ) {}

    public record AuthResponse(
            String token,
            String username,
            String name,
            String avatarUrl,
            boolean newUser,
            String provider
    ) {}
}
