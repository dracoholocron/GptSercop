package com.globalcmx.api.service.command;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.command.CreateCurrencyCommand;
import com.globalcmx.api.dto.command.UpdateCurrencyCommand;
import com.globalcmx.api.dto.event.MonedaEvent;
import com.globalcmx.api.entity.Moneda;
import com.globalcmx.api.eventsourcing.aggregate.MonedaAggregate;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.event.DomainEvent;
import com.globalcmx.api.eventsourcing.event.MonedaCreatedEvent;
import com.globalcmx.api.eventsourcing.event.MonedaDeletedEvent;
import com.globalcmx.api.eventsourcing.event.MonedaUpdatedEvent;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.messaging.GenericEventPublisher;
import com.globalcmx.api.readmodel.repository.MonedaReadModelRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class MonedaCommandService {

    private final EventStoreService eventStoreService;
    private final MonedaReadModelRepository readModelRepository;
    private final ObjectMapper objectMapper;

    // Inyección del GenericEventPublisher que se adapta a Kafka o Pub/Sub
    @Autowired(required = false)
    private GenericEventPublisher<MonedaEvent> eventPublisher;

    public MonedaCommandService(EventStoreService eventStoreService,
                                     MonedaReadModelRepository readModelRepository,
                                     ObjectMapper objectMapper) {
        this.eventStoreService = eventStoreService;
        this.readModelRepository = readModelRepository;
        this.objectMapper = objectMapper;
    }


    @Transactional(transactionManager = "eventStoreTransactionManager")
    public Moneda createMoneda(CreateCurrencyCommand command) {
        log.info("Creating new Moneda with Event Sourcing - codigo: {}", command.getCodigo());

        // Validate unique codigo
        if (readModelRepository.existsByCodigo(command.getCodigo())) {
            throw new IllegalArgumentException("Ya existe una moneda con el código: " + command.getCodigo());
        }

        // Generate new ID
        Long monedaId = System.currentTimeMillis(); // Simple ID generation
        String aggregateId = "MONEDA-" + monedaId;

        // Create aggregate and handle command
        MonedaAggregate aggregate = new MonedaAggregate();
        aggregate.handle(command, monedaId);

        // Save events to Event Store
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "MONEDA",
                    domainEvent.getEventType(),
                    domainEvent,
                    command.getCreatedBy()
            );

            // Publish event to Kafka
            publishDomainEventToKafka(domainEvent, monedaId);
        }

        aggregate.markEventsAsCommitted();

        log.info("Moneda created successfully with ID: {} using Event Sourcing", monedaId);

        // Return temporary entity for compatibility
        return Moneda.builder()
                .id(monedaId)
                .codigo(command.getCodigo())
                .nombre(command.getNombre())
                .simbolo(command.getSimbolo())
                .activo(command.getActivo() != null ? command.getActivo() : true)
                .createdBy(command.getCreatedBy())
                .build();
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public Moneda updateMoneda(Long id, UpdateCurrencyCommand command) {
        log.info("Updating Moneda with Event Sourcing - ID: {}", id);

        String aggregateId = "MONEDA-" + id;

        // Load aggregate from Event Store
        List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);
        if (events.isEmpty()) {
            throw new IllegalArgumentException("Moneda no encontrada con ID: " + id);
        }

        MonedaAggregate aggregate = reconstructAggregateFromEvents(events);

        // Handle update command
        aggregate.handle(command);

        // Save new events
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "MONEDA",
                    domainEvent.getEventType(),
                    domainEvent,
                    command.getUpdatedBy()
            );

            publishDomainEventToKafka(domainEvent, id);
        }

        aggregate.markEventsAsCommitted();

        log.info("Moneda updated successfully with ID: {}", id);

        return Moneda.builder()
                .id(id)
                .codigo(aggregate.getCodigo())
                .nombre(aggregate.getNombre())
                .simbolo(aggregate.getSimbolo())
                .activo(aggregate.getActivo())
                .build();
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public void deleteMoneda(Long id, String deletedBy) {
        log.info("Deleting Moneda with Event Sourcing - ID: {}", id);

        String aggregateId = "MONEDA-" + id;

        // Load aggregate
        List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);
        if (events.isEmpty()) {
            throw new IllegalArgumentException("Moneda no encontrada con ID: " + id);
        }

        MonedaAggregate aggregate = reconstructAggregateFromEvents(events);

        // Handle delete
        aggregate.handleDelete(deletedBy);

        // Save event
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "MONEDA",
                    domainEvent.getEventType(),
                    domainEvent,
                    deletedBy
            );

            publishDomainEventToKafka(domainEvent, id);
        }

        aggregate.markEventsAsCommitted();

        log.info("Moneda deleted successfully with ID: {}", id);
    }

    private MonedaAggregate reconstructAggregateFromEvents(List<EventStoreEntity> events) {
        MonedaAggregate aggregate = new MonedaAggregate();

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
            case "MONEDA_CREATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), MonedaCreatedEvent.class);
            case "MONEDA_UPDATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), MonedaUpdatedEvent.class);
            case "MONEDA_DELETED" ->
                    objectMapper.readValue(eventEntity.getEventData(), MonedaDeletedEvent.class);
            default -> throw new IllegalArgumentException("Unknown event type: " + eventType);
        };
    }

    private void publishDomainEventToKafka(DomainEvent domainEvent, Long monedaId) {
        MonedaEvent kafkaEvent = convertDomainEventToKafkaEvent(domainEvent, monedaId);

        // Publicar evento usando GenericEventPublisher (se adapta a Kafka o Pub/Sub según configuración)
        if (eventPublisher != null) {
            eventPublisher.publish("moneda-events", monedaId.toString(), kafkaEvent);
            log.debug("Event published via {}", eventPublisher.getProvider());
        }
        else {
            log.warn("No event publisher available - running in test mode or messaging disabled");
        }
    }

    private MonedaEvent convertDomainEventToKafkaEvent(DomainEvent domainEvent, Long monedaId) {
        MonedaEvent.EventType eventType = switch (domainEvent.getEventType()) {
            case "MONEDA_CREATED" -> MonedaEvent.EventType.CREATED;
            case "MONEDA_UPDATED" -> MonedaEvent.EventType.UPDATED;
            case "MONEDA_DELETED" -> MonedaEvent.EventType.DELETED;
            default -> throw new IllegalArgumentException("Unknown event type");
        };

        if (domainEvent instanceof MonedaCreatedEvent created) {
            return MonedaEvent.builder()
                    .eventType(eventType)
                    .monedaId(monedaId)
                    .codigo(created.getCodigo())
                    .nombre(created.getNombre())
                    .simbolo(created.getSimbolo())
                    .activo(created.getActivo())
                    .timestamp(created.getTimestamp())
                    .performedBy(created.getPerformedBy())
                    .eventId(UUID.randomUUID().toString())
                    .build();
        } else if (domainEvent instanceof MonedaUpdatedEvent updated) {
            return MonedaEvent.builder()
                    .eventType(eventType)
                    .monedaId(monedaId)
                    .codigo(updated.getCodigo())
                    .nombre(updated.getNombre())
                    .simbolo(updated.getSimbolo())
                    .activo(updated.getActivo())
                    .timestamp(updated.getTimestamp())
                    .performedBy(updated.getPerformedBy())
                    .eventId(UUID.randomUUID().toString())
                    .build();
        } else if (domainEvent instanceof MonedaDeletedEvent deleted) {
            return MonedaEvent.builder()
                    .eventType(eventType)
                    .monedaId(monedaId)
                    .codigo("")
                    .nombre("")
                    .simbolo("")
                    .activo(false)
                    .timestamp(deleted.getTimestamp())
                    .performedBy(deleted.getPerformedBy())
                    .eventId(UUID.randomUUID().toString())
                    .build();
        }

        throw new IllegalArgumentException("Unknown domain event type");
    }
}
