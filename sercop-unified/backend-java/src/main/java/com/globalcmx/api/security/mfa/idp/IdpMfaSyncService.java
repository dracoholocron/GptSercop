package com.globalcmx.api.security.mfa.idp;

import com.globalcmx.api.security.mfa.entity.MfaMethod;
import com.globalcmx.api.security.sso.IdentityProvider;

import java.util.Map;
import java.util.Set;

/**
 * Interface for synchronizing MFA configuration with Identity Providers.
 */
public interface IdpMfaSyncService {

    /**
     * Get the identity provider this service handles.
     */
    IdentityProvider getProvider();

    /**
     * Check if this service is enabled and configured.
     */
    boolean isEnabled();

    /**
     * Sync MFA policy to the IdP.
     *
     * @param enabledMethods Set of enabled MFA methods
     * @param policy MFA policy (disabled, optional, required, risk-based)
     * @return true if sync was successful
     */
    boolean syncMfaPolicy(Set<MfaMethod> enabledMethods, String policy);

    /**
     * Sync user's phone number to IdP for SMS MFA.
     *
     * @param externalUserId The user's ID in the IdP
     * @param phoneNumber Phone number with country code
     * @return true if sync was successful
     */
    boolean syncUserPhone(String externalUserId, String phoneNumber);

    /**
     * Sync user's email to IdP for email MFA.
     *
     * @param externalUserId The user's ID in the IdP
     * @param email Email address
     * @return true if sync was successful
     */
    boolean syncUserEmail(String externalUserId, String email);

    /**
     * Get the step-up authentication URL for forcing MFA.
     *
     * @param originalState State parameter to pass through
     * @param acrValues ACR values to request MFA
     * @return Authorization URL for step-up auth
     */
    String getStepUpAuthUrl(String originalState, String acrValues);

    /**
     * Verify that a token includes MFA authentication.
     *
     * @param tokenClaims The claims from the JWT token
     * @return true if MFA was performed
     */
    boolean verifyMfaClaim(Map<String, Object> tokenClaims);

    /**
     * Enroll a user in MFA at the IdP level.
     *
     * @param externalUserId The user's ID in the IdP
     * @param method The MFA method to enroll
     * @return Enrollment ID from IdP, or null if failed
     */
    String enrollUserMfa(String externalUserId, MfaMethod method);

    /**
     * Get supported MFA methods for this IdP.
     */
    Set<MfaMethod> getSupportedMethods();
}
