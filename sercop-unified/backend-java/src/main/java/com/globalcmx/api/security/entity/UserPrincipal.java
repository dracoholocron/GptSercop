package com.globalcmx.api.security.entity;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;

/**
 * Custom UserDetails implementation that includes additional user information
 * needed for security validation (userType, clienteId).
 */
@Getter
public class UserPrincipal implements UserDetails {

    private final Long id;
    private final String username;
    private final String password;
    private final String email;
    private final String userType; // INTERNAL or CLIENT
    private final String clienteId; // Participant ID for CLIENT users
    private final boolean enabled;
    private final boolean accountNonExpired;
    private final boolean accountNonLocked;
    private final boolean credentialsNonExpired;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserPrincipal(Long id, String username, String password, String email,
                         String userType, String clienteId,
                         boolean enabled, boolean accountNonExpired,
                         boolean accountNonLocked, boolean credentialsNonExpired,
                         Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.email = email;
        this.userType = userType != null ? userType : "INTERNAL";
        this.clienteId = clienteId;
        this.enabled = enabled;
        this.accountNonExpired = accountNonExpired;
        this.accountNonLocked = accountNonLocked;
        this.credentialsNonExpired = credentialsNonExpired;
        this.authorities = authorities;
    }

    /**
     * Check if this user is a client portal user.
     */
    public boolean isClientUser() {
        return "CLIENT".equals(userType);
    }

    /**
     * Check if this user is an internal user.
     */
    public boolean isInternalUser() {
        return "INTERNAL".equals(userType);
    }

    /**
     * Create UserPrincipal from User entity.
     */
    public static UserPrincipal create(User user, Collection<? extends GrantedAuthority> authorities) {
        return new UserPrincipal(
                user.getId(),
                user.getUsername(),
                user.getPassword(),
                user.getEmail(),
                user.getUserType(),
                user.getClienteId(),
                user.getEnabled(),
                user.getAccountNonExpired(),
                user.getAccountNonLocked(),
                user.getCredentialsNonExpired(),
                authorities
        );
    }
}
