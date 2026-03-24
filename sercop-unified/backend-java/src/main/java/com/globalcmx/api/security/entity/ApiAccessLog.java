package com.globalcmx.api.security.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

/**
 * Entity to log API access for monitoring and auditing.
 * Tracks who accessed which API endpoint and the result.
 */
@Entity
@Table(name = "api_access_log", indexes = {
    @Index(name = "idx_api_access_username", columnList = "username"),
    @Index(name = "idx_api_access_endpoint", columnList = "http_method, url_pattern"),
    @Index(name = "idx_api_access_timestamp", columnList = "accessed_at"),
    @Index(name = "idx_api_access_status", columnList = "access_granted")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiAccessLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "username", nullable = false, length = 100)
    private String username;

    @Column(name = "http_method", nullable = false, length = 10)
    private String httpMethod;

    @Column(name = "url_pattern", nullable = false, length = 500)
    private String urlPattern;

    @Column(name = "request_uri", nullable = false, length = 1000)
    private String requestUri;

    @Column(name = "endpoint_code", length = 100)
    private String endpointCode;

    @Column(name = "access_granted", nullable = false)
    private Boolean accessGranted;

    @Column(name = "denial_reason", length = 500)
    private String denialReason;

    @Column(name = "required_permissions", length = 1000)
    private String requiredPermissions;

    @Column(name = "user_permissions", length = 2000)
    private String userPermissions;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "accessed_at", nullable = false)
    private Instant accessedAt;

    @Column(name = "response_time_ms")
    private Long responseTimeMs;

    @PrePersist
    protected void onCreate() {
        if (accessedAt == null) {
            accessedAt = Instant.now();
        }
    }
}
