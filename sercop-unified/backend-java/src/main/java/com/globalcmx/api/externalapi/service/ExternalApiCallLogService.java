package com.globalcmx.api.externalapi.service;

import com.globalcmx.api.externalapi.entity.ExternalApiCallLog;
import com.globalcmx.api.externalapi.repository.ExternalApiCallLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for saving external API call logs.
 * Uses REQUIRES_NEW propagation to ensure logs are saved
 * even if the outer transaction fails.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExternalApiCallLogService {

    private final ExternalApiCallLogRepository callLogRepository;

    /**
     * Saves an API call log in a separate transaction.
     * This ensures the log is persisted even if the outer transaction rolls back.
     *
     * @param callLog The call log to save
     * @return The saved call log, or null if save failed
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ExternalApiCallLog saveCallLog(ExternalApiCallLog callLog) {
        try {
            return callLogRepository.save(callLog);
        } catch (Exception e) {
            log.error("Error saving API call log: {}", e.getMessage(), e);
            return null;
        }
    }
}
