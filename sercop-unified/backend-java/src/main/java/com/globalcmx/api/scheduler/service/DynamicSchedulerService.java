package com.globalcmx.api.scheduler.service;

import com.globalcmx.api.scheduler.entity.ScheduledJobConfigReadModel;
import com.globalcmx.api.scheduler.entity.ScheduledJobConfigReadModel.ScheduleType;
import com.globalcmx.api.scheduler.repository.ScheduledJobConfigRepository;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;
import java.util.TimeZone;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class DynamicSchedulerService {

    private final TaskScheduler taskScheduler;
    private final ScheduledJobConfigRepository jobConfigRepository;
    private final ScheduledJobExecutorService executorService;

    private final Map<String, ScheduledFuture<?>> scheduledTasks = new ConcurrentHashMap<>();
    private final Map<String, LocalDateTime> nextExecutionTimes = new ConcurrentHashMap<>();

    @EventListener(ApplicationReadyEvent.class)
    public void initializeScheduler() {
        log.info("Initializing dynamic scheduler...");
        try {
            var enabledJobs = jobConfigRepository.findByIsEnabledTrue();
            log.info("Found {} enabled jobs to schedule", enabledJobs.size());

            for (var jobConfig : enabledJobs) {
                try {
                    scheduleJob(jobConfig);
                } catch (Exception e) {
                    log.error("Failed to schedule job: {}", jobConfig.getCode(), e);
                }
            }

            log.info("Dynamic scheduler initialized with {} jobs", scheduledTasks.size());
        } catch (Exception e) {
            log.error("Failed to initialize dynamic scheduler", e);
        }
    }

    @PreDestroy
    public void shutdown() {
        log.info("Shutting down dynamic scheduler...");
        scheduledTasks.forEach((code, future) -> {
            try {
                future.cancel(false);
            } catch (Exception e) {
                log.warn("Error cancelling job {}: {}", code, e.getMessage());
            }
        });
        scheduledTasks.clear();
        nextExecutionTimes.clear();
        log.info("Dynamic scheduler shut down");
    }

    public void scheduleJob(ScheduledJobConfigReadModel config) {
        if (config == null || config.getCode() == null) {
            throw new IllegalArgumentException("Job config or code cannot be null");
        }

        String jobCode = config.getCode();
        log.info("Scheduling job: {} (type: {}, schedule: {})",
                jobCode, config.getScheduleType(), getScheduleDescription(config));

        // Cancel existing task if any
        cancelJob(jobCode);

        if (!Boolean.TRUE.equals(config.getIsEnabled())) {
            log.info("Job {} is disabled, not scheduling", jobCode);
            return;
        }

        ScheduledFuture<?> future = switch (config.getScheduleType()) {
            case CRON -> scheduleCronJob(config);
            case FIXED_RATE -> scheduleFixedRateJob(config);
            case FIXED_DELAY -> scheduleFixedDelayJob(config);
        };

        if (future != null) {
            scheduledTasks.put(jobCode, future);
            updateNextExecutionTime(config);
            log.info("Job {} scheduled successfully. Next execution: {}",
                    jobCode, nextExecutionTimes.get(jobCode));
        }
    }

    private ScheduledFuture<?> scheduleCronJob(ScheduledJobConfigReadModel config) {
        String cronExpression = config.getCronExpression();
        if (cronExpression == null || cronExpression.isBlank()) {
            log.error("Cron expression is required for CRON job type: {}", config.getCode());
            return null;
        }

        TimeZone timezone = config.getTimezone() != null
                ? TimeZone.getTimeZone(config.getTimezone())
                : TimeZone.getDefault();

        CronTrigger trigger = new CronTrigger(cronExpression, timezone);

        return taskScheduler.schedule(
                () -> executeJobSafely(config.getCode()),
                trigger
        );
    }

    private ScheduledFuture<?> scheduleFixedRateJob(ScheduledJobConfigReadModel config) {
        Long rateMs = config.getFixedRateMs();
        if (rateMs == null || rateMs <= 0) {
            log.error("Fixed rate is required for FIXED_RATE job type: {}", config.getCode());
            return null;
        }

        Long initialDelay = config.getInitialDelayMs() != null ? config.getInitialDelayMs() : 0L;

        return taskScheduler.scheduleAtFixedRate(
                () -> executeJobSafely(config.getCode()),
                java.time.Instant.now().plusMillis(initialDelay),
                Duration.ofMillis(rateMs)
        );
    }

    private ScheduledFuture<?> scheduleFixedDelayJob(ScheduledJobConfigReadModel config) {
        Long delayMs = config.getFixedDelayMs();
        if (delayMs == null || delayMs <= 0) {
            log.error("Fixed delay is required for FIXED_DELAY job type: {}", config.getCode());
            return null;
        }

        Long initialDelay = config.getInitialDelayMs() != null ? config.getInitialDelayMs() : 0L;

        return taskScheduler.scheduleWithFixedDelay(
                () -> executeJobSafely(config.getCode()),
                java.time.Instant.now().plusMillis(initialDelay),
                Duration.ofMillis(delayMs)
        );
    }

    private void executeJobSafely(String jobCode) {
        try {
            executorService.executeJob(jobCode);
        } catch (Exception e) {
            log.error("Unhandled error executing job {}: {}", jobCode, e.getMessage(), e);
        } finally {
            // Update next execution time after each run
            jobConfigRepository.findByCode(jobCode).ifPresent(this::updateNextExecutionTime);
        }
    }

    public void cancelJob(String jobCode) {
        ScheduledFuture<?> future = scheduledTasks.remove(jobCode);
        if (future != null) {
            future.cancel(false);
            nextExecutionTimes.remove(jobCode);
            log.info("Job {} cancelled", jobCode);
        }
    }

    public void rescheduleJob(String jobCode) {
        log.info("Rescheduling job: {}", jobCode);
        jobConfigRepository.findByCode(jobCode).ifPresentOrElse(
                this::scheduleJob,
                () -> {
                    log.warn("Job not found for rescheduling: {}", jobCode);
                    cancelJob(jobCode);
                }
        );
    }

    public boolean isJobScheduled(String jobCode) {
        ScheduledFuture<?> future = scheduledTasks.get(jobCode);
        return future != null && !future.isCancelled() && !future.isDone();
    }

    public LocalDateTime getNextExecutionTime(String jobCode) {
        return nextExecutionTimes.get(jobCode);
    }

    public Map<String, LocalDateTime> getAllNextExecutionTimes() {
        return Map.copyOf(nextExecutionTimes);
    }

    public int getScheduledJobCount() {
        return scheduledTasks.size();
    }

    private void updateNextExecutionTime(ScheduledJobConfigReadModel config) {
        LocalDateTime nextExecution = calculateNextExecutionTime(config);
        if (nextExecution != null) {
            nextExecutionTimes.put(config.getCode(), nextExecution);

            // Update in database
            try {
                config.setNextExecutionAt(nextExecution);
                jobConfigRepository.save(config);
            } catch (Exception e) {
                log.warn("Failed to update next execution time in database for job {}: {}",
                        config.getCode(), e.getMessage());
            }
        }
    }

    private LocalDateTime calculateNextExecutionTime(ScheduledJobConfigReadModel config) {
        if (config.getScheduleType() == ScheduleType.CRON && config.getCronExpression() != null) {
            try {
                TimeZone timezone = config.getTimezone() != null
                        ? TimeZone.getTimeZone(config.getTimezone())
                        : TimeZone.getDefault();

                CronTrigger trigger = new CronTrigger(config.getCronExpression(), timezone);
                var clock = java.time.Clock.system(timezone.toZoneId());
                var context = new org.springframework.scheduling.TriggerContext() {
                    @Override
                    public java.time.Clock getClock() {
                        return clock;
                    }

                    @Override
                    public java.time.Instant lastScheduledExecution() {
                        return config.getLastExecutionAt() != null
                                ? config.getLastExecutionAt().atZone(timezone.toZoneId()).toInstant()
                                : null;
                    }

                    @Override
                    public java.time.Instant lastActualExecution() {
                        return lastScheduledExecution();
                    }

                    @Override
                    public java.time.Instant lastCompletion() {
                        return lastScheduledExecution();
                    }
                };

                java.time.Instant nextInstant = trigger.nextExecution(context);
                if (nextInstant != null) {
                    return LocalDateTime.ofInstant(nextInstant, ZoneId.systemDefault());
                }
            } catch (Exception e) {
                log.warn("Failed to calculate next execution time for {}: {}", config.getCode(), e.getMessage());
            }
        } else if (config.getScheduleType() == ScheduleType.FIXED_RATE && config.getFixedRateMs() != null) {
            return LocalDateTime.now().plusNanos(config.getFixedRateMs() * 1_000_000);
        } else if (config.getScheduleType() == ScheduleType.FIXED_DELAY && config.getFixedDelayMs() != null) {
            return LocalDateTime.now().plusNanos(config.getFixedDelayMs() * 1_000_000);
        }
        return null;
    }

    private String getScheduleDescription(ScheduledJobConfigReadModel config) {
        return switch (config.getScheduleType()) {
            case CRON -> "cron: " + config.getCronExpression();
            case FIXED_RATE -> "every " + config.getFixedRateMs() + "ms";
            case FIXED_DELAY -> "delay " + config.getFixedDelayMs() + "ms";
        };
    }
}
