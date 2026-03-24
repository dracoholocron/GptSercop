package com.globalcmx.api.service.command;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.command.SaveDroolsRulesCommand;
import com.globalcmx.api.dto.event.DroolsRulesConfigEvent;
import com.globalcmx.api.eventsourcing.aggregate.DroolsRulesConfigAggregate;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.event.DomainEvent;
import com.globalcmx.api.eventsourcing.event.DroolsRulesConfigCreatedEvent;
import com.globalcmx.api.eventsourcing.event.DroolsRulesConfigUpdatedEvent;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.messaging.GenericEventPublisher;
import com.globalcmx.api.readmodel.entity.DroolsRulesConfigReadModel;
import com.globalcmx.api.readmodel.repository.DroolsRulesConfigReadModelRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
public class DroolsRulesConfigCommandService {

    private final EventStoreService eventStoreService;
    private final DroolsRulesConfigReadModelRepository droolsRulesConfigReadModelRepository;
    private final ObjectMapper objectMapper;

    @Autowired(required = false)
    private GenericEventPublisher<DroolsRulesConfigEvent> eventPublisher;

    public DroolsRulesConfigCommandService(EventStoreService eventStoreService,
                                           DroolsRulesConfigReadModelRepository droolsRulesConfigReadModelRepository,
                                           ObjectMapper objectMapper) {
        this.eventStoreService = eventStoreService;
        this.droolsRulesConfigReadModelRepository = droolsRulesConfigReadModelRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public DroolsRulesConfigReadModel saveDroolsRulesConfig(SaveDroolsRulesCommand command) {
        log.info("Saving DroolsRulesConfig with Event Sourcing - ruleType: {}", command.getRuleType());

        // Deactivate ALL active configs for this rule type (handles duplicates gracefully)
        List<DroolsRulesConfigReadModel> activeRecords = droolsRulesConfigReadModelRepository
                .findAllByRuleTypeAndIsActiveTrue(command.getRuleType());

        for (DroolsRulesConfigReadModel existing : activeRecords) {
                    String existingAggregateId = "DROOLS_RULES_CONFIG-" + existing.getId();

                    // Load existing aggregate from Event Store
                    List<EventStoreEntity> events = eventStoreService.getEvents(existingAggregateId);

                    if (events.isEmpty()) {
                        // Legacy record: inserted directly by SQL migration (no events in Event Store)
                        // Create a synthetic CREATED event to bootstrap the aggregate, then deactivate
                        log.info("Legacy record detected (no events in Event Store) for id={}. " +
                                "Bootstrapping with synthetic event.", existing.getId());

                        // Save synthetic CREATED event for audit trail
                        DroolsRulesConfigCreatedEvent syntheticCreated = new DroolsRulesConfigCreatedEvent(
                                existing.getId(),
                                existing.getRuleType(),
                                existing.getDrlContent(),
                                existing.getSourceFileName(),
                                true,
                                existing.getVersion(),
                                "SYSTEM_MIGRATION"
                        );
                        eventStoreService.saveEvent(
                                existingAggregateId,
                                "DROOLS_RULES_CONFIG",
                                syntheticCreated.getEventType(),
                                syntheticCreated,
                                "SYSTEM_MIGRATION"
                        );

                        // Now reload events and proceed with deactivation
                        events = eventStoreService.getEvents(existingAggregateId);
                    }

                    DroolsRulesConfigAggregate existingAggregate = reconstructAggregateFromEvents(events);

                    // Handle deactivation
                    existingAggregate.handleDeactivate(command.getPerformedBy());

                    // Save deactivation events
                    for (DomainEvent domainEvent : existingAggregate.getUncommittedEvents()) {
                        eventStoreService.saveEvent(
                                existingAggregateId,
                                "DROOLS_RULES_CONFIG",
                                domainEvent.getEventType(),
                                domainEvent,
                                command.getPerformedBy()
                        );
                        publishDomainEvent(domainEvent, existing.getId());
                    }
                    existingAggregate.markEventsAsCommitted();

                    // Update read model: mark as inactive
                    existing.setIsActive(false);
                    droolsRulesConfigReadModelRepository.save(existing);

                    log.info("Deactivated previous {} DRL config id={}, version={}",
                            command.getRuleType(), existing.getId(), existing.getVersion());
        }

        // Determine next version
        List<DroolsRulesConfigReadModel> history = droolsRulesConfigReadModelRepository
                .findByRuleTypeOrderByVersionDesc(command.getRuleType());
        int nextVersion = history.isEmpty() ? 1 : history.get(0).getVersion() + 1;

        // Generate new ID
        Long newId = System.currentTimeMillis();
        String aggregateId = "DROOLS_RULES_CONFIG-" + newId;

        // Create aggregate and handle command
        DroolsRulesConfigAggregate aggregate = new DroolsRulesConfigAggregate(newId);
        aggregate.handleCreate(command, nextVersion);

        // Save events to Event Store
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "DROOLS_RULES_CONFIG",
                    domainEvent.getEventType(),
                    domainEvent,
                    command.getPerformedBy()
            );
            publishDomainEvent(domainEvent, newId);
        }
        aggregate.markEventsAsCommitted();

        log.info("DroolsRulesConfig created successfully with ID: {} version: {} using Event Sourcing",
                newId, nextVersion);

        // Save read model directly (including Excel binary) to ensure synchronous persistence
        DroolsRulesConfigReadModel readModel = DroolsRulesConfigReadModel.builder()
                .id(newId)
                .ruleType(command.getRuleType())
                .drlContent(command.getDrlContent())
                .sourceFileName(command.getSourceFileName())
                .sourceFileContent(command.getSourceFileContent())
                .isActive(true)
                .version(nextVersion)
                .createdBy(command.getPerformedBy())
                .build();

        droolsRulesConfigReadModelRepository.save(readModel);
        log.info("Read model saved directly with sourceFileContent={} bytes",
                command.getSourceFileContent() != null ? command.getSourceFileContent().length : 0);

        return readModel;
    }

    private DroolsRulesConfigAggregate reconstructAggregateFromEvents(List<EventStoreEntity> events) {
        DroolsRulesConfigAggregate aggregate = new DroolsRulesConfigAggregate();

        for (EventStoreEntity eventEntity : events) {
            try {
                DomainEvent domainEvent = deserializeDomainEvent(eventEntity);
                aggregate.loadFromHistory(List.of(domainEvent));
            } catch (Exception e) {
                log.error("Error deserializing event: {}", eventEntity.getEventId(), e);
                throw new RuntimeException("Failed to reconstruct aggregate", e);
            }
        }

        return aggregate;
    }

    private DomainEvent deserializeDomainEvent(EventStoreEntity eventEntity) throws Exception {
        String eventType = eventEntity.getEventType();

        return switch (eventType) {
            case "DROOLS_RULES_CONFIG_CREATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), DroolsRulesConfigCreatedEvent.class);
            case "DROOLS_RULES_CONFIG_UPDATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), DroolsRulesConfigUpdatedEvent.class);
            default -> throw new IllegalArgumentException("Unknown event type: " + eventType);
        };
    }

    private void publishDomainEvent(DomainEvent domainEvent, Long droolsRulesConfigId) {
        if (eventPublisher != null) {
            DroolsRulesConfigEvent event = convertDomainEventToEvent(domainEvent, droolsRulesConfigId);
            eventPublisher.publish("droolsrulesconfig-events", droolsRulesConfigId.toString(), event);
            log.debug("DroolsRulesConfig event published via {} for ID: {}",
                    eventPublisher.getProvider(), droolsRulesConfigId);
        } else {
            log.warn("No event publisher available - event not published to message bus. " +
                    "Event saved to EventStore only. DroolsRulesConfig ID: {}", droolsRulesConfigId);
        }
    }

    private DroolsRulesConfigEvent convertDomainEventToEvent(DomainEvent domainEvent, Long droolsRulesConfigId) {
        DroolsRulesConfigEvent.EventType eventType = switch (domainEvent.getEventType()) {
            case "DROOLS_RULES_CONFIG_CREATED" -> DroolsRulesConfigEvent.EventType.CREATED;
            case "DROOLS_RULES_CONFIG_UPDATED" -> DroolsRulesConfigEvent.EventType.UPDATED;
            default -> throw new IllegalArgumentException("Unknown event type");
        };

        if (domainEvent instanceof DroolsRulesConfigCreatedEvent created) {
            return DroolsRulesConfigEvent.builder()
                    .eventType(eventType)
                    .droolsRulesConfigId(droolsRulesConfigId)
                    .ruleType(created.getRuleType())
                    .drlContent(created.getDrlContent())
                    .sourceFileName(created.getSourceFileName())
                    .isActive(created.getIsActive())
                    .version(created.getVersion())
                    .timestamp(created.getTimestamp())
                    .performedBy(created.getPerformedBy())
                    .build();
        } else if (domainEvent instanceof DroolsRulesConfigUpdatedEvent updated) {
            return DroolsRulesConfigEvent.builder()
                    .eventType(eventType)
                    .droolsRulesConfigId(droolsRulesConfigId)
                    .ruleType(updated.getRuleType())
                    .drlContent(updated.getDrlContent())
                    .sourceFileName(updated.getSourceFileName())
                    .isActive(updated.getIsActive())
                    .version(updated.getVersion())
                    .timestamp(updated.getTimestamp())
                    .performedBy(updated.getPerformedBy())
                    .build();
        }

        throw new IllegalArgumentException("Unknown domain event type");
    }
}
