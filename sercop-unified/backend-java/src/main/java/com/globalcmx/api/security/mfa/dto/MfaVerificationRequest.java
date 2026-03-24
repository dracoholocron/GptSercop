package com.globalcmx.api.security.mfa.dto;

import com.globalcmx.api.security.mfa.entity.MfaMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request to verify an MFA code.
 */
@Data
public class MfaVerificationRequest {

    /**
     * The MFA method being verified.
     */
    private MfaMethod method;

    /**
     * The verification code entered by user.
     */
    @NotBlank(message = "Verification code is required")
    @Size(min = 6, max = 8, message = "Code must be 6-8 characters")
    private String code;

    /**
     * Device fingerprint for "remember this device" feature.
     */
    private String deviceFingerprint;

    /**
     * Device name (optional, for display purposes).
     */
    private String deviceName;

    /**
     * Whether to trust this device for future logins.
     */
    private Boolean trustDevice = false;

    /**
     * Whether this is a recovery code instead of MFA code.
     */
    private Boolean isRecoveryCode = false;
}
