package com.globalcmx.api.security.controller;

import com.globalcmx.api.security.entity.RiskEvent;
import com.globalcmx.api.security.entity.RiskRule;
import com.globalcmx.api.security.entity.RiskThreshold;
import com.globalcmx.api.security.repository.RiskEventRepository;
import com.globalcmx.api.security.repository.RiskRuleRepository;
import com.globalcmx.api.security.repository.RiskThresholdRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * API REST para gestión del Motor de Riesgo.
 * Permite configurar reglas, umbrales y ver historial de eventos.
 */
@RestController
@RequestMapping("/v1/admin/risk-engine")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasPermission(#root.authentication, 'MANAGE_RISK_ENGINE')")
public class RiskEngineController {

    private final RiskRuleRepository riskRuleRepository;
    private final RiskThresholdRepository riskThresholdRepository;
    private final RiskEventRepository riskEventRepository;

    // ==================== RULES ====================

    @GetMapping("/rules")
    public ResponseEntity<List<RiskRule>> getAllRules() {
        List<RiskRule> rules = riskRuleRepository.findAll(Sort.by("category", "code"));
        return ResponseEntity.ok(rules);
    }

    @GetMapping("/rules/{id}")
    public ResponseEntity<RiskRule> getRule(@PathVariable Long id) {
        return riskRuleRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/rules/{id}")
    public ResponseEntity<RiskRule> updateRule(@PathVariable Long id, @RequestBody RiskRule ruleUpdate) {
        return riskRuleRepository.findById(id)
                .map(rule -> {
                    if (ruleUpdate.getName() != null) rule.setName(ruleUpdate.getName());
                    if (ruleUpdate.getDescription() != null) rule.setDescription(ruleUpdate.getDescription());
                    if (ruleUpdate.getScorePoints() != null) rule.setScorePoints(ruleUpdate.getScorePoints());
                    if (ruleUpdate.getIsEnabled() != null) rule.setIsEnabled(ruleUpdate.getIsEnabled());
                    if (ruleUpdate.getConfigJson() != null) rule.setConfigJson(ruleUpdate.getConfigJson());
                    RiskRule saved = riskRuleRepository.save(rule);
                    log.info("Updated risk rule: {}", rule.getCode());
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/rules/{id}/toggle")
    public ResponseEntity<RiskRule> toggleRule(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        Boolean enabled = body.get("enabled");
        return riskRuleRepository.findById(id)
                .map(rule -> {
                    rule.setIsEnabled(enabled);
                    RiskRule saved = riskRuleRepository.save(rule);
                    log.info("Toggled risk rule {}: enabled={}", rule.getCode(), enabled);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/rules/{id}/points")
    public ResponseEntity<RiskRule> updateRulePoints(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        Integer points = body.get("points");
        return riskRuleRepository.findById(id)
                .map(rule -> {
                    rule.setScorePoints(points);
                    RiskRule saved = riskRuleRepository.save(rule);
                    log.info("Updated risk rule {} points: {}", rule.getCode(), points);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ==================== THRESHOLDS ====================

    @GetMapping("/thresholds")
    public ResponseEntity<List<RiskThreshold>> getAllThresholds() {
        List<RiskThreshold> thresholds = riskThresholdRepository.findAll(Sort.by("minScore"));
        return ResponseEntity.ok(thresholds);
    }

    @PutMapping("/thresholds/{id}")
    public ResponseEntity<RiskThreshold> updateThreshold(@PathVariable Long id, @RequestBody RiskThreshold thresholdUpdate) {
        return riskThresholdRepository.findById(id)
                .map(threshold -> {
                    if (thresholdUpdate.getName() != null) threshold.setName(thresholdUpdate.getName());
                    if (thresholdUpdate.getMinScore() != null) threshold.setMinScore(thresholdUpdate.getMinScore());
                    threshold.setMaxScore(thresholdUpdate.getMaxScore()); // Can be null
                    if (thresholdUpdate.getAction() != null) threshold.setAction(thresholdUpdate.getAction());
                    if (thresholdUpdate.getNotificationEnabled() != null) threshold.setNotificationEnabled(thresholdUpdate.getNotificationEnabled());
                    if (thresholdUpdate.getIsEnabled() != null) threshold.setIsEnabled(thresholdUpdate.getIsEnabled());
                    RiskThreshold saved = riskThresholdRepository.save(threshold);
                    log.info("Updated risk threshold: {}", threshold.getName());
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/thresholds/{id}/toggle")
    public ResponseEntity<RiskThreshold> toggleThreshold(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        Boolean enabled = body.get("enabled");
        return riskThresholdRepository.findById(id)
                .map(threshold -> {
                    threshold.setIsEnabled(enabled);
                    RiskThreshold saved = riskThresholdRepository.save(threshold);
                    log.info("Toggled risk threshold {}: enabled={}", threshold.getName(), enabled);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ==================== EVENTS ====================

    @GetMapping("/events")
    public ResponseEntity<Page<RiskEvent>> getEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) Integer minScore,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) String actionTaken) {

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<RiskEvent> events;
        if (username != null && !username.isEmpty()) {
            events = riskEventRepository.findByUsername(username, pageRequest);
        } else if (minScore != null) {
            events = riskEventRepository.findByTotalRiskScoreGreaterThanEqual(minScore, pageRequest);
        } else if (eventType != null && !eventType.isEmpty()) {
            events = riskEventRepository.findByEventType(RiskEvent.EventType.valueOf(eventType), pageRequest);
        } else if (actionTaken != null && !actionTaken.isEmpty()) {
            events = riskEventRepository.findByActionTaken(RiskEvent.ActionTaken.valueOf(actionTaken), pageRequest);
        } else {
            events = riskEventRepository.findAll(pageRequest);
        }

        return ResponseEntity.ok(events);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(@RequestParam(defaultValue = "7") int days) {
        // Simplified stats - in production would aggregate from events
        long totalEvents = riskEventRepository.count();

        return ResponseEntity.ok(Map.of(
                "totalEvents", totalEvents,
                "blockedEvents", 0,
                "mfaRequestedEvents", 0,
                "averageScore", 0,
                "period", days + " days"
        ));
    }
}
