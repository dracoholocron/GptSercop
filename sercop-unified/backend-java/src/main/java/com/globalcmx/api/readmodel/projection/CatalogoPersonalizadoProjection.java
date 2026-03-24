package com.globalcmx.api.readmodel.projection;

import com.globalcmx.api.dto.event.CatalogoPersonalizadoEvent;
import com.globalcmx.api.readmodel.entity.CatalogoPersonalizadoReadModel;
import com.globalcmx.api.readmodel.repository.CatalogoPersonalizadoReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CatalogoPersonalizadoProjection {

    private final CatalogoPersonalizadoReadModelRepository catalogoPersonalizadoReadModelRepository;

    @KafkaListener(topics = "catalogopersonalizado-events", groupId = "catalogo-personalizado-projection-group")
    @Transactional(transactionManager = "readModelTransactionManager")
    public void handleCatalogoPersonalizadoEvent(CatalogoPersonalizadoEvent event) {
        log.info("Procesando evento de catálogo personalizado: {} para ID: {}", event.getEventType(), event.getCatalogoPersonalizadoId());

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
            log.error("Error procesando evento de catálogo personalizado: {}", e.getMessage(), e);
            throw e;
        }
    }

    private void handleCreated(CatalogoPersonalizadoEvent event) {
        CatalogoPersonalizadoReadModel catalogo = CatalogoPersonalizadoReadModel.builder()
                .id(event.getCatalogoPersonalizadoId())
                .codigo(event.getCodigo())
                .nombre(event.getNombre())
                .descripcion(event.getDescripcion())
                .nivel(event.getNivel())
                .catalogoPadreId(event.getCatalogoPadreId())
                .codigoCatalogoPadre(event.getCodigoCatalogoPadre())
                .nombreCatalogoPadre(event.getNombreCatalogoPadre())
                .activo(event.getActivo())
                .orden(event.getOrden())
                .createdBy(event.getPerformedBy())
                .build();

        catalogoPersonalizadoReadModelRepository.save(catalogo);
        log.info("Catálogo personalizado creado en read model: {}", event.getCatalogoPersonalizadoId());
    }

    private void handleUpdated(CatalogoPersonalizadoEvent event) {
        CatalogoPersonalizadoReadModel catalogo = catalogoPersonalizadoReadModelRepository.findById(event.getCatalogoPersonalizadoId())
                .orElseThrow(() -> new RuntimeException("Catálogo personalizado no encontrado: " + event.getCatalogoPersonalizadoId()));

        catalogo.setCodigo(event.getCodigo());
        catalogo.setNombre(event.getNombre());
        catalogo.setDescripcion(event.getDescripcion());
        catalogo.setNivel(event.getNivel());
        catalogo.setCatalogoPadreId(event.getCatalogoPadreId());
        catalogo.setCodigoCatalogoPadre(event.getCodigoCatalogoPadre());
        catalogo.setNombreCatalogoPadre(event.getNombreCatalogoPadre());
        catalogo.setActivo(event.getActivo());
        catalogo.setOrden(event.getOrden());
        catalogo.setUpdatedBy(event.getPerformedBy());

        catalogoPersonalizadoReadModelRepository.save(catalogo);
        log.info("Catálogo personalizado actualizado en read model: {}", event.getCatalogoPersonalizadoId());
    }

    private void handleDeleted(CatalogoPersonalizadoEvent event) {
        catalogoPersonalizadoReadModelRepository.deleteById(event.getCatalogoPersonalizadoId());
        log.info("Catálogo personalizado eliminado del read model: {}", event.getCatalogoPersonalizadoId());
    }
}
