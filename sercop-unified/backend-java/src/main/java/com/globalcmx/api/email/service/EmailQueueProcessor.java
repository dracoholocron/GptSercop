package com.globalcmx.api.email.service;

import com.globalcmx.api.email.entity.EmailProviderConfig;
import com.globalcmx.api.email.entity.EmailQueue;
import com.globalcmx.api.email.provider.EmailProvider;
import com.globalcmx.api.email.provider.EmailSendResult;
import com.globalcmx.api.email.repository.EmailQueueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailQueueProcessor {

    private final EmailQueueRepository queueRepository;
    private final EmailProviderService providerService;
    private final EmailService emailService;
    private static final int BATCH_SIZE = 10;
    private static final int[] RETRY_DELAYS_MINUTES = {1, 5, 15, 60};

    @Scheduled(fixedDelay = 10000)
    @Transactional
    public void processPendingEmails() {
        List<EmailQueue> pendingEmails = queueRepository.findPendingEmails(EmailQueue.Status.PENDING, LocalDateTime.now(), PageRequest.of(0, BATCH_SIZE));
        for (EmailQueue email : pendingEmails) processEmail(email);
    }

    @Scheduled(fixedDelay = 30000)
    @Transactional
    public void processRetries() {
        List<EmailQueue> retryEmails = queueRepository.findEmailsToRetry(LocalDateTime.now());
        for (EmailQueue email : retryEmails) processEmail(email);
    }

    private void processEmail(EmailQueue email) {
        log.info("Processing email: {} - Subject: {}", email.getUuid(), email.getSubject());
        try {
            email.setStatus(EmailQueue.Status.PROCESSING);
            queueRepository.save(email);
            emailService.logEvent(email.getId(), "PROCESSING", null, null);

            EmailProviderConfig providerConfig = getProvider(email);
            if (providerConfig == null) { handleFailure(email, "No active email provider configured", "NO_PROVIDER"); return; }

            EmailProvider provider = providerService.getProvider(providerConfig.getProviderType());
            EmailSendResult result = provider.send(email, providerConfig);

            if (result.isSuccess()) handleSuccess(email, providerConfig, result);
            else handleFailure(email, result.getErrorMessage(), result.getErrorCode());
        } catch (Exception e) {
            log.error("Error processing email: {}", email.getUuid(), e);
            handleFailure(email, e.getMessage(), "PROCESSING_ERROR");
        }
    }

    private EmailProviderConfig getProvider(EmailQueue email) {
        if (email.getProviderId() != null) {
            try { return providerService.findById(email.getProviderId()); } catch (Exception e) { log.warn("Specified provider not found, using default"); }
        }
        EmailProviderConfig defaultProvider = providerService.findDefaultProvider();
        if (defaultProvider != null) return defaultProvider;
        List<EmailProviderConfig> activeProviders = providerService.findActiveProviders();
        return activeProviders.isEmpty() ? null : activeProviders.get(0);
    }

    private void handleSuccess(EmailQueue email, EmailProviderConfig provider, EmailSendResult result) {
        email.setStatus(EmailQueue.Status.SENT);
        email.setSentAt(LocalDateTime.now());
        email.setProviderUsed(provider.getName());
        email.setProviderMessageId(result.getMessageId());
        queueRepository.save(email);
        emailService.logEvent(email.getId(), "SENT", null, result.getProviderResponse());
        log.info("Email sent: {} via {}", email.getUuid(), provider.getName());
    }

    private void handleFailure(EmailQueue email, String errorMessage, String errorCode) {
        email.setRetryCount(email.getRetryCount() + 1);
        email.setLastError(errorMessage);
        if (email.getRetryCount() < email.getMaxRetries()) {
            email.setStatus(EmailQueue.Status.RETRY);
            int delayIndex = Math.min(email.getRetryCount() - 1, RETRY_DELAYS_MINUTES.length - 1);
            email.setNextRetryAt(LocalDateTime.now().plusMinutes(RETRY_DELAYS_MINUTES[delayIndex]));
            emailService.logEvent(email.getId(), "RETRY", String.format("Retry %d/%d", email.getRetryCount(), email.getMaxRetries()), errorMessage);
        } else {
            email.setStatus(EmailQueue.Status.FAILED);
            emailService.logEvent(email.getId(), "FAILED", "Max retries exceeded", errorMessage);
        }
        queueRepository.save(email);
    }
}
