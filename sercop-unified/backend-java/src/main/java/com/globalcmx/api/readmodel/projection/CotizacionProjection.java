package com.globalcmx.api.readmodel.projection;

import com.globalcmx.api.dto.event.CotizacionEvent;
import com.globalcmx.api.readmodel.entity.CotizacionReadModel;
import com.globalcmx.api.readmodel.repository.CotizacionReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class CotizacionProjection {

    private final CotizacionReadModelRepository readModelRepository;

    @KafkaListener(topics = "cotizacion-events", groupId = "cotizacion-projection-group")
    @Transactional(transactionManager = "readModelTransactionManager")
    public void handleCotizacionEvent(CotizacionEvent event) {
        log.info("Processing event: {} for cotizacion ID: {}", event.getEventType(), event.getCotizacionId());

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
                    log.warn("Unknown event type: {}", event.getEventType());
            }
        } catch (Exception e) {
            log.error("Error processing event: {}", event, e);
            throw new RuntimeException("Failed to process event", e);
        }
    }

    private void handleCreated(CotizacionEvent event) {
        CotizacionReadModel readModel = CotizacionReadModel.builder()
                .id(event.getCotizacionId())
                .codigoMoneda(event.getCodigoMoneda())
                .fecha(event.getFecha())
                .valorCompra(event.getValorCompra())
                .valorVenta(event.getValorVenta())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .createdBy(event.getPerformedBy())
                .version(1L)
                .build();

        readModelRepository.save(readModel);
        log.info("Created read model for cotizacion: {} on {}", event.getCodigoMoneda(), event.getFecha());
    }

    private void handleUpdated(CotizacionEvent event) {
        readModelRepository.findById(event.getCotizacionId()).ifPresentOrElse(
                readModel -> {
                    readModel.setCodigoMoneda(event.getCodigoMoneda());
                    readModel.setFecha(event.getFecha());
                    readModel.setValorCompra(event.getValorCompra());
                    readModel.setValorVenta(event.getValorVenta());
                    readModel.setUpdatedAt(LocalDateTime.now());
                    readModel.setUpdatedBy(event.getPerformedBy());
                    readModel.setVersion(readModel.getVersion() + 1);

                    readModelRepository.save(readModel);
                    log.info("Updated read model for cotizacion: {} on {}", event.getCodigoMoneda(), event.getFecha());
                },
                () -> {
                    log.warn("Read model not found for cotizacion ID: {}, creating new one", event.getCotizacionId());
                    handleCreated(event);
                }
        );
    }

    private void handleDeleted(CotizacionEvent event) {
        readModelRepository.findById(event.getCotizacionId()).ifPresentOrElse(
                readModel -> {
                    readModelRepository.delete(readModel);
                    log.info("Deleted read model for cotizacion ID: {}", event.getCotizacionId());
                },
                () -> log.warn("Read model not found for cotizacion ID: {}", event.getCotizacionId())
        );
    }
}
