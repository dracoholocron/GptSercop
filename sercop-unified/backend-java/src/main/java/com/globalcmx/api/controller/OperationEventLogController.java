package com.globalcmx.api.controller;

import com.globalcmx.api.dto.ApiResponse;
import com.globalcmx.api.dto.query.OperationEventLogQueryDTO;
import com.globalcmx.api.service.OperationEventLogQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * REST controller for operation event log queries.
 * Provides event history and audit trail.
 */
@RestController
@RequestMapping("/v1/event-logs")
@RequiredArgsConstructor
@Slf4j
public class OperationEventLogController {

    private final OperationEventLogQueryService queryService;

    @GetMapping("/{eventId}")
    public ResponseEntity<ApiResponse<OperationEventLogQueryDTO>> getByEventId(
            @PathVariable String eventId) {
        log.info("GET /api/event-logs/{}", eventId);
        return queryService.findByEventId(eventId)
                .map(event -> ResponseEntity.ok(ApiResponse.success("Event retrieved successfully", event)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/operation/{operationId}")
    public ResponseEntity<ApiResponse<List<OperationEventLogQueryDTO>>> getEventHistory(
            @PathVariable String operationId,
            @RequestParam(defaultValue = "en") String language) {
        log.info("GET /api/event-logs/operation/{} lang={}", operationId, language);
        List<OperationEventLogQueryDTO> events = queryService.getEventHistory(operationId, language);
        return ResponseEntity.ok(ApiResponse.success("Event history retrieved successfully", events));
    }

    @GetMapping("/operation/{operationId}/recent")
    public ResponseEntity<ApiResponse<List<OperationEventLogQueryDTO>>> getRecentEvents(
            @PathVariable String operationId,
            @RequestParam(defaultValue = "en") String language) {
        log.info("GET /api/event-logs/operation/{}/recent lang={}", operationId, language);
        List<OperationEventLogQueryDTO> events = queryService.getRecentEvents(operationId, language);
        return ResponseEntity.ok(ApiResponse.success("Recent events retrieved successfully", events));
    }

    @GetMapping("/operation/{operationId}/last")
    public ResponseEntity<ApiResponse<OperationEventLogQueryDTO>> getLastEvent(
            @PathVariable String operationId,
            @RequestParam(defaultValue = "en") String language) {
        log.info("GET /api/event-logs/operation/{}/last lang={}", operationId, language);
        return queryService.getLastEvent(operationId, language)
                .map(event -> ResponseEntity.ok(ApiResponse.success("Last event retrieved successfully", event)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/operation/{operationId}/transitions")
    public ResponseEntity<ApiResponse<List<OperationEventLogQueryDTO>>> getStateTransitions(
            @PathVariable String operationId,
            @RequestParam(defaultValue = "en") String language) {
        log.info("GET /api/event-logs/operation/{}/transitions lang={}", operationId, language);
        List<OperationEventLogQueryDTO> events = queryService.getStateTransitions(operationId, language);
        return ResponseEntity.ok(ApiResponse.success("State transitions retrieved successfully", events));
    }

    @GetMapping("/type/{operationType}")
    public ResponseEntity<ApiResponse<List<OperationEventLogQueryDTO>>> getByOperationType(
            @PathVariable String operationType,
            @RequestParam(defaultValue = "en") String language) {
        log.info("GET /api/event-logs/type/{} lang={}", operationType, language);
        List<OperationEventLogQueryDTO> events = queryService.getEventsByType(operationType, language);
        return ResponseEntity.ok(ApiResponse.success("Events retrieved successfully", events));
    }

    @GetMapping("/code/{eventCode}")
    public ResponseEntity<ApiResponse<List<OperationEventLogQueryDTO>>> getByEventCode(
            @PathVariable String eventCode,
            @RequestParam(defaultValue = "en") String language) {
        log.info("GET /api/event-logs/code/{} lang={}", eventCode, language);
        List<OperationEventLogQueryDTO> events = queryService.getEventsByCode(eventCode, language);
        return ResponseEntity.ok(ApiResponse.success("Events retrieved successfully", events));
    }

    @GetMapping("/message/{swiftMessageId}")
    public ResponseEntity<ApiResponse<List<OperationEventLogQueryDTO>>> getBySwiftMessage(
            @PathVariable String swiftMessageId,
            @RequestParam(defaultValue = "en") String language) {
        log.info("GET /api/event-logs/message/{} lang={}", swiftMessageId, language);
        List<OperationEventLogQueryDTO> events = queryService.getEventsForMessage(swiftMessageId, language);
        return ResponseEntity.ok(ApiResponse.success("Events retrieved successfully", events));
    }

    @GetMapping("/user/{executedBy}")
    public ResponseEntity<ApiResponse<List<OperationEventLogQueryDTO>>> getByUser(
            @PathVariable String executedBy,
            @RequestParam(defaultValue = "en") String language) {
        log.info("GET /api/event-logs/user/{} lang={}", executedBy, language);
        List<OperationEventLogQueryDTO> events = queryService.getEventsByUser(executedBy, language);
        return ResponseEntity.ok(ApiResponse.success("Events retrieved successfully", events));
    }

    @GetMapping("/date-range")
    public ResponseEntity<ApiResponse<List<OperationEventLogQueryDTO>>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "en") String language) {
        log.info("GET /api/event-logs/date-range from {} to {} lang={}", startDate, endDate, language);
        List<OperationEventLogQueryDTO> events = queryService.getEventsByDateRange(startDate, endDate, language);
        return ResponseEntity.ok(ApiResponse.success("Events retrieved successfully", events));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<OperationEventLogQueryDTO>>> search(
            @RequestParam(required = false) String operationId,
            @RequestParam(required = false) String operationType,
            @RequestParam(required = false) String eventCode,
            @RequestParam(required = false) String executedBy,
            @RequestParam(defaultValue = "en") String language) {
        log.info("GET /api/event-logs/search");
        List<OperationEventLogQueryDTO> events = queryService.searchWithFilters(
                operationId, operationType, eventCode, executedBy, language);
        return ResponseEntity.ok(ApiResponse.success("Events retrieved successfully", events));
    }

    @GetMapping("/count/operation/{operationId}")
    public ResponseEntity<ApiResponse<Long>> countByOperation(
            @PathVariable String operationId) {
        log.info("GET /api/event-logs/count/operation/{}", operationId);
        long count = queryService.countByOperationId(operationId);
        return ResponseEntity.ok(ApiResponse.success("Count retrieved successfully", count));
    }
}
