package com.globalcmx.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO for operation lock information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperationLockDTO {

    private String operationId;
    private String lockedBy;
    private String lockedByFullName;
    private Instant lockedAt;
    private Instant expiresAt;
    private Long remainingSeconds;
    private Integer lockDurationSeconds;
    private String operationReference;
    private String productType;
    private boolean isLocked;
    private boolean isLockedByCurrentUser;
    private boolean isExpiringSoon;
    private boolean canCurrentUserOperate;
}
