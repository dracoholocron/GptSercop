package com.globalcmx.api.service.query;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.query.CotizacionQueryDTO;
import com.globalcmx.api.dto.query.EventHistoryDTO;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.readmodel.entity.CotizacionReadModel;
import com.globalcmx.api.readmodel.repository.CotizacionReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
public class ExchangeRateQueryService {

    private final CotizacionReadModelRepository readModelRepository;
    private final EventStoreService eventStoreService;
    private final ObjectMapper objectMapper;

    public List<CotizacionQueryDTO> getAllCotizaciones() {
        log.info("Querying all cotizaciones from Read Model");
        return readModelRepository.findAll()
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public CotizacionQueryDTO getCotizacionById(Long id) {
        log.info("Querying cotizacion by ID from Read Model: {}", id);
        return readModelRepository.findById(id)
            .map(this::convertToDTO)
            .orElseThrow(() -> new IllegalArgumentException("Cotizacion no encontrada con ID: " + id));
    }

    public List<CotizacionQueryDTO> getCotizacionesByMoneda(String codigoMoneda) {
        log.info("Querying cotizaciones by moneda from Read Model: {}", codigoMoneda);
        return readModelRepository.findByCodigoMoneda(codigoMoneda)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<CotizacionQueryDTO> getCotizacionesByFecha(LocalDate fecha) {
        log.info("Querying cotizaciones by fecha from Read Model: {}", fecha);
        return readModelRepository.findByFecha(fecha)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public CotizacionQueryDTO getCotizacionByMonedaAndFecha(String codigoMoneda, LocalDate fecha) {
        log.info("Querying cotizacion by moneda and fecha from Read Model: {} - {}", codigoMoneda, fecha);
        return readModelRepository.findByCodigoMonedaAndFecha(codigoMoneda, fecha)
            .map(this::convertToDTO)
            .orElseThrow(() -> new IllegalArgumentException(
                "Cotizacion no encontrada para moneda: " + codigoMoneda + " en fecha: " + fecha));
    }

    public List<CotizacionQueryDTO> getLatestCotizaciones() {
        log.info("Querying latest cotizaciones from Read Model");
        return readModelRepository.findLatest()
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<CotizacionQueryDTO> getCotizacionesByFechaRange(LocalDate startDate, LocalDate endDate) {
        log.info("Querying cotizaciones by fecha range from Read Model: {} - {}", startDate, endDate);
        return readModelRepository.findByFechaBetween(startDate, endDate)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<EventHistoryDTO> getEventHistory(Long cotizacionId) {
        log.info("Querying event history for cotizacion ID: {}", cotizacionId);
        String aggregateId = "COTIZACION-" + cotizacionId;

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

    private CotizacionQueryDTO convertToDTO(CotizacionReadModel readModel) {
        return CotizacionQueryDTO.builder()
            .id(readModel.getId())
            .codigoMoneda(readModel.getCodigoMoneda())
            .fecha(readModel.getFecha())
            .valorCompra(readModel.getValorCompra())
            .valorVenta(readModel.getValorVenta())
            .createdAt(readModel.getCreatedAt())
            .updatedAt(readModel.getUpdatedAt())
            .createdBy(readModel.getCreatedBy())
            .updatedBy(readModel.getUpdatedBy())
            .build();
    }
}
