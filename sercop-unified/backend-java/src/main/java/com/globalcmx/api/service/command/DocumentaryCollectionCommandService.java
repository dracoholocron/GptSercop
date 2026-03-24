package com.globalcmx.api.service.command;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.command.CreateDocumentaryCollectionCommand;
import com.globalcmx.api.dto.command.UpdateDocumentaryCollectionCommand;
import com.globalcmx.api.dto.event.DocumentaryCollectionEvent;
import com.globalcmx.api.entity.DocumentaryCollection;
import com.globalcmx.api.eventsourcing.aggregate.DocumentaryCollectionAggregate;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.event.DocumentaryCollectionCreatedEvent;
import com.globalcmx.api.eventsourcing.event.DocumentaryCollectionDeletedEvent;
import com.globalcmx.api.eventsourcing.event.DocumentaryCollectionUpdatedEvent;
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
public class DocumentaryCollectionCommandService {

    private final EventStoreService eventStoreService;
    private final OperationReadModelRepository operationRepository;
    private final ObjectMapper objectMapper;

    @Autowired(required = false)
    private GenericEventPublisher<DocumentaryCollectionEvent> eventPublisher;

    public DocumentaryCollectionCommandService(EventStoreService eventStoreService,
                                     OperationReadModelRepository operationRepository,
                                     ObjectMapper objectMapper) {
        this.eventStoreService = eventStoreService;
        this.operationRepository = operationRepository;
        this.objectMapper = objectMapper;
    }


    @Transactional(transactionManager = "eventStoreTransactionManager")
    public DocumentaryCollection createCobranzaDocumentaria(CreateDocumentaryCollectionCommand command) {
        log.info("Creating new DocumentaryCollection with Event Sourcing - numeroOperacion: {}", command.getNumeroOperacion());

        // Validate unique numeroOperacion against OperationReadModel
        if (operationRepository.findByReference(command.getNumeroOperacion()).isPresent()) {
            throw new IllegalArgumentException("Ya existe una cobranza documentaria con el número de operación: " + command.getNumeroOperacion());
        }

        // Generate new ID
        Long cobranzaId = System.currentTimeMillis();
        String aggregateId = "COBRANZA_DOCUMENTARIA-" + cobranzaId;

        // Create aggregate and handle command
        DocumentaryCollectionAggregate aggregate = new DocumentaryCollectionAggregate(cobranzaId);
        aggregate.handle(command);

        // Save events to Event Store
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "COBRANZA_DOCUMENTARIA",
                    domainEvent.getEventType(),
                    domainEvent,
                    command.getCreatedBy()
            );

            // Publish event to messaging system (Kafka, Pub/Sub, or Service Bus)
            publishDomainEvent(domainEvent, cobranzaId);
        }

        aggregate.markEventsAsCommitted();

        log.info("CobranzaDocumentaria created successfully with ID: {} using Event Sourcing", cobranzaId);

        // Return temporary entity for compatibility
        return DocumentaryCollection.builder()
                .id(cobranzaId)
                .numeroOperacion(command.getNumeroOperacion())
                .tipo(command.getTipo())
                .modalidad(command.getModalidad())
                .estado(command.getEstado())
                .libradorId(command.getLibradorId())
                .libradoId(command.getLibradoId())
                .bancoRemitenteId(command.getBancoRemitenteId())
                .bancoCobradorId(command.getBancoCobradorId())
                .moneda(command.getMoneda())
                .monto(command.getMonto())
                .fechaRecepcion(command.getFechaRecepcion())
                .fechaVencimiento(command.getFechaVencimiento())
                .fechaPago(command.getFechaPago())
                .fechaAceptacion(command.getFechaAceptacion())
                .conocimientoEmbarque(command.getConocimientoEmbarque())
                .facturaComercial(command.getFacturaComercial())
                .certificadoOrigen(command.getCertificadoOrigen())
                .documentosAnexos(command.getDocumentosAnexos())
                .swiftMt400(command.getSwiftMt400())
                .swiftMt410(command.getSwiftMt410())
                .swiftMt412(command.getSwiftMt412())
                .instruccionesProtesto(command.getInstruccionesProtesto())
                .instruccionesImpago(command.getInstruccionesImpago())
                .observaciones(command.getObservaciones())
                .build();
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public DocumentaryCollection updateCobranzaDocumentaria(Long id, UpdateDocumentaryCollectionCommand command) {
        log.info("Updating DocumentaryCollection with Event Sourcing - ID: {}", id);

        String aggregateId = "COBRANZA_DOCUMENTARIA-" + id;

        // Load aggregate from Event Store
        List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);
        if (events.isEmpty()) {
            throw new IllegalArgumentException("Cobranza documentaria no encontrada con ID: " + id);
        }

        DocumentaryCollectionAggregate aggregate = reconstructAggregateFromEvents(events);

        // Handle update command
        aggregate.handle(command);

        // Save new events
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "COBRANZA_DOCUMENTARIA",
                    domainEvent.getEventType(),
                    domainEvent,
                    command.getUpdatedBy()
            );

            publishDomainEvent(domainEvent, id);
        }

        aggregate.markEventsAsCommitted();

        log.info("CobranzaDocumentaria updated successfully with ID: {}", id);

        return DocumentaryCollection.builder()
                .id(id)
                .numeroOperacion(aggregate.getNumeroOperacion())
                .tipo(aggregate.getTipo())
                .modalidad(aggregate.getModalidad())
                .estado(aggregate.getEstado())
                .libradorId(aggregate.getLibradorId())
                .libradoId(aggregate.getLibradoId())
                .bancoRemitenteId(aggregate.getBancoRemitenteId())
                .bancoCobradorId(aggregate.getBancoCobradorId())
                .moneda(aggregate.getMoneda())
                .monto(aggregate.getMonto())
                .fechaRecepcion(aggregate.getFechaRecepcion())
                .fechaVencimiento(aggregate.getFechaVencimiento())
                .fechaPago(aggregate.getFechaPago())
                .fechaAceptacion(aggregate.getFechaAceptacion())
                .conocimientoEmbarque(aggregate.getConocimientoEmbarque())
                .facturaComercial(aggregate.getFacturaComercial())
                .certificadoOrigen(aggregate.getCertificadoOrigen())
                .documentosAnexos(aggregate.getDocumentosAnexos())
                .swiftMt400(aggregate.getSwiftMt400())
                .swiftMt410(aggregate.getSwiftMt410())
                .swiftMt412(aggregate.getSwiftMt412())
                .instruccionesProtesto(aggregate.getInstruccionesProtesto())
                .instruccionesImpago(aggregate.getInstruccionesImpago())
                .observaciones(aggregate.getObservaciones())
                .build();
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public void deleteCobranzaDocumentaria(Long id, String deletedBy) {
        log.info("Deleting DocumentaryCollection with Event Sourcing - ID: {}", id);

        String aggregateId = "COBRANZA_DOCUMENTARIA-" + id;

        // Load aggregate
        List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);
        if (events.isEmpty()) {
            throw new IllegalArgumentException("Cobranza documentaria no encontrada con ID: " + id);
        }

        DocumentaryCollectionAggregate aggregate = reconstructAggregateFromEvents(events);

        // Handle delete
        aggregate.handleDelete(deletedBy);

        // Save event
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "COBRANZA_DOCUMENTARIA",
                    domainEvent.getEventType(),
                    domainEvent,
                    deletedBy
            );

            publishDomainEvent(domainEvent, id);
        }

        aggregate.markEventsAsCommitted();

        log.info("CobranzaDocumentaria deleted successfully with ID: {}", id);
    }

    private DocumentaryCollectionAggregate reconstructAggregateFromEvents(List<EventStoreEntity> events) {
        DocumentaryCollectionAggregate aggregate = new DocumentaryCollectionAggregate();

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
            case "COBRANZA_DOCUMENTARIA_CREATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), DocumentaryCollectionCreatedEvent.class);
            case "COBRANZA_DOCUMENTARIA_UPDATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), DocumentaryCollectionUpdatedEvent.class);
            case "COBRANZA_DOCUMENTARIA_DELETED" ->
                    objectMapper.readValue(eventEntity.getEventData(), DocumentaryCollectionDeletedEvent.class);
            default -> throw new IllegalArgumentException("Unknown event type: " + eventType);
        };
    }

    private void publishDomainEvent(DomainEvent domainEvent, Long cobranzaId) {
        if (eventPublisher != null) {
            DocumentaryCollectionEvent event = convertDomainEventToEvent(domainEvent, cobranzaId);
            eventPublisher.publish("documentary-collections-events", cobranzaId.toString(), event);
            log.debug("Documentary collection event published via {} for ID: {}",
                    eventPublisher.getProvider(), cobranzaId);
        } else {
            log.warn("No event publisher available - event not published to message bus. " +
                    "Event saved to EventStore only. Documentary Collection ID: {}", cobranzaId);
        }
    }

    private DocumentaryCollectionEvent convertDomainEventToEvent(DomainEvent domainEvent, Long cobranzaId) {
        DocumentaryCollectionEvent.EventType eventType = switch (domainEvent.getEventType()) {
            case "COBRANZA_DOCUMENTARIA_CREATED" -> DocumentaryCollectionEvent.EventType.CREATED;
            case "COBRANZA_DOCUMENTARIA_UPDATED" -> DocumentaryCollectionEvent.EventType.UPDATED;
            case "COBRANZA_DOCUMENTARIA_DELETED" -> DocumentaryCollectionEvent.EventType.DELETED;
            default -> throw new IllegalArgumentException("Unknown event type");
        };

        if (domainEvent instanceof DocumentaryCollectionCreatedEvent created) {
            return DocumentaryCollectionEvent.builder()
                    .eventType(eventType)
                    .cobranzaId(cobranzaId)
                    .numeroOperacion(created.getNumeroOperacion())
                    .tipo(created.getTipo())
                    .modalidad(created.getModalidad())
                    .estado(created.getEstado())
                    .libradorId(created.getLibradorId())
                    .libradoId(created.getLibradoId())
                    .bancoRemitenteId(created.getBancoRemitenteId())
                    .bancoCobradorId(created.getBancoCobradorId())
                    .moneda(created.getMoneda())
                    .monto(created.getMonto())
                    .fechaRecepcion(created.getFechaRecepcion())
                    .fechaVencimiento(created.getFechaVencimiento())
                    .fechaPago(created.getFechaPago())
                    .fechaAceptacion(created.getFechaAceptacion())
                    .conocimientoEmbarque(created.getConocimientoEmbarque())
                    .facturaComercial(created.getFacturaComercial())
                    .certificadoOrigen(created.getCertificadoOrigen())
                    .documentosAnexos(created.getDocumentosAnexos())
                    .swiftMt400(created.getSwiftMt400())
                    .swiftMt410(created.getSwiftMt410())
                    .swiftMt412(created.getSwiftMt412())
                    .instruccionesProtesto(created.getInstruccionesProtesto())
                    .instruccionesImpago(created.getInstruccionesImpago())
                    .observaciones(created.getObservaciones())
                    .timestamp(created.getTimestamp())
                    .performedBy(created.getPerformedBy())
                    .build();
        } else if (domainEvent instanceof DocumentaryCollectionUpdatedEvent updated) {
            return DocumentaryCollectionEvent.builder()
                    .eventType(eventType)
                    .cobranzaId(cobranzaId)
                    .numeroOperacion(updated.getNumeroOperacion())
                    .tipo(updated.getTipo())
                    .modalidad(updated.getModalidad())
                    .estado(updated.getEstado())
                    .libradorId(updated.getLibradorId())
                    .libradoId(updated.getLibradoId())
                    .bancoRemitenteId(updated.getBancoRemitenteId())
                    .bancoCobradorId(updated.getBancoCobradorId())
                    .moneda(updated.getMoneda())
                    .monto(updated.getMonto())
                    .fechaRecepcion(updated.getFechaRecepcion())
                    .fechaVencimiento(updated.getFechaVencimiento())
                    .fechaPago(updated.getFechaPago())
                    .fechaAceptacion(updated.getFechaAceptacion())
                    .conocimientoEmbarque(updated.getConocimientoEmbarque())
                    .facturaComercial(updated.getFacturaComercial())
                    .certificadoOrigen(updated.getCertificadoOrigen())
                    .documentosAnexos(updated.getDocumentosAnexos())
                    .swiftMt400(updated.getSwiftMt400())
                    .swiftMt410(updated.getSwiftMt410())
                    .swiftMt412(updated.getSwiftMt412())
                    .instruccionesProtesto(updated.getInstruccionesProtesto())
                    .instruccionesImpago(updated.getInstruccionesImpago())
                    .observaciones(updated.getObservaciones())
                    .timestamp(updated.getTimestamp())
                    .performedBy(updated.getPerformedBy())
                    .build();
        } else if (domainEvent instanceof DocumentaryCollectionDeletedEvent deleted) {
            return DocumentaryCollectionEvent.builder()
                    .eventType(eventType)
                    .cobranzaId(cobranzaId)
                    .numeroOperacion("")
                    .tipo("")
                    .timestamp(deleted.getTimestamp())
                    .performedBy(deleted.getPerformedBy())
                    .build();
        }

        throw new IllegalArgumentException("Unknown domain event type");
    }
}
