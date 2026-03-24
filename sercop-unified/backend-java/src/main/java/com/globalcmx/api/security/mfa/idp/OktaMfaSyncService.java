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
 * Okta implementation for MFA synchronization.
 * Uses Okta Admin API for MFA configuration.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OktaMfaSyncService implements IdpMfaSyncService {

    private final IdentityProviderProperties properties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public IdentityProvider getProvider() {
        return IdentityProvider.OKTA;
    }

    @Override
    public boolean isEnabled() {
        return properties.getOkta().isEnabled()
            && properties.getOkta().getDomain() != null
            && properties.getOkta().getClientId() != null;
    }

    @Override
    public Set<MfaMethod> getSupportedMethods() {
        return Set.of(MfaMethod.TOTP, MfaMethod.SMS, MfaMethod.EMAIL, MfaMethod.PUSH, MfaMethod.WEBAUTHN);
    }

    @Override
    public boolean syncMfaPolicy(Set<MfaMethod> enabledMethods, String policy) {
        if (!isEnabled()) {
            log.warn("Okta MFA sync skipped - not enabled");
            return false;
        }

        try {
            String baseUrl = "https://" + properties.getOkta().getDomain() + "/api/v1";
            String apiToken = properties.getOkta().getClientSecret(); // Okta uses API token

            // Update factor status for each method
            for (MfaMethod method : MfaMethod.values()) {
                if (getSupportedMethods().contains(method)) {
                    boolean shouldEnable = enabledMethods.contains(method);
                    String factorType = mapMethodToOktaFactor(method);
                    if (factorType != null) {
                        updateOrgFactor(baseUrl, apiToken, factorType, shouldEnable);
                    }
                }
            }

            log.info("Okta MFA policy synced successfully: methods={}, policy={}", enabledMethods, policy);
            return true;
        } catch (Exception e) {
            log.error("Failed to sync MFA policy to Okta", e);
            return false;
        }
    }

    @Override
    public boolean syncUserPhone(String externalUserId, String phoneNumber) {
        if (!isEnabled()) return false;

        try {
            String baseUrl = "https://" + properties.getOkta().getDomain() + "/api/v1";
            String apiToken = properties.getOkta().getClientSecret();
            String url = baseUrl + "/users/" + externalUserId;

            ObjectNode profile = objectMapper.createObjectNode();
            profile.put("mobilePhone", phoneNumber);

            ObjectNode payload = objectMapper.createObjectNode();
            payload.set("profile", profile);

            HttpHeaders headers = createHeaders(apiToken);
            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(payload), headers);

            restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            log.info("Synced phone number to Okta for user {}", externalUserId);
            return true;
        } catch (Exception e) {
            log.error("Failed to sync phone to Okta for user {}", externalUserId, e);
            return false;
        }
    }

    @Override
    public boolean syncUserEmail(String externalUserId, String email) {
        if (!isEnabled()) return false;

        try {
            String baseUrl = "https://" + properties.getOkta().getDomain() + "/api/v1";
            String apiToken = properties.getOkta().getClientSecret();
            String url = baseUrl + "/users/" + externalUserId;

            ObjectNode profile = objectMapper.createObjectNode();
            profile.put("secondEmail", email);

            ObjectNode payload = objectMapper.createObjectNode();
            payload.set("profile", profile);

            HttpHeaders headers = createHeaders(apiToken);
            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(payload), headers);

            restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            log.info("Synced secondary email to Okta for user {}", externalUserId);
            return true;
        } catch (Exception e) {
            log.error("Failed to sync email to Okta for user {}", externalUserId, e);
            return false;
        }
    }

    @Override
    public String getStepUpAuthUrl(String originalState, String acrValues) {
        if (!isEnabled()) return null;

        try {
            String domain = properties.getOkta().getDomain();
            String clientId = properties.getOkta().getClientId();
            String callbackUrl = properties.getOkta().getCallbackUrl();
            String authServerId = properties.getOkta().getAuthorizationServerId();

            StringBuilder url = new StringBuilder();
            url.append("https://").append(domain);
            url.append("/oauth2/").append(authServerId).append("/v1/authorize?");
            url.append("response_type=code");
            url.append("&client_id=").append(URLEncoder.encode(clientId, StandardCharsets.UTF_8));
            url.append("&redirect_uri=").append(URLEncoder.encode(callbackUrl, StandardCharsets.UTF_8));
            url.append("&scope=").append(URLEncoder.encode("openid profile email", StandardCharsets.UTF_8));
            url.append("&state=").append(URLEncoder.encode(originalState, StandardCharsets.UTF_8));

            // Force MFA with ACR values
            if (acrValues != null) {
                url.append("&acr_values=").append(URLEncoder.encode(acrValues, StandardCharsets.UTF_8));
            } else {
                // Okta ACR for MFA
                url.append("&acr_values=").append(URLEncoder.encode("urn:okta:loa:2fa:any", StandardCharsets.UTF_8));
            }

            // Force re-authentication
            url.append("&prompt=login");

            return url.toString();
        } catch (Exception e) {
            log.error("Failed to build Okta step-up auth URL", e);
            return null;
        }
    }

    @Override
    public boolean verifyMfaClaim(Map<String, Object> tokenClaims) {
        // Check AMR claim
        Object amr = tokenClaims.get("amr");
        if (amr instanceof List) {
            List<?> amrList = (List<?>) amr;
            return amrList.stream().anyMatch(m ->
                m.toString().contains("mfa") ||
                m.toString().contains("otp") ||
                m.toString().contains("sms") ||
                m.toString().contains("kba") ||
                m.toString().contains("swk") // Software key (authenticator)
            );
        }

        // Check ACR claim
        Object acr = tokenClaims.get("acr");
        if (acr != null) {
            String acrValue = acr.toString();
            return acrValue.contains("2fa") || acrValue.contains("mfa");
        }

        return false;
    }

    @Override
    public String enrollUserMfa(String externalUserId, MfaMethod method) {
        if (!isEnabled()) return null;

        try {
            String baseUrl = "https://" + properties.getOkta().getDomain() + "/api/v1";
            String apiToken = properties.getOkta().getClientSecret();
            String factorType = mapMethodToOktaFactor(method);

            if (factorType == null) {
                log.warn("Unsupported MFA method for Okta: {}", method);
                return null;
            }

            String url = baseUrl + "/users/" + externalUserId + "/factors";

            ObjectNode payload = objectMapper.createObjectNode();
            payload.put("factorType", factorType);
            payload.put("provider", getOktaProvider(method));

            HttpHeaders headers = createHeaders(apiToken);
            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(payload), headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                String factorId = responseJson.path("id").asText();
                log.info("Created Okta MFA enrollment {} for user {}", factorId, externalUserId);
                return factorId;
            }

            return null;
        } catch (Exception e) {
            log.error("Failed to enroll user {} in Okta MFA", externalUserId, e);
            return null;
        }
    }

    // --- Helper methods ---

    private HttpHeaders createHeaders(String apiToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "SSWS " + apiToken);
        return headers;
    }

    private void updateOrgFactor(String baseUrl, String apiToken, String factorType, boolean enabled) {
        try {
            String url = baseUrl + "/org/factors/" + factorType + "/lifecycle/" + (enabled ? "activate" : "deactivate");

            HttpHeaders headers = createHeaders(apiToken);
            HttpEntity<String> entity = new HttpEntity<>(headers);

            restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            log.debug("Okta factor {} set to enabled={}", factorType, enabled);
        } catch (Exception e) {
            log.warn("Failed to update Okta factor {}: {}", factorType, e.getMessage());
        }
    }

    private String mapMethodToOktaFactor(MfaMethod method) {
        return switch (method) {
            case TOTP -> "token:software:totp";
            case SMS -> "sms";
            case EMAIL -> "email";
            case PUSH -> "push";
            case WEBAUTHN -> "webauthn";
        };
    }

    private String getOktaProvider(MfaMethod method) {
        return switch (method) {
            case TOTP -> "OKTA";
            case SMS, EMAIL, PUSH -> "OKTA";
            case WEBAUTHN -> "FIDO";
        };
    }
}
