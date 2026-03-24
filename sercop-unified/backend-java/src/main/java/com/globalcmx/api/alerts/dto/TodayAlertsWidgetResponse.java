package com.globalcmx.api.alerts.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for today's alerts widget (TopBar display).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TodayAlertsWidgetResponse {

    // Counts
    private long totalToday;
    private long pendingToday;
    private long completedToday;
    private long overdueTotal;

    // Urgent flag
    private boolean hasUrgent;
    private long urgentCount;

    // Preview of most important alerts (max 5)
    private List<AlertPreview> topAlerts;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AlertPreview {
        private String alertId;
        private String title;
        private String alertType;
        private String priority;
        private String scheduledTime;
        private String clientName;
        private boolean overdue;
        private String icon;
        private String color;
    }
}
