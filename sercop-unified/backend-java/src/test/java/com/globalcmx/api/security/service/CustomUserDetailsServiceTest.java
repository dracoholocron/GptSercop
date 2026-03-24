package com.globalcmx.api.security.service;

import com.globalcmx.api.security.entity.Role;
import com.globalcmx.api.security.entity.User;
import com.globalcmx.api.security.entity.UserApprovalStatus;
import com.globalcmx.api.security.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CustomUserDetailsService - User Approval Tests")
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomUserDetailsService userDetailsService;

    private User createTestUser(UserApprovalStatus status) {
        Role role = new Role();
        role.setId(1L);
        role.setName("ROLE_USER");

        Set<Role> roles = new HashSet<>();
        roles.add(role);

        return User.builder()
                .id(1L)
                .username("testuser@example.com")
                .email("testuser@example.com")
                .password("$2a$10$encoded_password")
                .enabled(status == UserApprovalStatus.APPROVED)
                .accountNonExpired(true)
                .accountNonLocked(true)
                .credentialsNonExpired(true)
                .approvalStatus(status)
                .roles(roles)
                .build();
    }

    @Test
    @DisplayName("Should load approved user successfully")
    void shouldLoadApprovedUser() {
        // Given
        User approvedUser = createTestUser(UserApprovalStatus.APPROVED);
        when(userRepository.findByUsername("testuser@example.com"))
                .thenReturn(Optional.of(approvedUser));

        // When
        UserDetails userDetails = userDetailsService.loadUserByUsername("testuser@example.com");

        // Then
        assertNotNull(userDetails);
        assertEquals("testuser@example.com", userDetails.getUsername());
        assertTrue(userDetails.isEnabled());
        verify(userRepository, times(1)).findByUsername("testuser@example.com");
    }

    @Test
    @DisplayName("Should throw exception for PENDING user")
    void shouldThrowExceptionForPendingUser() {
        // Given
        User pendingUser = createTestUser(UserApprovalStatus.PENDING);
        when(userRepository.findByUsername("testuser@example.com"))
                .thenReturn(Optional.of(pendingUser));

        // When/Then
        UsernameNotFoundException exception = assertThrows(
                UsernameNotFoundException.class,
                () -> userDetailsService.loadUserByUsername("testuser@example.com")
        );

        assertTrue(exception.getMessage().contains("PENDING_APPROVAL"));
        verify(userRepository, times(1)).findByUsername("testuser@example.com");
    }

    @Test
    @DisplayName("Should throw exception for REJECTED user")
    void shouldThrowExceptionForRejectedUser() {
        // Given
        User rejectedUser = createTestUser(UserApprovalStatus.REJECTED);
        when(userRepository.findByUsername("testuser@example.com"))
                .thenReturn(Optional.of(rejectedUser));

        // When/Then
        UsernameNotFoundException exception = assertThrows(
                UsernameNotFoundException.class,
                () -> userDetailsService.loadUserByUsername("testuser@example.com")
        );

        assertTrue(exception.getMessage().contains("REJECTED"));
        verify(userRepository, times(1)).findByUsername("testuser@example.com");
    }

    @Test
    @DisplayName("Should throw exception for non-existent user")
    void shouldThrowExceptionForNonExistentUser() {
        // Given
        when(userRepository.findByUsername("nonexistent@example.com"))
                .thenReturn(Optional.empty());

        // When/Then
        assertThrows(
                UsernameNotFoundException.class,
                () -> userDetailsService.loadUserByUsername("nonexistent@example.com")
        );

        verify(userRepository, times(1)).findByUsername("nonexistent@example.com");
    }
}
