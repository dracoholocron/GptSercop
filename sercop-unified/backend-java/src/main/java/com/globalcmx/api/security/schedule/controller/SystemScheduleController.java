package com.globalcmx.api.security.schedule.controller;

import com.globalcmx.api.dto.ApiResponse;
import com.globalcmx.api.security.entity.User;
import com.globalcmx.api.security.repository.UserRepository;
import com.globalcmx.api.security.schedule.dto.*;
import com.globalcmx.api.security.schedule.entity.*;
import com.globalcmx.api.security.schedule.repository.*;
import com.globalcmx.api.security.schedule.service.SystemScheduleService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Controlador REST para gestión de horarios del sistema.
 * Note: No /api prefix here because application has context-path=/api
 */
@RestController
public class SystemScheduleController {

    private final SystemScheduleService scheduleService;
    private final SystemScheduleGlobalRepository globalRepo;
    private final SystemScheduleRoleRepository roleRepo;
    private final SystemScheduleUserRepository userRepo;
    private final SystemScheduleExceptionRepository exceptionRepo;
    private final SystemScheduleHolidayRepository holidayRepo;
    private final SystemScheduleAccessLogRepository accessLogRepo;
    private final UserRepository userRepository;

    public SystemScheduleController(
            SystemScheduleService scheduleService,
            SystemScheduleGlobalRepository globalRepo,
            SystemScheduleRoleRepository roleRepo,
            SystemScheduleUserRepository userRepo,
            SystemScheduleExceptionRepository exceptionRepo,
            SystemScheduleHolidayRepository holidayRepo,
            SystemScheduleAccessLogRepository accessLogRepo,
            UserRepository userRepository) {
        this.scheduleService = scheduleService;
        this.globalRepo = globalRepo;
        this.roleRepo = roleRepo;
        this.userRepo = userRepo;
        this.exceptionRepo = exceptionRepo;
        this.holidayRepo = holidayRepo;
        this.accessLogRepo = accessLogRepo;
        this.userRepository = userRepository;
    }

    // ==================== ESTADO ACTUAL ====================

    /**
     * Obtiene el estado actual del horario para el usuario autenticado.
     * Accepts timezone as query parameter (preferred) or header (fallback).
     */
    @GetMapping("/schedules/current-status")
    public ResponseEntity<ApiResponse<ScheduleStatusDTO>> getCurrentStatus(
            @RequestParam(value = "timezone", required = false) String timezoneParam,
            @RequestHeader(value = "X-User-Timezone", required = false) String timezoneHeader) {
        User user = getCurrentUser();
        if (user == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Usuario no autenticado"));
        }

        // Prefer query parameter over header (query param avoids CORS preflight issues)
        String userTimezone = timezoneParam != null ? timezoneParam : timezoneHeader;
        ScheduleStatusDTO status = scheduleService.getScheduleStatus(user, userTimezone);
        return ResponseEntity.ok(ApiResponse.success("Estado actual del horario", status));
    }

    // ==================== HORARIOS GLOBALES ====================

    @GetMapping("/admin/schedules/global")
    @PreAuthorize("hasPermission(null, 'CAN_VIEW_SCHEDULES')")
    public ResponseEntity<ApiResponse<List<GlobalScheduleDTO>>> getAllGlobalSchedules() {
        List<SystemScheduleGlobal> schedules = globalRepo.findAll();
        List<GlobalScheduleDTO> dtos = schedules.stream()
                .map(this::toGlobalScheduleDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Horarios globales obtenidos", dtos));
    }

    @GetMapping("/admin/schedules/global/{id}")
    @PreAuthorize("hasPermission(null, 'CAN_VIEW_SCHEDULES')")
    public ResponseEntity<ApiResponse<GlobalScheduleDTO>> getGlobalSchedule(@PathVariable Long id) {
        return globalRepo.findById(id)
                .map(s -> ResponseEntity.ok(ApiResponse.success("Horario obtenido", toGlobalScheduleDTO(s))))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/admin/schedules/global")
    @PreAuthorize("hasPermission(null, 'CAN_MANAGE_GLOBAL_SCHEDULE')")
    public ResponseEntity<ApiResponse<GlobalScheduleDTO>> createGlobalSchedule(
            @RequestBody GlobalScheduleDTO dto) {
        SystemScheduleGlobal schedule = new SystemScheduleGlobal();
        updateGlobalScheduleFromDTO(schedule, dto);
        schedule.setCreatedBy(getCurrentUsername());

        SystemScheduleGlobal saved = globalRepo.save(schedule);
        return ResponseEntity.ok(ApiResponse.success("Horario global creado", toGlobalScheduleDTO(saved)));
    }

    @PutMapping("/admin/schedules/global/{id}")
    @PreAuthorize("hasPermission(null, 'CAN_MANAGE_GLOBAL_SCHEDULE')")
    public ResponseEntity<ApiResponse<GlobalScheduleDTO>> updateGlobalSchedule(
            @PathVariable Long id, @RequestBody GlobalScheduleDTO dto) {
        return globalRepo.findById(id)
                .map(schedule -> {
                    updateGlobalScheduleFromDTO(schedule, dto);
                    schedule.setUpdatedBy(getCurrentUsername());
                    SystemScheduleGlobal saved = globalRepo.save(schedule);
                    return ResponseEntity.ok(ApiResponse.success("Horario actualizado", toGlobalScheduleDTO(saved)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/admin/schedules/global/{id}")
    @PreAuthorize("hasPermission(null, 'CAN_MANAGE_GLOBAL_SCHEDULE')")
    public ResponseEntity<ApiResponse<Void>> deleteGlobalSchedule(@PathVariable Long id) {
        if (!globalRepo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        globalRepo.deleteById(id);
        return ResponseEntity.ok(ApiResponse.<Void>success("Horario eliminado", null));
    }

    @PostMapping("/admin/schedules/global/{id}/set-default")
    @PreAuthorize("hasPermission(null, 'CAN_MANAGE_GLOBAL_SCHEDULE')")
    public ResponseEntity<ApiResponse<Void>> setDefaultGlobalSchedule(@PathVariable Long id) {
        return globalRepo.findById(id)
                .map(schedule -> {
                    // Quitar default de otros
                    globalRepo.findAll().forEach(s -> {
                        if (!s.getId().equals(id) && Boolean.TRUE.equals(s.getIsDefault())) {
                            s.setIsDefault(false);
                            globalRepo.save(s);
                        }
                    });
                    schedule.setIsDefault(true);
                    schedule.setUpdatedBy(getCurrentUsername());
                    globalRepo.save(schedule);
                    return ResponseEntity.ok(ApiResponse.<Void>success("Horario establecido como predeterminado", null));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // ==================== DÍAS FESTIVOS ====================

    @GetMapping("/admin/schedules/holidays")
    @PreAuthorize("hasPermission(null, 'CAN_VIEW_SCHEDULES')")
    public ResponseEntity<ApiResponse<List<SystemScheduleHoliday>>> getAllHolidays() {
        List<SystemScheduleHoliday> holidays = holidayRepo.findByIsActiveTrueOrderByHolidayDateAsc();
        return ResponseEntity.ok(ApiResponse.success("Días festivos obtenidos", holidays));
    }

    @GetMapping("/admin/schedules/holidays/upcoming")
    @PreAuthorize("hasPermission(null, 'CAN_VIEW_SCHEDULES')")
    public ResponseEntity<ApiResponse<List<SystemScheduleHoliday>>> getUpcomingHolidays() {
        LocalDate today = LocalDate.now();
        LocalDate endDate = today.plusMonths(3);
        List<SystemScheduleHoliday> holidays = holidayRepo.findUpcoming(today, endDate);
        return ResponseEntity.ok(ApiResponse.success("Próximos días festivos", holidays));
    }

    @PostMapping("/admin/schedules/holidays")
    @PreAuthorize("hasPermission(null, 'CAN_MANAGE_HOLIDAYS')")
    public ResponseEntity<ApiResponse<SystemScheduleHoliday>> createHoliday(
            @RequestBody SystemScheduleHoliday holiday) {
        holiday.setCreatedBy(getCurrentUsername());
        SystemScheduleHoliday saved = holidayRepo.save(holiday);
        return ResponseEntity.ok(ApiResponse.success("Día festivo creado", saved));
    }

    @PutMapping("/admin/schedules/holidays/{id}")
    @PreAuthorize("hasPermission(null, 'CAN_MANAGE_HOLIDAYS')")
    public ResponseEntity<ApiResponse<SystemScheduleHoliday>> updateHoliday(
            @PathVariable Long id, @RequestBody SystemScheduleHoliday holiday) {
        return holidayRepo.findById(id)
                .map(existing -> {
                    existing.setHolidayDate(holiday.getHolidayDate());
                    existing.setCode(holiday.getCode());
                    existing.setNameKey(holiday.getNameKey());
                    existing.setCountryCode(holiday.getCountryCode());
                    existing.setRegionCode(holiday.getRegionCode());
                    existing.setIsBankHoliday(holiday.getIsBankHoliday());
                    existing.setActionType(holiday.getActionType());
                    existing.setStartTime(holiday.getStartTime());
                    existing.setEndTime(holiday.getEndTime());
                    existing.setIsRecurring(holiday.getIsRecurring());
                    existing.setRecurrenceMonth(holiday.getRecurrenceMonth());
                    existing.setRecurrenceDay(holiday.getRecurrenceDay());
                    existing.setIsActive(holiday.getIsActive());
                    SystemScheduleHoliday saved = holidayRepo.save(existing);
                    return ResponseEntity.ok(ApiResponse.success("Día festivo actualizado", saved));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/admin/schedules/holidays/{id}")
    @PreAuthorize("hasPermission(null, 'CAN_MANAGE_HOLIDAYS')")
    public ResponseEntity<ApiResponse<Void>> deleteHoliday(@PathVariable Long id) {
        if (!holidayRepo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        holidayRepo.deleteById(id);
        return ResponseEntity.ok(ApiResponse.<Void>success("Día festivo eliminado", null));
    }

    // ==================== EXCEPCIONES ====================

    @GetMapping("/admin/schedules/exceptions")
    @PreAuthorize("hasPermission(null, 'CAN_VIEW_SCHEDULES')")
    public ResponseEntity<ApiResponse<List<SystemScheduleException>>> getAllExceptions() {
        List<SystemScheduleException> exceptions = exceptionRepo.findAll();
        return ResponseEntity.ok(ApiResponse.success("Excepciones obtenidas", exceptions));
    }

    @GetMapping("/admin/schedules/exceptions/pending")
    @PreAuthorize("hasPermission(null, 'CAN_APPROVE_SCHEDULE_EXCEPTIONS')")
    public ResponseEntity<ApiResponse<List<SystemScheduleException>>> getPendingExceptions() {
        List<SystemScheduleException> exceptions = exceptionRepo.findByApprovalStatusAndIsActiveTrue(
                ApprovalStatus.PENDING);
        return ResponseEntity.ok(ApiResponse.success("Excepciones pendientes", exceptions));
    }

    @PostMapping("/admin/schedules/exceptions")
    @PreAuthorize("hasPermission(null, 'CAN_MANAGE_SCHEDULE_EXCEPTIONS')")
    public ResponseEntity<ApiResponse<SystemScheduleException>> createException(
            @RequestBody SystemScheduleException exception) {
        exception.setRequestedBy(getCurrentUsername());
        exception.setApprovalStatus(ApprovalStatus.PENDING);
        SystemScheduleException saved = exceptionRepo.save(exception);
        return ResponseEntity.ok(ApiResponse.success("Excepción creada, pendiente de aprobación", saved));
    }

    @PostMapping("/admin/schedules/exceptions/{id}/approve")
    @PreAuthorize("hasPermission(null, 'CAN_APPROVE_SCHEDULE_EXCEPTIONS')")
    public ResponseEntity<ApiResponse<SystemScheduleException>> approveException(@PathVariable Long id) {
        return exceptionRepo.findById(id)
                .map(exception -> {
                    exception.setApprovalStatus(ApprovalStatus.APPROVED);
                    exception.setApprovedBy(getCurrentUsername());
                    exception.setApprovedAt(LocalDateTime.now());
                    SystemScheduleException saved = exceptionRepo.save(exception);
                    return ResponseEntity.ok(ApiResponse.success("Excepción aprobada", saved));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/admin/schedules/exceptions/{id}/reject")
    @PreAuthorize("hasPermission(null, 'CAN_APPROVE_SCHEDULE_EXCEPTIONS')")
    public ResponseEntity<ApiResponse<SystemScheduleException>> rejectException(
            @PathVariable Long id, @RequestBody(required = false) String reason) {
        return exceptionRepo.findById(id)
                .map(exception -> {
                    exception.setApprovalStatus(ApprovalStatus.REJECTED);
                    exception.setApprovedBy(getCurrentUsername());
                    exception.setApprovedAt(LocalDateTime.now());
                    exception.setRejectionReason(reason);
                    SystemScheduleException saved = exceptionRepo.save(exception);
                    return ResponseEntity.ok(ApiResponse.success("Excepción rechazada", saved));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/admin/schedules/exceptions/{id}")
    @PreAuthorize("hasPermission(null, 'CAN_MANAGE_SCHEDULE_EXCEPTIONS')")
    public ResponseEntity<ApiResponse<Void>> deleteException(@PathVariable Long id) {
        if (!exceptionRepo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        exceptionRepo.deleteById(id);
        return ResponseEntity.ok(ApiResponse.<Void>success("Excepción eliminada", null));
    }

    // ==================== LOGS DE ACCESO ====================

    @GetMapping("/admin/schedules/access-logs")
    @PreAuthorize("hasPermission(null, 'CAN_VIEW_SCHEDULE_LOGS')")
    public ResponseEntity<ApiResponse<Page<SystemScheduleAccessLog>>> getAccessLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Page<SystemScheduleAccessLog> logs = accessLogRepo.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "accessTimestamp")));
        return ResponseEntity.ok(ApiResponse.success("Logs de acceso obtenidos", logs));
    }

    @GetMapping("/admin/schedules/access-logs/denied")
    @PreAuthorize("hasPermission(null, 'CAN_VIEW_SCHEDULE_LOGS')")
    public ResponseEntity<ApiResponse<List<SystemScheduleAccessLog>>> getDeniedAccess(
            @RequestParam(defaultValue = "7") int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<SystemScheduleAccessLog> logs = accessLogRepo.findDeniedAccessInPeriod(
                since, LocalDateTime.now());
        return ResponseEntity.ok(ApiResponse.success("Accesos denegados obtenidos", logs));
    }

    // ==================== HELPERS ====================

    private GlobalScheduleDTO toGlobalScheduleDTO(SystemScheduleGlobal schedule) {
        GlobalScheduleDTO dto = new GlobalScheduleDTO();
        dto.setId(schedule.getId());
        dto.setCode(schedule.getCode());
        dto.setNameKey(schedule.getNameKey());
        dto.setDescriptionKey(schedule.getDescriptionKey());
        dto.setTimezone(schedule.getTimezone());
        dto.setIsDefault(schedule.getIsDefault());
        dto.setIsActive(schedule.getIsActive());
        dto.setCreatedAt(schedule.getCreatedAt());
        dto.setUpdatedAt(schedule.getUpdatedAt());
        dto.setCreatedBy(schedule.getCreatedBy());
        dto.setUpdatedBy(schedule.getUpdatedBy());

        List<ScheduleHoursDTO> hours = schedule.getHours().stream()
                .map(h -> {
                    ScheduleHoursDTO hourDto = new ScheduleHoursDTO();
                    hourDto.setId(h.getId());
                    hourDto.setDayOfWeek(h.getDayOfWeek());
                    hourDto.setIsEnabled(h.getIsEnabled());
                    hourDto.setStartTime(h.getStartTime());
                    hourDto.setEndTime(h.getEndTime());
                    hourDto.setAllowOvernight(h.getAllowOvernight());
                    return hourDto;
                })
                .collect(Collectors.toList());
        dto.setHours(hours);

        return dto;
    }

    private void updateGlobalScheduleFromDTO(SystemScheduleGlobal schedule, GlobalScheduleDTO dto) {
        schedule.setCode(dto.getCode());
        schedule.setNameKey(dto.getNameKey());
        schedule.setDescriptionKey(dto.getDescriptionKey());
        schedule.setTimezone(dto.getTimezone());
        schedule.setIsActive(dto.getIsActive());

        // Actualizar horas existentes o agregar nuevas
        if (dto.getHours() != null) {
            dto.getHours().forEach(hourDto -> {
                // Buscar hora existente para este día
                SystemScheduleGlobalHours existingHour = schedule.getHours().stream()
                        .filter(h -> h.getDayOfWeek().equals(hourDto.getDayOfWeek()))
                        .findFirst()
                        .orElse(null);

                if (existingHour != null) {
                    // Actualizar hora existente
                    existingHour.setIsEnabled(hourDto.getIsEnabled());
                    existingHour.setStartTime(hourDto.getStartTime());
                    existingHour.setEndTime(hourDto.getEndTime());
                    existingHour.setAllowOvernight(hourDto.getAllowOvernight());
                } else {
                    // Agregar nueva hora
                    SystemScheduleGlobalHours newHours = new SystemScheduleGlobalHours();
                    newHours.setDayOfWeek(hourDto.getDayOfWeek());
                    newHours.setIsEnabled(hourDto.getIsEnabled());
                    newHours.setStartTime(hourDto.getStartTime());
                    newHours.setEndTime(hourDto.getEndTime());
                    newHours.setAllowOvernight(hourDto.getAllowOvernight());
                    schedule.addHours(newHours);
                }
            });
        }
    }

    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "SYSTEM";
    }

    private User getCurrentUser() {
        String username = getCurrentUsername();
        return userRepository.findByUsername(username).orElse(null);
    }
}
