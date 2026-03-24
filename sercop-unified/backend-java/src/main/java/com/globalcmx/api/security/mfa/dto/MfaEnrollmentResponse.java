package com.globalcmx.api.security.mfa.dto;

import com.globalcmx.api.security.mfa.entity.MfaMethod;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

/**
 * Response after enrolling an MFA method.
 */
@Data
@Builder
public class MfaEnrollmentResponse {

    private Long enrollmentId;
    private MfaMethod method;
    private String methodDisplayName;

    /**
     * For TOTP: Base64 encoded QR code image.
     */
    private String qrCodeBase64;

    /**
     * For TOTP: Manual entry secret (if user can't scan QR).
     */
    private String manualEntryKey;

    /**
     * For TOTP: Issuer name shown in authenticator app.
     */
    private String issuer;

    /**
     * For TOTP: Account name shown in authenticator app.
     */
    private String accountName;

    /**
     * Whether verification is required.
     */
    private boolean verificationRequired;

    /**
     * Message to display to user.
     */
    private String message;

    /**
     * Recovery codes (only shown once after enrollment).
     */
    private String[] recoveryCodes;

    private Instant createdAt;
}
