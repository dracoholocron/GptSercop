package com.globalcmx.api.scheduler.dto.query;

import com.globalcmx.api.scheduler.entity.ScheduledJobExecutionLog.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobExecutionResultDTO {

    private String executionId;
    private String jobCode;
    private Status status;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private Long durationMs;

    private Integer itemsProcessed;
    private Integer itemsSuccess;
    private Integer itemsFailed;

    private String resultSummary;
    private Map<String, Object> resultData;

    private String errorMessage;
    private String errorCode;

    private Boolean wasAsync;
    private String message;
}
