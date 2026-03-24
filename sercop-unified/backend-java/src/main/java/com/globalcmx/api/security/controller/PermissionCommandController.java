package com.globalcmx.api.security.controller;

import com.globalcmx.api.dto.ApiResponse;
import com.globalcmx.api.dto.command.AssignPermissionToRoleCommand;
import com.globalcmx.api.dto.command.RevokePermissionFromRoleCommand;
import com.globalcmx.api.security.entity.Permission;
import com.globalcmx.api.service.command.PermissionCommandService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Command Controller for Permission write operations.
 * Follows CQRS pattern - handles commands only.
 *
 * Endpoints:
 * - POST /api/admin/permissions/role/{roleId}/assign - Assign permission to role
 * - DELETE /api/admin/permissions/role/{roleId}/revoke - Revoke permission from role
 * - POST /api/admin/permissions - Create new permission
 * - DELETE /api/admin/permissions/{code} - Delete permission
 */
@RestController
@RequestMapping("/admin/permissions")
@RequiredArgsConstructor
@Slf4j
public class PermissionCommandController {

    private final PermissionCommandService permissionCommandService;

    /**
     * Assign a permission to a role.
     */
    @PostMapping("/role/{roleId}/assign")
    @PreAuthorize("hasPermission(null, 'CAN_MANAGE_ROLES')")
    public ResponseEntity<ApiResponse<Void>> assignPermissionToRole(
            @PathVariable Long roleId,
            @RequestBody @Valid AssignPermissionRequest request) {

        log.info("Request to assign permission {} to role {}", request.permissionCode(), roleId);

        try {
            AssignPermissionToRoleCommand command = new AssignPermissionToRoleCommand(
                    roleId, request.permissionCode());
            permissionCommandService.assignPermissionToRole(command);
            return ResponseEntity.ok(ApiResponse.success("Permission assigned successfully", null));
        } catch (EntityNotFoundException e) {
            log.error("Entity not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error assigning permission", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("error.permission.assign"));
        }
    }

    /**
     * Revoke a permission from a role.
     */
    @DeleteMapping("/role/{roleId}/revoke")
    @PreAuthorize("hasPermission(null, 'CAN_MANAGE_ROLES')")
    public ResponseEntity<ApiResponse<Void>> revokePermissionFromRole(
            @PathVariable Long roleId,
            @RequestParam @NotBlank String permissionCode) {

        log.info("Request to revoke permission {} from role {}", permissionCode, roleId);

        try {
            RevokePermissionFromRoleCommand command = new RevokePermissionFromRoleCommand(
                    roleId, permissionCode);
            permissionCommandService.revokePermissionFromRole(command);
            return ResponseEntity.ok(ApiResponse.success("Permission revoked successfully", null));
        } catch (EntityNotFoundException e) {
            log.error("Entity not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error revoking permission", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("error.permission.revoke"));
        }
    }

    /**
     * Create a new permission.
     */
    @PostMapping
    @PreAuthorize("hasPermission(null, 'CAN_MANAGE_ROLES')")
    public ResponseEntity<ApiResponse<PermissionResponse>> createPermission(
            @RequestBody @Valid CreatePermissionRequest request) {

        log.info("Request to create permission: {}", request.code());

        try {
            Permission permission = permissionCommandService.createPermission(
                    request.code(),
                    request.name(),
                    request.description(),
                    request.module()
            );

            PermissionResponse response = new PermissionResponse(
                    permission.getCode(),
                    permission.getName(),
                    permission.getDescription(),
                    permission.getModule()
            );

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Permission created successfully", response));
        } catch (IllegalArgumentException e) {
            log.error("Invalid argument: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating permission", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("error.permission.create"));
        }
    }

    /**
     * Delete a permission.
     */
    @DeleteMapping("/{code}")
    @PreAuthorize("hasPermission(null, 'CAN_MANAGE_ROLES')")
    public ResponseEntity<ApiResponse<Void>> deletePermission(@PathVariable String code) {
        log.warn("Request to delete permission: {}", code);

        try {
            permissionCommandService.deletePermission(code);
            return ResponseEntity.ok(ApiResponse.success("Permission deleted successfully", null));
        } catch (EntityNotFoundException e) {
            log.error("Permission not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error deleting permission", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("error.permission.delete"));
        }
    }

    /**
     * Bulk assign permissions to a role.
     */
    @PostMapping("/role/{roleId}/bulk-assign")
    @PreAuthorize("hasPermission(null, 'CAN_MANAGE_ROLES')")
    public ResponseEntity<ApiResponse<BulkOperationResult>> bulkAssignPermissions(
            @PathVariable Long roleId,
            @RequestBody @Valid BulkPermissionRequest request) {

        log.info("Request to bulk assign {} permissions to role {}",
                request.permissionCodes().size(), roleId);

        int success = 0;
        int failed = 0;

        for (String permissionCode : request.permissionCodes()) {
            try {
                AssignPermissionToRoleCommand command = new AssignPermissionToRoleCommand(
                        roleId, permissionCode);
                permissionCommandService.assignPermissionToRole(command);
                success++;
            } catch (Exception e) {
                log.warn("Failed to assign permission {}: {}", permissionCode, e.getMessage());
                failed++;
            }
        }

        BulkOperationResult result = new BulkOperationResult(success, failed);
        return ResponseEntity.ok(ApiResponse.success("Bulk assign completed", result));
    }

    /**
     * Bulk revoke permissions from a role.
     */
    @DeleteMapping("/role/{roleId}/bulk-revoke")
    @PreAuthorize("hasPermission(null, 'CAN_MANAGE_ROLES')")
    public ResponseEntity<ApiResponse<BulkOperationResult>> bulkRevokePermissions(
            @PathVariable Long roleId,
            @RequestBody @Valid BulkPermissionRequest request) {

        log.info("Request to bulk revoke {} permissions from role {}",
                request.permissionCodes().size(), roleId);

        int success = 0;
        int failed = 0;

        for (String permissionCode : request.permissionCodes()) {
            try {
                RevokePermissionFromRoleCommand command = new RevokePermissionFromRoleCommand(
                        roleId, permissionCode);
                permissionCommandService.revokePermissionFromRole(command);
                success++;
            } catch (Exception e) {
                log.warn("Failed to revoke permission {}: {}", permissionCode, e.getMessage());
                failed++;
            }
        }

        BulkOperationResult result = new BulkOperationResult(success, failed);
        return ResponseEntity.ok(ApiResponse.success("Bulk revoke completed", result));
    }

    // Request/Response DTOs

    public record AssignPermissionRequest(
            @NotBlank(message = "Permission code is required")
            String permissionCode
    ) {}

    public record CreatePermissionRequest(
            @NotBlank(message = "Code is required")
            String code,
            @NotBlank(message = "Name is required")
            String name,
            String description,
            @NotBlank(message = "Module is required")
            String module
    ) {}

    public record BulkPermissionRequest(
            @NotNull(message = "Permission codes are required")
            java.util.List<String> permissionCodes
    ) {}

    public record PermissionResponse(
            String code,
            String name,
            String description,
            String module
    ) {}

    public record BulkOperationResult(
            int success,
            int failed
    ) {}
}
