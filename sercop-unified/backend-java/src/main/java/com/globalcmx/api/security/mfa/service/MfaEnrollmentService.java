package com.globalcmx.api.security.mfa.service;

import com.globalcmx.api.security.entity.User;
import com.globalcmx.api.security.mfa.dto.*;
import com.globalcmx.api.security.mfa.entity.*;
import com.globalcmx.api.security.mfa.idp.IdpMfaSyncService;
import com.globalcmx.api.security.mfa.repository.*;
import com.globalcmx.api.security.repository.UserRepository;
import com.globalcmx.api.security.sso.IdentityProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Main service for MFA enrollment and verification.
 * Orchestrates internal TOTP and IdP synchronization.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MfaEnrollmentService {

    private final UserMfaEnrollmentRepository enrollmentRepository;
    private final MfaVerificationAttemptRepository attemptRepository;
    private final MfaTrustedDeviceRepository trustedDeviceRepository;
    private final UserRepository userRepository;
    private final TotpService totpService;
    private final List<IdpMfaSyncService> idpSyncServices;

    @Value("${mfa.remember_device.days:30}")
    private int rememberDeviceDays;

    @Value("${mfa.recovery_codes.count:10}")
    private int recoveryCodesCount;

    @Value("${mfa.max_failed_attempts:5}")
    private int maxFailedAttempts;

    @Value("${mfa.lockout_duration_minutes:15}")
    private int lockoutDurationMinutes;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Get MFA status for a user.
     */
    public MfaStatusResponse getMfaStatus(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<UserMfaEnrollment> enrollments = enrollmentRepository.findByUserId(userId);
        List<UserMfaEnrollment> verifiedEnrollments = enrollments.stream()
            .filter(UserMfaEnrollment::getVerified)
            .collect(Collectors.toList());

        // Build enrolled methods
        List<MfaStatusResponse.EnrolledMethod> enrolledMethods = enrollments.stream()
            .map(this::toEnrolledMethod)
            .collect(Collectors.toList());

        // Build available methods
        List<MfaStatusResponse.AvailableMethod> availableMethods = Arrays.stream(MfaMethod.values())
            .filter(m -> enrollments.stream().noneMatch(e -> e.getMethod() == m))
            .map(this::toAvailableMethod)
            .collect(Collectors.toList());

        // Count trusted devices
        int trustedDevicesCount = trustedDeviceRepository
            .findValidTrustedDevices(userId, Instant.now()).size();

        return MfaStatusResponse.builder()
            .mfaEnabled(!verifiedEnrollments.isEmpty())
            .mfaEnforced(Boolean.TRUE.equals(user.getMfaEnforced()))
            .gracePeriodUntil(user.getMfaGracePeriodUntil())
            .lastMfaVerifiedAt(user.getLastMfaVerifiedAt())
            .enrolledMethods(enrolledMethods)
            .availableMethods(availableMethods)
            .recoveryCodesRemaining(0) // TODO: implement recovery codes count
            .trustedDevicesCount(trustedDevicesCount)
            .build();
    }

    /**
     * Start MFA enrollment for a method.
     */
    @Transactional
    public MfaEnrollmentResponse enrollMfa(Long userId, MfaEnrollmentRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        MfaMethod method = request.getMethod();

        // Check if already enrolled
        Optional<UserMfaEnrollment> existing = enrollmentRepository.findByUserIdAndMethod(userId, method);
        if (existing.isPresent() && existing.get().getVerified()) {
            throw new IllegalStateException("Already enrolled in " + method.getDisplayName());
        }

        // Create or update enrollment
        UserMfaEnrollment enrollment = existing.orElse(UserMfaEnrollment.builder()
            .userId(userId)
            .method(method)
            .build());

        MfaEnrollmentResponse.MfaEnrollmentResponseBuilder responseBuilder = MfaEnrollmentResponse.builder()
            .method(method)
            .methodDisplayName(method.getDisplayName())
            .verificationRequired(true)
            .createdAt(Instant.now());

        switch (method) {
            case TOTP:
                String secret = totpService.generateSecret();
                enrollment.setTotpSecret(secret);
                String accountName = user.getEmail() != null ? user.getEmail() : user.getUsername();
                String qrCode = totpService.generateQrCode(secret, accountName);

                responseBuilder
                    .qrCodeBase64(qrCode)
                    .manualEntryKey(secret)
                    .issuer(totpService.getIssuer())
                    .accountName(accountName)
                    .message("Escanea el código QR con tu aplicación de autenticación (Google Authenticator, Authy, etc.)");
                break;

            case SMS:
                if (request.getPhoneNumber() == null || request.getPhoneNumber().isEmpty()) {
                    throw new IllegalArgumentException("Phone number is required for SMS MFA");
                }
                enrollment.setPhoneNumber(request.getPhoneNumber());

                // Try to sync to IdP
                syncPhoneToIdp(user, request.getPhoneNumber());

                responseBuilder.message("Se enviará un código de verificación al número " + maskPhone(request.getPhoneNumber()));
                break;

            case EMAIL:
                if (request.getBackupEmail() == null || request.getBackupEmail().isEmpty()) {
                    throw new IllegalArgumentException("Backup email is required for Email MFA");
                }
                enrollment.setBackupEmail(request.getBackupEmail());

                responseBuilder.message("Se enviará un código de verificación a " + maskEmail(request.getBackupEmail()));
                break;

            default:
                throw new IllegalArgumentException("Unsupported MFA method: " + method);
        }

        enrollment.setVerified(false);
        enrollment.setIsPrimary(request.getSetPrimary() != null && request.getSetPrimary());
        enrollment = enrollmentRepository.save(enrollment);

        return responseBuilder
            .enrollmentId(enrollment.getId())
            .build();
    }

    /**
     * Verify MFA code during enrollment or login.
     */
    @Transactional
    public MfaVerificationResponse verifyMfa(Long userId, MfaVerificationRequest request, String ipAddress, String userAgent) {
        // Check for too many failed attempts
        Instant since = Instant.now().minus(lockoutDurationMinutes, ChronoUnit.MINUTES);
        int failedAttempts = attemptRepository.countFailedAttemptsSince(userId, since);
        if (failedAttempts >= maxFailedAttempts) {
            return MfaVerificationResponse.builder()
                .success(false)
                .message("Demasiados intentos fallidos. Intenta de nuevo en " + lockoutDurationMinutes + " minutos.")
                .build();
        }

        MfaMethod method = request.getMethod();
        UserMfaEnrollment enrollment = enrollmentRepository.findByUserIdAndMethod(userId, method)
            .orElseThrow(() -> new IllegalArgumentException("No enrollment found for method: " + method));

        boolean verified = false;
        String failureReason = null;

        switch (method) {
            case TOTP:
                verified = totpService.verifyCode(enrollment.getTotpSecret(), request.getCode());
                if (!verified) {
                    failureReason = "Código TOTP inválido";
                }
                break;

            case SMS:
            case EMAIL:
                // For SMS/Email, the IdP handles verification
                // This would be handled through step-up auth flow
                verified = true; // Assume verified if coming from IdP callback
                break;

            default:
                failureReason = "Método no soportado";
        }

        // Record attempt
        MfaVerificationAttempt attempt = MfaVerificationAttempt.builder()
            .userId(userId)
            .method(method)
            .success(verified)
            .failureReason(failureReason)
            .ipAddress(ipAddress)
            .userAgent(userAgent)
            .deviceFingerprint(request.getDeviceFingerprint())
            .build();
        attemptRepository.save(attempt);

        if (verified) {
            // Mark enrollment as verified
            if (!enrollment.getVerified()) {
                enrollment.markVerified();
                enrollmentRepository.save(enrollment);
            }

            // Update user's last MFA verified timestamp
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                user.setLastMfaVerifiedAt(Instant.now());
                userRepository.save(user);
            }

            // Record usage
            enrollment.recordUsage();
            enrollmentRepository.save(enrollment);

            // Handle trust device
            String trustedUntil = null;
            if (Boolean.TRUE.equals(request.getTrustDevice()) && request.getDeviceFingerprint() != null) {
                Instant until = Instant.now().plus(rememberDeviceDays, ChronoUnit.DAYS);
                MfaTrustedDevice device = MfaTrustedDevice.builder()
                    .userId(userId)
                    .deviceFingerprint(request.getDeviceFingerprint())
                    .deviceName(request.getDeviceName())
                    .trustedUntil(until)
                    .lastIp(ipAddress)
                    .build();
                trustedDeviceRepository.save(device);
                trustedUntil = until.toString();
            }

            return MfaVerificationResponse.builder()
                .success(true)
                .message("Verificación exitosa")
                .enrollmentComplete(!enrollment.getVerified())
                .deviceTrustedUntil(trustedUntil)
                .build();
        } else {
            return MfaVerificationResponse.builder()
                .success(false)
                .message(failureReason != null ? failureReason : "Verificación fallida")
                .build();
        }
    }

    /**
     * Check if MFA is required for a user/device combination.
     */
    public boolean isMfaRequired(Long userId, String deviceFingerprint, int riskScore) {
        // Check if device is trusted
        if (deviceFingerprint != null) {
            boolean isTrusted = trustedDeviceRepository.isDeviceTrusted(userId, deviceFingerprint, Instant.now());
            if (isTrusted) {
                log.debug("Device {} is trusted for user {}, skipping MFA", deviceFingerprint, userId);
                return false;
            }
        }

        // Check if user has MFA enabled
        int verifiedMethods = enrollmentRepository.countVerifiedByUserId(userId);
        if (verifiedMethods == 0) {
            log.debug("User {} has no MFA methods enrolled", userId);
            return false;
        }

        // Check risk-based MFA
        if (riskScore > 50) {
            log.debug("Risk score {} requires MFA for user {}", riskScore, userId);
            return true;
        }

        // Check user's MFA enforcement setting
        User user = userRepository.findById(userId).orElse(null);
        if (user != null && Boolean.TRUE.equals(user.getMfaEnforced())) {
            return true;
        }

        return false;
    }

    /**
     * Remove an MFA enrollment.
     */
    @Transactional
    public void removeMfaEnrollment(Long userId, MfaMethod method) {
        enrollmentRepository.deleteByUserIdAndMethod(userId, method);
        log.info("Removed MFA enrollment {} for user {}", method, userId);
    }

    /**
     * Revoke a trusted device.
     */
    @Transactional
    public void revokeTrustedDevice(Long userId, String deviceFingerprint) {
        trustedDeviceRepository.deleteByUserIdAndDeviceFingerprint(userId, deviceFingerprint);
        log.info("Revoked trusted device {} for user {}", deviceFingerprint, userId);
    }

    /**
     * Get step-up authentication URL for forcing MFA via IdP.
     */
    public String getStepUpAuthUrl(Long userId, String state) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || user.getIdentityProvider() == null) {
            return null;
        }

        IdentityProvider provider = IdentityProvider.fromCode(user.getIdentityProvider());
        IdpMfaSyncService syncService = getIdpSyncService(provider);

        if (syncService != null && syncService.isEnabled()) {
            return syncService.getStepUpAuthUrl(state, null);
        }

        return null;
    }

    // --- Helper methods ---

    private void syncPhoneToIdp(User user, String phoneNumber) {
        if (user.getIdentityProvider() == null || user.getExternalId() == null) {
            return;
        }

        IdentityProvider provider = IdentityProvider.fromCode(user.getIdentityProvider());
        IdpMfaSyncService syncService = getIdpSyncService(provider);

        if (syncService != null && syncService.isEnabled()) {
            syncService.syncUserPhone(user.getExternalId(), phoneNumber);
        }
    }

    private IdpMfaSyncService getIdpSyncService(IdentityProvider provider) {
        return idpSyncServices.stream()
            .filter(s -> s.getProvider() == provider)
            .findFirst()
            .orElse(null);
    }

    private MfaStatusResponse.EnrolledMethod toEnrolledMethod(UserMfaEnrollment enrollment) {
        return MfaStatusResponse.EnrolledMethod.builder()
            .enrollmentId(enrollment.getId())
            .method(enrollment.getMethod().getCode())
            .displayName(enrollment.getMethod().getDisplayName())
            .verified(enrollment.getVerified())
            .isPrimary(enrollment.getIsPrimary())
            .syncedToIdp(enrollment.getSyncedToIdp())
            .maskedIdentifier(getMaskedIdentifier(enrollment))
            .enrolledAt(enrollment.getCreatedAt())
            .lastUsedAt(enrollment.getLastUsedAt())
            .build();
    }

    private MfaStatusResponse.AvailableMethod toAvailableMethod(MfaMethod method) {
        return MfaStatusResponse.AvailableMethod.builder()
            .method(method.getCode())
            .displayName(method.getDisplayName())
            .description(method.getDescription())
            .requiresIdpSync(method.isSupportsIdpSync())
            .build();
    }

    private String getMaskedIdentifier(UserMfaEnrollment enrollment) {
        switch (enrollment.getMethod()) {
            case SMS:
                return maskPhone(enrollment.getPhoneNumber());
            case EMAIL:
                return maskEmail(enrollment.getBackupEmail());
            default:
                return null;
        }
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) return "****";
        return "***-***-" + phone.substring(phone.length() - 4);
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "****@****";
        String[] parts = email.split("@");
        String local = parts[0];
        String domain = parts[1];
        String maskedLocal = local.length() > 2 ? local.substring(0, 2) + "***" : "***";
        return maskedLocal + "@" + domain;
    }
}
