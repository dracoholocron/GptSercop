package com.globalcmx.api.exception;

import com.globalcmx.api.dto.OperationLockDTO;
import lombok.Getter;

/**
 * Exception thrown when an operation is locked by another user.
 */
@Getter
public class OperationLockedException extends RuntimeException {

    private final OperationLockDTO lockInfo;

    public OperationLockedException(String message) {
        super(message);
        this.lockInfo = null;
    }

    public OperationLockedException(String message, OperationLockDTO lockInfo) {
        super(message);
        this.lockInfo = lockInfo;
    }

    public OperationLockedException(String message, Throwable cause) {
        super(message, cause);
        this.lockInfo = null;
    }
}
