package com.globalcmx.api.service.command;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.command.CreateCreditLineCommand;
import com.globalcmx.api.dto.command.UpdateCreditLineCommand;
import com.globalcmx.api.dto.event.LineaCreditoEvent;
import com.globalcmx.api.entity.LineaCredito;
import com.globalcmx.api.eventsourcing.aggregate.LineaCreditoAggregate;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.event.DomainEvent;
import com.globalcmx.api.eventsourcing.event.LineaCreditoCreatedEvent;
import com.globalcmx.api.eventsourcing.event.LineaCreditoDeletedEvent;
import com.globalcmx.api.eventsourcing.event.LineaCreditoUpdatedEvent;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.messaging.GenericEventPublisher;
import com.globalcmx.api.readmodel.repository.LineaCreditoReadModelRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class LineaCreditoCommandService {

    private final EventStoreService eventStoreService;
    // Inyección del GenericEventPublisher que se adapta a Kafka, Pub/Sub o Service Bus
    @Autowired(required = false)
    private GenericEventPublisher<LineaCreditoEvent> eventPublisher;
    private final LineaCreditoReadModelRepository readModelRepository;
    private final ObjectMapper objectMapper;
    public LineaCreditoCommandService(EventStoreService eventStoreService,
                                     LineaCreditoReadModelRepository readModelRepository,
                                     ObjectMapper objectMapper) {
        this.eventStoreService = eventStoreService;
        this.readModelRepository = readModelRepository;
        this.objectMapper = objectMapper;
    }


    @Transactional(transactionManager = "eventStoreTransactionManager")
    public LineaCredito createLineaCredito(CreateCreditLineCommand command) {
        log.info("Creating new LineaCredito with Event Sourcing - clienteId: {}, tipo: {}",
            command.getClienteId(), command.getTipo());

        // Generate new ID
        Long lineaCreditoId = System.currentTimeMillis();
        String aggregateId = "LINEA_CREDITO-" + lineaCreditoId;

        // Create aggregate and handle command
        LineaCreditoAggregate aggregate = new LineaCreditoAggregate();
        aggregate.handle(command, lineaCreditoId);

        // Save events to Event Store
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "LINEA_CREDITO",
                    domainEvent.getEventType(),
                    domainEvent,
                    command.getCreatedBy()
            );

            // Publish event to message bus
            publishDomainEvent(domainEvent, lineaCreditoId);
        }

        aggregate.markEventsAsCommitted();

        log.info("LineaCredito created successfully with ID: {} using Event Sourcing", lineaCreditoId);

        // Return temporary entity for compatibility
        return LineaCredito.builder()
                .id(lineaCreditoId)
                .clienteId(command.getClienteId())
                .tipo(command.getTipo())
                .moneda(command.getMoneda())
                .montoAutorizado(command.getMontoAutorizado())
                .montoUtilizado(aggregate.getMontoUtilizado())
                .montoDisponible(aggregate.getMontoDisponible())
                .fechaAutorizacion(command.getFechaAutorizacion())
                .fechaVencimiento(command.getFechaVencimiento())
                .tasaReferencia(command.getTasaReferencia())
                .spread(command.getSpread())
                .estado(command.getEstado())
                .build();
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public LineaCredito updateLineaCredito(Long id, UpdateCreditLineCommand command) {
        log.info("Updating LineaCredito with Event Sourcing - ID: {}", id);

        String aggregateId = "LINEA_CREDITO-" + id;

        // Load aggregate from Event Store
        List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);
        if (events.isEmpty()) {
            throw new IllegalArgumentException("Línea de crédito no encontrada con ID: " + id);
        }

        LineaCreditoAggregate aggregate = reconstructAggregateFromEvents(events);

        // Handle update command
        aggregate.handle(command);

        // Save new events
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "LINEA_CREDITO",
                    domainEvent.getEventType(),
                    domainEvent,
                    command.getUpdatedBy()
            );

            publishDomainEvent(domainEvent, id);
        }

        aggregate.markEventsAsCommitted();

        log.info("LineaCredito updated successfully with ID: {}", id);

        return LineaCredito.builder()
                .id(id)
                .clienteId(aggregate.getClienteId())
                .tipo(aggregate.getTipo())
                .moneda(aggregate.getMoneda())
                .montoAutorizado(aggregate.getMontoAutorizado())
                .montoUtilizado(aggregate.getMontoUtilizado())
                .montoDisponible(aggregate.getMontoDisponible())
                .fechaAutorizacion(aggregate.getFechaAutorizacion())
                .fechaVencimiento(aggregate.getFechaVencimiento())
                .tasaReferencia(aggregate.getTasaReferencia())
                .spread(aggregate.getSpread())
                .estado(aggregate.getEstado())
                .build();
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public void deleteLineaCredito(Long id, String deletedBy) {
        log.info("Deleting LineaCredito with Event Sourcing - ID: {}", id);

        String aggregateId = "LINEA_CREDITO-" + id;

        // Load aggregate
        List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);
        if (events.isEmpty()) {
            throw new IllegalArgumentException("Línea de crédito no encontrada con ID: " + id);
        }

        LineaCreditoAggregate aggregate = reconstructAggregateFromEvents(events);

        // Handle delete
        aggregate.handleDelete(deletedBy);

        // Save event
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "LINEA_CREDITO",
                    domainEvent.getEventType(),
                    domainEvent,
                    deletedBy
            );

            publishDomainEvent(domainEvent, id);
        }

        aggregate.markEventsAsCommitted();

        log.info("LineaCredito deleted successfully with ID: {}", id);
    }

    private LineaCreditoAggregate reconstructAggregateFromEvents(List<EventStoreEntity> events) {
        LineaCreditoAggregate aggregate = new LineaCreditoAggregate();

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
            case "LINEA_CREDITO_CREATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), LineaCreditoCreatedEvent.class);
            case "LINEA_CREDITO_UPDATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), LineaCreditoUpdatedEvent.class);
            case "LINEA_CREDITO_DELETED" ->
                    objectMapper.readValue(eventEntity.getEventData(), LineaCreditoDeletedEvent.class);
            default -> throw new IllegalArgumentException("Unknown event type: " + eventType);
        };
    }

    private void publishDomainEvent(DomainEvent domainEvent, Long lineaCreditoId) {
        if (eventPublisher != null) {
            LineaCreditoEvent event = convertDomainEventToEvent(domainEvent, lineaCreditoId);
            eventPublisher.publish("linea-credito-events", lineaCreditoId.toString(), event);
            log.debug("LineaCredito event published via {} for ID: {}",
                    eventPublisher.getProvider(), lineaCreditoId);
        } else {
            log.warn("No event publisher available - event not published to message bus. " +
                    "Event saved to EventStore only. LineaCredito ID: {}", lineaCreditoId);
        }
    }

    private LineaCreditoEvent convertDomainEventToEvent(DomainEvent domainEvent, Long lineaCreditoId) {
        LineaCreditoEvent.EventType eventType = switch (domainEvent.getEventType()) {
            case "LINEA_CREDITO_CREATED" -> LineaCreditoEvent.EventType.CREATED;
            case "LINEA_CREDITO_UPDATED" -> LineaCreditoEvent.EventType.UPDATED;
            case "LINEA_CREDITO_DELETED" -> LineaCreditoEvent.EventType.DELETED;
            default -> throw new IllegalArgumentException("Unknown event type");
        };

        if (domainEvent instanceof LineaCreditoCreatedEvent created) {
            return LineaCreditoEvent.builder()
                    .eventType(eventType)
                    .lineaCreditoId(lineaCreditoId)
                    .clienteId(created.getClienteId())
                    .tipo(created.getTipo())
                    .moneda(created.getMoneda())
                    .montoAutorizado(created.getMontoAutorizado())
                    .montoUtilizado(created.getMontoUtilizado())
                    .montoDisponible(created.getMontoDisponible())
                    .fechaAutorizacion(created.getFechaAutorizacion())
                    .fechaVencimiento(created.getFechaVencimiento())
                    .tasaReferencia(created.getTasaReferencia())
                    .spread(created.getSpread())
                    .estado(created.getEstado())
                    .timestamp(created.getTimestamp())
                    .performedBy(created.getPerformedBy())
                    .eventId(UUID.randomUUID().toString())
                    .build();
        } else if (domainEvent instanceof LineaCreditoUpdatedEvent updated) {
            return LineaCreditoEvent.builder()
                    .eventType(eventType)
                    .lineaCreditoId(lineaCreditoId)
                    .clienteId(updated.getClienteId())
                    .tipo(updated.getTipo())
                    .moneda(updated.getMoneda())
                    .montoAutorizado(updated.getMontoAutorizado())
                    .montoUtilizado(updated.getMontoUtilizado())
                    .montoDisponible(updated.getMontoDisponible())
                    .fechaAutorizacion(updated.getFechaAutorizacion())
                    .fechaVencimiento(updated.getFechaVencimiento())
                    .tasaReferencia(updated.getTasaReferencia())
                    .spread(updated.getSpread())
                    .estado(updated.getEstado())
                    .timestamp(updated.getTimestamp())
                    .performedBy(updated.getPerformedBy())
                    .eventId(UUID.randomUUID().toString())
                    .build();
        } else if (domainEvent instanceof LineaCreditoDeletedEvent deleted) {
            return LineaCreditoEvent.builder()
                    .eventType(eventType)
                    .lineaCreditoId(lineaCreditoId)
                    .estado("ELIMINADA")
                    .timestamp(deleted.getTimestamp())
                    .performedBy(deleted.getPerformedBy())
                    .eventId(UUID.randomUUID().toString())
                    .build();
        }

        throw new IllegalArgumentException("Unknown domain event type");
    }
}
