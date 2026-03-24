package com.globalcmx.api.scheduler.dto.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobStatisticsDTO {

    // Job counts
    private long totalJobs;
    private long enabledJobs;
    private long disabledJobs;
    private long systemJobs;
    private long customJobs;

    // Execution counts
    private long runningJobs;
    private long executionsToday;
    private long successesToday;
    private long failuresToday;
    private double successRateToday;

    // Dead letter
    private long pendingDeadLetters;
    private long totalDeadLetters;

    // Counts by type
    private Map<String, Long> jobsByType;
    private Map<String, Long> jobsByStatus;
    private Map<String, Long> deadLettersByStatus;

    // Top failing jobs
    private Map<String, Long> topFailingJobs;

    // Recent activity
    private LocalDateTime lastExecutionAt;
    private LocalDateTime lastSuccessAt;
    private LocalDateTime lastFailureAt;

    // Performance metrics
    private Double averageExecutionDurationMs;
    private Long longestExecutionDurationMs;
    private String longestRunningJobCode;
}
