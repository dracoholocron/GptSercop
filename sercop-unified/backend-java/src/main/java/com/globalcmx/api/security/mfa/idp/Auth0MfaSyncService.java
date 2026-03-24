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
 * Auth0 implementation for MFA synchronization.
 * Uses Auth0 Management API for MFA configuration.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class Auth0MfaSyncService implements IdpMfaSyncService {

    private final IdentityProviderProperties properties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // Cache for management API token
    private String managementToken;
    private long tokenExpiry;

    @Override
    public IdentityProvider getProvider() {
        return IdentityProvider.AUTH0;
    }

    @Override
    public boolean isEnabled() {
        return properties.getAuth0().isEnabled()
            && properties.getAuth0().getDomain() != null
            && properties.getAuth0().getClientId() != null
            && properties.getAuth0().getClientSecret() != null;
    }

    @Override
    public Set<MfaMethod> getSupportedMethods() {
        return Set.of(MfaMethod.TOTP, MfaMethod.SMS, MfaMethod.EMAIL, MfaMethod.PUSH, MfaMethod.WEBAUTHN);
    }

    @Override
    public boolean syncMfaPolicy(Set<MfaMethod> enabledMethods, String policy) {
        if (!isEnabled()) {
            log.warn("Auth0 MFA sync skipped - not enabled");
            return false;
        }

        try {
            String token = getManagementToken();
            String baseUrl = "https://" + properties.getAuth0().getDomain() + "/api/v2";

            // Enable/disable MFA factors
            for (MfaMethod method : MfaMethod.values()) {
                if (getSupportedMethods().contains(method)) {
                    boolean shouldEnable = enabledMethods.contains(method);
                    String factorName = mapMethodToAuth0Factor(method);
                    if (factorName != null) {
                        updateFactor(baseUrl, token, factorName, shouldEnable);
                    }
                }
            }

            // Update MFA policy
            updateMfaPolicy(baseUrl, token, policy);

            log.info("Auth0 MFA policy synced successfully: methods={}, policy={}", enabledMethods, policy);
            return true;
        } catch (Exception e) {
            log.error("Failed to sync MFA policy to Auth0", e);
            return false;
        }
    }

    @Override
    public boolean syncUserPhone(String externalUserId, String phoneNumber) {
        if (!isEnabled()) return false;

        try {
            String token = getManagementToken();
            String url = "https://" + properties.getAuth0().getDomain() + "/api/v2/users/" + externalUserId;

            ObjectNode payload = objectMapper.createObjectNode();
            payload.put("phone_number", phoneNumber);
            payload.put("phone_verified", false);

            HttpHeaders headers = createHeaders(token);
            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(payload), headers);

            restTemplate.exchange(url, HttpMethod.PATCH, entity, String.class);
            log.info("Synced phone number to Auth0 for user {}", externalUserId);
            return true;
        } catch (Exception e) {
            log.error("Failed to sync phone to Auth0 for user {}", externalUserId, e);
            return false;
        }
    }

    @Override
    public boolean syncUserEmail(String externalUserId, String email) {
        // Auth0 uses primary email for email MFA, secondary email sync not typically needed
        log.info("Auth0 uses primary email for MFA - no secondary email sync needed");
        return true;
    }

    @Override
    public String getStepUpAuthUrl(String originalState, String acrValues) {
        if (!isEnabled()) return null;

        try {
            String domain = properties.getAuth0().getDomain();
            String clientId = properties.getAuth0().getClientId();
            String callbackUrl = properties.getAuth0().getCallbackUrl();
            String audience = properties.getAuth0().getAudience();

            // Build step-up authorization URL
            StringBuilder url = new StringBuilder();
            url.append("https://").append(domain).append("/authorize?");
            url.append("response_type=code");
            url.append("&client_id=").append(URLEncoder.encode(clientId, StandardCharsets.UTF_8));
            url.append("&redirect_uri=").append(URLEncoder.encode(callbackUrl, StandardCharsets.UTF_8));
            url.append("&scope=").append(URLEncoder.encode("openid profile email", StandardCharsets.UTF_8));
            url.append("&state=").append(URLEncoder.encode(originalState, StandardCharsets.UTF_8));

            // Force MFA with ACR values
            if (acrValues != null) {
                url.append("&acr_values=").append(URLEncoder.encode(acrValues, StandardCharsets.UTF_8));
            } else {
                // Default: require MFA
                url.append("&acr_values=").append(URLEncoder.encode("http://schemas.openid.net/pape/policies/2007/06/multi-factor", StandardCharsets.UTF_8));
            }

            // Force re-authentication
            url.append("&prompt=login");

            if (audience != null) {
                url.append("&audience=").append(URLEncoder.encode(audience, StandardCharsets.UTF_8));
            }

            return url.toString();
        } catch (Exception e) {
            log.error("Failed to build Auth0 step-up auth URL", e);
            return null;
        }
    }

    @Override
    public boolean verifyMfaClaim(Map<String, Object> tokenClaims) {
        // Check AMR (Authentication Methods References) claim
        Object amr = tokenClaims.get("amr");
        if (amr instanceof List) {
            List<?> amrList = (List<?>) amr;
            return amrList.contains("mfa") || amrList.contains("otp") || amrList.contains("sms");
        }

        // Check ACR (Authentication Context Class Reference) claim
        Object acr = tokenClaims.get("acr");
        if (acr != null) {
            String acrValue = acr.toString();
            return acrValue.contains("multi-factor") || acrValue.contains("mfa");
        }

        return false;
    }

    @Override
    public String enrollUserMfa(String externalUserId, MfaMethod method) {
        if (!isEnabled()) return null;

        try {
            String token = getManagementToken();
            String baseUrl = "https://" + properties.getAuth0().getDomain() + "/api/v2";

            // Create MFA enrollment for user
            String factorName = mapMethodToAuth0Factor(method);
            if (factorName == null) {
                log.warn("Unsupported MFA method for Auth0: {}", method);
                return null;
            }

            String url = baseUrl + "/guardian/enrollments";

            ObjectNode payload = objectMapper.createObjectNode();
            payload.put("user_id", externalUserId);
            payload.put("type", factorName);

            HttpHeaders headers = createHeaders(token);
            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(payload), headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                String enrollmentId = responseJson.path("id").asText();
                log.info("Created Auth0 MFA enrollment {} for user {}", enrollmentId, externalUserId);
                return enrollmentId;
            }

            return null;
        } catch (Exception e) {
            log.error("Failed to enroll user {} in Auth0 MFA", externalUserId, e);
            return null;
        }
    }

    // --- Helper methods ---

    private String getManagementToken() {
        if (managementToken != null && System.currentTimeMillis() < tokenExpiry) {
            return managementToken;
        }

        try {
            String url = "https://" + properties.getAuth0().getDomain() + "/oauth/token";

            ObjectNode payload = objectMapper.createObjectNode();
            payload.put("grant_type", "client_credentials");
            payload.put("client_id", properties.getAuth0().getClientId());
            payload.put("client_secret", properties.getAuth0().getClientSecret());
            payload.put("audience", "https://" + properties.getAuth0().getDomain() + "/api/v2/");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(payload), headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            JsonNode responseJson = objectMapper.readTree(response.getBody());
            managementToken = responseJson.path("access_token").asText();
            int expiresIn = responseJson.path("expires_in").asInt(3600);
            tokenExpiry = System.currentTimeMillis() + (expiresIn * 1000L) - 60000; // Refresh 1 min early

            return managementToken;
        } catch (Exception e) {
            log.error("Failed to get Auth0 management token", e);
            throw new RuntimeException("Failed to get Auth0 management token", e);
        }
    }

    private HttpHeaders createHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        return headers;
    }

    private void updateFactor(String baseUrl, String token, String factorName, boolean enabled) {
        try {
            String url = baseUrl + "/guardian/factors/" + factorName;

            ObjectNode payload = objectMapper.createObjectNode();
            payload.put("enabled", enabled);

            HttpHeaders headers = createHeaders(token);
            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(payload), headers);

            restTemplate.exchange(url, HttpMethod.PUT, entity, String.class);
            log.debug("Auth0 factor {} set to enabled={}", factorName, enabled);
        } catch (Exception e) {
            log.warn("Failed to update Auth0 factor {}: {}", factorName, e.getMessage());
        }
    }

    private void updateMfaPolicy(String baseUrl, String token, String policy) {
        try {
            String url = baseUrl + "/guardian/policies";

            // Map policy to Auth0 policies array
            List<String> policies = new ArrayList<>();
            switch (policy) {
                case "required":
                    policies.add("all-applications");
                    break;
                case "risk-based":
                    policies.add("confidence-score");
                    break;
                case "optional":
                case "disabled":
                default:
                    // Empty policies = optional
                    break;
            }

            HttpHeaders headers = createHeaders(token);
            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(policies), headers);

            restTemplate.exchange(url, HttpMethod.PUT, entity, String.class);
            log.debug("Auth0 MFA policy updated to: {}", policy);
        } catch (Exception e) {
            log.warn("Failed to update Auth0 MFA policy: {}", e.getMessage());
        }
    }

    private String mapMethodToAuth0Factor(MfaMethod method) {
        return switch (method) {
            case TOTP -> "otp";
            case SMS -> "sms";
            case EMAIL -> "email";
            case PUSH -> "push-notification";
            case WEBAUTHN -> "webauthn-roaming";
        };
    }
}
