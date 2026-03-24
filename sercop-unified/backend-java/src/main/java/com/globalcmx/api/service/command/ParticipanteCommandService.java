package com.globalcmx.api.service.command;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.command.CreateParticipantCommand;
import com.globalcmx.api.dto.command.UpdateParticipantCommand;
import com.globalcmx.api.dto.event.ParticipanteEvent;
import com.globalcmx.api.entity.Participante;
import com.globalcmx.api.eventsourcing.aggregate.ParticipanteAggregate;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.event.*;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.messaging.GenericEventPublisher;
import com.globalcmx.api.readmodel.repository.ParticipanteReadModelRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class ParticipanteCommandService {

    private final EventStoreService eventStoreService;
    private final ParticipanteReadModelRepository participanteReadModelRepository;
    private final ObjectMapper objectMapper;

    // Inyección del GenericEventPublisher que se adapta a Kafka, Pub/Sub o Service Bus
    @Autowired(required = false)
    private GenericEventPublisher<ParticipanteEvent> eventPublisher;

    public ParticipanteCommandService(EventStoreService eventStoreService,
                                     ParticipanteReadModelRepository participanteReadModelRepository,
                                     ObjectMapper objectMapper) {
        this.eventStoreService = eventStoreService;
        this.participanteReadModelRepository = participanteReadModelRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public Participante createParticipante(CreateParticipantCommand command) {
        log.info("Creating new Participante with Event Sourcing - identificacion: {}",
                command.getIdentificacion());

        // Validar duplicados por identificación y tipoReferencia
        if (participanteReadModelRepository.findByIdentificacionAndTipoReferencia(
                command.getIdentificacion(), command.getTipoReferencia()).isPresent()) {
            String errorMsg = String.format(
                    "Ya existe un participante con la identificación '%s' y tipo de referencia '%s'",
                    command.getIdentificacion(),
                    command.getTipoReferencia());
            log.warn(errorMsg);
            throw new IllegalArgumentException(errorMsg);
        }

        // Generate new ID
        Long participanteId = System.currentTimeMillis();
        String aggregateId = "PARTICIPANTE-" + participanteId;

        // Create aggregate and handle command
        ParticipanteAggregate aggregate = new ParticipanteAggregate(participanteId);
        aggregate.handle(command);

        // Save events to Event Store
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "PARTICIPANTE",
                    domainEvent.getEventType(),
                    domainEvent,
                    command.getCreatedBy()
            );

            // Publish event to messaging system (Kafka, Pub/Sub, or Service Bus)
            publishDomainEvent(domainEvent, participanteId);
        }

        aggregate.markEventsAsCommitted();

        log.info("Participante created successfully with ID: {} using Event Sourcing", participanteId);

        // Return temporary entity for compatibility
        return Participante.builder()
                .id(participanteId)
                .identificacion(command.getIdentificacion())
                .tipo(command.getTipo())
                .tipoReferencia(command.getTipoReferencia())
                .nombres(command.getNombres())
                .apellidos(command.getApellidos())
                .email(command.getEmail())
                .telefono(command.getTelefono())
                .direccion(command.getDireccion())
                .agencia(command.getAgencia())
                .ejecutivoAsignado(command.getEjecutivoAsignado())
                .ejecutivoId(command.getEjecutivoId())
                .correoEjecutivo(command.getCorreoEjecutivo())
                .autenticador(command.getAutenticador())
                .createdBy(command.getCreatedBy())
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public Participante updateParticipante(Long id, UpdateParticipantCommand command) {
        log.info("Updating Participante with Event Sourcing - ID: {}", id);

        String aggregateId = "PARTICIPANTE-" + id;

        // Load aggregate from Event Store
        List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);
        if (events.isEmpty()) {
            throw new IllegalArgumentException("Participante no encontrado con ID: " + id);
        }

        ParticipanteAggregate aggregate = reconstructAggregateFromEvents(events);

        // Handle update command
        aggregate.handle(command);

        // Save new events
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "PARTICIPANTE",
                    domainEvent.getEventType(),
                    domainEvent,
                    command.getUpdatedBy()
            );

            publishDomainEvent(domainEvent, id);
        }

        aggregate.markEventsAsCommitted();

        log.info("Participante updated successfully with ID: {}", id);

        return Participante.builder()
                .id(id)
                .identificacion(aggregate.getIdentificacion())
                .tipo(aggregate.getTipo())
                .tipoReferencia(aggregate.getTipoReferencia())
                .nombres(aggregate.getNombres())
                .apellidos(aggregate.getApellidos())
                .email(aggregate.getEmail())
                .telefono(aggregate.getTelefono())
                .direccion(aggregate.getDireccion())
                .agencia(aggregate.getAgencia())
                .ejecutivoAsignado(aggregate.getEjecutivoAsignado())
                .ejecutivoId(aggregate.getEjecutivoId())
                .correoEjecutivo(aggregate.getCorreoEjecutivo())
                .autenticador(aggregate.getAutenticador())
                .build();
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public void deleteParticipante(Long id, String deletedBy) {
        log.info("Deleting Participante with Event Sourcing - ID: {}", id);

        String aggregateId = "PARTICIPANTE-" + id;

        // Load aggregate
        List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);
        if (events.isEmpty()) {
            throw new IllegalArgumentException("Participante no encontrado con ID: " + id);
        }

        ParticipanteAggregate aggregate = reconstructAggregateFromEvents(events);

        // Handle delete
        aggregate.handleDelete(deletedBy);

        // Save event
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "PARTICIPANTE",
                    domainEvent.getEventType(),
                    domainEvent,
                    deletedBy
            );

            publishDomainEvent(domainEvent, id);
        }

        aggregate.markEventsAsCommitted();

        log.info("Participante deleted successfully with ID: {}", id);
    }

    private ParticipanteAggregate reconstructAggregateFromEvents(List<EventStoreEntity> events) {
        ParticipanteAggregate aggregate = new ParticipanteAggregate();

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
            case "PARTICIPANTE_CREATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), ParticipanteCreatedEvent.class);
            case "PARTICIPANTE_UPDATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), ParticipanteUpdatedEvent.class);
            case "PARTICIPANTE_DELETED" ->
                    objectMapper.readValue(eventEntity.getEventData(), ParticipanteDeletedEvent.class);
            default -> throw new IllegalArgumentException("Unknown event type: " + eventType);
        };
    }

    private void publishDomainEvent(DomainEvent domainEvent, Long participanteId) {
        if (eventPublisher != null) {
            ParticipanteEvent event = convertDomainEventToEvent(domainEvent, participanteId);
            eventPublisher.publish("participante-events", participanteId.toString(), event);
            log.debug("Participante event published via {} for ID: {}",
                    eventPublisher.getProvider(), participanteId);
        } else {
            log.warn("No event publisher available - event not published to message bus. " +
                    "Event saved to EventStore only. Participante ID: {}", participanteId);
        }
    }

    private ParticipanteEvent convertDomainEventToEvent(DomainEvent domainEvent, Long participanteId) {
        ParticipanteEvent.EventType eventType = switch (domainEvent.getEventType()) {
            case "PARTICIPANTE_CREATED" -> ParticipanteEvent.EventType.CREATED;
            case "PARTICIPANTE_UPDATED" -> ParticipanteEvent.EventType.UPDATED;
            case "PARTICIPANTE_DELETED" -> ParticipanteEvent.EventType.DELETED;
            default -> throw new IllegalArgumentException("Unknown event type");
        };

        if (domainEvent instanceof ParticipanteCreatedEvent created) {
            return ParticipanteEvent.builder()
                    .eventType(eventType)
                    .participanteId(participanteId)
                    .identificacion(created.getIdentificacion())
                    .tipo(created.getTipo())
                    .tipoReferencia(created.getTipoReferencia())
                    .nombres(created.getNombres())
                    .apellidos(created.getApellidos())
                    .email(created.getEmail())
                    .telefono(created.getTelefono())
                    .direccion(created.getDireccion())
                    .agencia(created.getAgencia())
                    .ejecutivoAsignado(created.getEjecutivoAsignado())
                    .ejecutivoId(created.getEjecutivoId())
                    .correoEjecutivo(created.getCorreoEjecutivo())
                    .autenticador(created.getAutenticador())
                    .timestamp(created.getTimestamp())
                    .performedBy(created.getPerformedBy())
                    .build();
        } else if (domainEvent instanceof ParticipanteUpdatedEvent updated) {
            return ParticipanteEvent.builder()
                    .eventType(eventType)
                    .participanteId(participanteId)
                    .identificacion(updated.getIdentificacion())
                    .tipo(updated.getTipo())
                    .tipoReferencia(updated.getTipoReferencia())
                    .nombres(updated.getNombres())
                    .apellidos(updated.getApellidos())
                    .email(updated.getEmail())
                    .telefono(updated.getTelefono())
                    .direccion(updated.getDireccion())
                    .agencia(updated.getAgencia())
                    .ejecutivoAsignado(updated.getEjecutivoAsignado())
                    .ejecutivoId(updated.getEjecutivoId())
                    .correoEjecutivo(updated.getCorreoEjecutivo())
                    .autenticador(updated.getAutenticador())
                    .timestamp(updated.getTimestamp())
                    .performedBy(updated.getPerformedBy())
                    .build();
        } else if (domainEvent instanceof ParticipanteDeletedEvent deleted) {
            return ParticipanteEvent.builder()
                    .eventType(eventType)
                    .participanteId(participanteId)
                    .timestamp(deleted.getTimestamp())
                    .performedBy(deleted.getPerformedBy())
                    .build();
        }

        throw new IllegalArgumentException("Unknown domain event type");
    }
}
