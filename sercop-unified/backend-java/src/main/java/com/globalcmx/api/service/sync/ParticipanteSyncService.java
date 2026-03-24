package com.globalcmx.api.service.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.event.ParticipanteCreatedEvent;
import com.globalcmx.api.eventsourcing.event.ParticipanteUpdatedEvent;
import com.globalcmx.api.eventsourcing.event.ParticipanteDeletedEvent;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.readmodel.entity.ParticipanteReadModel;
import com.globalcmx.api.readmodel.repository.ParticipanteReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ParticipanteSyncService {

    private final EventStoreService eventStoreService;
    private final ParticipanteReadModelRepository participanteReadModelRepository;
    private final ObjectMapper objectMapper;

    @Transactional(transactionManager = "readModelTransactionManager")
    public void syncAllParticipantes() {
        log.info("Iniciando sincronización de participantes desde Event Store");

        // Limpiar read model existente
        participanteReadModelRepository.deleteAll();

        // Obtener todos los agregados de participantes
        List<EventStoreEntity> allEvents = eventStoreService.getAllEventsByAggregateType("PARTICIPANTE");

        log.info("Encontrados {} eventos de participantes en Event Store", allEvents.size());

        // Procesar eventos por agregado
        allEvents.stream()
            .map(EventStoreEntity::getAggregateId)
            .distinct()
            .forEach(this::syncParticipante);

        log.info("Sincronización completada. Total participantes en Read Model: {}",
                participanteReadModelRepository.count());
    }

    private void syncParticipante(String aggregateId) {
        try {
            List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);

            ParticipanteReadModel readModel = null;

            for (EventStoreEntity event : events) {
                String eventType = event.getEventType();

                switch (eventType) {
                    case "PARTICIPANTE_CREATED":
                        ParticipanteCreatedEvent created = objectMapper.readValue(
                            event.getEventData(),
                            ParticipanteCreatedEvent.class
                        );
                        readModel = applyCreated(created);
                        break;

                    case "PARTICIPANTE_UPDATED":
                        if (readModel != null) {
                            ParticipanteUpdatedEvent updated = objectMapper.readValue(
                                event.getEventData(),
                                ParticipanteUpdatedEvent.class
                            );
                            readModel = applyUpdated(readModel, updated);
                        }
                        break;

                    case "PARTICIPANTE_DELETED":
                        // Para delete, simplemente no guardamos el read model
                        readModel = null;
                        break;
                }
            }

            if (readModel != null) {
                participanteReadModelRepository.save(readModel);
                log.debug("Sincronizado participante: {}", readModel.getId());
            }

        } catch (Exception e) {
            log.error("Error sincronizando participante {}: {}", aggregateId, e.getMessage(), e);
        }
    }

    private ParticipanteReadModel applyCreated(ParticipanteCreatedEvent event) {
        return ParticipanteReadModel.builder()
                .id(event.getParticipanteId())
                .identificacion(event.getIdentificacion())
                .tipo(event.getTipo())
                .tipoReferencia(event.getTipoReferencia())
                .nombres(event.getNombres())
                .apellidos(event.getApellidos())
                .email(event.getEmail())
                .telefono(event.getTelefono())
                .direccion(event.getDireccion())
                .agencia(event.getAgencia())
                .ejecutivoAsignado(event.getEjecutivoAsignado())
                .ejecutivoId(event.getEjecutivoId())
                .correoEjecutivo(event.getCorreoEjecutivo())
                .autenticador(event.getAutenticador())
                .createdBy(event.getPerformedBy())
                .build();
    }

    private ParticipanteReadModel applyUpdated(ParticipanteReadModel model, ParticipanteUpdatedEvent event) {
        model.setIdentificacion(event.getIdentificacion());
        model.setTipo(event.getTipo());
        model.setTipoReferencia(event.getTipoReferencia());
        model.setNombres(event.getNombres());
        model.setApellidos(event.getApellidos());
        model.setEmail(event.getEmail());
        model.setTelefono(event.getTelefono());
        model.setDireccion(event.getDireccion());
        model.setAgencia(event.getAgencia());
        model.setEjecutivoAsignado(event.getEjecutivoAsignado());
        model.setEjecutivoId(event.getEjecutivoId());
        model.setCorreoEjecutivo(event.getCorreoEjecutivo());
        model.setAutenticador(event.getAutenticador());
        model.setUpdatedBy(event.getPerformedBy());
        return model;
    }
}
