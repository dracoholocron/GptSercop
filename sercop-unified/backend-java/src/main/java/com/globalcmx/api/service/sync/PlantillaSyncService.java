package com.globalcmx.api.service.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.event.PlantillaCreatedEvent;
import com.globalcmx.api.eventsourcing.event.PlantillaUpdatedEvent;
import com.globalcmx.api.eventsourcing.event.PlantillaDeletedEvent;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.readmodel.entity.PlantillaReadModel;
import com.globalcmx.api.readmodel.repository.PlantillaReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlantillaSyncService {

    private final EventStoreService eventStoreService;
    private final PlantillaReadModelRepository plantillaReadModelRepository;
    private final ObjectMapper objectMapper;

    @Transactional(transactionManager = "readModelTransactionManager")
    public void syncAllPlantillas() {
        log.info("Iniciando sincronización de plantillas desde Event Store");

        // Limpiar read model existente
        plantillaReadModelRepository.deleteAll();

        // Obtener todos los agregados de plantillas
        List<EventStoreEntity> allEvents = eventStoreService.getAllEventsByAggregateType("PLANTILLA");

        log.info("Encontrados {} eventos de plantillas en Event Store", allEvents.size());

        // Procesar eventos por agregado
        allEvents.stream()
            .map(EventStoreEntity::getAggregateId)
            .distinct()
            .forEach(this::syncPlantilla);

        log.info("Sincronización completada. Total plantillas en Read Model: {}",
                plantillaReadModelRepository.count());
    }

    private void syncPlantilla(String aggregateId) {
        try {
            List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);

            PlantillaReadModel readModel = null;

            for (EventStoreEntity event : events) {
                String eventType = event.getEventType();

                switch (eventType) {
                    case "PLANTILLA_CREATED":
                        PlantillaCreatedEvent created = objectMapper.readValue(
                            event.getEventData(),
                            PlantillaCreatedEvent.class
                        );
                        readModel = applyCreated(created);
                        break;

                    case "PLANTILLA_UPDATED":
                        if (readModel != null) {
                            PlantillaUpdatedEvent updated = objectMapper.readValue(
                                event.getEventData(),
                                PlantillaUpdatedEvent.class
                            );
                            readModel = applyUpdated(readModel, updated);
                        }
                        break;

                    case "PLANTILLA_DELETED":
                        // Para delete, simplemente no guardamos el read model
                        readModel = null;
                        break;
                }
            }

            if (readModel != null) {
                plantillaReadModelRepository.save(readModel);
                log.debug("Sincronizado plantilla: {}", readModel.getId());
            }

        } catch (Exception e) {
            log.error("Error sincronizando plantilla {}: {}", aggregateId, e.getMessage(), e);
        }
    }

    private PlantillaReadModel applyCreated(PlantillaCreatedEvent event) {
        return PlantillaReadModel.builder()
                .id(event.getPlantillaId())
                .codigo(event.getCodigo())
                .nombre(event.getNombre())
                .descripcion(event.getDescripcion())
                .tipoDocumento(event.getTipoDocumento())
                .nombreArchivo(event.getNombreArchivo())
                .rutaArchivo(event.getRutaArchivo())
                .tamanioArchivo(event.getTamanioArchivo())
                .activo(event.getActivo())
                .createdAt(event.getTimestamp())
                .updatedAt(event.getTimestamp())
                .createdBy(event.getPerformedBy())
                .version(1L)
                .build();
    }

    private PlantillaReadModel applyUpdated(PlantillaReadModel model, PlantillaUpdatedEvent event) {
        model.setCodigo(event.getCodigo());
        model.setNombre(event.getNombre());
        model.setDescripcion(event.getDescripcion());
        model.setTipoDocumento(event.getTipoDocumento());
        model.setNombreArchivo(event.getNombreArchivo());
        model.setRutaArchivo(event.getRutaArchivo());
        model.setTamanioArchivo(event.getTamanioArchivo());
        model.setActivo(event.getActivo());
        model.setUpdatedAt(LocalDateTime.now());
        model.setUpdatedBy(event.getPerformedBy());
        model.setVersion(model.getVersion() + 1);
        return model;
    }
}
