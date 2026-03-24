package com.globalcmx.api.security.service;

import com.globalcmx.api.security.entity.User;
import com.globalcmx.api.security.entity.UserApprovalStatus;
import com.globalcmx.api.security.entity.UserPrincipal;
import com.globalcmx.api.security.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Usuario no encontrado con username: " + username));

        // Check approval status - block access for non-approved users
        if (user.getApprovalStatus() == UserApprovalStatus.PENDING) {
            throw new UsernameNotFoundException("PENDING_APPROVAL:" + username);
        }
        if (user.getApprovalStatus() == UserApprovalStatus.REJECTED) {
            throw new UsernameNotFoundException("REJECTED:" + username);
        }

        // Build authorities from roles and permissions
        List<GrantedAuthority> authorities = new ArrayList<>();

        user.getRoles().forEach(role -> {
            // Add role as authority
            authorities.add(new SimpleGrantedAuthority(role.getName()));
            log.debug("Added role: {}", role.getName());

            // Add all permissions from this role as authorities
            role.getPermissions().forEach(permission -> {
                authorities.add(new SimpleGrantedAuthority(permission.getCode()));
                log.debug("Added permission: {}", permission.getCode());
            });
        });

        log.debug("User {} (type: {}, clienteId: {}) has authorities: {}",
                username, user.getUserType(), user.getClienteId(), authorities);

        // Return UserPrincipal with additional security info (userType, clienteId)
        return UserPrincipal.create(user, authorities);
    }
}
