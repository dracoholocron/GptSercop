package com.globalcmx.api.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Activity Heatmap DTO for GitHub-style calendar
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityHeatmapDTO {
    private String date;
    private Integer dayOfWeek; // 0=Sunday, 6=Saturday
    private Integer weekNumber;
    private Integer operationCount;
    private Integer level; // 0-4 intensity level
    private String tooltip;
}
