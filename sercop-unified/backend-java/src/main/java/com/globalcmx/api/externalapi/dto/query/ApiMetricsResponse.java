package com.globalcmx.api.externalapi.dto.query;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiMetricsResponse {

    private Long apiConfigId;
    private String apiConfigCode;
    private String apiConfigName;
    private String period;

    private ApiMetricsSummary summary;

    private List<DailyMetrics> dailyMetrics;

    private List<HourlyMetrics> hourlyMetrics;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyMetrics {
        private String date;
        private Long totalCalls;
        private Long successfulCalls;
        private Long failedCalls;
        private Double successRate;
        private Long avgResponseTimeMs;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HourlyMetrics {
        private String dateTime;
        private Integer hour;
        private Long totalCalls;
        private Long successfulCalls;
        private Long failedCalls;
        private Long avgResponseTimeMs;
    }
}
