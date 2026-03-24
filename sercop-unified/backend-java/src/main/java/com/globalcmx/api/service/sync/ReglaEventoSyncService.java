package com.globalcmx.api.service.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.event.ReglaEventoCreatedEvent;
import com.globalcmx.api.eventsourcing.event.ReglaEventoUpdatedEvent;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.readmodel.entity.ReglaEventoReadModel;
import com.globalcmx.api.readmodel.repository.ReglaEventoReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReglaEventoSyncService {

    private final EventStoreService eventStoreService;
    private final ReglaEventoReadModelRepository reglaEventoReadModelRepository;
    private final ObjectMapper objectMapper;

    @Transactional(transactionManager = "readModelTransactionManager")
    public void syncAllReglasEventos() {
        log.info("Iniciando sincronización de reglas de eventos desde Event Store");

        // Limpiar read model existente
        reglaEventoReadModelRepository.deleteAll();

        // Obtener todos los agregados de reglas de eventos
        List<EventStoreEntity> allEvents = eventStoreService.getAllEventsByAggregateType("REGLA_EVENTO");

        log.info("Encontrados {} eventos de reglas de eventos en Event Store", allEvents.size());

        // Procesar eventos por agregado
        allEvents.stream()
            .map(EventStoreEntity::getAggregateId)
            .distinct()
            .forEach(this::syncReglaEvento);

        log.info("Sincronización completada. Total reglas de eventos en Read Model: {}",
                reglaEventoReadModelRepository.count());
    }

    private void syncReglaEvento(String aggregateId) {
        try {
            List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);

            ReglaEventoReadModel readModel = null;

            for (EventStoreEntity event : events) {
                String eventType = event.getEventType();

                switch (eventType) {
                    case "REGLA_EVENTO_CREATED":
                        ReglaEventoCreatedEvent created = objectMapper.readValue(
                            event.getEventData(),
                            ReglaEventoCreatedEvent.class
                        );
                        readModel = applyCreated(created);
                        break;

                    case "REGLA_EVENTO_UPDATED":
                        if (readModel != null) {
                            ReglaEventoUpdatedEvent updated = objectMapper.readValue(
                                event.getEventData(),
                                ReglaEventoUpdatedEvent.class
                            );
                            readModel = applyUpdated(readModel, updated);
                        }
                        break;

                    case "REGLA_EVENTO_DELETED":
                        // Para delete, simplemente no guardamos el read model
                        readModel = null;
                        break;
                }
            }

            if (readModel != null) {
                reglaEventoReadModelRepository.save(readModel);
                log.debug("Sincronizado regla de evento: {}", readModel.getId());
            }

        } catch (Exception e) {
            log.error("Error sincronizando regla de evento {}: {}", aggregateId, e.getMessage(), e);
        }
    }

    private ReglaEventoReadModel applyCreated(ReglaEventoCreatedEvent event) {
        return ReglaEventoReadModel.builder()
                .id(event.getReglaEventoId())
                .codigo(event.getCodigo())
                .nombre(event.getNombre())
                .descripcion(event.getDescripcion())
                .tipoOperacion(event.getTipoOperacion())
                .eventoTrigger(event.getEventoTrigger())
                .condicionesDRL(event.getCondicionesDRL())
                .accionesJson(event.getAccionesJson())
                .prioridad(event.getPrioridad())
                .activo(event.getActivo())
                .createdAt(event.getTimestamp())
                .updatedAt(event.getTimestamp())
                .createdBy(event.getPerformedBy())
                .version(1L)
                .build();
    }

    private ReglaEventoReadModel applyUpdated(ReglaEventoReadModel model, ReglaEventoUpdatedEvent event) {
        model.setCodigo(event.getCodigo());
        model.setNombre(event.getNombre());
        model.setDescripcion(event.getDescripcion());
        model.setTipoOperacion(event.getTipoOperacion());
        model.setEventoTrigger(event.getEventoTrigger());
        model.setCondicionesDRL(event.getCondicionesDRL());
        model.setAccionesJson(event.getAccionesJson());
        model.setPrioridad(event.getPrioridad());
        model.setActivo(event.getActivo());
        model.setUpdatedAt(LocalDateTime.now());
        model.setUpdatedBy(event.getPerformedBy());
        model.setVersion(model.getVersion() + 1);
        return model;
    }
}
