package com.globalcmx.api.readmodel.projection;

import com.globalcmx.api.dto.event.LineaCreditoEvent;
import com.globalcmx.api.readmodel.entity.LineaCreditoReadModel;
import com.globalcmx.api.readmodel.repository.LineaCreditoReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class LineaCreditoProjection {

    private final LineaCreditoReadModelRepository readModelRepository;

    @KafkaListener(topics = "linea-credito-events", groupId = "linea-credito-projection-group")
    @Transactional(transactionManager = "readModelTransactionManager")
    public void handleLineaCreditoEvent(LineaCreditoEvent event) {
        log.info("Processing event: {} for linea credito ID: {}", event.getEventType(), event.getLineaCreditoId());

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

    private void handleCreated(LineaCreditoEvent event) {
        LineaCreditoReadModel readModel = LineaCreditoReadModel.builder()
                .id(event.getLineaCreditoId())
                .clienteId(event.getClienteId())
                .tipo(event.getTipo())
                .moneda(event.getMoneda())
                .montoAutorizado(event.getMontoAutorizado())
                .montoUtilizado(event.getMontoUtilizado())
                .montoDisponible(event.getMontoDisponible())
                .fechaAutorizacion(event.getFechaAutorizacion())
                .fechaVencimiento(event.getFechaVencimiento())
                .tasaReferencia(event.getTasaReferencia())
                .spread(event.getSpread())
                .estado(event.getEstado())
                .createdAt(event.getTimestamp())
                .updatedAt(event.getTimestamp())
                .aggregateId("LINEA_CREDITO-" + event.getLineaCreditoId())
                .version(1L)
                .build();

        readModelRepository.save(readModel);
        log.info("Created read model for linea credito: {}", event.getLineaCreditoId());
    }

    private void handleUpdated(LineaCreditoEvent event) {
        readModelRepository.findById(event.getLineaCreditoId()).ifPresentOrElse(
                readModel -> {
                    readModel.setClienteId(event.getClienteId());
                    readModel.setTipo(event.getTipo());
                    readModel.setMoneda(event.getMoneda());
                    readModel.setMontoAutorizado(event.getMontoAutorizado());
                    readModel.setMontoUtilizado(event.getMontoUtilizado());
                    readModel.setMontoDisponible(event.getMontoDisponible());
                    readModel.setFechaAutorizacion(event.getFechaAutorizacion());
                    readModel.setFechaVencimiento(event.getFechaVencimiento());
                    readModel.setTasaReferencia(event.getTasaReferencia());
                    readModel.setSpread(event.getSpread());
                    readModel.setEstado(event.getEstado());
                    readModel.setUpdatedAt(LocalDateTime.now());
                    readModel.setVersion(readModel.getVersion() + 1);

                    readModelRepository.save(readModel);
                    log.info("Updated read model for linea credito: {}", event.getLineaCreditoId());
                },
                () -> {
                    log.warn("Read model not found for linea credito ID: {}, creating new one",
                        event.getLineaCreditoId());
                    handleCreated(event);
                }
        );
    }

    private void handleDeleted(LineaCreditoEvent event) {
        readModelRepository.findById(event.getLineaCreditoId()).ifPresentOrElse(
                readModel -> {
                    readModel.setEstado("ELIMINADA");
                    readModel.setUpdatedAt(LocalDateTime.now());
                    readModel.setVersion(readModel.getVersion() + 1);

                    readModelRepository.save(readModel);
                    log.info("Soft deleted read model for linea credito ID: {}", event.getLineaCreditoId());
                },
                () -> log.warn("Read model not found for linea credito ID: {}", event.getLineaCreditoId())
        );
    }
}
