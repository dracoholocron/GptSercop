package com.globalcmx.api.security.sso.service;

import com.globalcmx.api.security.sso.IdentityProvider;
import com.globalcmx.api.security.sso.dto.OAuth2UserInfo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Maps OAuth2 token claims to OAuth2UserInfo based on the provider.
 * Each provider has different claim names and structures.
 */
@Component
@Slf4j
public class OAuth2UserInfoMapper {

    /**
     * Map claims to user info based on provider.
     */
    public OAuth2UserInfo map(IdentityProvider provider, Map<String, Object> claims) {
        log.debug("Mapping claims for provider: {}", provider);

        return switch (provider) {
            case AUTH0 -> mapAuth0Claims(claims);
            case AZURE_AD -> mapAzureAdClaims(claims);
            case GOOGLE -> mapGoogleClaims(claims);
            case COGNITO -> mapCognitoClaims(claims);
            case OKTA -> mapOktaClaims(claims);
            default -> throw new IllegalArgumentException("Unsupported provider: " + provider);
        };
    }

    /**
     * Map Auth0 claims.
     */
    private OAuth2UserInfo mapAuth0Claims(Map<String, Object> claims) {
        return OAuth2UserInfo.builder()
                .provider(IdentityProvider.AUTH0)
                .externalId(getString(claims, "sub"))
                .email(getString(claims, "email"))
                .emailVerified(getBoolean(claims, "email_verified"))
                .fullName(getString(claims, "name"))
                .firstName(getString(claims, "given_name"))
                .lastName(getString(claims, "family_name"))
                .avatarUrl(getString(claims, "picture"))
                .groups(getStringList(claims, "https://globalcmx.com/roles")) // Custom claim for roles
                .attributes(claims)
                .build();
    }

    /**
     * Map Azure AD / Entra ID claims.
     */
    private OAuth2UserInfo mapAzureAdClaims(Map<String, Object> claims) {
        return OAuth2UserInfo.builder()
                .provider(IdentityProvider.AZURE_AD)
                .externalId(getString(claims, "oid")) // Object ID
                .email(getString(claims, "preferred_username", "email", "upn"))
                .emailVerified(true) // Azure AD emails are verified
                .fullName(getString(claims, "name"))
                .firstName(getString(claims, "given_name"))
                .lastName(getString(claims, "family_name"))
                .avatarUrl(null) // Azure AD doesn't provide avatar in token
                .groups(getStringList(claims, "groups"))
                .attributes(claims)
                .build();
    }

    /**
     * Map Google Cloud Identity claims.
     */
    private OAuth2UserInfo mapGoogleClaims(Map<String, Object> claims) {
        return OAuth2UserInfo.builder()
                .provider(IdentityProvider.GOOGLE)
                .externalId(getString(claims, "sub"))
                .email(getString(claims, "email"))
                .emailVerified(getBoolean(claims, "email_verified"))
                .fullName(getString(claims, "name"))
                .firstName(getString(claims, "given_name"))
                .lastName(getString(claims, "family_name"))
                .avatarUrl(getString(claims, "picture"))
                .groups(getStringList(claims, "groups")) // Requires Google Workspace
                .attributes(claims)
                .build();
    }

    /**
     * Map AWS Cognito claims.
     */
    private OAuth2UserInfo mapCognitoClaims(Map<String, Object> claims) {
        return OAuth2UserInfo.builder()
                .provider(IdentityProvider.COGNITO)
                .externalId(getString(claims, "sub"))
                .email(getString(claims, "email"))
                .emailVerified(getBoolean(claims, "email_verified"))
                .fullName(getString(claims, "name"))
                .firstName(getString(claims, "given_name"))
                .lastName(getString(claims, "family_name"))
                .avatarUrl(getString(claims, "picture"))
                .groups(getStringList(claims, "cognito:groups"))
                .attributes(claims)
                .build();
    }

    /**
     * Map Okta claims.
     * Okta uses standard OIDC claims with groups in the "groups" claim.
     *
     * Standard Okta claims:
     * - sub: Unique identifier for the user
     * - email: User's email address
     * - email_verified: Whether email is verified
     * - name: Full name
     * - given_name: First name
     * - family_name: Last name
     * - preferred_username: Username (often the email)
     * - groups: List of group names (if configured in the authorization server)
     */
    private OAuth2UserInfo mapOktaClaims(Map<String, Object> claims) {
        return OAuth2UserInfo.builder()
                .provider(IdentityProvider.OKTA)
                .externalId(getString(claims, "sub"))
                .email(getString(claims, "email", "preferred_username"))
                .emailVerified(getBoolean(claims, "email_verified"))
                .fullName(getString(claims, "name"))
                .firstName(getString(claims, "given_name"))
                .lastName(getString(claims, "family_name"))
                .avatarUrl(getString(claims, "picture")) // Okta may provide picture if configured
                .groups(getStringList(claims, "groups"))
                .attributes(claims)
                .build();
    }

    // Helper methods

    private String getString(Map<String, Object> claims, String... keys) {
        for (String key : keys) {
            Object value = claims.get(key);
            if (value instanceof String s && !s.isBlank()) {
                return s;
            }
        }
        return null;
    }

    private boolean getBoolean(Map<String, Object> claims, String key) {
        Object value = claims.get(key);
        if (value instanceof Boolean b) {
            return b;
        }
        if (value instanceof String s) {
            return "true".equalsIgnoreCase(s);
        }
        return false;
    }

    @SuppressWarnings("unchecked")
    private List<String> getStringList(Map<String, Object> claims, String key) {
        Object value = claims.get(key);
        if (value instanceof List<?> list) {
            List<String> result = new ArrayList<>();
            for (Object item : list) {
                if (item instanceof String s) {
                    result.add(s);
                }
            }
            return result;
        }
        return new ArrayList<>();
    }
}
