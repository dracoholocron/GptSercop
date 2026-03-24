package com.globalcmx.api.security.controller;

import com.globalcmx.api.security.command.*;
import com.globalcmx.api.security.dto.ApiEndpointDTO;
import com.globalcmx.api.security.dto.MenuItemDTO;
import com.globalcmx.api.security.service.MenuConfigService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/menu")
public class MenuConfigController {

    private final MenuConfigService menuConfigService;

    public MenuConfigController(MenuConfigService menuConfigService) {
        this.menuConfigService = menuConfigService;
    }

    // ==================== USER QUERIES ====================

    /**
     * Get menu items for the current authenticated user based on their permissions.
     * This is used by the frontend sidebar to show only allowed menu options.
     */
    @GetMapping("/user")
    public ResponseEntity<List<MenuItemDTO>> getMenuForCurrentUser() {
        return ResponseEntity.ok(menuConfigService.getMenuForCurrentUser());
    }

    // ==================== ADMIN QUERIES ====================

    /**
     * Get all menu items for admin configuration.
     */
    @GetMapping("/admin/items")
    @PreAuthorize("hasAuthority('MANAGE_SECURITY_CONFIG') or hasRole('ADMIN')")
    public ResponseEntity<List<MenuItemDTO>> getAllMenuItems() {
        return ResponseEntity.ok(menuConfigService.getAllMenuItems());
    }

    /**
     * Get all API endpoints for admin configuration.
     */
    @GetMapping("/admin/endpoints")
    @PreAuthorize("hasAuthority('MANAGE_SECURITY_CONFIG') or hasRole('ADMIN')")
    public ResponseEntity<List<ApiEndpointDTO>> getAllApiEndpoints() {
        return ResponseEntity.ok(menuConfigService.getAllApiEndpoints());
    }

    /**
     * Get all API endpoint modules.
     */
    @GetMapping("/admin/endpoints/modules")
    @PreAuthorize("hasAuthority('MANAGE_SECURITY_CONFIG') or hasRole('ADMIN')")
    public ResponseEntity<List<String>> getApiModules() {
        return ResponseEntity.ok(menuConfigService.getApiModules());
    }

    // ==================== ADMIN COMMANDS - MENU ITEMS ====================

    /**
     * Create a new menu item.
     */
    @PostMapping("/admin/items")
    @PreAuthorize("hasAuthority('MANAGE_SECURITY_CONFIG') or hasRole('ADMIN')")
    public ResponseEntity<MenuItemDTO> createMenuItem(@RequestBody CreateMenuItemCommand command) {
        return ResponseEntity.ok(menuConfigService.createMenuItem(command));
    }

    /**
     * Update an existing menu item.
     */
    @PutMapping("/admin/items/{id}")
    @PreAuthorize("hasAuthority('MANAGE_SECURITY_CONFIG') or hasRole('ADMIN')")
    public ResponseEntity<MenuItemDTO> updateMenuItem(
            @PathVariable Long id,
            @RequestBody UpdateMenuItemCommand command) {
        // Ensure ID matches
        UpdateMenuItemCommand updatedCommand = new UpdateMenuItemCommand(
            id,
            command.code(),
            command.parentId(),
            command.labelKey(),
            command.icon(),
            command.path(),
            command.displayOrder(),
            command.isSection(),
            command.isActive(),
            command.permissionCodes(),
            command.apiEndpointCodes()
        );
        return ResponseEntity.ok(menuConfigService.updateMenuItem(updatedCommand));
    }

    /**
     * Reorder menu items (batch update of parentId and displayOrder).
     */
    @PutMapping("/admin/items/reorder")
    @PreAuthorize("hasAuthority('MANAGE_SECURITY_CONFIG') or hasRole('ADMIN')")
    public ResponseEntity<Void> reorderMenuItems(@RequestBody ReorderMenuItemsCommand command) {
        menuConfigService.reorderMenuItems(command);
        return ResponseEntity.ok().build();
    }

    /**
     * Delete a menu item.
     */
    @DeleteMapping("/admin/items/{id}")
    @PreAuthorize("hasAuthority('MANAGE_SECURITY_CONFIG') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteMenuItem(@PathVariable Long id) {
        menuConfigService.deleteMenuItem(id);
        return ResponseEntity.noContent().build();
    }

    // ==================== ADMIN COMMANDS - API ENDPOINTS ====================

    /**
     * Create a new API endpoint.
     */
    @PostMapping("/admin/endpoints")
    @PreAuthorize("hasAuthority('MANAGE_SECURITY_CONFIG') or hasRole('ADMIN')")
    public ResponseEntity<ApiEndpointDTO> createApiEndpoint(@RequestBody CreateApiEndpointCommand command) {
        return ResponseEntity.ok(menuConfigService.createApiEndpoint(command));
    }

    /**
     * Update an existing API endpoint.
     */
    @PutMapping("/admin/endpoints/{id}")
    @PreAuthorize("hasAuthority('MANAGE_SECURITY_CONFIG') or hasRole('ADMIN')")
    public ResponseEntity<ApiEndpointDTO> updateApiEndpoint(
            @PathVariable Long id,
            @RequestBody UpdateApiEndpointCommand command) {
        // Ensure ID matches
        UpdateApiEndpointCommand updatedCommand = new UpdateApiEndpointCommand(
            id,
            command.code(),
            command.httpMethod(),
            command.urlPattern(),
            command.description(),
            command.module(),
            command.isPublic(),
            command.isActive(),
            command.permissionCodes()
        );
        return ResponseEntity.ok(menuConfigService.updateApiEndpoint(updatedCommand));
    }

    /**
     * Delete an API endpoint.
     */
    @DeleteMapping("/admin/endpoints/{id}")
    @PreAuthorize("hasAuthority('MANAGE_SECURITY_CONFIG') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteApiEndpoint(@PathVariable Long id) {
        menuConfigService.deleteApiEndpoint(id);
        return ResponseEntity.noContent().build();
    }
}
