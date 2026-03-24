package com.globalcmx.api.videoconference.service;

import com.globalcmx.api.videoconference.config.VideoConferenceProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service for managing Microsoft OAuth tokens.
 * Used for Microsoft Teams integration via Microsoft Graph API.
 * In production, tokens should be stored in a database or secure vault.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MicrosoftOAuthTokenService {

    private static final String TOKEN_URL_TEMPLATE = "https://login.microsoftonline.com/%s/oauth2/v2.0/token";

    private final VideoConferenceProperties properties;
    private final RestTemplate restTemplate;

    // In-memory token storage (replace with database in production)
    private final Map<String, TokenInfo> tokenStore = new ConcurrentHashMap<>();

    /**
     * Exchange authorization code for tokens
     */
    public void exchangeCodeForTokens(String userId, String code, String redirectUri) {
        String tokenUrl = String.format(TOKEN_URL_TEMPLATE, getTenantId());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("client_id", properties.getTeams().getClientId());
        params.add("client_secret", properties.getTeams().getClientSecret());
        params.add("code", code);
        params.add("grant_type", "authorization_code");
        params.add("redirect_uri", redirectUri);
        params.add("scope", String.join(" ", properties.getTeams().getScopes()));

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    tokenUrl,
                    HttpMethod.POST,
                    new HttpEntity<>(params, headers),
                    Map.class
            );

            Map<String, Object> body = response.getBody();
            if (body != null) {
                String accessToken = (String) body.get("access_token");
                String refreshToken = (String) body.get("refresh_token");
                Integer expiresIn = (Integer) body.get("expires_in");

                TokenInfo tokenInfo = new TokenInfo(
                        accessToken,
                        refreshToken,
                        Instant.now().plusSeconds(expiresIn != null ? expiresIn : 3600)
                );

                tokenStore.put(userId, tokenInfo);
                log.info("Successfully stored Microsoft OAuth tokens for user: {}", userId);
            }

        } catch (Exception e) {
            log.error("Error exchanging code for Microsoft tokens: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to exchange authorization code: " + e.getMessage());
        }
    }

    /**
     * Get a valid access token for a user (refreshing if needed)
     */
    public String getAccessToken(String userId) {
        TokenInfo tokenInfo = tokenStore.get(userId);
        if (tokenInfo == null) {
            throw new IllegalStateException("User is not connected to Microsoft Teams. Please authorize first.");
        }

        // Check if token is expired or about to expire (within 5 minutes)
        if (tokenInfo.expiresAt.isBefore(Instant.now().plusSeconds(300))) {
            refreshToken(userId, tokenInfo);
            tokenInfo = tokenStore.get(userId);
        }

        return tokenInfo.accessToken;
    }

    /**
     * Check if user has a valid token
     */
    public boolean hasValidToken(String userId) {
        TokenInfo tokenInfo = tokenStore.get(userId);
        if (tokenInfo == null) {
            return false;
        }

        // If token is expired but we have a refresh token, try to refresh
        if (tokenInfo.expiresAt.isBefore(Instant.now())) {
            if (tokenInfo.refreshToken != null) {
                try {
                    refreshToken(userId, tokenInfo);
                    return true;
                } catch (Exception e) {
                    log.warn("Failed to refresh Microsoft token for user {}: {}", userId, e.getMessage());
                    tokenStore.remove(userId);
                    return false;
                }
            }
            return false;
        }

        return true;
    }

    /**
     * Revoke tokens for a user (disconnect)
     */
    public void revokeTokens(String userId) {
        TokenInfo tokenInfo = tokenStore.remove(userId);
        if (tokenInfo != null) {
            log.info("Removed Microsoft tokens for user: {}", userId);
            // Microsoft doesn't have a simple revoke endpoint like Google
            // Token will naturally expire
        }
    }

    /**
     * Refresh the access token using the refresh token
     */
    private void refreshToken(String userId, TokenInfo tokenInfo) {
        if (tokenInfo.refreshToken == null) {
            throw new IllegalStateException("No refresh token available. Please re-authorize.");
        }

        String tokenUrl = String.format(TOKEN_URL_TEMPLATE, getTenantId());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("client_id", properties.getTeams().getClientId());
        params.add("client_secret", properties.getTeams().getClientSecret());
        params.add("refresh_token", tokenInfo.refreshToken);
        params.add("grant_type", "refresh_token");
        params.add("scope", String.join(" ", properties.getTeams().getScopes()));

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    tokenUrl,
                    HttpMethod.POST,
                    new HttpEntity<>(params, headers),
                    Map.class
            );

            Map<String, Object> body = response.getBody();
            if (body != null) {
                String newAccessToken = (String) body.get("access_token");
                String newRefreshToken = (String) body.get("refresh_token");
                Integer expiresIn = (Integer) body.get("expires_in");

                TokenInfo newTokenInfo = new TokenInfo(
                        newAccessToken,
                        newRefreshToken != null ? newRefreshToken : tokenInfo.refreshToken,
                        Instant.now().plusSeconds(expiresIn != null ? expiresIn : 3600)
                );

                tokenStore.put(userId, newTokenInfo);
                log.debug("Successfully refreshed Microsoft access token for user: {}", userId);
            }

        } catch (Exception e) {
            log.error("Error refreshing Microsoft token: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to refresh token: " + e.getMessage());
        }
    }

    private String getTenantId() {
        String tenantId = properties.getTeams().getTenantId();
        // Use "common" for multi-tenant apps if no specific tenant is configured
        return (tenantId != null && !tenantId.isEmpty()) ? tenantId : "common";
    }

    /**
     * Internal class to store token information
     */
    private static class TokenInfo {
        final String accessToken;
        final String refreshToken;
        final Instant expiresAt;

        TokenInfo(String accessToken, String refreshToken, Instant expiresAt) {
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
            this.expiresAt = expiresAt;
        }
    }
}
