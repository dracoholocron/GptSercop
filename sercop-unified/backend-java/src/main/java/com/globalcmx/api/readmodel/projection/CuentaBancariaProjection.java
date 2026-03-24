package com.globalcmx.api.readmodel.projection;

import com.globalcmx.api.dto.event.CuentaBancariaEvent;
import com.globalcmx.api.readmodel.entity.CuentaBancariaReadModel;
import com.globalcmx.api.readmodel.repository.CuentaBancariaReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CuentaBancariaProjection {

    private final CuentaBancariaReadModelRepository cuentaBancariaReadModelRepository;

    @KafkaListener(topics = "cuenta-bancaria-events", groupId = "cuenta-bancaria-projection-group")
    @Transactional(transactionManager = "readModelTransactionManager")
    public void handleCuentaBancariaEvent(CuentaBancariaEvent event) {
        log.info("Procesando evento de cuenta bancaria: {} para ID: {}", event.getEventType(), event.getCuentaBancariaId());

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
            log.error("Error procesando evento de cuenta bancaria: {}", e.getMessage(), e);
            throw e;
        }
    }

    private void handleCreated(CuentaBancariaEvent event) {
        CuentaBancariaReadModel cuentaBancaria = CuentaBancariaReadModel.builder()
                .id(event.getCuentaBancariaId())
                .identificacionParticipante(event.getIdentificacionParticipante())
                .nombresParticipante(event.getNombresParticipante())
                .apellidosParticipante(event.getApellidosParticipante())
                .numeroCuenta(event.getNumeroCuenta())
                .identificacionCuenta(event.getIdentificacionCuenta())
                .tipo(event.getTipo())
                .activo(event.getActivo())
                .createdBy(event.getPerformedBy())
                .build();

        cuentaBancariaReadModelRepository.save(cuentaBancaria);
        log.info("Cuenta bancaria creada en read model: {}", event.getCuentaBancariaId());
    }

    private void handleUpdated(CuentaBancariaEvent event) {
        CuentaBancariaReadModel cuentaBancaria = cuentaBancariaReadModelRepository.findById(event.getCuentaBancariaId())
                .orElseThrow(() -> new RuntimeException("Cuenta bancaria no encontrada: " + event.getCuentaBancariaId()));

        cuentaBancaria.setIdentificacionParticipante(event.getIdentificacionParticipante());
        cuentaBancaria.setNombresParticipante(event.getNombresParticipante());
        cuentaBancaria.setApellidosParticipante(event.getApellidosParticipante());
        cuentaBancaria.setNumeroCuenta(event.getNumeroCuenta());
        cuentaBancaria.setIdentificacionCuenta(event.getIdentificacionCuenta());
        cuentaBancaria.setTipo(event.getTipo());
        cuentaBancaria.setActivo(event.getActivo());
        cuentaBancaria.setUpdatedBy(event.getPerformedBy());

        cuentaBancariaReadModelRepository.save(cuentaBancaria);
        log.info("Cuenta bancaria actualizada en read model: {}", event.getCuentaBancariaId());
    }

    private void handleDeleted(CuentaBancariaEvent event) {
        cuentaBancariaReadModelRepository.deleteById(event.getCuentaBancariaId());
        log.info("Cuenta bancaria eliminada del read model: {}", event.getCuentaBancariaId());
    }
}
