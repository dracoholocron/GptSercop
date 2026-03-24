package com.globalcmx.api.service.query;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.query.EventHistoryDTO;
import com.globalcmx.api.dto.query.LineaCreditoQueryDTO;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.readmodel.entity.LineaCreditoReadModel;
import com.globalcmx.api.readmodel.repository.LineaCreditoReadModelRepository;
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
public class CreditLineQueryService {

    private final LineaCreditoReadModelRepository readModelRepository;
    private final EventStoreService eventStoreService;
    private final ObjectMapper objectMapper;

    public List<LineaCreditoQueryDTO> getAll() {
        log.info("Querying all lineas de credito from Read Model");
        return readModelRepository.findAll()
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public LineaCreditoQueryDTO getById(Long id) {
        log.info("Querying linea de credito by ID from Read Model: {}", id);
        return readModelRepository.findById(id)
            .map(this::convertToDTO)
            .orElseThrow(() -> new IllegalArgumentException("Línea de crédito no encontrada con ID: " + id));
    }

    public List<LineaCreditoQueryDTO> getByCliente(Long clienteId) {
        log.info("Querying lineas de credito by clienteId from Read Model: {}", clienteId);
        return readModelRepository.findByClienteId(clienteId)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<LineaCreditoQueryDTO> getByEstado(String estado) {
        log.info("Querying lineas de credito by estado from Read Model: {}", estado);
        return readModelRepository.findByEstado(estado)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<LineaCreditoQueryDTO> getByClienteAndEstado(Long clienteId, String estado) {
        log.info("Querying lineas de credito by clienteId: {} and estado: {} from Read Model",
            clienteId, estado);
        return readModelRepository.findByClienteIdAndEstado(clienteId, estado)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<LineaCreditoQueryDTO> getByTipo(String tipo) {
        log.info("Querying lineas de credito by tipo from Read Model: {}", tipo);
        return readModelRepository.findByTipo(tipo)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<LineaCreditoQueryDTO> getByMoneda(String moneda) {
        log.info("Querying lineas de credito by moneda from Read Model: {}", moneda);
        return readModelRepository.findByMoneda(moneda)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<EventHistoryDTO> getEventHistory(Long lineaCreditoId) {
        log.info("Querying event history for linea de credito ID: {}", lineaCreditoId);
        String aggregateId = "LINEA_CREDITO-" + lineaCreditoId;

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

    private LineaCreditoQueryDTO convertToDTO(LineaCreditoReadModel readModel) {
        return LineaCreditoQueryDTO.builder()
            .id(readModel.getId())
            .clienteId(readModel.getClienteId())
            .tipo(readModel.getTipo())
            .moneda(readModel.getMoneda())
            .montoAutorizado(readModel.getMontoAutorizado())
            .montoUtilizado(readModel.getMontoUtilizado())
            .montoDisponible(readModel.getMontoDisponible())
            .fechaAutorizacion(readModel.getFechaAutorizacion())
            .fechaVencimiento(readModel.getFechaVencimiento())
            .tasaReferencia(readModel.getTasaReferencia())
            .spread(readModel.getSpread())
            .estado(readModel.getEstado())
            .createdAt(readModel.getCreatedAt())
            .updatedAt(readModel.getUpdatedAt())
            .aggregateId(readModel.getAggregateId())
            .version(readModel.getVersion())
            .build();
    }
}
