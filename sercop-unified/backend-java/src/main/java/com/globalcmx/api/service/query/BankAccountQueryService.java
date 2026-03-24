package com.globalcmx.api.service.query;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.query.CuentaBancariaQueryDTO;
import com.globalcmx.api.dto.query.EventHistoryDTO;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.readmodel.entity.CuentaBancariaReadModel;
import com.globalcmx.api.readmodel.repository.CuentaBancariaReadModelRepository;
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
public class BankAccountQueryService {

    private final CuentaBancariaReadModelRepository cuentaBancariaReadModelRepository;
    private final EventStoreService eventStoreService;
    private final ObjectMapper objectMapper;

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<CuentaBancariaQueryDTO> getAllCuentasBancarias() {
        log.info("Obteniendo todas las cuentas bancarias");
        return cuentaBancariaReadModelRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public CuentaBancariaQueryDTO getCuentaBancariaById(Long id) {
        log.info("Obteniendo cuenta bancaria por ID: {}", id);
        CuentaBancariaReadModel cuentaBancaria = cuentaBancariaReadModelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cuenta bancaria no encontrada: " + id));
        return toDTO(cuentaBancaria);
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public CuentaBancariaQueryDTO getCuentaBancariaByIdentificacion(String identificacionCuenta) {
        log.info("Obteniendo cuenta bancaria por identificacion: {}", identificacionCuenta);
        CuentaBancariaReadModel cuentaBancaria = cuentaBancariaReadModelRepository.findByIdentificacionCuenta(identificacionCuenta)
                .orElseThrow(() -> new RuntimeException("Cuenta bancaria no encontrada con identificacion: " + identificacionCuenta));
        return toDTO(cuentaBancaria);
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<CuentaBancariaQueryDTO> getCuentasBancariasByTipo(String tipo) {
        log.info("Obteniendo cuentas bancarias por tipo: {}", tipo);
        return cuentaBancariaReadModelRepository.findByTipo(tipo).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<CuentaBancariaQueryDTO> getCuentasBancariasByParticipante(String identificacionParticipante) {
        log.info("Obteniendo cuentas bancarias por participante: {}", identificacionParticipante);
        return cuentaBancariaReadModelRepository.findByIdentificacionParticipante(identificacionParticipante).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<CuentaBancariaQueryDTO> getCuentasBancariasByActivo(Boolean activo) {
        log.info("Obteniendo cuentas bancarias por estado activo: {}", activo);
        return cuentaBancariaReadModelRepository.findByActivo(activo).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(transactionManager = "eventStoreTransactionManager", readOnly = true)
    public List<EventHistoryDTO> getEventHistory(Long id) {
        log.info("Obteniendo historial de eventos para cuenta bancaria: {}", id);
        String aggregateId = "CUENTA_BANCARIA-" + id;

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

    private CuentaBancariaQueryDTO toDTO(CuentaBancariaReadModel model) {
        return CuentaBancariaQueryDTO.builder()
                .id(model.getId())
                .identificacionParticipante(model.getIdentificacionParticipante())
                .nombresParticipante(model.getNombresParticipante())
                .apellidosParticipante(model.getApellidosParticipante())
                .numeroCuenta(model.getNumeroCuenta())
                .identificacionCuenta(model.getIdentificacionCuenta())
                .tipo(model.getTipo())
                .activo(model.getActivo())
                .createdAt(model.getCreatedAt())
                .updatedAt(model.getUpdatedAt())
                .createdBy(model.getCreatedBy())
                .updatedBy(model.getUpdatedBy())
                .build();
    }
}
