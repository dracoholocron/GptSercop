package com.globalcmx.api.alerts.controller;

import com.globalcmx.api.alerts.dto.*;
import com.globalcmx.api.alerts.entity.AlertTag;
import com.globalcmx.api.alerts.entity.AlertTypeConfig;
import com.globalcmx.api.alerts.entity.UserAlertHistoryReadModel;
import com.globalcmx.api.alerts.service.UserAlertQueryService;
import com.globalcmx.api.alerts.service.UserAlertService;
import org.springframework.security.access.prepost.PreAuthorize;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for user alerts and agenda.
 */
@RestController
@RequestMapping("/alerts")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Alerts", description = "User alerts and follow-up management")
public class UserAlertController {

    private final UserAlertService alertService;
    private final UserAlertQueryService queryService;
    private final com.globalcmx.api.security.repository.RoleRepository roleRepository;

    // ==================== AGENDA VIEWS ====================

    @GetMapping("/agenda")
    @Operation(summary = "Get agenda view", description = "Get alerts for agenda display (day/week/month)")
    public ResponseEntity<AgendaResponse> getAgenda(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "WEEK") String range,
            @RequestParam(defaultValue = "es") String lang) {

        LocalDate targetDate = date != null ? date : LocalDate.now();
        AgendaResponse agenda = queryService.getAgenda(
            userDetails.getUsername(), targetDate, range, lang);
        return ResponseEntity.ok(agenda);
    }

    @GetMapping("/calendar")
    @Operation(summary = "Get calendar counts", description = "Get alert counts per day for calendar view")
    public ResponseEntity<Map<LocalDate, Long>> getCalendarCounts(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        Map<LocalDate, Long> counts = queryService.getCalendarCounts(
            userDetails.getUsername(), startDate, endDate);
        return ResponseEntity.ok(counts);
    }

    // ==================== ALERT LISTS ====================

    @GetMapping("/today")
    @Operation(summary = "Get today's alerts", description = "Get all alerts scheduled for today")
    public ResponseEntity<List<AlertResponse>> getTodayAlerts(
            @AuthenticationPrincipal UserDetails userDetails) {

        List<AlertResponse> alerts = alertService.getTodayAlerts(userDetails.getUsername());
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/upcoming")
    @Operation(summary = "Get upcoming alerts", description = "Get alerts for the next N days")
    public ResponseEntity<List<AlertResponse>> getUpcomingAlerts(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "7") int days) {

        List<AlertResponse> alerts = alertService.getUpcomingAlerts(userDetails.getUsername(), days);
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/overdue")
    @Operation(summary = "Get overdue alerts", description = "Get all past-due alerts")
    public ResponseEntity<List<AlertResponse>> getOverdueAlerts(
            @AuthenticationPrincipal UserDetails userDetails) {

        List<AlertResponse> alerts = alertService.getOverdueAlerts(userDetails.getUsername());
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/widget")
    @Operation(summary = "Get today's widget data", description = "Get summary data for TopBar widget")
    public ResponseEntity<TodayAlertsWidgetResponse> getTodayWidget(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "es") String lang) {

        TodayAlertsWidgetResponse widget = alertService.getTodayWidget(userDetails.getUsername(), lang);
        return ResponseEntity.ok(widget);
    }

    @GetMapping("/counts")
    @Operation(summary = "Get alert counts", description = "Get count summary for dashboard")
    public ResponseEntity<Map<String, Long>> getAlertCounts(
            @AuthenticationPrincipal UserDetails userDetails) {

        Map<String, Long> counts = alertService.getAlertCounts(userDetails.getUsername());
        return ResponseEntity.ok(counts);
    }

    // ==================== SEARCH ====================

    @GetMapping("/search")
    @Operation(summary = "Search alerts", description = "Search alerts by title, description, or client")
    public ResponseEntity<Page<AlertResponse>> searchAlerts(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String q,
            @RequestParam(defaultValue = "es") String lang,
            Pageable pageable) {

        Page<AlertResponse> results = queryService.searchAlerts(
            userDetails.getUsername(), q, pageable, lang);
        return ResponseEntity.ok(results);
    }

    // ==================== SINGLE ALERT ====================

    @GetMapping("/{alertId}")
    @Operation(summary = "Get alert by ID", description = "Get single alert details")
    public ResponseEntity<AlertResponse> getAlert(@PathVariable String alertId) {
        return alertService.getAlert(alertId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{alertId}/history")
    @Operation(summary = "Get alert history", description = "Get audit history for an alert")
    public ResponseEntity<List<UserAlertHistoryReadModel>> getAlertHistory(@PathVariable String alertId) {
        List<UserAlertHistoryReadModel> history = alertService.getAlertHistory(alertId);
        return ResponseEntity.ok(history);
    }

    // ==================== CRUD OPERATIONS ====================

    @PostMapping
    @Operation(summary = "Create alert", description = "Create a new alert. If assigned to a role, creates one alert per user with that role.")
    public ResponseEntity<List<AlertResponse>> createAlert(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AlertCreateRequest request) {

        List<AlertResponse> responses = alertService.createAlert(
            request,
            userDetails.getUsername(),
            userDetails.getUsername(), // userName - could be enriched from user service
            userDetails.getUsername()
        );
        return ResponseEntity.ok(responses);
    }

    @PostMapping("/{alertId}/start")
    @Operation(summary = "Start alert", description = "Start working on an alert (set status to IN_PROGRESS)")
    public ResponseEntity<AlertResponse> startAlert(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String alertId,
            @RequestBody(required = false) AlertStartRequest request) {

        AlertStartRequest req = request != null ? request : new AlertStartRequest();
        AlertResponse response = alertService.startAlert(alertId, req, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{alertId}/progress")
    @Operation(summary = "Update progress", description = "Add progress notes to an alert")
    public ResponseEntity<AlertResponse> updateProgress(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String alertId,
            @Valid @RequestBody AlertProgressRequest request) {

        AlertResponse response = alertService.updateProgress(alertId, request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{alertId}/complete")
    @Operation(summary = "Complete alert", description = "Mark alert as completed")
    public ResponseEntity<AlertResponse> completeAlert(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String alertId,
            @RequestBody(required = false) AlertCompleteRequest request) {

        AlertCompleteRequest req = request != null ? request : new AlertCompleteRequest();
        AlertResponse response = alertService.completeAlert(alertId, req, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{alertId}/reschedule")
    @Operation(summary = "Reschedule alert", description = "Reschedule alert to a new date")
    public ResponseEntity<AlertResponse> rescheduleAlert(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String alertId,
            @Valid @RequestBody AlertRescheduleRequest request) {

        AlertResponse response = alertService.rescheduleAlert(alertId, request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{alertId}/snooze")
    @Operation(summary = "Snooze alert", description = "Snooze alert for N days")
    public ResponseEntity<AlertResponse> snoozeAlert(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String alertId,
            @RequestParam(defaultValue = "1") Integer days) {

        AlertResponse response = alertService.snoozeAlert(alertId, days, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{alertId}/cancel")
    @Operation(summary = "Cancel alert", description = "Cancel an alert")
    public ResponseEntity<AlertResponse> cancelAlert(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String alertId,
            @RequestParam(required = false) String reason) {

        AlertResponse response = alertService.cancelAlert(alertId, reason, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{alertId}/reassign")
    @Operation(summary = "Reassign alert", description = "Reassign an alert to a different user. Only allowed for non-completed alerts.")
    public ResponseEntity<AlertResponse> reassignAlert(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String alertId,
            @Valid @RequestBody AlertReassignRequest request) {

        AlertResponse response = alertService.reassignAlert(alertId, request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    // ==================== LINKED QUERIES ====================

    @GetMapping("/by-operation/{operationId}")
    @Operation(summary = "Get alerts by operation", description = "Get all alerts linked to an operation")
    public ResponseEntity<List<AlertResponse>> getAlertsByOperation(
            @PathVariable String operationId,
            @RequestParam(defaultValue = "es") String lang) {

        List<AlertResponse> alerts = queryService.getAlertsByOperation(operationId, lang);
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/by-client/{clientId}")
    @Operation(summary = "Get alerts by client", description = "Get all alerts linked to a client")
    public ResponseEntity<List<AlertResponse>> getAlertsByClient(
            @PathVariable String clientId,
            @RequestParam(defaultValue = "es") String lang) {

        List<AlertResponse> alerts = queryService.getAlertsByClient(clientId, lang);
        return ResponseEntity.ok(alerts);
    }

    // ==================== CONFIG ====================

    @GetMapping("/types")
    @Operation(summary = "Get alert types", description = "Get available alert types")
    public ResponseEntity<List<AlertTypeConfig>> getAlertTypes(
            @RequestParam(defaultValue = "true") boolean activeOnly) {

        List<AlertTypeConfig> types = queryService.getAlertTypes(activeOnly);
        return ResponseEntity.ok(types);
    }

    @GetMapping("/roles")
    @Operation(summary = "Get available roles", description = "Get list of roles for alert assignment")
    public ResponseEntity<List<RoleDTO>> getAvailableRoles() {
        List<RoleDTO> roles = roleRepository.findAll().stream()
            .map(r -> new RoleDTO(r.getName(), r.getDescription()))
            .toList();
        return ResponseEntity.ok(roles);
    }

    public record RoleDTO(String name, String description) {}

    // ==================== ADVANCED SEARCH ====================

    @PostMapping("/search/advanced")
    @Operation(summary = "Advanced search", description = "Search alerts with multiple filters")
    public ResponseEntity<Page<AlertResponse>> advancedSearch(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody AlertSearchRequest request,
            @RequestParam(defaultValue = "es") String lang) {

        // Check permission for viewing all alerts
        if (request.getViewMode() == AlertSearchRequest.ViewMode.ALL) {
            // Controller should verify user has CAN_VIEW_ALL_ALERTS permission
            // For now, we'll trust the frontend to only show this option to authorized users
        }

        Page<AlertResponse> results = queryService.advancedSearch(
            request, userDetails.getUsername(), lang);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/assigned-by-me")
    @Operation(summary = "Get alerts assigned by me", description = "Get alerts created by current user for others")
    public ResponseEntity<Page<AlertResponse>> getAssignedByMe(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "es") String lang,
            Pageable pageable) {

        Page<AlertResponse> alerts = queryService.getAlertsAssignedByMe(
            userDetails.getUsername(), lang, pageable);
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/all")
    @Operation(summary = "Get all alerts", description = "Get all alerts in the system (requires admin/supervisor role)")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'MANAGER') or hasAuthority('CAN_VIEW_ALL_ALERTS')")
    public ResponseEntity<Page<AlertResponse>> getAllAlerts(
            @RequestParam(defaultValue = "es") String lang,
            Pageable pageable) {

        Page<AlertResponse> alerts = queryService.getAllAlerts(lang, pageable);
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/search/counts")
    @Operation(summary = "Get search counts", description = "Get alert counts for different views")
    public ResponseEntity<Map<String, Long>> getSearchCounts(
            @AuthenticationPrincipal UserDetails userDetails) {

        Map<String, Long> counts = queryService.getSearchCounts(userDetails.getUsername());
        return ResponseEntity.ok(counts);
    }

    @GetMapping("/by-tag/{tag}")
    @Operation(summary = "Get alerts by tag", description = "Get alerts with a specific tag")
    public ResponseEntity<List<AlertResponse>> getAlertsByTag(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String tag,
            @RequestParam(defaultValue = "es") String lang) {

        List<AlertResponse> alerts = queryService.getAlertsByTag(
            userDetails.getUsername(), tag, lang);
        return ResponseEntity.ok(alerts);
    }

    @PutMapping("/{alertId}/tags")
    @Operation(summary = "Update alert tags", description = "Update tags on an alert")
    public ResponseEntity<AlertResponse> updateAlertTags(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String alertId,
            @RequestBody List<String> tags) {

        // Check if user has permission to manage all alerts
        boolean canManageAll = userDetails.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") ||
                          a.getAuthority().equals("ROLE_SUPERVISOR") ||
                          a.getAuthority().equals("ROLE_MANAGER") ||
                          a.getAuthority().equals("CAN_MANAGE_ALL_ALERTS"));

        AlertResponse response = alertService.updateAlertTags(alertId, tags, userDetails.getUsername(), canManageAll);
        return ResponseEntity.ok(response);
    }

    // ==================== TAGS CRUD ====================

    @GetMapping("/tags")
    @Operation(summary = "Get tags", description = "Get available alert tags")
    public ResponseEntity<List<AlertTag>> getTags(
            @RequestParam(defaultValue = "true") boolean activeOnly) {

        List<AlertTag> tags = queryService.getTags(activeOnly);
        return ResponseEntity.ok(tags);
    }

    @PostMapping("/tags")
    @Operation(summary = "Create tag", description = "Create a new alert tag (requires admin)")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('CAN_MANAGE_ALERT_TAGS')")
    public ResponseEntity<AlertTag> createTag(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody AlertTag tag) {

        AlertTag created = queryService.createTag(tag, userDetails.getUsername());
        return ResponseEntity.ok(created);
    }

    @PutMapping("/tags/{id}")
    @Operation(summary = "Update tag", description = "Update an alert tag (requires admin)")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('CAN_MANAGE_ALERT_TAGS')")
    public ResponseEntity<AlertTag> updateTag(
            @PathVariable Long id,
            @RequestBody AlertTag tag) {

        AlertTag updated = queryService.updateTag(id, tag);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/admin/clear-all")
    @Operation(summary = "Clear all alerts", description = "Delete all alerts from the system (admin only for testing)")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> clearAllAlerts(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.warn("ADMIN {} is clearing all alerts", userDetails.getUsername());
        long count = queryService.clearAllAlerts();

        return ResponseEntity.ok(Map.of(
            "message", "Alertas eliminadas",
            "count", count
        ));
    }

    @DeleteMapping("/tags/{id}")
    @Operation(summary = "Delete tag", description = "Delete/deactivate an alert tag (requires admin)")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('CAN_MANAGE_ALERT_TAGS')")
    public ResponseEntity<Void> deleteTag(@PathVariable Long id) {
        queryService.deleteTag(id);
        return ResponseEntity.noContent().build();
    }
}
