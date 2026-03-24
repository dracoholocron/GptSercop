package com.globalcmx.api.readmodel.projection;

import com.globalcmx.api.dto.event.ReglaEventoEvent;
import com.globalcmx.api.readmodel.entity.ReglaEventoReadModel;
import com.globalcmx.api.readmodel.repository.ReglaEventoReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReglaEventoProjection {

    private final ReglaEventoReadModelRepository reglaEventoReadModelRepository;

    @KafkaListener(topics = "regla-evento-events", groupId = "regla-evento-projection-group")
    @Transactional(transactionManager = "readModelTransactionManager")
    public void handleReglaEventoEvent(ReglaEventoEvent event) {
        log.info("Procesando evento de regla evento: {} para ID: {}", event.getEventType(), event.getReglaEventoId());

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
            log.error("Error procesando evento de regla evento: {}", e.getMessage(), e);
            throw e;
        }
    }

    private void handleCreated(ReglaEventoEvent event) {
        ReglaEventoReadModel reglaEvento = ReglaEventoReadModel.builder()
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
                .createdBy(event.getPerformedBy())
                .aggregateId("REGLA_EVENTO-" + event.getReglaEventoId())
                .version(0L)
                .build();

        reglaEventoReadModelRepository.save(reglaEvento);
        log.info("Regla evento creada en read model: {}", event.getReglaEventoId());
    }

    private void handleUpdated(ReglaEventoEvent event) {
        ReglaEventoReadModel reglaEvento = reglaEventoReadModelRepository.findById(event.getReglaEventoId())
                .orElseThrow(() -> new RuntimeException("Regla evento no encontrada: " + event.getReglaEventoId()));

        reglaEvento.setCodigo(event.getCodigo());
        reglaEvento.setNombre(event.getNombre());
        reglaEvento.setDescripcion(event.getDescripcion());
        reglaEvento.setTipoOperacion(event.getTipoOperacion());
        reglaEvento.setEventoTrigger(event.getEventoTrigger());
        reglaEvento.setCondicionesDRL(event.getCondicionesDRL());
        reglaEvento.setAccionesJson(event.getAccionesJson());
        reglaEvento.setPrioridad(event.getPrioridad());
        reglaEvento.setActivo(event.getActivo());
        reglaEvento.setUpdatedAt(event.getTimestamp());
        reglaEvento.setUpdatedBy(event.getPerformedBy());

        reglaEventoReadModelRepository.save(reglaEvento);
        log.info("Regla evento actualizada en read model: {}", event.getReglaEventoId());
    }

    private void handleDeleted(ReglaEventoEvent event) {
        reglaEventoReadModelRepository.deleteById(event.getReglaEventoId());
        log.info("Regla evento eliminada del read model: {}", event.getReglaEventoId());
    }
}
