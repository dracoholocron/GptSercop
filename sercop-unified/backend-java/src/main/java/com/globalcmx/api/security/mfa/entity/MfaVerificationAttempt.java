package com.globalcmx.api.security.mfa.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.Instant;

/**
 * Audit log of MFA verification attempts.
 */
@Entity
@Table(name = "mfa_verification_attempt")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MfaVerificationAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "method", nullable = false, length = 20)
    private MfaMethod method;

    @Column(name = "success", nullable = false)
    private Boolean success;

    @Column(name = "failure_reason")
    private String failureReason;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "device_fingerprint")
    private String deviceFingerprint;

    @Column(name = "risk_score")
    private Integer riskScore;

    @Column(name = "triggered_by_risk")
    @Builder.Default
    private Boolean triggeredByRisk = false;

    @Column(name = "attempted_at")
    @Builder.Default
    private Instant attemptedAt = Instant.now();
}
