package com.globalcmx.api.service.command;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.command.CreateBankGuaranteeCommand;
import com.globalcmx.api.dto.command.UpdateBankGuaranteeCommand;
import com.globalcmx.api.dto.event.BankGuaranteeEvent;
import com.globalcmx.api.entity.BankGuarantee;
import com.globalcmx.api.eventsourcing.aggregate.BankGuaranteeAggregate;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.event.DomainEvent;
import com.globalcmx.api.eventsourcing.event.BankGuaranteeCreatedEvent;
import com.globalcmx.api.eventsourcing.event.BankGuaranteeDeletedEvent;
import com.globalcmx.api.eventsourcing.event.BankGuaranteeUpdatedEvent;
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
public class BankGuaranteeCommandService {

    private final EventStoreService eventStoreService;
    @Autowired(required = false)
    private GenericEventPublisher<BankGuaranteeEvent> eventPublisher;
    private final OperationReadModelRepository operationRepository;
    private final ObjectMapper objectMapper;

    public BankGuaranteeCommandService(EventStoreService eventStoreService,
                                       OperationReadModelRepository operationRepository,
                                       ObjectMapper objectMapper) {
        this.eventStoreService = eventStoreService;
        this.operationRepository = operationRepository;
        this.objectMapper = objectMapper;
    }


    @Transactional(transactionManager = "eventStoreTransactionManager")
    public BankGuarantee createGarantiaBancaria(CreateBankGuaranteeCommand command) {
        log.info("Creating new BankGuarantee with Event Sourcing - numero: {}", command.getNumeroGarantia());

        // Validate unique numero garantia against OperationReadModel
        if (operationRepository.findByReference(command.getNumeroGarantia()).isPresent()) {
            throw new IllegalArgumentException("Ya existe una garantía bancaria con el número: " + command.getNumeroGarantia());
        }

        // Generate new ID
        Long garantiaId = System.currentTimeMillis();
        String aggregateId = "GARANTIA_BANCARIA-" + garantiaId;

        // Create aggregate and handle command
        BankGuaranteeAggregate aggregate = new BankGuaranteeAggregate(garantiaId);
        aggregate.handle(command);

        // Save events to Event Store
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "GARANTIA_BANCARIA",
                    domainEvent.getEventType(),
                    domainEvent,
                    command.getCreatedBy()
            );

            // Publish event to messaging system (Kafka, Pub/Sub, or Service Bus)
            publishDomainEvent(domainEvent, garantiaId);
        }

        aggregate.markEventsAsCommitted();

        log.info("GarantiaBancaria created successfully with ID: {} using Event Sourcing", garantiaId);

        // Return temporary entity for compatibility
        return BankGuarantee.builder()
                .id(garantiaId)
                .numeroGarantia(command.getNumeroGarantia())
                .tipo(command.getTipo())
                .subtipo(command.getSubtipo())
                .estado(command.getEstado())
                .ordenanteId(command.getOrdenanteId())
                .beneficiarioId(command.getBeneficiarioId())
                .bancoGaranteId(command.getBancoGaranteId())
                .bancoContragaranteId(command.getBancoContragaranteId())
                .moneda(command.getMoneda())
                .monto(command.getMonto())
                .porcentajeProyecto(command.getPorcentajeProyecto())
                .fechaEmision(command.getFechaEmision())
                .fechaVencimiento(command.getFechaVencimiento())
                .fechaEjecucion(command.getFechaEjecucion())
                .fechaLiberacion(command.getFechaLiberacion())
                .numeroContrato(command.getNumeroContrato())
                .objetoContrato(command.getObjetoContrato())
                .montoContrato(command.getMontoContrato())
                .descripcion(command.getDescripcion())
                .esReducible(command.getEsReducible())
                .formulaReduccion(command.getFormulaReduccion())
                .condicionesEjecucion(command.getCondicionesEjecucion())
                .condicionesLiberacion(command.getCondicionesLiberacion())
                .swiftMt760(command.getSwiftMt760())
                .swiftMt767(command.getSwiftMt767())
                .build();
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public BankGuarantee updateGarantiaBancaria(Long id, UpdateBankGuaranteeCommand command) {
        log.info("Updating BankGuarantee with Event Sourcing - ID: {}", id);

        String aggregateId = "GARANTIA_BANCARIA-" + id;

        // Load aggregate from Event Store
        List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);
        if (events.isEmpty()) {
            throw new IllegalArgumentException("Garantía bancaria no encontrada con ID: " + id);
        }

        BankGuaranteeAggregate aggregate = reconstructAggregateFromEvents(events);

        // Handle update command
        aggregate.handle(command);

        // Save new events
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "GARANTIA_BANCARIA",
                    domainEvent.getEventType(),
                    domainEvent,
                    command.getUpdatedBy()
            );

            publishDomainEvent(domainEvent, id);
        }

        aggregate.markEventsAsCommitted();

        log.info("GarantiaBancaria updated successfully with ID: {}", id);

        return BankGuarantee.builder()
                .id(id)
                .numeroGarantia(aggregate.getNumeroGarantia())
                .tipo(aggregate.getTipo())
                .subtipo(aggregate.getSubtipo())
                .estado(aggregate.getEstado())
                .ordenanteId(aggregate.getOrdenanteId())
                .beneficiarioId(aggregate.getBeneficiarioId())
                .bancoGaranteId(aggregate.getBancoGaranteId())
                .bancoContragaranteId(aggregate.getBancoContragaranteId())
                .moneda(aggregate.getMoneda())
                .monto(aggregate.getMonto())
                .porcentajeProyecto(aggregate.getPorcentajeProyecto())
                .fechaEmision(aggregate.getFechaEmision())
                .fechaVencimiento(aggregate.getFechaVencimiento())
                .fechaEjecucion(aggregate.getFechaEjecucion())
                .fechaLiberacion(aggregate.getFechaLiberacion())
                .numeroContrato(aggregate.getNumeroContrato())
                .objetoContrato(aggregate.getObjetoContrato())
                .montoContrato(aggregate.getMontoContrato())
                .descripcion(aggregate.getDescripcion())
                .esReducible(aggregate.getEsReducible())
                .formulaReduccion(aggregate.getFormulaReduccion())
                .condicionesEjecucion(aggregate.getCondicionesEjecucion())
                .condicionesLiberacion(aggregate.getCondicionesLiberacion())
                .swiftMt760(aggregate.getSwiftMt760())
                .swiftMt767(aggregate.getSwiftMt767())
                .build();
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public void deleteGarantiaBancaria(Long id, String deletedBy) {
        log.info("Deleting BankGuarantee with Event Sourcing - ID: {}", id);

        String aggregateId = "GARANTIA_BANCARIA-" + id;

        // Load aggregate
        List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);
        if (events.isEmpty()) {
            throw new IllegalArgumentException("Garantía bancaria no encontrada con ID: " + id);
        }

        BankGuaranteeAggregate aggregate = reconstructAggregateFromEvents(events);

        // Handle delete
        aggregate.handleDelete(deletedBy);

        // Save event
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "GARANTIA_BANCARIA",
                    domainEvent.getEventType(),
                    domainEvent,
                    deletedBy
            );

            publishDomainEvent(domainEvent, id);
        }

        aggregate.markEventsAsCommitted();

        log.info("GarantiaBancaria deleted successfully with ID: {}", id);
    }

    private BankGuaranteeAggregate reconstructAggregateFromEvents(List<EventStoreEntity> events) {
        BankGuaranteeAggregate aggregate = new BankGuaranteeAggregate();

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
            case "GARANTIA_BANCARIA_CREATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), BankGuaranteeCreatedEvent.class);
            case "GARANTIA_BANCARIA_UPDATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), BankGuaranteeUpdatedEvent.class);
            case "GARANTIA_BANCARIA_DELETED" ->
                    objectMapper.readValue(eventEntity.getEventData(), BankGuaranteeDeletedEvent.class);
            default -> throw new IllegalArgumentException("Unknown event type: " + eventType);
        };
    }

    private void publishDomainEvent(DomainEvent domainEvent, Long garantiaId) {
        if (eventPublisher != null) {
            BankGuaranteeEvent event = convertDomainEventToEvent(domainEvent, garantiaId);
            eventPublisher.publish("bank-guarantee-events", garantiaId.toString(), event);
            log.debug("Bank guarantee event published via {} for ID: {}",
                    eventPublisher.getProvider(), garantiaId);
        } else {
            log.warn("No event publisher available - event not published to message bus. " +
                    "Event saved to EventStore only. Bank Guarantee ID: {}", garantiaId);
        }
    }

    private BankGuaranteeEvent convertDomainEventToEvent(DomainEvent domainEvent, Long garantiaId) {
        BankGuaranteeEvent.EventType eventType = switch (domainEvent.getEventType()) {
            case "GARANTIA_BANCARIA_CREATED" -> BankGuaranteeEvent.EventType.CREATED;
            case "GARANTIA_BANCARIA_UPDATED" -> BankGuaranteeEvent.EventType.UPDATED;
            case "GARANTIA_BANCARIA_DELETED" -> BankGuaranteeEvent.EventType.DELETED;
            default -> throw new IllegalArgumentException("Unknown event type");
        };

        if (domainEvent instanceof BankGuaranteeCreatedEvent created) {
            return BankGuaranteeEvent.builder()
                    .eventType(eventType)
                    .garantiaId(garantiaId)
                    .numeroGarantia(created.getNumeroGarantia())
                    .tipo(created.getTipo())
                    .subtipo(created.getSubtipo())
                    .estado(created.getEstado())
                    .ordenanteId(created.getOrdenanteId())
                    .beneficiarioId(created.getBeneficiarioId())
                    .bancoGaranteId(created.getBancoGaranteId())
                    .bancoContragaranteId(created.getBancoContragaranteId())
                    .moneda(created.getMoneda())
                    .monto(created.getMonto())
                    .porcentajeProyecto(created.getPorcentajeProyecto())
                    .fechaEmision(created.getFechaEmision())
                    .fechaVencimiento(created.getFechaVencimiento())
                    .fechaEjecucion(created.getFechaEjecucion())
                    .fechaLiberacion(created.getFechaLiberacion())
                    .numeroContrato(created.getNumeroContrato())
                    .objetoContrato(created.getObjetoContrato())
                    .montoContrato(created.getMontoContrato())
                    .descripcion(created.getDescripcion())
                    .esReducible(created.getEsReducible())
                    .formulaReduccion(created.getFormulaReduccion())
                    .condicionesEjecucion(created.getCondicionesEjecucion())
                    .condicionesLiberacion(created.getCondicionesLiberacion())
                    .swiftMt760(created.getSwiftMt760())
                    .swiftMt767(created.getSwiftMt767())
                    .timestamp(created.getTimestamp())
                    .performedBy(created.getPerformedBy())
                    .build();
        } else if (domainEvent instanceof BankGuaranteeUpdatedEvent updated) {
            return BankGuaranteeEvent.builder()
                    .eventType(eventType)
                    .garantiaId(garantiaId)
                    .numeroGarantia(updated.getNumeroGarantia())
                    .tipo(updated.getTipo())
                    .subtipo(updated.getSubtipo())
                    .estado(updated.getEstado())
                    .ordenanteId(updated.getOrdenanteId())
                    .beneficiarioId(updated.getBeneficiarioId())
                    .bancoGaranteId(updated.getBancoGaranteId())
                    .bancoContragaranteId(updated.getBancoContragaranteId())
                    .moneda(updated.getMoneda())
                    .monto(updated.getMonto())
                    .porcentajeProyecto(updated.getPorcentajeProyecto())
                    .fechaEmision(updated.getFechaEmision())
                    .fechaVencimiento(updated.getFechaVencimiento())
                    .fechaEjecucion(updated.getFechaEjecucion())
                    .fechaLiberacion(updated.getFechaLiberacion())
                    .numeroContrato(updated.getNumeroContrato())
                    .objetoContrato(updated.getObjetoContrato())
                    .montoContrato(updated.getMontoContrato())
                    .descripcion(updated.getDescripcion())
                    .esReducible(updated.getEsReducible())
                    .formulaReduccion(updated.getFormulaReduccion())
                    .condicionesEjecucion(updated.getCondicionesEjecucion())
                    .condicionesLiberacion(updated.getCondicionesLiberacion())
                    .swiftMt760(updated.getSwiftMt760())
                    .swiftMt767(updated.getSwiftMt767())
                    .timestamp(updated.getTimestamp())
                    .performedBy(updated.getPerformedBy())
                    .build();
        } else if (domainEvent instanceof BankGuaranteeDeletedEvent deleted) {
            return BankGuaranteeEvent.builder()
                    .eventType(eventType)
                    .garantiaId(garantiaId)
                    .numeroGarantia("")
                    .tipo("")
                    .timestamp(deleted.getTimestamp())
                    .performedBy(deleted.getPerformedBy())
                    .build();
        }

        throw new IllegalArgumentException("Unknown domain event type");
    }
}
