package com.globalcmx.api.scheduler.dto.query;

import com.globalcmx.api.scheduler.entity.ScheduledJobExecutionLog;
import com.globalcmx.api.scheduler.entity.ScheduledJobExecutionLog.Status;
import com.globalcmx.api.scheduler.entity.ScheduledJobExecutionLog.TriggerType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionLogDTO {

    private Long id;
    private String executionId;
    private String jobCode;
    private Long jobConfigId;

    private Status status;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private Long durationMs;
    private String durationFormatted;

    private Integer itemsProcessed;
    private Integer itemsSuccess;
    private Integer itemsFailed;
    private String resultSummary;
    private String resultData;

    private String errorMessage;
    private String errorStackTrace;
    private String errorCode;

    private Integer retryAttempt;
    private Boolean isRetry;
    private String originalExecutionId;

    private TriggerType triggeredBy;
    private String triggeredByUser;

    private String serverInstance;
    private String serverIp;
    private String threadName;

    private String tenantId;

    public static ExecutionLogDTO fromEntity(ScheduledJobExecutionLog entity) {
        if (entity == null) return null;

        return ExecutionLogDTO.builder()
                .id(entity.getId())
                .executionId(entity.getExecutionId())
                .jobCode(entity.getJobCode())
                .jobConfigId(entity.getJobConfigId())
                .status(entity.getStatus())
                .startedAt(entity.getStartedAt())
                .completedAt(entity.getCompletedAt())
                .durationMs(entity.getDurationMs())
                .durationFormatted(formatDuration(entity.getDurationMs()))
                .itemsProcessed(entity.getItemsProcessed())
                .itemsSuccess(entity.getItemsSuccess())
                .itemsFailed(entity.getItemsFailed())
                .resultSummary(entity.getResultSummary())
                .resultData(entity.getResultData())
                .errorMessage(entity.getErrorMessage())
                .errorStackTrace(entity.getErrorStackTrace())
                .errorCode(entity.getErrorCode())
                .retryAttempt(entity.getRetryAttempt())
                .isRetry(entity.getIsRetry())
                .originalExecutionId(entity.getOriginalExecutionId())
                .triggeredBy(entity.getTriggeredBy())
                .triggeredByUser(entity.getTriggeredByUser())
                .serverInstance(entity.getServerInstance())
                .serverIp(entity.getServerIp())
                .threadName(entity.getThreadName())
                .tenantId(entity.getTenantId())
                .build();
    }

    private static String formatDuration(Long ms) {
        if (ms == null) return "N/A";
        if (ms < 1000) return ms + "ms";
        if (ms < 60000) return String.format("%.2fs", ms / 1000.0);
        if (ms < 3600000) return String.format("%.2fm", ms / 60000.0);
        return String.format("%.2fh", ms / 3600000.0);
    }
}
