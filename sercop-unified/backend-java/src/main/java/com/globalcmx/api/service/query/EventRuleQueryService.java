package com.globalcmx.api.service.query;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.query.EventHistoryDTO;
import com.globalcmx.api.dto.query.ReglaEventoQueryDTO;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.readmodel.entity.ReglaEventoReadModel;
import com.globalcmx.api.readmodel.repository.ReglaEventoReadModelRepository;
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
public class EventRuleQueryService {

    private final ReglaEventoReadModelRepository readModelRepository;
    private final EventStoreService eventStoreService;
    private final ObjectMapper objectMapper;

    public List<ReglaEventoQueryDTO> getAllReglasEventos() {
        log.info("Querying all reglas eventos from Read Model");
        return readModelRepository.findAll()
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public ReglaEventoQueryDTO getReglaEventoById(Long id) {
        log.info("Querying regla evento by ID from Read Model: {}", id);
        return readModelRepository.findById(id)
            .map(this::convertToDTO)
            .orElseThrow(() -> new IllegalArgumentException("Regla de evento no encontrada con ID: " + id));
    }

    public ReglaEventoQueryDTO getReglaEventoByCodigo(String codigo) {
        log.info("Querying regla evento by codigo from Read Model: {}", codigo);
        return readModelRepository.findByCodigo(codigo)
            .map(this::convertToDTO)
            .orElseThrow(() -> new IllegalArgumentException("Regla de evento no encontrada con código: " + codigo));
    }

    public List<ReglaEventoQueryDTO> getReglasActivasOnly() {
        log.info("Querying only active reglas eventos from Read Model");
        return readModelRepository.findByActivoOrderByPrioridadAsc(true)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<ReglaEventoQueryDTO> getReglasActivasByTipoOperacion(String tipoOperacion) {
        log.info("Querying active reglas eventos by tipo operacion from Read Model: {}", tipoOperacion);
        return readModelRepository.findByTipoOperacionAndActivoOrderByPrioridadAsc(tipoOperacion, true)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<ReglaEventoQueryDTO> getReglasActivasByEventoTrigger(String eventoTrigger) {
        log.info("Querying active reglas eventos by evento trigger from Read Model: {}", eventoTrigger);
        return readModelRepository.findByEventoTriggerAndActivoOrderByPrioridadAsc(eventoTrigger, true)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<ReglaEventoQueryDTO> getReglasActivasByTipoOperacionAndEventoTrigger(
            String tipoOperacion, String eventoTrigger) {
        log.info("Querying active reglas eventos by tipo operacion and evento trigger from Read Model: {} - {}",
                tipoOperacion, eventoTrigger);
        return readModelRepository.findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                tipoOperacion, eventoTrigger, true)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<EventHistoryDTO> getEventHistory(Long reglaEventoId) {
        log.info("Querying event history for regla evento ID: {}", reglaEventoId);
        String aggregateId = "REGLA_EVENTO-" + reglaEventoId;

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

    private ReglaEventoQueryDTO convertToDTO(ReglaEventoReadModel readModel) {
        return ReglaEventoQueryDTO.builder()
            .id(readModel.getId())
            .codigo(readModel.getCodigo())
            .nombre(readModel.getNombre())
            .descripcion(readModel.getDescripcion())
            .tipoOperacion(readModel.getTipoOperacion())
            .eventoTrigger(readModel.getEventoTrigger())
            .condicionesDRL(readModel.getCondicionesDRL())
            .accionesJson(readModel.getAccionesJson())
            .prioridad(readModel.getPrioridad())
            .activo(readModel.getActivo())
            .createdAt(readModel.getCreatedAt())
            .updatedAt(readModel.getUpdatedAt())
            .createdBy(readModel.getCreatedBy())
            .updatedBy(readModel.getUpdatedBy())
            .build();
    }
}
