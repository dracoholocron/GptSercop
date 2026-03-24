package com.globalcmx.api.service.query;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.query.CatalogoPersonalizadoQueryDTO;
import com.globalcmx.api.dto.query.EventHistoryDTO;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.readmodel.entity.CatalogoPersonalizadoReadModel;
import com.globalcmx.api.readmodel.repository.CatalogoPersonalizadoReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomCatalogQueryService {

    private final CatalogoPersonalizadoReadModelRepository catalogoPersonalizadoReadModelRepository;
    private final EventStoreService eventStoreService;
    private final ObjectMapper objectMapper;

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<CatalogoPersonalizadoQueryDTO> getAllCatalogosPersonalizados() {
        log.info("Obteniendo todos los catálogos personalizados");
        return catalogoPersonalizadoReadModelRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public CatalogoPersonalizadoQueryDTO getCatalogoPersonalizadoById(Long id) {
        log.info("Obteniendo catálogo personalizado por ID: {}", id);
        CatalogoPersonalizadoReadModel catalogo = catalogoPersonalizadoReadModelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Catálogo personalizado no encontrado: " + id));
        return toDTO(catalogo);
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public CatalogoPersonalizadoQueryDTO getCatalogoPersonalizadoByCodigo(String codigo) {
        log.info("Obteniendo catálogo personalizado por código: {}", codigo);
        CatalogoPersonalizadoReadModel catalogo = catalogoPersonalizadoReadModelRepository.findByCodigo(codigo)
                .orElseThrow(() -> new RuntimeException("Catálogo personalizado no encontrado con código: " + codigo));
        return toDTO(catalogo);
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<CatalogoPersonalizadoQueryDTO> getCatalogosByCatalogoPadreId(Long catalogoPadreId) {
        log.info("Obteniendo catálogos personalizados por catalogoPadreId: {}", catalogoPadreId);
        return catalogoPersonalizadoReadModelRepository.findByCatalogoPadreId(catalogoPadreId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<CatalogoPersonalizadoQueryDTO> getCatalogosByCodigoPadre(String codigoPadre) {
        log.info("Obteniendo catálogos personalizados por código padre: {}", codigoPadre);
        // Primero buscar el catálogo padre por código
        CatalogoPersonalizadoReadModel catalogoPadre = catalogoPersonalizadoReadModelRepository.findByCodigo(codigoPadre)
                .orElseThrow(() -> new RuntimeException("Catálogo padre no encontrado con código: " + codigoPadre));
        // Luego obtener los hijos
        return catalogoPersonalizadoReadModelRepository.findByCatalogoPadreId(catalogoPadre.getId()).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<CatalogoPersonalizadoQueryDTO> getCatalogosByNivel(Integer nivel) {
        log.info("Obteniendo catálogos personalizados por nivel: {}", nivel);
        return catalogoPersonalizadoReadModelRepository.findByNivel(nivel).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<CatalogoPersonalizadoQueryDTO> getCatalogosByActivo(Boolean activo) {
        log.info("Obteniendo catálogos personalizados por estado activo: {}", activo);
        return catalogoPersonalizadoReadModelRepository.findByActivo(activo).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<CatalogoPersonalizadoQueryDTO> getCatalogosByNivelAndActivo(Integer nivel, Boolean activo) {
        log.info("Obteniendo catálogos personalizados por nivel: {} y activo: {}", nivel, activo);
        return catalogoPersonalizadoReadModelRepository.findByNivelAndActivoOrderByOrdenAsc(nivel, activo).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<CatalogoPersonalizadoQueryDTO> getCatalogosByCatalogoPadreIdAndActivo(Long catalogoPadreId, Boolean activo) {
        log.info("Obteniendo catálogos personalizados por catalogoPadreId: {} y activo: {}", catalogoPadreId, activo);
        return catalogoPersonalizadoReadModelRepository.findByCatalogoPadreIdAndActivoOrderByOrdenAsc(catalogoPadreId, activo).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(transactionManager = "eventStoreTransactionManager", readOnly = true)
    public List<EventHistoryDTO> getEventHistory(Long id) {
        log.info("Obteniendo historial de eventos para catálogo personalizado: {}", id);
        String aggregateId = "CATALOGO_PERSONALIZADO-" + id;

        return eventStoreService.getEvents(aggregateId)
                .stream()
                .map(event -> {
                    try {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> eventData = objectMapper.readValue(event.getEventData(), Map.class);

                        return EventHistoryDTO.builder()
                                .eventId(event.getEventId())
                                .eventType(event.getEventType())
                                .timestamp(event.getTimestamp())
                                .performedBy(event.getPerformedBy())
                                .version(event.getVersion())
                                .eventData(eventData)
                                .build();
                    } catch (Exception e) {
                        log.error("Error parsing event data for event: {}", event.getEventId(), e);
                        return null;
                    }
                })
                .filter(event -> event != null)
                .collect(Collectors.toList());
    }

    private CatalogoPersonalizadoQueryDTO toDTO(CatalogoPersonalizadoReadModel model) {
        return CatalogoPersonalizadoQueryDTO.builder()
                .id(model.getId())
                .codigo(model.getCodigo())
                .nombre(model.getNombre())
                .descripcion(model.getDescripcion())
                .nivel(model.getNivel())
                .catalogoPadreId(model.getCatalogoPadreId())
                .codigoCatalogoPadre(model.getCodigoCatalogoPadre())
                .nombreCatalogoPadre(model.getNombreCatalogoPadre())
                .activo(model.getActivo())
                .isSystem(model.getIsSystem())
                .orden(model.getOrden())
                .createdAt(model.getCreatedAt())
                .updatedAt(model.getUpdatedAt())
                .createdBy(model.getCreatedBy())
                .updatedBy(model.getUpdatedBy())
                .build();
    }
}
