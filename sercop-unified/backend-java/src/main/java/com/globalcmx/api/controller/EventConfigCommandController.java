package com.globalcmx.api.controller;

import com.globalcmx.api.dto.ApiResponse;
import com.globalcmx.api.dto.command.EventTypeConfigCommand;
import com.globalcmx.api.dto.command.EventFlowConfigCommand;
import com.globalcmx.api.dto.command.SwiftResponseConfigCommand;
import com.globalcmx.api.readmodel.entity.EventTypeConfigReadModel;
import com.globalcmx.api.readmodel.entity.EventFlowConfigReadModel;
import com.globalcmx.api.readmodel.entity.SwiftResponseConfigReadModel;
import com.globalcmx.api.readmodel.entity.EventAlertTemplate;
import com.globalcmx.api.service.EventConfigCommandService;

import java.util.List;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for event configuration command operations (CQRS).
 * Handles CREATE, UPDATE, DELETE operations for event configurations.
 */
@RestController
@RequestMapping("/v1/event-config")
@RequiredArgsConstructor
@Slf4j
public class EventConfigCommandController {

    private final EventConfigCommandService commandService;

    // ==================== Event Type Config CRUD ====================

    @PostMapping("/types")
    public ResponseEntity<ApiResponse<EventTypeConfigReadModel>> createEventType(
            @Valid @RequestBody EventTypeConfigCommand command) {
        log.info("POST /api/event-config/types - Creating event type: {}", command.getEventCode());
        try {
            EventTypeConfigReadModel created = commandService.createEventType(command);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Event type created successfully", created));
        } catch (IllegalArgumentException e) {
            log.warn("Failed to create event type: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/types/{id}")
    public ResponseEntity<ApiResponse<EventTypeConfigReadModel>> updateEventType(
            @PathVariable Long id,
            @Valid @RequestBody EventTypeConfigCommand command) {
        log.info("PUT /api/event-config/types/{} - Updating event type", id);
        try {
            EventTypeConfigReadModel updated = commandService.updateEventType(id, command);
            return ResponseEntity.ok(ApiResponse.success("Event type updated successfully", updated));
        } catch (IllegalArgumentException e) {
            log.warn("Failed to update event type: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/types/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEventType(@PathVariable Long id) {
        log.info("DELETE /api/event-config/types/{} - Deleting event type", id);
        try {
            commandService.deleteEventType(id);
            return ResponseEntity.ok(ApiResponse.success("Event type deleted successfully", null));
        } catch (IllegalArgumentException e) {
            log.warn("Failed to delete event type: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("Cannot delete event type: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    // ==================== Event Flow Config CRUD ====================

    @PostMapping("/flows")
    public ResponseEntity<ApiResponse<EventFlowConfigReadModel>> createEventFlow(
            @Valid @RequestBody EventFlowConfigCommand command) {
        log.info("POST /api/event-config/flows - Creating event flow: {} -> {}",
                command.getFromEventCode(), command.getToEventCode());
        try {
            EventFlowConfigReadModel created = commandService.createEventFlow(command);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Event flow created successfully", created));
        } catch (IllegalArgumentException e) {
            log.warn("Failed to create event flow: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/flows/{id}")
    public ResponseEntity<ApiResponse<EventFlowConfigReadModel>> updateEventFlow(
            @PathVariable Long id,
            @Valid @RequestBody EventFlowConfigCommand command) {
        log.info("PUT /api/event-config/flows/{} - Updating event flow", id);
        try {
            EventFlowConfigReadModel updated = commandService.updateEventFlow(id, command);
            return ResponseEntity.ok(ApiResponse.success("Event flow updated successfully", updated));
        } catch (IllegalArgumentException e) {
            log.warn("Failed to update event flow: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/flows/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEventFlow(@PathVariable Long id) {
        log.info("DELETE /api/event-config/flows/{} - Deleting event flow", id);
        try {
            commandService.deleteEventFlow(id);
            return ResponseEntity.ok(ApiResponse.success("Event flow deleted successfully", null));
        } catch (IllegalArgumentException e) {
            log.warn("Failed to delete event flow: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    // ==================== SWIFT Response Config CRUD ====================

    @PostMapping("/responses")
    public ResponseEntity<ApiResponse<SwiftResponseConfigReadModel>> createResponseConfig(
            @Valid @RequestBody SwiftResponseConfigCommand command) {
        log.info("POST /api/event-config/responses - Creating response config: {} -> {}",
                command.getSentMessageType(), command.getExpectedResponseType());
        try {
            SwiftResponseConfigReadModel created = commandService.createResponseConfig(command);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Response config created successfully", created));
        } catch (IllegalArgumentException e) {
            log.warn("Failed to create response config: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/responses/{id}")
    public ResponseEntity<ApiResponse<SwiftResponseConfigReadModel>> updateResponseConfig(
            @PathVariable Long id,
            @Valid @RequestBody SwiftResponseConfigCommand command) {
        log.info("PUT /api/event-config/responses/{} - Updating response config", id);
        try {
            SwiftResponseConfigReadModel updated = commandService.updateResponseConfig(id, command);
            return ResponseEntity.ok(ApiResponse.success("Response config updated successfully", updated));
        } catch (IllegalArgumentException e) {
            log.warn("Failed to update response config: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/responses/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteResponseConfig(@PathVariable Long id) {
        log.info("DELETE /api/event-config/responses/{} - Deleting response config", id);
        try {
            commandService.deleteResponseConfig(id);
            return ResponseEntity.ok(ApiResponse.success("Response config deleted successfully", null));
        } catch (IllegalArgumentException e) {
            log.warn("Failed to delete response config: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    // ==================== Alert Template CRUD ====================

    @GetMapping("/alert-templates/{operationType}")
    public ResponseEntity<ApiResponse<List<EventAlertTemplate>>> getAlertTemplates(
            @PathVariable String operationType,
            @RequestParam(defaultValue = "es") String language) {
        log.info("GET /api/event-config/alert-templates/{} - language={}", operationType, language);
        List<EventAlertTemplate> templates = commandService.getAlertTemplates(operationType, language);
        return ResponseEntity.ok(ApiResponse.success("Alert templates loaded", templates));
    }

    @GetMapping("/alert-templates/{operationType}/event/{eventCode}")
    public ResponseEntity<ApiResponse<List<EventAlertTemplate>>> getAlertTemplatesForEvent(
            @PathVariable String operationType,
            @PathVariable String eventCode,
            @RequestParam(defaultValue = "es") String language) {
        log.info("GET /api/event-config/alert-templates/{}/event/{}", operationType, eventCode);
        List<EventAlertTemplate> templates = commandService.getAlertTemplatesForEvent(operationType, eventCode, language);
        return ResponseEntity.ok(ApiResponse.success("Alert templates for event loaded", templates));
    }

    @PostMapping("/alert-templates")
    public ResponseEntity<ApiResponse<EventAlertTemplate>> createAlertTemplate(
            @RequestBody EventAlertTemplate template) {
        log.info("POST /api/event-config/alert-templates - Creating for event: {}", template.getEventCode());
        try {
            EventAlertTemplate created = commandService.createAlertTemplate(template);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Alert template created successfully", created));
        } catch (Exception e) {
            log.warn("Failed to create alert template: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/alert-templates/{id}")
    public ResponseEntity<ApiResponse<EventAlertTemplate>> updateAlertTemplate(
            @PathVariable Long id,
            @RequestBody EventAlertTemplate template) {
        log.info("PUT /api/event-config/alert-templates/{}", id);
        try {
            EventAlertTemplate updated = commandService.updateAlertTemplate(id, template);
            return ResponseEntity.ok(ApiResponse.success("Alert template updated successfully", updated));
        } catch (IllegalArgumentException e) {
            log.warn("Failed to update alert template: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/alert-templates/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAlertTemplate(@PathVariable Long id) {
        log.info("DELETE /api/event-config/alert-templates/{}", id);
        try {
            commandService.deleteAlertTemplate(id);
            return ResponseEntity.ok(ApiResponse.success("Alert template deleted successfully", null));
        } catch (IllegalArgumentException e) {
            log.warn("Failed to delete alert template: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ==================== Alert Template Generation ====================

    @PostMapping("/alert-templates/generate/{operationType}/{eventCode}")
    public ResponseEntity<ApiResponse<List<EventAlertTemplate>>> generateTemplatesForEvent(
            @PathVariable String operationType,
            @PathVariable String eventCode,
            @RequestParam(defaultValue = "es") String language) {
        log.info("POST /api/event-config/alert-templates/generate/{}/{} lang={}", operationType, eventCode, language);
        try {
            List<EventAlertTemplate> generated = commandService.generateDefaultTemplates(operationType, eventCode, language);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Generated " + generated.size() + " templates", generated));
        } catch (IllegalArgumentException e) {
            log.warn("Failed to generate templates: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/alert-templates/generate/{operationType}")
    public ResponseEntity<ApiResponse<List<EventAlertTemplate>>> generateTemplatesForAll(
            @PathVariable String operationType,
            @RequestParam(defaultValue = "es") String language) {
        log.info("POST /api/event-config/alert-templates/generate/{} lang={}", operationType, language);
        try {
            List<EventAlertTemplate> generated = commandService.generateDefaultTemplatesForAll(operationType, language);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Generated " + generated.size() + " templates for all events", generated));
        } catch (IllegalArgumentException e) {
            log.warn("Failed to generate templates: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
