package com.globalcmx.api.readmodel.projection;

import com.globalcmx.api.dto.event.MonedaEvent;
import com.globalcmx.api.readmodel.entity.MonedaReadModel;
import com.globalcmx.api.readmodel.repository.MonedaReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class MonedaProjection {

    private final MonedaReadModelRepository readModelRepository;

    @KafkaListener(topics = "moneda-events", groupId = "moneda-projection-group")
    @Transactional(transactionManager = "readModelTransactionManager")
    public void handleMonedaEvent(MonedaEvent event) {
        log.info("Processing event: {} for moneda ID: {}", event.getEventType(), event.getMonedaId());

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

    private void handleCreated(MonedaEvent event) {
        MonedaReadModel readModel = MonedaReadModel.builder()
                .id(event.getMonedaId())
                .codigo(event.getCodigo())
                .nombre(event.getNombre())
                .simbolo(event.getSimbolo())
                .activo(event.getActivo())
                .createdAt(event.getTimestamp())
                .updatedAt(event.getTimestamp())
                .createdBy(event.getPerformedBy())
                .version(1L)
                .build();

        readModelRepository.save(readModel);
        log.info("Created read model for moneda: {}", event.getCodigo());
    }

    private void handleUpdated(MonedaEvent event) {
        readModelRepository.findById(event.getMonedaId()).ifPresentOrElse(
                readModel -> {
                    readModel.setCodigo(event.getCodigo());
                    readModel.setNombre(event.getNombre());
                    readModel.setSimbolo(event.getSimbolo());
                    readModel.setActivo(event.getActivo());
                    readModel.setUpdatedAt(LocalDateTime.now());
                    readModel.setUpdatedBy(event.getPerformedBy());
                    readModel.setVersion(readModel.getVersion() + 1);

                    readModelRepository.save(readModel);
                    log.info("Updated read model for moneda: {}", event.getCodigo());
                },
                () -> {
                    log.warn("Read model not found for moneda ID: {}, creating new one", event.getMonedaId());
                    handleCreated(event);
                }
        );
    }

    private void handleDeleted(MonedaEvent event) {
        readModelRepository.findById(event.getMonedaId()).ifPresentOrElse(
                readModel -> {
                    readModel.setActivo(false);
                    readModel.setUpdatedAt(LocalDateTime.now());
                    readModel.setUpdatedBy(event.getPerformedBy());
                    readModel.setVersion(readModel.getVersion() + 1);

                    readModelRepository.save(readModel);
                    log.info("Soft deleted read model for moneda ID: {}", event.getMonedaId());
                },
                () -> log.warn("Read model not found for moneda ID: {}", event.getMonedaId())
        );
    }
}
