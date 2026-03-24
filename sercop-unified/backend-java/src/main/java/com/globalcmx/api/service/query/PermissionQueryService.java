package com.globalcmx.api.service.query;

import com.globalcmx.api.dto.query.PermissionQueryDTO;
import com.globalcmx.api.security.entity.Permission;
import com.globalcmx.api.security.entity.Role;
import com.globalcmx.api.security.repository.PermissionRepository;
import com.globalcmx.api.security.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Query service for permission read operations.
 * Follows CQRS pattern - handles queries only.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PermissionQueryService {

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;

    /**
     * Get all permissions.
     */
    public List<PermissionQueryDTO> getAllPermissions() {
        return permissionRepository.findAll().stream()
                .map(PermissionQueryDTO::from)
                .collect(Collectors.toList());
    }

    /**
     * Get permissions by module.
     */
    public List<PermissionQueryDTO> getPermissionsByModule(String module) {
        return permissionRepository.findByModule(module).stream()
                .map(PermissionQueryDTO::from)
                .collect(Collectors.toList());
    }

    /**
     * Get all modules.
     */
    public List<String> getAllModules() {
        return permissionRepository.findAllModules();
    }

    /**
     * Get permissions grouped by module.
     */
    public Map<String, List<PermissionQueryDTO>> getPermissionsGroupedByModule() {
        return permissionRepository.findAll().stream()
                .map(PermissionQueryDTO::from)
                .collect(Collectors.groupingBy(PermissionQueryDTO::getModule));
    }

    /**
     * Get permission by code.
     */
    public Optional<PermissionQueryDTO> getPermissionByCode(String code) {
        return permissionRepository.findByCode(code)
                .map(PermissionQueryDTO::from);
    }

    /**
     * Get permissions for a specific role.
     */
    public Set<PermissionQueryDTO> getPermissionsForRole(Long roleId) {
        return roleRepository.findById(roleId)
                .map(Role::getPermissions)
                .orElse(Collections.emptySet())
                .stream()
                .map(PermissionQueryDTO::from)
                .collect(Collectors.toSet());
    }

    /**
     * Get permissions for a specific role by name.
     */
    public Set<PermissionQueryDTO> getPermissionsForRole(String roleName) {
        return roleRepository.findByName(roleName)
                .map(Role::getPermissions)
                .orElse(Collections.emptySet())
                .stream()
                .map(PermissionQueryDTO::from)
                .collect(Collectors.toSet());
    }

    /**
     * Get permissions for a user (aggregated from all roles).
     */
    public Set<String> getPermissionCodesForUser(String username) {
        return permissionRepository.findPermissionCodesByUsername(username);
    }

    /**
     * Check if a role has a specific permission.
     */
    public boolean roleHasPermission(Long roleId, String permissionCode) {
        return roleRepository.findById(roleId)
                .map(role -> role.hasPermission(permissionCode))
                .orElse(false);
    }

    /**
     * Get roles that have a specific permission.
     */
    public List<RoleSummary> getRolesWithPermission(String permissionCode) {
        return permissionRepository.findByCode(permissionCode)
                .map(Permission::getRoles)
                .orElse(Collections.emptySet())
                .stream()
                .map(role -> new RoleSummary(role.getId(), role.getName(), role.getDescription()))
                .collect(Collectors.toList());
    }

    /**
     * Get permission matrix (all roles with their permissions).
     */
    public List<RolePermissionMatrix> getPermissionMatrix() {
        List<Role> roles = roleRepository.findAll();
        return roles.stream()
                .map(role -> new RolePermissionMatrix(
                        role.getId(),
                        role.getName(),
                        role.getDescription(),
                        role.getPermissionCodes()
                ))
                .collect(Collectors.toList());
    }

    /**
     * DTO for role summary
     */
    public record RoleSummary(Long id, String name, String description) {}

    /**
     * DTO for role-permission matrix
     */
    public record RolePermissionMatrix(
            Long roleId,
            String roleName,
            String roleDescription,
            Set<String> permissions
    ) {}
}
