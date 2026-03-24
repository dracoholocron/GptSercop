package com.globalcmx.api.kafka.producer;

import com.globalcmx.api.dto.event.LineaCreditoEvent;
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
public class LineaCreditoEventProducer {
    private final KafkaTemplate<String, LineaCreditoEvent> kafkaTemplate;
    @Value("${messaging.topics.linea-credito-events:linea-credito-events}")
    private String lineaCreditoEventsTopic;
    public void sendLineaCreditoEvent(LineaCreditoEvent event) {
        log.info("Sending LineaCredito Event: {} to topic: {}", event, lineaCreditoEventsTopic);
        CompletableFuture<SendResult<String, LineaCreditoEvent>> future =
            kafkaTemplate.send(lineaCreditoEventsTopic, event.getEventId(), event);
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
