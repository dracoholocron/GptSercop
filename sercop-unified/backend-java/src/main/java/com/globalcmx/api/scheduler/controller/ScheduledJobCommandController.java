package com.globalcmx.api.scheduler.controller;

import com.globalcmx.api.scheduler.dto.command.*;
import com.globalcmx.api.scheduler.dto.query.DeadLetterDTO;
import com.globalcmx.api.scheduler.dto.query.JobExecutionResultDTO;
import com.globalcmx.api.scheduler.dto.query.ScheduledJobDTO;
import com.globalcmx.api.scheduler.service.ScheduledJobConfigService;
import com.globalcmx.api.scheduler.service.ScheduledJobExecutorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/v1/admin/scheduled-jobs/commands")
@RequiredArgsConstructor
public class ScheduledJobCommandController {

    private final ScheduledJobConfigService configService;
    private final ScheduledJobExecutorService executorService;

    /**
     * Create a new scheduled job
     */
    @PostMapping
    @PreAuthorize("hasAuthority('CAN_MANAGE_SCHEDULED_JOBS')")
    public ResponseEntity<Map<String, Object>> createJob(
            @Valid @RequestBody CreateScheduledJobCommand command,
            Authentication authentication
    ) {
        log.info("Creating scheduled job: {} by {}", command.getCode(), authentication.getName());

        command.setCreatedBy(authentication.getName());
        ScheduledJobDTO job = configService.create(command);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "message", "Scheduled job created successfully",
                "data", job
        ));
    }

    /**
     * Update an existing scheduled job
     */
    @PutMapping("/{code}")
    @PreAuthorize("hasAuthority('CAN_MANAGE_SCHEDULED_JOBS')")
    public ResponseEntity<Map<String, Object>> updateJob(
            @PathVariable String code,
            @Valid @RequestBody UpdateScheduledJobCommand command,
            Authentication authentication
    ) {
        log.info("Updating scheduled job: {} by {}", code, authentication.getName());

        command.setUpdatedBy(authentication.getName());
        ScheduledJobDTO job = configService.update(code, command);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Scheduled job updated successfully",
                "data", job
        ));
    }

    /**
     * Delete a scheduled job
     */
    @DeleteMapping("/{code}")
    @PreAuthorize("hasAuthority('CAN_MANAGE_SCHEDULED_JOBS')")
    public ResponseEntity<Map<String, Object>> deleteJob(
            @PathVariable String code,
            Authentication authentication
    ) {
        log.info("Deleting scheduled job: {} by {}", code, authentication.getName());

        configService.delete(code, authentication.getName());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Scheduled job deleted successfully"
        ));
    }

    /**
     * Toggle job enabled/disabled status
     */
    @PostMapping("/{code}/toggle")
    @PreAuthorize("hasAuthority('CAN_MANAGE_SCHEDULED_JOBS')")
    public ResponseEntity<Map<String, Object>> toggleJob(
            @PathVariable String code,
            Authentication authentication
    ) {
        log.info("Toggling scheduled job: {} by {}", code, authentication.getName());

        ScheduledJobDTO job = configService.toggle(code, authentication.getName());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", String.format("Scheduled job %s", job.getIsEnabled() ? "enabled" : "disabled"),
                "data", job
        ));
    }

    /**
     * Manually trigger a job execution
     */
    @PostMapping("/{code}/trigger")
    @PreAuthorize("hasAuthority('CAN_EXECUTE_SCHEDULED_JOBS')")
    public ResponseEntity<Map<String, Object>> triggerJob(
            @PathVariable String code,
            @RequestBody(required = false) TriggerJobCommand command,
            Authentication authentication
    ) {
        log.info("Triggering scheduled job: {} by {}", code, authentication.getName());

        if (command == null) {
            command = new TriggerJobCommand();
        }

        boolean async = command.getAsync() != null && command.getAsync();
        JobExecutionResultDTO result = executorService.triggerManually(
                code,
                authentication.getName(),
                command.getOverrideParameters(),
                async
        );

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", async ? "Job triggered asynchronously" : "Job execution completed",
                "data", result
        ));
    }

    /**
     * Retry a dead letter entry
     */
    @PostMapping("/dead-letter/{id}/retry")
    @PreAuthorize("hasAuthority('CAN_MANAGE_JOB_DEAD_LETTER')")
    public ResponseEntity<Map<String, Object>> retryDeadLetter(
            @PathVariable Long id,
            @RequestBody(required = false) RetryDeadLetterCommand command,
            Authentication authentication
    ) {
        log.info("Retrying dead letter: {} by {}", id, authentication.getName());

        DeadLetterDTO deadLetter = configService.retryDeadLetter(id, authentication.getName());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Dead letter retry initiated",
                "data", deadLetter
        ));
    }

    /**
     * Abandon a dead letter entry
     */
    @PostMapping("/dead-letter/{id}/abandon")
    @PreAuthorize("hasAuthority('CAN_MANAGE_JOB_DEAD_LETTER')")
    public ResponseEntity<Map<String, Object>> abandonDeadLetter(
            @PathVariable Long id,
            @Valid @RequestBody AbandonDeadLetterCommand command,
            Authentication authentication
    ) {
        log.info("Abandoning dead letter: {} by {}", id, authentication.getName());

        command.setAbandonedBy(authentication.getName());
        DeadLetterDTO deadLetter = configService.abandonDeadLetter(
                id,
                command.getAbandonedBy(),
                command.getNotes()
        );

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Dead letter abandoned",
                "data", deadLetter
        ));
    }

    /**
     * Exception handler for IllegalArgumentException
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException e) {
        log.warn("Bad request: {}", e.getMessage());
        return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
        ));
    }

    /**
     * Exception handler for IllegalStateException
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException e) {
        log.warn("Illegal state: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "success", false,
                "message", e.getMessage()
        ));
    }
}
