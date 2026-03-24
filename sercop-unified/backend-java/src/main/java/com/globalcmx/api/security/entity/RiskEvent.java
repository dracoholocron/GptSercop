package com.globalcmx.api.security.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "risk_event")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(length = 100)
    private String username;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private EventType eventType;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "device_fingerprint", length = 255)
    private String deviceFingerprint;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "location_country", length = 100)
    private String locationCountry;

    @Column(name = "location_city", length = 100)
    private String locationCity;

    @Column(name = "operation_type", length = 100)
    private String operationType;

    @Column(name = "operation_amount", precision = 15, scale = 2)
    private BigDecimal operationAmount;

    @Column(name = "total_risk_score", nullable = false)
    private Integer totalRiskScore;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "triggered_rules", columnDefinition = "json")
    private List<TriggeredRule> triggeredRules;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_taken", nullable = false)
    private ActionTaken actionTaken;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "additional_context", columnDefinition = "json")
    private Map<String, Object> additionalContext;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public enum EventType {
        LOGIN,
        OPERATION,
        APPROVAL,
        DATA_ACCESS
    }

    public enum ActionTaken {
        ALLOWED,
        MFA_REQUESTED,
        BLOCKED,
        ADMIN_NOTIFIED
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TriggeredRule {
        private String ruleCode;
        private String ruleName;
        private Integer points;
        private String reason;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
