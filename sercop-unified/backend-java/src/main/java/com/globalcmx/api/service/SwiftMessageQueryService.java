package com.globalcmx.api.service;

import com.globalcmx.api.dto.query.SwiftMessageQueryDTO;
import com.globalcmx.api.readmodel.entity.SwiftMessageReadModel;
import com.globalcmx.api.readmodel.repository.SwiftMessageReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Query service for SWIFT messages (CQRS read side).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SwiftMessageQueryService {

    private final SwiftMessageReadModelRepository repository;

    @Transactional(readOnly = true)
    public Optional<SwiftMessageQueryDTO> findByMessageId(String messageId) {
        log.debug("Finding SWIFT message by messageId: {}", messageId);
        return repository.findByMessageId(messageId).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public List<SwiftMessageQueryDTO> findByOperationId(String operationId) {
        log.debug("Finding SWIFT messages by operationId: {}", operationId);
        return repository.findByOperationIdOrderByCreatedAtDesc(operationId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SwiftMessageQueryDTO> findByOperationType(String operationType) {
        log.debug("Finding SWIFT messages by operationType: {}", operationType);
        return repository.findByOperationTypeOrderByCreatedAtDesc(operationType)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SwiftMessageQueryDTO> findByMessageType(String messageType) {
        log.debug("Finding SWIFT messages by messageType: {}", messageType);
        return repository.findByMessageTypeOrderByCreatedAtDesc(messageType)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SwiftMessageQueryDTO> findByDirection(String direction) {
        log.debug("Finding SWIFT messages by direction: {}", direction);
        return repository.findByDirectionOrderByCreatedAtDesc(direction)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SwiftMessageQueryDTO> findByStatus(String status) {
        log.debug("Finding SWIFT messages by status: {}", status);
        return repository.findByStatusOrderByCreatedAtDesc(status)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SwiftMessageQueryDTO> findPendingResponses() {
        log.debug("Finding SWIFT messages expecting response");
        return repository.findByExpectsResponseTrueAndResponseReceivedFalseOrderByResponseDueDateAsc()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SwiftMessageQueryDTO> findOverdueResponses() {
        log.debug("Finding SWIFT messages with overdue responses");
        return repository.findOverdueResponses(LocalDate.now())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SwiftMessageQueryDTO> findPendingAck() {
        log.debug("Finding SWIFT messages pending ACK");
        return repository.findPendingAck()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SwiftMessageQueryDTO> findByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        log.debug("Finding SWIFT messages between {} and {}", startDate, endDate);
        return repository.findByDateRange(startDate, endDate)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SwiftMessageQueryDTO> findWithFilters(
            String operationId, String operationType, String messageType,
            String direction, String status, String senderBic, String receiverBic) {
        log.debug("Finding SWIFT messages with filters");
        return repository.findWithFilters(operationId, operationType, messageType,
                        direction, status, senderBic, receiverBic)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SwiftMessageQueryDTO> findAll() {
        log.debug("Finding all SWIFT messages");
        return repository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long countByDirection(String direction) {
        return repository.countByDirection(direction);
    }

    @Transactional(readOnly = true)
    public long countByMessageType(String messageType) {
        return repository.countByMessageType(messageType);
    }

    @Transactional(readOnly = true)
    public long countPendingResponses() {
        return repository.countByExpectsResponseTrueAndResponseReceivedFalse();
    }

    @Transactional(readOnly = true)
    public long countByOperationId(String operationId) {
        return repository.countByOperationId(operationId);
    }

    // Maximum results per search for security
    private static final int MAX_SEARCH_RESULTS = 100;
    private static final int MIN_SEARCH_LENGTH = 2;
    private static final int MAX_SEARCH_LENGTH = 100;

    // Pattern to detect potentially malicious input
    private static final Pattern SAFE_SEARCH_PATTERN = Pattern.compile("^[a-zA-Z0-9\\s\\-_.@/:]+$");

    /**
     * Search messages by text content with security controls
     */
    @Transactional(readOnly = true)
    public List<SwiftMessageQueryDTO> searchByText(String searchText) {
        // Validate and sanitize input
        String sanitized = sanitizeSearchInput(searchText);
        if (sanitized == null) {
            log.warn("SECURITY: Invalid search input rejected: {}", maskSensitiveData(searchText));
            return List.of();
        }

        // Audit logging
        String currentUser = getCurrentUsername();
        log.info("AUDIT: SWIFT search by user={} searchText={} ip={}",
                currentUser, maskSensitiveData(sanitized), "N/A");

        Pageable pageable = PageRequest.of(0, MAX_SEARCH_RESULTS, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<SwiftMessageReadModel> results = repository.searchByText(sanitized, pageable);

        log.info("AUDIT: SWIFT search completed user={} results={}", currentUser, results.getTotalElements());

        return results.getContent().stream().map(this::toDTO).collect(Collectors.toList());
    }

    /**
     * Search messages by content only with security controls
     */
    @Transactional(readOnly = true)
    public List<SwiftMessageQueryDTO> searchByContent(String searchText) {
        // Validate and sanitize input
        String sanitized = sanitizeSearchInput(searchText);
        if (sanitized == null) {
            log.warn("SECURITY: Invalid search content input rejected: {}", maskSensitiveData(searchText));
            return List.of();
        }

        // Audit logging
        String currentUser = getCurrentUsername();
        log.info("AUDIT: SWIFT content search by user={} searchText={}",
                currentUser, maskSensitiveData(sanitized));

        Pageable pageable = PageRequest.of(0, MAX_SEARCH_RESULTS, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<SwiftMessageReadModel> results = repository.searchByContent(sanitized, pageable);

        log.info("AUDIT: SWIFT content search completed user={} results={}", currentUser, results.getTotalElements());

        return results.getContent().stream().map(this::toDTO).collect(Collectors.toList());
    }

    /**
     * Sanitize search input to prevent injection attacks
     */
    private String sanitizeSearchInput(String input) {
        if (input == null || input.isBlank()) {
            return null;
        }

        String trimmed = input.trim();

        // Check length constraints
        if (trimmed.length() < MIN_SEARCH_LENGTH || trimmed.length() > MAX_SEARCH_LENGTH) {
            log.warn("SECURITY: Search input length out of bounds: {}", trimmed.length());
            return null;
        }

        // Check for safe characters only
        if (!SAFE_SEARCH_PATTERN.matcher(trimmed).matches()) {
            log.warn("SECURITY: Search input contains invalid characters");
            return null;
        }

        // Remove potential SQL wildcards that could cause performance issues
        return trimmed.replace("%", "").replace("_", "");
    }

    /**
     * Mask sensitive data for logging
     */
    private String maskSensitiveData(String data) {
        if (data == null || data.length() <= 4) {
            return "****";
        }
        return data.substring(0, 2) + "****" + data.substring(data.length() - 2);
    }

    /**
     * Get current authenticated username
     */
    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            return auth.getName();
        }
        return "anonymous";
    }

    private SwiftMessageQueryDTO toDTO(SwiftMessageReadModel entity) {
        return SwiftMessageQueryDTO.builder()
                .id(entity.getId())
                .messageId(entity.getMessageId())
                .messageType(entity.getMessageType())
                .direction(entity.getDirection())
                .operationId(entity.getOperationId())
                .operationType(entity.getOperationType())
                .senderBic(entity.getSenderBic())
                .receiverBic(entity.getReceiverBic())
                .swiftContent(entity.getSwiftContent())
                .field20Reference(entity.getField20Reference())
                .field21RelatedRef(entity.getField21RelatedRef())
                .currency(entity.getCurrency())
                .amount(entity.getAmount())
                .valueDate(entity.getValueDate())
                .status(entity.getStatus())
                .ackReceived(entity.getAckReceived())
                .ackContent(entity.getAckContent())
                .ackReceivedAt(entity.getAckReceivedAt())
                .expectsResponse(entity.getExpectsResponse())
                .expectedResponseType(entity.getExpectedResponseType())
                .responseDueDate(entity.getResponseDueDate())
                .responseReceived(entity.getResponseReceived())
                .responseMessageId(entity.getResponseMessageId())
                .triggeredByEvent(entity.getTriggeredByEvent())
                .generatesEvent(entity.getGeneratesEvent())
                .createdBy(entity.getCreatedBy())
                .createdAt(entity.getCreatedAt())
                .sentAt(entity.getSentAt())
                .deliveredAt(entity.getDeliveredAt())
                .receivedAt(entity.getReceivedAt())
                .processedAt(entity.getProcessedAt())
                .processedBy(entity.getProcessedBy())
                .version(entity.getVersion())
                .build();
    }
}
