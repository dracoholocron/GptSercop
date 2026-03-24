package com.globalcmx.api.service.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.event.LineaCreditoCreatedEvent;
import com.globalcmx.api.eventsourcing.event.LineaCreditoUpdatedEvent;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.readmodel.entity.LineaCreditoReadModel;
import com.globalcmx.api.readmodel.repository.LineaCreditoReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class LineaCreditoSyncService {

    private final EventStoreService eventStoreService;
    private final LineaCreditoReadModelRepository lineaCreditoReadModelRepository;
    private final ObjectMapper objectMapper;

    @Transactional(transactionManager = "readModelTransactionManager")
    public void syncAllLineasCredito() {
        log.info("Iniciando sincronización de líneas de crédito desde Event Store");

        // Limpiar read model existente
        lineaCreditoReadModelRepository.deleteAll();

        // Obtener todos los agregados de líneas de crédito
        List<EventStoreEntity> allEvents = eventStoreService.getAllEventsByAggregateType("LINEA_CREDITO");

        log.info("Encontrados {} eventos de líneas de crédito en Event Store", allEvents.size());

        // Procesar eventos por agregado
        allEvents.stream()
            .map(EventStoreEntity::getAggregateId)
            .distinct()
            .forEach(this::syncLineaCredito);

        log.info("Sincronización completada. Total líneas de crédito en Read Model: {}",
                lineaCreditoReadModelRepository.count());
    }

    private void syncLineaCredito(String aggregateId) {
        try {
            List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);

            LineaCreditoReadModel readModel = null;

            for (EventStoreEntity event : events) {
                String eventType = event.getEventType();

                switch (eventType) {
                    case "LINEA_CREDITO_CREATED":
                        LineaCreditoCreatedEvent created = objectMapper.readValue(
                            event.getEventData(),
                            LineaCreditoCreatedEvent.class
                        );
                        readModel = applyCreated(created, aggregateId);
                        break;

                    case "LINEA_CREDITO_UPDATED":
                        if (readModel != null) {
                            LineaCreditoUpdatedEvent updated = objectMapper.readValue(
                                event.getEventData(),
                                LineaCreditoUpdatedEvent.class
                            );
                            readModel = applyUpdated(readModel, updated);
                        }
                        break;

                    case "LINEA_CREDITO_DELETED":
                        // Para delete, simplemente no guardamos el read model
                        readModel = null;
                        break;
                }
            }

            if (readModel != null) {
                lineaCreditoReadModelRepository.save(readModel);
                log.debug("Sincronizado línea de crédito: {}", readModel.getId());
            }

        } catch (Exception e) {
            log.error("Error sincronizando línea de crédito {}: {}", aggregateId, e.getMessage(), e);
        }
    }

    private LineaCreditoReadModel applyCreated(LineaCreditoCreatedEvent event, String aggregateId) {
        return LineaCreditoReadModel.builder()
                .id(event.getLineaCreditoId())
                .clienteId(event.getClienteId())
                .tipo(event.getTipo())
                .moneda(event.getMoneda())
                .montoAutorizado(event.getMontoAutorizado())
                .montoUtilizado(event.getMontoUtilizado())
                .montoDisponible(event.getMontoDisponible())
                .fechaAutorizacion(event.getFechaAutorizacion())
                .fechaVencimiento(event.getFechaVencimiento())
                .tasaReferencia(event.getTasaReferencia())
                .spread(event.getSpread())
                .estado(event.getEstado())
                .createdAt(event.getTimestamp())
                .updatedAt(event.getTimestamp())
                .aggregateId(aggregateId)
                .version(1L)
                .build();
    }

    private LineaCreditoReadModel applyUpdated(LineaCreditoReadModel model, LineaCreditoUpdatedEvent event) {
        if (event.getClienteId() != null) model.setClienteId(event.getClienteId());
        if (event.getTipo() != null) model.setTipo(event.getTipo());
        if (event.getMoneda() != null) model.setMoneda(event.getMoneda());
        if (event.getMontoAutorizado() != null) model.setMontoAutorizado(event.getMontoAutorizado());
        if (event.getMontoUtilizado() != null) model.setMontoUtilizado(event.getMontoUtilizado());
        if (event.getMontoDisponible() != null) model.setMontoDisponible(event.getMontoDisponible());
        if (event.getFechaAutorizacion() != null) model.setFechaAutorizacion(event.getFechaAutorizacion());
        if (event.getFechaVencimiento() != null) model.setFechaVencimiento(event.getFechaVencimiento());
        if (event.getTasaReferencia() != null) model.setTasaReferencia(event.getTasaReferencia());
        if (event.getSpread() != null) model.setSpread(event.getSpread());
        if (event.getEstado() != null) model.setEstado(event.getEstado());

        model.setUpdatedAt(LocalDateTime.now());
        model.setVersion(model.getVersion() + 1);
        return model;
    }
}
