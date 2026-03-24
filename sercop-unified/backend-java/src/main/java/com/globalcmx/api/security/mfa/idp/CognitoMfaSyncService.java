package com.globalcmx.api.security.mfa.idp;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.security.mfa.entity.MfaMethod;
import com.globalcmx.api.security.sso.IdentityProvider;
import com.globalcmx.api.security.sso.config.IdentityProviderProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * AWS Cognito implementation for MFA synchronization.
 * Uses AWS SDK for Cognito User Pool MFA configuration.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CognitoMfaSyncService implements IdpMfaSyncService {

    private final IdentityProviderProperties properties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private CognitoIdentityProviderClient cognitoClient;

    @Override
    public IdentityProvider getProvider() {
        return IdentityProvider.COGNITO;
    }

    @Override
    public boolean isEnabled() {
        return properties.getCognito().isEnabled()
            && properties.getCognito().getUserPoolId() != null
            && properties.getCognito().getClientId() != null;
    }

    @Override
    public Set<MfaMethod> getSupportedMethods() {
        // Cognito supports TOTP and SMS
        return Set.of(MfaMethod.TOTP, MfaMethod.SMS);
    }

    @Override
    public boolean syncMfaPolicy(Set<MfaMethod> enabledMethods, String policy) {
        if (!isEnabled()) {
            log.warn("Cognito MFA sync skipped - not enabled");
            return false;
        }

        try {
            CognitoIdentityProviderClient client = getCognitoClient();
            String userPoolId = properties.getCognito().getUserPoolId();

            // Determine MFA configuration
            UserPoolMfaType mfaConfig;
            switch (policy) {
                case "required":
                    mfaConfig = UserPoolMfaType.ON;
                    break;
                case "optional":
                    mfaConfig = UserPoolMfaType.OPTIONAL;
                    break;
                case "disabled":
                default:
                    mfaConfig = UserPoolMfaType.OFF;
                    break;
            }

            // Build MFA configuration
            SetUserPoolMfaConfigRequest.Builder requestBuilder = SetUserPoolMfaConfigRequest.builder()
                .userPoolId(userPoolId)
                .mfaConfiguration(mfaConfig);

            // Configure SMS MFA if enabled
            if (enabledMethods.contains(MfaMethod.SMS)) {
                requestBuilder.smsMfaConfiguration(SmsMfaConfigType.builder()
                    .smsAuthenticationMessage("Tu código de verificación para GlobalCMX es {####}")
                    .build());
            }

            // Configure TOTP MFA if enabled
            if (enabledMethods.contains(MfaMethod.TOTP)) {
                requestBuilder.softwareTokenMfaConfiguration(SoftwareTokenMfaConfigType.builder()
                    .enabled(true)
                    .build());
            }

            client.setUserPoolMfaConfig(requestBuilder.build());

            log.info("Cognito MFA policy synced successfully: methods={}, policy={}", enabledMethods, policy);
            return true;
        } catch (Exception e) {
            log.error("Failed to sync MFA policy to Cognito", e);
            return false;
        }
    }

    @Override
    public boolean syncUserPhone(String externalUserId, String phoneNumber) {
        if (!isEnabled()) return false;

        try {
            CognitoIdentityProviderClient client = getCognitoClient();
            String userPoolId = properties.getCognito().getUserPoolId();

            AdminUpdateUserAttributesRequest request = AdminUpdateUserAttributesRequest.builder()
                .userPoolId(userPoolId)
                .username(externalUserId)
                .userAttributes(
                    AttributeType.builder()
                        .name("phone_number")
                        .value(phoneNumber)
                        .build()
                )
                .build();

            client.adminUpdateUserAttributes(request);
            log.info("Synced phone number to Cognito for user {}", externalUserId);
            return true;
        } catch (Exception e) {
            log.error("Failed to sync phone to Cognito for user {}", externalUserId, e);
            return false;
        }
    }

    @Override
    public boolean syncUserEmail(String externalUserId, String email) {
        // Cognito uses primary email attribute
        log.info("Cognito uses primary email for MFA - no secondary email sync needed");
        return true;
    }

    @Override
    public String getStepUpAuthUrl(String originalState, String acrValues) {
        if (!isEnabled()) return null;

        try {
            String domain = properties.getCognito().getDomain();
            String clientId = properties.getCognito().getClientId();
            String callbackUrl = properties.getCognito().getCallbackUrl();
            String region = properties.getCognito().getRegion();

            // Build Cognito hosted UI URL
            StringBuilder url = new StringBuilder();
            url.append("https://").append(domain).append(".auth.").append(region).append(".amazoncognito.com/oauth2/authorize?");
            url.append("response_type=code");
            url.append("&client_id=").append(URLEncoder.encode(clientId, StandardCharsets.UTF_8));
            url.append("&redirect_uri=").append(URLEncoder.encode(callbackUrl, StandardCharsets.UTF_8));
            url.append("&scope=").append(URLEncoder.encode("openid profile email phone", StandardCharsets.UTF_8));
            url.append("&state=").append(URLEncoder.encode(originalState, StandardCharsets.UTF_8));

            // Note: Cognito doesn't support ACR values in the same way
            // MFA is triggered based on User Pool settings

            return url.toString();
        } catch (Exception e) {
            log.error("Failed to build Cognito step-up auth URL", e);
            return null;
        }
    }

    @Override
    public boolean verifyMfaClaim(Map<String, Object> tokenClaims) {
        // Check for Cognito-specific MFA indicators
        // When MFA is completed, the token includes these indicators

        // Check cognito:preferred_mfa_setting custom claim
        Object mfaSetting = tokenClaims.get("cognito:preferred_mfa_setting");
        if (mfaSetting != null) {
            return true; // User has MFA configured and used it
        }

        // Check if TOTP or SMS was used (would be in AMR if available)
        Object amr = tokenClaims.get("amr");
        if (amr instanceof List) {
            List<?> amrList = (List<?>) amr;
            return amrList.stream().anyMatch(m ->
                m.toString().contains("mfa") ||
                m.toString().contains("otp") ||
                m.toString().contains("sms")
            );
        }

        return false;
    }

    @Override
    public String enrollUserMfa(String externalUserId, MfaMethod method) {
        if (!isEnabled()) {
            log.debug("Cognito MFA enrollment skipped - not enabled");
            return null;
        }

        try {
            // Note: Cognito MFA enrollment is handled via Cognito Hosted UI
            // This method is called for sync purposes only
            log.info("Cognito MFA enrollment requested for user {} with method {}", externalUserId, method);

            // Return a reference ID for tracking
            if (method == MfaMethod.TOTP) {
                return "cognito-totp-" + externalUserId;
            } else if (method == MfaMethod.SMS) {
                return "cognito-sms-" + externalUserId;
            }

            return null;
        } catch (Exception e) {
            log.error("Failed to enroll user {} in Cognito MFA", externalUserId, e);
            return null;
        }
    }

    // --- Helper methods ---

    private CognitoIdentityProviderClient getCognitoClient() {
        if (cognitoClient == null) {
            cognitoClient = CognitoIdentityProviderClient.builder()
                .region(Region.of(properties.getCognito().getRegion()))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
        }
        return cognitoClient;
    }
}
