package com.globalcmx.api.service.command;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.command.CreateEmailTemplateCommand;
import com.globalcmx.api.dto.command.UpdateEmailTemplateCommand;
import com.globalcmx.api.dto.event.PlantillaCorreoEvent;
import com.globalcmx.api.entity.PlantillaCorreo;
import com.globalcmx.api.eventsourcing.aggregate.PlantillaCorreoAggregate;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.event.DomainEvent;
import com.globalcmx.api.eventsourcing.event.PlantillaCorreoCreatedEvent;
import com.globalcmx.api.eventsourcing.event.PlantillaCorreoDeletedEvent;
import com.globalcmx.api.eventsourcing.event.PlantillaCorreoUpdatedEvent;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.messaging.GenericEventPublisher;
import com.globalcmx.api.readmodel.repository.PlantillaCorreoReadModelRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
public class PlantillaCorreoCommandService {

    private final EventStoreService eventStoreService;
    // Inyección del GenericEventPublisher que se adapta a Kafka, Pub/Sub o Service Bus
    @Autowired(required = false)
    private GenericEventPublisher<PlantillaCorreoEvent> eventPublisher;
    private final PlantillaCorreoReadModelRepository readModelRepository;
    private final ObjectMapper objectMapper;
    public PlantillaCorreoCommandService(EventStoreService eventStoreService,
                                     PlantillaCorreoReadModelRepository readModelRepository,
                                     ObjectMapper objectMapper) {
        this.eventStoreService = eventStoreService;
        this.readModelRepository = readModelRepository;
        this.objectMapper = objectMapper;
    }


    @Transactional(transactionManager = "eventStoreTransactionManager")
    public PlantillaCorreo createPlantillaCorreo(CreateEmailTemplateCommand command) {
        log.info("Creating new PlantillaCorreo with Event Sourcing - codigo: {}", command.getCodigo());

        // Validate unique codigo
        if (readModelRepository.findByCodigo(command.getCodigo()).isPresent()) {
            throw new IllegalArgumentException("Ya existe una plantilla de correo con el código: " + command.getCodigo());
        }

        // Generate new ID
        Long plantillaCorreoId = System.currentTimeMillis();
        String aggregateId = "PLANTILLA_CORREO-" + plantillaCorreoId;

        // Create aggregate and handle command
        PlantillaCorreoAggregate aggregate = new PlantillaCorreoAggregate(plantillaCorreoId);
        aggregate.handle(command);

        // Save events to Event Store
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "PLANTILLA_CORREO",
                    domainEvent.getEventType(),
                    domainEvent,
                    command.getCreatedBy()
            );

            // Publish event to message bus
            publishDomainEvent(domainEvent, plantillaCorreoId);
        }

        aggregate.markEventsAsCommitted();

        log.info("PlantillaCorreo created successfully with ID: {} using Event Sourcing", plantillaCorreoId);

        // Return temporary entity for compatibility
        return PlantillaCorreo.builder()
                .id(plantillaCorreoId)
                .codigo(command.getCodigo())
                .nombre(command.getNombre())
                .descripcion(command.getDescripcion())
                .asunto(command.getAsunto())
                .cuerpoHtml(command.getCuerpoHtml())
                .plantillasAdjuntas(command.getPlantillasAdjuntas())
                .activo(command.getActivo() != null ? command.getActivo() : true)
                .createdBy(command.getCreatedBy())
                .build();
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public PlantillaCorreo updatePlantillaCorreo(Long id, UpdateEmailTemplateCommand command) {
        log.info("Updating PlantillaCorreo with Event Sourcing - ID: {}", id);

        String aggregateId = "PLANTILLA_CORREO-" + id;

        // Load aggregate from Event Store
        List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);
        if (events.isEmpty()) {
            throw new IllegalArgumentException("Plantilla de correo no encontrada con ID: " + id);
        }

        PlantillaCorreoAggregate aggregate = reconstructAggregateFromEvents(events);

        // Handle update command
        aggregate.handle(command);

        // Save new events
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "PLANTILLA_CORREO",
                    domainEvent.getEventType(),
                    domainEvent,
                    command.getUpdatedBy()
            );

            publishDomainEvent(domainEvent, id);
        }

        aggregate.markEventsAsCommitted();

        log.info("PlantillaCorreo updated successfully with ID: {}", id);

        return PlantillaCorreo.builder()
                .id(id)
                .codigo(aggregate.getCodigo())
                .nombre(aggregate.getNombre())
                .descripcion(aggregate.getDescripcion())
                .asunto(aggregate.getAsunto())
                .cuerpoHtml(aggregate.getCuerpoHtml())
                .plantillasAdjuntas(aggregate.getPlantillasAdjuntas())
                .activo(aggregate.getActivo())
                .build();
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public void deletePlantillaCorreo(Long id, String deletedBy) {
        log.info("Deleting PlantillaCorreo with Event Sourcing - ID: {}", id);

        String aggregateId = "PLANTILLA_CORREO-" + id;

        // Load aggregate
        List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);
        if (events.isEmpty()) {
            throw new IllegalArgumentException("Plantilla de correo no encontrada con ID: " + id);
        }

        PlantillaCorreoAggregate aggregate = reconstructAggregateFromEvents(events);

        // Handle delete
        aggregate.handleDelete(deletedBy);

        // Save event
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "PLANTILLA_CORREO",
                    domainEvent.getEventType(),
                    domainEvent,
                    deletedBy
            );

            publishDomainEvent(domainEvent, id);
        }

        aggregate.markEventsAsCommitted();

        log.info("PlantillaCorreo deleted successfully with ID: {}", id);
    }

    private PlantillaCorreoAggregate reconstructAggregateFromEvents(List<EventStoreEntity> events) {
        PlantillaCorreoAggregate aggregate = new PlantillaCorreoAggregate();

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
            case "PLANTILLA_CORREO_CREATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), PlantillaCorreoCreatedEvent.class);
            case "PLANTILLA_CORREO_UPDATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), PlantillaCorreoUpdatedEvent.class);
            case "PLANTILLA_CORREO_DELETED" ->
                    objectMapper.readValue(eventEntity.getEventData(), PlantillaCorreoDeletedEvent.class);
            default -> throw new IllegalArgumentException("Unknown event type: " + eventType);
        };
    }

    private void publishDomainEvent(DomainEvent domainEvent, Long plantillaCorreoId) {
        if (eventPublisher != null) {
            PlantillaCorreoEvent event = convertDomainEventToEvent(domainEvent, plantillaCorreoId);
            eventPublisher.publish("plantilla-correo-events", plantillaCorreoId.toString(), event);
            log.debug("PlantillaCorreo event published via {} for ID: {}",
                    eventPublisher.getProvider(), plantillaCorreoId);
        } else {
            log.warn("No event publisher available - event not published to message bus. " +
                    "Event saved to EventStore only. PlantillaCorreo ID: {}", plantillaCorreoId);
        }
    }

    private PlantillaCorreoEvent convertDomainEventToEvent(DomainEvent domainEvent, Long plantillaCorreoId) {
        PlantillaCorreoEvent.EventType eventType = switch (domainEvent.getEventType()) {
            case "PLANTILLA_CORREO_CREATED" -> PlantillaCorreoEvent.EventType.CREATED;
            case "PLANTILLA_CORREO_UPDATED" -> PlantillaCorreoEvent.EventType.UPDATED;
            case "PLANTILLA_CORREO_DELETED" -> PlantillaCorreoEvent.EventType.DELETED;
            default -> throw new IllegalArgumentException("Unknown event type");
        };

        if (domainEvent instanceof PlantillaCorreoCreatedEvent created) {
            return PlantillaCorreoEvent.builder()
                    .eventType(eventType)
                    .plantillaCorreoId(plantillaCorreoId)
                    .codigo(created.getCodigo())
                    .nombre(created.getNombre())
                    .descripcion(created.getDescripcion())
                    .asunto(created.getAsunto())
                    .cuerpoHtml(created.getCuerpoHtml())
                    .plantillasAdjuntas(created.getPlantillasAdjuntas())
                    .activo(created.getActivo())
                    .timestamp(created.getTimestamp())
                    .performedBy(created.getPerformedBy())
                    .build();
        } else if (domainEvent instanceof PlantillaCorreoUpdatedEvent updated) {
            return PlantillaCorreoEvent.builder()
                    .eventType(eventType)
                    .plantillaCorreoId(plantillaCorreoId)
                    .codigo(updated.getCodigo())
                    .nombre(updated.getNombre())
                    .descripcion(updated.getDescripcion())
                    .asunto(updated.getAsunto())
                    .cuerpoHtml(updated.getCuerpoHtml())
                    .plantillasAdjuntas(updated.getPlantillasAdjuntas())
                    .activo(updated.getActivo())
                    .timestamp(updated.getTimestamp())
                    .performedBy(updated.getPerformedBy())
                    .build();
        } else if (domainEvent instanceof PlantillaCorreoDeletedEvent deleted) {
            return PlantillaCorreoEvent.builder()
                    .eventType(eventType)
                    .plantillaCorreoId(plantillaCorreoId)
                    .codigo("")
                    .nombre("")
                    .timestamp(deleted.getTimestamp())
                    .performedBy(deleted.getPerformedBy())
                    .build();
        }

        throw new IllegalArgumentException("Unknown domain event type");
    }
}
