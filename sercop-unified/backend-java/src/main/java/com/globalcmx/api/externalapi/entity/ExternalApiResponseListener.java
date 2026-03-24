package com.globalcmx.api.externalapi.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Entity for configuring actions to execute after an API response is received.
 * Listeners are triggered when API calls complete (successfully or not).
 */
@Entity
@Table(name = "external_api_response_listener")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExternalApiResponseListener {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "api_config_id", nullable = false)
    private Long apiConfigId;

    /**
     * Name of the listener for identification
     */
    @Column(name = "name", nullable = false, length = 255)
    private String name;

    /**
     * Description of what this listener does
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * Type of action to execute when triggered
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false)
    private ActionType actionType;

    /**
     * SpEL condition that must be true for this listener to execute.
     * Available variables: #response (mapped data), #context (call context), #apiConfig
     * Example: "#response.status == 'SUCCESS'", "#response.exchangeRate > 0"
     */
    @Column(name = "execution_condition", length = 1000)
    private String executionCondition;

    /**
     * JSON configuration specific to the action type.
     * Structure varies by actionType.
     */
    @Column(name = "action_config", columnDefinition = "JSON", nullable = false)
    private String actionConfig;

    /**
     * Execution priority (lower = higher priority)
     */
    @Column(name = "priority")
    @Builder.Default
    private Integer priority = 100;

    /**
     * Whether to retry if execution fails
     */
    @Column(name = "retry_on_failure")
    @Builder.Default
    private Boolean retryOnFailure = false;

    /**
     * Maximum number of retry attempts
     */
    @Column(name = "max_retries")
    @Builder.Default
    private Integer maxRetries = 3;

    /**
     * Delay in seconds between retries
     */
    @Column(name = "retry_delay_seconds")
    @Builder.Default
    private Integer retryDelaySeconds = 60;

    /**
     * Only execute when the API call was successful
     */
    @Column(name = "only_on_success")
    @Builder.Default
    private Boolean onlyOnSuccess = true;

    /**
     * Only execute when the API call failed
     */
    @Column(name = "only_on_failure")
    @Builder.Default
    private Boolean onlyOnFailure = false;

    /**
     * Whether this listener is active
     */
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Types of actions that can be executed by listeners
     */
    public enum ActionType {
        /**
         * Updates a system catalog table
         * Config: { "catalogTable", "catalogKeyField", "catalogKeyValue", "updateFields" }
         */
        UPDATE_CATALOG,

        /**
         * Updates fields in the associated operation
         * Config: { "updateFields": { "fieldName": "#{response.value}" } }
         */
        UPDATE_OPERATION,

        /**
         * Updates any entity via JPA
         * Config: { "entityClass", "findBy", "updateFields" }
         */
        UPDATE_ENTITY,

        /**
         * Triggers an event rule
         * Config: { "ruleCode", "additionalContext" }
         */
        TRIGGER_RULE,

        /**
         * Sends a notification (email, push, etc.)
         * Config: { "notificationType", "templateCode", "recipients", "variables" }
         */
        SEND_NOTIFICATION,

        /**
         * Queues a scheduled job for execution
         * Config: { "jobCode", "parameters", "delay" }
         */
        QUEUE_JOB,

        /**
         * Invokes a custom Spring bean method
         * Config: { "beanName", "methodName", "methodParams" }
         */
        CUSTOM_SERVICE,

        /**
         * Upserts an exchange rate using CQRS commands (creates event history)
         * Config: { "currencyCode", "rateDate", "buyRate", "sellRate", "updatedBy" }
         */
        UPSERT_EXCHANGE_RATE,

        /**
         * Upserts multiple exchange rates from a rates object using CQRS commands
         * Config: { "ratesField", "rateDate", "updatedBy" }
         * The ratesField should contain a map of currency codes to rates
         */
        UPSERT_ALL_EXCHANGE_RATES
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (priority == null) priority = 100;
        if (retryOnFailure == null) retryOnFailure = false;
        if (maxRetries == null) maxRetries = 3;
        if (retryDelaySeconds == null) retryDelaySeconds = 60;
        if (onlyOnSuccess == null) onlyOnSuccess = true;
        if (onlyOnFailure == null) onlyOnFailure = false;
        if (isActive == null) isActive = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
