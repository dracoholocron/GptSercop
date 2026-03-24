package com.globalcmx.api.security.sso.dto;

import com.globalcmx.api.security.sso.IdentityProvider;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * DTO representing user information from OAuth2/OIDC provider.
 */
@Data
@Builder
public class OAuth2UserInfo {

    /**
     * The identity provider that authenticated the user.
     */
    private IdentityProvider provider;

    /**
     * External user ID from the provider.
     */
    private String externalId;

    /**
     * User's email address.
     */
    private String email;

    /**
     * Whether the email has been verified by the provider.
     */
    private boolean emailVerified;

    /**
     * User's first name.
     */
    private String firstName;

    /**
     * User's last name.
     */
    private String lastName;

    /**
     * User's full name.
     */
    private String fullName;

    /**
     * URL to user's avatar/profile picture.
     */
    private String avatarUrl;

    /**
     * Groups/roles from the identity provider.
     */
    private List<String> groups;

    /**
     * Raw attributes from the OAuth2 token.
     */
    private Map<String, Object> attributes;

    /**
     * Get display name (full name or email).
     */
    public String getDisplayName() {
        if (fullName != null && !fullName.isBlank()) {
            return fullName;
        }
        if (firstName != null) {
            return lastName != null ? firstName + " " + lastName : firstName;
        }
        return email;
    }

    /**
     * Get username (email by default).
     */
    public String getUsername() {
        return email;
    }
}
