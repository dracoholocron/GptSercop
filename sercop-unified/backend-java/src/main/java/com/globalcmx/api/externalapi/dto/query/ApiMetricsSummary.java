package com.globalcmx.api.externalapi.dto.query;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiMetricsSummary {

    private Long totalCalls;
    private Long successfulCalls;
    private Long failedCalls;
    private Double successRate;
    private Long avgResponseTimeMs;
    private Long maxResponseTimeMs;
    private Long minResponseTimeMs;
    private LocalDateTime lastCallAt;
    private String circuitBreakerStatus;

    private Integer timeoutErrors;
    private Integer connectionErrors;
    private Integer authErrors;
    private Integer serverErrors;
    private Integer clientErrors;

    private Double successRateTrend;
    private Double avgResponseTimeTrend;
}
