package com.globalcmx.api.service.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.event.FinancialInstitutionCreatedEvent;
import com.globalcmx.api.eventsourcing.event.FinancialInstitutionUpdatedEvent;
import com.globalcmx.api.eventsourcing.event.FinancialInstitutionDeletedEvent;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.readmodel.entity.FinancialInstitutionReadModel;
import com.globalcmx.api.readmodel.enums.FinancialInstitutionType;
import com.globalcmx.api.readmodel.repository.FinancialInstitutionReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class FinancialInstitutionSyncService {

    private final EventStoreService eventStoreService;
    private final FinancialInstitutionReadModelRepository institucionFinancieraReadModelRepository;
    private final ObjectMapper objectMapper;

    @Transactional(transactionManager = "readModelTransactionManager")
    public void syncAllInstitucionesFinancieras() {
        log.info("Iniciando sincronización de instituciones financieras desde Event Store");

        // Limpiar read model existente
        institucionFinancieraReadModelRepository.deleteAll();

        // Obtener todos los agregados de instituciones financieras
        List<EventStoreEntity> allEvents = eventStoreService.getAllEventsByAggregateType("INSTITUCION_FINANCIERA");

        log.info("Encontrados {} eventos de instituciones financieras en Event Store", allEvents.size());

        // Procesar eventos por agregado
        allEvents.stream()
            .map(EventStoreEntity::getAggregateId)
            .distinct()
            .forEach(this::syncInstitucionFinanciera);

        log.info("Sincronización completada. Total instituciones financieras en Read Model: {}",
                institucionFinancieraReadModelRepository.count());
    }

    private void syncInstitucionFinanciera(String aggregateId) {
        try {
            List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);

            FinancialInstitutionReadModel readModel = null;

            for (EventStoreEntity event : events) {
                String eventType = event.getEventType();

                switch (eventType) {
                    case "INSTITUCION_FINANCIERA_CREATED":
                        FinancialInstitutionCreatedEvent created = objectMapper.readValue(
                            event.getEventData(),
                            FinancialInstitutionCreatedEvent.class
                        );
                        readModel = applyCreated(created, aggregateId);
                        break;

                    case "INSTITUCION_FINANCIERA_UPDATED":
                        if (readModel != null) {
                            FinancialInstitutionUpdatedEvent updated = objectMapper.readValue(
                                event.getEventData(),
                                FinancialInstitutionUpdatedEvent.class
                            );
                            readModel = applyUpdated(readModel, updated);
                        }
                        break;

                    case "INSTITUCION_FINANCIERA_DELETED":
                        // Para delete, simplemente no guardamos el read model
                        readModel = null;
                        break;
                }
            }

            if (readModel != null) {
                institucionFinancieraReadModelRepository.save(readModel);
                log.debug("Sincronizado institucion financiera: {}", readModel.getId());
            }

        } catch (Exception e) {
            log.error("Error sincronizando institucion financiera {}: {}", aggregateId, e.getMessage(), e);
        }
    }

    private FinancialInstitutionReadModel applyCreated(FinancialInstitutionCreatedEvent event, String aggregateId) {
        return FinancialInstitutionReadModel.builder()
                .id(event.getInstitucionId())
                .codigo(event.getCodigo())
                .nombre(event.getNombre())
                .swiftCode(event.getSwiftCode())
                .pais(event.getPais())
                .ciudad(event.getCiudad())
                .direccion(event.getDireccion())
                .tipo(FinancialInstitutionType.valueOf(event.getTipo()))
                .rating(event.getRating())
                .esCorresponsal(event.getEsCorresponsal())
                .activo(event.getActivo())
                .createdAt(event.getTimestamp())
                .updatedAt(event.getTimestamp())
                .aggregateId(aggregateId)
                .version(1L)
                .build();
    }

    private FinancialInstitutionReadModel applyUpdated(FinancialInstitutionReadModel model,
                                                        FinancialInstitutionUpdatedEvent event) {
        model.setCodigo(event.getCodigo());
        model.setNombre(event.getNombre());
        model.setSwiftCode(event.getSwiftCode());
        model.setPais(event.getPais());
        model.setCiudad(event.getCiudad());
        model.setDireccion(event.getDireccion());
        model.setTipo(FinancialInstitutionType.valueOf(event.getTipo()));
        model.setRating(event.getRating());
        model.setEsCorresponsal(event.getEsCorresponsal());
        model.setActivo(event.getActivo());
        model.setUpdatedAt(LocalDateTime.now());
        model.setVersion(model.getVersion() + 1);
        return model;
    }
}
