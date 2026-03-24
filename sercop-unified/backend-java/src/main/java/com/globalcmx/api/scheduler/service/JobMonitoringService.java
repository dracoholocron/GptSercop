package com.globalcmx.api.scheduler.service;

import com.globalcmx.api.scheduler.dto.query.JobStatisticsDTO;
import com.globalcmx.api.scheduler.entity.ScheduledJobConfigReadModel;
import com.globalcmx.api.scheduler.entity.ScheduledJobExecutionLog;
import com.globalcmx.api.scheduler.repository.ScheduledJobConfigRepository;
import com.globalcmx.api.scheduler.repository.ScheduledJobDeadLetterRepository;
import com.globalcmx.api.scheduler.repository.ScheduledJobExecutionLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobMonitoringService {

    private final ScheduledJobConfigRepository configRepository;
    private final ScheduledJobExecutionLogRepository executionLogRepository;
    private final ScheduledJobDeadLetterRepository deadLetterRepository;

    public JobStatisticsDTO getStatistics() {
        LocalDateTime todayStart = LocalDateTime.now().with(LocalTime.MIN);

        // Job counts
        long totalJobs = configRepository.count();
        long enabledJobs = configRepository.countEnabledJobs();
        long runningJobs = configRepository.countRunningJobs();

        List<ScheduledJobConfigReadModel> systemJobs = configRepository.findByIsSystemJobTrue();
        List<ScheduledJobConfigReadModel> customJobs = configRepository.findByIsSystemJobFalse();

        // Execution counts for today
        long executionsToday = executionLogRepository.countExecutionsSince(todayStart);
        long successesToday = executionLogRepository.countExecutionsByStatusSince(
                ScheduledJobExecutionLog.Status.SUCCESS, todayStart);
        long failuresToday = executionLogRepository.countExecutionsByStatusSince(
                ScheduledJobExecutionLog.Status.FAILED, todayStart);

        double successRateToday = executionsToday > 0 ? (successesToday * 100.0 / executionsToday) : 100.0;

        // Dead letter counts
        long pendingDeadLetters = deadLetterRepository.countPending();
        long totalDeadLetters = deadLetterRepository.countUnresolved();

        // Counts by type
        Map<String, Long> jobsByType = configRepository.countByJobType().stream()
                .collect(Collectors.toMap(
                        arr -> arr[0].toString(),
                        arr -> (Long) arr[1]
                ));

        Map<String, Long> jobsByStatus = configRepository.countByExecutionStatus().stream()
                .collect(Collectors.toMap(
                        arr -> arr[0] != null ? arr[0].toString() : "NONE",
                        arr -> (Long) arr[1]
                ));

        Map<String, Long> deadLettersByStatus = deadLetterRepository.countByStatus().stream()
                .collect(Collectors.toMap(
                        arr -> arr[0].toString(),
                        arr -> (Long) arr[1]
                ));

        // Top failing jobs
        Map<String, Long> topFailingJobs = new HashMap<>();
        configRepository.findJobsExceedingFailureThreshold(1).stream()
                .sorted((a, b) -> b.getConsecutiveFailures().compareTo(a.getConsecutiveFailures()))
                .limit(5)
                .forEach(job -> topFailingJobs.put(job.getCode(),
                        job.getConsecutiveFailures() != null ? job.getConsecutiveFailures().longValue() : 0L));

        // Recent activity
        LocalDateTime lastExecutionAt = null;
        LocalDateTime lastSuccessAt = null;
        LocalDateTime lastFailureAt = null;

        var allConfigs = configRepository.findAll();
        for (var config : allConfigs) {
            if (config.getLastExecutionAt() != null &&
                (lastExecutionAt == null || config.getLastExecutionAt().isAfter(lastExecutionAt))) {
                lastExecutionAt = config.getLastExecutionAt();
            }
            if (config.getLastSuccessAt() != null &&
                (lastSuccessAt == null || config.getLastSuccessAt().isAfter(lastSuccessAt))) {
                lastSuccessAt = config.getLastSuccessAt();
            }
            if (config.getLastFailureAt() != null &&
                (lastFailureAt == null || config.getLastFailureAt().isAfter(lastFailureAt))) {
                lastFailureAt = config.getLastFailureAt();
            }
        }

        // Performance metrics
        Double averageExecutionDuration = null;
        Long longestExecutionDuration = null;
        String longestRunningJobCode = null;

        var runningExecutions = executionLogRepository.findRunningExecutions();
        if (!runningExecutions.isEmpty()) {
            for (var exec : runningExecutions) {
                long duration = java.time.Duration.between(exec.getStartedAt(), LocalDateTime.now()).toMillis();
                if (longestExecutionDuration == null || duration > longestExecutionDuration) {
                    longestExecutionDuration = duration;
                    longestRunningJobCode = exec.getJobCode();
                }
            }
        }

        return JobStatisticsDTO.builder()
                .totalJobs(totalJobs)
                .enabledJobs(enabledJobs)
                .disabledJobs(totalJobs - enabledJobs)
                .systemJobs(systemJobs.size())
                .customJobs(customJobs.size())
                .runningJobs(runningJobs)
                .executionsToday(executionsToday)
                .successesToday(successesToday)
                .failuresToday(failuresToday)
                .successRateToday(successRateToday)
                .pendingDeadLetters(pendingDeadLetters)
                .totalDeadLetters(totalDeadLetters)
                .jobsByType(jobsByType)
                .jobsByStatus(jobsByStatus)
                .deadLettersByStatus(deadLettersByStatus)
                .topFailingJobs(topFailingJobs)
                .lastExecutionAt(lastExecutionAt)
                .lastSuccessAt(lastSuccessAt)
                .lastFailureAt(lastFailureAt)
                .averageExecutionDurationMs(averageExecutionDuration)
                .longestExecutionDurationMs(longestExecutionDuration)
                .longestRunningJobCode(longestRunningJobCode)
                .build();
    }

    public Map<String, Object> getJobStatistics(String jobCode) {
        var config = configRepository.findByCode(jobCode)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobCode));

        Map<String, Object> stats = new HashMap<>();
        stats.put("code", config.getCode());
        stats.put("name", config.getName());
        stats.put("isEnabled", config.getIsEnabled());
        stats.put("totalExecutions", config.getTotalExecutions());
        stats.put("totalSuccesses", config.getTotalSuccesses());
        stats.put("totalFailures", config.getTotalFailures());
        stats.put("consecutiveFailures", config.getConsecutiveFailures());

        // Success rate
        double successRate = 0.0;
        if (config.getTotalExecutions() != null && config.getTotalExecutions() > 0) {
            successRate = (config.getTotalSuccesses() != null ? config.getTotalSuccesses() : 0) * 100.0 / config.getTotalExecutions();
        }
        stats.put("successRate", successRate);

        // Average duration
        Double avgDuration = executionLogRepository.getAverageDuration(jobCode);
        stats.put("averageDurationMs", avgDuration);

        // Recent execution counts
        LocalDateTime last24h = LocalDateTime.now().minusHours(24);
        LocalDateTime last7d = LocalDateTime.now().minusDays(7);

        var executions24h = executionLogRepository.findByJobCodeAndDateRange(jobCode, last24h, LocalDateTime.now());
        var executions7d = executionLogRepository.findByJobCodeAndDateRange(jobCode, last7d, LocalDateTime.now());

        stats.put("executions24h", executions24h.size());
        stats.put("executions7d", executions7d.size());

        long successes24h = executions24h.stream()
                .filter(e -> e.getStatus() == ScheduledJobExecutionLog.Status.SUCCESS)
                .count();
        stats.put("successes24h", successes24h);
        stats.put("successRate24h", executions24h.size() > 0 ? successes24h * 100.0 / executions24h.size() : 100.0);

        // Status breakdown
        var statusCounts = executionLogRepository.countByStatusForJob(jobCode);
        Map<String, Long> statusBreakdown = statusCounts.stream()
                .collect(Collectors.toMap(
                        arr -> arr[0].toString(),
                        arr -> (Long) arr[1]
                ));
        stats.put("statusBreakdown", statusBreakdown);

        // Dead letter count
        long deadLetterCount = deadLetterRepository.findByJobCode(jobCode).stream()
                .filter(dl -> dl.getStatus() == com.globalcmx.api.scheduler.entity.ScheduledJobDeadLetter.Status.PENDING ||
                              dl.getStatus() == com.globalcmx.api.scheduler.entity.ScheduledJobDeadLetter.Status.RETRYING)
                .count();
        stats.put("pendingDeadLetters", deadLetterCount);

        return stats;
    }
}
