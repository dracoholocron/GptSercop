package com.globalcmx.api.kafka.producer;

import com.globalcmx.api.dto.event.PlantillaEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;
import java.util.concurrent.CompletableFuture;
@Profile("!gcp & !azure")
@Service
@RequiredArgsConstructor
@Slf4j
public class PlantillaEventProducer {
    private final KafkaTemplate<String, PlantillaEvent> kafkaTemplate;
    @Value("${messaging.topics.plantilla-events:plantilla-events}")
    private String plantillaEventsTopic;
    public void sendPlantillaEvent(PlantillaEvent event) {
        log.info("Sending Plantilla Event: {} to topic: {}", event, plantillaEventsTopic);
        CompletableFuture<SendResult<String, PlantillaEvent>> future =
            kafkaTemplate.send(plantillaEventsTopic, String.valueOf(event.getPlantillaId()), event);
        future.whenComplete((result, ex) -> {
            if (ex == null) {
                log.info("Event sent successfully: {} with offset: {}",
                    event.getEventType(),
                    result.getRecordMetadata().offset());
            } else {
                log.error("Failed to send event: {}", event.getEventType(), ex);
            }
        });
    }
}
