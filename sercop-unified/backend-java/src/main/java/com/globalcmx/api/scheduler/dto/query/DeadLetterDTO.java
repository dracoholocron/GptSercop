package com.globalcmx.api.scheduler.dto.query;

import com.globalcmx.api.scheduler.entity.ScheduledJobDeadLetter;
import com.globalcmx.api.scheduler.entity.ScheduledJobDeadLetter.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeadLetterDTO {

    private Long id;
    private String jobCode;
    private Long jobConfigId;
    private String originalExecutionId;

    private Status status;

    private String errorMessage;
    private String errorStackTrace;
    private String errorCode;

    private Integer retryCount;
    private Boolean maxRetriesReached;
    private LocalDateTime lastRetryAt;

    private String originalParameters;
    private LocalDateTime originalStartedAt;
    private String originalTriggeredBy;

    private LocalDateTime resolvedAt;
    private String resolvedBy;
    private String resolutionNotes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String tenantId;

    // Computed fields
    private String jobName; // Populated by service layer
    private Long ageInHours;

    public static DeadLetterDTO fromEntity(ScheduledJobDeadLetter entity) {
        if (entity == null) return null;

        Long ageInHours = null;
        if (entity.getCreatedAt() != null) {
            ageInHours = java.time.Duration.between(entity.getCreatedAt(), LocalDateTime.now()).toHours();
        }

        return DeadLetterDTO.builder()
                .id(entity.getId())
                .jobCode(entity.getJobCode())
                .jobConfigId(entity.getJobConfigId())
                .originalExecutionId(entity.getOriginalExecutionId())
                .status(entity.getStatus())
                .errorMessage(entity.getErrorMessage())
                .errorStackTrace(entity.getErrorStackTrace())
                .errorCode(entity.getErrorCode())
                .retryCount(entity.getRetryCount())
                .maxRetriesReached(entity.getMaxRetriesReached())
                .lastRetryAt(entity.getLastRetryAt())
                .originalParameters(entity.getOriginalParameters())
                .originalStartedAt(entity.getOriginalStartedAt())
                .originalTriggeredBy(entity.getOriginalTriggeredBy())
                .resolvedAt(entity.getResolvedAt())
                .resolvedBy(entity.getResolvedBy())
                .resolutionNotes(entity.getResolutionNotes())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .tenantId(entity.getTenantId())
                .ageInHours(ageInHours)
                .build();
    }
}
