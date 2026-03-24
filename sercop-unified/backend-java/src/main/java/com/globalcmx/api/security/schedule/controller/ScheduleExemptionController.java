package com.globalcmx.api.security.schedule.controller;

import com.globalcmx.api.dto.ApiResponse;
import com.globalcmx.api.security.schedule.entity.ScheduleExemptRole;
import com.globalcmx.api.security.schedule.entity.ScheduleExemptUser;
import com.globalcmx.api.security.schedule.service.ScheduleExemptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Controller para gestionar exenciones de horario (usuarios y roles).
 */
@RestController
@RequestMapping("/admin/schedule-exemptions")
@RequiredArgsConstructor
@Slf4j
public class ScheduleExemptionController {

    private final ScheduleExemptionService exemptionService;

    // === Exempt Users ===

    @GetMapping("/users")
    @PreAuthorize("hasAuthority('VIEW_SCHEDULE_EXEMPTIONS') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ScheduleExemptUser>>> getAllExemptUsers() {
        List<ScheduleExemptUser> exemptions = exemptionService.getAllExemptUsers();
        return ResponseEntity.ok(ApiResponse.success("Usuarios exentos obtenidos", exemptions));
    }

    @PostMapping("/users")
    @PreAuthorize("hasAuthority('MANAGE_SCHEDULE_EXEMPTIONS') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ScheduleExemptUser>> createExemptUser(@RequestBody CreateExemptUserRequest request) {
        try {
            ScheduleExemptUser exemption = exemptionService.createExemptUser(
                    request.userId(),
                    request.reason(),
                    request.validFrom(),
                    request.validUntil()
            );
            return ResponseEntity.ok(ApiResponse.success("Usuario exento creado", exemption));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/users/{id}")
    @PreAuthorize("hasAuthority('MANAGE_SCHEDULE_EXEMPTIONS') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ScheduleExemptUser>> updateExemptUser(
            @PathVariable Long id,
            @RequestBody UpdateExemptRequest request) {
        try {
            ScheduleExemptUser exemption = exemptionService.updateExemptUser(
                    id,
                    request.reason(),
                    request.validFrom(),
                    request.validUntil(),
                    request.isActive()
            );
            return ResponseEntity.ok(ApiResponse.success("Usuario exento actualizado", exemption));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasAuthority('MANAGE_SCHEDULE_EXEMPTIONS') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteExemptUser(@PathVariable Long id) {
        try {
            exemptionService.deleteExemptUser(id);
            return ResponseEntity.ok(ApiResponse.success("Usuario exento eliminado", null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/users/{id}/toggle")
    @PreAuthorize("hasAuthority('MANAGE_SCHEDULE_EXEMPTIONS') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ScheduleExemptUser>> toggleExemptUserActive(@PathVariable Long id) {
        try {
            ScheduleExemptUser exemption = exemptionService.toggleExemptUserActive(id);
            return ResponseEntity.ok(ApiResponse.success("Estado de exención actualizado", exemption));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // === Exempt Roles ===

    @GetMapping("/roles")
    @PreAuthorize("hasAuthority('VIEW_SCHEDULE_EXEMPTIONS') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ScheduleExemptRole>>> getAllExemptRoles() {
        List<ScheduleExemptRole> exemptions = exemptionService.getAllExemptRoles();
        return ResponseEntity.ok(ApiResponse.success("Roles exentos obtenidos", exemptions));
    }

    @PostMapping("/roles")
    @PreAuthorize("hasAuthority('MANAGE_SCHEDULE_EXEMPTIONS') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ScheduleExemptRole>> createExemptRole(@RequestBody CreateExemptRoleRequest request) {
        try {
            ScheduleExemptRole exemption = exemptionService.createExemptRole(
                    request.roleId(),
                    request.reason(),
                    request.validFrom(),
                    request.validUntil()
            );
            return ResponseEntity.ok(ApiResponse.success("Rol exento creado", exemption));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/roles/{id}")
    @PreAuthorize("hasAuthority('MANAGE_SCHEDULE_EXEMPTIONS') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ScheduleExemptRole>> updateExemptRole(
            @PathVariable Long id,
            @RequestBody UpdateExemptRequest request) {
        try {
            ScheduleExemptRole exemption = exemptionService.updateExemptRole(
                    id,
                    request.reason(),
                    request.validFrom(),
                    request.validUntil(),
                    request.isActive()
            );
            return ResponseEntity.ok(ApiResponse.success("Rol exento actualizado", exemption));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/roles/{id}")
    @PreAuthorize("hasAuthority('MANAGE_SCHEDULE_EXEMPTIONS') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteExemptRole(@PathVariable Long id) {
        try {
            exemptionService.deleteExemptRole(id);
            return ResponseEntity.ok(ApiResponse.success("Rol exento eliminado", null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/roles/{id}/toggle")
    @PreAuthorize("hasAuthority('MANAGE_SCHEDULE_EXEMPTIONS') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ScheduleExemptRole>> toggleExemptRoleActive(@PathVariable Long id) {
        try {
            ScheduleExemptRole exemption = exemptionService.toggleExemptRoleActive(id);
            return ResponseEntity.ok(ApiResponse.success("Estado de exención actualizado", exemption));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // Request DTOs
    public record CreateExemptUserRequest(
            Long userId,
            String reason,
            LocalDateTime validFrom,
            LocalDateTime validUntil
    ) {}

    public record CreateExemptRoleRequest(
            Long roleId,
            String reason,
            LocalDateTime validFrom,
            LocalDateTime validUntil
    ) {}

    public record UpdateExemptRequest(
            String reason,
            LocalDateTime validFrom,
            LocalDateTime validUntil,
            Boolean isActive
    ) {}
}
