package com.globalcmx.api.security.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "risk_threshold")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskThreshold {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "min_score", nullable = false)
    private Integer minScore;

    @Column(name = "max_score")
    private Integer maxScore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RiskAction action;

    @Column(name = "notification_enabled")
    private Boolean notificationEnabled = false;

    @Column(name = "is_enabled")
    private Boolean isEnabled = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum RiskAction {
        ALLOW,
        MFA_REQUIRED,
        STEP_UP_AUTH,
        BLOCK,
        NOTIFY_ADMIN
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public boolean matchesScore(int score) {
        if (maxScore == null) {
            return score >= minScore;
        }
        return score >= minScore && score <= maxScore;
    }
}
