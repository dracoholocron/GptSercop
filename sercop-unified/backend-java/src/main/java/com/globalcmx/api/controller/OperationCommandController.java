package com.globalcmx.api.controller;

import com.globalcmx.api.dto.ApiResponse;
import com.globalcmx.api.dto.command.ApproveOperationCommand;
import com.globalcmx.api.dto.command.ExecuteEventCommand;
import com.globalcmx.api.dto.command.SubmitEventForApprovalCommand;
import com.globalcmx.api.dto.query.OperationQueryDTO;
import com.globalcmx.api.dto.query.PendingApprovalDTO;
import com.globalcmx.api.readmodel.entity.EventTypeConfigReadModel;
import com.globalcmx.api.readmodel.entity.OperationReadModel;
import com.globalcmx.api.readmodel.repository.EventTypeConfigReadModelRepository;
import com.globalcmx.api.readmodel.repository.OperationReadModelRepository;
import com.globalcmx.api.service.OperationCommandService;
import com.globalcmx.api.service.PendingApprovalCommandService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * REST controller for operation commands (CQRS write side).
 */
@RestController
@RequestMapping("/v1/operations")
@RequiredArgsConstructor
@Slf4j
public class OperationCommandController {

    private final OperationCommandService commandService;
    private final PendingApprovalCommandService pendingApprovalService;
    private final EventTypeConfigReadModelRepository eventTypeRepository;
    private final OperationReadModelRepository operationRepository;

    @PostMapping("/approve")
    public ResponseEntity<ApiResponse<OperationQueryDTO>> approveDraft(
            @RequestBody ApproveOperationCommand command) {
        log.info("POST /api/operations/approve - draftId: {}", command.getDraftId());
        try {
            OperationQueryDTO operation = commandService.approveDraft(command);
            return ResponseEntity.ok(ApiResponse.success("Draft approved successfully", operation));
        } catch (RuntimeException e) {
            log.error("Error approving draft: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{operationId}/execute-event")
    public ResponseEntity<Map<String, Object>> executeEvent(
            @PathVariable String operationId,
            @RequestBody ExecuteEventCommand command) {
        log.info("POST /api/operations/{}/execute-event - event: {}",
                operationId, command.getEventCode());

        Map<String, Object> response = new HashMap<>();
        try {
            command.setOperationId(operationId);

            // Get operation to check product type
            OperationReadModel operation = operationRepository.findByOperationId(operationId)
                    .orElseThrow(() -> new RuntimeException("Operation not found: " + operationId));

            // Check if event requires approval
            EventTypeConfigReadModel eventConfig = eventTypeRepository
                    .findByEventCodeAndOperationTypeAndLanguage(
                            command.getEventCode(), operation.getProductType(), "en")
                    .orElse(null);

            boolean requiresApproval = eventConfig != null &&
                    Boolean.TRUE.equals(eventConfig.getRequiresApproval());

            if (requiresApproval) {
                // Submit for approval instead of executing directly
                log.info("Event {} requires approval, submitting for approval", command.getEventCode());

                SubmitEventForApprovalCommand approvalCommand = SubmitEventForApprovalCommand.builder()
                        .operationId(operationId)
                        .eventCode(command.getEventCode())
                        .eventData(command.getEventData())
                        .comments(command.getComments())
                        .submittedBy(command.getExecutedBy())
                        .build();

                PendingApprovalDTO approval = pendingApprovalService.submitForApproval(approvalCommand);

                response.put("success", true);
                response.put("requiresApproval", true);
                response.put("message", "Event submitted for approval");
                response.put("data", approval);
                return ResponseEntity.ok(response);
            }

            // Execute event directly
            OperationQueryDTO result = commandService.executeEvent(command);
            response.put("success", true);
            response.put("requiresApproval", false);
            response.put("message", "Event executed successfully");
            response.put("data", result);
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            log.error("Error executing event: {}", e.getMessage());
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/{operationId}/response-received")
    public ResponseEntity<ApiResponse<Void>> markResponseReceived(
            @PathVariable String operationId,
            @RequestParam String responseMessageType) {
        log.info("POST /api/operations/{}/response-received - type: {}",
                operationId, responseMessageType);
        try {
            commandService.markResponseReceived(operationId, responseMessageType);
            return ResponseEntity.ok(ApiResponse.success("Response received marked successfully", null));
        } catch (RuntimeException e) {
            log.error("Error marking response received: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
}
