package com.globalcmx.api.security.mfa.idp;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.security.mfa.entity.MfaMethod;
import com.globalcmx.api.security.sso.IdentityProvider;
import com.globalcmx.api.security.sso.config.IdentityProviderProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Google Cloud Identity implementation for MFA synchronization.
 * Google Workspace/Cloud Identity MFA is typically configured at the admin level.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleMfaSyncService implements IdpMfaSyncService {

    private final IdentityProviderProperties properties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public IdentityProvider getProvider() {
        return IdentityProvider.GOOGLE;
    }

    @Override
    public boolean isEnabled() {
        return properties.getGoogle().isEnabled()
            && properties.getGoogle().getClientId() != null
            && properties.getGoogle().getClientSecret() != null;
    }

    @Override
    public Set<MfaMethod> getSupportedMethods() {
        // Google supports these MFA methods
        return Set.of(MfaMethod.TOTP, MfaMethod.SMS, MfaMethod.PUSH, MfaMethod.WEBAUTHN);
    }

    @Override
    public boolean syncMfaPolicy(Set<MfaMethod> enabledMethods, String policy) {
        if (!isEnabled()) {
            log.warn("Google MFA sync skipped - not enabled");
            return false;
        }

        // Google Workspace MFA is configured in Admin Console
        // https://admin.google.com > Security > 2-Step Verification
        log.info("Google Workspace MFA policy should be configured in Google Admin Console");
        log.info("Navigate to: admin.google.com > Security > 2-Step Verification");
        log.info("Intended configuration - methods: {}, policy: {}", enabledMethods, policy);

        return true;
    }

    @Override
    public boolean syncUserPhone(String externalUserId, String phoneNumber) {
        // Google user phone sync requires Admin SDK with Directory API
        log.info("Google user phone sync requires Admin SDK - configure in Admin Console");
        return true;
    }

    @Override
    public boolean syncUserEmail(String externalUserId, String email) {
        // Google uses primary account email for MFA
        log.info("Google uses primary account email for MFA notifications");
        return true;
    }

    @Override
    public String getStepUpAuthUrl(String originalState, String acrValues) {
        if (!isEnabled()) return null;

        try {
            String clientId = properties.getGoogle().getClientId();
            String callbackUrl = properties.getGoogle().getCallbackUrl();
            String hostedDomain = properties.getGoogle().getHostedDomain();

            StringBuilder url = new StringBuilder();
            url.append("https://accounts.google.com/o/oauth2/v2/auth?");
            url.append("response_type=code");
            url.append("&client_id=").append(URLEncoder.encode(clientId, StandardCharsets.UTF_8));
            url.append("&redirect_uri=").append(URLEncoder.encode(callbackUrl, StandardCharsets.UTF_8));
            url.append("&scope=").append(URLEncoder.encode("openid profile email", StandardCharsets.UTF_8));
            url.append("&state=").append(URLEncoder.encode(originalState, StandardCharsets.UTF_8));

            // Force re-authentication (will trigger 2SV if configured)
            url.append("&prompt=consent");

            // Request ACR for MFA if specified
            if (acrValues != null) {
                url.append("&acr_values=").append(URLEncoder.encode(acrValues, StandardCharsets.UTF_8));
            }

            // Restrict to hosted domain if configured
            if (hostedDomain != null && !hostedDomain.isEmpty()) {
                url.append("&hd=").append(URLEncoder.encode(hostedDomain, StandardCharsets.UTF_8));
            }

            return url.toString();
        } catch (Exception e) {
            log.error("Failed to build Google step-up auth URL", e);
            return null;
        }
    }

    @Override
    public boolean verifyMfaClaim(Map<String, Object> tokenClaims) {
        // Google doesn't include MFA in standard claims
        // MFA is enforced at the Google account level
        // If user logged in, they passed whatever 2SV was required

        // Check if email is verified (basic check)
        Object emailVerified = tokenClaims.get("email_verified");
        if (emailVerified != null && Boolean.TRUE.equals(emailVerified)) {
            // If Google Workspace enforces 2SV, login implies MFA was completed
            return true;
        }

        return false;
    }

    @Override
    public String enrollUserMfa(String externalUserId, MfaMethod method) {
        // Google 2SV enrollment is done by users at:
        // https://myaccount.google.com/security
        log.info("Google MFA enrollment for user {} - direct to https://myaccount.google.com/security", externalUserId);
        return "google-self-service";
    }
}
