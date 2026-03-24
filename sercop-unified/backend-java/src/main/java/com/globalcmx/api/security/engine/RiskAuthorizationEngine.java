package com.globalcmx.api.security.engine;

import com.globalcmx.api.security.entity.RiskEvent;
import com.globalcmx.api.security.entity.RiskThreshold;
import com.globalcmx.api.security.service.RiskEngineService;
import com.globalcmx.api.security.service.RiskEngineService.RiskContext;
import com.globalcmx.api.security.service.RiskEngineService.RiskEvaluationResult;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * Motor de autorización basado en riesgo.
 * Evalúa cada operación usando reglas configurables y determina
 * si se permite, requiere MFA, o se bloquea.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RiskAuthorizationEngine implements AuthorizationEngine {

    private static final String ENGINE_ID = "risk";

    private final RiskEngineService riskEngineService;

    @Override
    public String getEngineId() {
        return ENGINE_ID;
    }

    @Override
    public boolean isEnabled() {
        // TODO: Read from SecurityConfiguration when implemented
        return true;
    }

    @Override
    public int getPriority() {
        return 50; // Middle priority - runs after RBAC but before others
    }

    @Override
    public AuthorizationDecision evaluate(AuthorizationRequest request) {
        try {
            // Build risk context from request
            RiskContext riskContext = buildRiskContext(request);

            // Evaluate risk
            RiskEvaluationResult result = riskEngineService.evaluateRisk(riskContext);

            // Build response based on result
            if (result.isBlocked()) {
                return AuthorizationDecision.deny(
                    ENGINE_ID,
                    "Operación bloqueada por riesgo elevado (score: " + result.getTotalScore() + ")",
                    buildMetadata(result)
                );
            }

            if (result.isRequiresMfa()) {
                // MFA is required - we still allow but include metadata
                Map<String, Object> metadata = buildMetadata(result);
                metadata.put("mfa_required", true);
                metadata.put("mfa_reason", "Riesgo detectado requiere verificación adicional");

                return new AuthorizationDecision(
                    true,
                    ENGINE_ID,
                    "Permitido con MFA requerido (score: " + result.getTotalScore() + ")",
                    metadata
                );
            }

            // Operation is allowed
            return AuthorizationDecision.allow(
                ENGINE_ID,
                "Riesgo aceptable (score: " + result.getTotalScore() + ")"
            );

        } catch (Exception e) {
            log.error("Error evaluating risk: {}", e.getMessage(), e);
            // Fail open - don't block on engine errors
            return AuthorizationDecision.allow(ENGINE_ID, "Risk engine error - failing open");
        }
    }

    private RiskContext buildRiskContext(AuthorizationRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        HttpServletRequest httpRequest = getCurrentHttpRequest();

        RiskContext.RiskContextBuilder builder = RiskContext.builder()
            .username(request.subject())
            .operationType(request.resource() + ":" + request.action())
            .additionalContext(new HashMap<>(request.context()));

        // Extract userId from context
        Object userId = request.context().get("userId");
        if (userId != null) {
            builder.userId(((Number) userId).longValue());
        }

        // Extract HTTP request info
        if (httpRequest != null) {
            builder.ipAddress(getClientIp(httpRequest));
            builder.userAgent(httpRequest.getHeader("User-Agent"));
            builder.deviceFingerprint(httpRequest.getHeader("X-Device-Fingerprint"));
        }

        // Determine event type
        RiskEvent.EventType eventType = determineEventType(request.action(), request.resource());
        builder.eventType(eventType);

        // Extract amount if present
        Object amount = request.context().get("amount");
        if (amount != null) {
            if (amount instanceof BigDecimal) {
                builder.operationAmount((BigDecimal) amount);
            } else if (amount instanceof Number) {
                builder.operationAmount(new BigDecimal(amount.toString()));
            }
        }

        // Extract location if present (could be from GeoIP service)
        Object country = request.context().get("country");
        if (country != null) {
            builder.locationCountry(country.toString());
        }
        Object city = request.context().get("city");
        if (city != null) {
            builder.locationCity(city.toString());
        }

        return builder.build();
    }

    private RiskEvent.EventType determineEventType(String action, String resource) {
        String actionLower = action.toLowerCase();
        String resourceLower = resource.toLowerCase();

        if (actionLower.contains("login") || resourceLower.contains("auth")) {
            return RiskEvent.EventType.LOGIN;
        }
        if (actionLower.contains("approve") || actionLower.contains("authorize")) {
            return RiskEvent.EventType.APPROVAL;
        }
        if (actionLower.contains("view") || actionLower.contains("read") || actionLower.contains("export")) {
            return RiskEvent.EventType.DATA_ACCESS;
        }
        return RiskEvent.EventType.OPERATION;
    }

    private Map<String, Object> buildMetadata(RiskEvaluationResult result) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("risk_score", result.getTotalScore());
        metadata.put("action", result.getAction().name());
        metadata.put("triggered_rules", result.getTriggeredRules().stream()
            .map(rule -> Map.of(
                "code", rule.getRuleCode(),
                "name", rule.getRuleName(),
                "points", rule.getPoints(),
                "reason", rule.getReason()
            ))
            .toList());
        return metadata;
    }

    private HttpServletRequest getCurrentHttpRequest() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            return attrs != null ? attrs.getRequest() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isEmpty()) {
            return forwardedFor.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isEmpty()) {
            return realIp;
        }
        return request.getRemoteAddr();
    }
}
