package com.globalcmx.api.security.mfa.dto;

import lombok.Builder;
import lombok.Data;

/**
 * Response after MFA verification.
 */
@Data
@Builder
public class MfaVerificationResponse {

    private boolean success;
    private String message;

    /**
     * If this was an enrollment verification, whether the enrollment is now complete.
     */
    private boolean enrollmentComplete;

    /**
     * If device was trusted, the expiration timestamp.
     */
    private String deviceTrustedUntil;

    /**
     * New JWT token with MFA claim (for step-up auth).
     */
    private String token;

    /**
     * If using recovery code, how many codes remain.
     */
    private Integer remainingRecoveryCodes;
}
