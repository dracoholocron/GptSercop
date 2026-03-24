package com.globalcmx.api.security.service;

import com.globalcmx.api.security.command.*;
import com.globalcmx.api.security.dto.ApiEndpointDTO;
import com.globalcmx.api.security.dto.MenuItemDTO;
import com.globalcmx.api.security.entity.ApiEndpoint;
import com.globalcmx.api.security.entity.MenuItem;
import com.globalcmx.api.security.entity.Permission;
import com.globalcmx.api.security.repository.ApiEndpointRepository;
import com.globalcmx.api.security.repository.MenuItemRepository;
import com.globalcmx.api.security.repository.PermissionRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MenuConfigService - Dynamic Menu Tests")
class MenuConfigServiceTest {

    @Mock
    private MenuItemRepository menuItemRepository;

    @Mock
    private ApiEndpointRepository apiEndpointRepository;

    @Mock
    private PermissionRepository permissionRepository;

    @Mock
    private ApiEndpointCacheService apiEndpointCacheService;

    @InjectMocks
    private MenuConfigService menuConfigService;

    private Permission createPermission(String code) {
        Permission permission = new Permission();
        permission.setCode(code);
        permission.setName(code);
        permission.setModule("TEST");
        return permission;
    }

    private MenuItem createMenuItem(Long id, String code, String labelKey, String icon, String path) {
        MenuItem menuItem = new MenuItem();
        menuItem.setId(id);
        menuItem.setCode(code);
        menuItem.setLabelKey(labelKey);
        menuItem.setIcon(icon);
        menuItem.setPath(path);
        menuItem.setDisplayOrder(0);
        menuItem.setIsSection(false);
        menuItem.setIsActive(true);
        menuItem.setRequiredPermissions(new HashSet<>());
        menuItem.setApiEndpoints(new HashSet<>());
        menuItem.setChildren(new HashSet<>());
        return menuItem;
    }

    private ApiEndpoint createApiEndpoint(Long id, String code, String method, String url) {
        ApiEndpoint endpoint = new ApiEndpoint();
        endpoint.setId(id);
        endpoint.setCode(code);
        endpoint.setHttpMethod(method);
        endpoint.setUrlPattern(url);
        endpoint.setIsPublic(false);
        endpoint.setIsActive(true);
        endpoint.setRequiredPermissions(new HashSet<>());
        return endpoint;
    }

    private void mockAuthentication(String... permissions) {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);

        List<GrantedAuthority> authorities = new ArrayList<>();
        for (String permission : permissions) {
            authorities.add(new SimpleGrantedAuthority(permission));
        }

        lenient().when(authentication.getAuthorities()).thenReturn((Collection) authorities);
        lenient().when(authentication.getName()).thenReturn("testuser@example.com");
        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    @Nested
    @DisplayName("getMenuForCurrentUser")
    class GetMenuForCurrentUserTests {

        @Test
        @DisplayName("Should return empty list when no authentication")
        void shouldReturnEmptyListWhenNoAuth() {
            SecurityContextHolder.clearContext();

            List<MenuItemDTO> result = menuConfigService.getMenuForCurrentUser();

            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("Should return all menu items for user with permissions")
        void shouldReturnAllMenuItemsForUserWithPermissions() {
            mockAuthentication("VIEW_DASHBOARD", "VIEW_WORKBOX");

            Permission dashboardPerm = createPermission("VIEW_DASHBOARD");
            Permission workboxPerm = createPermission("VIEW_WORKBOX");

            MenuItem dashboard = createMenuItem(1L, "DASHBOARD", "menu.dashboard", "FiHome", "/dashboard");
            dashboard.getRequiredPermissions().add(dashboardPerm);

            MenuItem workbox = createMenuItem(2L, "WORKBOX", "menu.workbox", "FiBriefcase", "/workbox");
            workbox.getRequiredPermissions().add(workboxPerm);

            when(menuItemRepository.findAllRootMenusWithPermissions())
                    .thenReturn(Arrays.asList(dashboard, workbox));

            List<MenuItemDTO> result = menuConfigService.getMenuForCurrentUser();

            assertEquals(2, result.size());
            assertEquals("menu.dashboard", result.get(0).getLabelKey());
            assertEquals("menu.workbox", result.get(1).getLabelKey());
        }

        @Test
        @DisplayName("Should filter menu items based on permissions")
        void shouldFilterMenuItemsBasedOnPermissions() {
            mockAuthentication("VIEW_DASHBOARD");

            Permission dashboardPerm = createPermission("VIEW_DASHBOARD");
            Permission adminPerm = createPermission("ADMIN");

            MenuItem dashboard = createMenuItem(1L, "DASHBOARD", "menu.dashboard", "FiHome", "/dashboard");
            dashboard.getRequiredPermissions().add(dashboardPerm);

            MenuItem admin = createMenuItem(2L, "ADMIN", "menu.admin", "FiShield", "/admin");
            admin.getRequiredPermissions().add(adminPerm);

            when(menuItemRepository.findAllRootMenusWithPermissions())
                    .thenReturn(Arrays.asList(dashboard, admin));

            List<MenuItemDTO> result = menuConfigService.getMenuForCurrentUser();

            assertEquals(1, result.size());
            assertEquals("menu.dashboard", result.get(0).getLabelKey());
        }

        @Test
        @DisplayName("Should return menu items without permissions to all users")
        void shouldReturnMenuItemsWithoutPermissionsToAllUsers() {
            mockAuthentication();

            MenuItem publicMenu = createMenuItem(1L, "PUBLIC", "menu.public", "FiGlobe", "/public");

            when(menuItemRepository.findAllRootMenusWithPermissions())
                    .thenReturn(Arrays.asList(publicMenu));

            List<MenuItemDTO> result = menuConfigService.getMenuForCurrentUser();

            assertEquals(1, result.size());
        }
    }

    @Nested
    @DisplayName("Menu Item Commands")
    class MenuItemCommandTests {

        @BeforeEach
        void setUp() {
            mockAuthentication("ADMIN");
        }

        @Test
        @DisplayName("Should create menu item successfully")
        void shouldCreateMenuItemSuccessfully() {
            CreateMenuItemCommand command = new CreateMenuItemCommand(
                    "NEW_ITEM", null, "menu.newItem", "FiPlus", "/new-item",
                    10, false, null, null
            );

            when(menuItemRepository.existsByCode("NEW_ITEM")).thenReturn(false);
            when(menuItemRepository.save(any(MenuItem.class))).thenAnswer(invocation -> {
                MenuItem saved = invocation.getArgument(0);
                saved.setId(1L);
                return saved;
            });

            MenuItemDTO result = menuConfigService.createMenuItem(command);

            assertNotNull(result);
            assertEquals("NEW_ITEM", result.getCode());
            assertEquals("menu.newItem", result.getLabelKey());
            verify(menuItemRepository).save(any(MenuItem.class));
        }

        @Test
        @DisplayName("Should throw exception when creating duplicate menu item")
        void shouldThrowExceptionWhenCreatingDuplicateMenuItem() {
            CreateMenuItemCommand command = new CreateMenuItemCommand(
                    "EXISTING", null, "menu.existing", "FiFile", "/existing",
                    0, false, null, null
            );

            when(menuItemRepository.existsByCode("EXISTING")).thenReturn(true);

            assertThrows(IllegalArgumentException.class, () ->
                menuConfigService.createMenuItem(command)
            );
        }

        @Test
        @DisplayName("Should delete menu item")
        void shouldDeleteMenuItem() {
            menuConfigService.deleteMenuItem(1L);

            verify(menuItemRepository).deleteById(1L);
        }
    }

    @Nested
    @DisplayName("API Endpoint Commands")
    class ApiEndpointCommandTests {

        @BeforeEach
        void setUp() {
            mockAuthentication("ADMIN");
        }

        @Test
        @DisplayName("Should create API endpoint successfully")
        void shouldCreateApiEndpointSuccessfully() {
            CreateApiEndpointCommand command = new CreateApiEndpointCommand(
                    "GET_DASHBOARD", "GET", "/api/dashboard",
                    "Get dashboard data", "DASHBOARD", false, null
            );

            when(apiEndpointRepository.existsByCode("GET_DASHBOARD")).thenReturn(false);
            when(apiEndpointRepository.save(any(ApiEndpoint.class))).thenAnswer(invocation -> {
                ApiEndpoint saved = invocation.getArgument(0);
                saved.setId(1L);
                return saved;
            });

            ApiEndpointDTO result = menuConfigService.createApiEndpoint(command);

            assertNotNull(result);
            assertEquals("GET_DASHBOARD", result.getCode());
            assertEquals("GET", result.getHttpMethod());
            assertEquals("/api/dashboard", result.getUrlPattern());
        }

        @Test
        @DisplayName("Should throw exception when creating duplicate API endpoint")
        void shouldThrowExceptionWhenCreatingDuplicateApiEndpoint() {
            CreateApiEndpointCommand command = new CreateApiEndpointCommand(
                    "EXISTING", "GET", "/api/existing",
                    null, null, false, null
            );

            when(apiEndpointRepository.existsByCode("EXISTING")).thenReturn(true);

            assertThrows(IllegalArgumentException.class, () ->
                menuConfigService.createApiEndpoint(command)
            );
        }

        @Test
        @DisplayName("Should delete API endpoint")
        void shouldDeleteApiEndpoint() {
            menuConfigService.deleteApiEndpoint(1L);

            verify(apiEndpointRepository).deleteById(1L);
        }
    }

    @Nested
    @DisplayName("Admin Queries")
    class AdminQueryTests {

        @Test
        @DisplayName("Should return all menu items for admin")
        void shouldReturnAllMenuItemsForAdmin() {
            MenuItem dashboard = createMenuItem(1L, "DASHBOARD", "menu.dashboard", "FiHome", "/dashboard");
            MenuItem workbox = createMenuItem(2L, "WORKBOX", "menu.workbox", "FiBriefcase", "/workbox");

            when(menuItemRepository.findAllByIsActiveTrueOrderByDisplayOrder())
                    .thenReturn(Arrays.asList(dashboard, workbox));

            List<MenuItemDTO> result = menuConfigService.getAllMenuItems();

            assertEquals(2, result.size());
        }

        @Test
        @DisplayName("Should return all API endpoints for admin")
        void shouldReturnAllApiEndpointsForAdmin() {
            ApiEndpoint endpoint1 = createApiEndpoint(1L, "GET_DASHBOARD", "GET", "/api/dashboard");
            ApiEndpoint endpoint2 = createApiEndpoint(2L, "POST_USER", "POST", "/api/users");

            when(apiEndpointRepository.findByIsActiveTrueOrderByModule())
                    .thenReturn(Arrays.asList(endpoint1, endpoint2));

            List<ApiEndpointDTO> result = menuConfigService.getAllApiEndpoints();

            assertEquals(2, result.size());
        }

        @Test
        @DisplayName("Should return API modules")
        void shouldReturnApiModules() {
            when(apiEndpointRepository.findAllModules())
                    .thenReturn(Arrays.asList("DASHBOARD", "SECURITY", "WORKBOX"));

            List<String> result = menuConfigService.getApiModules();

            assertEquals(3, result.size());
            assertTrue(result.contains("DASHBOARD"));
            assertTrue(result.contains("SECURITY"));
        }
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }
}
