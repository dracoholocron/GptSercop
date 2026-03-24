package com.globalcmx.api.alerts.service;

import com.globalcmx.api.alerts.dto.AlertResponse;
import com.globalcmx.api.alerts.entity.UserAlertReadModel;
import com.globalcmx.api.alerts.entity.UserAlertReadModel.*;
import com.globalcmx.api.alerts.repository.UserAlertRepository;
import com.globalcmx.api.readmodel.entity.EventAlertTemplate;
import com.globalcmx.api.readmodel.entity.OperationReadModel;
import com.globalcmx.api.readmodel.repository.EventAlertTemplateRepository;
import com.globalcmx.api.realtime.RealTimeNotificationService;
import com.globalcmx.api.security.entity.User;
import com.globalcmx.api.security.repository.UserRepository;
import com.globalcmx.api.service.TemplateVariableResolverService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Service for creating and managing operation-related alerts from templates.
 * Handles:
 * - Alert creation from draft approval (user-selected templates)
 * - Automatic alert creation from event execution
 * - Dynamic recalculation when operation dates change
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(transactionManager = "readModelTransactionManager")
public class OperationAlertService {

    private final EventAlertTemplateRepository templateRepository;
    private final UserAlertRepository alertRepository;
    private final UserAlertService userAlertService;
    private final TemplateVariableResolverService variableResolver;
    private final RealTimeNotificationService realTimeService;
    private final UserRepository userRepository;

    /**
     * Creates alerts from templates selected during draft approval.
     * Called when an authorizer approves a draft.
     *
     * @param operation The newly created operation
     * @param selectedTemplateIds Template IDs selected by the operator in the UI
     * @param approvedBy Username of the approver
     * @return List of created alerts
     */
    public List<AlertResponse> createAlertsFromApproval(
            OperationReadModel operation,
            List<Long> selectedTemplateIds,
            String approvedBy) {

        if (selectedTemplateIds == null || selectedTemplateIds.isEmpty()) {
            log.debug("No alert templates selected for operation {}", operation.getOperationId());
            return List.of();
        }

        log.info("Creating {} alerts from approval for operation {} by {}",
                selectedTemplateIds.size(), operation.getOperationId(), approvedBy);

        List<AlertResponse> created = new ArrayList<>();

        for (Long templateId : selectedTemplateIds) {
            try {
                var templateOpt = templateRepository.findById(templateId);
                if (templateOpt.isEmpty()) {
                    log.warn("Template {} not found, skipping", templateId);
                    continue;
                }

                EventAlertTemplate template = templateOpt.get();
                List<AlertResponse> alerts = createAlertFromTemplate(operation, template, approvedBy);
                created.addAll(alerts);
            } catch (Exception e) {
                log.error("Error creating alert from template {} for operation {}: {}",
                        templateId, operation.getOperationId(), e.getMessage());
            }
        }

        log.info("Created {} alerts from {} templates for operation {}",
                created.size(), selectedTemplateIds.size(), operation.getOperationId());
        return created;
    }

    /**
     * Creates automatic alerts when an event is executed on an operation.
     * For post-emission events (no UI preview), creates MANDATORY and RECOMMENDED alerts.
     *
     * @param operation The operation after event execution
     * @param eventCode The event that was executed
     * @param executedBy Username who executed the event
     * @return List of created alerts
     */
    public List<AlertResponse> createAlertsFromEventExecution(
            OperationReadModel operation,
            String eventCode,
            String executedBy) {

        // Find templates for this event (both MANDATORY and RECOMMENDED, auto-create)
        String language = "es"; // Default language
        List<EventAlertTemplate> templates = templateRepository
                .findByOperationTypeAndEventCodeAndLanguageAndIsActiveTrueOrderByDisplayOrderAsc(
                        operation.getProductType(), eventCode, language);

        if (templates.isEmpty()) {
            log.debug("No alert templates for event {} on {}", eventCode, operation.getProductType());
            return List.of();
        }

        // Filter: only MANDATORY and RECOMMENDED for auto-creation
        List<EventAlertTemplate> autoTemplates = templates.stream()
                .filter(t -> "MANDATORY".equals(t.getRequirementLevel())
                          || "RECOMMENDED".equals(t.getRequirementLevel()))
                .toList();

        log.info("Auto-creating {} alerts for event {} on operation {}",
                autoTemplates.size(), eventCode, operation.getOperationId());

        List<AlertResponse> created = new ArrayList<>();
        for (EventAlertTemplate template : autoTemplates) {
            try {
                List<AlertResponse> alerts = createAlertFromTemplate(operation, template, executedBy);
                created.addAll(alerts);
            } catch (Exception e) {
                log.error("Error auto-creating alert from template {} for event {}: {}",
                        template.getId(), eventCode, e.getMessage());
            }
        }

        return created;
    }

    /**
     * Recalculates alert dates when operation dates change (e.g., after an amendment).
     *
     * @param operationId The operation ID
     * @param operation The updated operation with new dates
     * @return Number of alerts updated
     */
    public int recalculateAlertDates(String operationId, OperationReadModel operation) {
        List<UserAlertReadModel> alerts = alertRepository.findByOperationIdAndStatusIn(
                operationId,
                List.of(AlertStatus.PENDING, AlertStatus.IN_PROGRESS, AlertStatus.SNOOZED));

        int updated = 0;
        for (UserAlertReadModel alert : alerts) {
            if (alert.getDueDateReference() == null
                    || "EVENT_EXECUTION".equals(alert.getDueDateReference())) {
                continue;
            }

            LocalDate newRefDate = getReferenceDateFromOperation(alert.getDueDateReference(), operation);
            if (newRefDate == null) continue;

            // Only recalculate if reference date actually changed
            if (!newRefDate.equals(alert.getReferenceDate())) {
                LocalDate oldScheduled = alert.getScheduledDate();
                int offset = alert.getDateOffsetDays() != null ? alert.getDateOffsetDays() : 0;
                LocalDate newScheduled = newRefDate.plusDays(offset);

                alert.setScheduledDate(newScheduled);
                alert.setReferenceDate(newRefDate);
                alertRepository.save(alert);

                log.info("Recalculated alert {} scheduled_date: {} -> {} (ref {} changed to {})",
                        alert.getAlertId(), oldScheduled, newScheduled,
                        alert.getDueDateReference(), newRefDate);
                updated++;
            }
        }

        if (updated > 0) {
            log.info("Recalculated {} alert dates for operation {}", updated, operationId);
        }
        return updated;
    }

    /**
     * Creates an alert from a template for the appropriate users based on the template's assigned role.
     */
    private List<AlertResponse> createAlertFromTemplate(
            OperationReadModel operation,
            EventAlertTemplate template,
            String executedBy) {

        // Resolve template variables
        String resolvedTitle = variableResolver.resolveVariables(
                template.getTitleTemplate(), operation, executedBy);
        String resolvedDescription = variableResolver.resolveVariables(
                template.getDescriptionTemplate(), operation, executedBy);

        // Calculate scheduled date based on due_date_reference
        LocalDate referenceDate = getReferenceDateFromOperation(
                template.getDueDateReference(), operation);
        if (referenceDate == null) {
            // Fallback to today if reference date not available
            referenceDate = LocalDate.now();
        }
        int offset = template.getDueDaysOffset() != null ? template.getDueDaysOffset() : 0;
        LocalDate scheduledDate = referenceDate.plusDays(offset);

        // Determine target users by role
        List<String> targetUserIds = new ArrayList<>();
        String assignedRole = template.getAssignedRole();

        if (assignedRole != null && !assignedRole.isEmpty()) {
            List<User> roleUsers = userRepository.findByRoleName(assignedRole);
            if (!roleUsers.isEmpty()) {
                targetUserIds.addAll(roleUsers.stream()
                        .map(User::getUsername)
                        .toList());
            } else {
                log.warn("No users found with role {}, assigning to executor {}", assignedRole, executedBy);
                targetUserIds.add(executedBy);
            }
        } else {
            targetUserIds.add(executedBy);
        }

        // Parse alert type
        AlertType alertType;
        try {
            alertType = AlertType.valueOf(template.getAlertType());
        } catch (Exception e) {
            alertType = AlertType.FOLLOW_UP;
        }

        // Parse priority
        AlertPriority priority;
        try {
            priority = AlertPriority.valueOf(template.getDefaultPriority());
        } catch (Exception e) {
            priority = AlertPriority.NORMAL;
        }

        List<AlertResponse> created = new ArrayList<>();
        for (String userId : targetUserIds) {
            String userName = userRepository.findByUsername(userId)
                    .map(u -> u.getName() != null ? u.getName() : u.getUsername())
                    .orElse(userId);

            AlertResponse response = userAlertService.createTemplateAlert(
                    userId,
                    userName,
                    resolvedTitle,
                    resolvedDescription,
                    alertType,
                    priority,
                    AlertSourceType.OPERATION_APPROVAL,
                    operation.getOperationId(),
                    operation.getReference(),
                    operation.getProductType(),
                    scheduledDate,
                    operation.getOperationId(),
                    operation.getApplicantId() != null ? operation.getApplicantId().toString() : null,
                    operation.getApplicantName(),
                    executedBy,
                    template.getId(),
                    template.getDueDateReference(),
                    offset,
                    referenceDate,
                    template.getTags());

            created.add(response);

            // Send real-time notification
            try {
                realTimeService.sendAlertToUser(userId, response);
            } catch (Exception e) {
                log.warn("Failed to send real-time notification for alert to {}: {}", userId, e.getMessage());
            }
        }

        return created;
    }

    /**
     * Gets the reference date from the operation based on the reference type.
     */
    private LocalDate getReferenceDateFromOperation(String dueDateReference, OperationReadModel operation) {
        if (dueDateReference == null) return LocalDate.now();

        return switch (dueDateReference) {
            case "EXPIRY_DATE" -> operation.getExpiryDate();
            case "ISSUE_DATE" -> operation.getIssueDate();
            case "EVENT_EXECUTION" -> LocalDate.now();
            default -> LocalDate.now();
        };
    }
}
