package com.globalcmx.api.service.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.event.CatalogoPersonalizadoCreatedEvent;
import com.globalcmx.api.eventsourcing.event.CatalogoPersonalizadoUpdatedEvent;
import com.globalcmx.api.eventsourcing.event.CatalogoPersonalizadoDeletedEvent;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.readmodel.entity.CatalogoPersonalizadoReadModel;
import com.globalcmx.api.readmodel.repository.CatalogoPersonalizadoReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CatalogoPersonalizadoSyncService {

    private final EventStoreService eventStoreService;
    private final CatalogoPersonalizadoReadModelRepository catalogoPersonalizadoReadModelRepository;
    private final ObjectMapper objectMapper;

    @Transactional(transactionManager = "readModelTransactionManager")
    public void syncAllCatalogosPersonalizados() {
        log.info("Iniciando sincronización de catálogos personalizados desde Event Store");

        // Limpiar read model existente
        catalogoPersonalizadoReadModelRepository.deleteAll();

        // Obtener todos los agregados de catálogos personalizados
        List<EventStoreEntity> allEvents = eventStoreService.getAllEventsByAggregateType("CATALOGO_PERSONALIZADO");

        log.info("Encontrados {} eventos de catálogos personalizados en Event Store", allEvents.size());

        // Procesar eventos por agregado
        allEvents.stream()
            .map(EventStoreEntity::getAggregateId)
            .distinct()
            .forEach(this::syncCatalogoPersonalizado);

        log.info("Sincronización completada. Total catálogos personalizados en Read Model: {}",
                catalogoPersonalizadoReadModelRepository.count());
    }

    private void syncCatalogoPersonalizado(String aggregateId) {
        try {
            List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);

            CatalogoPersonalizadoReadModel readModel = null;

            for (EventStoreEntity event : events) {
                String eventType = event.getEventType();

                switch (eventType) {
                    case "CATALOGO_PERSONALIZADO_CREATED":
                        CatalogoPersonalizadoCreatedEvent created = objectMapper.readValue(
                            event.getEventData(),
                            CatalogoPersonalizadoCreatedEvent.class
                        );
                        readModel = applyCreated(created);
                        break;

                    case "CATALOGO_PERSONALIZADO_UPDATED":
                        if (readModel != null) {
                            CatalogoPersonalizadoUpdatedEvent updated = objectMapper.readValue(
                                event.getEventData(),
                                CatalogoPersonalizadoUpdatedEvent.class
                            );
                            readModel = applyUpdated(readModel, updated);
                        }
                        break;

                    case "CATALOGO_PERSONALIZADO_DELETED":
                        // Para delete, simplemente no guardamos el read model
                        readModel = null;
                        break;
                }
            }

            if (readModel != null) {
                catalogoPersonalizadoReadModelRepository.save(readModel);
                log.debug("Sincronizado catálogo personalizado: {}", readModel.getId());
            }

        } catch (Exception e) {
            log.error("Error sincronizando catálogo personalizado {}: {}", aggregateId, e.getMessage(), e);
        }
    }

    private CatalogoPersonalizadoReadModel applyCreated(CatalogoPersonalizadoCreatedEvent event) {
        return CatalogoPersonalizadoReadModel.builder()
                .id(event.getCatalogoPersonalizadoId())
                .codigo(event.getCodigo())
                .nombre(event.getNombre())
                .descripcion(event.getDescripcion())
                .nivel(event.getNivel())
                .catalogoPadreId(event.getCatalogoPadreId())
                .codigoCatalogoPadre(event.getCodigoCatalogoPadre())
                .nombreCatalogoPadre(event.getNombreCatalogoPadre())
                .activo(event.getActivo())
                .orden(event.getOrden())
                .createdBy(event.getPerformedBy())
                .build();
    }

    private CatalogoPersonalizadoReadModel applyUpdated(CatalogoPersonalizadoReadModel model, CatalogoPersonalizadoUpdatedEvent event) {
        model.setCodigo(event.getCodigo());
        model.setNombre(event.getNombre());
        model.setDescripcion(event.getDescripcion());
        model.setNivel(event.getNivel());
        model.setCatalogoPadreId(event.getCatalogoPadreId());
        model.setCodigoCatalogoPadre(event.getCodigoCatalogoPadre());
        model.setNombreCatalogoPadre(event.getNombreCatalogoPadre());
        model.setActivo(event.getActivo());
        model.setOrden(event.getOrden());
        model.setUpdatedBy(event.getPerformedBy());
        return model;
    }
}
