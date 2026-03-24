package com.globalcmx.api.security.mfa.idp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.globalcmx.api.security.mfa.entity.MfaMethod;
import com.globalcmx.api.security.sso.IdentityProvider;
import com.globalcmx.api.security.sso.config.IdentityProviderProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Azure AD / Entra ID implementation for MFA synchronization.
 * Uses Microsoft Graph API for MFA configuration.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AzureAdMfaSyncService implements IdpMfaSyncService {

    private final IdentityProviderProperties properties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private String accessToken;
    private long tokenExpiry;

    @Override
    public IdentityProvider getProvider() {
        return IdentityProvider.AZURE_AD;
    }

    @Override
    public boolean isEnabled() {
        return properties.getAzureAd().isEnabled()
            && properties.getAzureAd().getTenantId() != null
            && properties.getAzureAd().getClientId() != null
            && properties.getAzureAd().getClientSecret() != null;
    }

    @Override
    public Set<MfaMethod> getSupportedMethods() {
        // Azure AD supports these through Microsoft Authenticator and conditional access
        return Set.of(MfaMethod.TOTP, MfaMethod.SMS, MfaMethod.PUSH, MfaMethod.WEBAUTHN);
    }

    @Override
    public boolean syncMfaPolicy(Set<MfaMethod> enabledMethods, String policy) {
        if (!isEnabled()) {
            log.warn("Azure AD MFA sync skipped - not enabled");
            return false;
        }

        // Azure AD MFA is typically configured via Conditional Access policies
        // This requires Azure AD Premium P1 or P2
        log.info("Azure AD MFA policy configuration requires Conditional Access policies in Azure Portal");
        log.info("Recommended: Configure Conditional Access to require MFA for GlobalCMX application");

        // Log the intended configuration for manual setup
        log.info("Intended MFA configuration - methods: {}, policy: {}", enabledMethods, policy);

        return true; // Return true as this is informational
    }

    @Override
    public boolean syncUserPhone(String externalUserId, String phoneNumber) {
        if (!isEnabled()) return false;

        try {
            String token = getGraphToken();
            String url = "https://graph.microsoft.com/v1.0/users/" + externalUserId;

            ObjectNode payload = objectMapper.createObjectNode();
            payload.put("mobilePhone", phoneNumber);

            HttpHeaders headers = createHeaders(token);
            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(payload), headers);

            restTemplate.exchange(url, HttpMethod.PATCH, entity, String.class);
            log.info("Synced phone number to Azure AD for user {}", externalUserId);
            return true;
        } catch (Exception e) {
            log.error("Failed to sync phone to Azure AD for user {}", externalUserId, e);
            return false;
        }
    }

    @Override
    public boolean syncUserEmail(String externalUserId, String email) {
        if (!isEnabled()) return false;

        try {
            String token = getGraphToken();
            String url = "https://graph.microsoft.com/v1.0/users/" + externalUserId;

            ObjectNode payload = objectMapper.createObjectNode();
            payload.put("otherMails", objectMapper.createArrayNode().add(email));

            HttpHeaders headers = createHeaders(token);
            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(payload), headers);

            restTemplate.exchange(url, HttpMethod.PATCH, entity, String.class);
            log.info("Synced alternate email to Azure AD for user {}", externalUserId);
            return true;
        } catch (Exception e) {
            log.error("Failed to sync email to Azure AD for user {}", externalUserId, e);
            return false;
        }
    }

    @Override
    public String getStepUpAuthUrl(String originalState, String acrValues) {
        if (!isEnabled()) return null;

        try {
            String tenantId = properties.getAzureAd().getTenantId();
            String clientId = properties.getAzureAd().getClientId();
            String callbackUrl = properties.getAzureAd().getCallbackUrl();

            StringBuilder url = new StringBuilder();
            url.append("https://login.microsoftonline.com/").append(tenantId).append("/oauth2/v2.0/authorize?");
            url.append("response_type=code");
            url.append("&client_id=").append(URLEncoder.encode(clientId, StandardCharsets.UTF_8));
            url.append("&redirect_uri=").append(URLEncoder.encode(callbackUrl, StandardCharsets.UTF_8));
            url.append("&scope=").append(URLEncoder.encode("openid profile email", StandardCharsets.UTF_8));
            url.append("&state=").append(URLEncoder.encode(originalState, StandardCharsets.UTF_8));

            // Force MFA with claims request
            if (acrValues != null) {
                url.append("&acr_values=").append(URLEncoder.encode(acrValues, StandardCharsets.UTF_8));
            }

            // Force re-authentication and MFA
            url.append("&prompt=login");

            // Request MFA claim
            String claimsRequest = "{\"id_token\":{\"acrs\":{\"essential\":true,\"values\":[\"urn:microsoft:req1\"]}}}";
            url.append("&claims=").append(URLEncoder.encode(claimsRequest, StandardCharsets.UTF_8));

            return url.toString();
        } catch (Exception e) {
            log.error("Failed to build Azure AD step-up auth URL", e);
            return null;
        }
    }

    @Override
    public boolean verifyMfaClaim(Map<String, Object> tokenClaims) {
        // Check AMR claim for Azure AD MFA indicators
        Object amr = tokenClaims.get("amr");
        if (amr instanceof List) {
            List<?> amrList = (List<?>) amr;
            return amrList.stream().anyMatch(m ->
                m.toString().equals("mfa") ||
                m.toString().equals("ngcmfa") || // Windows Hello
                m.toString().equals("wia") // Windows Integrated Auth with MFA
            );
        }

        // Check auth_time and acrs claims
        Object acrs = tokenClaims.get("acrs");
        if (acrs != null) {
            return acrs.toString().contains("req1") || acrs.toString().contains("c1");
        }

        return false;
    }

    @Override
    public String enrollUserMfa(String externalUserId, MfaMethod method) {
        // Azure AD MFA enrollment is typically done by the user through:
        // - https://aka.ms/mfasetup
        // - Microsoft Authenticator app
        log.info("Azure AD MFA enrollment for user {} - direct user to https://aka.ms/mfasetup", externalUserId);
        return "azure-ad-self-service";
    }

    // --- Helper methods ---

    private String getGraphToken() {
        if (accessToken != null && System.currentTimeMillis() < tokenExpiry) {
            return accessToken;
        }

        try {
            String url = "https://login.microsoftonline.com/" + properties.getAzureAd().getTenantId() + "/oauth2/v2.0/token";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            String body = "grant_type=client_credentials"
                + "&client_id=" + properties.getAzureAd().getClientId()
                + "&client_secret=" + URLEncoder.encode(properties.getAzureAd().getClientSecret(), StandardCharsets.UTF_8)
                + "&scope=" + URLEncoder.encode("https://graph.microsoft.com/.default", StandardCharsets.UTF_8);

            HttpEntity<String> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            JsonNode responseJson = objectMapper.readTree(response.getBody());
            accessToken = responseJson.path("access_token").asText();
            int expiresIn = responseJson.path("expires_in").asInt(3600);
            tokenExpiry = System.currentTimeMillis() + (expiresIn * 1000L) - 60000;

            return accessToken;
        } catch (Exception e) {
            log.error("Failed to get Azure AD Graph token", e);
            throw new RuntimeException("Failed to get Azure AD Graph token", e);
        }
    }

    private HttpHeaders createHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        return headers;
    }
}
