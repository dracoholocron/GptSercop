package com.globalcmx.api.service.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.event.OperationEventExecutedEvent;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.readmodel.entity.OperationEventLogReadModel;
import com.globalcmx.api.readmodel.repository.OperationEventLogReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Sync service for projecting operation event log events from the event store
 * to the read model. Enables replay of events.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OperationEventLogSyncService {

    private final EventStoreService eventStoreService;
    private final OperationEventLogReadModelRepository eventLogRepository;
    private final ObjectMapper objectMapper;

    /**
     * Sync all operation events from event store to read model.
     * Useful for rebuilding the read model from events.
     */
    @Transactional(transactionManager = "readModelTransactionManager")
    public void syncAllOperationEvents() {
        log.info("Starting full sync of operation events from Event Store");

        // Get all operation event executed events
        List<EventStoreEntity> allEvents = eventStoreService.getAllEventsByAggregateType("OPERATION_EVENT");

        log.info("Found {} operation events in Event Store", allEvents.size());

        int synced = 0;
        int errors = 0;

        for (EventStoreEntity event : allEvents) {
            try {
                if ("OPERATION_EVENT_EXECUTED".equals(event.getEventType())) {
                    projectEvent(event);
                    synced++;
                }
            } catch (Exception e) {
                log.error("Error syncing event {}: {}", event.getEventId(), e.getMessage());
                errors++;
            }
        }

        log.info("Sync completed. Synced: {}, Errors: {}", synced, errors);
    }

    /**
     * Sync events for a specific operation.
     */
    @Transactional(transactionManager = "readModelTransactionManager")
    public void syncOperationEvents(String operationId) {
        log.info("Syncing events for operation: {}", operationId);

        List<EventStoreEntity> events = eventStoreService.getEvents(operationId);

        for (EventStoreEntity event : events) {
            try {
                if ("OPERATION_EVENT_EXECUTED".equals(event.getEventType())) {
                    projectEvent(event);
                }
            } catch (Exception e) {
                log.error("Error syncing event {}: {}", event.getEventId(), e.getMessage());
            }
        }
    }

    /**
     * Project a single event to the read model.
     */
    @Transactional(transactionManager = "readModelTransactionManager")
    public void projectEvent(EventStoreEntity storeEvent) {
        try {
            OperationEventExecutedEvent event = objectMapper.readValue(
                    storeEvent.getEventData(),
                    OperationEventExecutedEvent.class
            );

            // Check if already exists
            if (eventLogRepository.findByEventId(event.getEventId()).isPresent()) {
                log.debug("Event {} already exists in read model, skipping", event.getEventId());
                return;
            }

            OperationEventLogReadModel readModel = OperationEventLogReadModel.builder()
                    .eventId(event.getEventId())
                    .operationId(event.getOperationId())
                    .operationType(event.getOperationType())
                    .eventCode(event.getEventCode())
                    .eventSequence(event.getEventSequence())
                    .swiftMessageId(event.getSwiftMessageId())
                    .swiftMessageType(event.getSwiftMessageType())
                    .messageDirection(event.getMessageDirection())
                    .previousStage(event.getPreviousStage())
                    .newStage(event.getNewStage())
                    .previousStatus(event.getPreviousStatus())
                    .newStatus(event.getNewStatus())
                    .eventData(event.getEventData())
                    .comments(event.getComments())
                    .operationSnapshot(event.getOperationSnapshot())
                    .executedBy(event.getPerformedBy())
                    .executedAt(event.getTimestamp())
                    .build();

            eventLogRepository.save(readModel);
            log.debug("Projected event {} to read model", event.getEventId());

            // Mark event as processed in event store
            eventStoreService.markEventAsProcessed(storeEvent.getEventId());

        } catch (Exception e) {
            log.error("Error projecting event {}: {}", storeEvent.getEventId(), e.getMessage(), e);
            throw new RuntimeException("Failed to project event", e);
        }
    }

    /**
     * Rebuild read model from event store (deletes existing and replays).
     */
    @Transactional(transactionManager = "readModelTransactionManager")
    public void rebuildReadModel() {
        log.warn("Rebuilding operation event log read model - deleting all existing records");

        eventLogRepository.deleteAll();
        syncAllOperationEvents();

        log.info("Read model rebuild completed. Total records: {}", eventLogRepository.count());
    }
}
