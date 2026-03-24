package com.globalcmx.api.scheduler.service;

import com.globalcmx.api.scheduler.dto.command.CreateScheduledJobCommand;
import com.globalcmx.api.scheduler.dto.command.UpdateScheduledJobCommand;
import com.globalcmx.api.scheduler.dto.query.DeadLetterDTO;
import com.globalcmx.api.scheduler.dto.query.ExecutionLogDTO;
import com.globalcmx.api.scheduler.dto.query.ScheduledJobDTO;
import com.globalcmx.api.scheduler.entity.ScheduledJobConfigReadModel;
import com.globalcmx.api.scheduler.entity.ScheduledJobConfigReadModel.ExecutionStatus;
import com.globalcmx.api.scheduler.entity.ScheduledJobConfigReadModel.JobType;
import com.globalcmx.api.scheduler.entity.ScheduledJobDeadLetter;
import com.globalcmx.api.scheduler.entity.ScheduledJobExecutionLog;
import com.globalcmx.api.scheduler.repository.ScheduledJobConfigRepository;
import com.globalcmx.api.scheduler.repository.ScheduledJobDeadLetterRepository;
import com.globalcmx.api.scheduler.repository.ScheduledJobExecutionLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduledJobConfigService {

    private final ScheduledJobConfigRepository configRepository;
    private final ScheduledJobExecutionLogRepository executionLogRepository;
    private final ScheduledJobDeadLetterRepository deadLetterRepository;
    private final DynamicSchedulerService dynamicSchedulerService;

    // ==================== Job Configuration CRUD ====================

    public Page<ScheduledJobDTO> findAll(Pageable pageable) {
        return configRepository.findAll(pageable).map(ScheduledJobDTO::fromEntity);
    }

    public Page<ScheduledJobDTO> search(String search, JobType jobType, Boolean enabled, Pageable pageable) {
        return configRepository.searchJobs(search, jobType, enabled, pageable).map(ScheduledJobDTO::fromEntity);
    }

    public Optional<ScheduledJobDTO> findByCode(String code) {
        return configRepository.findByCode(code).map(ScheduledJobDTO::fromEntity);
    }

    public ScheduledJobDTO getByCode(String code) {
        return findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Scheduled job not found: " + code));
    }

    public List<ScheduledJobDTO> findEnabled() {
        return configRepository.findByIsEnabledTrue().stream()
                .map(ScheduledJobDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ScheduledJobDTO> findRunning() {
        return configRepository.findRunningJobs().stream()
                .map(ScheduledJobDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public ScheduledJobDTO create(CreateScheduledJobCommand command) {
        log.info("Creating scheduled job: {}", command.getCode());

        if (configRepository.existsByCode(command.getCode())) {
            throw new IllegalArgumentException("Job with code already exists: " + command.getCode());
        }

        validateScheduleConfig(command.getScheduleType(), command.getCronExpression(),
                command.getFixedRateMs(), command.getFixedDelayMs());

        validateJobTypeConfig(command.getJobType(), command.getServiceBeanName(),
                command.getServiceMethodName(), command.getExternalApiConfigCode(),
                command.getRuleCode(), command.getSqlQuery());

        var config = ScheduledJobConfigReadModel.builder()
                .code(command.getCode())
                .name(command.getName())
                .description(command.getDescription())
                .scheduleType(command.getScheduleType())
                .cronExpression(command.getCronExpression())
                .fixedRateMs(command.getFixedRateMs())
                .fixedDelayMs(command.getFixedDelayMs())
                .initialDelayMs(command.getInitialDelayMs())
                .timezone(command.getTimezone())
                .jobType(command.getJobType())
                .serviceBeanName(command.getServiceBeanName())
                .serviceMethodName(command.getServiceMethodName())
                .externalApiConfigCode(command.getExternalApiConfigCode())
                .ruleCode(command.getRuleCode())
                .sqlQuery(command.getSqlQuery())
                .jobParameters(command.getJobParameters())
                .apiRequestContext(command.getApiRequestContext())
                .retryOnFailure(command.getRetryOnFailure())
                .maxRetries(command.getMaxRetries())
                .retryDelaySeconds(command.getRetryDelaySeconds())
                .retryBackoffMultiplier(command.getRetryBackoffMultiplier())
                .alertOnFailure(command.getAlertOnFailure())
                .alertEmailRecipients(command.getAlertEmailRecipients())
                .consecutiveFailuresThreshold(command.getConsecutiveFailuresThreshold())
                .circuitBreakerEnabled(command.getCircuitBreakerEnabled())
                .circuitBreakerThreshold(command.getCircuitBreakerThreshold())
                .circuitBreakerResetTimeoutSeconds(command.getCircuitBreakerResetTimeoutSeconds())
                .timeoutSeconds(command.getTimeoutSeconds())
                .lockAtMostSeconds(command.getLockAtMostSeconds())
                .lockAtLeastSeconds(command.getLockAtLeastSeconds())
                .isEnabled(command.getIsEnabled() != null ? command.getIsEnabled() : false)
                .isSystemJob(false)
                .isClusterSafe(command.getIsClusterSafe())
                .createdBy(command.getCreatedBy())
                .tenantId(command.getTenantId())
                .build();

        config = configRepository.save(config);

        // Schedule the job if enabled
        if (Boolean.TRUE.equals(config.getIsEnabled())) {
            dynamicSchedulerService.scheduleJob(config);
        }

        log.info("Scheduled job created: {}", config.getCode());
        return ScheduledJobDTO.fromEntity(config);
    }

    @Transactional
    public ScheduledJobDTO update(String code, UpdateScheduledJobCommand command) {
        log.info("Updating scheduled job: {}", code);

        var config = configRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + code));

        if (Boolean.TRUE.equals(config.getIsSystemJob()) && command.getIsEnabled() != null &&
            !command.getIsEnabled().equals(config.getIsEnabled())) {
            // Allow toggling system jobs, but warn
            log.warn("Toggling system job: {}", code);
        }

        // Update fields
        if (command.getName() != null) config.setName(command.getName());
        if (command.getDescription() != null) config.setDescription(command.getDescription());

        if (command.getScheduleType() != null) {
            validateScheduleConfig(command.getScheduleType(), command.getCronExpression(),
                    command.getFixedRateMs(), command.getFixedDelayMs());
            config.setScheduleType(command.getScheduleType());
        }
        if (command.getCronExpression() != null) config.setCronExpression(command.getCronExpression());
        if (command.getFixedRateMs() != null) config.setFixedRateMs(command.getFixedRateMs());
        if (command.getFixedDelayMs() != null) config.setFixedDelayMs(command.getFixedDelayMs());
        if (command.getInitialDelayMs() != null) config.setInitialDelayMs(command.getInitialDelayMs());
        if (command.getTimezone() != null) config.setTimezone(command.getTimezone());

        if (command.getJobType() != null) {
            validateJobTypeConfig(command.getJobType(), command.getServiceBeanName(),
                    command.getServiceMethodName(), command.getExternalApiConfigCode(),
                    command.getRuleCode(), command.getSqlQuery());
            config.setJobType(command.getJobType());
        }
        if (command.getServiceBeanName() != null) config.setServiceBeanName(command.getServiceBeanName());
        if (command.getServiceMethodName() != null) config.setServiceMethodName(command.getServiceMethodName());
        if (command.getExternalApiConfigCode() != null) config.setExternalApiConfigCode(command.getExternalApiConfigCode());
        if (command.getRuleCode() != null) config.setRuleCode(command.getRuleCode());
        if (command.getSqlQuery() != null) config.setSqlQuery(command.getSqlQuery());

        if (command.getJobParameters() != null) config.setJobParameters(command.getJobParameters());
        if (command.getApiRequestContext() != null) config.setApiRequestContext(command.getApiRequestContext());

        if (command.getRetryOnFailure() != null) config.setRetryOnFailure(command.getRetryOnFailure());
        if (command.getMaxRetries() != null) config.setMaxRetries(command.getMaxRetries());
        if (command.getRetryDelaySeconds() != null) config.setRetryDelaySeconds(command.getRetryDelaySeconds());
        if (command.getRetryBackoffMultiplier() != null) config.setRetryBackoffMultiplier(command.getRetryBackoffMultiplier());

        if (command.getAlertOnFailure() != null) config.setAlertOnFailure(command.getAlertOnFailure());
        if (command.getAlertEmailRecipients() != null) config.setAlertEmailRecipients(command.getAlertEmailRecipients());
        if (command.getConsecutiveFailuresThreshold() != null) config.setConsecutiveFailuresThreshold(command.getConsecutiveFailuresThreshold());

        if (command.getCircuitBreakerEnabled() != null) config.setCircuitBreakerEnabled(command.getCircuitBreakerEnabled());
        if (command.getCircuitBreakerThreshold() != null) config.setCircuitBreakerThreshold(command.getCircuitBreakerThreshold());
        if (command.getCircuitBreakerResetTimeoutSeconds() != null) config.setCircuitBreakerResetTimeoutSeconds(command.getCircuitBreakerResetTimeoutSeconds());

        if (command.getTimeoutSeconds() != null) config.setTimeoutSeconds(command.getTimeoutSeconds());
        if (command.getLockAtMostSeconds() != null) config.setLockAtMostSeconds(command.getLockAtMostSeconds());
        if (command.getLockAtLeastSeconds() != null) config.setLockAtLeastSeconds(command.getLockAtLeastSeconds());

        if (command.getIsEnabled() != null) config.setIsEnabled(command.getIsEnabled());
        if (command.getIsClusterSafe() != null) config.setIsClusterSafe(command.getIsClusterSafe());

        config.setUpdatedBy(command.getUpdatedBy());

        config = configRepository.save(config);

        // Reschedule the job
        dynamicSchedulerService.rescheduleJob(code);

        log.info("Scheduled job updated: {}", code);
        return ScheduledJobDTO.fromEntity(config);
    }

    @Transactional
    public void delete(String code, String deletedBy) {
        log.info("Deleting scheduled job: {} by {}", code, deletedBy);

        var config = configRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + code));

        if (Boolean.TRUE.equals(config.getIsSystemJob())) {
            throw new IllegalArgumentException("Cannot delete system job: " + code);
        }

        // Cancel the scheduled task
        dynamicSchedulerService.cancelJob(code);

        // Delete the config
        configRepository.delete(config);

        log.info("Scheduled job deleted: {}", code);
    }

    @Transactional
    public ScheduledJobDTO toggle(String code, String updatedBy) {
        log.info("Toggling scheduled job: {}", code);

        var config = configRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + code));

        boolean newState = !Boolean.TRUE.equals(config.getIsEnabled());
        config.setIsEnabled(newState);
        config.setUpdatedBy(updatedBy);

        config = configRepository.save(config);

        // Reschedule or cancel based on new state
        if (newState) {
            dynamicSchedulerService.scheduleJob(config);
        } else {
            dynamicSchedulerService.cancelJob(code);
        }

        log.info("Scheduled job {} {}", code, newState ? "enabled" : "disabled");
        return ScheduledJobDTO.fromEntity(config);
    }

    // ==================== Execution Log Queries ====================

    public Page<ExecutionLogDTO> getExecutions(String jobCode, Pageable pageable) {
        return executionLogRepository.findByJobCodeOrderByStartedAtDesc(jobCode, pageable)
                .map(ExecutionLogDTO::fromEntity);
    }

    public Page<ExecutionLogDTO> getAllExecutions(Pageable pageable) {
        return executionLogRepository.findAll(pageable).map(ExecutionLogDTO::fromEntity);
    }

    public Page<ExecutionLogDTO> searchExecutions(
            String jobCode,
            ScheduledJobExecutionLog.Status status,
            LocalDateTime from,
            LocalDateTime to,
            Pageable pageable) {
        return executionLogRepository.searchExecutions(jobCode, status, from, to, pageable)
                .map(ExecutionLogDTO::fromEntity);
    }

    public Optional<ExecutionLogDTO> getExecution(String executionId) {
        return executionLogRepository.findByExecutionId(executionId).map(ExecutionLogDTO::fromEntity);
    }

    public List<ExecutionLogDTO> getRunningExecutions() {
        return executionLogRepository.findRunningExecutions().stream()
                .map(ExecutionLogDTO::fromEntity)
                .collect(Collectors.toList());
    }

    // ==================== Dead Letter Queries ====================

    public Page<DeadLetterDTO> getDeadLetters(Pageable pageable) {
        Page<DeadLetterDTO> page = deadLetterRepository.findAll(pageable).map(DeadLetterDTO::fromEntity);
        enrichDeadLettersWithJobNames(page.getContent());
        return page;
    }

    public Page<DeadLetterDTO> getPendingDeadLetters(Pageable pageable) {
        Page<DeadLetterDTO> page = deadLetterRepository.findPendingItems(pageable).map(DeadLetterDTO::fromEntity);
        enrichDeadLettersWithJobNames(page.getContent());
        return page;
    }

    public Optional<DeadLetterDTO> getDeadLetter(Long id) {
        return deadLetterRepository.findById(id).map(dl -> {
            var dto = DeadLetterDTO.fromEntity(dl);
            configRepository.findByCode(dl.getJobCode())
                    .ifPresent(config -> dto.setJobName(config.getName()));
            return dto;
        });
    }

    @Transactional
    public DeadLetterDTO retryDeadLetter(Long id, String retriedBy) {
        log.info("Retrying dead letter: {} by {}", id, retriedBy);

        var deadLetter = deadLetterRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Dead letter not found: " + id));

        if (deadLetter.getStatus() != ScheduledJobDeadLetter.Status.PENDING) {
            throw new IllegalStateException("Can only retry PENDING dead letters");
        }

        deadLetter.markAsRetrying();
        deadLetterRepository.save(deadLetter);

        // Trigger the job manually
        // This is async - the dead letter will be resolved if successful
        // TODO: Track the execution and update dead letter status based on result

        return DeadLetterDTO.fromEntity(deadLetter);
    }

    @Transactional
    public DeadLetterDTO abandonDeadLetter(Long id, String abandonedBy, String notes) {
        log.info("Abandoning dead letter: {} by {}", id, abandonedBy);

        var deadLetter = deadLetterRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Dead letter not found: " + id));

        deadLetter.abandon(abandonedBy, notes);
        deadLetterRepository.save(deadLetter);

        return DeadLetterDTO.fromEntity(deadLetter);
    }

    // ==================== Private Helpers ====================

    private void validateScheduleConfig(ScheduledJobConfigReadModel.ScheduleType scheduleType,
                                        String cronExpression, Long fixedRateMs, Long fixedDelayMs) {
        switch (scheduleType) {
            case CRON:
                if (cronExpression == null || cronExpression.isBlank()) {
                    throw new IllegalArgumentException("Cron expression is required for CRON schedule type");
                }
                break;
            case FIXED_RATE:
                if (fixedRateMs == null || fixedRateMs <= 0) {
                    throw new IllegalArgumentException("Fixed rate (ms) is required for FIXED_RATE schedule type");
                }
                break;
            case FIXED_DELAY:
                if (fixedDelayMs == null || fixedDelayMs <= 0) {
                    throw new IllegalArgumentException("Fixed delay (ms) is required for FIXED_DELAY schedule type");
                }
                break;
        }
    }

    private void validateJobTypeConfig(JobType jobType, String serviceBeanName, String serviceMethodName,
                                       String externalApiConfigCode, String ruleCode, String sqlQuery) {
        switch (jobType) {
            case INTERNAL_SERVICE:
                if (serviceBeanName == null || serviceBeanName.isBlank() ||
                    serviceMethodName == null || serviceMethodName.isBlank()) {
                    throw new IllegalArgumentException("Service bean name and method name are required for INTERNAL_SERVICE job type");
                }
                break;
            case EXTERNAL_API:
                if (externalApiConfigCode == null || externalApiConfigCode.isBlank()) {
                    throw new IllegalArgumentException("External API config code is required for EXTERNAL_API job type");
                }
                break;
            case RULE_ENGINE:
                if (ruleCode == null || ruleCode.isBlank()) {
                    throw new IllegalArgumentException("Rule code is required for RULE_ENGINE job type");
                }
                break;
            case SQL_QUERY:
                if (sqlQuery == null || sqlQuery.isBlank()) {
                    throw new IllegalArgumentException("SQL query is required for SQL_QUERY job type");
                }
                break;
        }
    }

    private void enrichDeadLettersWithJobNames(List<DeadLetterDTO> deadLetters) {
        var jobCodes = deadLetters.stream()
                .map(DeadLetterDTO::getJobCode)
                .distinct()
                .collect(Collectors.toList());

        Map<String, String> codeToName = configRepository.findAll().stream()
                .filter(c -> jobCodes.contains(c.getCode()))
                .collect(Collectors.toMap(ScheduledJobConfigReadModel::getCode, ScheduledJobConfigReadModel::getName));

        deadLetters.forEach(dl -> dl.setJobName(codeToName.get(dl.getJobCode())));
    }
}
