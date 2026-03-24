package com.globalcmx.api.service.command;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.command.CreateEventRuleCommand;
import com.globalcmx.api.dto.command.UpdateEventRuleCommand;
import com.globalcmx.api.dto.event.ReglaEventoEvent;
import com.globalcmx.api.entity.ReglaEvento;
import com.globalcmx.api.eventsourcing.aggregate.ReglaEventoAggregate;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.event.DomainEvent;
import com.globalcmx.api.eventsourcing.event.ReglaEventoCreatedEvent;
import com.globalcmx.api.eventsourcing.event.ReglaEventoDeletedEvent;
import com.globalcmx.api.eventsourcing.event.ReglaEventoUpdatedEvent;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.messaging.GenericEventPublisher;
import com.globalcmx.api.readmodel.repository.ReglaEventoReadModelRepository;
import com.globalcmx.api.security.drools.DroolsSecurityValidator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Servicio de comandos para reglas de evento.
 * SEGURIDAD: Valida código DRL antes de guardar para prevenir inyección de código malicioso.
 */
@Service
@Slf4j
public class ReglaEventoCommandService {

    private final EventStoreService eventStoreService;
    // Inyección del GenericEventPublisher que se adapta a Kafka, Pub/Sub o Service Bus
    @Autowired(required = false)
    private GenericEventPublisher<ReglaEventoEvent> eventPublisher;
    private final ReglaEventoReadModelRepository readModelRepository;
    private final ObjectMapper objectMapper;
    private final DroolsSecurityValidator droolsSecurityValidator;

    public ReglaEventoCommandService(EventStoreService eventStoreService,
                                     ReglaEventoReadModelRepository readModelRepository,
                                     ObjectMapper objectMapper,
                                     DroolsSecurityValidator droolsSecurityValidator) {
        this.eventStoreService = eventStoreService;
        this.readModelRepository = readModelRepository;
        this.objectMapper = objectMapper;
        this.droolsSecurityValidator = droolsSecurityValidator;
    }


    @Transactional(transactionManager = "eventStoreTransactionManager")
    public ReglaEvento createReglaEvento(CreateEventRuleCommand command) {
        log.info("Creating new ReglaEvento with Event Sourcing - codigo: {}", command.getCodigo());

        // SEGURIDAD: Validar código DRL antes de guardar
        if (command.getCondicionesDRL() != null && !command.getCondicionesDRL().isEmpty()) {
            droolsSecurityValidator.validateAndThrow(command.getCondicionesDRL());
            log.debug("Código DRL validado exitosamente para regla: {}", command.getCodigo());
        }

        // Validate unique codigo
        if (readModelRepository.findByCodigo(command.getCodigo()).isPresent()) {
            throw new IllegalArgumentException("Ya existe una regla de evento con el código: " + command.getCodigo());
        }

        // Generate new ID
        Long reglaEventoId = System.currentTimeMillis();
        String aggregateId = "REGLA_EVENTO-" + reglaEventoId;

        // Create aggregate and handle command
        ReglaEventoAggregate aggregate = new ReglaEventoAggregate(reglaEventoId);
        aggregate.handle(command);

        // Save events to Event Store
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "REGLA_EVENTO",
                    domainEvent.getEventType(),
                    domainEvent,
                    command.getCreatedBy()
            );

            // Publish event to Kafka
            publishDomainEvent(domainEvent, reglaEventoId);
        }

        aggregate.markEventsAsCommitted();

        log.info("ReglaEvento created successfully with ID: {} using Event Sourcing", reglaEventoId);

        // Return temporary entity for compatibility
        return ReglaEvento.builder()
                .id(reglaEventoId)
                .codigo(command.getCodigo())
                .nombre(command.getNombre())
                .descripcion(command.getDescripcion())
                .tipoOperacion(command.getTipoOperacion())
                .eventoTrigger(command.getEventoTrigger())
                .condicionesDRL(command.getCondicionesDRL())
                .accionesJson(command.getAccionesJson())
                .prioridad(command.getPrioridad())
                .activo(command.getActivo() != null ? command.getActivo() : true)
                .createdBy(command.getCreatedBy())
                .build();
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public ReglaEvento updateReglaEvento(Long id, UpdateEventRuleCommand command) {
        log.info("Updating ReglaEvento with Event Sourcing - ID: {}", id);

        // SEGURIDAD: Validar código DRL antes de actualizar
        if (command.getCondicionesDRL() != null && !command.getCondicionesDRL().isEmpty()) {
            droolsSecurityValidator.validateAndThrow(command.getCondicionesDRL());
            log.debug("Código DRL validado exitosamente para actualización de regla ID: {}", id);
        }

        String aggregateId = "REGLA_EVENTO-" + id;

        // Load aggregate from Event Store
        List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);
        if (events.isEmpty()) {
            throw new IllegalArgumentException("Regla de evento no encontrada con ID: " + id);
        }

        ReglaEventoAggregate aggregate = reconstructAggregateFromEvents(events);

        // Handle update command
        aggregate.handle(command);

        // Save new events
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "REGLA_EVENTO",
                    domainEvent.getEventType(),
                    domainEvent,
                    command.getUpdatedBy()
            );

            publishDomainEvent(domainEvent, id);
        }

        aggregate.markEventsAsCommitted();

        log.info("ReglaEvento updated successfully with ID: {}", id);

        return ReglaEvento.builder()
                .id(id)
                .codigo(aggregate.getCodigo())
                .nombre(aggregate.getNombre())
                .descripcion(aggregate.getDescripcion())
                .tipoOperacion(aggregate.getTipoOperacion())
                .eventoTrigger(aggregate.getEventoTrigger())
                .condicionesDRL(aggregate.getCondicionesDRL())
                .accionesJson(aggregate.getAccionesJson())
                .prioridad(aggregate.getPrioridad())
                .activo(aggregate.getActivo())
                .build();
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public void deleteReglaEvento(Long id, String deletedBy) {
        log.info("Deleting ReglaEvento with Event Sourcing - ID: {}", id);

        String aggregateId = "REGLA_EVENTO-" + id;

        // Load aggregate
        List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);
        if (events.isEmpty()) {
            throw new IllegalArgumentException("Regla de evento no encontrada con ID: " + id);
        }

        ReglaEventoAggregate aggregate = reconstructAggregateFromEvents(events);

        // Handle delete
        aggregate.handleDelete(deletedBy);

        // Save event
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "REGLA_EVENTO",
                    domainEvent.getEventType(),
                    domainEvent,
                    deletedBy
            );

            publishDomainEvent(domainEvent, id);
        }

        aggregate.markEventsAsCommitted();

        log.info("ReglaEvento deleted successfully with ID: {}", id);
    }

    private ReglaEventoAggregate reconstructAggregateFromEvents(List<EventStoreEntity> events) {
        ReglaEventoAggregate aggregate = new ReglaEventoAggregate();

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
            case "REGLA_EVENTO_CREATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), ReglaEventoCreatedEvent.class);
            case "REGLA_EVENTO_UPDATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), ReglaEventoUpdatedEvent.class);
            case "REGLA_EVENTO_DELETED" ->
                    objectMapper.readValue(eventEntity.getEventData(), ReglaEventoDeletedEvent.class);
            default -> throw new IllegalArgumentException("Unknown event type: " + eventType);
        };
    }

    private void publishDomainEvent(DomainEvent domainEvent, Long reglaEventoId) {
        if (eventPublisher != null) {
            ReglaEventoEvent event = convertDomainEventToEvent(domainEvent, reglaEventoId);
            eventPublisher.publish("regla-evento-events", reglaEventoId.toString(), event);
            log.debug("ReglaEvento event published via {} for ID: {}",
                    eventPublisher.getProvider(), reglaEventoId);
        } else {
            log.warn("No event publisher available - event not published to message bus. " +
                    "Event saved to EventStore only. ReglaEvento ID: {}", reglaEventoId);
        }
    }

    private ReglaEventoEvent convertDomainEventToEvent(DomainEvent domainEvent, Long reglaEventoId) {
        ReglaEventoEvent.EventType eventType = switch (domainEvent.getEventType()) {
            case "REGLA_EVENTO_CREATED" -> ReglaEventoEvent.EventType.CREATED;
            case "REGLA_EVENTO_UPDATED" -> ReglaEventoEvent.EventType.UPDATED;
            case "REGLA_EVENTO_DELETED" -> ReglaEventoEvent.EventType.DELETED;
            default -> throw new IllegalArgumentException("Unknown event type");
        };

        if (domainEvent instanceof ReglaEventoCreatedEvent created) {
            return ReglaEventoEvent.builder()
                    .eventType(eventType)
                    .reglaEventoId(reglaEventoId)
                    .codigo(created.getCodigo())
                    .nombre(created.getNombre())
                    .descripcion(created.getDescripcion())
                    .tipoOperacion(created.getTipoOperacion())
                    .eventoTrigger(created.getEventoTrigger())
                    .condicionesDRL(created.getCondicionesDRL())
                    .accionesJson(created.getAccionesJson())
                    .prioridad(created.getPrioridad())
                    .activo(created.getActivo())
                    .timestamp(created.getTimestamp())
                    .performedBy(created.getPerformedBy())
                    .build();
        } else if (domainEvent instanceof ReglaEventoUpdatedEvent updated) {
            return ReglaEventoEvent.builder()
                    .eventType(eventType)
                    .reglaEventoId(reglaEventoId)
                    .codigo(updated.getCodigo())
                    .nombre(updated.getNombre())
                    .descripcion(updated.getDescripcion())
                    .tipoOperacion(updated.getTipoOperacion())
                    .eventoTrigger(updated.getEventoTrigger())
                    .condicionesDRL(updated.getCondicionesDRL())
                    .accionesJson(updated.getAccionesJson())
                    .prioridad(updated.getPrioridad())
                    .activo(updated.getActivo())
                    .timestamp(updated.getTimestamp())
                    .performedBy(updated.getPerformedBy())
                    .build();
        } else if (domainEvent instanceof ReglaEventoDeletedEvent deleted) {
            return ReglaEventoEvent.builder()
                    .eventType(eventType)
                    .reglaEventoId(reglaEventoId)
                    .codigo("")
                    .nombre("")
                    .timestamp(deleted.getTimestamp())
                    .performedBy(deleted.getPerformedBy())
                    .build();
        }

        throw new IllegalArgumentException("Unknown domain event type");
    }
}
