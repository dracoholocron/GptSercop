package com.globalcmx.api.service.command;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.command.CreateExchangeRateCommand;
import com.globalcmx.api.dto.command.UpdateExchangeRateCommand;
import com.globalcmx.api.dto.event.CotizacionEvent;
import com.globalcmx.api.entity.Cotizacion;
import com.globalcmx.api.eventsourcing.aggregate.CotizacionAggregate;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.event.*;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.messaging.GenericEventPublisher;
import com.globalcmx.api.readmodel.entity.CotizacionReadModel;
import com.globalcmx.api.readmodel.repository.CotizacionReadModelRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
public class CotizacionCommandService {

    private final EventStoreService eventStoreService;
    private final ObjectMapper objectMapper;
    private final CotizacionReadModelRepository readModelRepository;

    // Inyección del GenericEventPublisher que se adapta a Kafka, Pub/Sub o Service Bus
    @Autowired(required = false)
    private GenericEventPublisher<CotizacionEvent> eventPublisher;

    public CotizacionCommandService(EventStoreService eventStoreService,
                                     ObjectMapper objectMapper,
                                     CotizacionReadModelRepository readModelRepository) {
        this.eventStoreService = eventStoreService;
        this.objectMapper = objectMapper;
        this.readModelRepository = readModelRepository;
    }


    @Transactional(transactionManager = "eventStoreTransactionManager")
    public Cotizacion createCotizacion(CreateExchangeRateCommand command) {
        log.info("Creating new Cotizacion with Event Sourcing - moneda: {}, fecha: {}",
                command.getCodigoMoneda(), command.getFecha());

        // Generate new ID
        Long cotizacionId = System.currentTimeMillis();
        String aggregateId = "COTIZACION-" + cotizacionId;

        // Create aggregate and handle command
        CotizacionAggregate aggregate = new CotizacionAggregate();
        aggregate.handle(command, cotizacionId);

        // Save events to Event Store
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "COTIZACION",
                    domainEvent.getEventType(),
                    domainEvent,
                    command.getCreatedBy()
            );

            // Publish event to messaging system (Kafka, Pub/Sub, or Service Bus)
            publishDomainEvent(domainEvent, cotizacionId);
        }

        aggregate.markEventsAsCommitted();

        log.info("Cotizacion created successfully with ID: {} using Event Sourcing", cotizacionId);

        // Return temporary entity for compatibility
        return Cotizacion.builder()
                .id(cotizacionId)
                .codigoMoneda(command.getCodigoMoneda())
                .fecha(command.getFecha())
                .valorCompra(command.getValorCompra())
                .valorVenta(command.getValorVenta())
                .createdBy(command.getCreatedBy())
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public Cotizacion updateCotizacion(Long id, UpdateExchangeRateCommand command) {
        log.info("Updating Cotizacion with Event Sourcing - ID: {}", id);

        String aggregateId = "COTIZACION-" + id;

        // Load aggregate from Event Store
        List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);

        CotizacionAggregate aggregate;
        if (events.isEmpty()) {
            // No events found - check if record exists in ReadModel (legacy data)
            Optional<CotizacionReadModel> existingRecord = readModelRepository.findById(id);
            if (existingRecord.isEmpty()) {
                throw new IllegalArgumentException("Cotizacion no encontrada con ID: " + id);
            }

            // Create initial event from existing ReadModel data to bootstrap event sourcing
            log.warn("No events found for Cotizacion ID: {}. Creating initial event from ReadModel data.", id);
            CotizacionReadModel readModel = existingRecord.get();

            CotizacionCreatedEvent initialEvent = new CotizacionCreatedEvent(
                    id,
                    readModel.getCodigoMoneda(),
                    readModel.getFecha(),
                    readModel.getValorCompra(),
                    readModel.getValorVenta(),
                    "SYSTEM_MIGRATION"
            );

            // Save the initial CREATED event
            eventStoreService.saveEvent(
                    aggregateId,
                    "COTIZACION",
                    "COTIZACION_CREATED",
                    initialEvent,
                    "SYSTEM_MIGRATION"
            );

            // Reconstruct aggregate with the initial event
            aggregate = new CotizacionAggregate();
            aggregate.apply(initialEvent);
            aggregate.markEventsAsCommitted();

            log.info("Created initial event for legacy Cotizacion ID: {}", id);
        } else {
            aggregate = reconstructAggregateFromEvents(events);
        }

        // Handle update command
        aggregate.handle(command);

        // Save new events
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "COTIZACION",
                    domainEvent.getEventType(),
                    domainEvent,
                    command.getUpdatedBy()
            );

            publishDomainEvent(domainEvent, id);
        }

        aggregate.markEventsAsCommitted();

        log.info("Cotizacion updated successfully with ID: {}", id);

        return Cotizacion.builder()
                .id(id)
                .codigoMoneda(aggregate.getCodigoMoneda())
                .fecha(aggregate.getFecha())
                .valorCompra(aggregate.getValorCompra())
                .valorVenta(aggregate.getValorVenta())
                .build();
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public void deleteCotizacion(Long id, String deletedBy) {
        log.info("Deleting Cotizacion with Event Sourcing - ID: {}", id);

        String aggregateId = "COTIZACION-" + id;

        // Load aggregate
        List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);
        if (events.isEmpty()) {
            throw new IllegalArgumentException("Cotizacion no encontrada con ID: " + id);
        }

        CotizacionAggregate aggregate = reconstructAggregateFromEvents(events);

        // Handle delete
        aggregate.handleDelete(deletedBy);

        // Save event
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "COTIZACION",
                    domainEvent.getEventType(),
                    domainEvent,
                    deletedBy
            );

            publishDomainEvent(domainEvent, id);
        }

        aggregate.markEventsAsCommitted();

        log.info("Cotizacion deleted successfully with ID: {}", id);
    }

    private CotizacionAggregate reconstructAggregateFromEvents(List<EventStoreEntity> events) {
        CotizacionAggregate aggregate = new CotizacionAggregate();

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
            case "COTIZACION_CREATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), CotizacionCreatedEvent.class);
            case "COTIZACION_UPDATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), CotizacionUpdatedEvent.class);
            case "COTIZACION_DELETED" ->
                    objectMapper.readValue(eventEntity.getEventData(), CotizacionDeletedEvent.class);
            default -> throw new IllegalArgumentException("Unknown event type: " + eventType);
        };
    }

    private void publishDomainEvent(DomainEvent domainEvent, Long cotizacionId) {
        if (eventPublisher != null) {
            CotizacionEvent event = convertDomainEventToEvent(domainEvent, cotizacionId);
            eventPublisher.publish("cotizacion-events", cotizacionId.toString(), event);
            log.debug("Cotizacion event published via {} for ID: {}",
                    eventPublisher.getProvider(), cotizacionId);
        } else {
            log.warn("No event publisher available - event not published to message bus. " +
                    "Event saved to EventStore only. Cotizacion ID: {}", cotizacionId);
        }
    }

    private CotizacionEvent convertDomainEventToEvent(DomainEvent domainEvent, Long cotizacionId) {
        CotizacionEvent.EventType eventType = switch (domainEvent.getEventType()) {
            case "COTIZACION_CREATED" -> CotizacionEvent.EventType.CREATED;
            case "COTIZACION_UPDATED" -> CotizacionEvent.EventType.UPDATED;
            case "COTIZACION_DELETED" -> CotizacionEvent.EventType.DELETED;
            default -> throw new IllegalArgumentException("Unknown event type");
        };

        if (domainEvent instanceof CotizacionCreatedEvent created) {
            return CotizacionEvent.builder()
                    .eventType(eventType)
                    .cotizacionId(cotizacionId)
                    .codigoMoneda(created.getCodigoMoneda())
                    .fecha(created.getFecha())
                    .valorCompra(created.getValorCompra())
                    .valorVenta(created.getValorVenta())
                    .timestamp(created.getTimestamp())
                    .performedBy(created.getPerformedBy())
                    .eventId(UUID.randomUUID().toString())
                    .build();
        } else if (domainEvent instanceof CotizacionUpdatedEvent updated) {
            return CotizacionEvent.builder()
                    .eventType(eventType)
                    .cotizacionId(cotizacionId)
                    .codigoMoneda(updated.getCodigoMoneda())
                    .fecha(updated.getFecha())
                    .valorCompra(updated.getValorCompra())
                    .valorVenta(updated.getValorVenta())
                    .timestamp(updated.getTimestamp())
                    .performedBy(updated.getPerformedBy())
                    .eventId(UUID.randomUUID().toString())
                    .build();
        } else if (domainEvent instanceof CotizacionDeletedEvent deleted) {
            return CotizacionEvent.builder()
                    .eventType(eventType)
                    .cotizacionId(cotizacionId)
                    .codigoMoneda("")
                    .fecha(null)
                    .valorCompra(null)
                    .valorVenta(null)
                    .timestamp(deleted.getTimestamp())
                    .performedBy(deleted.getPerformedBy())
                    .eventId(UUID.randomUUID().toString())
                    .build();
        }

        throw new IllegalArgumentException("Unknown domain event type");
    }
}
