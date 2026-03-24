package com.globalcmx.api.alerts.controller;

import com.globalcmx.api.alerts.dto.BusinessRequestCreateRequest;
import com.globalcmx.api.alerts.dto.BusinessRequestResponse;
import com.globalcmx.api.alerts.entity.BusinessRequestReadModel.AlertConfig;
import com.globalcmx.api.alerts.service.BusinessRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for business requests from AI extraction.
 */
@RestController
@RequestMapping("/business-requests")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Business Requests", description = "Business requests from AI extraction and other sources")
public class BusinessRequestController {

    private final BusinessRequestService requestService;

    // ==================== GET REQUESTS ====================

    @GetMapping("/pending")
    @Operation(summary = "Get pending requests", description = "Get all pending business requests")
    public ResponseEntity<List<BusinessRequestResponse>> getPendingRequests() {
        List<BusinessRequestResponse> requests = requestService.getPendingRequests();
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/pending/paged")
    @Operation(summary = "Get pending requests (paged)", description = "Get pending business requests with pagination")
    public ResponseEntity<Page<BusinessRequestResponse>> getPendingRequestsPaged(Pageable pageable) {
        Page<BusinessRequestResponse> requests = requestService.getPendingRequests(pageable);
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/my-pending")
    @Operation(summary = "Get my pending requests", description = "Get pending requests created by current user")
    public ResponseEntity<List<BusinessRequestResponse>> getMyPendingRequests(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<BusinessRequestResponse> requests = requestService.getUserPendingRequests(userDetails.getUsername());
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/search")
    @Operation(summary = "Search requests", description = "Search business requests")
    public ResponseEntity<Page<BusinessRequestResponse>> searchRequests(
            @RequestParam String q,
            Pageable pageable) {
        Page<BusinessRequestResponse> results = requestService.searchRequests(q, pageable);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/{requestId}")
    @Operation(summary = "Get request by ID", description = "Get single business request")
    public ResponseEntity<BusinessRequestResponse> getRequest(@PathVariable String requestId) {
        return requestService.getRequest(requestId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/by-number/{requestNumber}")
    @Operation(summary = "Get request by number", description = "Get business request by request number")
    public ResponseEntity<BusinessRequestResponse> getRequestByNumber(@PathVariable String requestNumber) {
        return requestService.getRequestByNumber(requestNumber)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/count")
    @Operation(summary = "Count pending requests", description = "Get count of pending requests")
    public ResponseEntity<Map<String, Long>> countPendingRequests() {
        long count = requestService.countPendingRequests();
        return ResponseEntity.ok(Map.of("pending", count));
    }

    // ==================== CREATE ====================

    @PostMapping
    @Operation(summary = "Create request", description = "Create a new business request from AI extraction")
    public ResponseEntity<BusinessRequestResponse> createRequest(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody BusinessRequestCreateRequest request) {

        BusinessRequestResponse response = requestService.createRequest(request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    // ==================== ACTIONS ====================

    @PostMapping("/{requestId}/approve")
    @Operation(summary = "Approve request", description = "Approve business request and create alerts")
    public ResponseEntity<BusinessRequestResponse> approveRequest(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String requestId,
            @RequestParam(required = false) String draftId,
            @RequestParam(required = false) String operationId) {

        BusinessRequestResponse response = requestService.approveRequest(
            requestId, draftId, operationId, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{requestId}/reject")
    @Operation(summary = "Reject request", description = "Reject business request")
    public ResponseEntity<BusinessRequestResponse> rejectRequest(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String requestId,
            @RequestParam String reason) {

        BusinessRequestResponse response = requestService.rejectRequest(
            requestId, reason, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{requestId}/cancel")
    @Operation(summary = "Cancel request", description = "Cancel business request")
    public ResponseEntity<BusinessRequestResponse> cancelRequest(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String requestId) {

        BusinessRequestResponse response = requestService.cancelRequest(requestId, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{requestId}/alerts-config")
    @Operation(summary = "Update alerts config", description = "Update alerts configuration for pending request")
    public ResponseEntity<BusinessRequestResponse> updateAlertsConfig(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String requestId,
            @RequestBody List<AlertConfig> alertsConfig) {

        BusinessRequestResponse response = requestService.updateAlertsConfig(
            requestId, alertsConfig, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}
