package com.globalcmx.api.alerts.service;

import com.globalcmx.api.alerts.dto.AgendaResponse;
import com.globalcmx.api.alerts.dto.AlertResponse;
import com.globalcmx.api.alerts.dto.AlertSearchRequest;
import com.globalcmx.api.alerts.entity.AlertTag;
import com.globalcmx.api.alerts.entity.AlertTypeConfig;
import com.globalcmx.api.alerts.entity.UserAlertReadModel;
import com.globalcmx.api.alerts.entity.UserAlertReadModel.AlertPriority;
import com.globalcmx.api.alerts.entity.UserAlertReadModel.AlertStatus;
import com.globalcmx.api.alerts.repository.AlertTagRepository;
import com.globalcmx.api.alerts.repository.AlertTypeConfigRepository;
import com.globalcmx.api.alerts.repository.UserAlertRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Query service for agenda views and alert queries.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserAlertQueryService {

    private final UserAlertRepository alertRepository;
    private final AlertTypeConfigRepository typeConfigRepository;
    private final AlertTagRepository tagRepository;

    /**
     * Get agenda view for a specific date range.
     *
     * @param userId User ID
     * @param date Reference date
     * @param viewType DAY, WEEK, or MONTH
     * @param language es or en
     */
    public AgendaResponse getAgenda(String userId, LocalDate date, String viewType, String language) {
        LocalDate startDate;
        LocalDate endDate;

        switch (viewType.toUpperCase()) {
            case "DAY":
                startDate = date;
                endDate = date;
                break;
            case "WEEK":
                startDate = date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                endDate = startDate.plusDays(6);
                break;
            case "MONTH":
            default:
                startDate = date.withDayOfMonth(1);
                endDate = date.with(TemporalAdjusters.lastDayOfMonth());
                break;
        }

        List<UserAlertReadModel> alerts = alertRepository.findByUserIdAndDateRange(userId, startDate, endDate);

        // Group alerts by date
        Map<LocalDate, List<AlertResponse>> alertsByDate = new LinkedHashMap<>();

        // Initialize all dates in range
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            alertsByDate.put(current, new ArrayList<>());
            current = current.plusDays(1);
        }

        // Fill in alerts
        Map<String, AlertTypeConfig> typeConfigs = typeConfigRepository.findByIsActiveTrueOrderByDisplayOrderAsc()
            .stream()
            .collect(Collectors.toMap(AlertTypeConfig::getTypeCode, c -> c));

        for (UserAlertReadModel alert : alerts) {
            AlertResponse response = AlertResponse.fromEntity(alert);
            AlertTypeConfig config = typeConfigs.get(alert.getAlertType().name());
            if (config != null) {
                response.setAlertTypeLabel(config.getLabel(language));
                response.setAlertTypeIcon(config.getIcon());
                response.setAlertTypeColor(config.getColor());
            }
            alertsByDate.get(alert.getScheduledDate()).add(response);
        }

        // Calculate summary
        AgendaResponse.AgendaSummary summary = calculateSummary(alerts, userId);

        return AgendaResponse.builder()
            .startDate(startDate)
            .endDate(endDate)
            .viewType(viewType.toUpperCase())
            .alertsByDate(alertsByDate)
            .summary(summary)
            .build();
    }

    /**
     * Get calendar view with alert counts per day.
     */
    public Map<LocalDate, Long> getCalendarCounts(String userId, LocalDate startDate, LocalDate endDate) {
        List<Object[]> counts = alertRepository.countAlertsByDate(userId, startDate, endDate);

        Map<LocalDate, Long> result = new LinkedHashMap<>();

        // Initialize all dates
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            result.put(current, 0L);
            current = current.plusDays(1);
        }

        // Fill in counts
        for (Object[] row : counts) {
            LocalDate date = (LocalDate) row[0];
            Long count = (Long) row[1];
            result.put(date, count);
        }

        return result;
    }

    /**
     * Search alerts.
     */
    public Page<AlertResponse> searchAlerts(String userId, String searchTerm, Pageable pageable, String language) {
        Page<UserAlertReadModel> alerts = alertRepository.searchAlerts(userId, searchTerm, pageable);

        Map<String, AlertTypeConfig> typeConfigs = typeConfigRepository.findByIsActiveTrueOrderByDisplayOrderAsc()
            .stream()
            .collect(Collectors.toMap(AlertTypeConfig::getTypeCode, c -> c));

        return alerts.map(alert -> {
            AlertResponse response = AlertResponse.fromEntity(alert);
            AlertTypeConfig config = typeConfigs.get(alert.getAlertType().name());
            if (config != null) {
                response.setAlertTypeLabel(config.getLabel(language));
                response.setAlertTypeIcon(config.getIcon());
                response.setAlertTypeColor(config.getColor());
            }
            return response;
        });
    }

    /**
     * Get alerts by operation.
     */
    public List<AlertResponse> getAlertsByOperation(String operationId, String language) {
        List<UserAlertReadModel> alerts = alertRepository.findByOperationIdOrderByScheduledDateAsc(operationId);
        return enrichAlerts(alerts, language);
    }

    /**
     * Get alerts by client.
     */
    public List<AlertResponse> getAlertsByClient(String clientId, String language) {
        List<UserAlertReadModel> alerts = alertRepository.findByClientIdOrderByScheduledDateAsc(clientId);
        return enrichAlerts(alerts, language);
    }

    /**
     * Get all available alert types.
     */
    public List<AlertTypeConfig> getAlertTypes(boolean activeOnly) {
        if (activeOnly) {
            return typeConfigRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
        }
        return typeConfigRepository.findAllByOrderByDisplayOrderAsc();
    }

    /**
     * Calculate summary statistics.
     */
    private AgendaResponse.AgendaSummary calculateSummary(List<UserAlertReadModel> alerts, String userId) {
        LocalDate today = LocalDate.now();

        long totalAlerts = alerts.size();
        long pendingAlerts = alerts.stream()
            .filter(a -> a.getStatus() == AlertStatus.PENDING || a.getStatus() == AlertStatus.IN_PROGRESS)
            .count();
        long completedAlerts = alerts.stream()
            .filter(a -> a.getStatus() == AlertStatus.COMPLETED)
            .count();
        long overdueAlerts = alertRepository.countOverdueAlerts(userId, today);
        long todayAlerts = alerts.stream()
            .filter(a -> a.getScheduledDate().equals(today))
            .count();

        long urgentAlerts = alerts.stream()
            .filter(a -> a.getPriority() == AlertPriority.URGENT && a.getStatus() != AlertStatus.COMPLETED)
            .count();
        long highPriorityAlerts = alerts.stream()
            .filter(a -> a.getPriority() == AlertPriority.HIGH && a.getStatus() != AlertStatus.COMPLETED)
            .count();

        Map<String, Long> alertsByType = alerts.stream()
            .filter(a -> a.getStatus() != AlertStatus.CANCELLED)
            .collect(Collectors.groupingBy(
                a -> a.getAlertType().name(),
                Collectors.counting()
            ));

        return AgendaResponse.AgendaSummary.builder()
            .totalAlerts(totalAlerts)
            .pendingAlerts(pendingAlerts)
            .completedAlerts(completedAlerts)
            .overdueAlerts(overdueAlerts)
            .todayAlerts(todayAlerts)
            .urgentAlerts(urgentAlerts)
            .highPriorityAlerts(highPriorityAlerts)
            .alertsByType(alertsByType)
            .build();
    }

    /**
     * Enrich alerts with type config.
     */
    private List<AlertResponse> enrichAlerts(List<UserAlertReadModel> alerts, String language) {
        Map<String, AlertTypeConfig> typeConfigs = typeConfigRepository.findByIsActiveTrueOrderByDisplayOrderAsc()
            .stream()
            .collect(Collectors.toMap(AlertTypeConfig::getTypeCode, c -> c));

        return alerts.stream()
            .map(alert -> {
                AlertResponse response = AlertResponse.fromEntity(alert);
                AlertTypeConfig config = typeConfigs.get(alert.getAlertType().name());
                if (config != null) {
                    response.setAlertTypeLabel(config.getLabel(language));
                    response.setAlertTypeIcon(config.getIcon());
                    response.setAlertTypeColor(config.getColor());
                }
                return response;
            })
            .collect(Collectors.toList());
    }

    // ==================== ADVANCED SEARCH ====================

    /**
     * Advanced search with filters.
     * Supports filtering by view mode (assigned to me, assigned by me, all),
     * status, type, priority, tags, date range, etc.
     */
    public Page<AlertResponse> advancedSearch(AlertSearchRequest request, String currentUserId, String language) {
        Pageable pageable = PageRequest.of(
            request.getPage(),
            request.getSize(),
            Sort.by(Sort.Direction.fromString(request.getSortDirection()), request.getSortBy())
        );

        // Determine user/assignedBy filters based on view mode
        String userIdFilter = null;
        String assignedByFilter = null;

        switch (request.getViewMode()) {
            case ASSIGNED_TO_ME:
                userIdFilter = currentUserId;
                break;
            case ASSIGNED_BY_ME:
                assignedByFilter = currentUserId;
                break;
            case ALL:
                // If userId is specified in request, filter by that user
                // Otherwise show all (requires permission check in controller)
                if (request.getUserId() != null && !request.getUserId().isEmpty()) {
                    userIdFilter = request.getUserId();
                }
                break;
        }

        // Apply quick filter adjustments
        LocalDate startDate = request.getStartDate();
        LocalDate endDate = request.getEndDate();
        AlertStatus statusFilter = request.getStatus();
        LocalDate today = LocalDate.now();

        if (request.getQuickFilter() != null) {
            switch (request.getQuickFilter()) {
                case OVERDUE:
                    // Show alerts before today that are not completed
                    endDate = today.minusDays(1);
                    statusFilter = null; // Will filter in query for NOT completed
                    break;
                case TODAY:
                    startDate = today;
                    endDate = today;
                    // Show pending/in_progress only
                    break;
                case COMPLETED_TODAY:
                    startDate = today;
                    endDate = today;
                    statusFilter = AlertStatus.COMPLETED;
                    break;
            }
        }

        boolean excludeCompleted = request.isHideCompleted();
        Page<UserAlertReadModel> alerts;

        // If search text is provided, use text search
        if (request.getSearchText() != null && !request.getSearchText().isEmpty()) {
            alerts = alertRepository.searchWithText(
                userIdFilter,
                assignedByFilter,
                request.getSearchText(),
                excludeCompleted,
                pageable
            );
        } else {
            // Use filter-based search
            alerts = alertRepository.findWithFilters(
                userIdFilter,
                assignedByFilter,
                statusFilter,
                request.getAlertType(),
                request.getPriority(),
                startDate,
                endDate,
                request.getClientId(),
                request.getOperationId(),
                excludeCompleted,
                pageable
            );
        }

        // Additional filtering for OVERDUE quick filter (exclude completed/cancelled)
        if (request.getQuickFilter() == AlertSearchRequest.QuickFilter.OVERDUE) {
            List<AlertResponse> filtered = enrichAlertsPage(alerts, language).getContent().stream()
                .filter(a -> !"COMPLETED".equals(a.getStatus()) && !"CANCELLED".equals(a.getStatus()))
                .collect(Collectors.toList());
            return new org.springframework.data.domain.PageImpl<>(filtered, pageable, filtered.size());
        }

        // Additional filtering for TODAY quick filter (pending/in_progress only)
        if (request.getQuickFilter() == AlertSearchRequest.QuickFilter.TODAY) {
            List<AlertResponse> filtered = enrichAlertsPage(alerts, language).getContent().stream()
                .filter(a -> "PENDING".equals(a.getStatus()) || "IN_PROGRESS".equals(a.getStatus()))
                .collect(Collectors.toList());
            return new org.springframework.data.domain.PageImpl<>(filtered, pageable, filtered.size());
        }

        // If tags filter is specified, do in-memory filtering (for simplicity with JSON column)
        Page<AlertResponse> result = enrichAlertsPage(alerts, language);

        List<AlertResponse> filteredList = result.getContent();
        boolean needsTagsFiltering = false;

        // Apply tags filter
        if (request.getTags() != null && !request.getTags().isEmpty()) {
            needsTagsFiltering = true;
            List<String> tagsFilter = request.getTags();
            filteredList = filteredList.stream()
                .filter(alert -> alert.getTags() != null && alert.getTags().containsAll(tagsFilter))
                .collect(Collectors.toList());
        }

        if (needsTagsFiltering) {
            return new org.springframework.data.domain.PageImpl<>(
                filteredList,
                pageable,
                filteredList.size()
            );
        }

        return result;
    }

    /**
     * Get alerts assigned by a user (alerts they created for others).
     */
    public Page<AlertResponse> getAlertsAssignedByMe(String userId, String language, Pageable pageable) {
        Page<UserAlertReadModel> alerts = alertRepository.findAssignedByUserPaged(userId, pageable);
        return enrichAlertsPage(alerts, language);
    }

    /**
     * Get all alerts (for supervisors/admins).
     */
    public Page<AlertResponse> getAllAlerts(String language, Pageable pageable) {
        Page<UserAlertReadModel> alerts = alertRepository.findAllAlertsPaged(pageable);
        return enrichAlertsPage(alerts, language);
    }

    /**
     * Get alerts by tag.
     */
    public List<AlertResponse> getAlertsByTag(String userId, String tag, String language) {
        List<UserAlertReadModel> alerts = alertRepository.findByUserIdAndTag(userId, tag);
        return enrichAlerts(alerts, language);
    }

    /**
     * Clear all alerts (admin function for testing).
     */
    @org.springframework.transaction.annotation.Transactional
    public long clearAllAlerts() {
        long count = alertRepository.count();
        alertRepository.deleteAll();
        return count;
    }

    /**
     * Get all available tags.
     */
    public List<AlertTag> getTags(boolean activeOnly) {
        if (activeOnly) {
            return tagRepository.findByActiveTrueOrderByDisplayOrderAsc();
        }
        return tagRepository.findAllByOrderByDisplayOrderAsc();
    }

    /**
     * Create a new tag.
     */
    public AlertTag createTag(AlertTag tag, String createdBy) {
        if (tagRepository.existsByName(tag.getName())) {
            throw new IllegalArgumentException("Ya existe una etiqueta con el nombre: " + tag.getName());
        }
        tag.setCreatedBy(createdBy);
        return tagRepository.save(tag);
    }

    /**
     * Update a tag.
     */
    public AlertTag updateTag(Long id, AlertTag updatedTag) {
        AlertTag existing = tagRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Etiqueta no encontrada: " + id));

        // Check if name is being changed to an existing one
        if (!existing.getName().equals(updatedTag.getName()) && tagRepository.existsByName(updatedTag.getName())) {
            throw new IllegalArgumentException("Ya existe una etiqueta con el nombre: " + updatedTag.getName());
        }

        existing.setName(updatedTag.getName());
        existing.setColor(updatedTag.getColor());
        existing.setDescription(updatedTag.getDescription());
        existing.setIcon(updatedTag.getIcon());
        existing.setDisplayOrder(updatedTag.getDisplayOrder());

        return tagRepository.save(existing);
    }

    /**
     * Delete/deactivate a tag.
     */
    public void deleteTag(Long id) {
        AlertTag tag = tagRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Etiqueta no encontrada: " + id));
        tag.setActive(false);
        tagRepository.save(tag);
    }

    /**
     * Get search counts/statistics for dashboard.
     */
    public Map<String, Long> getSearchCounts(String userId) {
        LocalDate today = LocalDate.now();
        Map<String, Long> counts = new HashMap<>();

        counts.put("assignedToMe", alertRepository.countPendingAlerts(userId));
        counts.put("assignedByMe", alertRepository.countAssignedByUser(userId));
        counts.put("overdue", alertRepository.countOverdueAlerts(userId, today));

        return counts;
    }

    /**
     * Enrich a page of alerts with type config.
     */
    private Page<AlertResponse> enrichAlertsPage(Page<UserAlertReadModel> alerts, String language) {
        Map<String, AlertTypeConfig> typeConfigs = typeConfigRepository.findByIsActiveTrueOrderByDisplayOrderAsc()
            .stream()
            .collect(Collectors.toMap(AlertTypeConfig::getTypeCode, c -> c));

        return alerts.map(alert -> {
            AlertResponse response = AlertResponse.fromEntity(alert);
            AlertTypeConfig config = typeConfigs.get(alert.getAlertType().name());
            if (config != null) {
                response.setAlertTypeLabel(config.getLabel(language));
                response.setAlertTypeIcon(config.getIcon());
                response.setAlertTypeColor(config.getColor());
            }
            return response;
        });
    }
}
