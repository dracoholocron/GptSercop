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
@Table(name = "user_risk_profile")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRiskProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "usual_ip_addresses", columnDefinition = "json")
    private List<String> usualIpAddresses;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "usual_login_hours", columnDefinition = "json")
    private List<Integer> usualLoginHours;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "usual_device_fingerprints", columnDefinition = "json")
    private List<String> usualDeviceFingerprints;

    @Column(name = "avg_daily_operations")
    private Integer avgDailyOperations = 0;

    @Column(name = "avg_operation_amount", precision = 15, scale = 2)
    private BigDecimal avgOperationAmount = BigDecimal.ZERO;

    @Column(name = "last_known_location", length = 100)
    private String lastKnownLocation;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "risk_score_history", columnDefinition = "json")
    private List<RiskScoreEntry> riskScoreHistory;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RiskScoreEntry {
        private LocalDateTime timestamp;
        private Integer score;
        private String eventType;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastUpdated = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        lastUpdated = LocalDateTime.now();
    }

    /**
     * Verifica si una IP es conocida para este usuario.
     */
    public boolean isKnownIp(String ipAddress) {
        return usualIpAddresses != null && usualIpAddresses.contains(ipAddress);
    }

    /**
     * Verifica si una hora es habitual para este usuario.
     */
    public boolean isUsualHour(int hour) {
        return usualLoginHours != null && usualLoginHours.contains(hour);
    }

    /**
     * Verifica si un dispositivo es conocido para este usuario.
     */
    public boolean isKnownDevice(String fingerprint) {
        return usualDeviceFingerprints != null && usualDeviceFingerprints.contains(fingerprint);
    }
}
