package com.globalcmx.api.externalapi.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "external_api_metrics")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExternalApiMetrics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "api_config_id", nullable = false)
    private Long apiConfigId;

    @Column(name = "api_config_code", nullable = false, length = 50)
    private String apiConfigCode;

    @Column(name = "metric_date", nullable = false)
    private LocalDate metricDate;

    @Column(name = "metric_hour")
    private Integer metricHour;

    @Column(name = "total_calls")
    private Integer totalCalls;

    @Column(name = "successful_calls")
    private Integer successfulCalls;

    @Column(name = "failed_calls")
    private Integer failedCalls;

    @Column(name = "avg_response_time_ms")
    private Long avgResponseTimeMs;

    @Column(name = "max_response_time_ms")
    private Long maxResponseTimeMs;

    @Column(name = "min_response_time_ms")
    private Long minResponseTimeMs;

    @Column(name = "timeout_errors")
    private Integer timeoutErrors;

    @Column(name = "connection_errors")
    private Integer connectionErrors;

    @Column(name = "auth_errors")
    private Integer authErrors;

    @Column(name = "server_errors")
    private Integer serverErrors;

    @Column(name = "client_errors")
    private Integer clientErrors;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (totalCalls == null) totalCalls = 0;
        if (successfulCalls == null) successfulCalls = 0;
        if (failedCalls == null) failedCalls = 0;
        if (timeoutErrors == null) timeoutErrors = 0;
        if (connectionErrors == null) connectionErrors = 0;
        if (authErrors == null) authErrors = 0;
        if (serverErrors == null) serverErrors = 0;
        if (clientErrors == null) clientErrors = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Double getSuccessRate() {
        if (totalCalls == null || totalCalls == 0) return 0.0;
        return (successfulCalls != null ? successfulCalls : 0) * 100.0 / totalCalls;
    }
}
