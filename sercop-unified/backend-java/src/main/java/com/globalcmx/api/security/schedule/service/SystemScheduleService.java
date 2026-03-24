package com.globalcmx.api.security.schedule.service;

import com.globalcmx.api.security.entity.Role;
import com.globalcmx.api.security.entity.User;
import com.globalcmx.api.security.schedule.dto.ScheduleAccessResult;
import com.globalcmx.api.security.schedule.dto.ScheduleStatusDTO;
import com.globalcmx.api.security.schedule.entity.*;
import com.globalcmx.api.security.schedule.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Servicio principal para evaluación de acceso por horarios.
 * Implementa la jerarquía: EXCEPCIÓN > USUARIO > ROL > GLOBAL
 */
@Service
public class SystemScheduleService {

    private static final Logger logger = LoggerFactory.getLogger(SystemScheduleService.class);
    private static final int WARNING_MINUTES_BEFORE_END = 15;

    private final SystemScheduleGlobalRepository globalScheduleRepo;
    private final SystemScheduleRoleRepository roleScheduleRepo;
    private final SystemScheduleUserRepository userScheduleRepo;
    private final SystemScheduleExceptionRepository exceptionRepo;
    private final SystemScheduleHolidayRepository holidayRepo;
    private final SystemScheduleAccessLogRepository accessLogRepo;
    private final ScheduleExemptUserRepository exemptUserRepo;
    private final ScheduleExemptRoleRepository exemptRoleRepo;

    @Value("${globalcmx.schedule.enabled:true}")
    private boolean scheduleEnabled;

    @Value("${globalcmx.schedule.default-timezone:America/Mexico_City}")
    private String defaultTimezone;

    public SystemScheduleService(
            SystemScheduleGlobalRepository globalScheduleRepo,
            SystemScheduleRoleRepository roleScheduleRepo,
            SystemScheduleUserRepository userScheduleRepo,
            SystemScheduleExceptionRepository exceptionRepo,
            SystemScheduleHolidayRepository holidayRepo,
            SystemScheduleAccessLogRepository accessLogRepo,
            ScheduleExemptUserRepository exemptUserRepo,
            ScheduleExemptRoleRepository exemptRoleRepo) {
        this.globalScheduleRepo = globalScheduleRepo;
        this.roleScheduleRepo = roleScheduleRepo;
        this.userScheduleRepo = userScheduleRepo;
        this.exceptionRepo = exceptionRepo;
        this.holidayRepo = holidayRepo;
        this.accessLogRepo = accessLogRepo;
        this.exemptUserRepo = exemptUserRepo;
        this.exemptRoleRepo = exemptRoleRepo;
    }

    /**
     * Evalúa si un usuario tiene acceso en el momento actual.
     * Sigue la jerarquía: EXENTO > EXCEPCIÓN_TEMPORAL > USUARIO > ROL > GLOBAL
     */
    @Transactional(readOnly = true)
    public ScheduleAccessResult evaluateAccess(User user, String userTimezone) {
        if (!scheduleEnabled) {
            return ScheduleAccessResult.allowed(ScheduleLevelApplied.GLOBAL, null);
        }

        ZonedDateTime now = ZonedDateTime.now(
                ZoneId.of(userTimezone != null ? userTimezone : defaultTimezone));
        LocalDate today = now.toLocalDate();
        LocalDateTime nowDateTime = LocalDateTime.now();

        try {
            // 0. Verificar si el usuario está exento permanentemente
            Optional<ScheduleExemptUser> exemptUser = exemptUserRepo.findActiveByUserId(user.getId(), nowDateTime);
            if (exemptUser.isPresent()) {
                logger.info("User {} is exempt from schedule restrictions: {}",
                        user.getUsername(), exemptUser.get().getReason());
                ScheduleAccessResult result = ScheduleAccessResult.allowed(ScheduleLevelApplied.EXEMPT, exemptUser.get().getId());
                result.setReason("schedule.info.user_exempt:" + exemptUser.get().getReason());
                result.setExempt(true);
                result.setExemptReason(exemptUser.get().getReason());
                return result;
            }

            // 0.1 Verificar si alguno de los roles del usuario está exento
            List<Long> roleIds = user.getRoles().stream()
                    .map(Role::getId)
                    .collect(Collectors.toList());
            if (!roleIds.isEmpty()) {
                List<ScheduleExemptRole> exemptRoles = exemptRoleRepo.findActiveByRoleIds(roleIds, nowDateTime);
                if (!exemptRoles.isEmpty()) {
                    ScheduleExemptRole exemptRole = exemptRoles.get(0);
                    logger.info("User {} has exempt role {}: {}",
                            user.getUsername(), exemptRole.getRole().getName(), exemptRole.getReason());
                    ScheduleAccessResult result = ScheduleAccessResult.allowed(ScheduleLevelApplied.EXEMPT, exemptRole.getId());
                    result.setReason("schedule.info.role_exempt:" + exemptRole.getReason());
                    result.setExempt(true);
                    result.setExemptReason(exemptRole.getReason());
                    return result;
                }
            }

            // 1. Verificar excepciones temporales del usuario
            List<SystemScheduleException> userExceptions = exceptionRepo.findApprovedUserExceptions(
                    today, user.getId());
            if (!userExceptions.isEmpty()) {
                SystemScheduleException exception = userExceptions.get(0);
                return evaluateException(exception, now);
            }

            // 2. Verificar excepciones temporales de roles del usuario
            if (!roleIds.isEmpty()) {
                List<SystemScheduleException> roleExceptions = exceptionRepo.findApprovedRoleExceptions(
                        today, roleIds);
                if (!roleExceptions.isEmpty()) {
                    SystemScheduleException exception = roleExceptions.get(0);
                    return evaluateException(exception, now);
                }
            }

            // 3. Verificar excepciones globales
            List<SystemScheduleException> globalExceptions = exceptionRepo.findApprovedGlobalExceptions(today);
            if (!globalExceptions.isEmpty()) {
                SystemScheduleException exception = globalExceptions.get(0);
                return evaluateException(exception, now);
            }

            // 4. Verificar días festivos
            List<SystemScheduleHoliday> holidays = holidayRepo.findByDate(
                    today, today.getMonthValue(), today.getDayOfMonth());
            if (!holidays.isEmpty()) {
                SystemScheduleHoliday holiday = holidays.get(0);
                return evaluateHoliday(holiday, now);
            }

            // 5. Verificar horario específico del usuario
            List<SystemScheduleUser> userSchedules = userScheduleRepo.findActiveAndValidByUserId(
                    user.getId(), today);
            if (!userSchedules.isEmpty()) {
                return evaluateUserSchedule(userSchedules.get(0), now);
            }

            // 6. Verificar horarios de roles (el de mayor prioridad primero)
            if (!roleIds.isEmpty()) {
                List<SystemScheduleRole> roleSchedules = roleScheduleRepo.findActiveByRoleIds(roleIds);
                if (!roleSchedules.isEmpty()) {
                    return evaluateRoleSchedules(roleSchedules, now);
                }
            }

            // 7. Aplicar horario global
            Optional<SystemScheduleGlobal> globalSchedule = globalScheduleRepo.findDefaultSchedule();
            if (globalSchedule.isPresent()) {
                return evaluateGlobalSchedule(globalSchedule.get(), now);
            }

            // Sin horario configurado: permitir acceso por defecto
            logger.warn("No schedule configured, allowing access by default for user: {}", user.getUsername());
            return ScheduleAccessResult.allowed(ScheduleLevelApplied.GLOBAL, null);

        } catch (Exception e) {
            logger.error("Error evaluating schedule access for user: {}", user.getUsername(), e);
            // En caso de error, permitir acceso para no bloquear operaciones
            return ScheduleAccessResult.allowed(ScheduleLevelApplied.GLOBAL, null);
        }
    }

    /**
     * Obtiene el estado actual del horario para mostrar en la UI.
     */
    @Transactional(readOnly = true)
    public ScheduleStatusDTO getScheduleStatus(User user, String userTimezone) {
        ScheduleStatusDTO status = new ScheduleStatusDTO();
        String tz = userTimezone != null ? userTimezone : defaultTimezone;
        ZonedDateTime now = ZonedDateTime.now(ZoneId.of(tz));

        status.setUserTimezone(tz);
        status.setSystemTimezone(defaultTimezone);
        status.setCurrentTimeFormatted(now.format(DateTimeFormatter.ofPattern("HH:mm")));

        // Verificar festivo
        LocalDate today = now.toLocalDate();
        List<SystemScheduleHoliday> holidays = holidayRepo.findByDate(
                today, today.getMonthValue(), today.getDayOfMonth());
        if (!holidays.isEmpty()) {
            status.setHoliday(true);
            status.setHolidayName(holidays.get(0).getNameKey());
        }

        // Evaluar acceso
        ScheduleAccessResult result = evaluateAccess(user, tz);
        status.setAllowed(result.getResult() == AccessResult.ALLOWED || result.getResult() == AccessResult.WARNED);
        status.setCurrentLevel(result.getLevelApplied());
        status.setMessage(result.getReason());
        status.setExempt(result.isExempt());
        status.setExemptReason(result.getExemptReason());

        if (result.getAllowedEnd() != null) {
            status.setCurrentEndTime(result.getAllowedEnd());
            long minutes = ChronoUnit.MINUTES.between(now.toLocalTime(), result.getAllowedEnd());
            status.setMinutesRemaining((int) Math.max(0, minutes));
        }

        if (result.getAllowedStart() != null) {
            status.setCurrentStartTime(result.getAllowedStart());
        }

        // Si el usuario es exento y no tiene horarios definidos, obtener del schedule global
        // para que el timeline se muestre correctamente en la UI
        if (result.isExempt() && status.getCurrentStartTime() == null) {
            populateGlobalScheduleTimes(status, now);
        }

        return status;
    }

    /**
     * Popula los horarios del schedule global para usuarios exentos.
     * Esto permite que el timeline se muestre en la UI aunque el usuario no tenga restricciones.
     */
    private void populateGlobalScheduleTimes(ScheduleStatusDTO status, ZonedDateTime now) {
        try {
            Optional<SystemScheduleGlobal> globalSchedule = globalScheduleRepo.findDefaultSchedule();
            if (globalSchedule.isPresent()) {
                SystemScheduleGlobal schedule = globalSchedule.get();
                ZonedDateTime systemTime = now.withZoneSameInstant(ZoneId.of(schedule.getTimezone()));
                int dayOfWeek = systemTime.getDayOfWeek().getValue();

                Optional<SystemScheduleGlobalHours> hoursOpt = schedule.getHours().stream()
                        .filter(h -> h.getDayOfWeek() == dayOfWeek && Boolean.TRUE.equals(h.getIsEnabled()))
                        .findFirst();

                if (hoursOpt.isPresent()) {
                    SystemScheduleGlobalHours hours = hoursOpt.get();
                    status.setCurrentStartTime(hours.getStartTime());
                    status.setCurrentEndTime(hours.getEndTime());
                    status.setSystemTimezone(schedule.getTimezone());

                    long minutes = ChronoUnit.MINUTES.between(systemTime.toLocalTime(), hours.getEndTime());
                    status.setMinutesRemaining((int) Math.max(0, minutes));
                }
            }
        } catch (Exception e) {
            logger.warn("Could not populate global schedule times for exempt user", e);
        }
    }

    /**
     * Registra un intento de acceso.
     */
    @Transactional
    public void logAccessAttempt(User user, ScheduleAccessResult result,
                                  String ipAddress, String userAgent, String sessionId) {
        try {
            SystemScheduleAccessLog log = new SystemScheduleAccessLog();
            log.setUserId(user.getId());
            log.setUsername(user.getUsername());
            log.setAccessTimestamp(LocalDateTime.now());
            log.setAccessResult(result.getResult());
            log.setDenialReasonKey(result.getReason());
            log.setScheduleLevelApplied(result.getLevelApplied());
            log.setScheduleId(result.getScheduleId());
            log.setSystemTimezone(defaultTimezone);
            log.setIpAddress(ipAddress);
            log.setUserAgent(userAgent);
            log.setSessionId(sessionId);

            accessLogRepo.save(log);
        } catch (Exception e) {
            logger.error("Error logging access attempt for user: {}", user.getUsername(), e);
        }
    }

    // --- Métodos de evaluación privados ---

    private ScheduleAccessResult evaluateException(SystemScheduleException exception, ZonedDateTime time) {
        if (exception.getExceptionAction() == ExceptionAction.DENY) {
            return ScheduleAccessResult.denied(
                    "schedule.error.exception_denied",
                    ScheduleLevelApplied.EXCEPTION);
        }

        if (exception.getExceptionAction() == ExceptionAction.ALLOW) {
            ScheduleAccessResult result = ScheduleAccessResult.allowed(
                    ScheduleLevelApplied.EXCEPTION, exception.getId());
            result.setReason("schedule.info.exception_approved");
            return result;
        }

        // MODIFY: verificar horario específico de la excepción
        if (exception.getStartTime() != null && exception.getEndTime() != null) {
            LocalTime localTime = time.toLocalTime();
            if (!localTime.isBefore(exception.getStartTime()) && !localTime.isAfter(exception.getEndTime())) {
                ScheduleAccessResult result = ScheduleAccessResult.allowed(
                        ScheduleLevelApplied.EXCEPTION, exception.getId());
                result.setAllowedStart(exception.getStartTime());
                result.setAllowedEnd(exception.getEndTime());
                return checkWarningTime(result, localTime, exception.getEndTime());
            }
            return ScheduleAccessResult.denied(
                    String.format("schedule.error.outside_modified_hours:%s|%s",
                            exception.getStartTime(), exception.getEndTime()),
                    ScheduleLevelApplied.EXCEPTION);
        }

        return ScheduleAccessResult.allowed(ScheduleLevelApplied.EXCEPTION, exception.getId());
    }

    private ScheduleAccessResult evaluateHoliday(SystemScheduleHoliday holiday, ZonedDateTime time) {
        if (holiday.getActionType() == HolidayAction.CLOSED) {
            return ScheduleAccessResult.denied(
                    "schedule.error.holiday_closed:" + holiday.getNameKey(),
                    ScheduleLevelApplied.HOLIDAY);
        }

        if (holiday.getActionType() == HolidayAction.NORMAL) {
            // El festivo es informativo, continuar con evaluación normal
            return null; // Señal para continuar evaluando
        }

        // REDUCED_HOURS
        if (holiday.getStartTime() != null && holiday.getEndTime() != null) {
            LocalTime localTime = time.toLocalTime();
            if (!localTime.isBefore(holiday.getStartTime()) && !localTime.isAfter(holiday.getEndTime())) {
                ScheduleAccessResult result = ScheduleAccessResult.allowed(
                        ScheduleLevelApplied.HOLIDAY, holiday.getId());
                result.setAllowedStart(holiday.getStartTime());
                result.setAllowedEnd(holiday.getEndTime());
                result.setReason("schedule.info.reduced_hours:" + holiday.getNameKey());
                return checkWarningTime(result, localTime, holiday.getEndTime());
            }
            return ScheduleAccessResult.denied(
                    String.format("schedule.error.outside_reduced_hours:%s|%s|%s",
                            holiday.getNameKey(), holiday.getStartTime(), holiday.getEndTime()),
                    ScheduleLevelApplied.HOLIDAY);
        }

        return ScheduleAccessResult.denied(
                "schedule.error.holiday_closed:" + holiday.getNameKey(),
                ScheduleLevelApplied.HOLIDAY);
    }

    private ScheduleAccessResult evaluateUserSchedule(SystemScheduleUser schedule, ZonedDateTime time) {
        int dayOfWeek = time.getDayOfWeek().getValue();
        LocalTime localTime = time.toLocalTime();

        Optional<SystemScheduleUserHours> hoursOpt = schedule.getHours().stream()
                .filter(h -> h.getDayOfWeek() == dayOfWeek && Boolean.TRUE.equals(h.getIsEnabled()))
                .findFirst();

        if (hoursOpt.isEmpty()) {
            return ScheduleAccessResult.denied(
                    "schedule.error.day_not_enabled_user",
                    ScheduleLevelApplied.USER);
        }

        SystemScheduleUserHours hours = hoursOpt.get();
        if (isTimeInRange(localTime, hours.getStartTime(), hours.getEndTime(), hours.getAllowOvernight())) {
            ScheduleAccessResult result = ScheduleAccessResult.allowed(
                    ScheduleLevelApplied.USER, schedule.getId());
            result.setAllowedStart(hours.getStartTime());
            result.setAllowedEnd(hours.getEndTime());
            return checkWarningTime(result, localTime, hours.getEndTime());
        }

        return ScheduleAccessResult.denied(
                String.format("schedule.error.outside_user_hours:%s|%s",
                        hours.getStartTime(), hours.getEndTime()),
                ScheduleLevelApplied.USER);
    }

    private ScheduleAccessResult evaluateRoleSchedules(List<SystemScheduleRole> schedules, ZonedDateTime time) {
        int dayOfWeek = time.getDayOfWeek().getValue();
        LocalTime localTime = time.toLocalTime();

        for (SystemScheduleRole schedule : schedules) {
            Optional<SystemScheduleRoleHours> hoursOpt = schedule.getHours().stream()
                    .filter(h -> h.getDayOfWeek() == dayOfWeek && Boolean.TRUE.equals(h.getIsEnabled()))
                    .findFirst();

            if (hoursOpt.isPresent()) {
                SystemScheduleRoleHours hours = hoursOpt.get();
                if (isTimeInRange(localTime, hours.getStartTime(), hours.getEndTime(), hours.getAllowOvernight())) {
                    ScheduleAccessResult result = ScheduleAccessResult.allowed(
                            ScheduleLevelApplied.ROLE, schedule.getId());
                    result.setAllowedStart(hours.getStartTime());
                    result.setAllowedEnd(hours.getEndTime());
                    return checkWarningTime(result, localTime, hours.getEndTime());
                }
            }
        }

        return ScheduleAccessResult.denied(
                "schedule.error.outside_role_hours",
                ScheduleLevelApplied.ROLE);
    }

    private ScheduleAccessResult evaluateGlobalSchedule(SystemScheduleGlobal schedule, ZonedDateTime time) {
        ZonedDateTime systemTime = time.withZoneSameInstant(ZoneId.of(schedule.getTimezone()));
        int dayOfWeek = systemTime.getDayOfWeek().getValue();
        LocalTime localTime = systemTime.toLocalTime();

        // DEBUG LOGGING
        logger.info("=== SCHEDULE DEBUG ===");
        logger.info("Input time: {}", time);
        logger.info("Schedule timezone: {}", schedule.getTimezone());
        logger.info("Converted system time: {}", systemTime);
        logger.info("Day of week (1=Mon, 7=Sun): {}", dayOfWeek);
        logger.info("Local time in schedule TZ: {}", localTime);
        logger.info("Schedule hours configured: {}", schedule.getHours().size());

        Optional<SystemScheduleGlobalHours> hoursOpt = schedule.getHours().stream()
                .filter(h -> h.getDayOfWeek() == dayOfWeek && Boolean.TRUE.equals(h.getIsEnabled()))
                .findFirst();

        if (hoursOpt.isEmpty()) {
            logger.warn("No enabled hours for day {} - denying access", dayOfWeek);
            return ScheduleAccessResult.denied(
                    "schedule.error.system_closed_today",
                    ScheduleLevelApplied.GLOBAL);
        }

        SystemScheduleGlobalHours hours = hoursOpt.get();
        logger.info("Hours for day {}: {} - {} (enabled: {})",
                dayOfWeek, hours.getStartTime(), hours.getEndTime(), hours.getIsEnabled());

        boolean inRange = isTimeInRange(localTime, hours.getStartTime(), hours.getEndTime(), hours.getAllowOvernight());
        logger.info("Time {} in range [{} - {}]? {}", localTime, hours.getStartTime(), hours.getEndTime(), inRange);

        if (inRange) {
            ScheduleAccessResult result = ScheduleAccessResult.allowed(
                    ScheduleLevelApplied.GLOBAL, schedule.getId());
            result.setAllowedStart(hours.getStartTime());
            result.setAllowedEnd(hours.getEndTime());
            result.setSystemTimezone(schedule.getTimezone());
            logger.info("Access ALLOWED");
            return checkWarningTime(result, localTime, hours.getEndTime());
        }

        logger.info("Access DENIED - outside hours");
        return ScheduleAccessResult.denied(
                String.format("schedule.error.outside_operation_hours:%s|%s",
                        hours.getStartTime(), hours.getEndTime()),
                ScheduleLevelApplied.GLOBAL);
    }

    private boolean isTimeInRange(LocalTime time, LocalTime start, LocalTime end, Boolean allowOvernight) {
        if (Boolean.TRUE.equals(allowOvernight) && end.isBefore(start)) {
            return !time.isBefore(start) || !time.isAfter(end);
        }
        return !time.isBefore(start) && !time.isAfter(end);
    }

    private ScheduleAccessResult checkWarningTime(ScheduleAccessResult result, LocalTime currentTime, LocalTime endTime) {
        long minutesUntilEnd = ChronoUnit.MINUTES.between(currentTime, endTime);
        if (minutesUntilEnd > 0 && minutesUntilEnd <= WARNING_MINUTES_BEFORE_END) {
            result.setResult(AccessResult.WARNED);
            result.setWarning(true);
            result.setMinutesRemaining((int) minutesUntilEnd);
            result.setWarningMessage("schedule.warning.access_ending:" + minutesUntilEnd);
        }
        return result;
    }
}
