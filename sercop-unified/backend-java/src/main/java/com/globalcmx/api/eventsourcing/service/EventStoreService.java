package com.globalcmx.api.eventsourcing.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.entity.SnapshotEntity;
import com.globalcmx.api.eventsourcing.repository.EventStoreRepository;
import com.globalcmx.api.eventsourcing.repository.SnapshotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventStoreService {

    private final EventStoreRepository eventStoreRepository;
    private final SnapshotRepository snapshotRepository;
    private final ObjectMapper objectMapper;

    @Value("${eventsourcing.snapshot.frequency:10}")
    private int snapshotFrequency;

    @Value("${eventsourcing.snapshot.enabled:true}")
    private boolean snapshotEnabled;

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public void saveEvent(String aggregateId, String aggregateType, String eventType,
                          Object eventData, String performedBy) {
        try {
            Long nextVersion = getNextVersion(aggregateId);

            String eventDataJson = objectMapper.writeValueAsString(eventData);

            EventStoreEntity event = EventStoreEntity.builder()
                    .eventId(UUID.randomUUID().toString())
                    .aggregateId(aggregateId)
                    .aggregateType(aggregateType)
                    .version(nextVersion)
                    .eventType(eventType)
                    .eventData(eventDataJson)
                    .timestamp(LocalDateTime.now())
                    .performedBy(performedBy)
                    .processed(false)
                    .build();

            eventStoreRepository.save(event);
            log.info("Event saved: {} for aggregate: {} at version: {}", eventType, aggregateId, nextVersion);

        } catch (Exception e) {
            log.error("Error saving event for aggregate: {}", aggregateId, e);
            throw new RuntimeException("Failed to save event", e);
        }
    }

    @Transactional(transactionManager = "eventStoreTransactionManager", readOnly = true)
    public List<EventStoreEntity> getEvents(String aggregateId) {
        return eventStoreRepository.findByAggregateIdOrderByVersionAsc(aggregateId);
    }

    @Transactional(transactionManager = "eventStoreTransactionManager", readOnly = true)
    public List<EventStoreEntity> getEventsAfterVersion(String aggregateId, Long afterVersion) {
        return eventStoreRepository.findByAggregateIdAfterVersion(aggregateId, afterVersion);
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public void saveSnapshot(String aggregateId, String aggregateType, Long version, Object snapshotData) {
        if (!snapshotEnabled) {
            return;
        }

        try {
            String snapshotDataJson = objectMapper.writeValueAsString(snapshotData);

            SnapshotEntity snapshot = SnapshotEntity.builder()
                    .aggregateId(aggregateId)
                    .aggregateType(aggregateType)
                    .version(version)
                    .snapshotData(snapshotDataJson)
                    .timestamp(LocalDateTime.now())
                    .build();

            snapshotRepository.save(snapshot);
            log.info("Snapshot saved for aggregate: {} at version: {}", aggregateId, version);

            // Delete old snapshots (keep only the latest)
            snapshotRepository.deleteByAggregateIdAndVersionLessThan(aggregateId, version);

        } catch (Exception e) {
            log.error("Error saving snapshot for aggregate: {}", aggregateId, e);
            throw new RuntimeException("Failed to save snapshot", e);
        }
    }

    @Transactional(transactionManager = "eventStoreTransactionManager", readOnly = true)
    public Optional<SnapshotEntity> getLatestSnapshot(String aggregateId) {
        return snapshotRepository.findLatestByAggregateId(aggregateId);
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public void markEventAsProcessed(String eventId) {
        eventStoreRepository.findById(eventId).ifPresent(event -> {
            event.setProcessed(true);
            eventStoreRepository.save(event);
        });
    }

    private Long getNextVersion(String aggregateId) {
        Long maxVersion = eventStoreRepository.findMaxVersionByAggregateId(aggregateId);
        return (maxVersion == null) ? 1L : maxVersion + 1;
    }

    public boolean shouldCreateSnapshot(Long currentVersion) {
        return snapshotEnabled && (currentVersion % snapshotFrequency == 0);
    }

    @Transactional(transactionManager = "eventStoreTransactionManager", readOnly = true)
    public List<EventStoreEntity> getAllEventsByAggregateType(String aggregateType) {
        return eventStoreRepository.findByAggregateTypeOrderByTimestampAsc(aggregateType);
    }
}
