package com.globalcmx.api.pubsub.listener;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.event.MonedaEvent;
import com.globalcmx.api.readmodel.entity.MonedaReadModel;
import com.globalcmx.api.readmodel.repository.MonedaReadModelRepository;
import com.google.cloud.spring.pubsub.support.BasicAcknowledgeablePubsubMessage;
import com.google.cloud.spring.pubsub.support.GcpPubSubHeaders;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Projection de eventos de Moneda desde Google Cloud Pub/Sub.
 * Recibe eventos publicados y actualiza el Read Model en MySQL.
 * Solo se activa en el perfil GCP.
 */
@Profile("gcp")
@Service
@RequiredArgsConstructor
@Slf4j
public class MonedaPubSubProjection {

    private final MonedaReadModelRepository readModelRepository;
    private final ObjectMapper objectMapper;

    /**
     * Maneja eventos de moneda recibidos desde Pub/Sub.
     * El @ServiceActivator se conecta al canal de entrada configurado en application-gcp.yml
     *
     * @param payload El mensaje JSON del evento
     * @param message El mensaje original de Pub/Sub para ACK/NACK
     */
    @ServiceActivator(inputChannel = "monedaEventsInputChannel")
    @Transactional(transactionManager = "readModelTransactionManager")
    public void handleMonedaEvent(String payload,
                                   @Header(GcpPubSubHeaders.ORIGINAL_MESSAGE) BasicAcknowledgeablePubsubMessage message) {
        try {
            log.info("Received Moneda Event from Pub/Sub: {}", payload);

            // Deserializar el evento
            MonedaEvent event = objectMapper.readValue(payload, MonedaEvent.class);

            log.info("Processing Pub/Sub event: {} for moneda ID: {}",
                event.getEventType(), event.getMonedaId());

            // Procesar según el tipo de evento
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

            // Acknowledge el mensaje después de procesarlo exitosamente
            message.ack();
            log.info("Event processed and acknowledged successfully: {}",
                event.getEventType());

        } catch (Exception e) {
            log.error("Error processing Pub/Sub event: {}", payload, e);
            // NACK el mensaje para que se reintente
            message.nack();
            throw new RuntimeException("Failed to process Pub/Sub event", e);
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
        log.info("Created read model for moneda from Pub/Sub: {}", event.getCodigo());
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
                    log.info("Updated read model for moneda from Pub/Sub: {}", event.getCodigo());
                },
                () -> {
                    log.warn("Read model not found for moneda ID: {}, creating new one",
                        event.getMonedaId());
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
                    log.info("Soft deleted read model for moneda ID from Pub/Sub: {}",
                        event.getMonedaId());
                },
                () -> log.warn("Read model not found for moneda ID: {}",
                    event.getMonedaId())
        );
    }
}
