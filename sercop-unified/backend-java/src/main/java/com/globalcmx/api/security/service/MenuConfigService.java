package com.globalcmx.api.security.service;

import com.globalcmx.api.security.service.ApiEndpointCacheService;
import com.globalcmx.api.security.command.*;
import com.globalcmx.api.security.dto.ApiEndpointDTO;
import com.globalcmx.api.security.dto.MenuItemDTO;
import com.globalcmx.api.security.entity.ApiEndpoint;
import com.globalcmx.api.security.entity.MenuItem;
import com.globalcmx.api.security.entity.Permission;
import com.globalcmx.api.security.repository.ApiEndpointRepository;
import com.globalcmx.api.security.repository.MenuItemRepository;
import com.globalcmx.api.security.repository.PermissionRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class MenuConfigService {

    private final MenuItemRepository menuItemRepository;
    private final ApiEndpointRepository apiEndpointRepository;
    private final PermissionRepository permissionRepository;
    private final ApiEndpointCacheService apiEndpointCacheService;

    public MenuConfigService(MenuItemRepository menuItemRepository,
                            ApiEndpointCacheService apiEndpointCacheService,
                            ApiEndpointRepository apiEndpointRepository,
                            PermissionRepository permissionRepository) {
        this.apiEndpointCacheService = apiEndpointCacheService;
        this.menuItemRepository = menuItemRepository;
        this.apiEndpointRepository = apiEndpointRepository;
        this.permissionRepository = permissionRepository;
    }

    // ==================== QUERIES ====================

    /**
     * Get menu items for the current authenticated user based on their permissions
     */
    @Transactional(readOnly = true)
    public List<MenuItemDTO> getMenuForCurrentUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return Collections.emptyList();
        }

        // Extract permission codes from user authorities
        List<String> userPermissions = authentication.getAuthorities().stream()
            .map(auth -> auth.getAuthority())
            .filter(auth -> !auth.startsWith("ROLE_"))
            .collect(Collectors.toList());

        // Get root menu items with children eagerly loaded
        List<MenuItem> rootMenus = menuItemRepository.findAllRootMenusWithPermissions();
        
        return rootMenus.stream()
            .map(menu -> toDTO(menu, userPermissions))
            .filter(Objects::nonNull)
            .filter(dto -> dto.getPath() != null || (dto.getChildren() != null && !dto.getChildren().isEmpty()))
            .collect(Collectors.toList());
    }

    /**
     * Get all menu items for admin configuration
     */
    @Transactional(readOnly = true)
    public List<MenuItemDTO> getAllMenuItems() {
        List<MenuItem> allMenus = menuItemRepository.findAllByIsActiveTrueOrderByDisplayOrder();
        return allMenus.stream()
            .map(this::toAdminDTO)
            .collect(Collectors.toList());
    }

    /**
     * Get all API endpoints for admin configuration
     */
    @Transactional(readOnly = true)
    public List<ApiEndpointDTO> getAllApiEndpoints() {
        List<ApiEndpoint> endpoints = apiEndpointRepository.findByIsActiveTrueOrderByModule();
        return endpoints.stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    /**
     * Get API endpoint modules
     */
    @Transactional(readOnly = true)
    public List<String> getApiModules() {
        return apiEndpointRepository.findAllModules();
    }

    // ==================== COMMANDS ====================

    /**
     * Create a new menu item
     */
    public MenuItemDTO createMenuItem(CreateMenuItemCommand command) {
        if (menuItemRepository.existsByCode(command.code())) {
            throw new IllegalArgumentException("Menu item with code " + command.code() + " already exists");
        }

        MenuItem menuItem = new MenuItem();
        menuItem.setCode(command.code());
        menuItem.setLabelKey(command.labelKey());
        menuItem.setIcon(command.icon());
        menuItem.setPath(command.path());
        menuItem.setDisplayOrder(command.displayOrder() != null ? command.displayOrder() : 0);
        menuItem.setIsSection(command.isSection() != null ? command.isSection() : false);
        menuItem.setIsActive(true);
        menuItem.setCreatedBy(getCurrentUsername());

        if (command.parentId() != null) {
            menuItemRepository.findById(command.parentId())
                .ifPresent(menuItem::setParent);
        }

        // Set permissions
        if (command.permissionCodes() != null && !command.permissionCodes().isEmpty()) {
            Set<Permission> permissions = new HashSet<>(
                permissionRepository.findByCodeIn(command.permissionCodes())
            );
            menuItem.setRequiredPermissions(permissions);
        }

        // Set API endpoints
        if (command.apiEndpointCodes() != null && !command.apiEndpointCodes().isEmpty()) {
            Set<ApiEndpoint> endpoints = command.apiEndpointCodes().stream()
                .map(apiEndpointRepository::findByCode)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toSet());
            menuItem.setApiEndpoints(endpoints);
        }

        MenuItem saved = menuItemRepository.save(menuItem);
        return toAdminDTO(saved);
    }

    /**
     * Update an existing menu item
     */
    public MenuItemDTO updateMenuItem(UpdateMenuItemCommand command) {
        MenuItem menuItem = menuItemRepository.findById(command.id())
            .orElseThrow(() -> new IllegalArgumentException("Menu item not found: " + command.id()));

        menuItem.setCode(command.code());
        menuItem.setLabelKey(command.labelKey());
        menuItem.setIcon(command.icon());
        menuItem.setPath(command.path());
        menuItem.setDisplayOrder(command.displayOrder());
        menuItem.setIsSection(command.isSection());
        menuItem.setIsActive(command.isActive());
        menuItem.setUpdatedBy(getCurrentUsername());

        if (command.parentId() != null) {
            menuItemRepository.findById(command.parentId())
                .ifPresent(menuItem::setParent);
        } else {
            menuItem.setParent(null);
        }

        // Update permissions
        if (command.permissionCodes() != null) {
            Set<Permission> permissions = new HashSet<>(
                permissionRepository.findByCodeIn(command.permissionCodes())
            );
            menuItem.setRequiredPermissions(permissions);
        }

        // Update API endpoints
        if (command.apiEndpointCodes() != null) {
            Set<ApiEndpoint> endpoints = command.apiEndpointCodes().stream()
                .map(apiEndpointRepository::findByCode)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toSet());
            menuItem.setApiEndpoints(endpoints);
        }

        MenuItem saved = menuItemRepository.save(menuItem);
        return toAdminDTO(saved);
    }

    /**
     * Reorder menu items (batch update of parentId and displayOrder)
     */
    public void reorderMenuItems(ReorderMenuItemsCommand command) {
        for (ReorderMenuItemsCommand.ReorderItem item : command.items()) {
            Optional<MenuItem> menuItemOpt = menuItemRepository.findById(item.id());
            if (menuItemOpt.isEmpty()) {
                continue; // Skip items that no longer exist
            }
            MenuItem menuItem = menuItemOpt.get();

            menuItem.setDisplayOrder(item.displayOrder());

            if (item.parentId() != null) {
                menuItemRepository.findById(item.parentId())
                    .ifPresent(menuItem::setParent);
            } else {
                menuItem.setParent(null);
            }

            menuItem.setUpdatedBy(getCurrentUsername());
            menuItemRepository.save(menuItem);
        }
    }

    /**
     * Delete a menu item
     */
    public void deleteMenuItem(Long id) {
        menuItemRepository.deleteById(id);
    }

    /**
     * Create a new API endpoint
     */
    public ApiEndpointDTO createApiEndpoint(CreateApiEndpointCommand command) {
        if (apiEndpointRepository.existsByCode(command.code())) {
            throw new IllegalArgumentException("API endpoint with code " + command.code() + " already exists");
        }

        ApiEndpoint endpoint = new ApiEndpoint();
        endpoint.setCode(command.code());
        endpoint.setHttpMethod(command.httpMethod());
        endpoint.setUrlPattern(command.urlPattern());
        endpoint.setDescription(command.description());
        endpoint.setModule(command.module());
        endpoint.setIsPublic(command.isPublic() != null ? command.isPublic() : false);
        endpoint.setIsActive(true);
        endpoint.setCreatedBy(getCurrentUsername());

        // Set permissions
        if (command.permissionCodes() != null && !command.permissionCodes().isEmpty()) {
            Set<Permission> permissions = new HashSet<>(
                permissionRepository.findByCodeIn(command.permissionCodes())
            );
            endpoint.setRequiredPermissions(permissions);
        }

        ApiEndpoint saved = apiEndpointRepository.save(endpoint);
        apiEndpointCacheService.invalidateCache();
        return toDTO(saved);
    }

    /**
     * Update an existing API endpoint
     */
    public ApiEndpointDTO updateApiEndpoint(UpdateApiEndpointCommand command) {
        ApiEndpoint endpoint = apiEndpointRepository.findById(command.id())
            .orElseThrow(() -> new IllegalArgumentException("API endpoint not found: " + command.id()));

        endpoint.setCode(command.code());
        endpoint.setHttpMethod(command.httpMethod());
        endpoint.setUrlPattern(command.urlPattern());
        endpoint.setDescription(command.description());
        endpoint.setModule(command.module());
        endpoint.setIsPublic(command.isPublic());
        endpoint.setIsActive(command.isActive());
        endpoint.setUpdatedBy(getCurrentUsername());

        // Update permissions
        if (command.permissionCodes() != null) {
            Set<Permission> permissions = new HashSet<>(
                permissionRepository.findByCodeIn(command.permissionCodes())
            );
            endpoint.setRequiredPermissions(permissions);
        }

        ApiEndpoint saved = apiEndpointRepository.save(endpoint);
        apiEndpointCacheService.invalidateCache();
        return toDTO(saved);
    }

    /**
     * Delete an API endpoint
     */
    public void deleteApiEndpoint(Long id) {
        apiEndpointRepository.deleteById(id);
        apiEndpointCacheService.invalidateCache();
    }

    // ==================== HELPERS ====================

    private MenuItemDTO toDTO(MenuItem menu, List<String> userPermissions) {
        // Check if user has required permissions
        Set<Permission> requiredPerms = menu.getRequiredPermissions();
        if (requiredPerms != null && !requiredPerms.isEmpty()) {
            boolean hasPermission = requiredPerms.stream()
                .anyMatch(p -> userPermissions.contains(p.getCode()));
            if (!hasPermission) {
                return null; // User doesn't have permission to see this menu
            }
        }

        MenuItemDTO dto = new MenuItemDTO();
        dto.setId(menu.getId());
        dto.setCode(menu.getCode());
        dto.setLabelKey(menu.getLabelKey());
        dto.setIcon(menu.getIcon());
        dto.setPath(menu.getPath());
        dto.setDisplayOrder(menu.getDisplayOrder());
        dto.setIsSection(menu.getIsSection());

        // Process children recursively
        Set<MenuItem> children = menu.getChildren();
        if (children != null && !children.isEmpty()) {
            List<MenuItemDTO> childDTOs = children.stream()
                .filter(MenuItem::getIsActive)
                .sorted(Comparator.comparing(MenuItem::getDisplayOrder))
                .map(child -> toDTO(child, userPermissions))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
            dto.setChildren(childDTOs);
        }

        return dto;
    }

    private MenuItemDTO toAdminDTO(MenuItem menu) {
        MenuItemDTO dto = new MenuItemDTO();
        dto.setId(menu.getId());
        dto.setCode(menu.getCode());
        dto.setParentId(menu.getParent() != null ? menu.getParent().getId() : null);
        dto.setLabelKey(menu.getLabelKey());
        dto.setIcon(menu.getIcon());
        dto.setPath(menu.getPath());
        dto.setDisplayOrder(menu.getDisplayOrder());
        dto.setIsSection(menu.getIsSection());
        dto.setIsActive(menu.getIsActive());

        dto.setRequiredPermissions(menu.getRequiredPermissions().stream()
            .map(Permission::getCode)
            .collect(Collectors.toList()));

        dto.setApiEndpointCodes(menu.getApiEndpoints().stream()
            .map(ApiEndpoint::getCode)
            .collect(Collectors.toList()));

        return dto;
    }

    private ApiEndpointDTO toDTO(ApiEndpoint endpoint) {
        ApiEndpointDTO dto = new ApiEndpointDTO();
        dto.setId(endpoint.getId());
        dto.setCode(endpoint.getCode());
        dto.setHttpMethod(endpoint.getHttpMethod());
        dto.setUrlPattern(endpoint.getUrlPattern());
        dto.setDescription(endpoint.getDescription());
        dto.setModule(endpoint.getModule());
        dto.setIsPublic(endpoint.getIsPublic());
        dto.setIsActive(endpoint.getIsActive());

        dto.setRequiredPermissions(endpoint.getRequiredPermissions().stream()
            .map(Permission::getCode)
            .collect(Collectors.toList()));

        return dto;
    }

    private String getCurrentUsername() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }
}
