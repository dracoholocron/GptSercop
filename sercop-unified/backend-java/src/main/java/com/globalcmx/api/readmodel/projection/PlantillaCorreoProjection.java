package com.globalcmx.api.readmodel.projection;

import com.globalcmx.api.dto.event.PlantillaCorreoEvent;
import com.globalcmx.api.readmodel.entity.PlantillaCorreoReadModel;
import com.globalcmx.api.readmodel.repository.PlantillaCorreoReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlantillaCorreoProjection {

    private final PlantillaCorreoReadModelRepository plantillaCorreoReadModelRepository;

    @KafkaListener(topics = "plantilla-correo-events", groupId = "plantilla-correo-projection-group")
    @Transactional(transactionManager = "readModelTransactionManager")
    public void handlePlantillaCorreoEvent(PlantillaCorreoEvent event) {
        log.info("Procesando evento de plantilla correo: {} para ID: {}", event.getEventType(), event.getPlantillaCorreoId());

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
            log.error("Error procesando evento de plantilla correo: {}", e.getMessage(), e);
            throw e;
        }
    }

    private void handleCreated(PlantillaCorreoEvent event) {
        PlantillaCorreoReadModel plantillaCorreo = PlantillaCorreoReadModel.builder()
                .id(event.getPlantillaCorreoId())
                .codigo(event.getCodigo())
                .nombre(event.getNombre())
                .descripcion(event.getDescripcion())
                .asunto(event.getAsunto())
                .cuerpoHtml(event.getCuerpoHtml())
                .plantillasAdjuntas(event.getPlantillasAdjuntas())
                .activo(event.getActivo())
                .createdBy(event.getPerformedBy())
                .version(0L)
                .build();

        plantillaCorreoReadModelRepository.save(plantillaCorreo);
        log.info("Plantilla correo creada en read model: {}", event.getPlantillaCorreoId());
    }

    private void handleUpdated(PlantillaCorreoEvent event) {
        PlantillaCorreoReadModel plantillaCorreo = plantillaCorreoReadModelRepository.findById(event.getPlantillaCorreoId())
                .orElseThrow(() -> new RuntimeException("Plantilla correo no encontrada: " + event.getPlantillaCorreoId()));

        plantillaCorreo.setCodigo(event.getCodigo());
        plantillaCorreo.setNombre(event.getNombre());
        plantillaCorreo.setDescripcion(event.getDescripcion());
        plantillaCorreo.setAsunto(event.getAsunto());
        plantillaCorreo.setCuerpoHtml(event.getCuerpoHtml());
        plantillaCorreo.setPlantillasAdjuntas(event.getPlantillasAdjuntas());
        plantillaCorreo.setActivo(event.getActivo());
        plantillaCorreo.setUpdatedBy(event.getPerformedBy());

        plantillaCorreoReadModelRepository.save(plantillaCorreo);
        log.info("Plantilla correo actualizada en read model: {}", event.getPlantillaCorreoId());
    }

    private void handleDeleted(PlantillaCorreoEvent event) {
        plantillaCorreoReadModelRepository.deleteById(event.getPlantillaCorreoId());
        log.info("Plantilla correo eliminada del read model: {}", event.getPlantillaCorreoId());
    }
}
