package com.globalcmx.api.controller;

import com.globalcmx.api.dto.ApiResponse;
import com.globalcmx.api.readmodel.entity.OperationReadModel;
import com.globalcmx.api.readmodel.entity.OperationEventLogReadModel;
import com.globalcmx.api.readmodel.repository.OperationReadModelRepository;
import com.globalcmx.api.readmodel.repository.OperationEventLogReadModelRepository;
import com.globalcmx.api.service.OperationEnrichmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.globalcmx.api.service.draft.SwiftMessageParserService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

/**
 * REST controller for querying operations.
 * Provides endpoints to list and filter active operations.
 */
@RestController
@RequestMapping("/v1/operations")
@RequiredArgsConstructor
@Slf4j
public class OperationQueryController {

    private final OperationReadModelRepository operationRepository;
    private final OperationEventLogReadModelRepository eventLogRepository;
    private final OperationEnrichmentService enrichmentService;
    private final SwiftMessageParserService swiftMessageParserService;

    @PersistenceContext(unitName = "readModel")
    private EntityManager entityManager;

    /**
     * Get all active operations with optional filters.
     * Supports filtering by productType, status, stage, reference, applicantId, beneficiaryId, applicantName, beneficiaryName
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OperationReadModel>>> getAllOperations(
            @RequestParam(required = false) String productType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String stage,
            @RequestParam(required = false) String reference,
            @RequestParam(required = false) Long applicantId,
            @RequestParam(required = false) Long beneficiaryId,
            @RequestParam(required = false) String applicantName,
            @RequestParam(required = false) String beneficiaryName) {

        log.info("GET /api/v1/operations - productType={}, status={}, stage={}, reference={}, applicantId={}, beneficiaryId={}, applicantName={}, beneficiaryName={}",
                productType, status, stage, reference, applicantId, beneficiaryId, applicantName, beneficiaryName);

        List<OperationReadModel> operations;

        // Use findWithFilters when client filters are provided
        if (applicantId != null || beneficiaryId != null || reference != null || applicantName != null || beneficiaryName != null) {
            operations = operationRepository.findWithFilters(
                    productType, stage, status, reference, applicantId, beneficiaryId, applicantName, beneficiaryName);
        } else if (productType != null && status != null) {
            operations = operationRepository.findByProductTypeAndStatusOrderByCreatedAtDesc(productType, status);
        } else if (productType != null && stage != null) {
            operations = operationRepository.findByProductTypeAndStageOrderByCreatedAtDesc(productType, stage);
        } else if (productType != null) {
            operations = operationRepository.findByProductTypeOrderByCreatedAtDesc(productType);
        } else if (status != null) {
            operations = operationRepository.findByStatusOrderByCreatedAtDesc(status);
        } else if (stage != null) {
            operations = operationRepository.findByStageOrderByCreatedAtDesc(stage);
        } else {
            operations = operationRepository.findAll();
        }

        // Enrich operations with pending balance from GLE
        operations = enrichmentService.enrichWithPendingBalance(operations);

        return ResponseEntity.ok(ApiResponse.success("OK", operations));
    }

    /**
     * Get operations by product type.
     * By default excludes CLOSED operations for better performance.
     * Use includeClosed=true to include them.
     *
     * Note: COLLECTION is expanded to COLLECTION_IMPORT and COLLECTION_EXPORT
     */
    @GetMapping("/product/{productType}")
    public ResponseEntity<ApiResponse<List<OperationReadModel>>> getByProductType(
            @PathVariable String productType,
            @RequestParam(defaultValue = "false") boolean includeClosed) {

        log.info("GET /api/v1/operations/product/{} - includeClosed={}", productType, includeClosed);

        List<OperationReadModel> operations;

        // Handle COLLECTION by expanding to COLLECTION_IMPORT and COLLECTION_EXPORT
        if ("COLLECTION".equals(productType)) {
            List<String> collectionTypes = Arrays.asList("COLLECTION_IMPORT", "COLLECTION_EXPORT");
            if (includeClosed) {
                operations = operationRepository.findByProductTypeInOrderByCreatedAtDesc(collectionTypes);
            } else {
                operations = operationRepository.findByProductTypeInAndStatusNotOrderByCreatedAtDesc(collectionTypes, "CLOSED");
            }
        } else if (includeClosed) {
            operations = operationRepository.findByProductTypeOrderByCreatedAtDesc(productType);
        } else {
            operations = operationRepository.findByProductTypeAndStatusNotOrderByCreatedAtDesc(productType, "CLOSED");
        }

        // Enrich operations with pending balance from GLE
        operations = enrichmentService.enrichWithPendingBalance(operations);

        return ResponseEntity.ok(ApiResponse.success("OK", operations));
    }

    /**
     * Get operations awaiting response.
     */
    @GetMapping("/awaiting-response")
    public ResponseEntity<ApiResponse<List<OperationReadModel>>> getAwaitingResponse(
            @RequestParam(required = false) String productType) {

        log.info("GET /api/v1/operations/awaiting-response - productType={}", productType);

        List<OperationReadModel> operations;

        if (productType != null) {
            operations = operationRepository.findByProductTypeAndAwaitingResponseTrueOrderByResponseDueDateAsc(productType);
        } else {
            operations = operationRepository.findByAwaitingResponseTrueOrderByResponseDueDateAsc();
        }

        // Enrich operations with pending balance from GLE
        operations = enrichmentService.enrichWithPendingBalance(operations);

        return ResponseEntity.ok(ApiResponse.success("OK", operations));
    }

    /**
     * Get operations with alerts.
     */
    @GetMapping("/with-alerts")
    public ResponseEntity<ApiResponse<List<OperationReadModel>>> getWithAlerts(
            @RequestParam(required = false) String productType) {

        log.info("GET /api/v1/operations/with-alerts - productType={}", productType);

        List<OperationReadModel> operations;

        if (productType != null) {
            operations = operationRepository.findByProductTypeAndHasAlertsTrueOrderByAlertCountDesc(productType);
        } else {
            operations = operationRepository.findByHasAlertsTrueOrderByAlertCountDesc();
        }

        // Enrich operations with pending balance from GLE
        operations = enrichmentService.enrichWithPendingBalance(operations);

        return ResponseEntity.ok(ApiResponse.success("OK", operations));
    }

    /**
     * Get a specific operation by ID.
     */
    @GetMapping("/{operationId}")
    public ResponseEntity<ApiResponse<OperationReadModel>> getOperation(
            @PathVariable String operationId) {

        log.info("GET /api/v1/operations/{}", operationId);

        return operationRepository.findByOperationId(operationId)
                .map(op -> {
                    enrichmentService.enrichWithPendingBalance(op);
                    return ResponseEntity.ok(ApiResponse.success("OK", op));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get all event logs (recent, across all operations).
     * Supports pagination and date filters.
     *
     * @param page Page number (0-indexed)
     * @param size Page size (default 50, max 200)
     * @param startDate Optional start date filter (format: yyyy-MM-dd)
     * @param endDate Optional end date filter (format: yyyy-MM-dd)
     * @param operationType Optional filter by operation type (LC_IMPORT, LC_EXPORT, GUARANTEE, etc.)
     * @param eventCode Optional filter by event code
     * @param search Optional search term (searches in reference and operationId)
     * @param executedBy Optional filter by user who executed the event
     */
    @GetMapping("/event-logs")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllEventLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String operationType,
            @RequestParam(required = false) String eventCode,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String executedBy) {

        log.info("GET /api/v1/operations/event-logs - page={}, size={}, startDate={}, endDate={}, operationType={}, eventCode={}, search={}, executedBy={}",
                page, size, startDate, endDate, operationType, eventCode, search, executedBy);

        // Ensure size is within bounds
        size = Math.min(size, 200);
        Pageable pageable = PageRequest.of(page, size);

        // Convert dates to LocalDateTime
        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDateTime = endDate != null ? endDate.atTime(LocalTime.MAX) : null;

        // Use the filtered pageable query
        Page<OperationEventLogReadModel> eventPage = eventLogRepository.findWithFiltersPaged(
                operationType, eventCode, executedBy, search, startDateTime, endDateTime, pageable);

        // Build response with pagination metadata
        Map<String, Object> response = new HashMap<>();
        response.put("events", eventPage.getContent());
        response.put("currentPage", eventPage.getNumber());
        response.put("totalPages", eventPage.getTotalPages());
        response.put("totalElements", eventPage.getTotalElements());
        response.put("pageSize", eventPage.getSize());
        response.put("hasNext", eventPage.hasNext());
        response.put("hasPrevious", eventPage.hasPrevious());

        return ResponseEntity.ok(ApiResponse.success("OK", response));
    }

    /**
     * Get distinct historical values for a SWIFT field, filtered by applicant.
     * Used by the field history assistant to suggest values from previous operations.
     *
     * @param fieldCode SWIFT field code (e.g., ":44A:", ":44B:", ":44E:")
     * @param messageType SWIFT message type (e.g., "MT700")
     * @param applicantId Optional applicant ID to filter by
     * @param limit Max number of distinct values to return (default 10)
     */
    @GetMapping("/field-history")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getFieldHistory(
            @RequestParam String fieldCode,
            @RequestParam String messageType,
            @RequestParam(required = false) Long applicantId,
            @RequestParam(defaultValue = "10") int limit) {

        // Cap limit to prevent abuse
        limit = Math.min(limit, 20);

        log.debug("GET /api/v1/operations/field-history - fieldCode={}, messageType={}, applicantId={}, limit={}",
                fieldCode, messageType, applicantId, limit);

        // Efficient SQL: only fetch swift_message + metadata, ordered by most recent
        // Uses applicant_id index when filtering by applicant
        StringBuilder sql = new StringBuilder("""
            SELECT swift_message, applicant_name, reference, created_at
            FROM operation_readmodel
            WHERE message_type = :messageType
            AND swift_message IS NOT NULL
            """);

        if (applicantId != null) {
            sql.append(" AND applicant_id = :applicantId");
        }

        // Fetch limit*3 rows to account for deduplication, max 30
        int queryLimit = Math.min(limit * 3, 30);
        sql.append("\n ORDER BY created_at DESC LIMIT ").append(queryLimit);

        var query = entityManager.createNativeQuery(sql.toString());
        query.setParameter("messageType", messageType);
        if (applicantId != null) {
            query.setParameter("applicantId", applicantId);
        }

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();

        // Parse SWIFT messages and extract the requested field
        Set<String> seen = new LinkedHashSet<>();
        List<Map<String, Object>> results = new ArrayList<>();

        for (Object[] row : rows) {
            if (results.size() >= limit) break;

            String swiftMessage = (String) row[0];
            String applicantName = (String) row[1];
            String reference = (String) row[2];
            Object createdAt = row[3];

            try {
                Map<String, Object> parsed = swiftMessageParserService.parseSwiftMessage(swiftMessage, messageType);
                Object fieldValue = parsed.get(fieldCode);
                if (fieldValue == null) continue;

                String serialized = fieldValue instanceof Map ?
                    fieldValue.toString() : String.valueOf(fieldValue);
                if (serialized.isBlank() || seen.contains(serialized)) continue;
                seen.add(serialized);

                Map<String, Object> item = new LinkedHashMap<>();
                item.put("value", fieldValue);
                item.put("applicantName", applicantName);
                item.put("reference", reference);
                item.put("createdAt", createdAt != null ? createdAt.toString() : null);
                results.add(item);
            } catch (Exception e) {
                // Skip unparseable messages
            }
        }

        return ResponseEntity.ok(ApiResponse.success("OK", results));
    }
}
