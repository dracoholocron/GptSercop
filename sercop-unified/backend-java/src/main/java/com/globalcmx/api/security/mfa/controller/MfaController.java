package com.globalcmx.api.security.mfa.controller;

import com.globalcmx.api.security.mfa.dto.*;
import com.globalcmx.api.security.mfa.entity.MfaMethod;
import com.globalcmx.api.security.mfa.service.MfaEnrollmentService;
import com.globalcmx.api.security.mfa.service.MfaPolicySyncService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;

/**
 * REST controller for MFA operations.
 */
@Slf4j
@RestController
@RequestMapping("/v1/mfa")
@RequiredArgsConstructor
@Tag(name = "MFA", description = "Multi-Factor Authentication management")
public class MfaController {

    private final MfaEnrollmentService enrollmentService;
    private final MfaPolicySyncService policySyncService;

    /**
     * Get MFA status for the current user.
     */
    @GetMapping("/status")
    @Operation(summary = "Get MFA status", description = "Get MFA enrollment status and available methods")
    public ResponseEntity<MfaStatusResponse> getMfaStatus() {
        Long userId = getCurrentUserId();
        MfaStatusResponse status = enrollmentService.getMfaStatus(userId);
        return ResponseEntity.ok(status);
    }

    /**
     * Start MFA enrollment for a method.
     */
    @PostMapping("/enroll")
    @Operation(summary = "Enroll MFA method", description = "Start enrollment for a new MFA method")
    public ResponseEntity<MfaEnrollmentResponse> enrollMfa(@Valid @RequestBody MfaEnrollmentRequest request) {
        Long userId = getCurrentUserId();
        log.info("User {} starting MFA enrollment for method {}", userId, request.getMethod());
        MfaEnrollmentResponse response = enrollmentService.enrollMfa(userId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Verify MFA code.
     */
    @PostMapping("/verify")
    @Operation(summary = "Verify MFA code", description = "Verify MFA code during enrollment or authentication")
    public ResponseEntity<MfaVerificationResponse> verifyMfa(
            @Valid @RequestBody MfaVerificationRequest request,
            HttpServletRequest httpRequest) {
        Long userId = getCurrentUserId();
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        log.info("User {} verifying MFA code for method {}", userId, request.getMethod());
        MfaVerificationResponse response = enrollmentService.verifyMfa(userId, request, ipAddress, userAgent);
        return ResponseEntity.ok(response);
    }

    /**
     * Remove an MFA enrollment.
     */
    @DeleteMapping("/enroll/{method}")
    @Operation(summary = "Remove MFA method", description = "Remove an enrolled MFA method")
    public ResponseEntity<Void> removeMfaEnrollment(@PathVariable String method) {
        Long userId = getCurrentUserId();
        MfaMethod mfaMethod = MfaMethod.fromCode(method);
        if (mfaMethod == null) {
            return ResponseEntity.badRequest().build();
        }

        log.info("User {} removing MFA enrollment for method {}", userId, method);
        enrollmentService.removeMfaEnrollment(userId, mfaMethod);
        return ResponseEntity.noContent().build();
    }

    /**
     * Revoke a trusted device.
     */
    @DeleteMapping("/trusted-devices/{fingerprint}")
    @Operation(summary = "Revoke trusted device", description = "Revoke a trusted device to require MFA again")
    public ResponseEntity<Void> revokeTrustedDevice(@PathVariable String fingerprint) {
        Long userId = getCurrentUserId();
        log.info("User {} revoking trusted device {}", userId, fingerprint);
        enrollmentService.revokeTrustedDevice(userId, fingerprint);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get step-up authentication URL (for forcing MFA via IdP).
     */
    @GetMapping("/step-up")
    @Operation(summary = "Get step-up auth URL", description = "Get URL for step-up authentication via IdP")
    public ResponseEntity<Map<String, String>> getStepUpAuthUrl(@RequestParam(required = false) String state) {
        Long userId = getCurrentUserId();
        String url = enrollmentService.getStepUpAuthUrl(userId, state != null ? state : "step-up");

        if (url == null) {
            return ResponseEntity.ok(Map.of(
                "type", "internal",
                "message", "Use internal MFA verification"
            ));
        }

        return ResponseEntity.ok(Map.of(
            "type", "redirect",
            "url", url
        ));
    }

    /**
     * Check if MFA is required for a specific action.
     */
    @PostMapping("/check")
    @Operation(summary = "Check MFA requirement", description = "Check if MFA is required based on context")
    public ResponseEntity<Map<String, Object>> checkMfaRequired(
            @RequestBody Map<String, Object> context,
            HttpServletRequest httpRequest) {
        Long userId = getCurrentUserId();
        String deviceFingerprint = (String) context.get("deviceFingerprint");
        int riskScore = context.get("riskScore") != null ? ((Number) context.get("riskScore")).intValue() : 0;

        boolean required = enrollmentService.isMfaRequired(userId, deviceFingerprint, riskScore);

        return ResponseEntity.ok(Map.of(
            "mfaRequired", required,
            "reason", required ? "MFA verification required" : "MFA not required"
        ));
    }

    // --- Admin endpoints ---

    /**
     * Sync MFA policy to all IdPs.
     */
    @PostMapping("/admin/sync-policy")
    @PreAuthorize("hasPermission('CAN_MANAGE_SECURITY_CONFIG')")
    @Operation(summary = "Sync MFA policy to IdPs", description = "Synchronize MFA configuration to identity providers")
    public ResponseEntity<Map<String, Object>> syncMfaPolicy(@RequestBody MfaPolicySyncRequest request) {
        log.info("Admin syncing MFA policy: methods={}, policy={}", request.getEnabledMethods(), request.getPolicy());

        Map<String, Boolean> results = policySyncService.syncToAllProviders(
            request.getEnabledMethods(),
            request.getPolicy()
        );

        return ResponseEntity.ok(Map.of(
            "success", true,
            "results", results
        ));
    }

    /**
     * Get MFA configuration for all IdPs.
     */
    @GetMapping("/admin/config")
    @PreAuthorize("hasPermission('CAN_VIEW_SECURITY_CONFIG')")
    @Operation(summary = "Get MFA configuration", description = "Get current MFA configuration for all IdPs")
    public ResponseEntity<Map<String, Object>> getMfaConfig() {
        return ResponseEntity.ok(policySyncService.getCurrentConfig());
    }

    // --- Helper methods ---

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.globalcmx.api.security.entity.User) {
            return ((com.globalcmx.api.security.entity.User) auth.getPrincipal()).getId();
        }
        throw new IllegalStateException("No authenticated user found");
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Request DTO for MFA policy sync.
     */
    @lombok.Data
    public static class MfaPolicySyncRequest {
        private Set<MfaMethod> enabledMethods;
        private String policy;
    }
}
