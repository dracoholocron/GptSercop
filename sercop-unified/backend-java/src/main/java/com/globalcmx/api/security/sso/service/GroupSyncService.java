package com.globalcmx.api.security.sso.service;

import com.globalcmx.api.security.entity.Role;
import com.globalcmx.api.security.entity.User;
import com.globalcmx.api.security.repository.RoleRepository;
import com.globalcmx.api.security.repository.UserRepository;
import com.globalcmx.api.security.sso.IdentityProvider;
import com.globalcmx.api.security.sso.config.IdentityProviderProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.Optional;

/**
 * Service for synchronizing IdP groups to local roles.
 * Supports three sync modes:
 * - ADDITIVE: Only add roles from IdP, never remove
 * - REPLACE: Replace all roles with IdP roles
 * - MERGE: Combine IdP roles with existing manual roles
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GroupSyncService {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final IdentityProviderProperties properties;
    private final Environment environment;

    // Cache for group mappings
    private Map<String, Map<String, String>> groupMappingsCache;

    /**
     * Sync user roles from IdP groups.
     */
    @Transactional
    public void syncGroups(User user, IdentityProvider provider, List<String> idpGroups) {
        if (idpGroups == null || idpGroups.isEmpty()) {
            log.debug("No groups to sync for user: {}", user.getUsername());
            return;
        }

        String syncMode = properties.getGroupSyncMode();
        log.info("Syncing groups for user {} with mode {}: {}",
                user.getUsername(), syncMode, idpGroups);

        Set<Role> currentRoles = user.getRoles();
        Set<Role> idpRoles = mapGroupsToRoles(provider, idpGroups);

        Set<Role> newRoles = switch (syncMode.toUpperCase()) {
            case "ADDITIVE" -> syncAdditive(currentRoles, idpRoles);
            case "REPLACE" -> syncReplace(idpRoles);
            case "MERGE" -> syncMerge(currentRoles, idpRoles);
            default -> {
                log.warn("Unknown sync mode: {}, using MERGE", syncMode);
                yield syncMerge(currentRoles, idpRoles);
            }
        };

        if (!currentRoles.equals(newRoles)) {
            user.setRoles(newRoles);
            userRepository.save(user);
            log.info("Updated roles for user {}: {}", user.getUsername(),
                    newRoles.stream().map(Role::getName).toList());
        }
    }

    /**
     * Map IdP groups to local roles.
     */
    private Set<Role> mapGroupsToRoles(IdentityProvider provider, List<String> groups) {
        Set<Role> roles = new HashSet<>();
        Map<String, String> mappings = getGroupMappings(provider);

        log.debug("Available role mappings for {}: {}", provider, mappings);

        for (String group : groups) {
            log.debug("Processing group/role: {}", group);

            // Try explicit mapping first
            String roleName = mappings.get(group);
            if (roleName != null) {
                log.info("Found explicit mapping: {} -> {}", group, roleName);
                roleRepository.findByName(roleName)
                        .ifPresentOrElse(
                            role -> {
                                roles.add(role);
                                log.info("Added role from mapping: {}", role.getName());
                            },
                            () -> log.warn("Role not found in database: {}", roleName)
                        );
            } else {
                // Try direct mapping (group name = role name)
                Optional<Role> directRole = roleRepository.findByName(group);
                if (directRole.isPresent()) {
                    roles.add(directRole.get());
                    log.info("Added role by direct name: {}", group);
                } else {
                    // Try with ROLE_ prefix
                    String prefixedRole = "ROLE_" + group.toUpperCase();
                    roleRepository.findByName(prefixedRole)
                            .ifPresentOrElse(
                                role -> {
                                    roles.add(role);
                                    log.info("Added role with prefix: {}", prefixedRole);
                                },
                                () -> log.debug("No role found for group: {} (tried {} and {})",
                                    group, group, prefixedRole)
                            );
                }
            }
        }

        log.info("Mapped {} groups to {} roles for provider {}",
            groups.size(), roles.size(), provider);
        return roles;
    }

    /**
     * Get group mappings from environment variables.
     * Format: AUTH_GROUP_MAP_{PROVIDER}_{GROUP}=ROLE_NAME
     */
    private Map<String, String> getGroupMappings(IdentityProvider provider) {
        if (groupMappingsCache == null) {
            groupMappingsCache = new HashMap<>();
        }

        return groupMappingsCache.computeIfAbsent(provider.getCode(), code -> {
            Map<String, String> mappings = new HashMap<>();
            String prefix = "AUTH_GROUP_MAP_" + code + "_";

            // Read from environment
            for (String key : System.getenv().keySet()) {
                if (key.startsWith(prefix)) {
                    String group = key.substring(prefix.length());
                    String role = System.getenv(key);
                    mappings.put(group, role);
                    log.debug("Loaded group mapping: {} -> {}", group, role);
                }
            }

            // Also check Spring properties
            // auth.group-map.azure.Administrators=ROLE_ADMIN
            String propPrefix = "auth.group-map." + code.toLowerCase() + ".";
            // This would require additional configuration, keeping it simple for now

            return mappings;
        });
    }

    /**
     * ADDITIVE: Only add new roles, never remove existing.
     */
    private Set<Role> syncAdditive(Set<Role> current, Set<Role> fromIdp) {
        Set<Role> result = new HashSet<>(current);
        result.addAll(fromIdp);
        return result;
    }

    /**
     * REPLACE: Completely replace with IdP roles.
     */
    private Set<Role> syncReplace(Set<Role> fromIdp) {
        // Ensure at least one role (default user role)
        if (fromIdp.isEmpty()) {
            roleRepository.findByName(properties.getJitDefaultRole())
                    .ifPresent(fromIdp::add);
        }
        return fromIdp;
    }

    /**
     * MERGE: Combine IdP roles with manually assigned roles.
     * Manual roles are those not in the IdP mappings.
     */
    private Set<Role> syncMerge(Set<Role> current, Set<Role> fromIdp) {
        Set<Role> result = new HashSet<>(fromIdp);

        // Keep roles that were manually assigned (not from any IdP mapping)
        for (Role role : current) {
            if (!isIdpManagedRole(role.getName())) {
                result.add(role);
            }
        }

        // Ensure at least one role
        if (result.isEmpty()) {
            roleRepository.findByName(properties.getJitDefaultRole())
                    .ifPresent(result::add);
        }

        return result;
    }

    /**
     * Check if a role is managed by IdP (appears in any mapping).
     */
    private boolean isIdpManagedRole(String roleName) {
        if (groupMappingsCache == null) return false;

        return groupMappingsCache.values().stream()
                .anyMatch(mappings -> mappings.containsValue(roleName));
    }

    /**
     * Clear the group mappings cache.
     */
    public void clearCache() {
        groupMappingsCache = null;
        log.info("Group mappings cache cleared");
    }
}
