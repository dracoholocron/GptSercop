package com.globalcmx.api.externalapi.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.drools.RuleContext;
import com.globalcmx.api.externalapi.entity.ExternalApiAuthConfig;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthenticationHandler {

    private final EncryptionService encryptionService;
    private final TemplateProcessor templateProcessor;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private final Map<String, TokenCache> tokenCache = new ConcurrentHashMap<>();

    public void applyAuthentication(HttpHeaders headers, ExternalApiAuthConfig authConfig, RuleContext context) {
        if (authConfig == null || authConfig.getAuthType() == ExternalApiAuthConfig.AuthType.NONE) {
            return;
        }

        switch (authConfig.getAuthType()) {
            case API_KEY -> applyApiKey(headers, authConfig);
            case BASIC_AUTH -> applyBasicAuth(headers, authConfig);
            case BEARER_TOKEN -> applyBearerToken(headers, authConfig);
            case OAUTH2_CLIENT_CREDENTIALS -> applyOAuth2ClientCredentials(headers, authConfig);
            case JWT -> applyJwt(headers, authConfig, context);
            case CUSTOM_HEADER -> applyCustomHeaders(headers, authConfig);
            default -> log.warn("Unsupported auth type: {}", authConfig.getAuthType());
        }
    }

    private void applyApiKey(HttpHeaders headers, ExternalApiAuthConfig authConfig) {
        String apiKey = encryptionService.decrypt(authConfig.getApiKeyValueEncrypted());
        if (authConfig.getApiKeyLocation() == ExternalApiAuthConfig.ApiKeyLocation.HEADER) {
            headers.add(authConfig.getApiKeyName(), apiKey);
        }
    }

    private void applyBasicAuth(HttpHeaders headers, ExternalApiAuthConfig authConfig) {
        String password = encryptionService.decrypt(authConfig.getPasswordEncrypted());
        String credentials = authConfig.getUsername() + ":" + password;
        String encodedCredentials = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
        headers.add(HttpHeaders.AUTHORIZATION, "Basic " + encodedCredentials);
    }

    private void applyBearerToken(HttpHeaders headers, ExternalApiAuthConfig authConfig) {
        String token = encryptionService.decrypt(authConfig.getStaticTokenEncrypted());
        headers.setBearerAuth(token);
    }

    private void applyOAuth2ClientCredentials(HttpHeaders headers, ExternalApiAuthConfig authConfig) {
        String cacheKey = authConfig.getOauth2TokenUrl() + ":" + authConfig.getOauth2ClientId();
        TokenCache cached = tokenCache.get(cacheKey);

        if (cached != null && !cached.isExpired()) {
            headers.setBearerAuth(cached.token);
            return;
        }

        try {
            String clientSecret = encryptionService.decrypt(authConfig.getOauth2ClientSecretEncrypted());

            HttpHeaders tokenHeaders = new HttpHeaders();
            tokenHeaders.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("grant_type", "client_credentials");
            body.add("client_id", authConfig.getOauth2ClientId());
            body.add("client_secret", clientSecret);
            if (authConfig.getOauth2Scope() != null) {
                body.add("scope", authConfig.getOauth2Scope());
            }
            if (authConfig.getOauth2Audience() != null) {
                body.add("audience", authConfig.getOauth2Audience());
            }

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, tokenHeaders);
            ResponseEntity<Map> response = restTemplate.exchange(
                authConfig.getOauth2TokenUrl(),
                HttpMethod.POST,
                request,
                Map.class
            );

            if (response.getBody() != null) {
                String accessToken = (String) response.getBody().get("access_token");
                Integer expiresIn = (Integer) response.getBody().getOrDefault("expires_in", 3600);

                tokenCache.put(cacheKey, new TokenCache(accessToken, expiresIn));
                headers.setBearerAuth(accessToken);
            }
        } catch (Exception e) {
            log.error("Error obtaining OAuth2 token", e);
            throw new RuntimeException("Failed to obtain OAuth2 token: " + e.getMessage());
        }
    }

    private void applyJwt(HttpHeaders headers, ExternalApiAuthConfig authConfig, RuleContext context) {
        String secret = encryptionService.decrypt(authConfig.getJwtSecretEncrypted());
        SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));

        Date now = new Date();
        Date expiration = new Date(now.getTime() + (authConfig.getJwtExpirationSeconds() * 1000L));

        var builder = Jwts.builder()
            .issuedAt(now)
            .expiration(expiration);

        if (authConfig.getJwtIssuer() != null) {
            builder.issuer(authConfig.getJwtIssuer());
        }
        if (authConfig.getJwtAudience() != null) {
            builder.audience().add(authConfig.getJwtAudience());
        }

        if (authConfig.getJwtClaimsTemplate() != null && context != null) {
            try {
                String processedClaims = templateProcessor.process(authConfig.getJwtClaimsTemplate(), context);
                Map<String, Object> claims = objectMapper.readValue(processedClaims, new TypeReference<>() {});
                claims.forEach(builder::claim);
            } catch (Exception e) {
                log.warn("Error processing JWT claims template", e);
            }
        }

        String token = builder.signWith(key).compact();
        headers.setBearerAuth(token);
    }

    private void applyCustomHeaders(HttpHeaders headers, ExternalApiAuthConfig authConfig) {
        if (authConfig.getCustomHeadersJson() == null) {
            return;
        }

        try {
            Map<String, String> customHeaders = objectMapper.readValue(
                authConfig.getCustomHeadersJson(),
                new TypeReference<>() {}
            );
            customHeaders.forEach(headers::add);
        } catch (Exception e) {
            log.error("Error parsing custom headers", e);
        }
    }

    public String getQueryParamApiKey(ExternalApiAuthConfig authConfig) {
        if (authConfig != null &&
            authConfig.getAuthType() == ExternalApiAuthConfig.AuthType.API_KEY &&
            authConfig.getApiKeyLocation() == ExternalApiAuthConfig.ApiKeyLocation.QUERY_PARAM) {
            return authConfig.getApiKeyName() + "=" + encryptionService.decrypt(authConfig.getApiKeyValueEncrypted());
        }
        return null;
    }

    /**
     * Applies basic authentication headers without requiring a RuleContext.
     * Use this for simpler auth types that don't need template processing.
     */
    public void applyBasicHeaders(HttpHeaders headers, ExternalApiAuthConfig authConfig) {
        if (authConfig == null || authConfig.getAuthType() == ExternalApiAuthConfig.AuthType.NONE) {
            return;
        }

        switch (authConfig.getAuthType()) {
            case API_KEY -> applyApiKey(headers, authConfig);
            case BASIC_AUTH -> applyBasicAuth(headers, authConfig);
            case BEARER_TOKEN -> applyBearerToken(headers, authConfig);
            case OAUTH2_CLIENT_CREDENTIALS -> applyOAuth2ClientCredentials(headers, authConfig);
            case CUSTOM_HEADER -> applyCustomHeaders(headers, authConfig);
            // JWT requires context, skip
            case JWT -> log.warn("JWT auth requires RuleContext, skipping");
            default -> log.warn("Unsupported auth type: {}", authConfig.getAuthType());
        }
    }

    private static class TokenCache {
        final String token;
        final long expiresAt;

        TokenCache(String token, int expiresInSeconds) {
            this.token = token;
            this.expiresAt = System.currentTimeMillis() + ((expiresInSeconds - 60) * 1000L);
        }

        boolean isExpired() {
            return System.currentTimeMillis() >= expiresAt;
        }
    }
}
