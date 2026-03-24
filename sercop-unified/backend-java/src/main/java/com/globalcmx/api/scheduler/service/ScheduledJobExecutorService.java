package com.globalcmx.api.scheduler.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.actions.ActionExecutionResult;
import com.globalcmx.api.externalapi.dto.ExternalApiCallContext;
import com.globalcmx.api.externalapi.service.ExternalApiMappedExecutorService;
import com.globalcmx.api.scheduler.dto.query.JobExecutionResultDTO;
import com.globalcmx.api.scheduler.entity.ScheduledJobConfigReadModel;
import com.globalcmx.api.scheduler.entity.ScheduledJobConfigReadModel.ExecutionStatus;
import com.globalcmx.api.scheduler.entity.ScheduledJobConfigReadModel.JobType;
import com.globalcmx.api.scheduler.entity.ScheduledJobDeadLetter;
import com.globalcmx.api.scheduler.entity.ScheduledJobExecutionLog;
import com.globalcmx.api.scheduler.entity.ScheduledJobExecutionLog.Status;
import com.globalcmx.api.scheduler.entity.ScheduledJobExecutionLog.TriggerType;
import com.globalcmx.api.scheduler.repository.ScheduledJobConfigRepository;
import com.globalcmx.api.scheduler.repository.ScheduledJobDeadLetterRepository;
import com.globalcmx.api.scheduler.repository.ScheduledJobExecutionLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.beans.factory.BeanFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// All transactions in this service use readModelTransactionManager since all scheduler
// repositories are configured to use the readModel datasource

import java.io.PrintWriter;
import java.io.StringWriter;
import java.lang.reflect.Method;
import java.net.InetAddress;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduledJobExecutorService {

    private final ScheduledJobConfigRepository configRepository;
    private final ScheduledJobExecutionLogRepository executionLogRepository;
    private final ScheduledJobDeadLetterRepository deadLetterRepository;
    private final BeanFactory beanFactory;
    private final ObjectMapper objectMapper;
    private final JobAlertService alertService;
    private final ExternalApiMappedExecutorService externalApiExecutorService;

    private final ExecutorService asyncExecutor = Executors.newCachedThreadPool();

    @Transactional("readModelTransactionManager")
    public void executeJob(String jobCode) {
        log.debug("Starting execution of job: {}", jobCode);

        var configOpt = configRepository.findByCode(jobCode);
        if (configOpt.isEmpty()) {
            log.error("Job configuration not found: {}", jobCode);
            return;
        }

        var config = configOpt.get();

        // Check if job is enabled
        if (!Boolean.TRUE.equals(config.getIsEnabled())) {
            log.debug("Job {} is disabled, skipping execution", jobCode);
            return;
        }

        // Check circuit breaker
        if (isCircuitOpen(config)) {
            log.warn("Circuit breaker is open for job: {}", jobCode);
            updateJobStatus(config, ExecutionStatus.CIRCUIT_OPEN);
            return;
        }

        // Create execution log
        String executionId = UUID.randomUUID().toString();
        var executionLog = createExecutionLog(config, executionId, TriggerType.SCHEDULER, null);

        try {
            // Update job status to RUNNING
            updateJobStatus(config, ExecutionStatus.RUNNING);

            // Execute with timeout
            Map<String, Object> result = executeWithTimeout(config, executionLog);

            // Mark as success
            completeExecution(executionLog, Status.SUCCESS, result);
            recordSuccessfulExecution(config);

            log.info("Job {} completed successfully. Execution ID: {}", jobCode, executionId);

        } catch (TimeoutException e) {
            handleTimeout(config, executionLog);
        } catch (Exception e) {
            handleFailure(config, executionLog, e);
        }
    }

    @Transactional("readModelTransactionManager")
    public JobExecutionResultDTO triggerManually(String jobCode, String triggeredBy, String overrideParameters, boolean async) {
        log.info("Manual trigger of job: {} by {}", jobCode, triggeredBy);

        var configOpt = configRepository.findByCode(jobCode);
        if (configOpt.isEmpty()) {
            throw new IllegalArgumentException("Job not found: " + jobCode);
        }

        var config = configOpt.get();
        String executionId = UUID.randomUUID().toString();

        if (async) {
            asyncExecutor.submit(() -> executeManualJob(config, executionId, triggeredBy, overrideParameters));
            return JobExecutionResultDTO.builder()
                    .executionId(executionId)
                    .jobCode(jobCode)
                    .status(Status.RUNNING)
                    .startedAt(LocalDateTime.now())
                    .wasAsync(true)
                    .message("Job triggered asynchronously")
                    .build();
        } else {
            return executeManualJob(config, executionId, triggeredBy, overrideParameters);
        }
    }

    @Transactional("readModelTransactionManager")
    public JobExecutionResultDTO executeManualJob(ScheduledJobConfigReadModel config, String executionId,
                                                   String triggeredBy, String overrideParameters) {
        var executionLog = createExecutionLog(config, executionId, TriggerType.MANUAL, triggeredBy);

        try {
            updateJobStatus(config, ExecutionStatus.RUNNING);

            // Merge override parameters if provided
            String effectiveParameters = overrideParameters != null ? overrideParameters : config.getJobParameters();
            var tempConfig = config;
            if (overrideParameters != null) {
                tempConfig = ScheduledJobConfigReadModel.builder()
                        .code(config.getCode())
                        .jobType(config.getJobType())
                        .serviceBeanName(config.getServiceBeanName())
                        .serviceMethodName(config.getServiceMethodName())
                        .externalApiConfigCode(config.getExternalApiConfigCode())
                        .ruleCode(config.getRuleCode())
                        .sqlQuery(config.getSqlQuery())
                        .jobParameters(effectiveParameters)
                        .apiRequestContext(config.getApiRequestContext())
                        .timeoutSeconds(config.getTimeoutSeconds())
                        .build();
            }

            Map<String, Object> result = executeWithTimeout(tempConfig, executionLog);
            completeExecution(executionLog, Status.SUCCESS, result);
            recordSuccessfulExecution(config);

            return JobExecutionResultDTO.builder()
                    .executionId(executionId)
                    .jobCode(config.getCode())
                    .status(Status.SUCCESS)
                    .startedAt(executionLog.getStartedAt())
                    .completedAt(executionLog.getCompletedAt())
                    .durationMs(executionLog.getDurationMs())
                    .itemsProcessed(executionLog.getItemsProcessed())
                    .itemsSuccess(executionLog.getItemsSuccess())
                    .itemsFailed(executionLog.getItemsFailed())
                    .resultSummary(executionLog.getResultSummary())
                    .wasAsync(false)
                    .build();

        } catch (Exception e) {
            handleFailure(config, executionLog, e);

            return JobExecutionResultDTO.builder()
                    .executionId(executionId)
                    .jobCode(config.getCode())
                    .status(Status.FAILED)
                    .startedAt(executionLog.getStartedAt())
                    .completedAt(executionLog.getCompletedAt())
                    .durationMs(executionLog.getDurationMs())
                    .errorMessage(e.getMessage())
                    .wasAsync(false)
                    .build();
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> executeWithTimeout(ScheduledJobConfigReadModel config, ScheduledJobExecutionLog executionLog)
            throws Exception {

        int timeoutSeconds = config.getTimeoutSeconds() != null ? config.getTimeoutSeconds() : 300;

        Callable<Map<String, Object>> task = () -> executeJobByType(config);

        Future<Map<String, Object>> future = asyncExecutor.submit(task);

        try {
            return future.get(timeoutSeconds, TimeUnit.SECONDS);
        } catch (TimeoutException e) {
            future.cancel(true);
            throw e;
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> executeJobByType(ScheduledJobConfigReadModel config) throws Exception {
        return switch (config.getJobType()) {
            case INTERNAL_SERVICE -> executeInternalService(config);
            case EXTERNAL_API -> executeExternalApi(config);
            case RULE_ENGINE -> executeRuleEngine(config);
            case SQL_QUERY -> executeSqlQuery(config);
        };
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> executeInternalService(ScheduledJobConfigReadModel config) throws Exception {
        String beanName = config.getServiceBeanName();
        String methodName = config.getServiceMethodName();

        if (beanName == null || methodName == null) {
            throw new IllegalArgumentException("Service bean name and method name are required for INTERNAL_SERVICE jobs");
        }

        Object bean = beanFactory.getBean(beanName);
        Map<String, Object> params = parseParameters(config.getJobParameters());

        Method method = findMethod(bean.getClass(), methodName);
        if (method == null) {
            throw new NoSuchMethodException("Method not found: " + methodName + " in " + beanName);
        }

        Object result;
        if (method.getParameterCount() == 0) {
            result = method.invoke(bean);
        } else if (method.getParameterCount() == 1 && method.getParameterTypes()[0].isAssignableFrom(Map.class)) {
            result = method.invoke(bean, params);
        } else {
            throw new IllegalArgumentException("Method must accept zero arguments or a single Map<String, Object> argument");
        }

        if (result instanceof Map) {
            return (Map<String, Object>) result;
        }

        return Map.of("result", result != null ? result : "OK");
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> executeExternalApi(ScheduledJobConfigReadModel config) {
        String apiConfigCode = config.getExternalApiConfigCode();

        if (apiConfigCode == null || apiConfigCode.isBlank()) {
            throw new IllegalArgumentException("External API config code is required for EXTERNAL_API jobs");
        }

        log.info("Executing external API job: {} with API config: {}", config.getCode(), apiConfigCode);

        // Build context from job configuration
        Map<String, Object> contextParams = parseParameters(config.getApiRequestContext());

        ExternalApiCallContext context = ExternalApiCallContext.builder()
                .triggerSource("SCHEDULED_JOB")
                .triggerCode(config.getCode())
                .executingUser("SYSTEM")
                .correlationId(UUID.randomUUID().toString())
                .additionalContext(contextParams)
                .build();

        // Execute the external API call with mappings
        ActionExecutionResult result = externalApiExecutorService.executeWithMappings(apiConfigCode, context);

        // Convert result to Map for job execution tracking
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("success", Boolean.TRUE.equals(result.getSuccess()));
        resultMap.put("actionType", result.getActionType());
        resultMap.put("message", Boolean.TRUE.equals(result.getSuccess()) ? "API call successful" : result.getErrorMessage());
        resultMap.put("callId", context.getCallId());
        resultMap.put("correlationId", context.getCorrelationId());

        if (Boolean.TRUE.equals(result.getSuccess()) && result.getOutputData() != null) {
            resultMap.put("statusCode", result.getOutputData().get("statusCode"));
            resultMap.put("mappedData", result.getOutputData().get("mappedData"));

            // Extract items processed from mapped data if available
            Object mappedData = result.getOutputData().get("mappedData");
            if (mappedData instanceof Map) {
                int itemCount = ((Map<?, ?>) mappedData).size();
                resultMap.put("itemsProcessed", itemCount);
                resultMap.put("itemsSuccess", itemCount);
                resultMap.put("itemsFailed", 0);
            }
        }

        if (!Boolean.TRUE.equals(result.getSuccess())) {
            throw new RuntimeException("External API call failed: " + result.getErrorMessage());
        }

        log.info("External API job {} completed successfully. Call ID: {}", config.getCode(), context.getCallId());
        return resultMap;
    }

    private Map<String, Object> executeRuleEngine(ScheduledJobConfigReadModel config) {
        // This would integrate with RuleExecutorService
        log.info("Executing rule engine job: {} with rule code: {}",
                config.getCode(), config.getRuleCode());

        // Placeholder - integrate with actual rule engine
        return Map.of("status", "NOT_IMPLEMENTED", "message", "Rule engine execution not yet implemented");
    }

    private Map<String, Object> executeSqlQuery(ScheduledJobConfigReadModel config) {
        // This would use JdbcTemplate to execute SQL
        log.info("Executing SQL query job: {}", config.getCode());

        // Placeholder - integrate with actual SQL execution
        return Map.of("status", "NOT_IMPLEMENTED", "message", "SQL query execution not yet implemented");
    }

    private Method findMethod(Class<?> clazz, String methodName) {
        for (Method method : clazz.getMethods()) {
            if (method.getName().equals(methodName)) {
                return method;
            }
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseParameters(String jsonParameters) {
        if (jsonParameters == null || jsonParameters.isBlank()) {
            return new HashMap<>();
        }
        try {
            return objectMapper.readValue(jsonParameters, Map.class);
        } catch (Exception e) {
            log.warn("Failed to parse job parameters: {}", e.getMessage());
            return new HashMap<>();
        }
    }

    private ScheduledJobExecutionLog createExecutionLog(ScheduledJobConfigReadModel config, String executionId,
                                                         TriggerType triggerType, String triggeredByUser) {
        String serverInstance = null;
        String serverIp = null;
        try {
            InetAddress localHost = InetAddress.getLocalHost();
            serverInstance = localHost.getHostName();
            serverIp = localHost.getHostAddress();
        } catch (Exception e) {
            log.debug("Could not determine server info: {}", e.getMessage());
        }

        var log = ScheduledJobExecutionLog.builder()
                .executionId(executionId)
                .jobCode(config.getCode())
                .jobConfigId(config.getId())
                .status(Status.RUNNING)
                .startedAt(LocalDateTime.now())
                .triggeredBy(triggerType)
                .triggeredByUser(triggeredByUser)
                .serverInstance(serverInstance)
                .serverIp(serverIp)
                .threadName(Thread.currentThread().getName())
                .tenantId(config.getTenantId())
                .build();

        return executionLogRepository.save(log);
    }

    private void completeExecution(ScheduledJobExecutionLog executionLog, Status status, Map<String, Object> result) {
        executionLog.complete(status);

        if (result != null) {
            executionLog.setItemsProcessed(getIntFromResult(result, "itemsProcessed", 0));
            executionLog.setItemsSuccess(getIntFromResult(result, "itemsSuccess", 0));
            executionLog.setItemsFailed(getIntFromResult(result, "itemsFailed", 0));
            executionLog.setResultSummary(getStringFromResult(result, "summary"));

            try {
                executionLog.setResultData(objectMapper.writeValueAsString(result));
            } catch (Exception e) {
                log.warn("Failed to serialize result data: {}", e.getMessage());
            }
        }

        executionLogRepository.save(executionLog);
    }

    private void handleTimeout(ScheduledJobConfigReadModel config, ScheduledJobExecutionLog executionLog) {
        log.error("Job {} timed out after {} seconds", config.getCode(), config.getTimeoutSeconds());

        executionLog.complete(Status.TIMEOUT);
        executionLog.setErrorMessage("Job execution timed out after " + config.getTimeoutSeconds() + " seconds");
        executionLogRepository.save(executionLog);

        updateJobStatus(config, ExecutionStatus.TIMEOUT);
        recordFailedExecution(config);

        if (Boolean.TRUE.equals(config.getAlertOnFailure())) {
            alertService.sendTimeoutAlert(config, executionLog);
        }
    }

    private void handleFailure(ScheduledJobConfigReadModel config, ScheduledJobExecutionLog executionLog, Exception e) {
        log.error("Job {} failed: {}", config.getCode(), e.getMessage(), e);

        executionLog.complete(Status.FAILED);
        executionLog.setErrorMessage(e.getMessage());
        executionLog.setErrorStackTrace(getStackTrace(e));
        executionLog.setErrorCode(e.getClass().getSimpleName());
        executionLogRepository.save(executionLog);

        recordFailedExecution(config);

        // Check if should go to dead letter
        if (config.getConsecutiveFailures() != null &&
            config.getMaxRetries() != null &&
            config.getConsecutiveFailures() >= config.getMaxRetries()) {

            createDeadLetterEntry(config, executionLog);
        }

        // Send alert if configured
        if (Boolean.TRUE.equals(config.getAlertOnFailure())) {
            Integer threshold = config.getConsecutiveFailuresThreshold();
            if (threshold == null || config.getConsecutiveFailures() >= threshold) {
                alertService.sendFailureAlert(config, executionLog, e);
            }
        }
    }

    private void createDeadLetterEntry(ScheduledJobConfigReadModel config, ScheduledJobExecutionLog executionLog) {
        var deadLetter = ScheduledJobDeadLetter.builder()
                .jobCode(config.getCode())
                .jobConfigId(config.getId())
                .originalExecutionId(executionLog.getExecutionId())
                .status(ScheduledJobDeadLetter.Status.PENDING)
                .errorMessage(executionLog.getErrorMessage())
                .errorStackTrace(executionLog.getErrorStackTrace())
                .errorCode(executionLog.getErrorCode())
                .retryCount(0)
                .maxRetriesReached(true)
                .originalParameters(config.getJobParameters())
                .originalStartedAt(executionLog.getStartedAt())
                .originalTriggeredBy(executionLog.getTriggeredBy().name())
                .tenantId(config.getTenantId())
                .build();

        deadLetterRepository.save(deadLetter);
        log.warn("Job {} added to dead letter queue after {} failures",
                config.getCode(), config.getConsecutiveFailures());
    }

    private void updateJobStatus(ScheduledJobConfigReadModel config, ExecutionStatus status) {
        config.setLastExecutionStatus(status);
        if (status == ExecutionStatus.RUNNING) {
            config.setLastExecutionAt(LocalDateTime.now());
        }
        configRepository.save(config);
    }

    private void recordSuccessfulExecution(ScheduledJobConfigReadModel config) {
        configRepository.recordSuccessfulExecution(
                config.getCode(),
                LocalDateTime.now(),
                config.getNextExecutionAt()
        );
    }

    private void recordFailedExecution(ScheduledJobConfigReadModel config) {
        configRepository.recordFailedExecution(
                config.getCode(),
                LocalDateTime.now(),
                config.getNextExecutionAt()
        );
    }

    private boolean isCircuitOpen(ScheduledJobConfigReadModel config) {
        if (!Boolean.TRUE.equals(config.getCircuitBreakerEnabled())) {
            return false;
        }

        Integer threshold = config.getCircuitBreakerThreshold();
        Integer resetTimeout = config.getCircuitBreakerResetTimeoutSeconds();

        if (threshold == null || config.getConsecutiveFailures() == null) {
            return false;
        }

        // Check if failures exceed threshold
        if (config.getConsecutiveFailures() < threshold) {
            return false;
        }

        // Check if reset timeout has passed
        if (resetTimeout != null && config.getLastFailureAt() != null) {
            LocalDateTime resetTime = config.getLastFailureAt().plusSeconds(resetTimeout);
            if (LocalDateTime.now().isAfter(resetTime)) {
                // Reset consecutive failures and allow execution
                config.setConsecutiveFailures(0);
                configRepository.save(config);
                return false;
            }
        }

        return true;
    }

    private String getStackTrace(Exception e) {
        StringWriter sw = new StringWriter();
        e.printStackTrace(new PrintWriter(sw));
        return sw.toString();
    }

    private int getIntFromResult(Map<String, Object> result, String key, int defaultValue) {
        Object value = result.get(key);
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return defaultValue;
    }

    private String getStringFromResult(Map<String, Object> result, String key) {
        Object value = result.get(key);
        return value != null ? value.toString() : null;
    }
}
