package com.globalcmx.api.externalapi.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "external_api_config_read_model")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExternalApiConfigReadModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(name = "base_url", nullable = false, length = 500)
    private String baseUrl;

    @Column(length = 500)
    private String path;

    @Column(name = "http_method", nullable = false, length = 10)
    @Enumerated(EnumType.STRING)
    private HttpMethod httpMethod;

    @Column(name = "content_type", length = 50)
    private String contentType;

    @Column(name = "timeout_ms")
    private Integer timeoutMs;

    @Column(name = "retry_count")
    private Integer retryCount;

    @Column(name = "retry_backoff_multiplier")
    private Double retryBackoffMultiplier;

    @Column(name = "retry_initial_delay_ms")
    private Integer retryInitialDelayMs;

    @Column(name = "retry_max_delay_ms")
    private Integer retryMaxDelayMs;

    @Column(name = "circuit_breaker_enabled")
    private Boolean circuitBreakerEnabled;

    @Column(name = "circuit_breaker_threshold")
    private Integer circuitBreakerThreshold;

    @Column(name = "circuit_breaker_timeout_ms")
    private Integer circuitBreakerTimeoutMs;

    @Column(nullable = false)
    private Boolean active;

    @Column(length = 20)
    private String environment;

    @Column(name = "mock_enabled", nullable = false)
    @Builder.Default
    private Boolean mockEnabled = false;

    @Column(name = "mock_provider", length = 30)
    private String mockProvider;

    @Column(name = "mock_custom_url", length = 500)
    private String mockCustomUrl;

    @OneToOne(mappedBy = "apiConfig", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private ExternalApiAuthConfig authConfig;

    @OneToMany(mappedBy = "apiConfig", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<ExternalApiRequestTemplate> requestTemplates = new ArrayList<>();

    @OneToMany(mappedBy = "apiConfig", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private Set<ExternalApiResponseConfig> responseConfigs = new HashSet<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (active == null) active = true;
        if (timeoutMs == null) timeoutMs = 30000;
        if (retryCount == null) retryCount = 3;
        if (retryBackoffMultiplier == null) retryBackoffMultiplier = 2.0;
        if (retryInitialDelayMs == null) retryInitialDelayMs = 1000;
        if (retryMaxDelayMs == null) retryMaxDelayMs = 30000;
        if (circuitBreakerEnabled == null) circuitBreakerEnabled = true;
        if (circuitBreakerThreshold == null) circuitBreakerThreshold = 5;
        if (circuitBreakerTimeoutMs == null) circuitBreakerTimeoutMs = 60000;
        if (contentType == null) contentType = "application/json";
        if (environment == null) environment = "PRODUCTION";
        if (mockEnabled == null) mockEnabled = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum HttpMethod {
        GET, POST, PUT, PATCH, DELETE
    }

    public void setAuthConfig(ExternalApiAuthConfig authConfig) {
        this.authConfig = authConfig;
        if (authConfig != null) {
            authConfig.setApiConfig(this);
        }
    }

    public void addResponseConfig(ExternalApiResponseConfig responseConfig) {
        responseConfigs.add(responseConfig);
        responseConfig.setApiConfig(this);
    }

    public ExternalApiResponseConfig getResponseConfig() {
        return responseConfigs != null && !responseConfigs.isEmpty() ? responseConfigs.iterator().next() : null;
    }

    public void addRequestTemplate(ExternalApiRequestTemplate template) {
        requestTemplates.add(template);
        template.setApiConfig(this);
    }

    public void removeRequestTemplate(ExternalApiRequestTemplate template) {
        requestTemplates.remove(template);
        template.setApiConfig(null);
    }
}
