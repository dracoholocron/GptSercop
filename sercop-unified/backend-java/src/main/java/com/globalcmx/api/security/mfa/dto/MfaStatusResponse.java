package com.globalcmx.api.security.mfa.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

/**
 * Response containing user's MFA status and enrolled methods.
 */
@Data
@Builder
public class MfaStatusResponse {

    /**
     * Whether MFA is enabled for this user.
     */
    private boolean mfaEnabled;

    /**
     * Whether MFA is enforced (mandatory) for this user.
     */
    private boolean mfaEnforced;

    /**
     * If in grace period, when it expires.
     */
    private Instant gracePeriodUntil;

    /**
     * Last time MFA was verified.
     */
    private Instant lastMfaVerifiedAt;

    /**
     * List of enrolled MFA methods.
     */
    private List<EnrolledMethod> enrolledMethods;

    /**
     * Available methods that can still be enrolled.
     */
    private List<AvailableMethod> availableMethods;

    /**
     * Number of recovery codes remaining.
     */
    private int recoveryCodesRemaining;

    /**
     * Number of trusted devices.
     */
    private int trustedDevicesCount;

    @Data
    @Builder
    public static class EnrolledMethod {
        private Long enrollmentId;
        private String method;
        private String displayName;
        private boolean verified;
        private boolean isPrimary;
        private boolean syncedToIdp;
        private String maskedIdentifier; // e.g., "***-***-1234" for phone
        private Instant enrolledAt;
        private Instant lastUsedAt;
    }

    @Data
    @Builder
    public static class AvailableMethod {
        private String method;
        private String displayName;
        private String description;
        private boolean requiresIdpSync;
    }
}
