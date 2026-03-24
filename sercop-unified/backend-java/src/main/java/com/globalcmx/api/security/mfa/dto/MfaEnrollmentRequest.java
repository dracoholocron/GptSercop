package com.globalcmx.api.security.mfa.dto;

import com.globalcmx.api.security.mfa.entity.MfaMethod;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * Request to enroll a new MFA method.
 */
@Data
public class MfaEnrollmentRequest {

    /**
     * The MFA method to enroll.
     */
    private MfaMethod method;

    /**
     * For SMS: Phone number with country code (e.g., +1234567890).
     */
    @Pattern(regexp = "^\\+[1-9]\\d{6,14}$", message = "Invalid phone number format. Use international format: +1234567890")
    private String phoneNumber;

    /**
     * For Email: Backup email address.
     */
    @Email(message = "Invalid email format")
    private String backupEmail;

    /**
     * Whether to set this as the primary MFA method.
     */
    private Boolean setPrimary = false;
}
