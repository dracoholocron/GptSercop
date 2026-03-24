package com.globalcmx.api.email.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "email_provider_config")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailProviderConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id")
    private String tenantId;

    @Column(nullable = false)
    private String name;

    @Column(name = "provider_type", nullable = false)
    @JsonProperty("providerType")
    private String providerType; // SMTP, SENDGRID, AWS_SES, MAILGUN

    // SMTP Settings
    @Column(name = "smtp_host")
    private String smtpHost;

    @Column(name = "smtp_port")
    private String smtpPort;

    @Column(name = "smtp_username")
    private String smtpUsername;

    @Column(name = "smtp_password")
    private String smtpPassword;

    @Column(name = "smtp_use_tls")
    private Boolean smtpUseTls;

    @Column(name = "smtp_use_ssl")
    private Boolean smtpUseSsl;

    // API-based providers
    @Column(name = "api_key")
    private String apiKey;

    @Column(name = "api_endpoint")
    private String apiEndpoint;

    @Column(name = "api_region")
    private String apiRegion;

    // Common settings
    @Column(name = "from_email", nullable = false)
    private String fromEmail;

    @Column(name = "from_name", nullable = false)
    private String fromName;

    @Column(name = "reply_to_email")
    private String replyToEmail;

    // Rate limiting
    @Column(name = "rate_limit_per_minute")
    private Integer rateLimitPerMinute;

    @Column(name = "rate_limit_per_hour")
    private Integer rateLimitPerHour;

    @Column(name = "rate_limit_per_day")
    private Integer rateLimitPerDay;

    // Status
    @Column(name = "is_active")
    @JsonProperty("isActive")
    private Boolean isActive;

    @Column(name = "is_default")
    @JsonProperty("isDefault")
    private Boolean isDefault;

    private Integer priority;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private String createdBy;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (isActive == null) isActive = true;
        if (isDefault == null) isDefault = false;
        if (priority == null) priority = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
