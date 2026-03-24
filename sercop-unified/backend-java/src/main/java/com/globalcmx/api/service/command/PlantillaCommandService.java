package com.globalcmx.api.service.command;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.command.CreateTemplateCommand;
import com.globalcmx.api.dto.command.UpdateTemplateCommand;
import com.globalcmx.api.dto.event.PlantillaEvent;
import com.globalcmx.api.entity.Plantilla;
import com.globalcmx.api.eventsourcing.aggregate.PlantillaAggregate;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.event.DomainEvent;
import com.globalcmx.api.eventsourcing.event.PlantillaCreatedEvent;
import com.globalcmx.api.eventsourcing.event.PlantillaDeletedEvent;
import com.globalcmx.api.eventsourcing.event.PlantillaUpdatedEvent;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.messaging.GenericEventPublisher;
import com.globalcmx.api.readmodel.repository.PlantillaReadModelRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class PlantillaCommandService {

    private final EventStoreService eventStoreService;
    // Inyección del GenericEventPublisher que se adapta a Kafka, Pub/Sub o Service Bus
    @Autowired(required = false)
    private GenericEventPublisher<PlantillaEvent> eventPublisher;
    private final PlantillaReadModelRepository readModelRepository;
    private final ObjectMapper objectMapper;
    public PlantillaCommandService(EventStoreService eventStoreService,
                                     PlantillaReadModelRepository readModelRepository,
                                     ObjectMapper objectMapper) {
        this.eventStoreService = eventStoreService;
        this.readModelRepository = readModelRepository;
        this.objectMapper = objectMapper;
    }


    @Transactional(transactionManager = "eventStoreTransactionManager")
    public Plantilla createPlantilla(CreateTemplateCommand command) {
        log.info("Creating new Plantilla with Event Sourcing - codigo: {}", command.getCodigo());

        // Validate unique codigo
        if (readModelRepository.findByCodigo(command.getCodigo()).isPresent()) {
            throw new IllegalArgumentException("Ya existe una plantilla con el código: " + command.getCodigo());
        }

        // Generate new ID
        Long plantillaId = System.currentTimeMillis();
        String aggregateId = "PLANTILLA-" + plantillaId;

        // Create aggregate and handle command
        PlantillaAggregate aggregate = new PlantillaAggregate(plantillaId);
        aggregate.handle(command);

        // Save events to Event Store
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "PLANTILLA",
                    domainEvent.getEventType(),
                    domainEvent,
                    command.getCreatedBy()
            );

            // Publish event to Kafka
            publishDomainEvent(domainEvent, plantillaId);
        }

        aggregate.markEventsAsCommitted();

        log.info("Plantilla created successfully with ID: {} using Event Sourcing", plantillaId);

        // Return temporary entity for compatibility
        return Plantilla.builder()
                .id(plantillaId)
                .codigo(command.getCodigo())
                .nombre(command.getNombre())
                .descripcion(command.getDescripcion())
                .tipoDocumento(command.getTipoDocumento())
                .nombreArchivo(command.getNombreArchivo())
                .rutaArchivo(command.getRutaArchivo())
                .tamanioArchivo(command.getTamanioArchivo())
                .activo(command.getActivo() != null ? command.getActivo() : true)
                .createdBy(command.getCreatedBy())
                .build();
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public Plantilla updatePlantilla(Long id, UpdateTemplateCommand command) {
        log.info("Updating Plantilla with Event Sourcing - ID: {}", id);

        String aggregateId = "PLANTILLA-" + id;

        // Load aggregate from Event Store
        List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);
        if (events.isEmpty()) {
            throw new IllegalArgumentException("Plantilla no encontrada con ID: " + id);
        }

        PlantillaAggregate aggregate = reconstructAggregateFromEvents(events);

        // Handle update command
        aggregate.handle(command);

        // Save new events
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "PLANTILLA",
                    domainEvent.getEventType(),
                    domainEvent,
                    command.getUpdatedBy()
            );

            publishDomainEvent(domainEvent, id);
        }

        aggregate.markEventsAsCommitted();

        log.info("Plantilla updated successfully with ID: {}", id);

        return Plantilla.builder()
                .id(id)
                .codigo(aggregate.getCodigo())
                .nombre(aggregate.getNombre())
                .descripcion(aggregate.getDescripcion())
                .tipoDocumento(aggregate.getTipoDocumento())
                .nombreArchivo(aggregate.getNombreArchivo())
                .rutaArchivo(aggregate.getRutaArchivo())
                .tamanioArchivo(aggregate.getTamanioArchivo())
                .activo(aggregate.getActivo())
                .build();
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public void deletePlantilla(Long id, String deletedBy) {
        log.info("Deleting Plantilla with Event Sourcing - ID: {}", id);

        String aggregateId = "PLANTILLA-" + id;

        // Load aggregate
        List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);
        if (events.isEmpty()) {
            throw new IllegalArgumentException("Plantilla no encontrada con ID: " + id);
        }

        PlantillaAggregate aggregate = reconstructAggregateFromEvents(events);

        // Handle delete
        aggregate.handleDelete(deletedBy);

        // Save event
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "PLANTILLA",
                    domainEvent.getEventType(),
                    domainEvent,
                    deletedBy
            );

            publishDomainEvent(domainEvent, id);
        }

        aggregate.markEventsAsCommitted();

        log.info("Plantilla deleted successfully with ID: {}", id);
    }

    private PlantillaAggregate reconstructAggregateFromEvents(List<EventStoreEntity> events) {
        PlantillaAggregate aggregate = new PlantillaAggregate();

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
            case "PLANTILLA_CREATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), PlantillaCreatedEvent.class);
            case "PLANTILLA_UPDATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), PlantillaUpdatedEvent.class);
            case "PLANTILLA_DELETED" ->
                    objectMapper.readValue(eventEntity.getEventData(), PlantillaDeletedEvent.class);
            default -> throw new IllegalArgumentException("Unknown event type: " + eventType);
        };
    }

    private void publishDomainEvent(DomainEvent domainEvent, Long plantillaId) {
        if (eventPublisher != null) {
            PlantillaEvent event = convertDomainEventToEvent(domainEvent, plantillaId);
            eventPublisher.publish("plantilla-events", plantillaId.toString(), event);
            log.debug("Plantilla event published via {} for ID: {}",
                    eventPublisher.getProvider(), plantillaId);
        } else {
            log.warn("No event publisher available - event not published to message bus. " +
                    "Event saved to EventStore only. Plantilla ID: {}", plantillaId);
        }
    }

    private PlantillaEvent convertDomainEventToEvent(DomainEvent domainEvent, Long plantillaId) {
        PlantillaEvent.EventType eventType = switch (domainEvent.getEventType()) {
            case "PLANTILLA_CREATED" -> PlantillaEvent.EventType.CREATED;
            case "PLANTILLA_UPDATED" -> PlantillaEvent.EventType.UPDATED;
            case "PLANTILLA_DELETED" -> PlantillaEvent.EventType.DELETED;
            default -> throw new IllegalArgumentException("Unknown event type");
        };

        if (domainEvent instanceof PlantillaCreatedEvent created) {
            return PlantillaEvent.builder()
                    .eventType(eventType)
                    .plantillaId(plantillaId)
                    .codigo(created.getCodigo())
                    .nombre(created.getNombre())
                    .descripcion(created.getDescripcion())
                    .tipoDocumento(created.getTipoDocumento())
                    .nombreArchivo(created.getNombreArchivo())
                    .rutaArchivo(created.getRutaArchivo())
                    .tamanioArchivo(created.getTamanioArchivo())
                    .activo(created.getActivo())
                    .timestamp(created.getTimestamp())
                    .performedBy(created.getPerformedBy())
                    .build();
        } else if (domainEvent instanceof PlantillaUpdatedEvent updated) {
            return PlantillaEvent.builder()
                    .eventType(eventType)
                    .plantillaId(plantillaId)
                    .codigo(updated.getCodigo())
                    .nombre(updated.getNombre())
                    .descripcion(updated.getDescripcion())
                    .tipoDocumento(updated.getTipoDocumento())
                    .nombreArchivo(updated.getNombreArchivo())
                    .rutaArchivo(updated.getRutaArchivo())
                    .tamanioArchivo(updated.getTamanioArchivo())
                    .activo(updated.getActivo())
                    .timestamp(updated.getTimestamp())
                    .performedBy(updated.getPerformedBy())
                    .build();
        } else if (domainEvent instanceof PlantillaDeletedEvent deleted) {
            return PlantillaEvent.builder()
                    .eventType(eventType)
                    .plantillaId(plantillaId)
                    .codigo("")
                    .nombre("")
                    .timestamp(deleted.getTimestamp())
                    .performedBy(deleted.getPerformedBy())
                    .build();
        }

        throw new IllegalArgumentException("Unknown domain event type");
    }
}
