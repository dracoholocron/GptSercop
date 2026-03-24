package com.globalcmx.api.externalapi.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "external_api_test_result")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExternalApiTestResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "api_config_id", nullable = false)
    private Long apiConfigId;

    @Column(name = "test_type", nullable = false, length = 50)
    private String testType;

    @Column(name = "test_data_json", columnDefinition = "TEXT")
    private String testDataJson;

    @Column(nullable = false)
    private Boolean success;

    @Column(name = "response_status_code")
    private Integer responseStatusCode;

    @Column(name = "response_body", columnDefinition = "TEXT")
    private String responseBody;

    @Column(name = "execution_time_ms")
    private Long executionTimeMs;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "tested_by", length = 100)
    private String testedBy;

    @Column(name = "tested_at")
    private LocalDateTime testedAt;

    @PrePersist
    protected void onCreate() {
        testedAt = LocalDateTime.now();
    }
}
