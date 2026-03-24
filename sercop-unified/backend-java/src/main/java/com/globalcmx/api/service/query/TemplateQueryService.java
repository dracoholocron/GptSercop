package com.globalcmx.api.service.query;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.query.EventHistoryDTO;
import com.globalcmx.api.dto.query.PlantillaQueryDTO;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.readmodel.entity.PlantillaReadModel;
import com.globalcmx.api.readmodel.repository.PlantillaReadModelRepository;
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
@Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
public class TemplateQueryService {

    private final PlantillaReadModelRepository readModelRepository;
    private final EventStoreService eventStoreService;
    private final ObjectMapper objectMapper;

    public List<PlantillaQueryDTO> getAllPlantillas() {
        log.info("Querying all plantillas from Read Model");
        return readModelRepository.findAll()
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public PlantillaQueryDTO getPlantillaById(Long id) {
        log.info("Querying plantilla by ID from Read Model: {}", id);
        return readModelRepository.findById(id)
            .map(this::convertToDTO)
            .orElseThrow(() -> new IllegalArgumentException("Plantilla no encontrada con ID: " + id));
    }

    public PlantillaQueryDTO getPlantillaByCodigo(String codigo) {
        log.info("Querying plantilla by codigo from Read Model: {}", codigo);
        return readModelRepository.findByCodigo(codigo)
            .map(this::convertToDTO)
            .orElseThrow(() -> new IllegalArgumentException("Plantilla no encontrada con código: " + codigo));
    }

    public List<PlantillaQueryDTO> getActivePlantillasOnly() {
        log.info("Querying only active plantillas from Read Model");
        return readModelRepository.findByActivoOrderByNombreAsc(true)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<PlantillaQueryDTO> getPlantillasByTipoDocumento(String tipoDocumento) {
        log.info("Querying plantillas by tipo documento from Read Model: {}", tipoDocumento);
        return readModelRepository.findByTipoDocumento(tipoDocumento)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<EventHistoryDTO> getEventHistory(Long plantillaId) {
        log.info("Querying event history for plantilla ID: {}", plantillaId);
        String aggregateId = "PLANTILLA-" + plantillaId;

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

    private PlantillaQueryDTO convertToDTO(PlantillaReadModel readModel) {
        return PlantillaQueryDTO.builder()
            .id(readModel.getId())
            .codigo(readModel.getCodigo())
            .nombre(readModel.getNombre())
            .descripcion(readModel.getDescripcion())
            .tipoDocumento(readModel.getTipoDocumento())
            .nombreArchivo(readModel.getNombreArchivo())
            .rutaArchivo(readModel.getRutaArchivo())
            .tamanioArchivo(readModel.getTamanioArchivo())
            .activo(readModel.getActivo())
            .createdAt(readModel.getCreatedAt())
            .updatedAt(readModel.getUpdatedAt())
            .createdBy(readModel.getCreatedBy())
            .updatedBy(readModel.getUpdatedBy())
            .build();
    }
}
