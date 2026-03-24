package com.globalcmx.api.email.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.email.dto.EmailQueueDTO;
import com.globalcmx.api.email.dto.EmailStatsDTO;
import com.globalcmx.api.email.dto.SendEmailRequest;
import com.globalcmx.api.email.entity.EmailLog;
import com.globalcmx.api.email.entity.EmailQueue;
import com.globalcmx.api.email.repository.EmailLogRepository;
import com.globalcmx.api.email.repository.EmailQueueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final EmailQueueRepository queueRepository;
    private final EmailLogRepository logRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public EmailQueue queueEmail(SendEmailRequest request, String createdBy) {
        try {
            EmailQueue email = EmailQueue.builder()
                    .toAddresses(request.getTo() != null ? objectMapper.writeValueAsString(request.getTo()) : null)
                    .ccAddresses(request.getCc() != null ? objectMapper.writeValueAsString(request.getCc()) : null)
                    .bccAddresses(request.getBcc() != null ? objectMapper.writeValueAsString(request.getBcc()) : null)
                    .subject(request.getSubject()).bodyHtml(request.getBodyHtml()).bodyText(request.getBodyText())
                    .templateCode(request.getTemplateCode())
                    .templateVariables(request.getTemplateVariables() != null ? objectMapper.writeValueAsString(request.getTemplateVariables()) : null)
                    .priority(request.getPriority() != null ? EmailQueue.Priority.valueOf(request.getPriority()) : EmailQueue.Priority.NORMAL)
                    .referenceType(request.getReferenceType()).referenceId(request.getReferenceId())
                    .scheduledAt(request.getScheduledAt()).createdBy(createdBy).build();

            email = queueRepository.save(email);
            logEvent(email.getId(), "QUEUED", null, null);
            log.info("Email queued. UUID: {}", email.getUuid());
            return email;
        } catch (Exception e) {
            log.error("Failed to queue email", e);
            throw new RuntimeException("Failed to queue email: " + e.getMessage());
        }
    }

    public EmailQueue findById(Long id) { return queueRepository.findById(id).orElseThrow(() -> new RuntimeException("Email not found: " + id)); }
    public EmailQueue findByUuid(String uuid) { return queueRepository.findByUuid(uuid).orElseThrow(() -> new RuntimeException("Email not found: " + uuid)); }
    public Page<EmailQueue> findAll(Pageable pageable) { return queueRepository.findAll(pageable); }
    public Page<EmailQueue> findByStatus(EmailQueue.Status status, Pageable pageable) { return queueRepository.findByStatus(status, pageable); }
    public List<EmailLog> getEmailLogs(Long emailId) { return logRepository.findByEmailQueueIdOrderByEventTimestampDesc(emailId); }

    public EmailStatsDTO getStats() {
        List<Object[]> counts = queueRepository.getStatusCounts();
        EmailStatsDTO stats = new EmailStatsDTO();
        long total = 0;
        for (Object[] row : counts) {
            EmailQueue.Status status = (EmailQueue.Status) row[0];
            Long count = (Long) row[1];
            total += count;
            switch (status) {
                case PENDING -> stats.setPending(count);
                case PROCESSING -> stats.setProcessing(count);
                case SENT -> stats.setSent(count);
                case FAILED -> stats.setFailed(count);
                case RETRY -> stats.setRetry(count);
                case CANCELLED -> stats.setCancelled(count);
            }
        }
        stats.setTotal(total);
        return stats;
    }

    @Transactional
    public void cancelEmail(Long id) {
        EmailQueue email = findById(id);
        if (email.getStatus() == EmailQueue.Status.SENT) throw new RuntimeException("Cannot cancel sent email");
        email.setStatus(EmailQueue.Status.CANCELLED);
        queueRepository.save(email);
        logEvent(id, "CANCELLED", null, null);
    }

    @Transactional
    public void retryEmail(Long id) {
        EmailQueue email = findById(id);
        if (email.getStatus() != EmailQueue.Status.FAILED) throw new RuntimeException("Can only retry failed emails");
        email.setStatus(EmailQueue.Status.PENDING);
        email.setRetryCount(0);
        email.setLastError(null);
        queueRepository.save(email);
        logEvent(id, "RETRY_REQUESTED", null, null);
    }

    @Transactional
    public void logEvent(Long emailQueueId, String eventType, String eventData, String providerResponse) {
        logRepository.save(EmailLog.builder().emailQueueId(emailQueueId).eventType(eventType).eventData(eventData).providerResponse(providerResponse).build());
    }

    public EmailQueueDTO mapToDTO(EmailQueue email) {
        try {
            return EmailQueueDTO.builder().id(email.getId()).uuid(email.getUuid()).tenantId(email.getTenantId())
                    .toAddresses(email.getToAddresses() != null ? objectMapper.readValue(email.getToAddresses(), List.class) : null)
                    .ccAddresses(email.getCcAddresses() != null ? objectMapper.readValue(email.getCcAddresses(), List.class) : null)
                    .subject(email.getSubject()).bodyHtml(email.getBodyHtml()).bodyText(email.getBodyText())
                    .templateCode(email.getTemplateCode()).priority(email.getPriority() != null ? email.getPriority().name() : null)
                    .status(email.getStatus() != null ? email.getStatus().name() : null).retryCount(email.getRetryCount())
                    .maxRetries(email.getMaxRetries()).lastError(email.getLastError()).referenceType(email.getReferenceType())
                    .referenceId(email.getReferenceId()).providerId(email.getProviderId()).providerUsed(email.getProviderUsed())
                    .providerMessageId(email.getProviderMessageId()).scheduledAt(email.getScheduledAt()).sentAt(email.getSentAt())
                    .createdAt(email.getCreatedAt()).createdBy(email.getCreatedBy()).build();
        } catch (Exception e) { throw new RuntimeException("Failed to map email to DTO", e); }
    }
}
