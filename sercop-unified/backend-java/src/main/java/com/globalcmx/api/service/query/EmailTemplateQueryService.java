package com.globalcmx.api.service.query;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.query.EventHistoryDTO;
import com.globalcmx.api.dto.query.PlantillaCorreoQueryDTO;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.readmodel.entity.PlantillaCorreoReadModel;
import com.globalcmx.api.readmodel.repository.PlantillaCorreoReadModelRepository;
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
public class EmailTemplateQueryService {

    private final PlantillaCorreoReadModelRepository readModelRepository;
    private final EventStoreService eventStoreService;
    private final ObjectMapper objectMapper;

    public List<PlantillaCorreoQueryDTO> getAllPlantillasCorreo() {
        log.info("Querying all plantillas correo from Read Model");
        return readModelRepository.findAll()
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public PlantillaCorreoQueryDTO getPlantillaCorreoById(Long id) {
        log.info("Querying plantilla correo by ID from Read Model: {}", id);
        return readModelRepository.findById(id)
            .map(this::convertToDTO)
            .orElseThrow(() -> new IllegalArgumentException("Plantilla de correo no encontrada con ID: " + id));
    }

    public PlantillaCorreoQueryDTO getPlantillaCorreoByCodigo(String codigo) {
        log.info("Querying plantilla correo by codigo from Read Model: {}", codigo);
        return readModelRepository.findByCodigo(codigo)
            .map(this::convertToDTO)
            .orElseThrow(() -> new IllegalArgumentException("Plantilla de correo no encontrada con código: " + codigo));
    }

    public List<PlantillaCorreoQueryDTO> getActivePlantillasCorreoOnly() {
        log.info("Querying only active plantillas correo from Read Model");
        return readModelRepository.findByActivoOrderByNombreAsc(true)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<EventHistoryDTO> getEventHistory(Long plantillaCorreoId) {
        log.info("Querying event history for plantilla correo ID: {}", plantillaCorreoId);
        String aggregateId = "PLANTILLA_CORREO-" + plantillaCorreoId;

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

    private PlantillaCorreoQueryDTO convertToDTO(PlantillaCorreoReadModel readModel) {
        return PlantillaCorreoQueryDTO.builder()
            .id(readModel.getId())
            .codigo(readModel.getCodigo())
            .nombre(readModel.getNombre())
            .descripcion(readModel.getDescripcion())
            .asunto(readModel.getAsunto())
            .cuerpoHtml(readModel.getCuerpoHtml())
            .plantillasAdjuntas(readModel.getPlantillasAdjuntas())
            .activo(readModel.getActivo())
            .createdAt(readModel.getCreatedAt())
            .updatedAt(readModel.getUpdatedAt())
            .createdBy(readModel.getCreatedBy())
            .updatedBy(readModel.getUpdatedBy())
            .build();
    }
}
