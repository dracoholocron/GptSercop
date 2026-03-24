package com.globalcmx.api.service.command;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.command.CreateLetterOfCreditCommand;
import com.globalcmx.api.dto.command.UpdateLetterOfCreditCommand;
import com.globalcmx.api.dto.event.LetterOfCreditEvent;
import com.globalcmx.api.entity.LetterOfCredit;
import com.globalcmx.api.eventsourcing.aggregate.LetterOfCreditAggregate;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.event.LetterOfCreditCreatedEvent;
import com.globalcmx.api.eventsourcing.event.LetterOfCreditDeletedEvent;
import com.globalcmx.api.eventsourcing.event.LetterOfCreditUpdatedEvent;
import com.globalcmx.api.eventsourcing.event.DomainEvent;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.messaging.GenericEventPublisher;
import com.globalcmx.api.readmodel.repository.OperationReadModelRepository;
import com.globalcmx.api.validation.LetterOfCreditValidationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Slf4j
public class LetterOfCreditCommandService {

    private final EventStoreService eventStoreService;
    @Autowired(required = false)
    private GenericEventPublisher<LetterOfCreditEvent> eventPublisher;
    private final OperationReadModelRepository operationRepository;
    private final ObjectMapper objectMapper;
    private final LetterOfCreditValidationService validationService;

    public LetterOfCreditCommandService(EventStoreService eventStoreService,
                                     OperationReadModelRepository operationRepository,
                                     ObjectMapper objectMapper,
                                     LetterOfCreditValidationService validationService) {
        this.eventStoreService = eventStoreService;
        this.operationRepository = operationRepository;
        this.objectMapper = objectMapper;
        this.validationService = validationService;
    }


    @Transactional(transactionManager = "eventStoreTransactionManager")
    public LetterOfCredit createLetterOfCredit(CreateLetterOfCreditCommand command) {
        log.info("Creating new LetterOfCredit with Event Sourcing - numeroOperacion: {}", command.getNumeroOperacion());

        // Validate unique numeroOperacion against OperationReadModel
        if (operationRepository.findByReference(command.getNumeroOperacion()).isPresent()) {
            throw new IllegalArgumentException("Ya existe una carta de crédito con el número de operación: " + command.getNumeroOperacion());
        }

        // VALIDACIONES DE NEGOCIO CON DROOLS (antes de EventStore)
        log.debug("Ejecutando validaciones de negocio con Drools");
        validationService.validateAndThrow(command);

        // Generate new ID
        Long cartaCreditoId = System.currentTimeMillis();
        String aggregateId = "CARTA_CREDITO-" + cartaCreditoId;

        // Create aggregate and handle command
        LetterOfCreditAggregate aggregate = new LetterOfCreditAggregate(cartaCreditoId);
        aggregate.handle(command);

        // Save events to Event Store
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "CARTA_CREDITO",
                    domainEvent.getEventType(),
                    domainEvent,
                    command.getUsuarioCreacion()
            );

            // Publish event to messaging system (Kafka, Pub/Sub, or Service Bus)
            publishDomainEvent(domainEvent, cartaCreditoId);
        }

        aggregate.markEventsAsCommitted();

        log.info("CartaCredito created successfully with ID: {} using Event Sourcing", cartaCreditoId);

        // Return temporary entity for compatibility
        return LetterOfCredit.builder()
                .id(cartaCreditoId)
                .numeroOperacion(command.getNumeroOperacion())
                .tipoLc(command.getTipoLc())
                .modalidad(command.getModalidad())
                .formaPago(command.getFormaPago())
                .estado(command.getEstado())
                .ordenanteId(command.getOrdenanteId())
                .beneficiarioId(command.getBeneficiarioId())
                .bancoEmisorId(command.getBancoEmisorId())
                .bancoAvisadorId(command.getBancoAvisadorId())
                .bancoConfirmadorId(command.getBancoConfirmadorId())
                .bancoPagadorId(command.getBancoPagadorId())
                .moneda(command.getMoneda())
                .monto(command.getMonto())
                .montoUtilizado(BigDecimal.ZERO)
                .porcentajeTolerancia(command.getPorcentajeTolerancia())
                .fechaEmision(command.getFechaEmision())
                .fechaVencimiento(command.getFechaVencimiento())
                .fechaUltimoEmbarque(command.getFechaUltimoEmbarque())
                .lugarEmbarque(command.getLugarEmbarque())
                .lugarDestino(command.getLugarDestino())
                .requiereFacturaComercial(command.getRequiereFacturaComercial())
                .requierePackingList(command.getRequierePackingList())
                .requiereConocimientoEmbarque(command.getRequiereConocimientoEmbarque())
                .requiereCertificadoOrigen(command.getRequiereCertificadoOrigen())
                .requiereCertificadoSeguro(command.getRequiereCertificadoSeguro())
                .documentosAdicionales(command.getDocumentosAdicionales())
                .incoterm(command.getIncoterm())
                .descripcionMercancia(command.getDescripcionMercancia())
                .condicionesEspeciales(command.getCondicionesEspeciales())
                .instruccionesEmbarque(command.getInstruccionesEmbarque())
                .draft(command.getDraft())
                .build();
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public LetterOfCredit updateCartaCredito(Long id, UpdateLetterOfCreditCommand command) {
        log.info("Updating LetterOfCredit with Event Sourcing - ID: {}", id);

        String aggregateId = "CARTA_CREDITO-" + id;

        // Load aggregate from Event Store
        List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);
        if (events.isEmpty()) {
            throw new IllegalArgumentException("Carta de crédito no encontrada con ID: " + id);
        }

        LetterOfCreditAggregate aggregate = reconstructAggregateFromEvents(events);

        // Handle update command
        aggregate.handle(command);

        // Save new events
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "CARTA_CREDITO",
                    domainEvent.getEventType(),
                    domainEvent,
                    command.getUsuarioModificacion()
            );

            publishDomainEvent(domainEvent, id);
        }

        aggregate.markEventsAsCommitted();

        log.info("CartaCredito updated successfully with ID: {}", id);

        return LetterOfCredit.builder()
                .id(id)
                .numeroOperacion(aggregate.getNumeroOperacion())
                .tipoLc(aggregate.getTipoLc())
                .modalidad(aggregate.getModalidad())
                .formaPago(aggregate.getFormaPago())
                .estado(aggregate.getEstado())
                .ordenanteId(aggregate.getOrdenanteId())
                .beneficiarioId(aggregate.getBeneficiarioId())
                .bancoEmisorId(aggregate.getBancoEmisorId())
                .moneda(aggregate.getMoneda())
                .monto(aggregate.getMonto())
                .montoUtilizado(aggregate.getMontoUtilizado())
                .fechaEmision(aggregate.getFechaEmision())
                .fechaVencimiento(aggregate.getFechaVencimiento())
                .draft(aggregate.getDraft())
                .build();
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public void deleteCartaCredito(Long id, String deletedBy) {
        log.info("Deleting LetterOfCredit with Event Sourcing - ID: {}", id);

        String aggregateId = "CARTA_CREDITO-" + id;

        // Load aggregate
        List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);
        if (events.isEmpty()) {
            throw new IllegalArgumentException("Carta de crédito no encontrada con ID: " + id);
        }

        LetterOfCreditAggregate aggregate = reconstructAggregateFromEvents(events);

        // Handle delete
        aggregate.handleDelete(deletedBy);

        // Save event
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "CARTA_CREDITO",
                    domainEvent.getEventType(),
                    domainEvent,
                    deletedBy
            );

            publishDomainEvent(domainEvent, id);
        }

        aggregate.markEventsAsCommitted();

        log.info("CartaCredito deleted successfully with ID: {}", id);
    }

    private LetterOfCreditAggregate reconstructAggregateFromEvents(List<EventStoreEntity> events) {
        LetterOfCreditAggregate aggregate = new LetterOfCreditAggregate();

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
            case "CARTA_CREDITO_CREATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), LetterOfCreditCreatedEvent.class);
            case "CARTA_CREDITO_UPDATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), LetterOfCreditUpdatedEvent.class);
            case "CARTA_CREDITO_DELETED" ->
                    objectMapper.readValue(eventEntity.getEventData(), LetterOfCreditDeletedEvent.class);
            default -> throw new IllegalArgumentException("Unknown event type: " + eventType);
        };
    }

    private void publishDomainEvent(DomainEvent domainEvent, Long cartaCreditoId) {
        if (eventPublisher != null) {
            LetterOfCreditEvent event = convertDomainEventToEvent(domainEvent, cartaCreditoId);
            eventPublisher.publish("letter-of-credit-events", cartaCreditoId.toString(), event);
            log.debug("LetterOfCredit event published via {} for ID: {}",
                    eventPublisher.getProvider(), cartaCreditoId);
        } else {
            log.warn("No event publisher available - event not published to message bus. " +
                    "Event saved to EventStore only. LetterOfCredit ID: {}", cartaCreditoId);
        }
    }

    private LetterOfCreditEvent convertDomainEventToEvent(DomainEvent domainEvent, Long cartaCreditoId) {
        LetterOfCreditEvent.EventType eventType = switch (domainEvent.getEventType()) {
            case "CARTA_CREDITO_CREATED" -> LetterOfCreditEvent.EventType.CREATED;
            case "CARTA_CREDITO_UPDATED" -> LetterOfCreditEvent.EventType.UPDATED;
            case "CARTA_CREDITO_DELETED" -> LetterOfCreditEvent.EventType.DELETED;
            default -> throw new IllegalArgumentException("Unknown event type");
        };

        if (domainEvent instanceof LetterOfCreditCreatedEvent created) {
            return LetterOfCreditEvent.builder()
                    .eventType(eventType)
                    .cartaCreditoId(cartaCreditoId)
                    .numeroOperacion(created.getNumeroOperacion())
                    .tipoLc(created.getTipoLc())
                    .modalidad(created.getModalidad())
                    .formaPago(created.getFormaPago())
                    .estado(created.getEstado())
                    .ordenanteId(created.getOrdenanteId())
                    .beneficiarioId(created.getBeneficiarioId())
                    .bancoEmisorId(created.getBancoEmisorId())
                    .bancoAvisadorId(created.getBancoAvisadorId())
                    .bancoConfirmadorId(created.getBancoConfirmadorId())
                    .bancoPagadorId(created.getBancoPagadorId())
                    .moneda(created.getMoneda())
                    .monto(created.getMonto())
                    .porcentajeTolerancia(created.getPorcentajeTolerancia())
                    .fechaEmision(created.getFechaEmision())
                    .fechaVencimiento(created.getFechaVencimiento())
                    .fechaUltimoEmbarque(created.getFechaUltimoEmbarque())
                    .lugarEmbarque(created.getLugarEmbarque())
                    .lugarDestino(created.getLugarDestino())
                    .requiereFacturaComercial(created.getRequiereFacturaComercial())
                    .requierePackingList(created.getRequierePackingList())
                    .requiereConocimientoEmbarque(created.getRequiereConocimientoEmbarque())
                    .requiereCertificadoOrigen(created.getRequiereCertificadoOrigen())
                    .requiereCertificadoSeguro(created.getRequiereCertificadoSeguro())
                    .documentosAdicionales(created.getDocumentosAdicionales())
                    .incoterm(created.getIncoterm())
                    .descripcionMercancia(created.getDescripcionMercancia())
                    .condicionesEspeciales(created.getCondicionesEspeciales())
                    .instruccionesEmbarque(created.getInstruccionesEmbarque())
                    .timestamp(created.getTimestamp())
                    .performedBy(created.getPerformedBy())
                    .build();
        } else if (domainEvent instanceof LetterOfCreditUpdatedEvent updated) {
            return LetterOfCreditEvent.builder()
                    .eventType(eventType)
                    .cartaCreditoId(cartaCreditoId)
                    .numeroOperacion(updated.getNumeroOperacion())
                    .tipoLc(updated.getTipoLc())
                    .modalidad(updated.getModalidad())
                    .formaPago(updated.getFormaPago())
                    .estado(updated.getEstado())
                    .ordenanteId(updated.getOrdenanteId())
                    .beneficiarioId(updated.getBeneficiarioId())
                    .bancoEmisorId(updated.getBancoEmisorId())
                    .bancoAvisadorId(updated.getBancoAvisadorId())
                    .bancoConfirmadorId(updated.getBancoConfirmadorId())
                    .bancoPagadorId(updated.getBancoPagadorId())
                    .moneda(updated.getMoneda())
                    .monto(updated.getMonto())
                    .montoUtilizado(updated.getMontoUtilizado())
                    .porcentajeTolerancia(updated.getPorcentajeTolerancia())
                    .fechaEmision(updated.getFechaEmision())
                    .fechaVencimiento(updated.getFechaVencimiento())
                    .fechaUltimoEmbarque(updated.getFechaUltimoEmbarque())
                    .lugarEmbarque(updated.getLugarEmbarque())
                    .lugarDestino(updated.getLugarDestino())
                    .requiereFacturaComercial(updated.getRequiereFacturaComercial())
                    .requierePackingList(updated.getRequierePackingList())
                    .requiereConocimientoEmbarque(updated.getRequiereConocimientoEmbarque())
                    .requiereCertificadoOrigen(updated.getRequiereCertificadoOrigen())
                    .requiereCertificadoSeguro(updated.getRequiereCertificadoSeguro())
                    .documentosAdicionales(updated.getDocumentosAdicionales())
                    .incoterm(updated.getIncoterm())
                    .descripcionMercancia(updated.getDescripcionMercancia())
                    .condicionesEspeciales(updated.getCondicionesEspeciales())
                    .instruccionesEmbarque(updated.getInstruccionesEmbarque())
                    .timestamp(updated.getTimestamp())
                    .performedBy(updated.getPerformedBy())
                    .build();
        } else if (domainEvent instanceof LetterOfCreditDeletedEvent deleted) {
            return LetterOfCreditEvent.builder()
                    .eventType(eventType)
                    .cartaCreditoId(cartaCreditoId)
                    .numeroOperacion("")
                    .timestamp(deleted.getTimestamp())
                    .performedBy(deleted.getPerformedBy())
                    .build();
        }

        throw new IllegalArgumentException("Unknown domain event type");
    }
}
