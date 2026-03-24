package com.globalcmx.api.controller;

import com.globalcmx.api.dto.ApiResponse;
import com.globalcmx.api.dto.query.EventTypeConfigQueryDTO;
import com.globalcmx.api.dto.query.EventFlowConfigQueryDTO;
import com.globalcmx.api.dto.query.SwiftResponseConfigQueryDTO;
import com.globalcmx.api.service.EventConfigQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for event configuration queries.
 * Provides event types, flows, and response configurations.
 */
@RestController
@RequestMapping("/v1/event-config")
@RequiredArgsConstructor
@Slf4j
public class EventConfigController {

    private final EventConfigQueryService queryService;

    // ==================== Event Types ====================

    @GetMapping("/types/{operationType}")
    public ResponseEntity<ApiResponse<List<EventTypeConfigQueryDTO>>> getEventTypes(
            @PathVariable String operationType,
            @RequestParam(defaultValue = "en") String language) {
        log.info("GET /api/event-config/types/{} lang={}", operationType, language);
        List<EventTypeConfigQueryDTO> types = queryService.getEventTypesForOperation(operationType, language);
        return ResponseEntity.ok(ApiResponse.success("Event types retrieved", types));
    }

    @GetMapping("/types/{operationType}/{eventCode}")
    public ResponseEntity<ApiResponse<EventTypeConfigQueryDTO>> getEventType(
            @PathVariable String operationType,
            @PathVariable String eventCode,
            @RequestParam(defaultValue = "en") String language) {
        log.info("GET /api/event-config/types/{}/{} lang={}", operationType, eventCode, language);
        return queryService.getEventType(eventCode, operationType, language)
                .map(type -> ResponseEntity.ok(ApiResponse.success("Event type retrieved", type)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/types/{operationType}/requires-approval")
    public ResponseEntity<ApiResponse<List<EventTypeConfigQueryDTO>>> getEventsRequiringApproval(
            @PathVariable String operationType,
            @RequestParam(defaultValue = "en") String language) {
        log.info("GET /api/event-config/types/{}/requires-approval lang={}", operationType, language);
        List<EventTypeConfigQueryDTO> types = queryService.getEventsRequiringApproval(operationType, language);
        return ResponseEntity.ok(ApiResponse.success("Events requiring approval retrieved", types));
    }

    @GetMapping("/operation-types")
    public ResponseEntity<ApiResponse<List<String>>> getOperationTypes() {
        log.info("GET /api/event-config/operation-types");
        List<String> types = queryService.getDistinctOperationTypes();
        return ResponseEntity.ok(ApiResponse.success("Operation types retrieved", types));
    }

    @GetMapping("/stages")
    public ResponseEntity<ApiResponse<List<String>>> getStages() {
        log.info("GET /api/event-config/stages");
        List<String> stages = queryService.getDistinctStages();
        return ResponseEntity.ok(ApiResponse.success("Stages retrieved", stages));
    }

    @GetMapping("/stages/{operationType}")
    public ResponseEntity<ApiResponse<List<String>>> getStagesByOperationType(
            @PathVariable String operationType) {
        log.info("GET /api/event-config/stages/{}", operationType);
        List<String> stages = queryService.getDistinctStagesByOperationType(operationType);
        return ResponseEntity.ok(ApiResponse.success("Stages retrieved", stages));
    }

    @GetMapping("/swift-message-types")
    public ResponseEntity<ApiResponse<List<String>>> getSwiftMessageTypes() {
        log.info("GET /api/event-config/swift-message-types");
        List<String> types = queryService.getDistinctSwiftMessageTypes();
        return ResponseEntity.ok(ApiResponse.success("SWIFT message types retrieved", types));
    }

    // ==================== Event Flows ====================

    @GetMapping("/flows/{operationType}/available")
    public ResponseEntity<ApiResponse<List<EventFlowConfigQueryDTO>>> getAvailableEvents(
            @PathVariable String operationType,
            @RequestParam(required = false) String currentStage,
            @RequestParam(required = false) String currentEvent,
            @RequestParam(defaultValue = "en") String language) {
        log.info("GET /api/event-config/flows/{}/available stage={} event={} lang={}",
                operationType, currentStage, currentEvent, language);
        List<EventFlowConfigQueryDTO> flows = queryService.getAvailableEvents(
                operationType, currentStage, currentEvent, language);
        return ResponseEntity.ok(ApiResponse.success("Available events retrieved", flows));
    }

    /**
     * Get available events for a specific operation with condition evaluation.
     * This endpoint evaluates configurable conditions against the operation's SWIFT data.
     * Example: If field 57a (Advise Through Bank) exists, show TRANSMIT_VIA_CORRESPONDENT event.
     *
     * @param clientPortal If true, only returns events marked as client-requestable
     */
    @GetMapping("/flows/operation/{operationId}/available")
    public ResponseEntity<ApiResponse<List<EventFlowConfigQueryDTO>>> getAvailableEventsForOperation(
            @PathVariable String operationId,
            @RequestParam(required = false) String currentStage,
            @RequestParam(required = false) String currentEvent,
            @RequestParam(defaultValue = "en") String language,
            @RequestParam(defaultValue = "false") boolean clientPortal) {
        log.info("GET /api/event-config/flows/operation/{}/available stage={} event={} lang={} clientPortal={}",
                operationId, currentStage, currentEvent, language, clientPortal);

        List<EventFlowConfigQueryDTO> flows;
        if (currentStage != null || currentEvent != null) {
            flows = queryService.getAvailableEventsForOperation(
                    operationId, currentStage, currentEvent, language, clientPortal);
        } else {
            flows = queryService.getAvailableEventsForOperation(operationId, language, clientPortal);
        }

        return ResponseEntity.ok(ApiResponse.success("Available events for operation retrieved", flows));
    }

    @GetMapping("/flows/{operationType}/initial")
    public ResponseEntity<ApiResponse<List<EventFlowConfigQueryDTO>>> getInitialEvents(
            @PathVariable String operationType,
            @RequestParam(defaultValue = "en") String language) {
        log.info("GET /api/event-config/flows/{}/initial lang={}", operationType, language);
        List<EventFlowConfigQueryDTO> flows = queryService.getInitialEvents(operationType, language);
        return ResponseEntity.ok(ApiResponse.success("Initial events retrieved", flows));
    }

    @GetMapping("/flows/{operationType}")
    public ResponseEntity<ApiResponse<List<EventFlowConfigQueryDTO>>> getAllFlows(
            @PathVariable String operationType,
            @RequestParam(defaultValue = "en") String language) {
        log.info("GET /api/event-config/flows/{} lang={}", operationType, language);
        List<EventFlowConfigQueryDTO> flows = queryService.getAllFlows(operationType, language);
        return ResponseEntity.ok(ApiResponse.success("Event flows retrieved", flows));
    }

    // ==================== Response Configs ====================

    @GetMapping("/responses/{operationType}")
    public ResponseEntity<ApiResponse<List<SwiftResponseConfigQueryDTO>>> getResponseConfigs(
            @PathVariable String operationType,
            @RequestParam(defaultValue = "en") String language) {
        log.info("GET /api/event-config/responses/{} lang={}", operationType, language);
        List<SwiftResponseConfigQueryDTO> configs = queryService.getResponseConfigsForOperation(
                operationType, language);
        return ResponseEntity.ok(ApiResponse.success("Response configs retrieved", configs));
    }

    @GetMapping("/responses/{operationType}/message/{messageType}")
    public ResponseEntity<ApiResponse<SwiftResponseConfigQueryDTO>> getResponseConfig(
            @PathVariable String operationType,
            @PathVariable String messageType,
            @RequestParam(defaultValue = "en") String language) {
        log.info("GET /api/event-config/responses/{}/message/{} lang={}",
                operationType, messageType, language);
        return queryService.getResponseConfig(messageType, operationType, language)
                .map(config -> ResponseEntity.ok(ApiResponse.success("Response config retrieved", config)))
                .orElse(ResponseEntity.notFound().build());
    }
}
