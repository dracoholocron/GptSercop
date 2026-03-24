package com.globalcmx.api.security.mfa.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.Instant;

/**
 * Entity representing a user's MFA enrollment for a specific method.
 */
@Entity
@Table(name = "user_mfa_enrollment")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserMfaEnrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "method", nullable = false, length = 20)
    private MfaMethod method;

    /**
     * For TOTP: Base32 encoded secret.
     */
    @Column(name = "totp_secret")
    private String totpSecret;

    /**
     * For SMS: Phone number with country code.
     */
    @Column(name = "phone_number", length = 30)
    private String phoneNumber;

    /**
     * For Email: Backup/secondary email.
     */
    @Column(name = "backup_email")
    private String backupEmail;

    /**
     * For WebAuthn: Credential ID.
     */
    @Column(name = "webauthn_credential_id", length = 500)
    private String webauthnCredentialId;

    /**
     * For WebAuthn: Public key (JSON).
     */
    @Column(name = "webauthn_public_key", columnDefinition = "TEXT")
    private String webauthnPublicKey;

    /**
     * Whether this enrollment has been verified.
     */
    @Column(name = "verified")
    @Builder.Default
    private Boolean verified = false;

    /**
     * Whether this is the user's primary MFA method.
     */
    @Column(name = "is_primary")
    @Builder.Default
    private Boolean isPrimary = false;

    /**
     * Whether this enrollment has been synced to the IdP.
     */
    @Column(name = "synced_to_idp")
    @Builder.Default
    private Boolean syncedToIdp = false;

    /**
     * The enrollment ID in the IdP system.
     */
    @Column(name = "idp_enrollment_id")
    private String idpEnrollmentId;

    /**
     * Last time this enrollment was synced to the IdP.
     */
    @Column(name = "last_sync_at")
    private Instant lastSyncAt;

    /**
     * Error message from last sync attempt.
     */
    @Column(name = "sync_error", length = 500)
    private String syncError;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "last_used_at")
    private Instant lastUsedAt;

    /**
     * Mark this enrollment as verified.
     */
    public void markVerified() {
        this.verified = true;
        this.verifiedAt = Instant.now();
    }

    /**
     * Mark this enrollment as synced to IdP.
     */
    public void markSynced(String idpEnrollmentId) {
        this.syncedToIdp = true;
        this.idpEnrollmentId = idpEnrollmentId;
        this.lastSyncAt = Instant.now();
        this.syncError = null;
    }

    /**
     * Mark sync as failed.
     */
    public void markSyncFailed(String error) {
        this.syncedToIdp = false;
        this.syncError = error;
        this.lastSyncAt = Instant.now();
    }

    /**
     * Record usage of this MFA method.
     */
    public void recordUsage() {
        this.lastUsedAt = Instant.now();
    }
}
