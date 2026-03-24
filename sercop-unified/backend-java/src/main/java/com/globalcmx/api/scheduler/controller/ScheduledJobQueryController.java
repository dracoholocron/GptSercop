package com.globalcmx.api.scheduler.controller;

import com.globalcmx.api.scheduler.dto.query.DeadLetterDTO;
import com.globalcmx.api.scheduler.dto.query.ExecutionLogDTO;
import com.globalcmx.api.scheduler.dto.query.JobStatisticsDTO;
import com.globalcmx.api.scheduler.dto.query.ScheduledJobDTO;
import com.globalcmx.api.scheduler.entity.ScheduledJobConfigReadModel.JobType;
import com.globalcmx.api.scheduler.service.JobMonitoringService;
import com.globalcmx.api.scheduler.service.ScheduledJobConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/v1/admin/scheduled-jobs/queries")
@RequiredArgsConstructor
public class ScheduledJobQueryController {

    private final ScheduledJobConfigService configService;
    private final JobMonitoringService monitoringService;

    /**
     * List all scheduled jobs with pagination and filtering
     */
    @GetMapping
    @PreAuthorize("hasAuthority('CAN_VIEW_SCHEDULED_JOBS')")
    public ResponseEntity<Map<String, Object>> listJobs(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) JobType jobType,
            @RequestParam(required = false) Boolean enabled,
            @PageableDefault(size = 20, sort = "code") Pageable pageable
    ) {
        log.debug("Listing scheduled jobs: search={}, jobType={}, enabled={}", search, jobType, enabled);

        Page<ScheduledJobDTO> page = configService.search(search, jobType, enabled, pageable);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", page.getContent(),
                "totalElements", page.getTotalElements(),
                "totalPages", page.getTotalPages(),
                "currentPage", page.getNumber(),
                "pageSize", page.getSize()
        ));
    }

    /**
     * Get a specific job by code
     */
    @GetMapping("/{code}")
    @PreAuthorize("hasAuthority('CAN_VIEW_SCHEDULED_JOBS')")
    public ResponseEntity<Map<String, Object>> getJob(@PathVariable String code) {
        log.debug("Getting scheduled job: {}", code);

        ScheduledJobDTO job = configService.getByCode(code);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", job
        ));
    }

    /**
     * Get execution history for a specific job
     */
    @GetMapping("/{code}/executions")
    @PreAuthorize("hasAuthority('CAN_VIEW_SCHEDULED_JOBS')")
    public ResponseEntity<Map<String, Object>> getJobExecutions(
            @PathVariable String code,
            @PageableDefault(size = 20, sort = "startedAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable
    ) {
        log.debug("Getting executions for job: {}", code);

        Page<ExecutionLogDTO> page = configService.getExecutions(code, pageable);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", page.getContent(),
                "totalElements", page.getTotalElements(),
                "totalPages", page.getTotalPages(),
                "currentPage", page.getNumber(),
                "pageSize", page.getSize()
        ));
    }

    /**
     * Get statistics for a specific job
     */
    @GetMapping("/{code}/statistics")
    @PreAuthorize("hasAuthority('CAN_VIEW_SCHEDULED_JOBS')")
    public ResponseEntity<Map<String, Object>> getJobStatistics(@PathVariable String code) {
        log.debug("Getting statistics for job: {}", code);

        Map<String, Object> stats = monitoringService.getJobStatistics(code);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", stats
        ));
    }

    /**
     * Get overall job statistics
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasAuthority('CAN_VIEW_SCHEDULED_JOBS')")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        log.debug("Getting overall job statistics");

        JobStatisticsDTO stats = monitoringService.getStatistics();

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", stats
        ));
    }

    /**
     * Get currently running jobs
     */
    @GetMapping("/running")
    @PreAuthorize("hasAuthority('CAN_VIEW_SCHEDULED_JOBS')")
    public ResponseEntity<Map<String, Object>> getRunningJobs() {
        log.debug("Getting running jobs");

        List<ScheduledJobDTO> runningJobs = configService.findRunning();
        List<ExecutionLogDTO> runningExecutions = configService.getRunningExecutions();

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                        "jobs", runningJobs,
                        "executions", runningExecutions
                )
        ));
    }

    /**
     * Get dead letter queue
     */
    @GetMapping("/dead-letter")
    @PreAuthorize("hasAuthority('CAN_VIEW_SCHEDULED_JOBS')")
    public ResponseEntity<Map<String, Object>> getDeadLetterQueue(
            @PageableDefault(size = 20, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable
    ) {
        log.debug("Getting dead letter queue");

        Page<DeadLetterDTO> page = configService.getPendingDeadLetters(pageable);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", page.getContent(),
                "totalElements", page.getTotalElements(),
                "totalPages", page.getTotalPages(),
                "currentPage", page.getNumber(),
                "pageSize", page.getSize()
        ));
    }

    /**
     * Get a specific dead letter entry
     */
    @GetMapping("/dead-letter/{id}")
    @PreAuthorize("hasAuthority('CAN_VIEW_SCHEDULED_JOBS')")
    public ResponseEntity<Map<String, Object>> getDeadLetter(@PathVariable Long id) {
        log.debug("Getting dead letter: {}", id);

        DeadLetterDTO deadLetter = configService.getDeadLetter(id)
                .orElseThrow(() -> new IllegalArgumentException("Dead letter not found: " + id));

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", deadLetter
        ));
    }

    /**
     * Get execution by ID
     */
    @GetMapping("/executions/{executionId}")
    @PreAuthorize("hasAuthority('CAN_VIEW_SCHEDULED_JOBS')")
    public ResponseEntity<Map<String, Object>> getExecution(@PathVariable String executionId) {
        log.debug("Getting execution: {}", executionId);

        ExecutionLogDTO execution = configService.getExecution(executionId)
                .orElseThrow(() -> new IllegalArgumentException("Execution not found: " + executionId));

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", execution
        ));
    }

    /**
     * Get all executions with pagination and filters
     */
    @GetMapping("/executions")
    @PreAuthorize("hasAuthority('CAN_VIEW_SCHEDULED_JOBS')")
    public ResponseEntity<Map<String, Object>> getAllExecutions(
            @RequestParam(required = false) String jobCode,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime from,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime to,
            @PageableDefault(size = 50, sort = "startedAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable
    ) {
        log.debug("Getting executions: jobCode={}, status={}, from={}, to={}", jobCode, status, from, to);

        // Convert status string to enum if provided
        com.globalcmx.api.scheduler.entity.ScheduledJobExecutionLog.Status statusEnum = null;
        if (status != null && !status.isEmpty()) {
            try {
                statusEnum = com.globalcmx.api.scheduler.entity.ScheduledJobExecutionLog.Status.valueOf(status);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid status value: {}", status);
            }
        }

        Page<ExecutionLogDTO> page = configService.searchExecutions(
                jobCode != null && !jobCode.isEmpty() ? jobCode : null,
                statusEnum,
                from,
                to,
                pageable
        );

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", page.getContent(),
                "totalElements", page.getTotalElements(),
                "totalPages", page.getTotalPages(),
                "currentPage", page.getNumber(),
                "pageSize", page.getSize()
        ));
    }
}
