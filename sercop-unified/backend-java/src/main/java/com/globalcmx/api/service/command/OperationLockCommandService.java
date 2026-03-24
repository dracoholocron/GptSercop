package com.globalcmx.api.service.command;

import com.globalcmx.api.config.OperationLockProperties;
import com.globalcmx.api.dto.OperationLockDTO;
import com.globalcmx.api.dto.command.AcquireLockCommand;
import com.globalcmx.api.dto.command.ExtendLockCommand;
import com.globalcmx.api.dto.command.ForceReleaseLockCommand;
import com.globalcmx.api.dto.command.ReleaseLockCommand;
import com.globalcmx.api.eventsourcing.event.OperationLockAcquiredEvent;
import com.globalcmx.api.eventsourcing.event.OperationLockExtendedEvent;
import com.globalcmx.api.eventsourcing.event.OperationLockReleasedEvent;
import com.globalcmx.api.exception.OperationLockedException;
import com.globalcmx.api.readmodel.entity.OperationLockReadModel;
import com.globalcmx.api.readmodel.repository.OperationLockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Command service for operation locks (pessimistic locking).
 * Handles acquiring, releasing, and extending locks on operations.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class OperationLockCommandService {

    private final OperationLockRepository lockRepository;
    private final OperationLockProperties lockProperties;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Acquire a lock on an operation.
     */
    @Transactional
    public OperationLockDTO acquireLock(AcquireLockCommand command) {
        String operationId = command.getOperationId();
        String username = command.getUsername();
        Instant now = Instant.now();

        log.info("Attempting to acquire lock for operation {} by user {}", operationId, username);

        // Check if already locked by another user
        Optional<OperationLockReadModel> existingLock = lockRepository.findActiveLock(operationId, now);
        if (existingLock.isPresent()) {
            OperationLockReadModel lock = existingLock.get();
            if (!lock.getLockedBy().equals(username)) {
                log.warn("Operation {} is already locked by {}", operationId, lock.getLockedBy());
                throw new OperationLockedException(
                    "Operation is locked by " + lock.getLockedByFullName(),
                    toDTO(lock, username)
                );
            }
            // Already locked by this user, return existing lock
            log.info("User {} already has lock on operation {}", username, operationId);
            return toDTO(lock, username);
        }

        // Check max locks per user
        long userLockCount = lockRepository.countActiveByUser(username, now);
        if (userLockCount >= lockProperties.getMaxLocksPerUser()) {
            log.warn("User {} has reached max locks limit ({})", username, lockProperties.getMaxLocksPerUser());
            throw new OperationLockedException(
                "Maximum number of concurrent locks reached (" + lockProperties.getMaxLocksPerUser() + ")"
            );
        }

        // Validate and normalize duration
        int duration = validateDuration(command.getDurationSeconds());
        Instant expiresAt = now.plusSeconds(duration);

        // Create new lock
        OperationLockReadModel lock = OperationLockReadModel.builder()
            .operationId(operationId)
            .lockedBy(username)
            .lockedByFullName(command.getUserFullName())
            .lockedAt(now)
            .expiresAt(expiresAt)
            .lockDurationSeconds(duration)
            .operationReference(command.getOperationReference())
            .productType(command.getProductType())
            .build();

        lockRepository.save(lock);
        log.info("Lock acquired for operation {} by user {} for {} seconds", operationId, username, duration);

        // Publish event
        OperationLockAcquiredEvent event = new OperationLockAcquiredEvent(
            operationId, username, command.getUserFullName(),
            expiresAt, duration, command.getOperationReference(), command.getProductType()
        );
        eventPublisher.publishEvent(event);

        return toDTO(lock, username);
    }

    /**
     * Release a lock on an operation (only owner can release).
     */
    @Transactional
    public void releaseLock(ReleaseLockCommand command) {
        String operationId = command.getOperationId();
        String username = command.getUsername();
        Instant now = Instant.now();

        log.info("Attempting to release lock for operation {} by user {}", operationId, username);

        Optional<OperationLockReadModel> existingLock = lockRepository.findActiveLock(operationId, now);
        if (existingLock.isEmpty()) {
            log.info("No active lock found for operation {}", operationId);
            return;
        }

        OperationLockReadModel lock = existingLock.get();
        if (!lock.getLockedBy().equals(username)) {
            log.warn("User {} cannot release lock owned by {}", username, lock.getLockedBy());
            throw new OperationLockedException(
                "You cannot release a lock owned by another user",
                toDTO(lock, username)
            );
        }

        lockRepository.delete(lock);
        log.info("Lock released for operation {} by user {}", operationId, username);

        // Publish event
        OperationLockReleasedEvent event = new OperationLockReleasedEvent(operationId, username, "MANUAL");
        eventPublisher.publishEvent(event);
    }

    /**
     * Force release a lock (admin only).
     */
    @Transactional
    public void forceReleaseLock(ForceReleaseLockCommand command) {
        String operationId = command.getOperationId();
        String adminUsername = command.getAdminUsername();
        Instant now = Instant.now();

        log.info("Admin {} force releasing lock for operation {}", adminUsername, operationId);

        Optional<OperationLockReadModel> existingLock = lockRepository.findActiveLock(operationId, now);
        if (existingLock.isEmpty()) {
            log.info("No active lock found for operation {}", operationId);
            return;
        }

        OperationLockReadModel lock = existingLock.get();
        String previousOwner = lock.getLockedBy();

        lockRepository.delete(lock);
        log.info("Lock force released for operation {} by admin {}. Previous owner: {}",
            operationId, adminUsername, previousOwner);

        // Publish event
        OperationLockReleasedEvent event = new OperationLockReleasedEvent(operationId, adminUsername, "FORCED");
        eventPublisher.publishEvent(event);
    }

    /**
     * Extend an existing lock.
     */
    @Transactional
    public OperationLockDTO extendLock(ExtendLockCommand command) {
        String operationId = command.getOperationId();
        String username = command.getUsername();
        Instant now = Instant.now();

        log.info("Attempting to extend lock for operation {} by user {}", operationId, username);

        Optional<OperationLockReadModel> existingLock = lockRepository.findActiveLock(operationId, now);
        if (existingLock.isEmpty()) {
            throw new OperationLockedException("No active lock found for this operation");
        }

        OperationLockReadModel lock = existingLock.get();
        if (!lock.getLockedBy().equals(username)) {
            throw new OperationLockedException(
                "You cannot extend a lock owned by another user",
                toDTO(lock, username)
            );
        }

        int additionalSeconds = validateDuration(command.getAdditionalSeconds());
        Instant previousExpiresAt = lock.getExpiresAt();
        lock.extendLock(additionalSeconds);

        lockRepository.save(lock);
        log.info("Lock extended for operation {} by {} seconds", operationId, additionalSeconds);

        // Publish event
        OperationLockExtendedEvent event = new OperationLockExtendedEvent(
            operationId, username, previousExpiresAt, lock.getExpiresAt(), additionalSeconds
        );
        eventPublisher.publishEvent(event);

        return toDTO(lock, username);
    }

    /**
     * Get lock status for an operation.
     */
    @Transactional(readOnly = true)
    public OperationLockDTO getLockStatus(String operationId, String currentUsername) {
        Instant now = Instant.now();
        Optional<OperationLockReadModel> lock = lockRepository.findActiveLock(operationId, now);

        if (lock.isEmpty()) {
            return OperationLockDTO.builder()
                .operationId(operationId)
                .isLocked(false)
                .canCurrentUserOperate(true)
                .build();
        }

        return toDTO(lock.get(), currentUsername);
    }

    /**
     * Check if user can operate on an operation.
     */
    @Transactional(readOnly = true)
    public boolean canUserOperate(String operationId, String username) {
        Instant now = Instant.now();
        Optional<OperationLockReadModel> lock = lockRepository.findActiveLock(operationId, now);

        if (lock.isEmpty()) {
            return true;
        }

        return lock.get().getLockedBy().equals(username);
    }

    /**
     * Get all active locks.
     */
    @Transactional(readOnly = true)
    public List<OperationLockDTO> getActiveLocks(String currentUsername) {
        Instant now = Instant.now();
        return lockRepository.findAllActiveLocks(now).stream()
            .map(lock -> toDTO(lock, currentUsername))
            .collect(Collectors.toList());
    }

    /**
     * Get locks for multiple operations (bulk query).
     */
    @Transactional(readOnly = true)
    public Map<String, OperationLockDTO> getBulkLockStatus(List<String> operationIds, String currentUsername) {
        Instant now = Instant.now();
        List<OperationLockReadModel> locks = lockRepository.findByOperationIds(operationIds, now);

        return locks.stream()
            .collect(Collectors.toMap(
                OperationLockReadModel::getOperationId,
                lock -> toDTO(lock, currentUsername)
            ));
    }

    /**
     * Cleanup expired locks (scheduled task).
     */
    @Scheduled(fixedRateString = "${operation-lock.cleanup-interval-seconds:60}000")
    @Transactional
    public void cleanupExpiredLocks() {
        Instant now = Instant.now();
        int deleted = lockRepository.deleteExpiredLocks(now);
        if (deleted > 0) {
            log.info("Cleaned up {} expired locks", deleted);
        }
    }

    /**
     * Get lock statistics.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getLockStatistics() {
        Instant now = Instant.now();
        long activeLocks = lockRepository.countActiveLocks(now);
        List<OperationLockReadModel> allActive = lockRepository.findAllActiveLocks(now);

        Map<String, Long> byUser = allActive.stream()
            .collect(Collectors.groupingBy(
                OperationLockReadModel::getLockedBy,
                Collectors.counting()
            ));

        Map<String, Long> byProductType = allActive.stream()
            .filter(l -> l.getProductType() != null)
            .collect(Collectors.groupingBy(
                OperationLockReadModel::getProductType,
                Collectors.counting()
            ));

        return Map.of(
            "activeLocks", activeLocks,
            "byUser", byUser,
            "byProductType", byProductType
        );
    }

    private int validateDuration(Integer duration) {
        if (duration == null) {
            return lockProperties.getDefaultDurationSeconds();
        }
        return Math.max(
            lockProperties.getMinDurationSeconds(),
            Math.min(duration, lockProperties.getMaxDurationSeconds())
        );
    }

    private OperationLockDTO toDTO(OperationLockReadModel lock, String currentUsername) {
        boolean isLockedByCurrentUser = lock.getLockedBy().equals(currentUsername);
        return OperationLockDTO.builder()
            .operationId(lock.getOperationId())
            .lockedBy(lock.getLockedBy())
            .lockedByFullName(lock.getLockedByFullName())
            .lockedAt(lock.getLockedAt())
            .expiresAt(lock.getExpiresAt())
            .remainingSeconds(lock.getRemainingSeconds())
            .lockDurationSeconds(lock.getLockDurationSeconds())
            .operationReference(lock.getOperationReference())
            .productType(lock.getProductType())
            .isLocked(true)
            .isLockedByCurrentUser(isLockedByCurrentUser)
            .isExpiringSoon(lock.isExpiringSoon())
            .canCurrentUserOperate(isLockedByCurrentUser)
            .build();
    }
}
