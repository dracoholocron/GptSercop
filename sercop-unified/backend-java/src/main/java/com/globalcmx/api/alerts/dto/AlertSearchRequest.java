package com.globalcmx.api.alerts.dto;

import com.globalcmx.api.alerts.entity.UserAlertReadModel.AlertPriority;
import com.globalcmx.api.alerts.entity.UserAlertReadModel.AlertStatus;
import com.globalcmx.api.alerts.entity.UserAlertReadModel.AlertType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Request DTO for advanced alert search with filters.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertSearchRequest {

    /**
     * View mode for filtering alerts:
     * - ASSIGNED_TO_ME: Alerts assigned to the current user
     * - ASSIGNED_BY_ME: Alerts created by the current user for others
     * - ALL: All alerts (requires admin/supervisor role)
     */
    public enum ViewMode {
        ASSIGNED_TO_ME,
        ASSIGNED_BY_ME,
        ALL
    }

    @Builder.Default
    private ViewMode viewMode = ViewMode.ASSIGNED_TO_ME;

    /**
     * Filter by specific user ID (only applicable when viewMode=ALL)
     */
    private String userId;

    private LocalDate startDate;
    private LocalDate endDate;

    private AlertStatus status;
    private AlertType alertType;
    private AlertPriority priority;

    private List<String> tags;

    private String searchText;
    private String clientId;
    private String operationId;

    /**
     * Quick filter for dashboard cards:
     * - OVERDUE: Show overdue alerts only
     * - TODAY: Show today's pending alerts only
     * - COMPLETED_TODAY: Show today's completed alerts only
     */
    public enum QuickFilter {
        OVERDUE,
        TODAY,
        COMPLETED_TODAY
    }

    private QuickFilter quickFilter;

    /**
     * Hide completed alerts from results
     */
    @Builder.Default
    private boolean hideCompleted = false;

    // Pagination
    @Builder.Default
    private int page = 0;
    @Builder.Default
    private int size = 20;

    // Sorting
    @Builder.Default
    private String sortBy = "scheduledDate";
    @Builder.Default
    private String sortDirection = "DESC";
}
