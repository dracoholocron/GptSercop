package com.globalcmx.api.service.command;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.command.CreateCustomCatalogCommand;
import com.globalcmx.api.dto.command.UpdateCustomCatalogCommand;
import com.globalcmx.api.dto.event.CatalogoPersonalizadoEvent;
import com.globalcmx.api.entity.CatalogoPersonalizado;
import com.globalcmx.api.eventsourcing.aggregate.CatalogoPersonalizadoAggregate;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.event.*;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.messaging.GenericEventPublisher;
import com.globalcmx.api.readmodel.entity.CatalogoPersonalizadoReadModel;
import com.globalcmx.api.readmodel.repository.CatalogoPersonalizadoReadModelRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class CatalogoPersonalizadoCommandService {

    private final EventStoreService eventStoreService;
    private final CatalogoPersonalizadoReadModelRepository catalogoPersonalizadoReadModelRepository;
    private final ObjectMapper objectMapper;

    // Inyección del GenericEventPublisher que se adapta a Kafka, Pub/Sub o Service Bus
    @Autowired(required = false)
    private GenericEventPublisher<CatalogoPersonalizadoEvent> eventPublisher;

    public CatalogoPersonalizadoCommandService(EventStoreService eventStoreService,
                                     CatalogoPersonalizadoReadModelRepository catalogoPersonalizadoReadModelRepository,
                                     ObjectMapper objectMapper) {
        this.eventStoreService = eventStoreService;
        this.catalogoPersonalizadoReadModelRepository = catalogoPersonalizadoReadModelRepository;
        this.objectMapper = objectMapper;
    }


    @Transactional(transactionManager = "eventStoreTransactionManager")
    public CatalogoPersonalizado createCatalogoPersonalizado(CreateCustomCatalogCommand command) {
        log.info("Creating new CatalogoPersonalizado with Event Sourcing - codigo: {}",
                command.getCodigo());

        // Validar nivel
        if (command.getNivel() < 1 || command.getNivel() > 2) {
            throw new IllegalArgumentException("El nivel debe ser 1 o 2");
        }

        // Validar duplicados por código considerando el catálogo padre
        if (command.getNivel() == 1) {
            // Para nivel 1, validar que no exista otro catálogo de nivel 1 con el mismo código
            Optional<CatalogoPersonalizadoReadModel> existing =
                catalogoPersonalizadoReadModelRepository.findByCodigoAndNivel(command.getCodigo(), 1);
            if (existing.isPresent()) {
                String errorMsg = String.format(
                        "Ya existe un catálogo personalizado de nivel 1 con el código '%s'",
                        command.getCodigo());
                log.warn(errorMsg);
                throw new IllegalArgumentException(errorMsg);
            }
        } else if (command.getNivel() == 2) {
            // Para nivel 2, validar que no exista otro catálogo con el mismo código en el mismo catálogo padre
            if (command.getCatalogoPadreId() != null) {
                Optional<CatalogoPersonalizadoReadModel> existing =
                    catalogoPersonalizadoReadModelRepository.findByCodigoAndCatalogoPadreId(
                        command.getCodigo(), command.getCatalogoPadreId());
                if (existing.isPresent()) {
                    String errorMsg = String.format(
                            "Ya existe un catálogo personalizado con el código '%s' en el catálogo padre seleccionado",
                            command.getCodigo());
                    log.warn(errorMsg);
                    throw new IllegalArgumentException(errorMsg);
                }
            }
        }

        // Validar que nivel 2 tenga catalogoPadreId
        String codigoCatalogoPadre = null;
        String nombreCatalogoPadre = null;

        if (command.getNivel() == 2) {
            if (command.getCatalogoPadreId() == null) {
                throw new IllegalArgumentException("El catalogoPadreId es requerido para registros de nivel 2");
            }

            // Buscar el catálogo padre y validar que sea nivel 1
            CatalogoPersonalizadoReadModel catalogoPadre = catalogoPersonalizadoReadModelRepository
                    .findById(command.getCatalogoPadreId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "El catálogo padre con ID " + command.getCatalogoPadreId() + " no existe"));

            if (catalogoPadre.getNivel() != 1) {
                throw new IllegalArgumentException(
                        "El catálogo padre debe ser de nivel 1");
            }

            codigoCatalogoPadre = catalogoPadre.getCodigo();
            nombreCatalogoPadre = catalogoPadre.getNombre();
        } else {
            // Nivel 1 no debe tener catalogoPadreId
            if (command.getCatalogoPadreId() != null) {
                throw new IllegalArgumentException("Los catálogos de nivel 1 no deben tener catalogoPadreId");
            }
        }

        // Generate new ID
        Long catalogoPersonalizadoId = System.currentTimeMillis();
        String aggregateId = "CATALOGO_PERSONALIZADO-" + catalogoPersonalizadoId;

        // Create aggregate and handle command
        CatalogoPersonalizadoAggregate aggregate = new CatalogoPersonalizadoAggregate(catalogoPersonalizadoId);
        aggregate.handle(command);

        // Get the uncommitted event and set parent catalog info
        List<DomainEvent> uncommittedEvents = aggregate.getUncommittedEvents();
        if (!uncommittedEvents.isEmpty() && uncommittedEvents.get(0) instanceof CatalogoPersonalizadoCreatedEvent) {
            CatalogoPersonalizadoCreatedEvent createdEvent = (CatalogoPersonalizadoCreatedEvent) uncommittedEvents.get(0);
            // Update event with parent catalog info
            if (command.getNivel() == 2) {
                createdEvent = new CatalogoPersonalizadoCreatedEvent(
                        createdEvent.getCatalogoPersonalizadoId(),
                        createdEvent.getCodigo(),
                        createdEvent.getNombre(),
                        createdEvent.getDescripcion(),
                        createdEvent.getNivel(),
                        createdEvent.getCatalogoPadreId(),
                        codigoCatalogoPadre,
                        nombreCatalogoPadre,
                        createdEvent.getActivo(),
                        createdEvent.getOrden(),
                        createdEvent.getPerformedBy()
                );
                uncommittedEvents.clear();
                uncommittedEvents.add(createdEvent);
            }
        }

        // Save events to Event Store
        for (DomainEvent domainEvent : uncommittedEvents) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "CATALOGO_PERSONALIZADO",
                    domainEvent.getEventType(),
                    domainEvent,
                    command.getCreatedBy()
            );

            // Publish event to messaging system (Kafka, Pub/Sub, or Service Bus)
            publishDomainEvent(domainEvent, catalogoPersonalizadoId);
        }

        aggregate.markEventsAsCommitted();

        log.info("CatalogoPersonalizado created successfully with ID: {} using Event Sourcing", catalogoPersonalizadoId);

        // Return temporary entity for compatibility
        return CatalogoPersonalizado.builder()
                .id(catalogoPersonalizadoId)
                .codigo(command.getCodigo())
                .nombre(command.getNombre())
                .descripcion(command.getDescripcion())
                .nivel(command.getNivel())
                .catalogoPadreId(command.getCatalogoPadreId())
                .codigoCatalogoPadre(codigoCatalogoPadre)
                .nombreCatalogoPadre(nombreCatalogoPadre)
                .activo(command.getActivo())
                .orden(command.getOrden())
                .createdBy(command.getCreatedBy())
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public CatalogoPersonalizado updateCatalogoPersonalizado(Long id, UpdateCustomCatalogCommand command) {
        log.info("Updating CatalogoPersonalizado with Event Sourcing - ID: {}", id);

        String aggregateId = "CATALOGO_PERSONALIZADO-" + id;

        // Load aggregate from Event Store
        List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);
        if (events.isEmpty()) {
            throw new IllegalArgumentException("Catálogo personalizado no encontrado con ID: " + id);
        }

        CatalogoPersonalizadoAggregate aggregate = reconstructAggregateFromEvents(events);

        // Validar nivel
        if (command.getNivel() < 1 || command.getNivel() > 2) {
            throw new IllegalArgumentException("El nivel debe ser 1 o 2");
        }

        // Validar duplicados por código considerando el catálogo padre
        if (command.getNivel() == 1) {
            // Para nivel 1, validar que no exista otro catálogo de nivel 1 con el mismo código
            Optional<CatalogoPersonalizadoReadModel> existing =
                catalogoPersonalizadoReadModelRepository.findByCodigoAndNivel(command.getCodigo(), 1);
            if (existing.isPresent() && !existing.get().getId().equals(id)) {
                String errorMsg = String.format(
                        "Ya existe un catálogo personalizado de nivel 1 con el código '%s'",
                        command.getCodigo());
                log.warn(errorMsg);
                throw new IllegalArgumentException(errorMsg);
            }
        } else if (command.getNivel() == 2) {
            // Para nivel 2, validar que no exista otro catálogo con el mismo código en el mismo catálogo padre
            if (command.getCatalogoPadreId() != null) {
                Optional<CatalogoPersonalizadoReadModel> existing =
                    catalogoPersonalizadoReadModelRepository.findByCodigoAndCatalogoPadreId(
                        command.getCodigo(), command.getCatalogoPadreId());
                if (existing.isPresent() && !existing.get().getId().equals(id)) {
                    String errorMsg = String.format(
                            "Ya existe un catálogo personalizado con el código '%s' en el catálogo padre seleccionado",
                            command.getCodigo());
                    log.warn(errorMsg);
                    throw new IllegalArgumentException(errorMsg);
                }
            }
        }

        // Validar que nivel 2 tenga catalogoPadreId
        String codigoCatalogoPadre = null;
        String nombreCatalogoPadre = null;

        if (command.getNivel() == 2) {
            if (command.getCatalogoPadreId() == null) {
                throw new IllegalArgumentException("El catalogoPadreId es requerido para registros de nivel 2");
            }

            // Buscar el catálogo padre y validar que sea nivel 1
            CatalogoPersonalizadoReadModel catalogoPadre = catalogoPersonalizadoReadModelRepository
                    .findById(command.getCatalogoPadreId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "El catálogo padre con ID " + command.getCatalogoPadreId() + " no existe"));

            if (catalogoPadre.getNivel() != 1) {
                throw new IllegalArgumentException(
                        "El catálogo padre debe ser de nivel 1");
            }

            codigoCatalogoPadre = catalogoPadre.getCodigo();
            nombreCatalogoPadre = catalogoPadre.getNombre();
        } else {
            // Nivel 1 no debe tener catalogoPadreId
            if (command.getCatalogoPadreId() != null) {
                throw new IllegalArgumentException("Los catálogos de nivel 1 no deben tener catalogoPadreId");
            }
        }

        // Handle update command
        aggregate.handle(command);

        // Get the uncommitted event and set parent catalog info
        List<DomainEvent> uncommittedEvents = aggregate.getUncommittedEvents();
        if (!uncommittedEvents.isEmpty() && uncommittedEvents.get(0) instanceof CatalogoPersonalizadoUpdatedEvent) {
            CatalogoPersonalizadoUpdatedEvent updatedEvent = (CatalogoPersonalizadoUpdatedEvent) uncommittedEvents.get(0);
            // Update event with parent catalog info
            if (command.getNivel() == 2) {
                updatedEvent = new CatalogoPersonalizadoUpdatedEvent(
                        updatedEvent.getCatalogoPersonalizadoId(),
                        updatedEvent.getCodigo(),
                        updatedEvent.getNombre(),
                        updatedEvent.getDescripcion(),
                        updatedEvent.getNivel(),
                        updatedEvent.getCatalogoPadreId(),
                        codigoCatalogoPadre,
                        nombreCatalogoPadre,
                        updatedEvent.getActivo(),
                        updatedEvent.getOrden(),
                        updatedEvent.getPerformedBy()
                );
                uncommittedEvents.clear();
                uncommittedEvents.add(updatedEvent);
            }
        }

        // Save new events
        for (DomainEvent domainEvent : uncommittedEvents) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "CATALOGO_PERSONALIZADO",
                    domainEvent.getEventType(),
                    domainEvent,
                    command.getUpdatedBy()
            );

            publishDomainEvent(domainEvent, id);
        }

        aggregate.markEventsAsCommitted();

        log.info("CatalogoPersonalizado updated successfully with ID: {}", id);

        // Reload aggregate to get updated state
        aggregate = reconstructAggregateFromEvents(eventStoreService.getEvents(aggregateId));

        return CatalogoPersonalizado.builder()
                .id(id)
                .codigo(aggregate.getCodigo())
                .nombre(aggregate.getNombre())
                .descripcion(aggregate.getDescripcion())
                .nivel(aggregate.getNivel())
                .catalogoPadreId(aggregate.getCatalogoPadreId())
                .codigoCatalogoPadre(aggregate.getCodigoCatalogoPadre())
                .nombreCatalogoPadre(aggregate.getNombreCatalogoPadre())
                .activo(aggregate.getActivo())
                .orden(aggregate.getOrden())
                .build();
    }

    @Transactional(transactionManager = "eventStoreTransactionManager")
    public void deleteCatalogoPersonalizado(Long id, String deletedBy) {
        log.info("Deleting CatalogoPersonalizado with Event Sourcing - ID: {}", id);

        String aggregateId = "CATALOGO_PERSONALIZADO-" + id;

        // Load aggregate
        List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);
        if (events.isEmpty()) {
            throw new IllegalArgumentException("Catálogo personalizado no encontrado con ID: " + id);
        }

        CatalogoPersonalizadoAggregate aggregate = reconstructAggregateFromEvents(events);

        // Handle delete
        aggregate.handleDelete(deletedBy);

        // Save event
        for (DomainEvent domainEvent : aggregate.getUncommittedEvents()) {
            eventStoreService.saveEvent(
                    aggregateId,
                    "CATALOGO_PERSONALIZADO",
                    domainEvent.getEventType(),
                    domainEvent,
                    deletedBy
            );

            publishDomainEvent(domainEvent, id);
        }

        aggregate.markEventsAsCommitted();

        log.info("CatalogoPersonalizado deleted successfully with ID: {}", id);
    }

    private CatalogoPersonalizadoAggregate reconstructAggregateFromEvents(List<EventStoreEntity> events) {
        CatalogoPersonalizadoAggregate aggregate = new CatalogoPersonalizadoAggregate();

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
            case "CATALOGO_PERSONALIZADO_CREATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), CatalogoPersonalizadoCreatedEvent.class);
            case "CATALOGO_PERSONALIZADO_UPDATED" ->
                    objectMapper.readValue(eventEntity.getEventData(), CatalogoPersonalizadoUpdatedEvent.class);
            case "CATALOGO_PERSONALIZADO_DELETED" ->
                    objectMapper.readValue(eventEntity.getEventData(), CatalogoPersonalizadoDeletedEvent.class);
            default -> throw new IllegalArgumentException("Unknown event type: " + eventType);
        };
    }

    private void publishDomainEvent(DomainEvent domainEvent, Long catalogoPersonalizadoId) {
        if (eventPublisher != null) {
            CatalogoPersonalizadoEvent event = convertDomainEventToEvent(domainEvent, catalogoPersonalizadoId);
            eventPublisher.publish("catalogo-personalizado-events", catalogoPersonalizadoId.toString(), event);
            log.debug("CatalogoPersonalizado event published via {} for ID: {}",
                    eventPublisher.getProvider(), catalogoPersonalizadoId);
        } else {
            log.warn("No event publisher available - event not published to message bus. " +
                    "Event saved to EventStore only. CatalogoPersonalizado ID: {}", catalogoPersonalizadoId);
        }
    }

    private CatalogoPersonalizadoEvent convertDomainEventToEvent(DomainEvent domainEvent, Long catalogoPersonalizadoId) {
        CatalogoPersonalizadoEvent.EventType eventType = switch (domainEvent.getEventType()) {
            case "CATALOGO_PERSONALIZADO_CREATED" -> CatalogoPersonalizadoEvent.EventType.CREATED;
            case "CATALOGO_PERSONALIZADO_UPDATED" -> CatalogoPersonalizadoEvent.EventType.UPDATED;
            case "CATALOGO_PERSONALIZADO_DELETED" -> CatalogoPersonalizadoEvent.EventType.DELETED;
            default -> throw new IllegalArgumentException("Unknown event type");
        };

        if (domainEvent instanceof CatalogoPersonalizadoCreatedEvent created) {
            return CatalogoPersonalizadoEvent.builder()
                    .eventType(eventType)
                    .catalogoPersonalizadoId(catalogoPersonalizadoId)
                    .codigo(created.getCodigo())
                    .nombre(created.getNombre())
                    .descripcion(created.getDescripcion())
                    .nivel(created.getNivel())
                    .catalogoPadreId(created.getCatalogoPadreId())
                    .codigoCatalogoPadre(created.getCodigoCatalogoPadre())
                    .nombreCatalogoPadre(created.getNombreCatalogoPadre())
                    .activo(created.getActivo())
                    .orden(created.getOrden())
                    .timestamp(created.getTimestamp())
                    .performedBy(created.getPerformedBy())
                    .build();
        } else if (domainEvent instanceof CatalogoPersonalizadoUpdatedEvent updated) {
            return CatalogoPersonalizadoEvent.builder()
                    .eventType(eventType)
                    .catalogoPersonalizadoId(catalogoPersonalizadoId)
                    .codigo(updated.getCodigo())
                    .nombre(updated.getNombre())
                    .descripcion(updated.getDescripcion())
                    .nivel(updated.getNivel())
                    .catalogoPadreId(updated.getCatalogoPadreId())
                    .codigoCatalogoPadre(updated.getCodigoCatalogoPadre())
                    .nombreCatalogoPadre(updated.getNombreCatalogoPadre())
                    .activo(updated.getActivo())
                    .orden(updated.getOrden())
                    .timestamp(updated.getTimestamp())
                    .performedBy(updated.getPerformedBy())
                    .build();
        } else if (domainEvent instanceof CatalogoPersonalizadoDeletedEvent deleted) {
            return CatalogoPersonalizadoEvent.builder()
                    .eventType(eventType)
                    .catalogoPersonalizadoId(catalogoPersonalizadoId)
                    .timestamp(deleted.getTimestamp())
                    .performedBy(deleted.getPerformedBy())
                    .build();
        }

        throw new IllegalArgumentException("Unknown domain event type");
    }
}
