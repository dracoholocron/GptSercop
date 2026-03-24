package com.globalcmx.api.externalapi.controller;

import com.globalcmx.api.externalapi.dto.command.*;
import com.globalcmx.api.externalapi.dto.query.*;
import com.globalcmx.api.externalapi.service.ExternalApiMappingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller for managing External API variable mappings and response listeners.
 */
@RestController
@RequestMapping("/admin/external-api")
@RequiredArgsConstructor
@Slf4j
public class ExternalApiMappingController {

    private final ExternalApiMappingService mappingService;

    // ==================== REQUEST MAPPINGS ====================

    @GetMapping("/queries/{apiConfigId}/request-mappings")
    @PreAuthorize("hasAuthority('CAN_VIEW_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> getRequestMappings(@PathVariable Long apiConfigId) {
        try {
            List<RequestMappingDTO> mappings = mappingService.getRequestMappings(apiConfigId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", mappings);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching request mappings: {}", e.getMessage(), e);
            return buildErrorResponse(e.getMessage());
        }
    }

    @PostMapping("/commands/request-mappings")
    @PreAuthorize("hasAuthority('CAN_EDIT_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> createRequestMapping(
            @Valid @RequestBody CreateRequestMappingCommand command) {
        try {
            RequestMappingDTO created = mappingService.createRequestMapping(command);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", created);
            response.put("message", "Request mapping created successfully");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error creating request mapping: {}", e.getMessage(), e);
            return buildErrorResponse(e.getMessage());
        }
    }

    @PutMapping("/commands/request-mappings/{id}")
    @PreAuthorize("hasAuthority('CAN_EDIT_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> updateRequestMapping(
            @PathVariable Long id,
            @Valid @RequestBody CreateRequestMappingCommand command) {
        try {
            RequestMappingDTO updated = mappingService.updateRequestMapping(id, command);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", updated);
            response.put("message", "Request mapping updated successfully");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error updating request mapping: {}", e.getMessage(), e);
            return buildErrorResponse(e.getMessage());
        }
    }

    @DeleteMapping("/commands/request-mappings/{id}")
    @PreAuthorize("hasAuthority('CAN_EDIT_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> deleteRequestMapping(@PathVariable Long id) {
        try {
            mappingService.deleteRequestMapping(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Request mapping deleted successfully");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error deleting request mapping: {}", e.getMessage(), e);
            return buildErrorResponse(e.getMessage());
        }
    }

    // ==================== RESPONSE MAPPINGS ====================

    @GetMapping("/queries/{apiConfigId}/response-mappings")
    @PreAuthorize("hasAuthority('CAN_VIEW_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> getResponseMappings(@PathVariable Long apiConfigId) {
        try {
            List<ResponseMappingDTO> mappings = mappingService.getResponseMappings(apiConfigId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", mappings);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching response mappings: {}", e.getMessage(), e);
            return buildErrorResponse(e.getMessage());
        }
    }

    @PostMapping("/commands/response-mappings")
    @PreAuthorize("hasAuthority('CAN_EDIT_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> createResponseMapping(
            @Valid @RequestBody CreateResponseMappingCommand command) {
        try {
            ResponseMappingDTO created = mappingService.createResponseMapping(command);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", created);
            response.put("message", "Response mapping created successfully");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error creating response mapping: {}", e.getMessage(), e);
            return buildErrorResponse(e.getMessage());
        }
    }

    @PutMapping("/commands/response-mappings/{id}")
    @PreAuthorize("hasAuthority('CAN_EDIT_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> updateResponseMapping(
            @PathVariable Long id,
            @Valid @RequestBody CreateResponseMappingCommand command) {
        try {
            ResponseMappingDTO updated = mappingService.updateResponseMapping(id, command);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", updated);
            response.put("message", "Response mapping updated successfully");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error updating response mapping: {}", e.getMessage(), e);
            return buildErrorResponse(e.getMessage());
        }
    }

    @DeleteMapping("/commands/response-mappings/{id}")
    @PreAuthorize("hasAuthority('CAN_EDIT_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> deleteResponseMapping(@PathVariable Long id) {
        try {
            mappingService.deleteResponseMapping(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Response mapping deleted successfully");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error deleting response mapping: {}", e.getMessage(), e);
            return buildErrorResponse(e.getMessage());
        }
    }

    // ==================== RESPONSE LISTENERS ====================

    @GetMapping("/queries/{apiConfigId}/response-listeners")
    @PreAuthorize("hasAuthority('CAN_VIEW_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> getResponseListeners(@PathVariable Long apiConfigId) {
        try {
            List<ResponseListenerDTO> listeners = mappingService.getResponseListeners(apiConfigId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", listeners);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching response listeners: {}", e.getMessage(), e);
            return buildErrorResponse(e.getMessage());
        }
    }

    @PostMapping("/commands/response-listeners")
    @PreAuthorize("hasAuthority('CAN_EDIT_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> createResponseListener(
            @Valid @RequestBody CreateResponseListenerCommand command) {
        try {
            ResponseListenerDTO created = mappingService.createResponseListener(command);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", created);
            response.put("message", "Response listener created successfully");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error creating response listener: {}", e.getMessage(), e);
            return buildErrorResponse(e.getMessage());
        }
    }

    @PutMapping("/commands/response-listeners/{id}")
    @PreAuthorize("hasAuthority('CAN_EDIT_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> updateResponseListener(
            @PathVariable Long id,
            @Valid @RequestBody CreateResponseListenerCommand command) {
        try {
            ResponseListenerDTO updated = mappingService.updateResponseListener(id, command);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", updated);
            response.put("message", "Response listener updated successfully");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error updating response listener: {}", e.getMessage(), e);
            return buildErrorResponse(e.getMessage());
        }
    }

    @DeleteMapping("/commands/response-listeners/{id}")
    @PreAuthorize("hasAuthority('CAN_EDIT_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> deleteResponseListener(@PathVariable Long id) {
        try {
            mappingService.deleteResponseListener(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Response listener deleted successfully");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error deleting response listener: {}", e.getMessage(), e);
            return buildErrorResponse(e.getMessage());
        }
    }

    // ==================== ENUMS ====================

    @GetMapping("/queries/parameter-locations")
    @PreAuthorize("hasAuthority('CAN_VIEW_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> getParameterLocations() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", List.of("PATH", "QUERY", "HEADER", "BODY", "BODY_JSON_PATH"));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/queries/data-types")
    @PreAuthorize("hasAuthority('CAN_VIEW_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> getDataTypes() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", List.of("STRING", "NUMBER", "BOOLEAN", "DATE", "JSON_OBJECT", "JSON_ARRAY"));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/queries/transformation-types")
    @PreAuthorize("hasAuthority('CAN_VIEW_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> getTransformationTypes() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", List.of("NONE", "UPPERCASE", "LOWERCASE", "DATE_FORMAT", "NUMBER_FORMAT", "CUSTOM"));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/queries/action-types")
    @PreAuthorize("hasAuthority('CAN_VIEW_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> getActionTypes() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", List.of(
                Map.of("value", "UPDATE_CATALOG", "label", "Update Catalog Table", "description", "Updates a database catalog table with response data"),
                Map.of("value", "UPDATE_OPERATION", "label", "Update Operation", "description", "Updates fields in the current operation"),
                Map.of("value", "UPDATE_ENTITY", "label", "Update Entity", "description", "Updates any JPA entity with response data"),
                Map.of("value", "TRIGGER_RULE", "label", "Trigger Rule", "description", "Triggers a business rule with response data"),
                Map.of("value", "SEND_NOTIFICATION", "label", "Send Notification", "description", "Sends email or push notification"),
                Map.of("value", "QUEUE_JOB", "label", "Queue Job", "description", "Queues a scheduled job for execution"),
                Map.of("value", "CUSTOM_SERVICE", "label", "Custom Service", "description", "Calls a custom Spring service method"),
                Map.of("value", "UPSERT_EXCHANGE_RATE", "label", "Upsert Exchange Rate (CQRS)", "description", "Creates or updates exchange rate using CQRS service with event sourcing"),
                Map.of("value", "UPSERT_ALL_EXCHANGE_RATES", "label", "Upsert All Exchange Rates", "description", "Creates or updates multiple exchange rates from a rates map")
        ));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/queries/source-types")
    @PreAuthorize("hasAuthority('CAN_VIEW_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> getSourceTypes() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", List.of(
                Map.of("value", "TEMPLATE_VARIABLE", "label", "Template Variable", "description", "Value from operation template variable"),
                Map.of("value", "CONSTANT", "label", "Constant", "description", "Fixed constant value"),
                Map.of("value", "CALCULATED", "label", "Calculated", "description", "Computed value using formulas/functions")
        ));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/queries/calculated-functions")
    @PreAuthorize("hasAuthority('CAN_VIEW_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> getCalculatedFunctions() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", List.of(
                // Date/Time functions
                Map.of("value", "NOW()", "label", "Current DateTime", "category", "DateTime", "description", "Current date and time in ISO format"),
                Map.of("value", "TODAY()", "label", "Current Date", "category", "DateTime", "description", "Current date in ISO format (yyyy-MM-dd)"),
                Map.of("value", "TIME()", "label", "Current Time", "category", "DateTime", "description", "Current time in ISO format (HH:mm:ss)"),
                Map.of("value", "TIMESTAMP()", "label", "Unix Timestamp", "category", "DateTime", "description", "Unix timestamp in seconds"),
                Map.of("value", "TIMESTAMP_MS()", "label", "Unix Timestamp (ms)", "category", "DateTime", "description", "Unix timestamp in milliseconds"),
                Map.of("value", "DATE_ADD(7)", "label", "Date + Days", "category", "DateTime", "description", "Today plus N days"),
                Map.of("value", "DATE_SUB(7)", "label", "Date - Days", "category", "DateTime", "description", "Today minus N days"),
                Map.of("value", "YEAR()", "label", "Current Year", "category", "DateTime", "description", "Current year (4 digits)"),
                Map.of("value", "MONTH()", "label", "Current Month", "category", "DateTime", "description", "Current month (1-12)"),
                Map.of("value", "DAY()", "label", "Current Day", "category", "DateTime", "description", "Current day of month"),
                Map.of("value", "FIRST_DAY_OF_MONTH()", "label", "First of Month", "category", "DateTime", "description", "First day of current month"),
                Map.of("value", "LAST_DAY_OF_MONTH()", "label", "Last of Month", "category", "DateTime", "description", "Last day of current month"),
                Map.of("value", "START_OF_DAY()", "label", "Start of Day", "category", "DateTime", "description", "Today at 00:00:00"),
                Map.of("value", "END_OF_DAY()", "label", "End of Day", "category", "DateTime", "description", "Today at 23:59:59"),

                // Identifier functions
                Map.of("value", "UUID()", "label", "UUID", "category", "Identifiers", "description", "Random UUID (36 characters)"),
                Map.of("value", "UUID_SHORT()", "label", "Short UUID", "category", "Identifiers", "description", "Short UUID (first 8 characters)"),
                Map.of("value", "SEQUENCE()", "label", "Sequence", "category", "Identifiers", "description", "Auto-incrementing sequence number"),

                // String functions
                Map.of("value", "RANDOM(8)", "label", "Random String", "category", "Strings", "description", "Random alphanumeric string"),
                Map.of("value", "RANDOM_NUM(6)", "label", "Random Number", "category", "Strings", "description", "Random numeric string")
        ));
        return ResponseEntity.ok(response);
    }

    private ResponseEntity<Map<String, Object>> buildErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        return ResponseEntity.badRequest().body(response);
    }
}
