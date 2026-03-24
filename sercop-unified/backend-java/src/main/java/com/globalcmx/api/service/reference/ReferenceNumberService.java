package com.globalcmx.api.service.reference;

import com.globalcmx.api.eventsourcing.event.ReferenceNumberGeneratedEvent;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.readmodel.entity.ReferenceNumberConfigReadModel;
import com.globalcmx.api.readmodel.entity.ReferenceNumberHistoryReadModel;
import com.globalcmx.api.readmodel.entity.ReferenceNumberSequenceReadModel;
import com.globalcmx.api.readmodel.repository.ReferenceNumberConfigRepository;
import com.globalcmx.api.readmodel.repository.ReferenceNumberHistoryRepository;
import com.globalcmx.api.readmodel.repository.ReferenceNumberSequenceRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class ReferenceNumberService {

    private final ReferenceNumberConfigRepository configRepository;
    private final ReferenceNumberSequenceRepository sequenceRepository;
    private final ReferenceNumberHistoryRepository historyRepository;
    private final EventStoreService eventStoreService;

    public ReferenceNumberService(
            ReferenceNumberConfigRepository configRepository,
            ReferenceNumberSequenceRepository sequenceRepository,
            ReferenceNumberHistoryRepository historyRepository,
            EventStoreService eventStoreService) {
        this.configRepository = configRepository;
        this.sequenceRepository = sequenceRepository;
        this.historyRepository = historyRepository;
        this.eventStoreService = eventStoreService;
    }

    /**
     * Generates a new reference number for the specified product and parameters
     *
     * @param clientId Client identifier (use "DEFAULT" for default configuration)
     * @param productCode Product code (M, B, E, O, I, S, J)
     * @param countryCode Country code (E, M, U, C, P, A, B, H)
     * @param agencyCode Agency/branch code
     * @param entityType Type of entity using this reference (LC_IMPORT, LC_EXPORT, etc.)
     * @param entityId Identifier of the entity
     * @param generatedBy User who generated this reference
     * @return Generated reference number
     * @throws RuntimeException if configuration not found or generation fails
     */
    @Transactional(transactionManager = "readModelTransactionManager")
    public String generateReferenceNumber(
            String clientId,
            String productCode,
            String countryCode,
            String agencyCode,
            String entityType,
            String entityId,
            String generatedBy) {

        log.info("Generating reference number for client={}, product={}, country={}, agency={}",
                clientId, productCode, countryCode, agencyCode);

        // Find configuration
        ReferenceNumberConfigReadModel config = configRepository
                .findByClientIdAndProductCodeAndCountryCodeAndActiveTrue(clientId, productCode, countryCode)
                .orElseGet(() -> configRepository
                        .findByClientIdAndProductCodeAndCountryCodeAndActiveTrue("DEFAULT", productCode, countryCode)
                        .orElseThrow(() -> new RuntimeException(
                                String.format("No active configuration found for product=%s, country=%s",
                                        productCode, countryCode))));

        // Get current year code
        String yearCode = getCurrentYearCode(config.getYearDigits());

        // Get or create sequence (without pessimistic lock for now)
        ReferenceNumberSequenceReadModel sequence = sequenceRepository
                .findByConfigIdAndAgencyCodeAndYearCode(config.getId(), agencyCode, yearCode)
                .orElseGet(() -> createNewSequence(config.getId(), agencyCode, yearCode));

        // Increment sequence
        Long nextSequence = sequence.getCurrentSequence() + 1;
        sequence.setCurrentSequence(nextSequence);
        sequence.setLastGeneratedAt(LocalDateTime.now());
        sequenceRepository.save(sequence);

        // Build reference number
        String referenceNumber = buildReferenceNumber(config, agencyCode, yearCode, nextSequence);

        // Verify uniqueness
        if (historyRepository.existsByReferenceNumber(referenceNumber)) {
            log.error("Generated reference number already exists: {}", referenceNumber);
            throw new RuntimeException("Generated reference number already exists: " + referenceNumber);
        }

        // Save to history
        ReferenceNumberHistoryReadModel history = ReferenceNumberHistoryReadModel.builder()
                .configId(config.getId())
                .referenceNumber(referenceNumber)
                .productCode(productCode)
                .countryCode(countryCode)
                .agencyCode(agencyCode)
                .yearCode(yearCode)
                .sequenceNumber(nextSequence)
                .entityType(entityType)
                .entityId(entityId)
                .generatedBy(generatedBy)
                .build();

        historyRepository.save(history);

        // Publish event to Event Store
        String aggregateId = "REFERENCE_NUMBER-" + referenceNumber;
        ReferenceNumberGeneratedEvent event = new ReferenceNumberGeneratedEvent(
                config.getId(),
                referenceNumber,
                productCode,
                countryCode,
                agencyCode,
                yearCode,
                nextSequence,
                entityType,
                entityId,
                clientId,
                generatedBy
        );

        eventStoreService.saveEvent(
                aggregateId,
                "REFERENCE_NUMBER",
                event.getEventType(),
                event,
                generatedBy
        );

        log.info("Generated reference number: {} for entity {}:{} and published event to Event Store",
                referenceNumber, entityType, entityId);

        return referenceNumber;
    }

    /**
     * Builds the reference number string according to configuration
     */
    private String buildReferenceNumber(
            ReferenceNumberConfigReadModel config,
            String agencyCode,
            String yearCode,
            Long sequence) {

        // Pad numbers to required length
        String paddedAgency = padNumber(agencyCode, config.getAgencyDigits());
        String paddedYear = padNumber(yearCode, config.getYearDigits());
        String paddedSequence = padNumber(String.valueOf(sequence), config.getSequentialDigits());

        // Build reference number
        StringBuilder refNumber = new StringBuilder();
        refNumber.append(config.getProductCode()).append(config.getCountryCode());

        String separator = config.getSeparator() != null ? config.getSeparator() : "";

        if (!separator.isEmpty()) {
            refNumber.append(separator).append(paddedAgency);
            refNumber.append(separator).append(paddedYear);
            refNumber.append(separator).append(paddedSequence);
        } else {
            refNumber.append(paddedAgency).append(paddedYear).append(paddedSequence);
        }

        return refNumber.toString();
    }

    /**
     * Pads a number string with leading zeros
     */
    private String padNumber(String number, int length) {
        if (number.length() >= length) {
            return number.substring(number.length() - length);
        }
        return String.format("%0" + length + "d", Long.parseLong(number));
    }

    /**
     * Gets the current year code based on configured digits
     */
    private String getCurrentYearCode(int yearDigits) {
        if (yearDigits == 4) {
            return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy"));
        } else {
            return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yy"));
        }
    }

    /**
     * Creates a new sequence record for a config/agency/year combination
     */
    private ReferenceNumberSequenceReadModel createNewSequence(Long configId, String agencyCode, String yearCode) {
        log.info("Creating new sequence for config={}, agency={}, year={}", configId, agencyCode, yearCode);

        ReferenceNumberSequenceReadModel sequence = ReferenceNumberSequenceReadModel.builder()
                .configId(configId)
                .agencyCode(agencyCode)
                .yearCode(yearCode)
                .currentSequence(0L)
                .build();

        return sequenceRepository.save(sequence);
    }

    /**
     * Retrieves all active configurations
     */
    public List<ReferenceNumberConfigReadModel> getAllActiveConfigurations() {
        return configRepository.findByActiveTrue();
    }

    /**
     * Retrieves configuration by client and product
     */
    public Optional<ReferenceNumberConfigReadModel> getConfiguration(
            String clientId, String productCode, String countryCode) {
        return configRepository.findByClientIdAndProductCodeAndCountryCodeAndActiveTrue(
                clientId, productCode, countryCode);
    }

    /**
     * Retrieves reference number history by reference number
     */
    public Optional<ReferenceNumberHistoryReadModel> getHistoryByReferenceNumber(String referenceNumber) {
        return historyRepository.findByReferenceNumber(referenceNumber);
    }

    /**
     * Retrieves reference numbers for a specific entity
     */
    public List<ReferenceNumberHistoryReadModel> getHistoryByEntity(String entityType, String entityId) {
        return historyRepository.findByEntityTypeAndEntityId(entityType, entityId);
    }

    /**
     * Saves or updates a configuration
     */
    @Transactional
    public ReferenceNumberConfigReadModel saveConfiguration(ReferenceNumberConfigReadModel config) {
        return configRepository.save(config);
    }

    /**
     * Gets the next reference number that would be generated (for preview purposes)
     */
    public String getNextReferencePreview(String clientId, String productCode, String countryCode, String agencyCode) {
        ReferenceNumberConfigReadModel config = configRepository
                .findByClientIdAndProductCodeAndCountryCodeAndActiveTrue(clientId, productCode, countryCode)
                .orElseGet(() -> configRepository
                        .findByClientIdAndProductCodeAndCountryCodeAndActiveTrue("DEFAULT", productCode, countryCode)
                        .orElseThrow(() -> new RuntimeException("No configuration found")));

        String yearCode = getCurrentYearCode(config.getYearDigits());

        Optional<ReferenceNumberSequenceReadModel> sequenceOpt = sequenceRepository
                .findByConfigIdAndAgencyCodeAndYearCode(config.getId(), agencyCode, yearCode);

        Long nextSequence = sequenceOpt.map(s -> s.getCurrentSequence() + 1).orElse(1L);

        return buildReferenceNumber(config, agencyCode, yearCode, nextSequence);
    }
}
