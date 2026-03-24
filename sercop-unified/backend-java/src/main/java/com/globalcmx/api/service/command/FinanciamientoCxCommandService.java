package com.globalcmx.api.service.command;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.command.CreateTradeFinancingCommand;
import com.globalcmx.api.dto.command.UpdateTradeFinancingCommand;
import com.globalcmx.api.dto.event.FinanciamientoCxEvent;
import com.globalcmx.api.entity.FinanciamientoCx;
import com.globalcmx.api.eventsourcing.aggregate.FinanciamientoCxAggregate;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.event.FinanciamientoCxCreatedEvent;
import com.globalcmx.api.eventsourcing.event.FinanciamientoCxDeletedEvent;
import com.globalcmx.api.eventsourcing.event.FinanciamientoCxUpdatedEvent;
import com.globalcmx.api.eventsourcing.event.DomainEvent;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.messaging.GenericEventPublisher;
import com.globalcmx.api.readmodel.repository.OperationReadModelRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
public class FinanciamientoCxCommandService {

    private final EventStoreService eventStoreService;
    private final OperationReadModelRepository operationRepository;
    private final ObjectMapper objectMapper;

    @Autowired(required = false)
    private GenericEventPublisher<FinanciamientoCxEvent> eventPublisher;

    public FinanciamientoCxCommandService(EventStoreService eventStoreService,
                                     OperationReadModelRepository operationRepository,
                                     ObjectMapper objectMapper) {
        this.eventStoreService = eventStoreService;
        this.operationRepository = operationRepository;
        this.objectMapper = objectMapper;
    }


    @Transactional(transactionManager = "eventStoreTransactionManager")
    public FinanciamientoCx createFinanciamientoCx(CreateTradeFinancingCommand command) {
        log.info("Creating new FinanciamientoCx with Event Sourcing - numeroOperacion: {}", command.getNumeroOperacion());

        // Validate unique numeroOperacion against OperationReadModel
        if (operationRepository.findByReference(command.getNumeroOperacion()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un financiamiento con el numero de operacion: " + command.getNumeroOperacion());
        }

        // Generate new ID
        Long financiamientoCxId = System.currentTimeMillis();
        String aggregateId = "FINANCIAMIENTO_CX-" + financiamientoCxId;

        // Create aggregate and handle command
        FinanciamientoCxAggregate aggregate = new FinanciamientoCxAggregate(financiamientoCxId);
        aggregate.handle(command);

        // Save events to Event Store
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "FINANCIAMIENTO_CX",
                    domainEvent.getEventType(),
                    domainEvent,
                    command.getUsuarioCreacion()
            );

            // Publish event to Kafka
            publishDomainEvent(domainEvent, financiamientoCxId);
        }

        aggregate.markEventsAsCommitted();

        log.info("FinanciamientoCx created successfully with ID: {} using Event Sourcing", financiamientoCxId);

        // Return temporary entity for compatibility
        return FinanciamientoCx.builder()
                .id(financiamientoCxId)
                .numeroOperacion(command.getNumeroOperacion())
                .tipo(command.getTipo())
                .clienteId(command.getClienteId())
                .moneda(command.getMoneda())
                .montoSolicitado(command.getMontoSolicitado())
                .estado(command.getEstado())
                .operacionVinculadaTipo(command.getOperacionVinculadaTipo())
                .operacionVinculadaId(command.getOperacionVinculadaId())
                .lineaCreditoId(command.getLineaCreditoId())
                .montoAprobado(command.getMontoAprobado())
                .montoDesembolsado(command.getMontoDesembolsado())
                .plazoDias(command.getPlazoDias())
                .tasaInteres(command.getTasaInteres())
                .tasaMora(command.getTasaMora())
                .comisionApertura(command.getComisionApertura())
                .fechaDesembolso(command.getFechaDesembolso())
                .fechaVencimiento(command.getFechaVencimiento())
                .tipoGarantia(command.getTipoGarantia())
                .descripcionGarantia(command.getDescripcionGarantia())
                .build();
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public FinanciamientoCx updateFinanciamientoCx(Long id, UpdateTradeFinancingCommand command) {
        log.info("Updating FinanciamientoCx with Event Sourcing - ID: {}", id);

        String aggregateId = "FINANCIAMIENTO_CX-" + id;

        // Load aggregate from Event Store
        List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);
        if (events.isEmpty()) {
            throw new IllegalArgumentException("Financiamiento no encontrado con ID: " + id);
        }

        FinanciamientoCxAggregate aggregate = reconstructAggregateFromEvents(events);

        // Handle update command
        aggregate.handle(command);

        // Save new events
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "FINANCIAMIENTO_CX",
                    domainEvent.getEventType(),
                    domainEvent,
                    command.getUsuarioModificacion()
            );

            publishDomainEvent(domainEvent, id);
        }

        aggregate.markEventsAsCommitted();

        log.info("FinanciamientoCx updated successfully with ID: {}", id);

        return FinanciamientoCx.builder()
                .id(id)
                .numeroOperacion(aggregate.getNumeroOperacion())
                .tipo(aggregate.getTipo())
                .clienteId(aggregate.getClienteId())
                .moneda(aggregate.getMoneda())
                .montoSolicitado(aggregate.getMontoSolicitado())
                .estado(aggregate.getEstado())
                .operacionVinculadaTipo(aggregate.getOperacionVinculadaTipo())
                .operacionVinculadaId(aggregate.getOperacionVinculadaId())
                .lineaCreditoId(aggregate.getLineaCreditoId())
                .montoAprobado(aggregate.getMontoAprobado())
                .montoDesembolsado(aggregate.getMontoDesembolsado())
                .plazoDias(aggregate.getPlazoDias())
                .tasaInteres(aggregate.getTasaInteres())
                .tasaMora(aggregate.getTasaMora())
                .comisionApertura(aggregate.getComisionApertura())
                .fechaDesembolso(aggregate.getFechaDesembolso())
                .fechaVencimiento(aggregate.getFechaVencimiento())
                .tipoGarantia(aggregate.getTipoGarantia())
                .descripcionGarantia(aggregate.getDescripcionGarantia())
                .build();
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public void deleteFinanciamientoCx(Long id, String deletedBy) {
        log.info("Deleting FinanciamientoCx with Event Sourcing - ID: {}", id);

        String aggregateId = "FINANCIAMIENTO_CX-" + id;

        // Load aggregate
        List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);
        if (events.isEmpty()) {
            throw new IllegalArgumentException("Financiamiento no encontrado con ID: " + id);
        }

        FinanciamientoCxAggregate aggregate = reconstructAggregateFromEvents(events);

        // Handle delete
        aggregate.handleDelete(deletedBy);

        // Save event
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "FINANCIAMIENTO_CX",
                    domainEvent.getEventType(),
                    domainEvent,
                    deletedBy
            );

            publishDomainEvent(domainEvent, id);
        }

        aggregate.markEventsAsCommitted();

        log.info("FinanciamientoCx deleted successfully with ID: {}", id);
    }

    private FinanciamientoCxAggregate reconstructAggregateFromEvents(List<EventStoreEntity> events) {
        FinanciamientoCxAggregate aggregate = new FinanciamientoCxAggregate();

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
            case "FINANCIAMIENTO_CX_CREATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), FinanciamientoCxCreatedEvent.class);
            case "FINANCIAMIENTO_CX_UPDATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), FinanciamientoCxUpdatedEvent.class);
            case "FINANCIAMIENTO_CX_DELETED" ->
                    objectMapper.readValue(eventEntity.getEventData(), FinanciamientoCxDeletedEvent.class);
            default -> throw new IllegalArgumentException("Unknown event type: " + eventType);
        };
    }

    private void publishDomainEvent(DomainEvent domainEvent, Long financiamientoCxId) {
        if (eventPublisher != null) {
            FinanciamientoCxEvent event = convertDomainEventToEvent(domainEvent, financiamientoCxId);
            eventPublisher.publish("financiamiento-cx-events", financiamientoCxId.toString(), event);
            log.debug("FinanciamientoCx event published via {} for ID: {}",
                    eventPublisher.getProvider(), financiamientoCxId);
        } else {
            log.warn("No event publisher available - event not published to message bus. " +
                    "Event saved to EventStore only. FinanciamientoCx ID: {}", financiamientoCxId);
        }
    }

    private FinanciamientoCxEvent convertDomainEventToEvent(DomainEvent domainEvent, Long financiamientoCxId) {
        FinanciamientoCxEvent.EventType eventType = switch (domainEvent.getEventType()) {
            case "FINANCIAMIENTO_CX_CREATED" -> FinanciamientoCxEvent.EventType.CREATED;
            case "FINANCIAMIENTO_CX_UPDATED" -> FinanciamientoCxEvent.EventType.UPDATED;
            case "FINANCIAMIENTO_CX_DELETED" -> FinanciamientoCxEvent.EventType.DELETED;
            default -> throw new IllegalArgumentException("Unknown event type");
        };

        if (domainEvent instanceof FinanciamientoCxCreatedEvent created) {
            return FinanciamientoCxEvent.builder()
                    .eventType(eventType)
                    .financiamientoCxId(financiamientoCxId)
                    .numeroOperacion(created.getNumeroOperacion())
                    .tipo(created.getTipo())
                    .clienteId(created.getClienteId())
                    .moneda(created.getMoneda())
                    .montoSolicitado(created.getMontoSolicitado())
                    .estado(created.getEstado())
                    .operacionVinculadaTipo(created.getOperacionVinculadaTipo())
                    .operacionVinculadaId(created.getOperacionVinculadaId())
                    .lineaCreditoId(created.getLineaCreditoId())
                    .montoAprobado(created.getMontoAprobado())
                    .montoDesembolsado(created.getMontoDesembolsado())
                    .plazoDias(created.getPlazoDias())
                    .tasaInteres(created.getTasaInteres())
                    .tasaMora(created.getTasaMora())
                    .comisionApertura(created.getComisionApertura())
                    .fechaDesembolso(created.getFechaDesembolso())
                    .fechaVencimiento(created.getFechaVencimiento())
                    .tipoGarantia(created.getTipoGarantia())
                    .descripcionGarantia(created.getDescripcionGarantia())
                    .timestamp(created.getTimestamp())
                    .performedBy(created.getPerformedBy())
                    .build();
        } else if (domainEvent instanceof FinanciamientoCxUpdatedEvent updated) {
            return FinanciamientoCxEvent.builder()
                    .eventType(eventType)
                    .financiamientoCxId(financiamientoCxId)
                    .numeroOperacion(updated.getNumeroOperacion())
                    .tipo(updated.getTipo())
                    .clienteId(updated.getClienteId())
                    .moneda(updated.getMoneda())
                    .montoSolicitado(updated.getMontoSolicitado())
                    .estado(updated.getEstado())
                    .operacionVinculadaTipo(updated.getOperacionVinculadaTipo())
                    .operacionVinculadaId(updated.getOperacionVinculadaId())
                    .lineaCreditoId(updated.getLineaCreditoId())
                    .montoAprobado(updated.getMontoAprobado())
                    .montoDesembolsado(updated.getMontoDesembolsado())
                    .plazoDias(updated.getPlazoDias())
                    .tasaInteres(updated.getTasaInteres())
                    .tasaMora(updated.getTasaMora())
                    .comisionApertura(updated.getComisionApertura())
                    .fechaDesembolso(updated.getFechaDesembolso())
                    .fechaVencimiento(updated.getFechaVencimiento())
                    .tipoGarantia(updated.getTipoGarantia())
                    .descripcionGarantia(updated.getDescripcionGarantia())
                    .timestamp(updated.getTimestamp())
                    .performedBy(updated.getPerformedBy())
                    .build();
        } else if (domainEvent instanceof FinanciamientoCxDeletedEvent deleted) {
            return FinanciamientoCxEvent.builder()
                    .eventType(eventType)
                    .financiamientoCxId(financiamientoCxId)
                    .numeroOperacion("")
                    .timestamp(deleted.getTimestamp())
                    .performedBy(deleted.getPerformedBy())
                    .build();
        }

        throw new IllegalArgumentException("Unknown domain event type");
    }
}
