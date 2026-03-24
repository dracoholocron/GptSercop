package com.globalcmx.api.service.query;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.query.EventHistoryDTO;
import com.globalcmx.api.dto.query.MonedaQueryDTO;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.readmodel.entity.MonedaReadModel;
import com.globalcmx.api.readmodel.repository.MonedaReadModelRepository;
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
public class CurrencyQueryService {

    private final MonedaReadModelRepository readModelRepository;
    private final EventStoreService eventStoreService;
    private final ObjectMapper objectMapper;

    public List<MonedaQueryDTO> getAllMonedas() {
        log.info("Querying all monedas from Read Model");
        return readModelRepository.findAll()
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public MonedaQueryDTO getMonedaById(Long id) {
        log.info("Querying moneda by ID from Read Model: {}", id);
        return readModelRepository.findById(id)
            .map(this::convertToDTO)
            .orElseThrow(() -> new IllegalArgumentException("Moneda no encontrada con ID: " + id));
    }

    public MonedaQueryDTO getMonedaByCodigo(String codigo) {
        log.info("Querying moneda by codigo from Read Model: {}", codigo);
        return readModelRepository.findByCodigo(codigo)
            .map(this::convertToDTO)
            .orElseThrow(() -> new IllegalArgumentException("Moneda no encontrada con código: " + codigo));
    }

    public List<MonedaQueryDTO> getActiveMonedasOnly() {
        log.info("Querying only active monedas from Read Model");
        return readModelRepository.findAll()
            .stream()
            .filter(MonedaReadModel::getActivo)
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<MonedaQueryDTO> searchByNombre(String nombre) {
        log.info("Searching monedas by nombre from Read Model: {}", nombre);
        return readModelRepository.findAll()
            .stream()
            .filter(m -> m.getNombre().toLowerCase().contains(nombre.toLowerCase()))
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<EventHistoryDTO> getEventHistory(Long monedaId) {
        log.info("Querying event history for moneda ID: {}", monedaId);
        String aggregateId = "MONEDA-" + monedaId;

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

    private MonedaQueryDTO convertToDTO(MonedaReadModel readModel) {
        return MonedaQueryDTO.builder()
            .id(readModel.getId())
            .codigo(readModel.getCodigo())
            .nombre(readModel.getNombre())
            .simbolo(readModel.getSimbolo())
            .activo(readModel.getActivo())
            .createdAt(readModel.getCreatedAt())
            .updatedAt(readModel.getUpdatedAt())
            .createdBy(readModel.getCreatedBy())
            .updatedBy(readModel.getUpdatedBy())
            .build();
    }
}
