package com.globalcmx.api.externalapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Result of executing a single API response listener.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListenerExecutionResult {

    /**
     * ID of the listener that was executed
     */
    private Long listenerId;

    /**
     * Name of the listener
     */
    private String listenerName;

    /**
     * Whether execution was successful
     */
    private boolean success;

    /**
     * Status of the execution
     */
    private Status status;

    /**
     * Result data from the execution
     */
    private Object result;

    /**
     * Error message if execution failed
     */
    private String errorMessage;

    /**
     * Exception class if execution failed
     */
    private String errorType;

    /**
     * Execution time in milliseconds
     */
    private Long executionTimeMs;

    /**
     * When execution started
     */
    private LocalDateTime startedAt;

    /**
     * When execution completed
     */
    private LocalDateTime completedAt;

    public enum Status {
        SUCCESS,    // Executed successfully
        FAILED,     // Execution failed
        SKIPPED,    // Skipped (condition not met)
        PENDING,    // Not yet executed
        RETRYING    // Being retried
    }

    /**
     * Creates a successful result
     */
    public static ListenerExecutionResult success(Long listenerId, Object result) {
        return ListenerExecutionResult.builder()
                .listenerId(listenerId)
                .success(true)
                .status(Status.SUCCESS)
                .result(result)
                .build();
    }

    /**
     * Creates a successful result with name
     */
    public static ListenerExecutionResult success(Long listenerId, String listenerName, Object result) {
        return ListenerExecutionResult.builder()
                .listenerId(listenerId)
                .listenerName(listenerName)
                .success(true)
                .status(Status.SUCCESS)
                .result(result)
                .build();
    }

    /**
     * Creates a failed result
     */
    public static ListenerExecutionResult failed(Long listenerId, String errorMessage) {
        return ListenerExecutionResult.builder()
                .listenerId(listenerId)
                .success(false)
                .status(Status.FAILED)
                .errorMessage(errorMessage)
                .build();
    }

    /**
     * Creates a failed result with exception
     */
    public static ListenerExecutionResult failed(Long listenerId, String listenerName, Exception e) {
        return ListenerExecutionResult.builder()
                .listenerId(listenerId)
                .listenerName(listenerName)
                .success(false)
                .status(Status.FAILED)
                .errorMessage(e.getMessage())
                .errorType(e.getClass().getSimpleName())
                .build();
    }

    /**
     * Creates a skipped result
     */
    public static ListenerExecutionResult skipped(Long listenerId, String reason) {
        return ListenerExecutionResult.builder()
                .listenerId(listenerId)
                .success(true)
                .status(Status.SKIPPED)
                .errorMessage(reason)
                .build();
    }

    /**
     * Creates a skipped result with name
     */
    public static ListenerExecutionResult skipped(Long listenerId, String listenerName, String reason) {
        return ListenerExecutionResult.builder()
                .listenerId(listenerId)
                .listenerName(listenerName)
                .success(true)
                .status(Status.SKIPPED)
                .errorMessage(reason)
                .build();
    }
}
