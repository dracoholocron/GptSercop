package com.globalcmx.api.security.controller;

import com.globalcmx.api.dto.ApiResponse;
import com.globalcmx.api.security.dto.RoleDTO;
import com.globalcmx.api.security.entity.Role;
import com.globalcmx.api.security.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Controlador para gestión de roles.
 * Endpoints: /api/roles
 */
@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
@Slf4j
public class RoleManagementController {

    private final RoleRepository roleRepository;

    /**
     * Obtener todos los roles
     */
    @GetMapping
    public ResponseEntity<?> getAllRoles() {
        try {
            List<Role> roles = roleRepository.findAll();
            List<RoleDTO> roleDTOs = roles.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(roleDTOs);
        } catch (Exception e) {
            log.error("Error obteniendo roles", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener roles: " + e.getMessage()));
        }
    }

    /**
     * Obtener rol por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getRoleById(@PathVariable Long id) {
        try {
            Role role = roleRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado con ID: " + id));

            return ResponseEntity.ok(convertToDTO(role));
        } catch (IllegalArgumentException e) {
            log.error("Rol no encontrado: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error obteniendo rol", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error al obtener rol: " + e.getMessage()));
        }
    }

    /**
     * Convertir Role entity a RoleDTO
     */
    private RoleDTO convertToDTO(Role role) {
        RoleDTO dto = new RoleDTO();
        dto.setId(role.getId());
        dto.setName(role.getName());
        dto.setDescription(role.getDescription());
        return dto;
    }
}
