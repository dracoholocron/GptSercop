package com.globalcmx.api.security.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.security.entity.Role;
import com.globalcmx.api.security.entity.User;
import com.globalcmx.api.security.entity.UserApprovalStatus;
import com.globalcmx.api.security.repository.RoleRepository;
import com.globalcmx.api.security.repository.UserRepository;
import com.globalcmx.api.security.filter.ApiPermissionFilter;
import com.globalcmx.api.security.jwt.JwtAuthenticationFilter;
import com.globalcmx.api.security.jwt.JwtTokenProvider;
import com.globalcmx.api.security.service.ApiEndpointCacheService;
import com.globalcmx.api.security.service.CustomUserDetailsService;
import com.globalcmx.api.security.service.UserCommandService;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;

import java.time.Instant;
import java.util.*;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = UserManagementController.class,
    excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
        classes = {JwtAuthenticationFilter.class, ApiPermissionFilter.class}))
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("UserManagementController - Approval Endpoints Tests")
class UserApprovalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private RoleRepository roleRepository;

    @MockBean
    private PasswordEncoder passwordEncoder;

    @MockBean
    private UserCommandService userCommandService;

    @MockBean
    private EventStoreService eventStoreService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private ApiEndpointCacheService apiEndpointCacheService;

    private User createPendingUser() {
        return User.builder()
                .id(1L)
                .username("newuser@example.com")
                .email("newuser@example.com")
                .name("New User")
                .enabled(false)
                .accountNonExpired(true)
                .accountNonLocked(true)
                .credentialsNonExpired(true)
                .approvalStatus(UserApprovalStatus.PENDING)
                .approvalRequestedAt(Instant.now())
                .identityProvider("AUTH0")
                .roles(new HashSet<>())
                .createdAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("GET /users/pending - Should return pending users")
    @WithMockUser(roles = "ADMIN")
    void shouldReturnPendingUsers() throws Exception {
        // Given
        List<User> pendingUsers = Arrays.asList(createPendingUser());
        when(userRepository.findByApprovalStatus(UserApprovalStatus.PENDING))
                .thenReturn(pendingUsers);

        // When/Then
        mockMvc.perform(get("/users/pending")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("newuser@example.com"))
                .andExpect(jsonPath("$[0].approvalStatus").value("PENDING"));

        verify(userRepository, times(1)).findByApprovalStatus(UserApprovalStatus.PENDING);
    }

    @Test
    @DisplayName("POST /users/{id}/approve - Should approve pending user")
    @WithMockUser(roles = "ADMIN")
    void shouldApprovePendingUser() throws Exception {
        // Given
        User pendingUser = createPendingUser();
        Role userRole = new Role();
        userRole.setId(1L);
        userRole.setName("ROLE_USER");

        when(userRepository.findById(1L)).thenReturn(Optional.of(pendingUser));
        when(roleRepository.findById(1L)).thenReturn(Optional.of(userRole));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        Map<String, Object> request = new HashMap<>();
        request.put("roleIds", Arrays.asList(1L));

        // When/Then
        mockMvc.perform(post("/users/1/approve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .header("X-User-Username", "admin@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User approved successfully"));

        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("POST /users/{id}/approve - Should fail for already approved user")
    @WithMockUser(roles = "ADMIN")
    void shouldFailForAlreadyApprovedUser() throws Exception {
        // Given
        User approvedUser = createPendingUser();
        approvedUser.setApprovalStatus(UserApprovalStatus.APPROVED);

        when(userRepository.findById(1L)).thenReturn(Optional.of(approvedUser));

        Map<String, Object> request = new HashMap<>();
        request.put("roleIds", Arrays.asList(1L));

        // When/Then
        mockMvc.perform(post("/users/1/approve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("User is not pending approval"));
    }

    @Test
    @DisplayName("POST /users/{id}/reject - Should reject pending user")
    @WithMockUser(roles = "ADMIN")
    void shouldRejectPendingUser() throws Exception {
        // Given
        User pendingUser = createPendingUser();
        when(userRepository.findById(1L)).thenReturn(Optional.of(pendingUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        Map<String, String> request = new HashMap<>();
        request.put("reason", "Invalid company email");

        // When/Then
        mockMvc.perform(post("/users/1/reject")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .header("X-User-Username", "admin@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User rejected"));

        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("POST /users/{id}/reject - Should fail for non-existent user")
    @WithMockUser(roles = "ADMIN")
    void shouldFailForNonExistentUser() throws Exception {
        // Given
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        Map<String, String> request = new HashMap<>();
        request.put("reason", "Invalid");

        // When/Then
        mockMvc.perform(post("/users/999/reject")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
