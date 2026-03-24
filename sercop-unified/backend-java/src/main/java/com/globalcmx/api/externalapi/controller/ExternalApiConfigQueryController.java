package com.globalcmx.api.externalapi.controller;

import com.globalcmx.api.externalapi.dto.query.*;
import com.globalcmx.api.externalapi.service.query.ExternalApiConfigQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/external-api/queries")
@RequiredArgsConstructor
@Slf4j
public class ExternalApiConfigQueryController {

    private final ExternalApiConfigQueryService queryService;

    @GetMapping
    @PreAuthorize("hasAuthority('CAN_VIEW_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> getAll(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String environment) {
        try {
            List<ExternalApiConfigResponse> configs = queryService.findAll(active, environment);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", configs);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching API configs: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('CAN_VIEW_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable Long id) {
        try {
            ExternalApiConfigResponse config = queryService.findById(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", config);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching API config: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/code/{code}")
    @PreAuthorize("hasAuthority('CAN_VIEW_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> getByCode(@PathVariable String code) {
        try {
            ExternalApiConfigResponse config = queryService.findByCode(code);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", config);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching API config by code: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/logs")
    @PreAuthorize("hasAuthority('CAN_VIEW_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> getAllLogs(
            @RequestParam(required = false) Long apiConfigId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) Boolean success,
            Pageable pageable) {
        try {
            Page<ApiCallLogResponse> logs = queryService.findAllLogs(apiConfigId, from, to, success, pageable);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", logs);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching all API logs: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @GetMapping("/test-results")
    @PreAuthorize("hasAuthority('CAN_VIEW_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> getAllTestResults(
            @RequestParam(required = false) Long apiConfigId,
            Pageable pageable) {
        try {
            Page<TestResultResponse> results = queryService.findAllTestResults(apiConfigId, pageable);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", results);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching test results: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @GetMapping("/{id}/logs")
    @PreAuthorize("hasAuthority('CAN_VIEW_API_LOGS')")
    public ResponseEntity<Map<String, Object>> getLogs(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) Boolean success,
            Pageable pageable) {
        try {
            Page<ApiCallLogResponse> logs = queryService.findLogs(id, from, to, success, pageable);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", logs.getContent());
            response.put("totalPages", logs.getTotalPages());
            response.put("totalElements", logs.getTotalElements());
            response.put("currentPage", logs.getNumber());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching API logs: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @GetMapping("/{id}/metrics")
    @PreAuthorize("hasAuthority('CAN_VIEW_API_METRICS')")
    public ResponseEntity<Map<String, Object>> getMetrics(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "7D") String period) {
        try {
            ApiMetricsResponse metrics = queryService.getMetrics(id, period);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", metrics);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching API metrics: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @GetMapping("/auth-types")
    @PreAuthorize("hasAuthority('CAN_VIEW_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> getAuthTypes() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", queryService.getAuthTypes());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/http-methods")
    @PreAuthorize("hasAuthority('CAN_VIEW_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> getHttpMethods() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", queryService.getHttpMethods());
        return ResponseEntity.ok(response);
    }
}
