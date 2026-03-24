package com.globalcmx.api.service.command;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.command.CreateFinancialInstitutionCommand;
import com.globalcmx.api.dto.command.UpdateFinancialInstitutionCommand;
import com.globalcmx.api.dto.event.FinancialInstitutionEvent;
import com.globalcmx.api.entity.FinancialInstitution;
import com.globalcmx.api.eventsourcing.aggregate.FinancialInstitutionAggregate;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.event.DomainEvent;
import com.globalcmx.api.eventsourcing.event.FinancialInstitutionCreatedEvent;
import com.globalcmx.api.eventsourcing.event.FinancialInstitutionDeletedEvent;
import com.globalcmx.api.eventsourcing.event.FinancialInstitutionUpdatedEvent;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.messaging.GenericEventPublisher;
import com.globalcmx.api.readmodel.repository.FinancialInstitutionReadModelRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
public class FinancialInstitutionCommandService {

    private final EventStoreService eventStoreService;
    private final FinancialInstitutionReadModelRepository readModelRepository;
    private final ObjectMapper objectMapper;

    // Inyección del GenericEventPublisher que se adapta a Kafka, Pub/Sub o Service Bus
    @Autowired(required = false)
    private GenericEventPublisher<FinancialInstitutionEvent> eventPublisher;
    public FinancialInstitutionCommandService(EventStoreService eventStoreService,
                                     FinancialInstitutionReadModelRepository readModelRepository,
                                     ObjectMapper objectMapper) {
        this.eventStoreService = eventStoreService;
        this.readModelRepository = readModelRepository;
        this.objectMapper = objectMapper;
    }


    @Transactional(transactionManager = "eventStoreTransactionManager")
    public FinancialInstitution createInstitucionFinanciera(CreateFinancialInstitutionCommand command) {
        log.info("Creating new FinancialInstitution with Event Sourcing - codigo: {}", command.getCodigo());

        // Validate unique codigo
        if (readModelRepository.findByCodigo(command.getCodigo()).isPresent()) {
            throw new IllegalArgumentException("Ya existe una institución financiera con el código: " + command.getCodigo());
        }

        // Generate new ID
        Long institucionId = System.currentTimeMillis();
        String aggregateId = "INSTITUCION_FINANCIERA-" + institucionId;

        // Create aggregate and handle command
        FinancialInstitutionAggregate aggregate = new FinancialInstitutionAggregate(institucionId);
        aggregate.handle(command);

        // Save events to Event Store
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "INSTITUCION_FINANCIERA",
                    domainEvent.getEventType(),
                    domainEvent,
                    command.getCreatedBy()
            );

            // Publish event to messaging system (Kafka, Pub/Sub, or Service Bus)
            publishDomainEvent(domainEvent, institucionId);
        }

        aggregate.markEventsAsCommitted();

        log.info("InstitucionFinanciera created successfully with ID: {} using Event Sourcing", institucionId);

        // Return temporary entity for compatibility
        return FinancialInstitution.builder()
                .id(institucionId)
                .codigo(command.getCodigo())
                .nombre(command.getNombre())
                .swiftCode(command.getSwiftCode())
                .pais(command.getPais())
                .ciudad(command.getCiudad())
                .direccion(command.getDireccion())
                .tipo(command.getTipo())
                .rating(command.getRating())
                .esCorresponsal(command.getEsCorresponsal())
                .activo(command.getActivo() != null ? command.getActivo() : true)
                .build();
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public FinancialInstitution updateInstitucionFinanciera(Long id, UpdateFinancialInstitutionCommand command) {
        log.info("Updating FinancialInstitution with Event Sourcing - ID: {}", id);

        String aggregateId = "INSTITUCION_FINANCIERA-" + id;

        // Load aggregate from Event Store
        List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);
        if (events.isEmpty()) {
            throw new IllegalArgumentException("Institución financiera no encontrada con ID: " + id);
        }

        FinancialInstitutionAggregate aggregate = reconstructAggregateFromEvents(events);

        // Handle update command
        aggregate.handle(command);

        // Save new events
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "INSTITUCION_FINANCIERA",
                    domainEvent.getEventType(),
                    domainEvent,
                    command.getUpdatedBy()
            );

            publishDomainEvent(domainEvent, id);
        }

        aggregate.markEventsAsCommitted();

        log.info("InstitucionFinanciera updated successfully with ID: {}", id);

        return FinancialInstitution.builder()
                .id(id)
                .codigo(aggregate.getCodigo())
                .nombre(aggregate.getNombre())
                .swiftCode(aggregate.getSwiftCode())
                .pais(aggregate.getPais())
                .ciudad(aggregate.getCiudad())
                .direccion(aggregate.getDireccion())
                .tipo(aggregate.getTipo())
                .rating(aggregate.getRating())
                .esCorresponsal(aggregate.getEsCorresponsal())
                .activo(aggregate.getActivo())
                .build();
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public void deleteInstitucionFinanciera(Long id, String deletedBy) {
        log.info("Deleting FinancialInstitution with Event Sourcing - ID: {}", id);

        String aggregateId = "INSTITUCION_FINANCIERA-" + id;

        // Load aggregate
        List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);
        if (events.isEmpty()) {
            throw new IllegalArgumentException("Institución financiera no encontrada con ID: " + id);
        }

        FinancialInstitutionAggregate aggregate = reconstructAggregateFromEvents(events);

        // Handle delete
        aggregate.handleDelete(deletedBy);

        // Save event
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "INSTITUCION_FINANCIERA",
                    domainEvent.getEventType(),
                    domainEvent,
                    deletedBy
            );

            publishDomainEvent(domainEvent, id);
        }

        aggregate.markEventsAsCommitted();

        log.info("InstitucionFinanciera deleted successfully with ID: {}", id);
    }

    private FinancialInstitutionAggregate reconstructAggregateFromEvents(List<EventStoreEntity> events) {
        FinancialInstitutionAggregate aggregate = new FinancialInstitutionAggregate();

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
            case "INSTITUCION_FINANCIERA_CREATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), FinancialInstitutionCreatedEvent.class);
            case "INSTITUCION_FINANCIERA_UPDATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), FinancialInstitutionUpdatedEvent.class);
            case "INSTITUCION_FINANCIERA_DELETED" ->
                    objectMapper.readValue(eventEntity.getEventData(), FinancialInstitutionDeletedEvent.class);
            default -> throw new IllegalArgumentException("Unknown event type: " + eventType);
        };
    }

    private void publishDomainEvent(DomainEvent domainEvent, Long institucionId) {
        if (eventPublisher != null) {
            FinancialInstitutionEvent event = convertDomainEventToEvent(domainEvent, institucionId);
            eventPublisher.publish("institucion-financiera-events", institucionId.toString(), event);
            log.debug("Financial Institution event published via {} for ID: {}",
                    eventPublisher.getProvider(), institucionId);
        } else {
            log.warn("No event publisher available - event not published to message bus. " +
                    "Event saved to EventStore only. Financial Institution ID: {}", institucionId);
        }
    }

    private FinancialInstitutionEvent convertDomainEventToEvent(DomainEvent domainEvent, Long institucionId) {
        FinancialInstitutionEvent.EventType eventType = switch (domainEvent.getEventType()) {
            case "INSTITUCION_FINANCIERA_CREATED" -> FinancialInstitutionEvent.EventType.CREATED;
            case "INSTITUCION_FINANCIERA_UPDATED" -> FinancialInstitutionEvent.EventType.UPDATED;
            case "INSTITUCION_FINANCIERA_DELETED" -> FinancialInstitutionEvent.EventType.DELETED;
            default -> throw new IllegalArgumentException("Unknown event type");
        };

        if (domainEvent instanceof FinancialInstitutionCreatedEvent created) {
            return FinancialInstitutionEvent.builder()
                    .eventType(eventType)
                    .institucionId(institucionId)
                    .codigo(created.getCodigo())
                    .nombre(created.getNombre())
                    .swiftCode(created.getSwiftCode())
                    .pais(created.getPais())
                    .ciudad(created.getCiudad())
                    .direccion(created.getDireccion())
                    .tipo(created.getTipo())
                    .rating(created.getRating())
                    .esCorresponsal(created.getEsCorresponsal())
                    .activo(created.getActivo())
                    .timestamp(created.getTimestamp())
                    .performedBy(created.getPerformedBy())
                    .build();
        } else if (domainEvent instanceof FinancialInstitutionUpdatedEvent updated) {
            return FinancialInstitutionEvent.builder()
                    .eventType(eventType)
                    .institucionId(institucionId)
                    .codigo(updated.getCodigo())
                    .nombre(updated.getNombre())
                    .swiftCode(updated.getSwiftCode())
                    .pais(updated.getPais())
                    .ciudad(updated.getCiudad())
                    .direccion(updated.getDireccion())
                    .tipo(updated.getTipo())
                    .rating(updated.getRating())
                    .esCorresponsal(updated.getEsCorresponsal())
                    .activo(updated.getActivo())
                    .timestamp(updated.getTimestamp())
                    .performedBy(updated.getPerformedBy())
                    .build();
        } else if (domainEvent instanceof FinancialInstitutionDeletedEvent deleted) {
            return FinancialInstitutionEvent.builder()
                    .eventType(eventType)
                    .institucionId(institucionId)
                    .codigo("")
                    .nombre("")
                    .timestamp(deleted.getTimestamp())
                    .performedBy(deleted.getPerformedBy())
                    .build();
        }

        throw new IllegalArgumentException("Unknown domain event type");
    }
}
