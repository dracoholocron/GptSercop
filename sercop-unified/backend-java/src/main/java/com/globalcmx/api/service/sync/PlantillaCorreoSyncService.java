package com.globalcmx.api.service.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.event.PlantillaCorreoCreatedEvent;
import com.globalcmx.api.eventsourcing.event.PlantillaCorreoUpdatedEvent;
import com.globalcmx.api.eventsourcing.event.PlantillaCorreoDeletedEvent;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.readmodel.entity.PlantillaCorreoReadModel;
import com.globalcmx.api.readmodel.repository.PlantillaCorreoReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlantillaCorreoSyncService {

    private final EventStoreService eventStoreService;
    private final PlantillaCorreoReadModelRepository plantillaCorreoReadModelRepository;
    private final ObjectMapper objectMapper;

    @Transactional(transactionManager = "readModelTransactionManager")
    public void syncAllPlantillasCorreo() {
        log.info("Iniciando sincronización de plantillas de correo desde Event Store");

        // Limpiar read model existente
        plantillaCorreoReadModelRepository.deleteAll();

        // Obtener todos los agregados de plantillas de correo
        List<EventStoreEntity> allEvents = eventStoreService.getAllEventsByAggregateType("PLANTILLA_CORREO");

        log.info("Encontrados {} eventos de plantillas de correo en Event Store", allEvents.size());

        // Procesar eventos por agregado
        allEvents.stream()
            .map(EventStoreEntity::getAggregateId)
            .distinct()
            .forEach(this::syncPlantillaCorreo);

        log.info("Sincronización completada. Total plantillas de correo en Read Model: {}",
                plantillaCorreoReadModelRepository.count());
    }

    private void syncPlantillaCorreo(String aggregateId) {
        try {
            List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);

            PlantillaCorreoReadModel readModel = null;

            for (EventStoreEntity event : events) {
                String eventType = event.getEventType();

                switch (eventType) {
                    case "PLANTILLA_CORREO_CREATED":
                        PlantillaCorreoCreatedEvent created = objectMapper.readValue(
                            event.getEventData(),
                            PlantillaCorreoCreatedEvent.class
                        );
                        readModel = applyCreated(created);
                        break;

                    case "PLANTILLA_CORREO_UPDATED":
                        if (readModel != null) {
                            PlantillaCorreoUpdatedEvent updated = objectMapper.readValue(
                                event.getEventData(),
                                PlantillaCorreoUpdatedEvent.class
                            );
                            readModel = applyUpdated(readModel, updated);
                        }
                        break;

                    case "PLANTILLA_CORREO_DELETED":
                        // Para delete, simplemente no guardamos el read model
                        readModel = null;
                        break;
                }
            }

            if (readModel != null) {
                plantillaCorreoReadModelRepository.save(readModel);
                log.debug("Sincronizado plantilla de correo: {}", readModel.getId());
            }

        } catch (Exception e) {
            log.error("Error sincronizando plantilla de correo {}: {}", aggregateId, e.getMessage(), e);
        }
    }

    private PlantillaCorreoReadModel applyCreated(PlantillaCorreoCreatedEvent event) {
        return PlantillaCorreoReadModel.builder()
                .id(event.getPlantillaCorreoId())
                .codigo(event.getCodigo())
                .nombre(event.getNombre())
                .descripcion(event.getDescripcion())
                .asunto(event.getAsunto())
                .cuerpoHtml(event.getCuerpoHtml())
                .plantillasAdjuntas(event.getPlantillasAdjuntas())
                .activo(event.getActivo())
                .createdAt(event.getTimestamp())
                .updatedAt(event.getTimestamp())
                .createdBy(event.getPerformedBy())
                .version(1L)
                .build();
    }

    private PlantillaCorreoReadModel applyUpdated(PlantillaCorreoReadModel model, PlantillaCorreoUpdatedEvent event) {
        model.setCodigo(event.getCodigo());
        model.setNombre(event.getNombre());
        model.setDescripcion(event.getDescripcion());
        model.setAsunto(event.getAsunto());
        model.setCuerpoHtml(event.getCuerpoHtml());
        model.setPlantillasAdjuntas(event.getPlantillasAdjuntas());
        model.setActivo(event.getActivo());
        model.setUpdatedAt(LocalDateTime.now());
        model.setUpdatedBy(event.getPerformedBy());
        model.setVersion(model.getVersion() + 1);
        return model;
    }
}
