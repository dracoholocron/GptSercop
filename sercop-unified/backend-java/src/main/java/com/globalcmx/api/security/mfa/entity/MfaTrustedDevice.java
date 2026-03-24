package com.globalcmx.api.security.mfa.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.Instant;

/**
 * Trusted devices that can skip MFA.
 */
@Entity
@Table(name = "mfa_trusted_device")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MfaTrustedDevice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "device_fingerprint", nullable = false)
    private String deviceFingerprint;

    @Column(name = "device_name")
    private String deviceName;

    @Column(name = "device_type", length = 50)
    private String deviceType;

    @Column(name = "browser", length = 100)
    private String browser;

    @Column(name = "os", length = 100)
    private String os;

    @Column(name = "trusted_until", nullable = false)
    private Instant trustedUntil;

    @Column(name = "last_used_at")
    private Instant lastUsedAt;

    @Column(name = "last_ip", length = 45)
    private String lastIp;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();

    /**
     * Check if this device trust is still valid.
     */
    public boolean isValid() {
        return Instant.now().isBefore(trustedUntil);
    }

    /**
     * Record usage of this trusted device.
     */
    public void recordUsage(String ip) {
        this.lastUsedAt = Instant.now();
        this.lastIp = ip;
    }
}
