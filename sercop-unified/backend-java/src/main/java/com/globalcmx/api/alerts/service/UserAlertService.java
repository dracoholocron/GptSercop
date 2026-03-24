package com.globalcmx.api.alerts.service;

import com.globalcmx.api.alerts.dto.*;
import com.globalcmx.api.alerts.entity.AlertTypeConfig;
import com.globalcmx.api.alerts.entity.UserAlertHistoryReadModel;
import com.globalcmx.api.alerts.entity.UserAlertReadModel;
import com.globalcmx.api.alerts.entity.UserAlertReadModel.*;
import com.globalcmx.api.alerts.repository.AlertTypeConfigRepository;
import com.globalcmx.api.alerts.repository.UserAlertHistoryRepository;
import com.globalcmx.api.alerts.repository.UserAlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for managing user alerts.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(transactionManager = "readModelTransactionManager")
public class UserAlertService {

    private final UserAlertRepository alertRepository;
    private final UserAlertHistoryRepository historyRepository;
    private final AlertTypeConfigRepository typeConfigRepository;
    private final com.globalcmx.api.realtime.RealTimeNotificationService realTimeService;
    private final com.globalcmx.api.security.repository.UserRepository userRepository;
    private final com.globalcmx.api.security.repository.RoleRepository roleRepository;

    /**
     * Create a new alert. Supports assignment to a user OR a role.
     * If assigned to a role, creates an alert for each user with that role.
     */
    @Transactional
    public List<AlertResponse> createAlert(AlertCreateRequest request, String userId, String userName, String createdBy) {
        List<AlertResponse> createdAlerts = new ArrayList<>();

        // Determine target users
        List<String> targetUserIds = new ArrayList<>();
        String assignedRole = null;

        if (request.getAssignToRole() != null && !request.getAssignToRole().isEmpty()) {
            // Assign to all users with this role
            assignedRole = request.getAssignToRole();
            List<com.globalcmx.api.security.entity.User> roleUsers = userRepository.findByRoleName(assignedRole);
            if (roleUsers.isEmpty()) {
                log.warn("No users found with role: {}", assignedRole);
                throw new IllegalArgumentException("No se encontraron usuarios con el rol: " + assignedRole);
            }
            targetUserIds.addAll(roleUsers.stream().map(com.globalcmx.api.security.entity.User::getUsername).toList());
            log.info("Creating alert for {} users with role {}", targetUserIds.size(), assignedRole);
        } else if (request.getAssignToUserId() != null && !request.getAssignToUserId().isEmpty()) {
            // Assign to specific user
            targetUserIds.add(request.getAssignToUserId());
        } else {
            // Assign to self
            targetUserIds.add(userId);
        }

        // Create alert for each target user
        for (String targetUserId : targetUserIds) {
            String alertId = UUID.randomUUID().toString();

            // Convert tags list to JSON
            String tagsJson = null;
            if (request.getTags() != null && !request.getTags().isEmpty()) {
                tagsJson = "[" + request.getTags().stream()
                    .map(t -> "\"" + t + "\"")
                    .collect(Collectors.joining(",")) + "]";
            }

            UserAlertReadModel alert = UserAlertReadModel.builder()
                .alertId(alertId)
                .userId(targetUserId)
                .userName(userName)
                .assignedBy(!targetUserId.equals(userId) ? createdBy : null)
                .assignedRole(assignedRole)
                .title(request.getTitle())
                .description(request.getDescription())
                .alertType(request.getAlertType())
                .priority(request.getPriority() != null ? request.getPriority() : AlertPriority.NORMAL)
                .sourceType(AlertSourceType.MANUAL)
                .scheduledDate(request.getScheduledDate())
                .scheduledTime(request.getScheduledTime())
                .operationId(request.getOperationId())
                .clientId(request.getClientId())
                .clientName(request.getClientName())
                .draftId(request.getDraftId())
                .requestId(request.getRequestId())
                .tags(tagsJson)
                .status(AlertStatus.PENDING)
                .createdBy(createdBy)
                .build();

            alert = alertRepository.save(alert);

            // Create history entry
            UserAlertHistoryReadModel history = UserAlertHistoryReadModel.forCreation(alert, createdBy);
            historyRepository.save(history);

            AlertResponse response = enrichResponse(AlertResponse.fromEntity(alert));
            createdAlerts.add(response);

            // Send real-time notification to assigned user (if not self-assigned)
            if (!targetUserId.equals(userId)) {
                try {
                    realTimeService.sendAlertToUser(targetUserId, response);
                    log.info("Sent real-time notification for new alert to user {} via {}",
                        targetUserId, realTimeService.getProviderName());
                } catch (Exception e) {
                    log.warn("Failed to send real-time notification to user {}: {}", targetUserId, e.getMessage());
                }
            }

            log.info("Created alert {} for user {} by {}", alertId, targetUserId, createdBy);
        }

        return createdAlerts;
    }

    /**
     * Create a new alert (single user version for backward compatibility)
     */
    @Transactional
    public AlertResponse createAlertSingle(AlertCreateRequest request, String userId, String userName, String createdBy) {
        List<AlertResponse> alerts = createAlert(request, userId, userName, createdBy);
        return alerts.isEmpty() ? null : alerts.get(0);
    }

    /**
     * Create alert from system source (operation approval, job, etc.)
     * Automatically assigns tags based on sourceModule.
     */
    @Transactional
    public AlertResponse createSystemAlert(
            String userId,
            String userName,
            String title,
            String description,
            AlertType alertType,
            AlertPriority priority,
            AlertSourceType sourceType,
            String sourceId,
            String sourceReference,
            String sourceModule,
            LocalDate scheduledDate,
            String operationId,
            String clientId,
            String clientName,
            String createdBy) {

        // Determine automatic tags based on source module and type
        String tags = determineAutomaticTags(sourceModule, alertType, sourceType);

        String alertId = UUID.randomUUID().toString();

        UserAlertReadModel alert = UserAlertReadModel.builder()
            .alertId(alertId)
            .userId(userId)
            .userName(userName)
            .title(title)
            .description(description)
            .alertType(alertType)
            .priority(priority)
            .sourceType(sourceType)
            .sourceId(sourceId)
            .sourceReference(sourceReference)
            .sourceModule(sourceModule)
            .scheduledDate(scheduledDate)
            .operationId(operationId)
            .clientId(clientId)
            .clientName(clientName)
            .status(AlertStatus.PENDING)
            .tags(tags)
            .createdBy(createdBy)
            .build();

        alert = alertRepository.save(alert);

        // Create history entry
        UserAlertHistoryReadModel history = UserAlertHistoryReadModel.forCreation(alert, createdBy);
        historyRepository.save(history);

        log.info("Created system alert {} for user {} from source {} / {} with tags {}",
            alertId, userId, sourceType, sourceId, tags);

        return enrichResponse(AlertResponse.fromEntity(alert));
    }

    /**
     * Determine automatic tags based on source module and alert type.
     * Tags are assigned in hierarchical order: Level 1, Level 2, etc.
     */
    private String determineAutomaticTags(String sourceModule, AlertType alertType, AlertSourceType sourceType) {
        List<String> tags = new ArrayList<>();

        // Determine Level 1 tag based on source module
        if (sourceModule != null) {
            switch (sourceModule.toUpperCase()) {
                case "LC_IMPORT":
                case "LC_EXPORT":
                case "GUARANTEES":
                case "COLLECTIONS":
                case "STANDBY":
                case "OPERATIONS":
                    tags.add("operaciones");
                    break;
                case "BACKOFFICE":
                case "ADMIN":
                case "USERS":
                    tags.add("backoffice");
                    break;
                case "SCHEDULER":
                case "AI_EXTRACTION":
                    tags.add("sistema");
                    break;
                case "BUSINESS_REQUESTS":
                    tags.add("solicitudes");
                    break;
                default:
                    tags.add("general");
            }
        } else {
            tags.add("general");
        }

        // Determine Level 2 tag based on source module (product/area)
        if (sourceModule != null) {
            switch (sourceModule.toUpperCase()) {
                case "LC_IMPORT":
                    tags.add("lc-import");
                    break;
                case "LC_EXPORT":
                    tags.add("lc-export");
                    break;
                case "GUARANTEES":
                    tags.add("garantias");
                    break;
                case "COLLECTIONS":
                    tags.add("cobranzas");
                    break;
                case "STANDBY":
                    tags.add("standby");
                    break;
                case "VIDEO_CONFERENCE":
                    tags.add("soporte");
                    break;
            }
        }

        // Add alert type as Level 3 tag if relevant
        if (alertType == AlertType.VIDEO_CALL) {
            if (!tags.contains("soporte")) {
                tags.add("soporte");
            }
            tags.add("videollamada");
        } else if (alertType == AlertType.DEADLINE) {
            tags.add("vencimiento");
        } else if (alertType == AlertType.REMINDER) {
            tags.add("recordatorio");
        }

        // Convert to JSON array
        if (tags.isEmpty()) {
            return null;
        }
        return "[\"" + String.join("\", \"", tags) + "\"]";
    }

    /**
     * Create alert from template (with template tracking fields for recalculation).
     */
    @Transactional
    public AlertResponse createTemplateAlert(
            String userId,
            String userName,
            String title,
            String description,
            AlertType alertType,
            AlertPriority priority,
            AlertSourceType sourceType,
            String sourceId,
            String sourceReference,
            String sourceModule,
            LocalDate scheduledDate,
            String operationId,
            String clientId,
            String clientName,
            String createdBy,
            Long templateId,
            String dueDateReference,
            Integer dateOffsetDays,
            LocalDate referenceDate,
            String templateTags) {

        String alertId = UUID.randomUUID().toString();

        // Use template tags if provided, otherwise auto-determine
        String tags = templateTags != null ? templateTags : determineAutomaticTags(sourceModule, alertType, sourceType);

        UserAlertReadModel alert = UserAlertReadModel.builder()
            .alertId(alertId)
            .userId(userId)
            .userName(userName)
            .title(title)
            .description(description)
            .alertType(alertType)
            .priority(priority)
            .sourceType(sourceType)
            .sourceId(sourceId)
            .sourceReference(sourceReference)
            .sourceModule(sourceModule)
            .scheduledDate(scheduledDate)
            .operationId(operationId)
            .clientId(clientId)
            .clientName(clientName)
            .status(AlertStatus.PENDING)
            .tags(tags)
            .createdBy(createdBy)
            .templateId(templateId)
            .dueDateReference(dueDateReference)
            .dateOffsetDays(dateOffsetDays)
            .referenceDate(referenceDate)
            .build();

        alert = alertRepository.save(alert);

        // Create history entry
        UserAlertHistoryReadModel history = UserAlertHistoryReadModel.forCreation(alert, createdBy);
        historyRepository.save(history);

        log.info("Created template alert {} (template={}) for user {} with scheduled_date={} (ref={}, offset={})",
            alertId, templateId, userId, scheduledDate, dueDateReference, dateOffsetDays);

        return enrichResponse(AlertResponse.fromEntity(alert));
    }

    /**
     * Get alert by ID
     */
    public Optional<AlertResponse> getAlert(String alertId) {
        return alertRepository.findByAlertId(alertId)
            .map(alert -> enrichResponse(AlertResponse.fromEntity(alert)));
    }

    /**
     * Get today's alerts for a user
     */
    public List<AlertResponse> getTodayAlerts(String userId) {
        List<UserAlertReadModel> alerts = alertRepository.findTodayAlerts(userId, LocalDate.now());
        return alerts.stream()
            .map(alert -> enrichResponse(AlertResponse.fromEntity(alert)))
            .collect(Collectors.toList());
    }

    /**
     * Get upcoming alerts (next 7 days)
     */
    public List<AlertResponse> getUpcomingAlerts(String userId, int days) {
        LocalDate today = LocalDate.now();
        LocalDate endDate = today.plusDays(days);
        List<UserAlertReadModel> alerts = alertRepository.findUpcomingAlerts(userId, today, endDate);
        return alerts.stream()
            .map(alert -> enrichResponse(AlertResponse.fromEntity(alert)))
            .collect(Collectors.toList());
    }

    /**
     * Get overdue alerts
     */
    public List<AlertResponse> getOverdueAlerts(String userId) {
        List<UserAlertReadModel> alerts = alertRepository.findOverdueAlerts(userId, LocalDate.now());
        return alerts.stream()
            .map(alert -> enrichResponse(AlertResponse.fromEntity(alert)))
            .collect(Collectors.toList());
    }

    /**
     * Get today's alerts widget data
     */
    public TodayAlertsWidgetResponse getTodayWidget(String userId, String language) {
        LocalDate today = LocalDate.now();
        List<UserAlertReadModel> todayAlerts = alertRepository.findTodayAlerts(userId, today);
        List<UserAlertReadModel> overdueAlerts = alertRepository.findOverdueAlerts(userId, today);

        long pendingToday = todayAlerts.stream()
            .filter(a -> a.getStatus() == AlertStatus.PENDING || a.getStatus() == AlertStatus.IN_PROGRESS)
            .count();

        long completedToday = todayAlerts.stream()
            .filter(a -> a.getStatus() == AlertStatus.COMPLETED)
            .count();

        long urgentCount = todayAlerts.stream()
            .filter(a -> a.getPriority() == AlertPriority.URGENT && a.getStatus() != AlertStatus.COMPLETED)
            .count();

        // Combine overdue + today pending, sort by priority and time
        List<UserAlertReadModel> topAlertsList = new ArrayList<>();
        topAlertsList.addAll(overdueAlerts);
        topAlertsList.addAll(todayAlerts.stream()
            .filter(a -> a.getStatus() != AlertStatus.COMPLETED)
            .toList());

        topAlertsList.sort((a, b) -> {
            // Overdue first, then by priority
            if (a.isOverdue() && !b.isOverdue()) return -1;
            if (!a.isOverdue() && b.isOverdue()) return 1;
            int priorityCompare = getPriorityOrder(b.getPriority()) - getPriorityOrder(a.getPriority());
            if (priorityCompare != 0) return priorityCompare;
            // Then by time
            if (a.getScheduledTime() != null && b.getScheduledTime() != null) {
                return a.getScheduledTime().compareTo(b.getScheduledTime());
            }
            return 0;
        });

        List<TodayAlertsWidgetResponse.AlertPreview> topAlerts = topAlertsList.stream()
            .limit(5)
            .map(alert -> {
                AlertTypeConfig config = typeConfigRepository.findByTypeCode(alert.getAlertType().name())
                    .orElse(null);
                return TodayAlertsWidgetResponse.AlertPreview.builder()
                    .alertId(alert.getAlertId())
                    .title(alert.getTitle())
                    .alertType(alert.getAlertType().name())
                    .priority(alert.getPriority().name())
                    .scheduledTime(alert.getScheduledTime() != null ?
                        alert.getScheduledTime().format(DateTimeFormatter.ofPattern("HH:mm")) : null)
                    .clientName(alert.getClientName())
                    .overdue(alert.isOverdue())
                    .icon(config != null ? config.getIcon() : null)
                    .color(config != null ? config.getColor() : null)
                    .build();
            })
            .collect(Collectors.toList());

        return TodayAlertsWidgetResponse.builder()
            .totalToday(todayAlerts.size())
            .pendingToday(pendingToday)
            .completedToday(completedToday)
            .overdueTotal(overdueAlerts.size())
            .hasUrgent(urgentCount > 0)
            .urgentCount(urgentCount)
            .topAlerts(topAlerts)
            .build();
    }

    /**
     * Complete an alert
     */
    @Transactional
    public AlertResponse completeAlert(String alertId, AlertCompleteRequest request, String userId) {
        UserAlertReadModel alert = alertRepository.findByAlertId(alertId)
            .orElseThrow(() -> new IllegalArgumentException("Alert not found: " + alertId));

        // Verify ownership
        if (!alert.getUserId().equals(userId)) {
            throw new SecurityException("Cannot complete another user's alert");
        }

        AlertStatus previousStatus = alert.getStatus();
        alert.setStatus(AlertStatus.COMPLETED);
        alert.setProcessedAt(LocalDateTime.now());
        alert.setProcessedBy(userId);
        alert.setProcessingNotes(request.getNotes());

        alert = alertRepository.save(alert);

        // Create history entry
        UserAlertHistoryReadModel history = UserAlertHistoryReadModel.forStatusChange(
            alert, previousStatus, request.getNotes(), userId);
        historyRepository.save(history);

        log.info("Alert {} completed by {}", alertId, userId);

        return enrichResponse(AlertResponse.fromEntity(alert));
    }

    /**
     * Reschedule an alert
     */
    @Transactional
    public AlertResponse rescheduleAlert(String alertId, AlertRescheduleRequest request, String userId) {
        UserAlertReadModel alert = alertRepository.findByAlertId(alertId)
            .orElseThrow(() -> new IllegalArgumentException("Alert not found: " + alertId));

        // Verify ownership
        if (!alert.getUserId().equals(userId)) {
            throw new SecurityException("Cannot reschedule another user's alert");
        }

        LocalDate previousDate = alert.getScheduledDate();
        alert.setScheduledDate(request.getNewDate());
        alert.setScheduledTime(request.getNewTime());
        alert.setRescheduleCount(alert.getRescheduleCount() + 1);

        // If was snoozed, reactivate
        if (alert.getStatus() == AlertStatus.SNOOZED) {
            alert.setStatus(AlertStatus.PENDING);
        }

        alert = alertRepository.save(alert);

        // Create history entry
        UserAlertHistoryReadModel history = UserAlertHistoryReadModel.forReschedule(
            alert, previousDate, request.getNotes(), userId);
        historyRepository.save(history);

        log.info("Alert {} rescheduled from {} to {} by {}",
            alertId, previousDate, request.getNewDate(), userId);

        return enrichResponse(AlertResponse.fromEntity(alert));
    }

    /**
     * Snooze an alert (reschedule to tomorrow or specified date)
     */
    @Transactional
    public AlertResponse snoozeAlert(String alertId, Integer days, String userId) {
        UserAlertReadModel alert = alertRepository.findByAlertId(alertId)
            .orElseThrow(() -> new IllegalArgumentException("Alert not found: " + alertId));

        // Verify ownership
        if (!alert.getUserId().equals(userId)) {
            throw new SecurityException("Cannot snooze another user's alert");
        }

        LocalDate previousDate = alert.getScheduledDate();
        int snoozeDays = days != null ? days : 1;
        alert.setScheduledDate(LocalDate.now().plusDays(snoozeDays));
        alert.setStatus(AlertStatus.SNOOZED);
        alert.setRescheduleCount(alert.getRescheduleCount() + 1);

        alert = alertRepository.save(alert);

        // Create history entry
        UserAlertHistoryReadModel history = UserAlertHistoryReadModel.forReschedule(
            alert, previousDate, "Snoozed for " + snoozeDays + " day(s)", userId);
        history.setActionType(UserAlertHistoryReadModel.AlertHistoryAction.SNOOZED);
        historyRepository.save(history);

        log.info("Alert {} snoozed for {} days by {}", alertId, snoozeDays, userId);

        return enrichResponse(AlertResponse.fromEntity(alert));
    }

    /**
     * Start working on an alert (set status to IN_PROGRESS)
     */
    @Transactional
    public AlertResponse startAlert(String alertId, AlertStartRequest request, String userId) {
        UserAlertReadModel alert = alertRepository.findByAlertId(alertId)
            .orElseThrow(() -> new IllegalArgumentException("Alert not found: " + alertId));

        // Verify ownership
        if (!alert.getUserId().equals(userId)) {
            throw new SecurityException("Cannot start another user's alert");
        }

        if (alert.getStatus() != AlertStatus.PENDING && alert.getStatus() != AlertStatus.SNOOZED) {
            throw new IllegalStateException("Alert must be PENDING or SNOOZED to start");
        }

        AlertStatus previousStatus = alert.getStatus();
        alert.setStatus(AlertStatus.IN_PROGRESS);
        if (request != null && request.getNotes() != null) {
            alert.setProcessingNotes(request.getNotes());
        }

        alert = alertRepository.save(alert);

        // Create history entry
        UserAlertHistoryReadModel history = UserAlertHistoryReadModel.forStatusChange(
            alert, previousStatus, request != null ? request.getNotes() : "Started working", userId);
        historyRepository.save(history);

        log.info("Alert {} started by {}", alertId, userId);

        return enrichResponse(AlertResponse.fromEntity(alert));
    }

    /**
     * Update progress notes on an alert
     */
    @Transactional
    public AlertResponse updateProgress(String alertId, AlertProgressRequest request, String userId) {
        UserAlertReadModel alert = alertRepository.findByAlertId(alertId)
            .orElseThrow(() -> new IllegalArgumentException("Alert not found: " + alertId));

        // Verify ownership
        if (!alert.getUserId().equals(userId)) {
            throw new SecurityException("Cannot update another user's alert");
        }

        // Append to existing notes with timestamp
        String timestamp = java.time.LocalDateTime.now()
            .format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        String newNote = "[" + timestamp + "] " + request.getNotes();

        String existingNotes = alert.getProcessingNotes();
        if (existingNotes != null && !existingNotes.isEmpty()) {
            alert.setProcessingNotes(existingNotes + "\n\n" + newNote);
        } else {
            alert.setProcessingNotes(newNote);
        }

        alert = alertRepository.save(alert);

        // Create history entry
        UserAlertHistoryReadModel history = UserAlertHistoryReadModel.builder()
            .historyId(UUID.randomUUID().toString())
            .alertId(alertId)
            .actionType(UserAlertHistoryReadModel.AlertHistoryAction.NOTE_ADDED)
            .notes(request.getNotes())
            .createdBy(userId)
            .build();
        historyRepository.save(history);

        log.info("Progress updated on alert {} by {}", alertId, userId);

        return enrichResponse(AlertResponse.fromEntity(alert));
    }

    /**
     * Cancel an alert
     */
    @Transactional
    public AlertResponse cancelAlert(String alertId, String reason, String userId) {
        UserAlertReadModel alert = alertRepository.findByAlertId(alertId)
            .orElseThrow(() -> new IllegalArgumentException("Alert not found: " + alertId));

        // Verify ownership
        if (!alert.getUserId().equals(userId)) {
            throw new SecurityException("Cannot cancel another user's alert");
        }

        AlertStatus previousStatus = alert.getStatus();
        alert.setStatus(AlertStatus.CANCELLED);
        alert.setProcessedAt(LocalDateTime.now());
        alert.setProcessedBy(userId);
        alert.setProcessingNotes(reason);

        alert = alertRepository.save(alert);

        // Create history entry
        UserAlertHistoryReadModel history = UserAlertHistoryReadModel.forStatusChange(
            alert, previousStatus, reason, userId);
        historyRepository.save(history);

        log.info("Alert {} cancelled by {}", alertId, userId);

        return enrichResponse(AlertResponse.fromEntity(alert));
    }

    /**
     * Get alert history
     */
    public List<UserAlertHistoryReadModel> getAlertHistory(String alertId) {
        return historyRepository.findByAlertIdOrderByCreatedAtDesc(alertId);
    }

    /**
     * Get counts for dashboard
     */
    public Map<String, Long> getAlertCounts(String userId) {
        LocalDate today = LocalDate.now();
        Map<String, Long> counts = new HashMap<>();
        counts.put("pending", alertRepository.countPendingAlerts(userId));
        counts.put("overdue", alertRepository.countOverdueAlerts(userId, today));
        counts.put("today", (long) alertRepository.findTodayAlerts(userId, today).size());
        return counts;
    }

    /**
     * Enrich response with type config
     */
    private AlertResponse enrichResponse(AlertResponse response) {
        typeConfigRepository.findByTypeCode(response.getAlertType().name())
            .ifPresent(config -> {
                response.setAlertTypeLabel(config.getLabelEs()); // Default to Spanish
                response.setAlertTypeIcon(config.getIcon());
                response.setAlertTypeColor(config.getColor());
            });
        return response;
    }

    /**
     * Get priority order for sorting
     */
    private int getPriorityOrder(AlertPriority priority) {
        return switch (priority) {
            case URGENT -> 4;
            case HIGH -> 3;
            case NORMAL -> 2;
            case LOW -> 1;
        };
    }

    /**
     * Reassign an alert to a different user.
     * Only allowed if the alert is not completed or cancelled.
     */
    @Transactional
    public AlertResponse reassignAlert(String alertId, AlertReassignRequest request, String userId) {
        UserAlertReadModel alert = alertRepository.findByAlertId(alertId)
            .orElseThrow(() -> new IllegalArgumentException("Alert not found: " + alertId));

        // Cannot reassign completed or cancelled alerts
        if (alert.getStatus() == AlertStatus.COMPLETED || alert.getStatus() == AlertStatus.CANCELLED) {
            throw new IllegalStateException("No se puede reasignar una alerta completada o cancelada");
        }

        // Store previous user for history
        String previousUserId = alert.getUserId();
        String previousUserName = alert.getUserName();

        // Get new user's display name if not provided
        String newUserName = request.getNewUserName();
        if (newUserName == null || newUserName.isEmpty()) {
            newUserName = userRepository.findByUsername(request.getNewUserId())
                .map(u -> u.getName() != null ? u.getName() : u.getUsername())
                .orElse(request.getNewUserId());
        }

        // Update alert with new user
        alert.setUserId(request.getNewUserId());
        alert.setUserName(newUserName);
        alert.setAssignedBy(userId); // The person who reassigned it

        // If alert was in progress, reset to pending
        if (alert.getStatus() == AlertStatus.IN_PROGRESS) {
            alert.setStatus(AlertStatus.PENDING);
        }

        alert = alertRepository.save(alert);

        // Create history entry
        String notes = String.format("Reasignada de %s (%s) a %s (%s)%s",
            previousUserName != null ? previousUserName : previousUserId,
            previousUserId,
            newUserName,
            request.getNewUserId(),
            request.getReason() != null ? ". Razón: " + request.getReason() : "");

        UserAlertHistoryReadModel history = UserAlertHistoryReadModel.builder()
            .historyId(UUID.randomUUID().toString())
            .alertId(alertId)
            .actionType(UserAlertHistoryReadModel.AlertHistoryAction.REASSIGNED)
            .notes(notes)
            .createdBy(userId)
            .build();
        historyRepository.save(history);

        // Send notification to new user
        try {
            AlertResponse response = AlertResponse.fromEntity(alert);
            realTimeService.sendAlertToUser(request.getNewUserId(), response);
        } catch (Exception e) {
            log.warn("Could not send notification for reassigned alert: {}", e.getMessage());
        }

        log.info("Alert {} reassigned from {} to {} by {}",
            alertId, previousUserId, request.getNewUserId(), userId);

        return enrichResponse(AlertResponse.fromEntity(alert));
    }

    /**
     * Update tags on an alert.
     * @param alertId The alert ID
     * @param tags The new tags
     * @param userId The user performing the action
     * @param canManageAll If true, allows updating alerts of other users (admin/supervisor)
     */
    @Transactional
    public AlertResponse updateAlertTags(String alertId, List<String> tags, String userId, boolean canManageAll) {
        UserAlertReadModel alert = alertRepository.findByAlertId(alertId)
            .orElseThrow(() -> new IllegalArgumentException("Alert not found: " + alertId));

        // Verify ownership (skip if user can manage all alerts)
        if (!canManageAll && !alert.getUserId().equals(userId)) {
            throw new SecurityException("Cannot update another user's alert");
        }

        // Convert tags list to JSON
        String tagsJson = null;
        if (tags != null && !tags.isEmpty()) {
            tagsJson = "[" + tags.stream()
                .map(t -> "\"" + t + "\"")
                .collect(Collectors.joining(",")) + "]";
        }

        alert.setTags(tagsJson);
        alert = alertRepository.save(alert);

        log.info("Updated tags on alert {} by {} (canManageAll={})", alertId, userId, canManageAll);

        return enrichResponse(AlertResponse.fromEntity(alert));
    }
}
