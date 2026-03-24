package com.globalcmx.api.scheduler.service;

import com.globalcmx.api.scheduler.entity.ScheduledJobConfigReadModel;
import com.globalcmx.api.scheduler.entity.ScheduledJobExecutionLog;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobAlertService {

    // TODO: Inject EmailService when available
    // private final EmailService emailService;

    private static final DateTimeFormatter DATETIME_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public void sendFailureAlert(ScheduledJobConfigReadModel config, ScheduledJobExecutionLog executionLog, Exception e) {
        log.info("Sending failure alert for job: {}", config.getCode());

        List<String> recipients = getRecipients(config);
        if (recipients.isEmpty()) {
            log.debug("No alert recipients configured for job: {}", config.getCode());
            return;
        }

        String subject = String.format("[ALERT] Scheduled Job Failed: %s", config.getName());

        StringBuilder body = new StringBuilder();
        body.append("A scheduled job has failed and requires attention.\n\n");
        body.append("Job Details:\n");
        body.append(String.format("  - Code: %s\n", config.getCode()));
        body.append(String.format("  - Name: %s\n", config.getName()));
        body.append(String.format("  - Execution ID: %s\n", executionLog.getExecutionId()));
        body.append(String.format("  - Started At: %s\n", formatDateTime(executionLog.getStartedAt())));
        body.append(String.format("  - Completed At: %s\n", formatDateTime(executionLog.getCompletedAt())));
        body.append(String.format("  - Duration: %s ms\n", executionLog.getDurationMs()));
        body.append("\n");
        body.append("Error Information:\n");
        body.append(String.format("  - Error: %s\n", e.getMessage()));
        body.append(String.format("  - Error Type: %s\n", e.getClass().getSimpleName()));
        body.append("\n");
        body.append("Job Statistics:\n");
        body.append(String.format("  - Consecutive Failures: %d\n", config.getConsecutiveFailures()));
        body.append(String.format("  - Total Failures: %d\n", config.getTotalFailures()));
        body.append(String.format("  - Max Retries: %d\n", config.getMaxRetries()));
        body.append("\n");

        if (config.getConsecutiveFailures() != null && config.getMaxRetries() != null &&
            config.getConsecutiveFailures() >= config.getMaxRetries()) {
            body.append("*** This job has been added to the Dead Letter Queue ***\n");
            body.append("Please review and take action in the admin console.\n");
        }

        sendEmail(recipients, subject, body.toString());
    }

    public void sendTimeoutAlert(ScheduledJobConfigReadModel config, ScheduledJobExecutionLog executionLog) {
        log.info("Sending timeout alert for job: {}", config.getCode());

        List<String> recipients = getRecipients(config);
        if (recipients.isEmpty()) {
            log.debug("No alert recipients configured for job: {}", config.getCode());
            return;
        }

        String subject = String.format("[ALERT] Scheduled Job Timeout: %s", config.getName());

        StringBuilder body = new StringBuilder();
        body.append("A scheduled job has timed out and requires attention.\n\n");
        body.append("Job Details:\n");
        body.append(String.format("  - Code: %s\n", config.getCode()));
        body.append(String.format("  - Name: %s\n", config.getName()));
        body.append(String.format("  - Execution ID: %s\n", executionLog.getExecutionId()));
        body.append(String.format("  - Started At: %s\n", formatDateTime(executionLog.getStartedAt())));
        body.append(String.format("  - Timeout After: %d seconds\n", config.getTimeoutSeconds()));
        body.append("\n");
        body.append("The job execution was terminated because it exceeded the configured timeout.\n");
        body.append("Please review the job configuration and implementation.\n");

        sendEmail(recipients, subject, body.toString());
    }

    public void sendCircuitOpenAlert(ScheduledJobConfigReadModel config) {
        log.info("Sending circuit open alert for job: {}", config.getCode());

        List<String> recipients = getRecipients(config);
        if (recipients.isEmpty()) {
            log.debug("No alert recipients configured for job: {}", config.getCode());
            return;
        }

        String subject = String.format("[ALERT] Circuit Breaker Open: %s", config.getName());

        StringBuilder body = new StringBuilder();
        body.append("The circuit breaker has been triggered for a scheduled job.\n\n");
        body.append("Job Details:\n");
        body.append(String.format("  - Code: %s\n", config.getCode()));
        body.append(String.format("  - Name: %s\n", config.getName()));
        body.append(String.format("  - Consecutive Failures: %d\n", config.getConsecutiveFailures()));
        body.append(String.format("  - Circuit Breaker Threshold: %d\n", config.getCircuitBreakerThreshold()));
        body.append(String.format("  - Reset Timeout: %d seconds\n", config.getCircuitBreakerResetTimeoutSeconds()));
        body.append("\n");
        body.append("The job will not execute until the circuit resets or is manually closed.\n");
        body.append("Please investigate the root cause of the failures.\n");

        sendEmail(recipients, subject, body.toString());
    }

    public void sendDeadLetterAlert(ScheduledJobConfigReadModel config, int deadLetterCount) {
        log.info("Sending dead letter alert for job: {}", config.getCode());

        List<String> recipients = getRecipients(config);
        if (recipients.isEmpty()) {
            log.debug("No alert recipients configured for job: {}", config.getCode());
            return;
        }

        String subject = String.format("[ALERT] Dead Letter Queue: %s", config.getName());

        StringBuilder body = new StringBuilder();
        body.append("Jobs have been added to the Dead Letter Queue.\n\n");
        body.append("Job Details:\n");
        body.append(String.format("  - Code: %s\n", config.getCode()));
        body.append(String.format("  - Name: %s\n", config.getName()));
        body.append(String.format("  - Pending Dead Letters: %d\n", deadLetterCount));
        body.append("\n");
        body.append("Please review the Dead Letter Queue in the admin console and take appropriate action.\n");
        body.append("Options include: Retry, Abandon, or Investigate the root cause.\n");

        sendEmail(recipients, subject, body.toString());
    }

    private List<String> getRecipients(ScheduledJobConfigReadModel config) {
        if (config.getAlertEmailRecipients() == null || config.getAlertEmailRecipients().isBlank()) {
            return List.of();
        }
        return Arrays.asList(config.getAlertEmailRecipients().split("[,;\\s]+"));
    }

    private void sendEmail(List<String> recipients, String subject, String body) {
        // TODO: Integrate with EmailService
        // For now, just log the alert
        log.warn("ALERT EMAIL (recipients: {}): {}", recipients, subject);
        log.debug("Alert body:\n{}", body);

        // Example integration:
        // emailService.queueEmail(SendEmailRequest.builder()
        //         .to(recipients)
        //         .subject(subject)
        //         .bodyText(body)
        //         .build(), "system");
    }

    private String formatDateTime(LocalDateTime dateTime) {
        return dateTime != null ? dateTime.format(DATETIME_FORMAT) : "N/A";
    }
}
