package com.globalcmx.api.service.command;

import com.globalcmx.api.dto.command.AssignPermissionToRoleCommand;
import com.globalcmx.api.dto.command.RevokePermissionFromRoleCommand;
import com.globalcmx.api.security.audit.SecurityAuditService;
import com.globalcmx.api.security.entity.Permission;
import com.globalcmx.api.security.entity.Role;
import com.globalcmx.api.security.evaluator.CustomPermissionEvaluator;
import com.globalcmx.api.security.repository.PermissionRepository;
import com.globalcmx.api.security.repository.RoleRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Command service for permission management (Write operations).
 * Follows CQRS pattern - handles commands only.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PermissionCommandService {

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final CustomPermissionEvaluator permissionEvaluator;
    private final SecurityAuditService auditService;

    /**
     * Assign a permission to a role.
     */
    @Transactional
    public void assignPermissionToRole(AssignPermissionToRoleCommand command) {
        String currentUser = getCurrentUsername();
        log.info("User {} assigning permission {} to role {}",
                currentUser, command.getPermissionCode(), command.getRoleId());

        Role role = roleRepository.findById(command.getRoleId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Role not found with id: " + command.getRoleId()));

        Permission permission = permissionRepository.findByCode(command.getPermissionCode())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Permission not found with code: " + command.getPermissionCode()));

        if (role.getPermissions().contains(permission)) {
            log.info("Permission {} already assigned to role {}",
                    command.getPermissionCode(), role.getName());
            return;
        }

        role.getPermissions().add(permission);
        roleRepository.save(role);

        // Clear permission cache for all users with this role
        role.getUsers().forEach(user ->
                permissionEvaluator.clearCacheForUser(user.getUsername()));

        // Audit log
        auditService.logEventAsync(
                com.globalcmx.api.security.audit.SecurityAuditEvent.EventType.PERMISSION_ASSIGNED,
                com.globalcmx.api.security.audit.SecurityAuditEvent.Severity.INFO,
                currentUser,
                "/admin/roles/" + role.getId() + "/permissions",
                "POST",
                true,
                null,
                java.util.Map.of(
                        "roleId", command.getRoleId(),
                        "roleName", role.getName(),
                        "permissionCode", command.getPermissionCode()
                )
        );

        log.info("Permission {} assigned to role {} by user {}",
                command.getPermissionCode(), role.getName(), currentUser);
    }

    /**
     * Revoke a permission from a role.
     */
    @Transactional
    public void revokePermissionFromRole(RevokePermissionFromRoleCommand command) {
        String currentUser = getCurrentUsername();
        log.info("User {} revoking permission {} from role {}",
                currentUser, command.getPermissionCode(), command.getRoleId());

        Role role = roleRepository.findById(command.getRoleId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Role not found with id: " + command.getRoleId()));

        Permission permission = permissionRepository.findByCode(command.getPermissionCode())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Permission not found with code: " + command.getPermissionCode()));

        if (!role.getPermissions().contains(permission)) {
            log.info("Permission {} not assigned to role {}",
                    command.getPermissionCode(), role.getName());
            return;
        }

        role.getPermissions().remove(permission);
        roleRepository.save(role);

        // Clear permission cache for all users with this role
        role.getUsers().forEach(user ->
                permissionEvaluator.clearCacheForUser(user.getUsername()));

        // Audit log
        auditService.logEventAsync(
                com.globalcmx.api.security.audit.SecurityAuditEvent.EventType.PERMISSION_REMOVED,
                com.globalcmx.api.security.audit.SecurityAuditEvent.Severity.INFO,
                currentUser,
                "/admin/roles/" + role.getId() + "/permissions",
                "DELETE",
                true,
                null,
                java.util.Map.of(
                        "roleId", command.getRoleId(),
                        "roleName", role.getName(),
                        "permissionCode", command.getPermissionCode()
                )
        );

        log.info("Permission {} revoked from role {} by user {}",
                command.getPermissionCode(), role.getName(), currentUser);
    }

    /**
     * Create a new permission.
     */
    @Transactional
    public Permission createPermission(String code, String name, String description, String module) {
        String currentUser = getCurrentUsername();
        log.info("User {} creating permission {}", currentUser, code);

        if (permissionRepository.existsByCode(code)) {
            throw new IllegalArgumentException("Permission already exists with code: " + code);
        }

        Permission permission = Permission.builder()
                .code(code)
                .name(name)
                .description(description)
                .module(module)
                .build();

        Permission saved = permissionRepository.save(permission);

        // Audit log
        auditService.logEventAsync(
                com.globalcmx.api.security.audit.SecurityAuditEvent.EventType.SECURITY_CONFIG_CHANGED,
                com.globalcmx.api.security.audit.SecurityAuditEvent.Severity.INFO,
                currentUser,
                "/admin/permissions",
                "POST",
                true,
                null,
                java.util.Map.of(
                        "permissionCode", code,
                        "module", module
                )
        );

        log.info("Permission {} created by user {}", code, currentUser);
        return saved;
    }

    /**
     * Delete a permission (use with caution).
     */
    @Transactional
    public void deletePermission(String code) {
        String currentUser = getCurrentUsername();
        log.warn("User {} deleting permission {}", currentUser, code);

        Permission permission = permissionRepository.findByCode(code)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Permission not found with code: " + code));

        // Remove from all roles first
        for (Role role : permission.getRoles()) {
            role.getPermissions().remove(permission);
            roleRepository.save(role);
        }

        permissionRepository.delete(permission);

        // Clear all permission cache
        permissionEvaluator.clearAllCache();

        // Audit log
        auditService.logEventAsync(
                com.globalcmx.api.security.audit.SecurityAuditEvent.EventType.SECURITY_CONFIG_CHANGED,
                com.globalcmx.api.security.audit.SecurityAuditEvent.Severity.WARNING,
                currentUser,
                "/admin/permissions/" + code,
                "DELETE",
                true,
                null,
                java.util.Map.of("permissionCode", code)
        );

        log.warn("Permission {} deleted by user {}", code, currentUser);
    }

    private String getCurrentUsername() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "system";
        }
    }
}
