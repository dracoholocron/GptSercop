package com.globalcmx.api.alerts.service;

import com.globalcmx.api.alerts.dto.AlertResponse;
import com.globalcmx.api.alerts.entity.BusinessRequestReadModel;
import com.globalcmx.api.alerts.entity.UserAlertReadModel;
import com.globalcmx.api.alerts.entity.UserAlertReadModel.*;
import com.globalcmx.api.alerts.repository.UserAlertRepository;
import com.globalcmx.api.realtime.RealTimeNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Service for creating alerts from various system sources.
 * Integrates with operation approval, scheduled jobs, and business requests.
 * Uses SSE for real-time notifications.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AlertCreationService {

    private final UserAlertService alertService;
    private final UserAlertRepository alertRepository;
    private final RealTimeNotificationService realTimeService;

    /**
     * Create alerts from operation approval action.
     * Called by EventActionExecutorService when CREATE_ALERT action is triggered.
     *
     * @param actionParams Parameters from the event action configuration
     * @param operationId The operation ID
     * @param operationReference Operation reference number
     * @param clientId Client ID
     * @param clientName Client name
     * @param assignToUserId User to assign the alert to
     * @param executedBy User who triggered the action
     */
    @Transactional
    public List<AlertResponse> createAlertsFromOperationApproval(
            Map<String, Object> actionParams,
            String operationId,
            String operationReference,
            String clientId,
            String clientName,
            String assignToUserId,
            String executedBy) {

        List<AlertResponse> createdAlerts = new ArrayList<>();

        // Parse action parameters
        String alertTypeStr = (String) actionParams.getOrDefault("alertType", "FOLLOW_UP");
        String title = (String) actionParams.getOrDefault("title", "Seguimiento de operación " + operationReference);
        String description = (String) actionParams.getOrDefault("description", "");
        String priorityStr = (String) actionParams.getOrDefault("priority", "NORMAL");
        Integer daysFromNow = (Integer) actionParams.getOrDefault("daysFromNow", 7);
        String sourceModule = (String) actionParams.getOrDefault("sourceModule", "OPERATIONS");

        AlertType alertType;
        try {
            alertType = AlertType.valueOf(alertTypeStr);
        } catch (IllegalArgumentException e) {
            alertType = AlertType.FOLLOW_UP;
        }

        AlertPriority priority;
        try {
            priority = AlertPriority.valueOf(priorityStr);
        } catch (IllegalArgumentException e) {
            priority = AlertPriority.NORMAL;
        }

        LocalDate scheduledDate = LocalDate.now().plusDays(daysFromNow);

        AlertResponse alert = alertService.createSystemAlert(
            assignToUserId,
            null, // userName will be set later
            title,
            description,
            alertType,
            priority,
            AlertSourceType.OPERATION_APPROVAL,
            operationId,
            operationReference,
            sourceModule,
            scheduledDate,
            operationId,
            clientId,
            clientName,
            executedBy
        );

        createdAlerts.add(alert);

        log.info("Created {} alert(s) from operation approval. Operation: {}, User: {}",
            createdAlerts.size(), operationId, assignToUserId);

        return createdAlerts;
    }

    /**
     * Create alerts from scheduled job execution.
     * Called by ScheduledJobExecutorService when a job needs to create alerts.
     *
     * @param jobCode The job code
     * @param jobName The job name
     * @param alertsData List of alert configurations from job result
     * @param executedBy System user or job executor
     */
    @Transactional
    public List<AlertResponse> createAlertsFromJob(
            String jobCode,
            String jobName,
            List<Map<String, Object>> alertsData,
            String executedBy) {

        List<AlertResponse> createdAlerts = new ArrayList<>();

        for (Map<String, Object> alertData : alertsData) {
            try {
                String userId = (String) alertData.get("userId");
                String title = (String) alertData.getOrDefault("title", "Alerta de " + jobName);
                String description = (String) alertData.getOrDefault("description", "");
                String alertTypeStr = (String) alertData.getOrDefault("alertType", "REMINDER");
                String priorityStr = (String) alertData.getOrDefault("priority", "NORMAL");
                Integer daysFromNow = (Integer) alertData.getOrDefault("daysFromNow", 0);
                String operationId = (String) alertData.get("operationId");
                String clientId = (String) alertData.get("clientId");
                String clientName = (String) alertData.get("clientName");

                if (userId == null) {
                    log.warn("Alert from job {} missing userId, skipping", jobCode);
                    continue;
                }

                AlertType alertType;
                try {
                    alertType = AlertType.valueOf(alertTypeStr);
                } catch (IllegalArgumentException e) {
                    alertType = AlertType.REMINDER;
                }

                AlertPriority priority;
                try {
                    priority = AlertPriority.valueOf(priorityStr);
                } catch (IllegalArgumentException e) {
                    priority = AlertPriority.NORMAL;
                }

                LocalDate scheduledDate = LocalDate.now().plusDays(daysFromNow);

                AlertResponse alert = alertService.createSystemAlert(
                    userId,
                    null,
                    title,
                    description,
                    alertType,
                    priority,
                    AlertSourceType.SCHEDULED_JOB,
                    jobCode,
                    jobCode,
                    "SCHEDULER",
                    scheduledDate,
                    operationId,
                    clientId,
                    clientName,
                    executedBy
                );

                createdAlerts.add(alert);
            } catch (Exception e) {
                log.error("Error creating alert from job {}: {}", jobCode, e.getMessage());
            }
        }

        log.info("Created {} alert(s) from job execution. Job: {}", createdAlerts.size(), jobCode);

        return createdAlerts;
    }

    /**
     * Create alerts from business request approval.
     *
     * @param request The approved business request
     * @param approvedBy User who approved the request
     */
    @Transactional
    public List<AlertResponse> createAlertsFromBusinessRequest(
            BusinessRequestReadModel request,
            String approvedBy) {

        List<AlertResponse> createdAlerts = new ArrayList<>();

        if (request.getAlertsConfig() == null || request.getAlertsConfig().isEmpty()) {
            log.info("No alerts configured for business request {}", request.getRequestId());
            return createdAlerts;
        }

        for (BusinessRequestReadModel.AlertConfig config : request.getAlertsConfig()) {
            try {
                String userId = config.getAssignToUserId() != null ?
                    config.getAssignToUserId() : request.getCreatedBy();

                AlertType alertType;
                try {
                    alertType = AlertType.valueOf(config.getAlertType());
                } catch (IllegalArgumentException e) {
                    alertType = AlertType.FOLLOW_UP;
                }

                AlertPriority priority;
                try {
                    priority = AlertPriority.valueOf(config.getPriority());
                } catch (IllegalArgumentException e) {
                    priority = AlertPriority.NORMAL;
                }

                int daysFromNow = config.getDaysFromNow() != null ? config.getDaysFromNow() : 7;
                LocalDate scheduledDate = LocalDate.now().plusDays(daysFromNow);

                AlertResponse alert = alertService.createSystemAlert(
                    userId,
                    null,
                    config.getTitle(),
                    config.getDescription(),
                    alertType,
                    priority,
                    AlertSourceType.BUSINESS_REQUEST,
                    request.getRequestId(),
                    request.getRequestNumber(),
                    "BUSINESS_REQUESTS",
                    scheduledDate,
                    request.getConvertedToOperationId(),
                    request.getClientId(),
                    request.getClientName(),
                    approvedBy
                );

                createdAlerts.add(alert);
            } catch (Exception e) {
                log.error("Error creating alert from business request {}: {}",
                    request.getRequestId(), e.getMessage());
            }
        }

        log.info("Created {} alert(s) from business request {}",
            createdAlerts.size(), request.getRequestNumber());

        return createdAlerts;
    }

    /**
     * Create a single alert from AI extraction.
     * Called when user clicks "Solicitar Registro" in AI toolbar.
     */
    @Transactional
    public AlertResponse createAlertFromAIExtraction(
            String extractionId,
            String userId,
            String title,
            String description,
            AlertType alertType,
            AlertPriority priority,
            LocalDate scheduledDate,
            String operationId,
            String clientId,
            String clientName,
            String createdBy) {

        return alertService.createSystemAlert(
            userId,
            null,
            title,
            description,
            alertType,
            priority,
            AlertSourceType.AI_EXTRACTION,
            extractionId,
            extractionId,
            "AI_EXTRACTION",
            scheduledDate,
            operationId,
            clientId,
            clientName,
            createdBy
        );
    }

    /**
     * Create video conference invitation alerts for multiple users.
     * Creates an immediate VIDEO_CALL alert for each invited user.
     *
     * @param inviteeUserIds List of user IDs to invite
     * @param title Meeting title
     * @param description Meeting description
     * @param meetingId Meeting ID
     * @param meetingUrl Meeting URL for joining
     * @param meetingProvider Provider (jitsi, googlemeet, teams)
     * @param operationId Related operation ID
     * @param clientId Client ID
     * @param clientName Client name
     * @param organizerUserId User who is organizing the meeting
     * @param organizerName Name of the organizer
     * @return List of created alert responses
     */
    @Transactional
    public List<AlertResponse> createVideoConferenceInvitations(
            List<String> inviteeUserIds,
            String title,
            String description,
            String meetingId,
            String meetingUrl,
            String meetingProvider,
            String operationId,
            String clientId,
            String clientName,
            String organizerUserId,
            String organizerName) {

        List<AlertResponse> createdAlerts = new ArrayList<>();
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        for (String userId : inviteeUserIds) {
            try {
                // Create the alert directly to include video conference fields
                String alertId = java.util.UUID.randomUUID().toString();

                // Tags for video calls: Level 1 = operaciones, Level 2 = soporte
                String videoCallTags = "[\"operaciones\", \"soporte\"]";

                UserAlertReadModel alert = UserAlertReadModel.builder()
                        .alertId(alertId)
                        .userId(userId)
                        .assignedBy(organizerUserId)
                        .title(title)
                        .description(description)
                        .alertType(AlertType.VIDEO_CALL)
                        .priority(AlertPriority.URGENT)
                        .sourceType(AlertSourceType.VIDEO_CONFERENCE)
                        .sourceId(meetingId)
                        .sourceReference(meetingId)
                        .sourceModule("VIDEO_CONFERENCE")
                        .operationId(operationId)
                        .clientId(clientId)
                        .clientName(clientName)
                        .scheduledDate(today)
                        .scheduledTime(now)
                        .status(AlertStatus.PENDING)
                        .meetingId(meetingId)
                        .meetingUrl(meetingUrl)
                        .meetingProvider(meetingProvider)
                        .organizerName(organizerName)
                        .tags(videoCallTags)
                        .createdBy(organizerUserId)
                        .build();

                alert = alertRepository.save(alert);

                // Convert to response
                AlertResponse response = AlertResponse.builder()
                        .alertId(alert.getAlertId())
                        .userId(alert.getUserId())
                        .assignedBy(alert.getAssignedBy())
                        .title(alert.getTitle())
                        .description(alert.getDescription())
                        .alertType(alert.getAlertType())
                        .priority(alert.getPriority())
                        .sourceType(alert.getSourceType())
                        .sourceId(alert.getSourceId())
                        .scheduledDate(alert.getScheduledDate())
                        .scheduledTime(alert.getScheduledTime())
                        .status(alert.getStatus())
                        .operationId(alert.getOperationId())
                        .clientId(alert.getClientId())
                        .clientName(alert.getClientName())
                        .meetingId(alert.getMeetingId())
                        .meetingUrl(alert.getMeetingUrl())
                        .meetingProvider(alert.getMeetingProvider())
                        .organizerName(alert.getOrganizerName())
                        .overdue(false)
                        .dueToday(true)
                        .createdAt(alert.getCreatedAt())
                        .createdBy(alert.getCreatedBy())
                        .build();

                createdAlerts.add(response);

                // Send real-time notification
                try {
                    realTimeService.sendVideoCallInvitation(userId, response);
                    log.info("Sent real-time video call notification to user {} via {}",
                        userId, realTimeService.getProviderName());
                } catch (Exception e) {
                    log.warn("Failed to send real-time notification to user {}: {}", userId, e.getMessage());
                }

                log.info("Created video call invitation alert for user {}. Meeting: {}", userId, meetingId);
            } catch (Exception e) {
                log.error("Error creating video call invitation for user {}: {}", userId, e.getMessage());
            }
        }

        log.info("Created {} video call invitation alert(s). Organizer: {}, Meeting: {}",
                createdAlerts.size(), organizerUserId, meetingId);

        return createdAlerts;
    }
}
