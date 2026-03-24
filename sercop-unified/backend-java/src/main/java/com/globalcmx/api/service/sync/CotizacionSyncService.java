package com.globalcmx.api.service.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.event.CotizacionCreatedEvent;
import com.globalcmx.api.eventsourcing.event.CotizacionUpdatedEvent;
import com.globalcmx.api.eventsourcing.event.CotizacionDeletedEvent;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.readmodel.entity.CotizacionReadModel;
import com.globalcmx.api.readmodel.repository.CotizacionReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CotizacionSyncService {

    private final EventStoreService eventStoreService;
    private final CotizacionReadModelRepository cotizacionReadModelRepository;
    private final ObjectMapper objectMapper;

    @Transactional(transactionManager = "readModelTransactionManager")
    public void syncAllCotizaciones() {
        log.info("Iniciando sincronización de cotizaciones desde Event Store");

        // Limpiar read model existente
        cotizacionReadModelRepository.deleteAll();

        // Obtener todos los agregados de cotizaciones
        List<EventStoreEntity> allEvents = eventStoreService.getAllEventsByAggregateType("COTIZACION");

        log.info("Encontrados {} eventos de cotizaciones en Event Store", allEvents.size());

        // Procesar eventos por agregado
        allEvents.stream()
            .map(EventStoreEntity::getAggregateId)
            .distinct()
            .forEach(this::syncCotizacion);

        log.info("Sincronización completada. Total cotizaciones en Read Model: {}",
                cotizacionReadModelRepository.count());
    }

    private void syncCotizacion(String aggregateId) {
        try {
            List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);

            CotizacionReadModel readModel = null;

            for (EventStoreEntity event : events) {
                String eventType = event.getEventType();

                switch (eventType) {
                    case "COTIZACION_CREATED":
                        CotizacionCreatedEvent created = objectMapper.readValue(
                            event.getEventData(),
                            CotizacionCreatedEvent.class
                        );
                        readModel = applyCreated(created);
                        break;

                    case "COTIZACION_UPDATED":
                        if (readModel != null) {
                            CotizacionUpdatedEvent updated = objectMapper.readValue(
                                event.getEventData(),
                                CotizacionUpdatedEvent.class
                            );
                            readModel = applyUpdated(readModel, updated);
                        }
                        break;

                    case "COTIZACION_DELETED":
                        // Para delete, simplemente no guardamos el read model
                        readModel = null;
                        break;
                }
            }

            if (readModel != null) {
                cotizacionReadModelRepository.save(readModel);
                log.debug("Sincronizado cotizacion: {}", readModel.getId());
            }

        } catch (Exception e) {
            log.error("Error sincronizando cotizacion {}: {}", aggregateId, e.getMessage(), e);
        }
    }

    private CotizacionReadModel applyCreated(CotizacionCreatedEvent event) {
        return CotizacionReadModel.builder()
                .id(event.getCotizacionId())
                .codigoMoneda(event.getCodigoMoneda())
                .fecha(event.getFecha())
                .valorCompra(event.getValorCompra())
                .valorVenta(event.getValorVenta())
                .createdAt(event.getTimestamp())
                .updatedAt(event.getTimestamp())
                .createdBy(event.getPerformedBy())
                .version(1L)
                .build();
    }

    private CotizacionReadModel applyUpdated(CotizacionReadModel model, CotizacionUpdatedEvent event) {
        model.setCodigoMoneda(event.getCodigoMoneda());
        model.setFecha(event.getFecha());
        model.setValorCompra(event.getValorCompra());
        model.setValorVenta(event.getValorVenta());
        model.setUpdatedAt(LocalDateTime.now());
        model.setUpdatedBy(event.getPerformedBy());
        model.setVersion(model.getVersion() + 1);
        return model;
    }
}
