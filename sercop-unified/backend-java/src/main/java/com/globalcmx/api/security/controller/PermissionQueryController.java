package com.globalcmx.api.security.controller;

import com.globalcmx.api.dto.ApiResponse;
import com.globalcmx.api.dto.query.PermissionQueryDTO;
import com.globalcmx.api.service.query.PermissionQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Query Controller for Permission read operations.
 * Follows CQRS pattern - handles queries only.
 *
 * Endpoints:
 * - GET /api/admin/permissions - List all permissions
 * - GET /api/admin/permissions/modules - List all modules
 * - GET /api/admin/permissions/module/{module} - Permissions by module
 * - GET /api/admin/permissions/grouped - Permissions grouped by module
 * - GET /api/admin/permissions/{code} - Get permission by code
 * - GET /api/admin/permissions/role/{roleId} - Permissions for a role
 * - GET /api/admin/permissions/matrix - Full permission matrix
 * - GET /api/admin/permissions/user/{username} - Permission codes for user
 */
@RestController
@RequestMapping("/admin/permissions")
@RequiredArgsConstructor
@Slf4j
public class PermissionQueryController {

    private final PermissionQueryService permissionQueryService;

    /**
     * Get all permissions.
     */
    @GetMapping
    @PreAuthorize("hasPermission(null, 'CAN_MANAGE_ROLES') or hasPermission(null, 'CAN_VIEW_AUDIT')")
    public ResponseEntity<ApiResponse<List<PermissionQueryDTO>>> getAllPermissions() {
        log.debug("Request to get all permissions");
        List<PermissionQueryDTO> permissions = permissionQueryService.getAllPermissions();
        return ResponseEntity.ok(ApiResponse.success("Permissions retrieved", permissions));
    }

    /**
     * Get all modules.
     */
    @GetMapping("/modules")
    @PreAuthorize("hasPermission(null, 'CAN_MANAGE_ROLES')")
    public ResponseEntity<ApiResponse<List<String>>> getAllModules() {
        log.debug("Request to get all modules");
        List<String> modules = permissionQueryService.getAllModules();
        return ResponseEntity.ok(ApiResponse.success("Modules retrieved", modules));
    }

    /**
     * Get permissions by module.
     */
    @GetMapping("/module/{module}")
    @PreAuthorize("hasPermission(null, 'CAN_MANAGE_ROLES')")
    public ResponseEntity<ApiResponse<List<PermissionQueryDTO>>> getPermissionsByModule(
            @PathVariable String module) {
        log.debug("Request to get permissions for module: {}", module);
        List<PermissionQueryDTO> permissions = permissionQueryService.getPermissionsByModule(module);
        return ResponseEntity.ok(ApiResponse.success("Permissions by module retrieved", permissions));
    }

    /**
     * Get permissions grouped by module.
     */
    @GetMapping("/grouped")
    @PreAuthorize("hasPermission(null, 'CAN_MANAGE_ROLES')")
    public ResponseEntity<ApiResponse<Map<String, List<PermissionQueryDTO>>>> getPermissionsGroupedByModule() {
        log.debug("Request to get permissions grouped by module");
        Map<String, List<PermissionQueryDTO>> grouped = permissionQueryService.getPermissionsGroupedByModule();
        return ResponseEntity.ok(ApiResponse.success("Permissions grouped retrieved", grouped));
    }

    /**
     * Get permission by code.
     */
    @GetMapping("/{code}")
    @PreAuthorize("hasPermission(null, 'CAN_MANAGE_ROLES')")
    public ResponseEntity<?> getPermissionByCode(@PathVariable String code) {
        log.debug("Request to get permission by code: {}", code);
        return permissionQueryService.getPermissionByCode(code)
                .map(p -> ResponseEntity.ok(ApiResponse.success("Permission retrieved", p)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get permissions for a specific role.
     */
    @GetMapping("/role/{roleId}")
    @PreAuthorize("hasPermission(null, 'CAN_MANAGE_ROLES')")
    public ResponseEntity<ApiResponse<Set<PermissionQueryDTO>>> getPermissionsForRole(
            @PathVariable Long roleId) {
        log.debug("Request to get permissions for role ID: {}", roleId);
        Set<PermissionQueryDTO> permissions = permissionQueryService.getPermissionsForRole(roleId);
        return ResponseEntity.ok(ApiResponse.success("Role permissions retrieved", permissions));
    }

    /**
     * Get permission matrix (all roles with their permissions).
     */
    @GetMapping("/matrix")
    @PreAuthorize("hasPermission(null, 'CAN_MANAGE_ROLES')")
    public ResponseEntity<ApiResponse<List<PermissionQueryService.RolePermissionMatrix>>> getPermissionMatrix() {
        log.debug("Request to get permission matrix");
        List<PermissionQueryService.RolePermissionMatrix> matrix = permissionQueryService.getPermissionMatrix();
        return ResponseEntity.ok(ApiResponse.success("Permission matrix retrieved", matrix));
    }

    /**
     * Get permission codes for a user (aggregated from all roles).
     */
    @GetMapping("/user/{username}")
    @PreAuthorize("hasPermission(null, 'CAN_MANAGE_USERS') or #username == authentication.name")
    public ResponseEntity<ApiResponse<Set<String>>> getPermissionCodesForUser(
            @PathVariable String username) {
        log.debug("Request to get permission codes for user: {}", username);
        Set<String> codes = permissionQueryService.getPermissionCodesForUser(username);
        return ResponseEntity.ok(ApiResponse.success("User permissions retrieved", codes));
    }

    /**
     * Get current user's permissions (for frontend authorization).
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Set<String>>> getMyPermissions(
            @RequestAttribute("username") String username) {
        log.debug("Request to get my permissions");
        Set<String> codes = permissionQueryService.getPermissionCodesForUser(username);
        return ResponseEntity.ok(ApiResponse.success("My permissions retrieved", codes));
    }
}
