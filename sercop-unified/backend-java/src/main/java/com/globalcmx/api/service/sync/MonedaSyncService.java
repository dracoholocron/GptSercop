package com.globalcmx.api.service.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.event.MonedaCreatedEvent;
import com.globalcmx.api.eventsourcing.event.MonedaUpdatedEvent;
import com.globalcmx.api.eventsourcing.event.MonedaDeletedEvent;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.readmodel.entity.MonedaReadModel;
import com.globalcmx.api.readmodel.repository.MonedaReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MonedaSyncService {

    private final EventStoreService eventStoreService;
    private final MonedaReadModelRepository monedaReadModelRepository;
    private final ObjectMapper objectMapper;

    @Transactional(transactionManager = "readModelTransactionManager")
    public void syncAllMonedas() {
        log.info("Iniciando sincronización de monedas desde Event Store");

        // Limpiar read model existente
        monedaReadModelRepository.deleteAll();

        // Obtener todos los agregados de monedas
        List<EventStoreEntity> allEvents = eventStoreService.getAllEventsByAggregateType("MONEDA");

        log.info("Encontrados {} eventos de monedas en Event Store", allEvents.size());

        // Procesar eventos por agregado
        allEvents.stream()
            .map(EventStoreEntity::getAggregateId)
            .distinct()
            .forEach(this::syncMoneda);

        log.info("Sincronización completada. Total monedas en Read Model: {}",
                monedaReadModelRepository.count());
    }

    private void syncMoneda(String aggregateId) {
        try {
            List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);

            MonedaReadModel readModel = null;

            for (EventStoreEntity event : events) {
                String eventType = event.getEventType();

                switch (eventType) {
                    case "MONEDA_CREATED":
                        MonedaCreatedEvent created = objectMapper.readValue(
                            event.getEventData(),
                            MonedaCreatedEvent.class
                        );
                        readModel = applyCreated(created);
                        break;

                    case "MONEDA_UPDATED":
                        if (readModel != null) {
                            MonedaUpdatedEvent updated = objectMapper.readValue(
                                event.getEventData(),
                                MonedaUpdatedEvent.class
                            );
                            readModel = applyUpdated(readModel, updated);
                        }
                        break;

                    case "MONEDA_DELETED":
                        // Para delete, simplemente no guardamos el read model
                        readModel = null;
                        break;
                }
            }

            if (readModel != null) {
                monedaReadModelRepository.save(readModel);
                log.debug("Sincronizado moneda: {}", readModel.getId());
            }

        } catch (Exception e) {
            log.error("Error sincronizando moneda {}: {}", aggregateId, e.getMessage(), e);
        }
    }

    private MonedaReadModel applyCreated(MonedaCreatedEvent event) {
        return MonedaReadModel.builder()
                .id(event.getMonedaId())
                .codigo(event.getCodigo())
                .nombre(event.getNombre())
                .simbolo(event.getSimbolo())
                .activo(event.getActivo())
                .createdAt(event.getTimestamp())
                .updatedAt(event.getTimestamp())
                .createdBy(event.getPerformedBy())
                .version(1L)
                .build();
    }

    private MonedaReadModel applyUpdated(MonedaReadModel model, MonedaUpdatedEvent event) {
        model.setCodigo(event.getCodigo());
        model.setNombre(event.getNombre());
        model.setSimbolo(event.getSimbolo());
        model.setActivo(event.getActivo());
        model.setUpdatedAt(LocalDateTime.now());
        model.setUpdatedBy(event.getPerformedBy());
        model.setVersion(model.getVersion() + 1);
        return model;
    }
}
