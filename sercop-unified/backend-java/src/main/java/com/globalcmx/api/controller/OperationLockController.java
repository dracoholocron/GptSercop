package com.globalcmx.api.controller;

import com.globalcmx.api.dto.OperationLockDTO;
import com.globalcmx.api.dto.command.AcquireLockCommand;
import com.globalcmx.api.dto.command.ExtendLockCommand;
import com.globalcmx.api.dto.command.ForceReleaseLockCommand;
import com.globalcmx.api.dto.command.ReleaseLockCommand;
import com.globalcmx.api.exception.OperationLockedException;
import com.globalcmx.api.service.command.OperationLockCommandService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller for operation locks (pessimistic locking).
 * Handles acquiring, releasing, and querying locks on operations.
 */
@RestController
@RequestMapping("/v1/operation-locks")
@RequiredArgsConstructor
@Slf4j
public class OperationLockController {

    private final OperationLockCommandService lockService;

    /**
     * Acquire a lock on an operation.
     */
    @PostMapping("/{operationId}")
    public ResponseEntity<Map<String, Object>> acquireLock(
            @PathVariable String operationId,
            @RequestBody(required = false) AcquireLockRequest request) {
        try {
            String username = getCurrentUsername();
            String fullName = getCurrentUserFullName();

            AcquireLockCommand command = AcquireLockCommand.builder()
                    .operationId(operationId)
                    .username(username)
                    .userFullName(fullName)
                    .durationSeconds(request != null ? request.getDurationSeconds() : null)
                    .operationReference(request != null ? request.getOperationReference() : null)
                    .productType(request != null ? request.getProductType() : null)
                    .build();

            OperationLockDTO lock = lockService.acquireLock(command);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Lock acquired successfully");
            response.put("data", lock);

            return ResponseEntity.ok(response);

        } catch (OperationLockedException e) {
            log.warn("Lock acquisition failed for operation {}: {}", operationId, e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            response.put("lockInfo", e.getLockInfo());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);

        } catch (Exception e) {
            log.error("Error acquiring lock for operation {}: {}", operationId, e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error acquiring lock: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Release a lock on an operation.
     */
    @DeleteMapping("/{operationId}")
    public ResponseEntity<Map<String, Object>> releaseLock(@PathVariable String operationId) {
        try {
            String username = getCurrentUsername();

            ReleaseLockCommand command = ReleaseLockCommand.builder()
                    .operationId(operationId)
                    .username(username)
                    .build();

            lockService.releaseLock(command);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Lock released successfully");

            return ResponseEntity.ok(response);

        } catch (OperationLockedException e) {
            log.warn("Lock release failed for operation {}: {}", operationId, e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            response.put("lockInfo", e.getLockInfo());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);

        } catch (Exception e) {
            log.error("Error releasing lock for operation {}: {}", operationId, e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error releasing lock: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Force release a lock (admin only).
     */
    @DeleteMapping("/{operationId}/force")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> forceReleaseLock(
            @PathVariable String operationId,
            @RequestBody(required = false) ForceReleaseRequest request) {
        try {
            String adminUsername = getCurrentUsername();

            ForceReleaseLockCommand command = ForceReleaseLockCommand.builder()
                    .operationId(operationId)
                    .adminUsername(adminUsername)
                    .reason(request != null ? request.getReason() : null)
                    .build();

            lockService.forceReleaseLock(command);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Lock force released successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error force releasing lock for operation {}: {}", operationId, e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error force releasing lock: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Extend a lock on an operation.
     */
    @PostMapping("/{operationId}/extend")
    public ResponseEntity<Map<String, Object>> extendLock(
            @PathVariable String operationId,
            @RequestBody @Valid ExtendLockRequest request) {
        try {
            String username = getCurrentUsername();

            ExtendLockCommand command = ExtendLockCommand.builder()
                    .operationId(operationId)
                    .username(username)
                    .additionalSeconds(request.getAdditionalSeconds())
                    .build();

            OperationLockDTO lock = lockService.extendLock(command);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Lock extended successfully");
            response.put("data", lock);

            return ResponseEntity.ok(response);

        } catch (OperationLockedException e) {
            log.warn("Lock extension failed for operation {}: {}", operationId, e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            response.put("lockInfo", e.getLockInfo());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);

        } catch (Exception e) {
            log.error("Error extending lock for operation {}: {}", operationId, e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error extending lock: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Get lock status for an operation.
     */
    @GetMapping("/{operationId}")
    public ResponseEntity<OperationLockDTO> getLockStatus(@PathVariable String operationId) {
        String username = getCurrentUsername();
        OperationLockDTO lock = lockService.getLockStatus(operationId, username);
        return ResponseEntity.ok(lock);
    }

    /**
     * Get all active locks (for admin panel).
     */
    @GetMapping("/active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getActiveLocks() {
        String username = getCurrentUsername();
        List<OperationLockDTO> locks = lockService.getActiveLocks(username);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", locks);
        response.put("total", locks.size());

        return ResponseEntity.ok(response);
    }

    /**
     * Get lock status for multiple operations (bulk query).
     */
    @GetMapping("/bulk")
    public ResponseEntity<Map<String, OperationLockDTO>> getBulkLockStatus(
            @RequestParam List<String> operationIds) {
        String username = getCurrentUsername();
        Map<String, OperationLockDTO> locks = lockService.getBulkLockStatus(operationIds, username);
        return ResponseEntity.ok(locks);
    }

    /**
     * Get lock statistics (for admin panel).
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getLockStatistics() {
        Map<String, Object> stats = lockService.getLockStatistics();
        return ResponseEntity.ok(stats);
    }

    /**
     * Check if user can operate on an operation.
     */
    @GetMapping("/{operationId}/can-operate")
    public ResponseEntity<Map<String, Object>> canOperate(@PathVariable String operationId) {
        String username = getCurrentUsername();
        boolean canOperate = lockService.canUserOperate(operationId, username);

        Map<String, Object> response = new HashMap<>();
        response.put("canOperate", canOperate);
        response.put("operationId", operationId);

        return ResponseEntity.ok(response);
    }

    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "anonymous";
    }

    private String getCurrentUserFullName() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        // In a real scenario, you'd get the full name from the user details
        return auth != null ? auth.getName() : "Anonymous User";
    }

    // Request DTOs
    public static class AcquireLockRequest {
        private Integer durationSeconds;
        private String operationReference;
        private String productType;

        public Integer getDurationSeconds() { return durationSeconds; }
        public void setDurationSeconds(Integer durationSeconds) { this.durationSeconds = durationSeconds; }
        public String getOperationReference() { return operationReference; }
        public void setOperationReference(String operationReference) { this.operationReference = operationReference; }
        public String getProductType() { return productType; }
        public void setProductType(String productType) { this.productType = productType; }
    }

    public static class ForceReleaseRequest {
        private String reason;

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    public static class ExtendLockRequest {
        private Integer additionalSeconds;

        public Integer getAdditionalSeconds() { return additionalSeconds; }
        public void setAdditionalSeconds(Integer additionalSeconds) { this.additionalSeconds = additionalSeconds; }
    }
}
