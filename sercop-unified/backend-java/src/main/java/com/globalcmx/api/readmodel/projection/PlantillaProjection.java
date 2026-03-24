package com.globalcmx.api.readmodel.projection;

import com.globalcmx.api.dto.event.PlantillaEvent;
import com.globalcmx.api.readmodel.entity.PlantillaReadModel;
import com.globalcmx.api.readmodel.repository.PlantillaReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlantillaProjection {

    private final PlantillaReadModelRepository plantillaReadModelRepository;

    @KafkaListener(topics = "plantilla-events", groupId = "plantilla-projection-group")
    @Transactional(transactionManager = "readModelTransactionManager")
    public void handlePlantillaEvent(PlantillaEvent event) {
        log.info("Procesando evento de plantilla: {} para ID: {}", event.getEventType(), event.getPlantillaId());

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
            log.error("Error procesando evento de plantilla: {}", e.getMessage(), e);
            throw e;
        }
    }

    private void handleCreated(PlantillaEvent event) {
        PlantillaReadModel plantilla = PlantillaReadModel.builder()
                .id(event.getPlantillaId())
                .codigo(event.getCodigo())
                .nombre(event.getNombre())
                .descripcion(event.getDescripcion())
                .tipoDocumento(event.getTipoDocumento())
                .nombreArchivo(event.getNombreArchivo())
                .rutaArchivo(event.getRutaArchivo())
                .tamanioArchivo(event.getTamanioArchivo())
                .activo(event.getActivo())
                .createdBy(event.getPerformedBy())
                .version(0L)
                .build();

        plantillaReadModelRepository.save(plantilla);
        log.info("Plantilla creada en read model: {}", event.getPlantillaId());
    }

    private void handleUpdated(PlantillaEvent event) {
        PlantillaReadModel plantilla = plantillaReadModelRepository.findById(event.getPlantillaId())
                .orElseThrow(() -> new RuntimeException("Plantilla no encontrada: " + event.getPlantillaId()));

        plantilla.setCodigo(event.getCodigo());
        plantilla.setNombre(event.getNombre());
        plantilla.setDescripcion(event.getDescripcion());
        plantilla.setTipoDocumento(event.getTipoDocumento());
        plantilla.setNombreArchivo(event.getNombreArchivo());
        plantilla.setRutaArchivo(event.getRutaArchivo());
        plantilla.setTamanioArchivo(event.getTamanioArchivo());
        plantilla.setActivo(event.getActivo());
        plantilla.setUpdatedBy(event.getPerformedBy());

        plantillaReadModelRepository.save(plantilla);
        log.info("Plantilla actualizada en read model: {}", event.getPlantillaId());
    }

    private void handleDeleted(PlantillaEvent event) {
        plantillaReadModelRepository.deleteById(event.getPlantillaId());
        log.info("Plantilla eliminada del read model: {}", event.getPlantillaId());
    }
}
