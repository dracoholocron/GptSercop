package com.globalcmx.api.security.service;

import com.globalcmx.api.security.entity.*;
import com.globalcmx.api.security.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.*;

/**
 * Motor de Riesgo basado en reglas.
 * Evalúa operaciones y logins usando reglas configurables,
 * acumulando puntos de riesgo para determinar la acción apropiada.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RiskEngineService {

    private final RiskRuleRepository riskRuleRepository;
    private final RiskThresholdRepository riskThresholdRepository;
    private final RiskEventRepository riskEventRepository;
    private final UserRiskProfileRepository userRiskProfileRepository;

    /**
     * Evalúa el riesgo de una operación.
     *
     * @param context Contexto de la operación (userId, ip, hora, monto, etc.)
     * @return Resultado con puntaje, reglas activadas y acción recomendada
     */
    @Transactional
    public RiskEvaluationResult evaluateRisk(RiskContext context) {
        log.debug("Evaluating risk for user: {}, event: {}", context.getUsername(), context.getEventType());

        List<RiskRule> enabledRules = riskRuleRepository.findByIsEnabledTrue();
        Optional<UserRiskProfile> userProfile = context.getUserId() != null
            ? userRiskProfileRepository.findByUserId(context.getUserId())
            : Optional.empty();

        List<RiskEvent.TriggeredRule> triggeredRules = new ArrayList<>();
        int totalScore = 0;

        // Evaluar cada regla
        for (RiskRule rule : enabledRules) {
            Optional<RiskEvent.TriggeredRule> result = evaluateRule(rule, context, userProfile.orElse(null));
            if (result.isPresent()) {
                triggeredRules.add(result.get());
                totalScore += result.get().getPoints();
            }
        }

        // Determinar acción basada en umbral
        RiskThreshold.RiskAction action = determineAction(totalScore);

        RiskEvaluationResult result = RiskEvaluationResult.builder()
            .totalScore(totalScore)
            .triggeredRules(triggeredRules)
            .action(action)
            .allowed(action == RiskThreshold.RiskAction.ALLOW || action == RiskThreshold.RiskAction.NOTIFY_ADMIN)
            .requiresMfa(action == RiskThreshold.RiskAction.MFA_REQUIRED || action == RiskThreshold.RiskAction.STEP_UP_AUTH)
            .blocked(action == RiskThreshold.RiskAction.BLOCK)
            .build();

        // Guardar evento de riesgo (async para no bloquear)
        logRiskEvent(context, result);

        log.info("Risk evaluation complete: score={}, action={}, rules_triggered={}",
            totalScore, action, triggeredRules.size());

        return result;
    }

    /**
     * Evalúa una regla específica.
     */
    private Optional<RiskEvent.TriggeredRule> evaluateRule(RiskRule rule, RiskContext context, UserRiskProfile profile) {
        boolean triggered = switch (rule.getCode()) {
            // Reglas de ubicación
            case "UNKNOWN_IP" -> evaluateUnknownIp(rule, context, profile);
            case "NEW_COUNTRY" -> evaluateNewCountry(rule, context);
            case "IMPOSSIBLE_TRAVEL" -> evaluateImpossibleTravel(rule, context, profile);

            // Reglas de tiempo
            case "OFF_HOURS" -> evaluateOffHours(rule, context);
            case "WEEKEND_ACCESS" -> evaluateWeekendAccess(rule, context);

            // Reglas de dispositivo
            case "NEW_DEVICE" -> evaluateNewDevice(rule, context, profile);
            case "SUSPICIOUS_USER_AGENT" -> evaluateSuspiciousUserAgent(rule, context);

            // Reglas de velocidad
            case "HIGH_OPERATION_VELOCITY" -> evaluateHighVelocity(rule, context, profile);
            case "RAPID_LOGIN_ATTEMPTS" -> evaluateRapidLoginAttempts(rule, context);

            // Reglas de monto
            case "HIGH_AMOUNT" -> evaluateHighAmount(rule, context);
            case "UNUSUAL_AMOUNT" -> evaluateUnusualAmount(rule, context, profile);

            // Reglas de comportamiento
            case "SENSITIVE_DATA_ACCESS" -> evaluateSensitiveDataAccess(rule, context);
            case "BULK_EXPORT" -> evaluateBulkExport(rule, context);

            default -> false;
        };

        if (triggered) {
            return Optional.of(RiskEvent.TriggeredRule.builder()
                .ruleCode(rule.getCode())
                .ruleName(rule.getName())
                .points(rule.getScorePoints())
                .reason(buildReason(rule, context))
                .build());
        }

        return Optional.empty();
    }

    // ========== Evaluadores de Reglas ==========

    private boolean evaluateUnknownIp(RiskRule rule, RiskContext context, UserRiskProfile profile) {
        if (context.getIpAddress() == null || profile == null) {
            return false;
        }
        return !profile.isKnownIp(context.getIpAddress());
    }

    private boolean evaluateNewCountry(RiskRule rule, RiskContext context) {
        if (context.getLocationCountry() == null) {
            return false;
        }
        Map<String, Object> config = rule.getConfigJson();
        if (config == null || !config.containsKey("allowed_countries")) {
            return false;
        }
        @SuppressWarnings("unchecked")
        List<String> allowedCountries = (List<String>) config.get("allowed_countries");
        return !allowedCountries.contains(context.getLocationCountry());
    }

    private boolean evaluateImpossibleTravel(RiskRule rule, RiskContext context, UserRiskProfile profile) {
        // Simplificado: detecta si el país cambió desde el último login
        if (profile == null || profile.getLastKnownLocation() == null || context.getLocationCountry() == null) {
            return false;
        }
        // Si el país es diferente y la última ubicación fue muy reciente
        return !profile.getLastKnownLocation().equals(context.getLocationCountry());
    }

    private boolean evaluateOffHours(RiskRule rule, RiskContext context) {
        Map<String, Object> config = rule.getConfigJson();
        if (config == null) {
            return false;
        }

        String timezone = (String) config.getOrDefault("timezone", "America/Mexico_City");
        LocalTime workStart = LocalTime.parse((String) config.getOrDefault("work_start", "08:00"));
        LocalTime workEnd = LocalTime.parse((String) config.getOrDefault("work_end", "19:00"));

        LocalTime now = LocalTime.now(ZoneId.of(timezone));
        return now.isBefore(workStart) || now.isAfter(workEnd);
    }

    private boolean evaluateWeekendAccess(RiskRule rule, RiskContext context) {
        Map<String, Object> config = rule.getConfigJson();
        if (config == null) {
            return false;
        }

        @SuppressWarnings("unchecked")
        List<Integer> allowedDays = (List<Integer>) config.getOrDefault("allowed_days", List.of(1, 2, 3, 4, 5));
        int dayOfWeek = LocalDateTime.now().getDayOfWeek().getValue();
        return !allowedDays.contains(dayOfWeek);
    }

    private boolean evaluateNewDevice(RiskRule rule, RiskContext context, UserRiskProfile profile) {
        if (context.getDeviceFingerprint() == null || profile == null) {
            return false;
        }
        return !profile.isKnownDevice(context.getDeviceFingerprint());
    }

    private boolean evaluateSuspiciousUserAgent(RiskRule rule, RiskContext context) {
        if (context.getUserAgent() == null) {
            return false;
        }

        Map<String, Object> config = rule.getConfigJson();
        if (config == null || !config.containsKey("blocked_patterns")) {
            return false;
        }

        @SuppressWarnings("unchecked")
        List<String> blockedPatterns = (List<String>) config.get("blocked_patterns");
        String userAgent = context.getUserAgent().toLowerCase();

        return blockedPatterns.stream().anyMatch(pattern -> userAgent.contains(pattern.toLowerCase()));
    }

    private boolean evaluateHighVelocity(RiskRule rule, RiskContext context, UserRiskProfile profile) {
        if (profile == null || profile.getAvgDailyOperations() == null || profile.getAvgDailyOperations() == 0) {
            return false;
        }

        Map<String, Object> config = rule.getConfigJson();
        int multiplier = config != null ? ((Number) config.getOrDefault("threshold_multiplier", 3)).intValue() : 3;

        // Contar operaciones del usuario hoy
        Long todayOperations = riskEventRepository.countByUserIdSince(
            context.getUserId(),
            LocalDateTime.now().toLocalDate().atStartOfDay()
        );

        return todayOperations > (long) profile.getAvgDailyOperations() * multiplier;
    }

    private boolean evaluateRapidLoginAttempts(RiskRule rule, RiskContext context) {
        if (context.getEventType() != RiskEvent.EventType.LOGIN) {
            return false;
        }

        Map<String, Object> config = rule.getConfigJson();
        int maxAttempts = config != null ? ((Number) config.getOrDefault("max_attempts", 3)).intValue() : 3;
        int windowMinutes = config != null ? ((Number) config.getOrDefault("window_minutes", 5)).intValue() : 5;

        Long recentAttempts = riskEventRepository.countByIpAddressSince(
            context.getIpAddress(),
            LocalDateTime.now().minusMinutes(windowMinutes)
        );

        return recentAttempts >= maxAttempts;
    }

    private boolean evaluateHighAmount(RiskRule rule, RiskContext context) {
        if (context.getOperationAmount() == null) {
            return false;
        }

        Map<String, Object> config = rule.getConfigJson();
        BigDecimal threshold = config != null
            ? new BigDecimal(config.getOrDefault("threshold_usd", 100000).toString())
            : new BigDecimal("100000");

        return context.getOperationAmount().compareTo(threshold) > 0;
    }

    private boolean evaluateUnusualAmount(RiskRule rule, RiskContext context, UserRiskProfile profile) {
        if (context.getOperationAmount() == null || profile == null ||
            profile.getAvgOperationAmount() == null || profile.getAvgOperationAmount().equals(BigDecimal.ZERO)) {
            return false;
        }

        Map<String, Object> config = rule.getConfigJson();
        int multiplier = config != null ? ((Number) config.getOrDefault("threshold_multiplier", 5)).intValue() : 5;

        BigDecimal threshold = profile.getAvgOperationAmount().multiply(new BigDecimal(multiplier));
        return context.getOperationAmount().compareTo(threshold) > 0;
    }

    private boolean evaluateSensitiveDataAccess(RiskRule rule, RiskContext context) {
        if (context.getOperationType() == null) {
            return false;
        }

        Map<String, Object> config = rule.getConfigJson();
        if (config == null || !config.containsKey("sensitive_modules")) {
            return false;
        }

        @SuppressWarnings("unchecked")
        List<String> sensitiveModules = (List<String>) config.get("sensitive_modules");
        return sensitiveModules.stream().anyMatch(m -> context.getOperationType().toUpperCase().contains(m));
    }

    private boolean evaluateBulkExport(RiskRule rule, RiskContext context) {
        if (context.getAdditionalContext() == null) {
            return false;
        }

        Object recordCount = context.getAdditionalContext().get("export_record_count");
        if (recordCount == null) {
            return false;
        }

        Map<String, Object> config = rule.getConfigJson();
        int maxRecords = config != null ? ((Number) config.getOrDefault("max_records", 1000)).intValue() : 1000;

        return ((Number) recordCount).intValue() > maxRecords;
    }

    // ========== Utilidades ==========

    private RiskThreshold.RiskAction determineAction(int totalScore) {
        List<RiskThreshold> matchingThresholds = riskThresholdRepository.findMatchingThresholds(totalScore);
        if (matchingThresholds.isEmpty()) {
            return RiskThreshold.RiskAction.ALLOW;
        }
        return matchingThresholds.get(0).getAction();
    }

    private String buildReason(RiskRule rule, RiskContext context) {
        return switch (rule.getCode()) {
            case "UNKNOWN_IP" -> "IP " + context.getIpAddress() + " no reconocida";
            case "NEW_COUNTRY" -> "Acceso desde país no autorizado: " + context.getLocationCountry();
            case "OFF_HOURS" -> "Operación fuera de horario laboral";
            case "WEEKEND_ACCESS" -> "Acceso en día no laborable";
            case "NEW_DEVICE" -> "Dispositivo no reconocido";
            case "HIGH_AMOUNT" -> "Monto alto: " + context.getOperationAmount();
            default -> rule.getDescription();
        };
    }

    @Async
    @Transactional
    protected void logRiskEvent(RiskContext context, RiskEvaluationResult result) {
        try {
            RiskEvent event = RiskEvent.builder()
                .userId(context.getUserId())
                .username(context.getUsername())
                .eventType(context.getEventType())
                .ipAddress(context.getIpAddress())
                .deviceFingerprint(context.getDeviceFingerprint())
                .userAgent(context.getUserAgent())
                .locationCountry(context.getLocationCountry())
                .locationCity(context.getLocationCity())
                .operationType(context.getOperationType())
                .operationAmount(context.getOperationAmount())
                .totalRiskScore(result.getTotalScore())
                .triggeredRules(result.getTriggeredRules())
                .actionTaken(mapActionToActionTaken(result.getAction()))
                .additionalContext(context.getAdditionalContext())
                .build();

            riskEventRepository.save(event);
        } catch (Exception e) {
            log.error("Failed to log risk event: {}", e.getMessage());
        }
    }

    private RiskEvent.ActionTaken mapActionToActionTaken(RiskThreshold.RiskAction action) {
        return switch (action) {
            case ALLOW, NOTIFY_ADMIN -> RiskEvent.ActionTaken.ALLOWED;
            case MFA_REQUIRED, STEP_UP_AUTH -> RiskEvent.ActionTaken.MFA_REQUESTED;
            case BLOCK -> RiskEvent.ActionTaken.BLOCKED;
        };
    }

    /**
     * Actualiza el perfil de riesgo de un usuario después de una operación.
     */
    @Async
    @Transactional
    public void updateUserProfile(Long userId, RiskContext context) {
        UserRiskProfile profile = userRiskProfileRepository.findByUserId(userId)
            .orElseGet(() -> UserRiskProfile.builder().userId(userId).build());

        // Agregar IP a las conocidas
        if (context.getIpAddress() != null) {
            List<String> ips = profile.getUsualIpAddresses() != null
                ? new ArrayList<>(profile.getUsualIpAddresses())
                : new ArrayList<>();
            if (!ips.contains(context.getIpAddress())) {
                ips.add(context.getIpAddress());
                if (ips.size() > 10) ips.remove(0); // Mantener últimas 10
                profile.setUsualIpAddresses(ips);
            }
        }

        // Agregar dispositivo a los conocidos
        if (context.getDeviceFingerprint() != null) {
            List<String> devices = profile.getUsualDeviceFingerprints() != null
                ? new ArrayList<>(profile.getUsualDeviceFingerprints())
                : new ArrayList<>();
            if (!devices.contains(context.getDeviceFingerprint())) {
                devices.add(context.getDeviceFingerprint());
                if (devices.size() > 5) devices.remove(0); // Mantener últimos 5
                profile.setUsualDeviceFingerprints(devices);
            }
        }

        // Actualizar ubicación
        if (context.getLocationCountry() != null) {
            profile.setLastKnownLocation(context.getLocationCountry());
        }

        userRiskProfileRepository.save(profile);
    }

    // ========== DTOs internos ==========

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class RiskContext {
        private Long userId;
        private String username;
        private RiskEvent.EventType eventType;
        private String ipAddress;
        private String deviceFingerprint;
        private String userAgent;
        private String locationCountry;
        private String locationCity;
        private String operationType;
        private BigDecimal operationAmount;
        private Map<String, Object> additionalContext;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class RiskEvaluationResult {
        private Integer totalScore;
        private List<RiskEvent.TriggeredRule> triggeredRules;
        private RiskThreshold.RiskAction action;
        private boolean allowed;
        private boolean requiresMfa;
        private boolean blocked;
    }
}
