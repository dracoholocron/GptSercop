package com.globalcmx.api.alerts.dto;

import com.globalcmx.api.alerts.entity.UserAlertReadModel;
import com.globalcmx.api.alerts.entity.UserAlertReadModel.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Response DTO for alert data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertResponse {

    private String alertId;

    // User
    private String userId;
    private String userName;
    private String assignedBy;
    private String assignedRole;

    // Content
    private String title;
    private String description;
    private AlertType alertType;
    private String alertTypeLabel;
    private String alertTypeIcon;
    private String alertTypeColor;
    private AlertPriority priority;

    // Source
    private AlertSourceType sourceType;
    private String sourceId;
    private String sourceReference;
    private String sourceModule;

    // Linking
    private String operationId;
    private String requestId;
    private String draftId;
    private String clientId;
    private String clientName;

    // Video Conference (for VIDEO_CALL alerts)
    private String meetingId;
    private String meetingUrl;
    private String meetingProvider;
    private String organizerName;

    // Scheduling
    private LocalDate scheduledDate;
    private LocalTime scheduledTime;
    private LocalDateTime dueDate;

    // Status
    private AlertStatus status;
    private LocalDateTime processedAt;
    private String processedBy;
    private String processingNotes;

    // Rescheduling
    private LocalDate originalScheduledDate;
    private Integer rescheduleCount;

    // Computed flags
    private boolean overdue;
    private boolean dueToday;

    // Tags
    private List<String> tags;

    // Audit
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;

    /**
     * Create response from entity
     */
    public static AlertResponse fromEntity(UserAlertReadModel entity) {
        return AlertResponse.builder()
            .alertId(entity.getAlertId())
            .userId(entity.getUserId())
            .userName(entity.getUserName())
            .assignedBy(entity.getAssignedBy())
            .assignedRole(entity.getAssignedRole())
            .title(entity.getTitle())
            .description(entity.getDescription())
            .alertType(entity.getAlertType())
            .priority(entity.getPriority())
            .sourceType(entity.getSourceType())
            .sourceId(entity.getSourceId())
            .sourceReference(entity.getSourceReference())
            .sourceModule(entity.getSourceModule())
            .operationId(entity.getOperationId())
            .requestId(entity.getRequestId())
            .draftId(entity.getDraftId())
            .clientId(entity.getClientId())
            .clientName(entity.getClientName())
            .meetingId(entity.getMeetingId())
            .meetingUrl(entity.getMeetingUrl())
            .meetingProvider(entity.getMeetingProvider())
            .organizerName(entity.getOrganizerName())
            .scheduledDate(entity.getScheduledDate())
            .scheduledTime(entity.getScheduledTime())
            .dueDate(entity.getDueDate())
            .status(entity.getStatus())
            .processedAt(entity.getProcessedAt())
            .processedBy(entity.getProcessedBy())
            .processingNotes(entity.getProcessingNotes())
            .originalScheduledDate(entity.getOriginalScheduledDate())
            .rescheduleCount(entity.getRescheduleCount())
            .overdue(entity.isOverdue())
            .dueToday(entity.isDueToday())
            .tags(parseTags(entity.getTags()))
            .createdAt(entity.getCreatedAt())
            .createdBy(entity.getCreatedBy())
            .updatedAt(entity.getUpdatedAt())
            .build();
    }

    /**
     * Parse JSON tags string to list
     */
    private static List<String> parseTags(String tagsJson) {
        if (tagsJson == null || tagsJson.isEmpty() || tagsJson.equals("null")) {
            return new ArrayList<>();
        }
        try {
            // Simple JSON array parsing for string array like ["tag1", "tag2"]
            String cleaned = tagsJson.trim();
            if (cleaned.startsWith("[") && cleaned.endsWith("]")) {
                cleaned = cleaned.substring(1, cleaned.length() - 1);
                if (cleaned.isEmpty()) {
                    return new ArrayList<>();
                }
                List<String> tags = new ArrayList<>();
                for (String tag : cleaned.split(",")) {
                    String trimmed = tag.trim();
                    if (trimmed.startsWith("\"") && trimmed.endsWith("\"")) {
                        trimmed = trimmed.substring(1, trimmed.length() - 1);
                    }
                    if (!trimmed.isEmpty()) {
                        tags.add(trimmed);
                    }
                }
                return tags;
            }
            return new ArrayList<>();
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    /**
     * Create response with alert type config
     */
    public static AlertResponse fromEntityWithConfig(
            UserAlertReadModel entity,
            String typeLabel,
            String typeIcon,
            String typeColor) {
        AlertResponse response = fromEntity(entity);
        response.setAlertTypeLabel(typeLabel);
        response.setAlertTypeIcon(typeIcon);
        response.setAlertTypeColor(typeColor);
        return response;
    }
}
