package com.globalcmx.api.security.audit;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

/**
 * Entity for storing security audit events.
 * Tracks all security-related activities for compliance and monitoring.
 */
@Entity
@Table(name = "security_audit_log",
       indexes = {
           @Index(name = "idx_audit_username", columnList = "username"),
           @Index(name = "idx_audit_event_type", columnList = "event_type"),
           @Index(name = "idx_audit_timestamp", columnList = "timestamp"),
           @Index(name = "idx_audit_severity", columnList = "severity"),
           @Index(name = "idx_audit_ip_address", columnList = "ip_address")
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityAuditEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private EventType eventType;

    @Column(name = "severity", nullable = false)
    @Enumerated(EnumType.STRING)
    private Severity severity;

    @Column(length = 100)
    private String username;

    @Column(name = "ip_address", length = 45)  // IPv6 compatible
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(length = 100)
    private String resource;  // Endpoint or resource accessed

    @Column(length = 50)
    private String action;  // HTTP method or action performed

    @Column(length = 100)
    private String permission;  // Permission checked

    @Column(nullable = false)
    private Boolean success;

    @Column(name = "failure_reason", length = 255)
    private String failureReason;

    @Column(columnDefinition = "TEXT")
    private String details;  // JSON with additional details

    @Column(name = "session_id", length = 100)
    private String sessionId;

    @Column(nullable = false)
    @Builder.Default
    private Instant timestamp = Instant.now();

    @Column(name = "identity_provider", length = 20)
    private String identityProvider;  // LOCAL, AUTH0, AZURE_AD, etc.

    @Column(name = "correlation_id", length = 50)
    private String correlationId;  // For tracing related events

    /**
     * Types of security events to audit
     */
    public enum EventType {
        // Authentication events
        LOGIN_SUCCESS,
        LOGIN_FAILURE,
        LOGOUT,
        TOKEN_REFRESH,
        TOKEN_EXPIRED,
        SESSION_CREATED,
        SESSION_TERMINATED,

        // SSO events
        SSO_LOGIN_INITIATED,
        SSO_LOGIN_SUCCESS,
        SSO_LOGIN_FAILURE,
        SSO_USER_PROVISIONED,
        SSO_USER_UPDATED,
        SSO_GROUP_SYNC,

        // Authorization events
        PERMISSION_GRANTED,
        PERMISSION_DENIED,
        ROLE_ASSIGNED,
        ROLE_REMOVED,
        PERMISSION_ASSIGNED,
        PERMISSION_REMOVED,

        // User management
        USER_CREATED,
        USER_UPDATED,
        USER_DELETED,
        USER_ACTIVATED,
        USER_DEACTIVATED,
        PASSWORD_CHANGED,
        PASSWORD_RESET_REQUESTED,
        PASSWORD_RESET_COMPLETED,

        // Security alerts
        BRUTE_FORCE_DETECTED,
        SUSPICIOUS_ACTIVITY,
        ACCOUNT_LOCKED,
        INVALID_TOKEN,
        CSRF_VIOLATION,
        RATE_LIMIT_EXCEEDED,

        // System events
        SECURITY_CONFIG_CHANGED,
        AUDIT_LOG_EXPORTED,
        ADMIN_ACTION
    }

    /**
     * Severity levels for audit events
     */
    public enum Severity {
        INFO,       // Normal operations
        WARNING,    // Potentially suspicious
        ERROR,      // Failed operations
        CRITICAL    // Security incidents
    }
}
