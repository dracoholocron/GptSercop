package com.globalcmx.api.readmodel.projection;

import com.globalcmx.api.dto.event.ParticipanteEvent;
import com.globalcmx.api.readmodel.entity.ParticipanteReadModel;
import com.globalcmx.api.readmodel.repository.ParticipanteReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ParticipanteProjection {

    private final ParticipanteReadModelRepository participanteReadModelRepository;

    @KafkaListener(topics = "participante-events", groupId = "participante-projection-group")
    @Transactional(transactionManager = "readModelTransactionManager")
    public void handleParticipanteEvent(ParticipanteEvent event) {
        log.info("Procesando evento de participante: {} para ID: {}", event.getEventType(), event.getParticipanteId());

        try {
            switch (event.getEventType()) {
                case CREATED:
                    handleCreated(event);
                    break;
                case UPDATED:
                    handleUpdated(event);
                    break;
                case DELETED:
                    handleDeleted(event);
                    break;
                default:
                    log.warn("Tipo de evento desconocido: {}", event.getEventType());
            }
        } catch (Exception e) {
            log.error("Error procesando evento de participante: {}", e.getMessage(), e);
            throw e;
        }
    }

    private void handleCreated(ParticipanteEvent event) {
        ParticipanteReadModel participante = ParticipanteReadModel.builder()
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

        participanteReadModelRepository.save(participante);
        log.info("Participante creado en read model: {}", event.getParticipanteId());
    }

    private void handleUpdated(ParticipanteEvent event) {
        ParticipanteReadModel participante = participanteReadModelRepository.findById(event.getParticipanteId())
                .orElseThrow(() -> new RuntimeException("Participante no encontrado: " + event.getParticipanteId()));

        participante.setIdentificacion(event.getIdentificacion());
        participante.setTipo(event.getTipo());
        participante.setTipoReferencia(event.getTipoReferencia());
        participante.setNombres(event.getNombres());
        participante.setApellidos(event.getApellidos());
        participante.setEmail(event.getEmail());
        participante.setTelefono(event.getTelefono());
        participante.setDireccion(event.getDireccion());
        participante.setAgencia(event.getAgencia());
        participante.setEjecutivoAsignado(event.getEjecutivoAsignado());
        participante.setEjecutivoId(event.getEjecutivoId());
        participante.setCorreoEjecutivo(event.getCorreoEjecutivo());
        participante.setAutenticador(event.getAutenticador());
        participante.setUpdatedBy(event.getPerformedBy());

        participanteReadModelRepository.save(participante);
        log.info("Participante actualizado en read model: {}", event.getParticipanteId());
    }

    private void handleDeleted(ParticipanteEvent event) {
        participanteReadModelRepository.deleteById(event.getParticipanteId());
        log.info("Participante eliminado del read model: {}", event.getParticipanteId());
    }
}
