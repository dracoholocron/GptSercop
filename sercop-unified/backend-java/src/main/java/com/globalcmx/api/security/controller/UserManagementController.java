package com.globalcmx.api.security.controller;

import com.globalcmx.api.dto.ApiResponse;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.readmodel.entity.ParticipanteReadModel;
import com.globalcmx.api.readmodel.repository.ParticipanteReadModelRepository;
import com.globalcmx.api.security.entity.Role;
import com.globalcmx.api.security.entity.User;
import com.globalcmx.api.security.entity.UserApprovalStatus;
import com.globalcmx.api.security.repository.RoleRepository;
import com.globalcmx.api.security.repository.UserRepository;
import com.globalcmx.api.security.dto.CreateUserRequest;
import com.globalcmx.api.security.dto.UpdateUserRequest;
import com.globalcmx.api.security.dto.UserDTO;
import com.globalcmx.api.security.dto.RoleDTO;

import java.util.HashMap;
import java.util.Map;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Controlador para gestión de usuarios.
 * Endpoints: /api/users
 */
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Slf4j
public class UserManagementController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.globalcmx.api.security.service.UserCommandService userCommandService;
    private final EventStoreService eventStoreService;
    private final ParticipanteReadModelRepository participanteRepository;

    /**
     * Obtener todos los usuarios
     */
    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = userRepository.findAll();
            List<UserDTO> userDTOs = users.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(userDTOs);
        } catch (Exception e) {
            log.error("Error obteniendo usuarios", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener usuarios: " + e.getMessage()));
        }
    }

    /**
     * Obtener usuario por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con ID: " + id));

            return ResponseEntity.ok(convertToDTO(user));
        } catch (IllegalArgumentException e) {
            log.error("Usuario no encontrado: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error obteniendo usuario", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener usuario: " + e.getMessage()));
        }
    }

    /**
     * Crear nuevo usuario
     */
    @PostMapping
    public ResponseEntity<?> createUser(@Valid @RequestBody CreateUserRequest request) {
        try {
            User savedUser = userCommandService.createUser(request);
            log.info("Usuario creado exitosamente con Event Sourcing: {}", savedUser.getUsername());

            return ResponseEntity.status(HttpStatus.CREATED).body(convertToDTO(savedUser));
        } catch (IllegalArgumentException e) {
            log.error("Error de validación: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error creando usuario", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al crear usuario: " + e.getMessage()));
        }
    }

    /**
     * Actualizar usuario existente
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
        try {
            User updatedUser = userCommandService.updateUser(id, request);
            log.info("Usuario actualizado exitosamente con Event Sourcing: {}", updatedUser.getUsername());

            return ResponseEntity.ok(convertToDTO(updatedUser));
        } catch (IllegalArgumentException e) {
            log.error("Error de validación: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error actualizando usuario", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al actualizar usuario: " + e.getMessage()));
        }
    }

    /**
     * Eliminar usuario (soft delete)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, @RequestParam(defaultValue = "true") boolean soft) {
        try {
            userCommandService.deleteUser(id, soft, "system");
            log.info("Usuario eliminado exitosamente con Event Sourcing - ID: {}, soft: {}", id, soft);

            return ResponseEntity.ok(ApiResponse.success("Usuario eliminado correctamente", null));
        } catch (IllegalArgumentException e) {
            log.error("Usuario no encontrado: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error eliminando usuario", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al eliminar usuario: " + e.getMessage()));
        }
    }

    /**
     * Obtener historial de eventos de un usuario
     */
    @GetMapping("/{id}/history")
    public ResponseEntity<?> getUserHistory(@PathVariable Long id) {
        try {
            String aggregateId = "USER-" + id;
            List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);

            if (events.isEmpty()) {
                log.warn("No se encontró historial para el usuario con ID: {}", id);
                return ResponseEntity.ok(List.of());
            }

            List<Map<String, Object>> history = events.stream()
                    .map(event -> {
                        Map<String, Object> eventMap = new HashMap<>();
                        eventMap.put("eventId", event.getEventId());
                        eventMap.put("eventType", event.getEventType());
                        eventMap.put("timestamp", event.getTimestamp());
                        eventMap.put("performedBy", event.getPerformedBy());
                        eventMap.put("version", event.getVersion());
                        eventMap.put("eventData", event.getEventData());
                        return eventMap;
                    })
                    .toList();

            return ResponseEntity.ok(history);
        } catch (Exception e) {
            log.error("Error obteniendo historial del usuario", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener historial: " + e.getMessage()));
        }
    }

    /**
     * Convertir User entity a UserDTO
     */
    /**
     * Get users pending approval
     */
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingUsers() {
        try {
            List<User> pendingUsers = userRepository.findByApprovalStatus(UserApprovalStatus.PENDING);
            List<UserDTO> userDTOs = pendingUsers.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(userDTOs);
        } catch (Exception e) {
            log.error("Error getting pending users", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error getting pending users: " + e.getMessage()));
        }
    }

    /**
     * Approve user registration
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveUser(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request,
            @RequestHeader(value = "X-User-Username", required = false) String approvedBy) {
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + id));

            if (user.getApprovalStatus() != UserApprovalStatus.PENDING) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("User is not pending approval"));
            }

            // Update approval status
            user.setApprovalStatus(UserApprovalStatus.APPROVED);
            user.setApprovedAt(Instant.now());
            user.setApprovedBy(approvedBy != null ? approvedBy : "system");
            user.setEnabled(true);

            // Update roles if provided
            @SuppressWarnings("unchecked")
            List<?> rawRoleIds = (List<?>) request.get("roleIds");
            List<Long> roleIds = rawRoleIds != null ? rawRoleIds.stream().map(num -> ((Number) num).longValue()).toList() : null;
            if (roleIds != null && !roleIds.isEmpty()) {
                Set<Role> roles = roleIds.stream()
                        .map(roleId -> roleRepository.findById(roleId)
                                .orElseThrow(() -> new IllegalArgumentException("Role not found: " + roleId)))
                        .collect(Collectors.toSet());
                user.setRoles(roles);
            }

            User saved = userRepository.save(user);
            log.info("User approved: {} by {}", saved.getUsername(), approvedBy);

            return ResponseEntity.ok(ApiResponse.success("User approved successfully", convertToDTO(saved)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error approving user", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error approving user: " + e.getMessage()));
        }
    }

    /**
     * Reject user registration
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectUser(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            @RequestHeader(value = "X-User-Username", required = false) String rejectedBy) {
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + id));

            if (user.getApprovalStatus() != UserApprovalStatus.PENDING) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("User is not pending approval"));
            }

            String reason = request.get("reason");
            user.setApprovalStatus(UserApprovalStatus.REJECTED);
            user.setRejectionReason(reason);
            user.setApprovedBy(rejectedBy != null ? rejectedBy : "system");
            user.setApprovedAt(Instant.now());

            User saved = userRepository.save(user);
            log.info("User rejected: {} by {} - Reason: {}", saved.getUsername(), rejectedBy, reason);

            return ResponseEntity.ok(ApiResponse.success("User rejected", convertToDTO(saved)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error rejecting user", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error rejecting user: " + e.getMessage()));
        }
    }


    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setEnabled(user.getEnabled());
        dto.setAccountNonExpired(user.getAccountNonExpired());
        dto.setAccountNonLocked(user.getAccountNonLocked());
        dto.setCredentialsNonExpired(user.getCredentialsNonExpired());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        dto.setLastLogin(user.getLastLogin());
        dto.setName(user.getName());
        // SSO fields
        dto.setIdentityProvider(user.getIdentityProvider());
        dto.setExternalId(user.getExternalId());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setLastSsoLogin(user.getLastSsoLogin());
        // Approval fields
        dto.setApprovalStatus(user.getApprovalStatus() != null ? user.getApprovalStatus().name() : "APPROVED");
        dto.setApprovalRequestedAt(user.getApprovalRequestedAt());
        dto.setApprovedAt(user.getApprovedAt());
        dto.setApprovedBy(user.getApprovedBy());
        dto.setRejectionReason(user.getRejectionReason());

        // Client Portal fields
        dto.setUserType(user.getUserType() != null ? user.getUserType() : "INTERNAL");
        dto.setClienteId(user.getClienteId());
        if (user.getClienteId() != null && !user.getClienteId().isEmpty()) {
            try {
                Long participantId = Long.parseLong(user.getClienteId());
                participanteRepository.findById(participantId)
                        .ifPresent(p -> dto.setParticipantName(
                                p.getNombres() + (p.getApellidos() != null ? " " + p.getApellidos() : "")
                        ));
            } catch (NumberFormatException e) {
                log.warn("Invalid participant ID format for user {}: {}", user.getUsername(), user.getClienteId());
            }
        }

        List<RoleDTO> roleDTOs = user.getRoles().stream()
                .map(role -> {
                    RoleDTO roleDTO = new RoleDTO();
                    roleDTO.setId(role.getId());
                    roleDTO.setName(role.getName());
                    roleDTO.setDescription(role.getDescription());
                    return roleDTO;
                })
                .toList();
        dto.setRoles(roleDTOs);

        return dto;
    }
}
