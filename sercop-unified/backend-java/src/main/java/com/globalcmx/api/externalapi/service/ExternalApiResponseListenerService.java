package com.globalcmx.api.externalapi.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.externalapi.dto.ExternalApiCallContext;
import com.globalcmx.api.externalapi.dto.ListenerExecutionResult;
import com.globalcmx.api.externalapi.entity.ExternalApiListenerExecutionLog;
import com.globalcmx.api.externalapi.entity.ExternalApiResponseListener;
import com.globalcmx.api.externalapi.entity.ExternalApiResponseListener.ActionType;
import com.globalcmx.api.externalapi.handler.*;
import com.globalcmx.api.externalapi.repository.ExternalApiListenerExecutionLogRepository;
import com.globalcmx.api.externalapi.repository.ExternalApiResponseListenerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * Service for executing external API response listeners.
 * Listeners are triggered after API responses are received and processed.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExternalApiResponseListenerService {

    private final ExternalApiResponseListenerRepository listenerRepository;
    private final ExternalApiListenerExecutionLogRepository executionLogRepository;
    private final ApplicationContext applicationContext;
    private final ObjectMapper objectMapper;

    // Handlers for different action types - these will be injected lazily
    private final ExpressionParser spelParser = new SpelExpressionParser();

    /**
     * Executes all configured listeners for an API after receiving a response.
     *
     * @param apiConfigId The API configuration ID
     * @param context The API call context
     * @param mappedResponseData Data extracted from the response
     * @param wasSuccessful Whether the API call was successful
     * @param apiCallLogId The ID of the API call log entry
     * @param callId The UUID of the API call
     * @return List of execution results
     */
    @Async
    public CompletableFuture<List<ListenerExecutionResult>> executeListeners(
            Long apiConfigId,
            ExternalApiCallContext context,
            Map<String, Object> mappedResponseData,
            boolean wasSuccessful,
            Long apiCallLogId,
            String callId) {

        List<ExternalApiResponseListener> listeners = listenerRepository
                .findByApiConfigIdAndIsActiveTrueOrderByPriorityAsc(apiConfigId);

        List<ListenerExecutionResult> results = new ArrayList<>();

        for (ExternalApiResponseListener listener : listeners) {
            // Check if should execute based on success/failure
            if (shouldSkipListener(listener, wasSuccessful)) {
                results.add(ListenerExecutionResult.skipped(
                        listener.getId(),
                        listener.getName(),
                        wasSuccessful ? "Only runs on failure" : "Only runs on success"));
                continue;
            }

            // Evaluate execution condition
            if (!evaluateCondition(listener.getExecutionCondition(), context, mappedResponseData)) {
                results.add(ListenerExecutionResult.skipped(
                        listener.getId(),
                        listener.getName(),
                        "Condition not met"));
                logExecution(apiCallLogId, callId, listener,
                        ListenerExecutionResult.Status.SKIPPED, null, "Condition not met", null);
                continue;
            }

            // Execute the listener
            LocalDateTime startedAt = LocalDateTime.now();
            long startTime = System.currentTimeMillis();

            try {
                ListenerExecutionResult result = executeListener(listener, context, mappedResponseData);
                result.setListenerName(listener.getName());
                result.setStartedAt(startedAt);
                result.setCompletedAt(LocalDateTime.now());
                result.setExecutionTimeMs(System.currentTimeMillis() - startTime);

                results.add(result);

                logExecution(apiCallLogId, callId, listener,
                        result.isSuccess() ? ListenerExecutionResult.Status.SUCCESS : ListenerExecutionResult.Status.FAILED,
                        result.getResult(), result.getErrorMessage(), result.getExecutionTimeMs());

                if (!result.isSuccess() && Boolean.TRUE.equals(listener.getRetryOnFailure())) {
                    // Schedule retry logic would go here
                    log.warn("Listener {} failed and retry is configured", listener.getName());
                }
            } catch (Exception e) {
                log.error("Error executing listener {}: {}", listener.getName(), e.getMessage(), e);
                ListenerExecutionResult failedResult = ListenerExecutionResult.failed(
                        listener.getId(), listener.getName(), e);
                failedResult.setStartedAt(startedAt);
                failedResult.setCompletedAt(LocalDateTime.now());
                failedResult.setExecutionTimeMs(System.currentTimeMillis() - startTime);

                results.add(failedResult);

                logExecution(apiCallLogId, callId, listener,
                        ListenerExecutionResult.Status.FAILED, null, e.getMessage(),
                        System.currentTimeMillis() - startTime);
            }
        }

        return CompletableFuture.completedFuture(results);
    }

    /**
     * Checks if listener should be skipped based on success/failure status.
     */
    private boolean shouldSkipListener(ExternalApiResponseListener listener, boolean wasSuccessful) {
        if (wasSuccessful && Boolean.TRUE.equals(listener.getOnlyOnFailure())) {
            return true;
        }
        return !wasSuccessful && Boolean.TRUE.equals(listener.getOnlyOnSuccess());
    }

    /**
     * Evaluates the execution condition using SpEL.
     */
    private boolean evaluateCondition(String condition,
                                       ExternalApiCallContext context,
                                       Map<String, Object> responseData) {
        if (condition == null || condition.isBlank()) {
            return true;
        }

        try {
            StandardEvaluationContext evalContext = new StandardEvaluationContext();
            evalContext.setVariable("context", context);
            evalContext.setVariable("response", responseData);
            evalContext.setVariable("apiConfig", context.getApiConfig());
            evalContext.setVariable("operation", context.getOperation());

            return Boolean.TRUE.equals(
                    spelParser.parseExpression(condition).getValue(evalContext, Boolean.class));
        } catch (Exception e) {
            log.warn("Error evaluating condition '{}': {}", condition, e.getMessage());
            return false;
        }
    }

    /**
     * Executes a single listener based on its action type.
     */
    private ListenerExecutionResult executeListener(
            ExternalApiResponseListener listener,
            ExternalApiCallContext context,
            Map<String, Object> responseData) {

        Map<String, Object> actionConfig = parseActionConfig(listener.getActionConfig());

        return switch (listener.getActionType()) {
            case UPDATE_CATALOG -> executeUpdateCatalog(actionConfig, context, responseData);
            case UPDATE_OPERATION -> executeUpdateOperation(actionConfig, context, responseData);
            case UPDATE_ENTITY -> executeUpdateEntity(actionConfig, context, responseData);
            case TRIGGER_RULE -> executeTriggerRule(actionConfig, context, responseData);
            case SEND_NOTIFICATION -> executeSendNotification(actionConfig, context, responseData);
            case QUEUE_JOB -> executeQueueJob(actionConfig, context, responseData);
            case CUSTOM_SERVICE -> executeCustomService(actionConfig, context, responseData);
            case UPSERT_EXCHANGE_RATE -> executeUpsertExchangeRate(actionConfig, context, responseData);
            case UPSERT_ALL_EXCHANGE_RATES -> executeUpsertAllExchangeRates(actionConfig, context, responseData);
        };
    }

    /**
     * Parses the JSON action config into a map.
     */
    private Map<String, Object> parseActionConfig(String actionConfigJson) {
        try {
            return objectMapper.readValue(actionConfigJson, new TypeReference<>() {});
        } catch (Exception e) {
            log.error("Error parsing action config: {}", e.getMessage());
            return Map.of();
        }
    }

    /**
     * Executes UPDATE_CATALOG action.
     */
    private ListenerExecutionResult executeUpdateCatalog(
            Map<String, Object> config,
            ExternalApiCallContext context,
            Map<String, Object> responseData) {
        try {
            CatalogUpdateHandler handler = applicationContext.getBean(CatalogUpdateHandler.class);
            return handler.execute(config, context, responseData);
        } catch (Exception e) {
            return ListenerExecutionResult.failed(null, "Error executing catalog update: " + e.getMessage());
        }
    }

    /**
     * Executes UPDATE_OPERATION action.
     */
    private ListenerExecutionResult executeUpdateOperation(
            Map<String, Object> config,
            ExternalApiCallContext context,
            Map<String, Object> responseData) {
        try {
            OperationUpdateHandler handler = applicationContext.getBean(OperationUpdateHandler.class);
            return handler.execute(config, context, responseData);
        } catch (Exception e) {
            return ListenerExecutionResult.failed(null, "Error executing operation update: " + e.getMessage());
        }
    }

    /**
     * Executes UPDATE_ENTITY action.
     */
    private ListenerExecutionResult executeUpdateEntity(
            Map<String, Object> config,
            ExternalApiCallContext context,
            Map<String, Object> responseData) {
        try {
            EntityUpdateHandler handler = applicationContext.getBean(EntityUpdateHandler.class);
            return handler.execute(config, context, responseData);
        } catch (Exception e) {
            return ListenerExecutionResult.failed(null, "Error executing entity update: " + e.getMessage());
        }
    }

    /**
     * Executes TRIGGER_RULE action.
     */
    private ListenerExecutionResult executeTriggerRule(
            Map<String, Object> config,
            ExternalApiCallContext context,
            Map<String, Object> responseData) {
        try {
            RuleTriggerHandler handler = applicationContext.getBean(RuleTriggerHandler.class);
            return handler.execute(config, context, responseData);
        } catch (Exception e) {
            return ListenerExecutionResult.failed(null, "Error executing rule trigger: " + e.getMessage());
        }
    }

    /**
     * Executes SEND_NOTIFICATION action.
     */
    private ListenerExecutionResult executeSendNotification(
            Map<String, Object> config,
            ExternalApiCallContext context,
            Map<String, Object> responseData) {
        try {
            NotificationHandler handler = applicationContext.getBean(NotificationHandler.class);
            return handler.execute(config, context, responseData);
        } catch (Exception e) {
            return ListenerExecutionResult.failed(null, "Error executing notification: " + e.getMessage());
        }
    }

    /**
     * Executes QUEUE_JOB action.
     */
    private ListenerExecutionResult executeQueueJob(
            Map<String, Object> config,
            ExternalApiCallContext context,
            Map<String, Object> responseData) {
        try {
            JobQueueHandler handler = applicationContext.getBean(JobQueueHandler.class);
            return handler.execute(config, context, responseData);
        } catch (Exception e) {
            return ListenerExecutionResult.failed(null, "Error executing job queue: " + e.getMessage());
        }
    }

    /**
     * Executes UPSERT_EXCHANGE_RATE action using CQRS commands.
     */
    private ListenerExecutionResult executeUpsertExchangeRate(
            Map<String, Object> config,
            ExternalApiCallContext context,
            Map<String, Object> responseData) {
        try {
            ExchangeRateUpsertHandler handler = applicationContext.getBean(ExchangeRateUpsertHandler.class);
            return handler.execute(config, context, responseData);
        } catch (Exception e) {
            return ListenerExecutionResult.failed(null, "Error executing exchange rate upsert: " + e.getMessage());
        }
    }

    /**
     * Executes UPSERT_ALL_EXCHANGE_RATES action - processes multiple rates from a rates object.
     */
    private ListenerExecutionResult executeUpsertAllExchangeRates(
            Map<String, Object> config,
            ExternalApiCallContext context,
            Map<String, Object> responseData) {
        try {
            ExchangeRateUpsertHandler handler = applicationContext.getBean(ExchangeRateUpsertHandler.class);
            return handler.executeAll(config, context, responseData);
        } catch (Exception e) {
            return ListenerExecutionResult.failed(null, "Error executing all exchange rates upsert: " + e.getMessage());
        }
    }

    /**
     * Executes CUSTOM_SERVICE action by invoking a Spring bean method.
     */
    private ListenerExecutionResult executeCustomService(
            Map<String, Object> config,
            ExternalApiCallContext context,
            Map<String, Object> responseData) {

        String beanName = (String) config.get("beanName");
        String methodName = (String) config.get("methodName");
        @SuppressWarnings("unchecked")
        List<String> methodParamExprs = (List<String>) config.get("methodParams");

        if (beanName == null || methodName == null) {
            return ListenerExecutionResult.failed(null,
                    "beanName and methodName are required for CUSTOM_SERVICE action");
        }

        try {
            Object bean = applicationContext.getBean(beanName);

            // Resolve parameters using SpEL
            Object[] resolvedParams = resolveMethodParams(methodParamExprs, context, responseData);

            // Find the method
            Method method = findMethod(bean.getClass(), methodName, resolvedParams.length);
            if (method == null) {
                return ListenerExecutionResult.failed(null,
                        "Method " + methodName + " not found in bean " + beanName);
            }

            // Invoke the method
            Object result = method.invoke(bean, resolvedParams);

            return ListenerExecutionResult.success(null, result);
        } catch (Exception e) {
            log.error("Error executing custom service {}.{}: {}", beanName, methodName, e.getMessage());
            return ListenerExecutionResult.failed(null,
                    "Error invoking " + beanName + "." + methodName + ": " + e.getMessage());
        }
    }

    /**
     * Resolves method parameters using SpEL expressions.
     */
    private Object[] resolveMethodParams(List<String> paramExpressions,
                                          ExternalApiCallContext context,
                                          Map<String, Object> responseData) {
        if (paramExpressions == null || paramExpressions.isEmpty()) {
            return new Object[0];
        }

        StandardEvaluationContext evalContext = new StandardEvaluationContext();
        evalContext.setVariable("response", responseData);
        evalContext.setVariable("context", context);
        evalContext.setVariable("operation", context.getOperation());

        return paramExpressions.stream()
                .map(expr -> resolveExpression(expr, evalContext))
                .toArray();
    }

    /**
     * Resolves a single SpEL expression.
     */
    private Object resolveExpression(String expression, StandardEvaluationContext evalContext) {
        if (expression == null) return null;

        if (expression.startsWith("#")) {
            try {
                return spelParser.parseExpression(expression).getValue(evalContext);
            } catch (Exception e) {
                log.warn("Error resolving expression '{}': {}", expression, e.getMessage());
                return expression;
            }
        }

        return expression;
    }

    /**
     * Finds a method by name and parameter count.
     */
    private Method findMethod(Class<?> clazz, String methodName, int paramCount) {
        for (Method method : clazz.getMethods()) {
            if (method.getName().equals(methodName) && method.getParameterCount() == paramCount) {
                return method;
            }
        }
        return null;
    }

    /**
     * Logs the execution of a listener.
     */
    private void logExecution(Long apiCallLogId, String callId,
                               ExternalApiResponseListener listener,
                               ListenerExecutionResult.Status status,
                               Object result, String errorMessage, Long executionTimeMs) {
        try {
            ExternalApiListenerExecutionLog executionLog = ExternalApiListenerExecutionLog.builder()
                    .apiCallLogId(apiCallLogId)
                    .callId(callId)
                    .listenerId(listener.getId())
                    .listenerName(listener.getName())
                    .actionType(listener.getActionType().name())
                    .status(convertStatus(status))
                    .resultData(result != null ? objectMapper.writeValueAsString(result) : null)
                    .errorMessage(errorMessage)
                    .executionTimeMs(executionTimeMs)
                    .startedAt(LocalDateTime.now().minusNanos(executionTimeMs != null ? executionTimeMs * 1_000_000 : 0))
                    .completedAt(LocalDateTime.now())
                    .build();

            executionLogRepository.save(executionLog);
        } catch (Exception e) {
            log.error("Error logging listener execution: {}", e.getMessage());
        }
    }

    /**
     * Converts ListenerExecutionResult.Status to ExternalApiListenerExecutionLog.Status.
     */
    private ExternalApiListenerExecutionLog.Status convertStatus(ListenerExecutionResult.Status status) {
        return switch (status) {
            case SUCCESS -> ExternalApiListenerExecutionLog.Status.SUCCESS;
            case FAILED -> ExternalApiListenerExecutionLog.Status.FAILED;
            case SKIPPED -> ExternalApiListenerExecutionLog.Status.SKIPPED;
            case PENDING -> ExternalApiListenerExecutionLog.Status.PENDING;
            case RETRYING -> ExternalApiListenerExecutionLog.Status.RETRYING;
        };
    }

    /**
     * Gets all listeners for an API config (for admin UI).
     */
    public List<ExternalApiResponseListener> getListeners(Long apiConfigId) {
        return listenerRepository.findByApiConfigIdOrderByPriorityAsc(apiConfigId);
    }

    /**
     * Saves a listener.
     */
    public ExternalApiResponseListener saveListener(ExternalApiResponseListener listener) {
        return listenerRepository.save(listener);
    }

    /**
     * Deletes a listener.
     */
    public void deleteListener(Long listenerId) {
        listenerRepository.deleteById(listenerId);
    }

    /**
     * Deletes all listeners for an API config.
     */
    public void deleteListeners(Long apiConfigId) {
        listenerRepository.deleteByApiConfigId(apiConfigId);
    }
}
