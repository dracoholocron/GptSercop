package com.globalcmx.api.service.command;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.command.CreateBankAccountCommand;
import com.globalcmx.api.dto.command.UpdateBankAccountCommand;
import com.globalcmx.api.dto.event.CuentaBancariaEvent;
import com.globalcmx.api.entity.CuentaBancaria;
import com.globalcmx.api.eventsourcing.aggregate.CuentaBancariaAggregate;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.event.*;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.messaging.GenericEventPublisher;
import com.globalcmx.api.readmodel.repository.CuentaBancariaReadModelRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
public class CuentaBancariaCommandService {

    private final EventStoreService eventStoreService;
    private final CuentaBancariaReadModelRepository cuentaBancariaReadModelRepository;
    private final ObjectMapper objectMapper;

    // Inyección del GenericEventPublisher que se adapta a Kafka, Pub/Sub o Service Bus
    @Autowired(required = false)
    private GenericEventPublisher<CuentaBancariaEvent> eventPublisher;

    public CuentaBancariaCommandService(EventStoreService eventStoreService,
                                     CuentaBancariaReadModelRepository cuentaBancariaReadModelRepository,
                                     ObjectMapper objectMapper) {
        this.eventStoreService = eventStoreService;
        this.cuentaBancariaReadModelRepository = cuentaBancariaReadModelRepository;
        this.objectMapper = objectMapper;
    }


    @Transactional(transactionManager = "eventStoreTransactionManager")
    public CuentaBancaria createCuentaBancaria(CreateBankAccountCommand command) {
        log.info("Creating new CuentaBancaria with Event Sourcing - identificacionCuenta: {}",
                command.getIdentificacionCuenta());

        // Validar duplicados por identificacionCuenta
        if (cuentaBancariaReadModelRepository.findByIdentificacionCuenta(
                command.getIdentificacionCuenta()).isPresent()) {
            String errorMsg = String.format(
                    "Ya existe una cuenta bancaria con la identificación '%s'",
                    command.getIdentificacionCuenta());
            log.warn(errorMsg);
            throw new IllegalArgumentException(errorMsg);
        }

        // Generate new ID
        Long cuentaBancariaId = System.currentTimeMillis();
        String aggregateId = "CUENTA_BANCARIA-" + cuentaBancariaId;

        // Create aggregate and handle command
        CuentaBancariaAggregate aggregate = new CuentaBancariaAggregate(cuentaBancariaId);
        aggregate.handle(command);

        // Save events to Event Store
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "CUENTA_BANCARIA",
                    domainEvent.getEventType(),
                    domainEvent,
                    command.getCreatedBy()
            );

            // Publish event to messaging system (Kafka, Pub/Sub, or Service Bus)
            publishDomainEvent(domainEvent, cuentaBancariaId);
        }

        aggregate.markEventsAsCommitted();

        log.info("CuentaBancaria created successfully with ID: {} using Event Sourcing", cuentaBancariaId);

        // Return temporary entity for compatibility
        return CuentaBancaria.builder()
                .id(cuentaBancariaId)
                .identificacionParticipante(command.getIdentificacionParticipante())
                .nombresParticipante(command.getNombresParticipante())
                .apellidosParticipante(command.getApellidosParticipante())
                .numeroCuenta(command.getNumeroCuenta())
                .identificacionCuenta(command.getIdentificacionCuenta())
                .tipo(command.getTipo())
                .activo(command.getActivo())
                .createdBy(command.getCreatedBy())
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public CuentaBancaria updateCuentaBancaria(Long id, UpdateBankAccountCommand command) {
        log.info("Updating CuentaBancaria with Event Sourcing - ID: {}", id);

        String aggregateId = "CUENTA_BANCARIA-" + id;

        // Load aggregate from Event Store
        List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);
        if (events.isEmpty()) {
            throw new IllegalArgumentException("Cuenta bancaria no encontrada con ID: " + id);
        }

        CuentaBancariaAggregate aggregate = reconstructAggregateFromEvents(events);

        // Handle update command
        aggregate.handle(command);

        // Save new events
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "CUENTA_BANCARIA",
                    domainEvent.getEventType(),
                    domainEvent,
                    command.getUpdatedBy()
            );

            publishDomainEvent(domainEvent, id);
        }

        aggregate.markEventsAsCommitted();

        log.info("CuentaBancaria updated successfully with ID: {}", id);

        return CuentaBancaria.builder()
                .id(id)
                .identificacionParticipante(aggregate.getIdentificacionParticipante())
                .nombresParticipante(aggregate.getNombresParticipante())
                .apellidosParticipante(aggregate.getApellidosParticipante())
                .numeroCuenta(aggregate.getNumeroCuenta())
                .identificacionCuenta(aggregate.getIdentificacionCuenta())
                .tipo(aggregate.getTipo())
                .activo(aggregate.getActivo())
                .build();
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public void deleteCuentaBancaria(Long id, String deletedBy) {
        log.info("Deleting CuentaBancaria with Event Sourcing - ID: {}", id);

        String aggregateId = "CUENTA_BANCARIA-" + id;

        // Load aggregate
        List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);
        if (events.isEmpty()) {
            throw new IllegalArgumentException("Cuenta bancaria no encontrada con ID: " + id);
        }

        CuentaBancariaAggregate aggregate = reconstructAggregateFromEvents(events);

        // Handle delete
        aggregate.handleDelete(deletedBy);

        // Save event
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "CUENTA_BANCARIA",
                    domainEvent.getEventType(),
                    domainEvent,
                    deletedBy
            );

            publishDomainEvent(domainEvent, id);
        }

        aggregate.markEventsAsCommitted();

        log.info("CuentaBancaria deleted successfully with ID: {}", id);
    }

    private CuentaBancariaAggregate reconstructAggregateFromEvents(List<EventStoreEntity> events) {
        CuentaBancariaAggregate aggregate = new CuentaBancariaAggregate();

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
            case "CUENTA_BANCARIA_CREATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), CuentaBancariaCreatedEvent.class);
            case "CUENTA_BANCARIA_UPDATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), CuentaBancariaUpdatedEvent.class);
            case "CUENTA_BANCARIA_DELETED" ->
                    objectMapper.readValue(eventEntity.getEventData(), CuentaBancariaDeletedEvent.class);
            default -> throw new IllegalArgumentException("Unknown event type: " + eventType);
        };
    }

    private void publishDomainEvent(DomainEvent domainEvent, Long cuentaBancariaId) {
        if (eventPublisher != null) {
            CuentaBancariaEvent event = convertDomainEventToEvent(domainEvent, cuentaBancariaId);
            eventPublisher.publish("cuenta-bancaria-events", cuentaBancariaId.toString(), event);
            log.debug("CuentaBancaria event published via {} for ID: {}",
                    eventPublisher.getProvider(), cuentaBancariaId);
        } else {
            log.warn("No event publisher available - event not published to message bus. " +
                    "Event saved to EventStore only. CuentaBancaria ID: {}", cuentaBancariaId);
        }
    }

    private CuentaBancariaEvent convertDomainEventToEvent(DomainEvent domainEvent, Long cuentaBancariaId) {
        CuentaBancariaEvent.EventType eventType = switch (domainEvent.getEventType()) {
            case "CUENTA_BANCARIA_CREATED" -> CuentaBancariaEvent.EventType.CREATED;
            case "CUENTA_BANCARIA_UPDATED" -> CuentaBancariaEvent.EventType.UPDATED;
            case "CUENTA_BANCARIA_DELETED" -> CuentaBancariaEvent.EventType.DELETED;
            default -> throw new IllegalArgumentException("Unknown event type");
        };

        if (domainEvent instanceof CuentaBancariaCreatedEvent created) {
            return CuentaBancariaEvent.builder()
                    .eventType(eventType)
                    .cuentaBancariaId(cuentaBancariaId)
                    .identificacionParticipante(created.getIdentificacionParticipante())
                    .nombresParticipante(created.getNombresParticipante())
                    .apellidosParticipante(created.getApellidosParticipante())
                    .numeroCuenta(created.getNumeroCuenta())
                    .identificacionCuenta(created.getIdentificacionCuenta())
                    .tipo(created.getTipo())
                    .activo(created.getActivo())
                    .timestamp(created.getTimestamp())
                    .performedBy(created.getPerformedBy())
                    .build();
        } else if (domainEvent instanceof CuentaBancariaUpdatedEvent updated) {
            return CuentaBancariaEvent.builder()
                    .eventType(eventType)
                    .cuentaBancariaId(cuentaBancariaId)
                    .identificacionParticipante(updated.getIdentificacionParticipante())
                    .nombresParticipante(updated.getNombresParticipante())
                    .apellidosParticipante(updated.getApellidosParticipante())
                    .numeroCuenta(updated.getNumeroCuenta())
                    .identificacionCuenta(updated.getIdentificacionCuenta())
                    .tipo(updated.getTipo())
                    .activo(updated.getActivo())
                    .timestamp(updated.getTimestamp())
                    .performedBy(updated.getPerformedBy())
                    .build();
        } else if (domainEvent instanceof CuentaBancariaDeletedEvent deleted) {
            return CuentaBancariaEvent.builder()
                    .eventType(eventType)
                    .cuentaBancariaId(cuentaBancariaId)
                    .timestamp(deleted.getTimestamp())
                    .performedBy(deleted.getPerformedBy())
                    .build();
        }

        throw new IllegalArgumentException("Unknown domain event type");
    }
}
