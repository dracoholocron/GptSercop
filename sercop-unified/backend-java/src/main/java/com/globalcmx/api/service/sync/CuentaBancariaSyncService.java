package com.globalcmx.api.service.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.event.CuentaBancariaCreatedEvent;
import com.globalcmx.api.eventsourcing.event.CuentaBancariaUpdatedEvent;
import com.globalcmx.api.eventsourcing.event.CuentaBancariaDeletedEvent;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.readmodel.entity.CuentaBancariaReadModel;
import com.globalcmx.api.readmodel.repository.CuentaBancariaReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CuentaBancariaSyncService {

    private final EventStoreService eventStoreService;
    private final CuentaBancariaReadModelRepository cuentaBancariaReadModelRepository;
    private final ObjectMapper objectMapper;

    @Transactional(transactionManager = "readModelTransactionManager")
    public void syncAllCuentasBancarias() {
        log.info("Iniciando sincronización de cuentas bancarias desde Event Store");

        // Limpiar read model existente
        cuentaBancariaReadModelRepository.deleteAll();

        // Obtener todos los agregados de cuentas bancarias
        List<EventStoreEntity> allEvents = eventStoreService.getAllEventsByAggregateType("CUENTA_BANCARIA");

        log.info("Encontrados {} eventos de cuentas bancarias en Event Store", allEvents.size());

        // Procesar eventos por agregado
        allEvents.stream()
            .map(EventStoreEntity::getAggregateId)
            .distinct()
            .forEach(this::syncCuentaBancaria);

        log.info("Sincronización completada. Total cuentas bancarias en Read Model: {}",
                cuentaBancariaReadModelRepository.count());
    }

    private void syncCuentaBancaria(String aggregateId) {
        try {
            List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);

            CuentaBancariaReadModel readModel = null;

            for (EventStoreEntity event : events) {
                String eventType = event.getEventType();

                switch (eventType) {
                    case "CUENTA_BANCARIA_CREATED":
                        CuentaBancariaCreatedEvent created = objectMapper.readValue(
                            event.getEventData(),
                            CuentaBancariaCreatedEvent.class
                        );
                        readModel = applyCreated(created);
                        break;

                    case "CUENTA_BANCARIA_UPDATED":
                        if (readModel != null) {
                            CuentaBancariaUpdatedEvent updated = objectMapper.readValue(
                                event.getEventData(),
                                CuentaBancariaUpdatedEvent.class
                            );
                            readModel = applyUpdated(readModel, updated);
                        }
                        break;

                    case "CUENTA_BANCARIA_DELETED":
                        // Para delete, simplemente no guardamos el read model
                        readModel = null;
                        break;
                }
            }

            if (readModel != null) {
                cuentaBancariaReadModelRepository.save(readModel);
                log.debug("Sincronizada cuenta bancaria: {}", readModel.getId());
            }

        } catch (Exception e) {
            log.error("Error sincronizando cuenta bancaria {}: {}", aggregateId, e.getMessage(), e);
        }
    }

    private CuentaBancariaReadModel applyCreated(CuentaBancariaCreatedEvent event) {
        return CuentaBancariaReadModel.builder()
                .id(event.getCuentaBancariaId())
                .identificacionParticipante(event.getIdentificacionParticipante())
                .nombresParticipante(event.getNombresParticipante())
                .apellidosParticipante(event.getApellidosParticipante())
                .numeroCuenta(event.getNumeroCuenta())
                .identificacionCuenta(event.getIdentificacionCuenta())
                .tipo(event.getTipo())
                .activo(event.getActivo())
                .createdBy(event.getPerformedBy())
                .build();
    }

    private CuentaBancariaReadModel applyUpdated(CuentaBancariaReadModel model, CuentaBancariaUpdatedEvent event) {
        model.setIdentificacionParticipante(event.getIdentificacionParticipante());
        model.setNombresParticipante(event.getNombresParticipante());
        model.setApellidosParticipante(event.getApellidosParticipante());
        model.setNumeroCuenta(event.getNumeroCuenta());
        model.setIdentificacionCuenta(event.getIdentificacionCuenta());
        model.setTipo(event.getTipo());
        model.setActivo(event.getActivo());
        model.setUpdatedBy(event.getPerformedBy());
        return model;
    }
}
