package com.globalcmx.api.alerts.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Response DTO for agenda view (Outlook-style).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgendaResponse {

    private LocalDate startDate;
    private LocalDate endDate;
    private String viewType; // DAY, WEEK, MONTH

    // Alerts grouped by date
    private Map<LocalDate, List<AlertResponse>> alertsByDate;

    // Summary counts
    private AgendaSummary summary;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AgendaSummary {
        private long totalAlerts;
        private long pendingAlerts;
        private long completedAlerts;
        private long overdueAlerts;
        private long todayAlerts;

        // By priority
        private long urgentAlerts;
        private long highPriorityAlerts;

        // By type (count per type)
        private Map<String, Long> alertsByType;
    }
}
